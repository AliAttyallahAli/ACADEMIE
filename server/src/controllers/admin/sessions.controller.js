import { sessionService } from '../../services/session.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const sessionsAdminController = {
  listByModule: asyncHandler(async (req, res) => {
    const result = await sessionService.listByModule(Number(req.params.moduleId));
    res.json(result);
  }),

  getById: asyncHandler(async (req, res) => {
    const s = await sessionService.getById(Number(req.params.id));
    res.json(s);
  }),

  update: asyncHandler(async (req, res) => {
    const s = await sessionService.update(Number(req.params.id), req.body, req.user);
    res.json({ success: true, session: s });
  }),

  remove: asyncHandler(async (req, res) => {
    const result = await sessionService.remove(Number(req.params.id), req.user);
    res.json({ success: true, ...result });
  }),
};