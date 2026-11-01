import { quizRepo } from '../repositories/quiz.repo.js';
import { questionRepo } from '../repositories/question.repo.js';
import { quizAttemptRepo } from '../repositories/quizAttempt.repo.js';
import { sessionRepo } from '../repositories/session.repo.js';
import { progressRepo } from '../repositories/progress.repo.js';
import { progressService } from './progress.service.js';
import { notificationService } from './notification.service.js';
import { calculateScore } from '../utils/scoreCalculator.js';
import { NOTIFICATION_TYPES } from '../config/constants.js';
import { dbAsync } from '../config/database.js';

export const quizService = {
  /**
   * Récupère le quiz d'une séance (sans révéler les bonnes réponses).
   */
  async getQuizForLearner(session_id) {
    const quiz = await quizRepo.findBySession(session_id);
    if (!quiz) {
      const err = new Error('Aucun quiz pour cette séance');
      err.status = 404;
      throw err;
    }

    const questions = await questionRepo.findByQuiz(quiz.id);
    // Masquer is_correct
    const sanitized = questions.map((q) => ({
      id: q.id,
      question_text: q.question_text,
      question_type: q.question_type,
      points: q.points,
      options: q.options.map((o) => ({
        id: o.id,
        option_text: o.option_text,
      })),
    }));

    return {
      id: quiz.id,
      session_id: quiz.session_id,
      pass_threshold: quiz.pass_threshold,
      max_attempts: quiz.max_attempts,
      questions: sanitized,
    };
  },

  /**
   * Soumission d'un quiz par une apprenante.
   * Body : { answers: [{ question_id, selected_option_ids: [1,2] }] }
   */
  async submit(learner_id, quiz_id, answers, io) {
    const quiz = await quizRepo.findById(quiz_id);
    if (!quiz) {
      const err = new Error('Quiz introuvable');
      err.status = 404;
      throw err;
    }

    // 1. Vérifier tentative max
    const attemptsCount = await quizAttemptRepo.countByLearnerQuiz(learner_id, quiz_id);
    if (attemptsCount >= quiz.max_attempts) {
      const err = new Error(
        `Nombre maximum de tentatives atteint (${quiz.max_attempts})`
      );
      err.status = 403;
      throw err;
    }

    // 2. Récupérer les questions + bonnes réponses
    const questions = await dbAsync.all(
      `SELECT id, points, question_type FROM questions WHERE quiz_id = ?`,
      [quiz_id]
    );
    if (!questions.length) {
      const err = new Error('Quiz vide : aucune question');
      err.status = 400;
      throw err;
    }

    const correctByQuestion = new Map();
    for (const q of questions) {
      const correct = await dbAsync.all(
        `SELECT id FROM options WHERE question_id = ? AND is_correct = 1`,
        [q.id]
      );
      correctByQuestion.set(q.id, correct.map((o) => o.id));
    }

    // 3. Calculer score
    const { scorePercent, earned, total } = calculateScore(
      questions.map((q) => ({ id: q.id, points: q.points, type: q.question_type })),
      answers,
      correctByQuestion
    );

    const passed = scorePercent >= quiz.pass_threshold;

    // 4. Enregistrer la tentative
    await quizAttemptRepo.create({
      learner_id,
      quiz_id,
      score_percent: scorePercent,
      passed,
      answers_json: JSON.stringify(answers),
    });

    // 5. Si réussi → marquer la séance complétée + débloquer la suivante
    let unlockResult = null;
    let notif;

    if (passed) {
      const session = await sessionRepo.findById(quiz.session_id);
      await progressRepo.markCompleted(learner_id, session.id);

      // Notification quiz_passed (avant déblocage)
      const nextSession = await dbAsync.get(
        `SELECT id FROM sessions
         WHERE module_id = ? AND session_number = ?
         LIMIT 1`,
        [session.module_id, session.session_number + 1]
      );

      notif = await notificationService.create(learner_id, {
        type: NOTIFICATION_TYPES.QUIZ_PASSED,
        score: scorePercent,
        next_session_id: nextSession?.id ?? null,
        quiz_id,
      });
      notificationService.emit(io, learner_id, notif);

      // Débloquer la suivante (ou marquer module terminé)
      unlockResult = await progressService.unlockNextSession(
        learner_id,
        session.id,
        io
      );
    } else {
      const attemptsLeft = quiz.max_attempts - attemptsCount - 1;
      notif = await notificationService.create(learner_id, {
        type: NOTIFICATION_TYPES.QUIZ_FAILED,
        score: scorePercent,
        attempts_left: attemptsLeft,
        quiz_id,
      });
      notificationService.emit(io, learner_id, notif);
    }

    return {
      passed,
      score_percent: Number(scorePercent.toFixed(2)),
      earned_points: earned,
      total_points: total,
      threshold: quiz.pass_threshold,
      attempts_left: quiz.max_attempts - attemptsCount - 1,
      unlock: unlockResult,
    };
  },

  /**
   * Récupère les tentatives d'une apprenante sur un quiz.
   */
  async getAttempts(learner_id, quiz_id) {
    return quizAttemptRepo.findByLearnerQuiz(learner_id, quiz_id);
  },
};