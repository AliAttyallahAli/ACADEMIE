import { responsibleService } from '../../services/responsible.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const responsiblesController = {
  create: asyncHandler(async (req, res) => {
    const result = await responsibleService.create(req.body, req.user);
    res.status(201).json({ success: true, ...result });
  }),

  list: asyncHandler(async (req, res) => {
    const { role, is_active, search, page, limit } = req.query;
    const result = await responsibleService.list({
      role,
      is_active: is_active !== undefined ? is_active === 'true' : undefined,
      search,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });
    res.json(result);
  }),

  getById: asyncHandler(async (req, res) => {
    const r = await responsibleService.getById(Number(req.params.id));
    res.json(r);
  }),

  update: asyncHandler(async (req, res) => {
    const r = await responsibleService.update(
      Number(req.params.id),
      req.body,
      req.user
    );
    res.json({ success: true, responsible: r });
  }),

  toggle: asyncHandler(async (req, res) => {
    const result = await responsibleService.toggle(Number(req.params.id), req.user);
    res.json({ success: true, ...result });
  }),

  resetPassword: asyncHandler(async (req, res) => {
    const result = await responsibleService.resetPassword(
      Number(req.params.id),
      req.user
    );
    res.json({ success: true, ...result });
  }),

  remove: asyncHandler(async (req, res) => {
    const result = await responsibleService.remove(Number(req.params.id), req.user);
    res.json({ success: true, ...result });
  }),

  activity: asyncHandler(async (req, res) => {
    const items = await responsibleService.getActivity(Number(req.params.id));
    res.json({ items });
  }),
};