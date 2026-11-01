import { forumService } from '../services/forum.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const forumController = {
  createPost: asyncHandler(async (req, res) => {
    const io = req.app.get('io');
    const post = await forumService.createPost(
      { ...req.body, learner_id: req.user.id },
      io
    );
    res.status(201).json({ success: true, post });
  }),

  listModuleThreads: asyncHandler(async (req, res) => {
    const result = await forumService.listModuleThreads(
      Number(req.params.moduleId),
      req.user.id
    );
    res.json(result);
  }),

  getThread: asyncHandler(async (req, res) => {
    const result = await forumService.getThreadDetail(
      Number(req.params.id),
      req.user.id
    );
    res.json(result);
  }),

  deletePost: asyncHandler(async (req, res) => {
    const result = await forumService.deletePost(
      Number(req.params.id),
      { type: 'learner', id: req.user.id, name: req.user.full_name }
    );
    res.json(result);
  }),
};