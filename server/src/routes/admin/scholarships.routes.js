import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { dbAsync } from '../../config/database.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// ═══════════════════════════════════════════════════════════
// LISTE
// ═══════════════════════════════════════════════════════════
router.get('/', asyncHandler(async (req, res) => {
  const { status, type } = req.query;
  const where = [];
  const params = [];
  if (status) { where.push('status = ?'); params.push(status); }
  if (type) { where.push('type = ?'); params.push(type); }

  const items = await dbAsync.all(
    `SELECT s.*,
      (SELECT COUNT(*) FROM scholarship_applications sa WHERE sa.scholarship_id = s.id) AS applications_count
     FROM scholarships s
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY s.created_at DESC`,
    params
  );
  res.json({ items });
}));

// ═══════════════════════════════════════════════════════════
// TOUTES LES CANDIDATURES (avant /:id pour éviter conflit)
// ═══════════════════════════════════════════════════════════
router.get('/applications/all', asyncHandler(async (req, res) => {
  const { status, scholarship_id, search } = req.query;
  const where = [];
  const params = [];
  if (status) { where.push('sa.status = ?'); params.push(status); }
  if (scholarship_id) { where.push('sa.scholarship_id = ?'); params.push(scholarship_id); }
  if (search) {
    where.push('(l.full_name LIKE ? OR l.email LIKE ? OR s.title LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const items = await dbAsync.all(
    `SELECT sa.*, l.full_name AS learner_name, l.email AS learner_email,
            l.birth_date, l.phone, l.country,
            s.title AS scholarship_title, s.type AS scholarship_type,
            s.organization, s.closing_date
     FROM scholarship_applications sa
     JOIN learners l ON l.id = sa.learner_id
     JOIN scholarships s ON s.id = sa.scholarship_id
     ${whereSql}
     ORDER BY
       CASE WHEN sa.status = 'pending' THEN 0 ELSE 1 END,
       sa.applied_at DESC
     LIMIT 500`,
    params
  );

  const stats = {
    total: items.length,
    pending: items.filter((a) => a.status === 'pending').length,
    accepted: items.filter((a) => a.status === 'accepted').length,
    rejected: items.filter((a) => a.status === 'rejected').length,
  };

  res.json({ items, stats });
}));

// ═══════════════════════════════════════════════════════════
// REVIEW CANDIDATURE
// ═══════════════════════════════════════════════════════════
router.post('/applications/:id/review', asyncHandler(async (req, res) => {
  const { status, review_note } = req.body;
  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(422).json({ error: 'Statut invalide (accepted ou rejected)' });
  }

  const app = await dbAsync.get('SELECT * FROM scholarship_applications WHERE id = ?', [req.params.id]);
  if (!app) return res.status(404).json({ error: 'Candidature introuvable' });
  if (app.status !== 'pending') {
    return res.status(400).json({ error: 'Candidature déjà traitée' });
  }

  await dbAsync.run(
    `UPDATE scholarship_applications SET
      status = ?, review_note = ?,
      reviewed_by_type = 'admin', reviewed_by_id = ?,
      reviewed_at = datetime('now')
     WHERE id = ?`,
    [status, review_note ?? null, req.user?.id || 1, req.params.id]
  );

  // Notification à l'apprenante
  await dbAsync.run(
    `INSERT INTO notifications (learner_id, type, title, message, action_url, icon, color)
     VALUES (?, 'scholarship_result', ?, ?, ?, ?, ?)`,
    [
      app.learner_id,
      status === 'accepted' ? '🎉 Candidature acceptée' : '📋 Candidature refusée',
      status === 'accepted'
        ? 'Félicitations ! Votre candidature a été acceptée.'
        : `Votre candidature a été refusée.${review_note ? ` Motif : ${review_note}` : ''}`,
      `/scholarships/${app.scholarship_id}`,
      status === 'accepted' ? 'check' : 'x',
      status === 'accepted' ? 'green' : 'red',
    ]
  );

  res.json({ success: true });
}));

// ═══════════════════════════════════════════════════════════
// DÉTAIL D'UNE BOURSE
// ═══════════════════════════════════════════════════════════
router.get('/:id', asyncHandler(async (req, res) => {
  const s = await dbAsync.get('SELECT * FROM scholarships WHERE id = ?', [req.params.id]);
  if (!s) return res.status(404).json({ error: 'Bourse introuvable' });
  res.json(s);
}));

// ═══════════════════════════════════════════════════════════
// CANDIDATURES D'UNE BOURSE
// ═══════════════════════════════════════════════════════════
router.get('/:id/applications', asyncHandler(async (req, res) => {
  const scholarship = await dbAsync.get('SELECT * FROM scholarships WHERE id = ?', [req.params.id]);
  if (!scholarship) return res.status(404).json({ error: 'Bourse introuvable' });

  const items = await dbAsync.all(
    `SELECT sa.*, l.full_name AS learner_name, l.email AS learner_email,
            l.birth_date, l.country, l.phone
     FROM scholarship_applications sa
     JOIN learners l ON l.id = sa.learner_id
     WHERE sa.scholarship_id = ?
     ORDER BY
       CASE WHEN sa.status = 'pending' THEN 0 ELSE 1 END,
       sa.applied_at DESC`,
    [req.params.id]
  );

  const stats = {
    total: items.length,
    pending: items.filter((a) => a.status === 'pending').length,
    accepted: items.filter((a) => a.status === 'accepted').length,
    rejected: items.filter((a) => a.status === 'rejected').length,
  };

  res.json({ scholarship, items, stats });
}));

// ═══════════════════════════════════════════════════════════
// CRÉATION
// ═══════════════════════════════════════════════════════════
router.post('/', asyncHandler(async (req, res) => {
  const { type, title, description, organization, amount, opening_date, closing_date, eligibility } = req.body;

  if (!type || !title) {
    return res.status(422).json({ error: 'Type et titre requis' });
  }

  const result = await dbAsync.run(
    `INSERT INTO scholarships
      (type, title, description, organization, amount,
       opening_date, closing_date, eligibility, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
    [
      type,
      title,
      description ?? null,
      organization ?? null,
      amount ?? null,
      opening_date ?? null,
      closing_date ?? null,
      eligibility ?? null,
    ]
  );

  const s = await dbAsync.get('SELECT * FROM scholarships WHERE id = ?', [result.lastInsertRowid]);
  res.status(201).json({ success: true, scholarship: s });
}));

// ═══════════════════════════════════════════════════════════
// MISE À JOUR
// ═══════════════════════════════════════════════════════════
router.put('/:id', asyncHandler(async (req, res) => {
  const allowed = ['type', 'title', 'description', 'organization', 'amount', 'opening_date', 'closing_date', 'eligibility', 'status'];
  const sets = [];
  const params = [];
  for (const k of allowed) {
    if (req.body[k] !== undefined) {
      sets.push(`${k} = ?`);
      params.push(req.body[k]);
    }
  }
  if (!sets.length) return res.status(400).json({ error: 'Aucune modification' });
  params.push(req.params.id);
  await dbAsync.run(`UPDATE scholarships SET ${sets.join(', ')} WHERE id = ?`, params);
  const s = await dbAsync.get('SELECT * FROM scholarships WHERE id = ?', [req.params.id]);
  res.json({ success: true, scholarship: s });
}));

// ═══════════════════════════════════════════════════════════
// UPLOAD IMAGE DE COUVERTURE
// ═══════════════════════════════════════════════════════════
router.post('/:id/cover', upload.single('cover'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier' });

  const s = await dbAsync.get('SELECT id FROM scholarships WHERE id = ?', [req.params.id]);
  if (!s) return res.status(404).json({ error: 'Bourse introuvable' });

  const dir = path.resolve('uploads/scholarships');
  fs.mkdirSync(dir, { recursive: true });

  const filename = `scholarship-${req.params.id}-${crypto.randomUUID()}.webp`;
  const filepath = path.join(dir, filename);

  await sharp(req.file.buffer)
    .resize(800, 400, { fit: 'cover' })
    .webp({ quality: 85 })
    .toFile(filepath);

  const url = `/uploads/scholarships/${filename}`;
  await dbAsync.run('UPDATE scholarships SET cover_image_url = ? WHERE id = ?', [url, req.params.id]);

  const updated = await dbAsync.get('SELECT * FROM scholarships WHERE id = ?', [req.params.id]);
  res.json({ success: true, scholarship: updated });
}));

// ═══════════════════════════════════════════════════════════
// PUBLIER
// ═══════════════════════════════════════════════════════════
router.post('/:id/publish', asyncHandler(async (req, res) => {
  await dbAsync.run("UPDATE scholarships SET status = 'published' WHERE id = ?", [req.params.id]);
  const s = await dbAsync.get('SELECT * FROM scholarships WHERE id = ?', [req.params.id]);
  res.json({ success: true, scholarship: s });
}));

// ═══════════════════════════════════════════════════════════
// CLÔTURER
// ═══════════════════════════════════════════════════════════
router.post('/:id/close', asyncHandler(async (req, res) => {
  await dbAsync.run("UPDATE scholarships SET status = 'closed' WHERE id = ?", [req.params.id]);
  const s = await dbAsync.get('SELECT * FROM scholarships WHERE id = ?', [req.params.id]);
  res.json({ success: true, scholarship: s });
}));

// ═══════════════════════════════════════════════════════════
// SUPPRIMER
// ═══════════════════════════════════════════════════════════
router.delete('/:id', asyncHandler(async (req, res) => {
  await dbAsync.run('DELETE FROM scholarships WHERE id = ?', [req.params.id]);
  res.json({ success: true, deleted: true });
}));

export default router;
