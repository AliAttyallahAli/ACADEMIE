import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { dbAsync } from '../../config/database.js';

const router = Router();

// ─── LISTE DES SÉANCES D'UN MODULE ───
router.get('/module/:moduleId', asyncHandler(async (req, res) => {
  const module = await dbAsync.get('SELECT * FROM modules WHERE id = ?', [req.params.moduleId]);
  if (!module) return res.status(404).json({ error: 'Module introuvable' });

  const sessions = await dbAsync.all(
    `SELECT s.*,
      (SELECT id FROM quizzes q WHERE q.session_id = s.id) AS quiz_id
     FROM sessions s
     WHERE s.module_id = ?
     ORDER BY s.session_number`,
    [req.params.moduleId]
  );

  res.json({ module, sessions });
}));

// ─── DÉTAIL D'UNE SÉANCE ───
router.get('/:id', asyncHandler(async (req, res) => {
  const session = await dbAsync.get('SELECT * FROM sessions WHERE id = ?', [req.params.id]);
  if (!session) return res.status(404).json({ error: 'Séance introuvable' });
  const quiz = await dbAsync.get('SELECT * FROM quizzes WHERE session_id = ?', [req.params.id]);
  res.json({ ...session, quiz });
}));

// ─── MISE À JOUR (contenu leçon) ───
router.put('/:id', asyncHandler(async (req, res) => {
  const { title, content, content_type, scheduled_date } = req.body;

  const session = await dbAsync.get('SELECT id FROM sessions WHERE id = ?', [req.params.id]);
  if (!session) return res.status(404).json({ error: 'Séance introuvable' });

  await dbAsync.run(
    `UPDATE sessions SET
      title = COALESCE(?, title),
      content = COALESCE(?, content),
      content_type = COALESCE(?, content_type),
      scheduled_date = COALESCE(?, scheduled_date)
     WHERE id = ?`,
    [title ?? null, content ?? null, content_type ?? null, scheduled_date ?? null, req.params.id]
  );

  const updated = await dbAsync.get('SELECT * FROM sessions WHERE id = ?', [req.params.id]);
  res.json({ success: true, session: updated });
}));

// ─── SUPPRESSION ───
router.delete('/:id', asyncHandler(async (req, res) => {
  await dbAsync.run('DELETE FROM sessions WHERE id = ?', [req.params.id]);
  res.json({ success: true, deleted: true });
}));

// ─── UPLOAD FICHIER (PDF / vidéo / image) ───
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.post('/:id/upload', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier' });

  const session = await dbAsync.get('SELECT id FROM sessions WHERE id = ?', [req.params.id]);
  if (!session) return res.status(404).json({ error: 'Séance introuvable' });

  const dir = path.resolve('uploads/sessions');
  fs.mkdirSync(dir, { recursive: true });

  const isPdf = req.file.mimetype === 'application/pdf';
  const isImage = req.file.mimetype.startsWith('image/');
  const isVideo = req.file.mimetype.startsWith('video/');

  let ext = 'bin';
  if (isPdf) ext = 'pdf';
  else if (isImage) ext = 'webp';
  else if (isVideo) ext = path.extname(req.file.originalname) || 'mp4';

  const filename = `session-${req.params.id}-${crypto.randomUUID()}.${ext}`;
  const filepath = path.join(dir, filename);

  if (isImage) {
    await sharp(req.file.buffer)
      .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(filepath);
  } else {
    fs.writeFileSync(filepath, req.file.buffer);
  }

  const url = `/uploads/sessions/${filename}`;
  const contentType = isPdf ? 'pdf' : isImage ? 'image' : isVideo ? 'video' : 'text';

  await dbAsync.run(
    'UPDATE sessions SET content = ?, content_type = ? WHERE id = ?',
    [url, contentType, req.params.id]
  );

  const updated = await dbAsync.get('SELECT * FROM sessions WHERE id = ?', [req.params.id]);
  res.json({ success: true, session: updated, url });
}));

// ─── AJOUTER UNE SÉANCE SUPPLÉMENTAIRE ───
router.post('/module/:moduleId', asyncHandler(async (req, res) => {
  const module = await dbAsync.get('SELECT * FROM modules WHERE id = ?', [req.params.moduleId]);
  if (!module) return res.status(404).json({ error: 'Module introuvable' });

  const count = await dbAsync.get(
    'SELECT COUNT(*) as c FROM sessions WHERE module_id = ?',
    [req.params.moduleId]
  );
  const nextNumber = (count?.c || 0) + 1;

  const scheduled_date = req.body.scheduled_date
    || new Date().toISOString().split('T')[0];

  const result = await dbAsync.run(
    `INSERT INTO sessions (module_id, session_number, title, content, content_type, scheduled_date)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      req.params.moduleId,
      nextNumber,
      req.body.title || `Séance ${nextNumber}`,
      req.body.content || null,
      req.body.content_type || 'text',
      scheduled_date,
    ]
  );

  const session = await dbAsync.get('SELECT * FROM sessions WHERE id = ?', [result.lastInsertRowid]);
  res.status(201).json({ success: true, session });
}));

export default router;
