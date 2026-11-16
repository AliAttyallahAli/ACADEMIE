import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { dbAsync } from '../config/database.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';

const router = Router();
router.use(authenticateJWT);

/**
 * GET /api/quizzes/session/:sessionId
 * Récupère le quiz d'une séance (sans les bonnes réponses).
 */
router.get('/session/:sessionId', asyncHandler(async (req, res) => {
  const quiz = await dbAsync.get(
    'SELECT id, session_id, pass_threshold, max_attempts FROM quizzes WHERE session_id = ?',
    [req.params.sessionId]
  );
  if (!quiz) return res.status(404).json({ error: 'Aucun quiz pour cette séance' });

  const questions = await dbAsync.all(
    'SELECT id, question_text, question_type, points FROM questions WHERE quiz_id = ? ORDER BY id',
    [quiz.id]
  );

  for (const q of questions) {
    q.options = await dbAsync.all(
      'SELECT id, option_text FROM options WHERE question_id = ? ORDER BY id',
      [q.id]
    );
  }

  quiz.questions = questions;
  res.json(quiz);
}));

/**
 * POST /api/quizzes/:quizId/submit
 * Soumet les réponses.
 */
router.post('/:quizId/submit', asyncHandler(async (req, res) => {
  const learner_id = req.user.id;
  const quiz_id = Number(req.params.quizId);
  const { answers = [] } = req.body;

  const quiz = await dbAsync.get('SELECT * FROM quizzes WHERE id = ?', [quiz_id]);
  if (!quiz) return res.status(404).json({ error: 'Quiz introuvable' });

  // Compter les tentatives
  const attemptsCount = (await dbAsync.get(
    'SELECT COUNT(*) AS c FROM quiz_attempts WHERE learner_id = ? AND quiz_id = ?',
    [learner_id, quiz_id]
  )).c;

  if (attemptsCount >= quiz.max_attempts) {
    return res.status(403).json({ error: `Nombre maximum de tentatives atteint (${quiz.max_attempts})` });
  }

  // Charger les questions + bonnes réponses
  const questions = await dbAsync.all(
    'SELECT id, points, question_type FROM questions WHERE quiz_id = ?',
    [quiz_id]
  );

  let totalPoints = 0;
  let earnedPoints = 0;

  for (const q of questions) {
    totalPoints += q.points;
    const correct = await dbAsync.all(
      'SELECT id FROM options WHERE question_id = ? AND is_correct = 1',
      [q.id]
    );
    const correctIds = correct.map((o) => o.id);
    const answer = answers.find((a) => a.question_id === q.id);
    const selected = answer?.selected_option_ids || [];

    if (q.question_type === 'single') {
      if (selected.length === 1 && correctIds.includes(selected[0])) {
        earnedPoints += q.points;
      }
    } else {
      const allCorrect = correctIds.every((id) => selected.includes(id));
      const noWrong = selected.every((id) => correctIds.includes(id));
      if (allCorrect && noWrong) earnedPoints += q.points;
    }
  }

  const scorePercent = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
  const passed = scorePercent >= quiz.pass_threshold;

  // Enregistrer la tentative
  await dbAsync.run(
    `INSERT INTO quiz_attempts (learner_id, quiz_id, score_percent, passed, answers_json)
     VALUES (?, ?, ?, ?, ?)`,
    [learner_id, quiz_id, scorePercent, passed ? 1 : 0, JSON.stringify(answers)]
  );

  // Cascade si réussi
  let unlock = null;
  if (passed) {
    const session = await dbAsync.get('SELECT * FROM sessions WHERE id = ?', [quiz.session_id]);
    await dbAsync.run(
      `UPDATE session_progress SET is_completed = 1, completed_at = datetime('now')
       WHERE learner_id = ? AND session_id = ?`,
      [learner_id, session.id]
    );

    const nextSession = await dbAsync.get(
      'SELECT id FROM sessions WHERE module_id = ? AND session_number = ?',
      [session.module_id, session.session_number + 1]
    );

    if (nextSession) {
      await dbAsync.run(
        `UPDATE session_progress SET is_unlocked = 1, unlocked_at = datetime('now')
         WHERE learner_id = ? AND session_id = ?`,
        [learner_id, nextSession.id]
      );
      unlock = { unlocked: true, next_session_id: nextSession.id };
    } else {
      await dbAsync.run(
        `UPDATE enrollments SET status = 'completed', completed_at = datetime('now')
         WHERE learner_id = ? AND module_id = ?`,
        [learner_id, session.module_id]
      );
      unlock = { unlocked: false, module_completed: true };
    }
  }

  res.json({
    passed,
    score_percent: Number(scorePercent.toFixed(2)),
    earned_points: earnedPoints,
    total_points: totalPoints,
    threshold: quiz.pass_threshold,
    attempts_left: quiz.max_attempts - attemptsCount - 1,
    unlock,
  });
}));

/**
 * GET /api/quizzes/:quizId/attempts
 */
router.get('/:quizId/attempts', asyncHandler(async (req, res) => {
  const items = await dbAsync.all(
    `SELECT * FROM quiz_attempts WHERE learner_id = ? AND quiz_id = ?
     ORDER BY attempted_at DESC`,
    [req.user.id, req.params.quizId]
  );
  res.json({ items });
}));

export default router;
