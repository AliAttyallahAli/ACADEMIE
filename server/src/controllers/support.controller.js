import { supportService } from '../services/support.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const supportController = {
  createTicket: asyncHandler(async (req, res) => {
    const ticket = await supportService.createTicket({
      ...req.body,
      learner_id: req.user.id,
    });
    res.status(201).json({ success: true, ticket });
  }),

  listMyTickets: asyncHandler(async (req, res) => {
    const items = await supportService.listMyTickets(req.user.id);
    res.json({ items });
  }),

  getTicket: asyncHandler(async (req, res) => {
    const ticket = await supportService.getTicketDetail(
      Number(req.params.id),
      req.user.id
    );
    res.json(ticket);
  }),
};