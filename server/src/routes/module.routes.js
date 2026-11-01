import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { asyncHandler } from '../utils/asyncHandler.js';
import { dbAsync } from '../config/database.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 100;
  const items = await dbAsync.all(
    `SELECT m.*,
      (SELECT COUNT(*) FROM sessions s WHERE s.module_id = m.id) AS total_sessions,
      (SELECT COUNT(*) FROM enrollments e WHERE e.module_id = m.id) AS total_enrollments
     FROM modules m ORDER BY m.created_at DESC LIMIT ?`,
    [limit]
  );
  res.json({ items });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const m = await dbAsync.get('SELECT * FROM modules WHERE id = ?', [req.params.id]);
  if (!m) return res.status(404).json({ error: 'Module introuvable' });
  const sessions = await dbAsync.all('SELECT * FROM sessions WHERE module_id = ? ORDER BY session_number', [req.params.id]);
  res.json({ ...m, sessions });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { title, description, duration_weeks, frequency_per_week } = req.body;
  if (!title || !duration_weeks || !frequency_per_week) {
    return res.status(422).json({ error: 'Champs requis manquants', received: req.body });
  }
  const result = await dbAsync.run(
    'INSERT INTO modules (title, description, duration_weeks, frequency_per_week) VALUES (?, ?, ?, ?)',
    [title, description ?? null, Number(duration_weeks), Number(frequency_per_week)]
  );
  const total = Number(duration_weeks) * Number(frequency_per_week);
  const start = new Date();
  for (let i = 0; i < total; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + Math.round((i * 7) / Number(frequency_per_week)));
    await dbAsync.run(
      'INSERT INTO sessions (module_id, session_number, title, scheduled_date) VALUES (?, ?, ?, ?)',
      [result.lastInsertRowid, i + 1, `Séance ${i + 1}`, d.toISOString().split('T')[0]]
    );
  }
  const m = await dbAsync.get('SELECT * FROM modules WHERE id = ?', [result.lastInsertRowid]);
  m.total_sessions = total;
  res.status(201).json({ success: true, module: m });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const { title, description, duration_weeks, frequency_per_week } = req.body;
  await dbAsync.run(
    `UPDATE modules SET title = COALESCE(?, title),
      description = COALESCE(?, description),
      duration_weeks = COALESCE(?, duration_weeks),
      frequency_per_week = COALESCE(?, frequency_per_week)
     WHERE id = ?`,
    [title, description, duration_weeks, frequency_per_week, req.params.id]
  );
  const m = await dbAsync.get('SELECT * FROM modules WHERE id = ?', [req.params.id]);
  res.json({ success: true, module: m });
}));

// ✅ UPLOAD COUVERTURE
router.post('/:id/cover', upload.single('cover'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier' });

  const module = await dbAsync.get('SELECT id FROM modules WHERE id = ?', [req.params.id]);
  if (!module) return res.status(404).json({ error: 'Module introuvable' });

  const coversDir = path.resolve('uploads/covers');
  fs.mkdirSync(coversDir, { recursive: true });

  const filename = `cover-${req.params.id}-${crypto.randomUUID()}.webp`;
  const filepath = path.join(coversDir, filename);

  await sharp(req.file.buffer)
    .resize(800, 400, { fit: 'cover' })
    .webp({ quality: 85 })
    .toFile(filepath);

  const url = `/uploads/covers/${filename}`;
  await dbAsync.run('UPDATE modules SET cover_image_url = ? WHERE id = ?', [url, req.params.id]);

  const updated = await dbAsync.get('SELECT * FROM modules WHERE id = ?', [req.params.id]);
  res.json({ success: true, module: updated });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await dbAsync.run('DELETE FROM modules WHERE id = ?', [req.params.id]);
  res.json({ success: true, deleted: true });
}));

router.post('/:id/regenerate-sessions', asyncHandler(async (req, res) => {
  const m = await dbAsync.get('SELECT * FROM modules WHERE id = ?', [req.params.id]);
  if (!m) return res.status(404).json({ error: 'Module introuvable' });
  await dbAsync.run('DELETE FROM sessions WHERE module_id = ?', [req.params.id]);
  const total = m.duration_weeks * m.frequency_per_week;
  const start = new Date();
  for (let i = 0; i < total; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + Math.round((i * 7) / m.frequency_per_week));
    await dbAsync.run(
      'INSERT INTO sessions (module_id, session_number, title, scheduled_date) VALUES (?, ?, ?, ?)',
      [m.id, i + 1, `Séance ${i + 1}`, d.toISOString().split('T')[0]]
    );
  }
  res.json({ success: true });
}));

export default router;