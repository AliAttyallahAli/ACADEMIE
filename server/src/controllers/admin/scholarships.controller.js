import { scholarshipService } from '../../services/scholarship.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const scholarshipsAdminController = {
  create: asyncHandler(async (req, res) => {
    const scholarship = await scholarshipService.create(req.body, req.user);
    res.status(201).json({ success: true, scholarship });
  }),

  list: asyncHandler(async (req, res) => {
    const result = await scholarshipService.listAdmin(req.query);
    res.json(result);
  }),

  getById: asyncHandler(async (req, res) => {
    const s = await scholarshipService.getById(Number(req.params.id));
    res.json(s);
  }),

  update: asyncHandler(async (req, res) => {
    const s = await scholarshipService.update(Number(req.params.id), req.body, req.user);
    res.json({ success: true, scholarship: s });
  }),

  publish: asyncHandler(async (req, res) => {
    const s = await scholarshipService.publish(Number(req.params.id), req.user);
    res.json({ success: true, scholarship: s });
  }),

  close: asyncHandler(async (req, res) => {
    const s = await scholarshipService.close(Number(req.params.id), req.user);
    res.json({ success: true, scholarship: s });
  }),

  remove: asyncHandler(async (req, res) => {
    const result = await scholarshipService.remove(Number(req.params.id), req.user);
    res.json({ success: true, ...result });
  }),

  // ─── Candidatures ───
  listApplications: asyncHandler(async (req, res) => {
    const items = await scholarshipService.listApplicationsForScholarship(
      Number(req.params.id)
    );
    res.json({ items });
  }),

  reviewApplication: asyncHandler(async (req, res) => {
    const io = req.app.get('io');
    const result = await scholarshipService.reviewApplication(
      Number(req.params.id),
      req.body,
      req.user,
      io
    );
    res.json({ success: true, application: result });
  }),
};