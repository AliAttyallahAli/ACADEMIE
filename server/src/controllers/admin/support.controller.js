import { supportService } from '../../services/support.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const supportAdminController = {
  listAll: asyncHandler(async (req, res) => {
    const items = await supportService.listAllTickets({ status: req.query.status });
    res.json({ items });
  }),

  reply: asyncHandler(async (req, res) => {
    const io = req.app.get('io');
    const ticket = await supportService.replyToTicket(
      Number(req.params.id),
      req.body,
      req.user,
      io
    );
    res.json({ success: true, ticket });
  }),

  close: asyncHandler(async (req, res) => {
    const result = await supportService.closeTicket(
      Number(req.params.id),
      req.user
    );
    res.json(result);
  }),
};