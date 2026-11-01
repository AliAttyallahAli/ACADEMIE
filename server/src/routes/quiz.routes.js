import { Router } from 'express';
import { quizController } from '../controllers/quiz.controller.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';
import { checkSessionAccess } from '../middleware/checkSessionAccess.js';
import {
  sessionIdQuizParamValidator,
  quizIdParamValidator,
  submitQuizValidator,
} from '../validators/quizSubmission.validator.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();
router.use(authenticateJWT);

// Quiz d'une séance : passer par checkSessionAccess via sessionId
// ⚠️ Pour que checkSessionAccess trouve `sessionId`, on adapte le middleware
router.get(
  '/session/:sessionId',
  sessionIdQuizParamValidator,
  validateRequest,
  async (req, res, next) => {
    req.params.id = req.params.sessionId;
    return checkSessionAccess(req, res, next);
  },
  quizController.getBySession
);

// Soumission : on doit vérifier l'accès à la séance du quiz
router.post(
  '/:quizId/submit',
  submitQuizValidator,
  validateRequest,
  // Injecter session_id depuis le quiz
  async (req, res, next) => {
    const { dbAsync } = await import('../config/database.js');
    const quiz = await dbAsync.get(
      `SELECT session_id FROM quizzes WHERE id = ?`,
      [Number(req.params.quizId)]
    );
    if (!quiz) return res.status(404).json({ error: 'Quiz introuvable' });
    req.params.id = quiz.session_id;
    return checkSessionAccess(req, res, next);
  },
  quizController.submit
);

router.get(
  '/:quizId/attempts',
  quizIdParamValidator,
  validateRequest,
  quizController.getAttempts
);

export default router;