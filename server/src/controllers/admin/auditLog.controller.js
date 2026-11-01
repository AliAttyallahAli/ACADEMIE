import { auditLogService } from '../../services/auditLog.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const auditLogController = {
  list: asyncHandler(async (req, res) => {
    const { actor_type, actor_id, action_type, page = 1, limit = 50 } = req.query;
    const p = Number(page);
    const l = Number(limit);
    const offset = (p - 1) * l;

    const items = await auditLogService.findAll({
      actor_type,
      actor_id: actor_id ? Number(actor_id) : undefined,
      action_type,
      limit: l,
      offset,
    });
    const total = await auditLogService.count({
      actor_type,
      actor_id: actor_id ? Number(actor_id) : undefined,
      action_type,
    });

    res.json({ items, pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) } });
  }),
};