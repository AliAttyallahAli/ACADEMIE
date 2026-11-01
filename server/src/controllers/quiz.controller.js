import { quizService } from '../services/quiz.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const quizController = {
  /**
   * GET /api/quizzes/session/:sessionId
   * Récupère le quiz (sans les bonnes réponses).
   */
  getBySession: asyncHandler(async (req, res) => {
    const sessionId = Number(req.params.sessionId);
    const quiz = await quizService.getQuizForLearner(sessionId);
    res.json(quiz);
  }),

  /**
   * POST /api/quizzes/:quizId/submit
   * Body : { answers: [{ question_id, selected_option_ids: [] }] }
   */
  submit: asyncHandler(async (req, res) => {
    const quizId = Number(req.params.quizId);
    const { answers } = req.body;
    const io = req.app.get('io');

    const result = await quizService.submit(req.user.id, quizId, answers, io);
    res.json(result);
  }),

  /**
   * GET /api/quizzes/:quizId/attempts
   */
  getAttempts: asyncHandler(async (req, res) => {
    const quizId = Number(req.params.quizId);
    const items = await quizService.getAttempts(req.user.id, quizId);
    res.json({ items });
  }),
};