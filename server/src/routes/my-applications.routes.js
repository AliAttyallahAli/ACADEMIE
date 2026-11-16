import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { dbAsync } from '../config/database.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';

const router = Router();
router.use(authenticateJWT);

/**
 * GET /api/my-applications
 * Liste les candidatures bourse de l'apprenante connectée.
 */
router.get('/', asyncHandler(async (req, res) => {
  const items = await dbAsync.all(
    `SELECT sa.*, s.title AS scholarship_title, s.type AS scholarship_type,
            s.organization, s.closing_date, s.status AS scholarship_status,
            s.cover_image_url
     FROM scholarship_applications sa
     JOIN scholarships s ON s.id = sa.scholarship_id
     WHERE sa.learner_id = ?
     ORDER BY sa.applied_at DESC`,
    [req.user.id]
  );
  res.json({ items });
}));

export default router;
