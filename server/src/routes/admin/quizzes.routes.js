import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { dbAsync } from '../../config/database.js';

const router = Router();

/**
 * GET /api/admin/quizzes/session/:sessionId
 * Récupère le quiz d'une séance avec questions + options.
 */
router.get('/session/:sessionId', asyncHandler(async (req, res) => {
  const session = await dbAsync.get(
    `SELECT s.*, m.title AS module_title
     FROM sessions s JOIN modules m ON m.id = s.module_id
     WHERE s.id = ?`,
    [req.params.sessionId]
  );
  if (!session) return res.status(404).json({ error: 'Séance introuvable' });

  const quiz = await dbAsync.get(
    'SELECT * FROM quizzes WHERE session_id = ?',
    [req.params.sessionId]
  );

  if (!quiz) {
    return res.json({ session, quiz: null, questions: [] });
  }

  const questions = await dbAsync.all(
    'SELECT * FROM questions WHERE quiz_id = ? ORDER BY id',
    [quiz.id]
  );

  for (const q of questions) {
    q.options = await dbAsync.all(
      'SELECT * FROM options WHERE question_id = ? ORDER BY id',
      [q.id]
    );
  }

  res.json({ session, quiz, questions });
}));

/**
 * PUT /api/admin/quizzes/session/:sessionId
 * Crée ou remplace le quiz d'une séance.
 * Body : { pass_threshold, max_attempts, questions: [...] }
 */
router.put('/session/:sessionId', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { pass_threshold = 60, max_attempts = 3, questions = [] } = req.body;

  const session = await dbAsync.get('SELECT id FROM sessions WHERE id = ?', [sessionId]);
  if (!session) return res.status(404).json({ error: 'Séance introuvable' });

  // Créer ou mettre à jour le quiz
  let quiz = await dbAsync.get('SELECT * FROM quizzes WHERE session_id = ?', [sessionId]);

  if (quiz) {
    await dbAsync.run(
      'UPDATE quizzes SET pass_threshold = ?, max_attempts = ? WHERE id = ?',
      [pass_threshold, max_attempts, quiz.id]
    );
    // Supprimer les anciennes questions
    await dbAsync.run('DELETE FROM questions WHERE quiz_id = ?', [quiz.id]);
  } else {
    const result = await dbAsync.run(
      'INSERT INTO quizzes (session_id, pass_threshold, max_attempts) VALUES (?, ?, ?)',
      [sessionId, pass_threshold, max_attempts]
    );
    quiz = { id: result.lastInsertRowid };
  }

  // Insérer les nouvelles questions
  for (const q of questions) {
    const qResult = await dbAsync.run(
      'INSERT INTO questions (quiz_id, question_text, question_type, points) VALUES (?, ?, ?, ?)',
      [quiz.id, q.question_text, q.question_type, q.points ?? 1]
    );

    for (const opt of q.options || []) {
      await dbAsync.run(
        'INSERT INTO options (question_id, option_text, is_correct) VALUES (?, ?, ?)',
        [qResult.lastInsertRowid, opt.option_text, opt.is_correct ? 1 : 0]
      );
    }
  }

  // Retourner le quiz complet
  const finalQuiz = await dbAsync.get('SELECT * FROM quizzes WHERE id = ?', [quiz.id]);
  const finalQuestions = await dbAsync.all(
    'SELECT * FROM questions WHERE quiz_id = ? ORDER BY id',
    [quiz.id]
  );
  for (const q of finalQuestions) {
    q.options = await dbAsync.all(
      'SELECT * FROM options WHERE question_id = ? ORDER BY id',
      [q.id]
    );
  }

  res.json({ success: true, quiz: finalQuiz, questions: finalQuestions });
}));

/**
 * DELETE /api/admin/quizzes/session/:sessionId
 */
router.delete('/session/:sessionId', asyncHandler(async (req, res) => {
  const quiz = await dbAsync.get(
    'SELECT id FROM quizzes WHERE session_id = ?',
    [req.params.sessionId]
  );
  if (!quiz) return res.status(404).json({ error: 'Aucun quiz' });

  await dbAsync.run('DELETE FROM quizzes WHERE id = ?', [quiz.id]);
  res.json({ success: true, deleted: true });
}));

/**
 * GET /api/admin/quizzes/:quizId/attempts
 * Liste les tentatives d'un quiz (qui a passé, quand, score).
 */
router.get('/:quizId/attempts', asyncHandler(async (req, res) => {
  const quiz = await dbAsync.get('SELECT * FROM quizzes WHERE id = ?', [req.params.quizId]);
  if (!quiz) return res.status(404).json({ error: 'Quiz introuvable' });

  const attempts = await dbAsync.all(
    `SELECT qa.*, l.full_name AS learner_name, l.email AS learner_email
     FROM quiz_attempts qa
     JOIN learners l ON l.id = qa.learner_id
     WHERE qa.quiz_id = ?
     ORDER BY qa.attempted_at DESC`,
    [req.params.quizId]
  );

  const stats = {
    total_attempts: attempts.length,
    total_unique_learners: new Set(attempts.map((a) => a.learner_id)).size,
    avg_score: attempts.length
      ? Math.round(attempts.reduce((s, a) => s + a.score_percent, 0) / attempts.length)
      : 0,
    pass_rate: attempts.length
      ? Math.round((attempts.filter((a) => a.passed).length / attempts.length) * 100)
      : 0,
  };

  res.json({ quiz, attempts, stats });
}));

export default router;
