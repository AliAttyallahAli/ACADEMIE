import { dbAsync } from '../config/database.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const sessionController = {
  /**
   * GET /api/sessions/:id
   * Retourne le contenu de la séance (accès contrôlé par checkSessionAccess).
   */
  getById: asyncHandler(async (req, res) => {
    const session = req.session;

    // Récupérer le quiz s'il existe
    const quiz = await dbAsync.get(
      `SELECT id, pass_threshold, max_attempts FROM quizzes WHERE session_id = ?`,
      [session.id]
    );

    // Récupérer les ressources associées
    const resources = await dbAsync.all(
      `SELECT id, title, file_url, file_type
       FROM resources WHERE session_id = ?`,
      [session.id]
    );

    // Compter tentatives pour ce quiz
    let attempts = null;
    if (quiz) {
      const used = await dbAsync.get(
        `SELECT COUNT(*) AS c FROM quiz_attempts WHERE learner_id = ? AND quiz_id = ?`,
        [req.user.id, quiz.id]
      );
      const best = await dbAsync.get(
        `SELECT MAX(score_percent) AS best FROM quiz_attempts
         WHERE learner_id = ? AND quiz_id = ?`,
        [req.user.id, quiz.id]
      );
      attempts = {
        used: used?.c ?? 0,
        remaining: quiz.max_attempts - (used?.c ?? 0),
        best_score: best?.best ?? null,
      };
    }

    res.json({
      session: {
        id: session.id,
        module_id: session.module_id,
        title: session.title,
        content: session.content,
        content_type: session.content_type,
        scheduled_date: session.scheduled_date,
      },
      progress: req.progress,
      quiz,
      attempts,
      resources,
    });
  }),
};