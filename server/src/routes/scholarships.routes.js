import { Router } from 'express';
import multer from 'multer';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { asyncHandler } from '../utils/asyncHandler.js';
import { dbAsync } from '../config/database.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';
import { env } from '../config/env.js';

const router = Router();
router.use(authenticateJWT);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// ═══════════════════════════════════════════════════════════
// GET /api/scholarships
// Liste des bourses publiées (accessible apprenante connectée)
// ═══════════════════════════════════════════════════════════
router.get('/', asyncHandler(async (req, res) => {
  const items = await dbAsync.all(
    `SELECT s.*,
      (SELECT COUNT(*) FROM scholarship_applications sa WHERE sa.scholarship_id = s.id) AS applications_count
     FROM scholarships s
     WHERE s.status = 'published'
     ORDER BY s.closing_date ASC`
  );
  res.json({ items });
}));

// ═══════════════════════════════════════════════════════════
// GET /api/scholarships/:id
// Détail d'une bourse + candidature existante de l'apprenante
// ═══════════════════════════════════════════════════════════
router.get('/:id', asyncHandler(async (req, res) => {
  const s = await dbAsync.get('SELECT * FROM scholarships WHERE id = ?', [req.params.id]);
  if (!s) return res.status(404).json({ error: 'Bourse introuvable' });

  // Récupérer la candidature existante de cette apprenante
  const my_application = await dbAsync.get(
    'SELECT * FROM scholarship_applications WHERE scholarship_id = ? AND learner_id = ?',
    [req.params.id, req.user.id]
  );

  // Parser les documents requis
  let required_documents = [];
  try {
    required_documents = s.required_documents_json ? JSON.parse(s.required_documents_json) : [];
  } catch {}

  res.json({
    scholarship: { ...s, required_documents },
    my_application: my_application || null,
  });
}));

// ═══════════════════════════════════════════════════════════
// POST /api/scholarships/:id/apply
// Postuler à une bourse (multipart : motivation_letter + cv)
// ═══════════════════════════════════════════════════════════
router.post('/:id/apply', upload.fields([
  { name: 'cv', maxCount: 1 },
  { name: 'extra_docs', maxCount: 5 },
]), asyncHandler(async (req, res) => {
  const learner_id = req.user.id;
  const scholarship_id = Number(req.params.id);

  // Vérifier la bourse
  const s = await dbAsync.get('SELECT * FROM scholarships WHERE id = ?', [scholarship_id]);
  if (!s) return res.status(404).json({ error: 'Bourse introuvable' });

  if (s.status !== 'published') {
    return res.status(400).json({ error: 'Cette bourse n\'accepte plus de candidatures' });
  }

  // Vérifier la date de clôture
  const today = new Date().toISOString().split('T')[0];
  if (s.closing_date && today > s.closing_date) {
    return res.status(400).json({ error: 'La date de clôture est dépassée' });
  }

  // Vérifier candidature existante
  const existing = await dbAsync.get(
    'SELECT id FROM scholarship_applications WHERE scholarship_id = ? AND learner_id = ?',
    [scholarship_id, learner_id]
  );
  if (existing) {
    return res.status(409).json({ error: 'Vous avez déjà postulé à cette bourse' });
  }

  // Sauvegarder les fichiers
  const DOCS_DIR = path.resolve(env.uploadDir, 'scholarship-docs');
  await fs.mkdir(DOCS_DIR, { recursive: true });

  let cv_url = null;
  if (req.files?.cv?.[0]) {
    const file = req.files.cv[0];
    const filename = `cv-${learner_id}-${scholarship_id}-${crypto.randomUUID()}.pdf`;
    const filepath = path.join(DOCS_DIR, filename);
    await fs.writeFile(filepath, file.buffer);
    cv_url = `/uploads/scholarship-docs/${filename}`;
  }

  const extra_docs = [];
  if (req.files?.extra_docs) {
    for (const file of req.files.extra_docs) {
      const ext = path.extname(file.originalname) || '.pdf';
      const filename = `doc-${learner_id}-${scholarship_id}-${crypto.randomUUID()}${ext}`;
      const filepath = path.join(DOCS_DIR, filename);
      await fs.writeFile(filepath, file.buffer);
      extra_docs.push({
        name: file.originalname,
        url: `/uploads/scholarship-docs/${filename}`,
      });
    }
  }

  // Créer la candidature
  const result = await dbAsync.run(
    `INSERT INTO scholarship_applications
      (scholarship_id, learner_id, motivation_letter, cv_url, extra_docs_json, status)
     VALUES (?, ?, ?, ?, ?, 'pending')`,
    [
      scholarship_id,
      learner_id,
      req.body.motivation_letter ?? null,
      cv_url,
      JSON.stringify(extra_docs),
    ]
  );

  // Notification à l'apprenante
  await dbAsync.run(
    `INSERT INTO notifications (learner_id, type, title, message, action_url, icon, color)
     VALUES (?, 'application_submitted', '📩 Candidature envoyée',
       ?, ?, 'send', 'blue')`,
    [
      learner_id,
      `Votre candidature à "${s.title}" a bien été enregistrée.`,
      `/scholarships/${scholarship_id}`,
    ]
  );

  const application = await dbAsync.get(
    'SELECT * FROM scholarship_applications WHERE id = ?',
    [result.lastInsertRowid]
  );

  res.status(201).json({ success: true, application });
}));

export default router;
