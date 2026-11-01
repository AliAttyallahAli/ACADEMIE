import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { dbAsync } from '../../config/database.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const { status, module_id, learner_id } = req.query;
  const where = [];
  const params = [];
  if (status) { where.push('e.payment_status = ?'); params.push(status); }
  if (module_id) { where.push('e.module_id = ?'); params.push(module_id); }
  if (learner_id) { where.push('e.learner_id = ?'); params.push(learner_id); }

  const sql = `
    SELECT e.*, l.full_name AS learner_name, l.email AS learner_email,
           m.title AS module_title
    FROM enrollments e
    JOIN learners l ON l.id = e.learner_id
    JOIN modules m ON m.id = e.module_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY e.enrolled_at DESC
    LIMIT 200
  `;
  const items = await dbAsync.all(sql, params);
  res.json({ items });
}));

router.get('/pending', asyncHandler(async (req, res) => {
  const items = await dbAsync.all(
    `SELECT e.*, l.full_name AS learner_name, l.email AS learner_email,
            l.birth_date, m.title AS module_title
     FROM enrollments e
     JOIN learners l ON l.id = e.learner_id
     JOIN modules m ON m.id = e.module_id
     WHERE e.payment_status = 'pending'
     ORDER BY e.enrolled_at DESC`
  );
  res.json({ items });
}));

router.post('/:id/validate', asyncHandler(async (req, res) => {
  const { note } = req.body;
  const enrollment = await dbAsync.get('SELECT * FROM enrollments WHERE id = ?', [req.params.id]);
  if (!enrollment) return res.status(404).json({ error: 'Inscription introuvable' });

  await dbAsync.run(
    `UPDATE enrollments SET payment_status = 'paid',
      validated_by = 'admin', validated_by_admin_id = ?,
      validation_note = ?, validated_at = datetime('now')
     WHERE id = ?`,
    [req.user?.id || 1, note ?? null, req.params.id]
  );

  const sessions = await dbAsync.all(
    'SELECT id FROM sessions WHERE module_id = ? ORDER BY session_number',
    [enrollment.module_id]
  );
  for (let i = 0; i < sessions.length; i++) {
    await dbAsync.run(
      'INSERT OR IGNORE INTO session_progress (learner_id, session_id, is_unlocked) VALUES (?, ?, ?)',
      [enrollment.learner_id, sessions[i].id, i === 0 ? 1 : 0]
    );
  }

  res.json({ success: true, activated: true, sessions_count: sessions.length });
}));

router.post('/:id/reject', asyncHandler(async (req, res) => {
  const { note } = req.body;
  await dbAsync.run(
    `UPDATE enrollments SET payment_status = 'rejected',
      validation_note = ?, validated_by = 'admin',
      validated_by_admin_id = ?, validated_at = datetime('now')
     WHERE id = ?`,
    [note ?? 'Rejetée', req.user?.id || 1, req.params.id]
  );
  res.json({ success: true, rejected: true });
}));

router.post('/manual', asyncHandler(async (req, res) => {
  const { learner_id, module_ids, start_date, note } = req.body;
  if (!learner_id || !module_ids?.length || !start_date) {
    return res.status(422).json({ error: 'Champs requis manquants' });
  }

  const created = [];
  for (const module_id of module_ids) {
    const existing = await dbAsync.get(
      'SELECT id FROM enrollments WHERE learner_id = ? AND module_id = ?',
      [learner_id, module_id]
    );
    if (existing) {
      created.push({ id: existing.id, already: true });
      continue;
    }
    const result = await dbAsync.run(
      `INSERT INTO enrollments (learner_id, module_id, start_date, payment_status)
       VALUES (?, ?, ?, 'paid')`,
      [learner_id, module_id, start_date]
    );
    await dbAsync.run(
      `UPDATE enrollments SET validated_by = 'admin', validated_by_admin_id = ?,
        validation_note = ?, validated_at = datetime('now')
       WHERE id = ?`,
      [req.user?.id || 1, note ?? 'Inscription manuelle', result.lastInsertRowid]
    );

    const sessions = await dbAsync.all(
      'SELECT id FROM sessions WHERE module_id = ? ORDER BY session_number',
      [module_id]
    );
    for (let i = 0; i < sessions.length; i++) {
      await dbAsync.run(
        'INSERT OR IGNORE INTO session_progress (learner_id, session_id, is_unlocked) VALUES (?, ?, ?)',
        [learner_id, sessions[i].id, i === 0 ? 1 : 0]
      );
    }
    created.push({ id: result.lastInsertRowid, activated: true });
  }
  res.status(201).json({ success: true, enrollments: created });
}));

export default router;