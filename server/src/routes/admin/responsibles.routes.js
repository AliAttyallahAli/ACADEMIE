import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { dbAsync } from '../../config/database.js';
import { hashPassword } from '../../utils/hash.js';

const router = Router();

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let pwd = '';
  for (let i = 0; i < 12; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  return pwd + '@1';
}

// ─── LISTE ───
router.get('/', asyncHandler(async (req, res) => {
  const items = await dbAsync.all(
    `SELECT id, full_name, email, role, permissions_json, is_active, last_login_at, created_at
     FROM responsibles ORDER BY created_at DESC`
  );
  res.json({ items });
}));

// ─── CRÉATION ───
router.post('/', asyncHandler(async (req, res) => {
  const { full_name, email, password, role, permissions_json } = req.body;

  if (!full_name || !email || !role) {
    return res.status(422).json({ error: 'Nom, email et rôle requis' });
  }

  const existing = await dbAsync.get('SELECT id FROM responsibles WHERE email = ?', [email]);
  if (existing) {
    return res.status(409).json({ error: 'Un responsable existe déjà avec cet email' });
  }

  const generated = !password;
  const finalPassword = password || generateTempPassword();
  const hash = await hashPassword(finalPassword);

  const result = await dbAsync.run(
    `INSERT INTO responsibles (full_name, email, password_hash, role, permissions_json, created_by_admin_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [full_name, email, hash, role, JSON.stringify(permissions_json || {}), req.user?.id || 1]
  );

  const created = await dbAsync.get(
    'SELECT id, full_name, email, role, permissions_json, is_active, created_at FROM responsibles WHERE id = ?',
    [result.lastInsertRowid]
  );

  res.status(201).json({
    success: true,
    responsible: created,
    tempPassword: finalPassword,
    password_generated: generated,
  });
}));

// ─── MISE À JOUR ───
router.put('/:id', asyncHandler(async (req, res) => {
  const { full_name, role, permissions_json, password } = req.body;

  const existing = await dbAsync.get('SELECT id FROM responsibles WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Responsable introuvable' });

  const sets = [];
  const params = [];

  if (full_name !== undefined) { sets.push('full_name = ?'); params.push(full_name); }
  if (role !== undefined) { sets.push('role = ?'); params.push(role); }
  if (permissions_json !== undefined) { sets.push('permissions_json = ?'); params.push(JSON.stringify(permissions_json)); }
  if (password) {
    const hash = await hashPassword(password);
    sets.push('password_hash = ?'); params.push(hash);
  }

  if (sets.length === 0) return res.json({ success: true, message: 'Aucune modification' });

  params.push(req.params.id);
  await dbAsync.run(`UPDATE responsibles SET ${sets.join(', ')} WHERE id = ?`, params);

  const updated = await dbAsync.get(
    'SELECT id, full_name, email, role, permissions_json, is_active FROM responsibles WHERE id = ?',
    [req.params.id]
  );

  res.json({
    success: true,
    responsible: updated,
    ...(password ? { tempPassword: password } : {}),
  });
}));

// ─── TOGGLE ───
router.patch('/:id/toggle', asyncHandler(async (req, res) => {
  const r = await dbAsync.get('SELECT is_active FROM responsibles WHERE id = ?', [req.params.id]);
  if (!r) return res.status(404).json({ error: 'Responsable introuvable' });
  const newState = !r.is_active;
  await dbAsync.run('UPDATE responsibles SET is_active = ? WHERE id = ?', [newState ? 1 : 0, req.params.id]);
  res.json({ success: true, is_active: newState });
}));

// ─── RESET PASSWORD ───
router.post('/:id/reset-password', asyncHandler(async (req, res) => {
  const existing = await dbAsync.get('SELECT id, email FROM responsibles WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Responsable introuvable' });

  const newPassword = generateTempPassword();
  const hash = await hashPassword(newPassword);
  await dbAsync.run('UPDATE responsibles SET password_hash = ? WHERE id = ?', [hash, req.params.id]);

  res.json({ success: true, tempPassword: newPassword, email: existing.email });
}));

// ─── ACTIVITÉ ───
router.get('/:id/activity', asyncHandler(async (req, res) => {
  const items = await dbAsync.all(
    `SELECT * FROM admin_actions_log WHERE actor_type = 'responsible' AND actor_id = ?
     ORDER BY created_at DESC LIMIT 50`,
    [req.params.id]
  );
  res.json({ items });
}));

// ─── SUPPRESSION ───
router.delete('/:id', asyncHandler(async (req, res) => {
  await dbAsync.run('DELETE FROM responsibles WHERE id = ?', [req.params.id]);
  res.json({ success: true, deleted: true });
}));

export default router;
