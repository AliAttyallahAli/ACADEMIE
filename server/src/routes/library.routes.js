import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { dbAsync } from '../config/database.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';

const router = Router();
router.use(authenticateJWT);

/**
 * GET /api/library
 * Liste les ressources des modules auxquels l'apprenante est inscrite.
 */
router.get('/', asyncHandler(async (req, res) => {
  const learner_id = req.user.id;

  // Récupérer les modules inscrits (payés)
  const enrollments = await dbAsync.all(
    `SELECT module_id FROM enrollments
     WHERE learner_id = ? AND payment_status = 'paid'`,
    [learner_id]
  );

  const moduleIds = enrollments.map((e) => e.module_id);
  if (moduleIds.length === 0) {
    return res.json({ items: [] });
  }

  const placeholders = moduleIds.map(() => '?').join(',');
  const resources = await dbAsync.all(
    `SELECT r.*, m.title AS module_title
     FROM resources r
     JOIN modules m ON m.id = r.module_id
     WHERE r.module_id IN (${placeholders})
     ORDER BY r.uploaded_at DESC`,
    moduleIds
  );

  res.json({ items: resources });
}));

export default router;
