import { scholarshipService } from '../services/scholarship.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const scholarshipController = {
  /**
   * GET /api/scholarships
   */
  list: asyncHandler(async (req, res) => {
    const items = await scholarshipService.listPublished();
    res.json({
      items: items.map((s) => ({
        id: s.id,
        type: s.type,
        title: s.title,
        description: s.description,
        organization: s.organization,
        amount: s.amount,
        opening_date: s.opening_date,
        closing_date: s.closing_date,
        applications_count: s.applications_count,
      })),
    });
  }),

  /**
   * GET /api/scholarships/:id
   */
  getById: asyncHandler(async (req, res) => {
    const { scholarship, my_application } = await scholarshipService.getPublishedDetail(
      Number(req.params.id),
      req.user.id
    );
    res.json({ scholarship, my_application });
  }),

  /**
   * POST /api/scholarships/:id/apply (multipart)
   */
  apply: asyncHandler(async (req, res) => {
    const { motivation_letter } = req.body;
    const cv = req.files?.cv?.[0] ?? null;
    const extraFiles = req.files?.extra_docs ?? [];
    const io = req.app.get('io');

    const application = await scholarshipService.apply(
      Number(req.params.id),
      req.user.id,
      { motivation_letter, cv },
      extraFiles,
      io
    );
    res.status(201).json({ success: true, application });
  }),

  /**
   * GET /api/my-applications
   */
  myApplications: asyncHandler(async (req, res) => {
    const items = await scholarshipService.listMyApplications(req.user.id);
    res.json({ items });
  }),
};