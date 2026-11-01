import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { dbAsync } from '../../config/database.js';

const router = Router();

/**
 * GET /api/admin/audit-log
 * Query : ?actor_type=&action_type=&search=&page=1&limit=50
 */
router.get('/', asyncHandler(async (req, res) => {
  const { actor_type, action_type, search } = req.query;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 50;
  const offset = (page - 1) * limit;

  const where = [];
  const params = [];
  if (actor_type) { where.push('actor_type = ?'); params.push(actor_type); }
  if (action_type) { where.push('action_type LIKE ?'); params.push(`%${action_type}%`); }
  if (search) {
    where.push('(actor_name LIKE ? OR action_type LIKE ? OR target_type LIKE ? OR details_json LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const items = await dbAsync.all(
    `SELECT * FROM admin_actions_log ${whereSql}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const total = (await dbAsync.get(
    `SELECT COUNT(*) AS c FROM admin_actions_log ${whereSql}`,
    params
  )).c;

  // Stats par type d'action (pour le dashboard audit)
  const stats = await dbAsync.all(
    `SELECT action_type, COUNT(*) AS count
     FROM admin_actions_log
     GROUP BY action_type
     ORDER BY count DESC
     LIMIT 10`
  );

  res.json({
    items,
    stats,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}));

/**
 * GET /api/admin/audit-log/:id
 * Détail d'une entrée.
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const item = await dbAsync.get(
    'SELECT * FROM admin_actions_log WHERE id = ?',
    [req.params.id]
  );
  if (!item) return res.status(404).json({ error: 'Entrée introuvable' });
  res.json(item);
}));

/**
 * GET /api/admin/audit-log/export/csv
 * Export CSV (optionnel).
 */
router.get('/export/csv', asyncHandler(async (req, res) => {
  const items = await dbAsync.all(
    'SELECT * FROM admin_actions_log ORDER BY created_at DESC LIMIT 5000'
  );

  const header = 'Date,Acteur Type,Acteur ID,Acteur Nom,Action,Cible Type,Cible ID,Détails\n';
  const rows = items.map((a) =>
    [
      a.created_at,
      a.actor_type,
      a.actor_id,
      a.actor_name || '',
      a.action_type,
      a.target_type || '',
      a.target_id || '',
      (a.details_json || '').replace(/,/g, ';'),
    ]
      .map((c) => `"${String(c).replace(/"/g, '""')}"`)
      .join(',')
  ).join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="audit-log-${Date.now()}.csv"`);
  res.send(header + rows);
}));

export default router;
