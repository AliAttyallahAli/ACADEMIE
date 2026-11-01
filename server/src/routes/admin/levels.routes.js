import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { dbAsync } from '../../config/database.js';

const router = Router();

// ─── LISTE DES NIVEAUX D'UN MODULE ───
router.get('/module/:moduleId', asyncHandler(async (req, res) => {
  const module = await dbAsync.get('SELECT * FROM modules WHERE id = ?', [req.params.moduleId]);
  if (!module) return res.status(404).json({ error: 'Module introuvable' });

  const levels = await dbAsync.all(
    `SELECT l.*,
      (SELECT COUNT(*) FROM sessions s WHERE s.level_id = l.id) AS total_sessions
     FROM levels l
     WHERE l.module_id = ?
     ORDER BY l.level_number`,
    [req.params.moduleId]
  );

  res.json({ module, levels });
}));

// ─── DÉTAIL D'UN NIVEAU ───
router.get('/:id', asyncHandler(async (req, res) => {
  const level = await dbAsync.get('SELECT * FROM levels WHERE id = ?', [req.params.id]);
  if (!level) return res.status(404).json({ error: 'Niveau introuvable' });

  const sessions = await dbAsync.all(
    'SELECT * FROM sessions WHERE level_id = ? ORDER BY session_number',
    [req.params.id]
  );

  res.json({ ...level, sessions });
}));

// ─── CRÉATION ───
router.post('/module/:moduleId', asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(422).json({ error: 'Titre requis' });

  const module = await dbAsync.get('SELECT id FROM modules WHERE id = ?', [req.params.moduleId]);
  if (!module) return res.status(404).json({ error: 'Module introuvable' });

  const count = await dbAsync.get(
    'SELECT COUNT(*) as c FROM levels WHERE module_id = ?',
    [req.params.moduleId]
  );
  const nextNumber = (count?.c || 0) + 1;

  const result = await dbAsync.run(
    'INSERT INTO levels (module_id, level_number, title, description) VALUES (?, ?, ?, ?)',
    [req.params.moduleId, nextNumber, title, description ?? null]
  );

  const level = await dbAsync.get('SELECT * FROM levels WHERE id = ?', [result.lastInsertRowid]);
  res.status(201).json({ success: true, level });
}));

// ─── MISE À JOUR ───
router.put('/:id', asyncHandler(async (req, res) => {
  const { title, description, level_number } = req.body;
  await dbAsync.run(
    `UPDATE levels SET title = COALESCE(?, title),
      description = COALESCE(?, description),
      level_number = COALESCE(?, level_number)
     WHERE id = ?`,
    [title ?? null, description ?? null, level_number ?? null, req.params.id]
  );
  const level = await dbAsync.get('SELECT * FROM levels WHERE id = ?', [req.params.id]);
  res.json({ success: true, level });
}));

// ─── SUPPRESSION ───
router.delete('/:id', asyncHandler(async (req, res) => {
  await dbAsync.run('DELETE FROM levels WHERE id = ?', [req.params.id]);
  res.json({ success: true, deleted: true });
}));

export default router;
