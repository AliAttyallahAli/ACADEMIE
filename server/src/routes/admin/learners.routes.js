import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { dbAsync } from '../../config/database.js';

const router = Router();

// GET /api/admin/learners
router.get('/', asyncHandler(async (req, res) => {
  const { search } = req.query;
  const where = [];
  const params = [];
  if (search) {
    where.push('(l.full_name LIKE ? OR l.email LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  const items = await dbAsync.all(
    `SELECT l.id, l.full_name, l.email, l.birth_date, l.phone, l.country,
            l.profile_photo_url, l.created_at,
            (SELECT COUNT(*) FROM enrollments e WHERE e.learner_id = l.id) AS enrollments_count,
            (SELECT COUNT(*) FROM enrollments e WHERE e.learner_id = l.id AND e.status = 'completed') AS modules_completed,
            (SELECT COUNT(*) FROM session_progress sp WHERE sp.learner_id = l.id AND sp.is_completed = 1) AS sessions_completed,
            (SELECT COUNT(*) FROM certificates c WHERE c.learner_id = l.id) AS certificates_count
     FROM learners l
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY l.created_at DESC`,
    params
  );

  res.json({ items });
}));

// GET /api/admin/learners/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const learner = await dbAsync.get(
    `SELECT id, full_name, email, birth_date, phone, country, bio,
            profile_photo_url, created_at
     FROM learners WHERE id = ?`,
    [req.params.id]
  );
  if (!learner) return res.status(404).json({ error: 'Apprenante introuvable' });

  const enrollments = await dbAsync.all(
    `SELECT e.*, m.title AS module_title
     FROM enrollments e
     JOIN modules m ON m.id = e.module_id
     WHERE e.learner_id = ?
     ORDER BY e.enrolled_at DESC`,
    [req.params.id]
  );

  const certificates = await dbAsync.all(
    'SELECT certificate_uuid, issued_at FROM certificates WHERE learner_id = ?',
    [req.params.id]
  );

  res.json({ ...learner, enrollments, certificates });
}));

// DELETE /api/admin/learners/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const learner = await dbAsync.get('SELECT id FROM learners WHERE id = ?', [req.params.id]);
  if (!learner) return res.status(404).json({ error: 'Apprenante introuvable' });

  await dbAsync.run('DELETE FROM learners WHERE id = ?', [req.params.id]);
  res.json({ success: true, deleted: true });
}));

export default router;