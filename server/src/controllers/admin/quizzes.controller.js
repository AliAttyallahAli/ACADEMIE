import { quizAdminService } from '../../services/quiz.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const quizzesAdminController = {
  upsert: asyncHandler(async (req, res) => {
    const quiz = await quizAdminService.upsertQuiz(
      Number(req.params.sessionId),
      req.body,
      req.user
    );
    res.json({ success: true, quiz });
  }),

  getBySession: asyncHandler(async (req, res) => {
    const quiz = await quizAdminService.getBySession(Number(req.params.sessionId));
    if (!quiz) return res.status(404).json({ error: 'Aucun quiz pour cette séance' });
    res.json(quiz);
  }),

  remove: asyncHandler(async (req, res) => {
    const result = await quizAdminService.remove(Number(req.params.sessionId), req.user);
    res.json({ success: true, ...result });
  }),
};