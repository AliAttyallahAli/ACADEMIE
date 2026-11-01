import { asyncHandler } from '../../utils/asyncHandler.js';
import { dbAsync } from '../../config/database.js';

export const modulesAdminController = {
  /**
   * GET /api/admin/modules
   */
  list: asyncHandler(async (req, res) => {
    const limit = Number(req.query.limit) || 100;
    const offset = Number(req.query.offset) || 0;
    const search = req.query.search;

    const where = [];
    const params = [];
    if (search) {
      where.push('(m.title LIKE ? OR m.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const items = await dbAsync.all(
      `SELECT m.*,
        (SELECT COUNT(*) FROM sessions s WHERE s.module_id = m.id) AS total_sessions,
        (SELECT COUNT(*) FROM enrollments e WHERE e.module_id = m.id) AS total_enrollments
       FROM modules m
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({ items });
  }),

  /**
   * POST /api/admin/modules
   * Body : { title, description?, duration_weeks, frequency_per_week, start_date? }
   */
  create: asyncHandler(async (req, res) => {
    const { title, description, duration_weeks, frequency_per_week, start_date } = req.body;

    console.log('[modulesAdminController.create] body reçu :', req.body);

    const result = await dbAsync.run(
      `INSERT INTO modules (title, description, duration_weeks, frequency_per_week)
       VALUES (?, ?, ?, ?)`,
      [title, description ?? null, Number(duration_weeks), Number(frequency_per_week)]
    );
    const moduleId = result.lastInsertRowid;

    // Génération automatique des séances
    const total = Number(duration_weeks) * Number(frequency_per_week);
    const start = start_date ? new Date(start_date) : new Date();

    for (let i = 0; i < total; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + Math.round((i * 7) / Number(frequency_per_week)));
      await dbAsync.run(
        `INSERT INTO sessions (module_id, session_number, title, scheduled_date)
         VALUES (?, ?, ?, ?)`,
        [moduleId, i + 1, `Séance ${i + 1}`, d.toISOString().split('T')[0]]
      );
    }

    const module = await dbAsync.get('SELECT * FROM modules WHERE id = ?', [moduleId]);
    module.total_sessions = total;

    console.log('[modulesAdminController.create] module créé (id=' + moduleId + ', ' + total + ' séances)');
    res.status(201).json({ success: true, module });
  }),

  /**
   * GET /api/admin/modules/:id
   */
  getById: asyncHandler(async (req, res) => {
    const module = await dbAsync.get('SELECT * FROM modules WHERE id = ?', [req.params.id]);
    if (!module) return res.status(404).json({ error: 'Module introuvable' });

    const sessions = await dbAsync.all(
      'SELECT * FROM sessions WHERE module_id = ? ORDER BY session_number',
      [req.params.id]
    );
    module.sessions = sessions;
    module.total_sessions = sessions.length;

    res.json(module);
  }),

  /**
   * PUT /api/admin/modules/:id
   */
  update: asyncHandler(async (req, res) => {
    const { title, description, duration_weeks, frequency_per_week } = req.body;

    const module = await dbAsync.get('SELECT * FROM modules WHERE id = ?', [req.params.id]);
    if (!module) return res.status(404).json({ error: 'Module introuvable' });

    await dbAsync.run(
      `UPDATE modules SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        duration_weeks = COALESCE(?, duration_weeks),
        frequency_per_week = COALESCE(?, frequency_per_week)
       WHERE id = ?`,
      [
        title ?? null,
        description ?? null,
        duration_weeks ? Number(duration_weeks) : null,
        frequency_per_week ? Number(frequency_per_week) : null,
        req.params.id,
      ]
    );

    const updated = await dbAsync.get('SELECT * FROM modules WHERE id = ?', [req.params.id]);
    res.json({ success: true, module: updated });
  }),

  /**
   * DELETE /api/admin/modules/:id
   */
  remove: asyncHandler(async (req, res) => {
    const module = await dbAsync.get('SELECT id FROM modules WHERE id = ?', [req.params.id]);
    if (!module) return res.status(404).json({ error: 'Module introuvable' });

    await dbAsync.run('DELETE FROM modules WHERE id = ?', [req.params.id]);
    res.json({ success: true, deleted: true });
  }),

  /**
   * POST /api/admin/modules/:id/regenerate-sessions
   * Body : { start_date }
   */
  regenerateSessions: asyncHandler(async (req, res) => {
    const module = await dbAsync.get('SELECT * FROM modules WHERE id = ?', [req.params.id]);
    if (!module) return res.status(404).json({ error: 'Module introuvable' });

    const start = new Date(req.body.start_date);

    await dbAsync.run('DELETE FROM sessions WHERE module_id = ?', [req.params.id]);

    const total = module.duration_weeks * module.frequency_per_week;
    for (let i = 0; i < total; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + Math.round((i * 7) / module.frequency_per_week));
      await dbAsync.run(
        `INSERT INTO sessions (module_id, session_number, title, scheduled_date)
         VALUES (?, ?, ?, ?)`,
        [module.id, i + 1, `Séance ${i + 1}`, d.toISOString().split('T')[0]]
      );
    }

    const sessions = await dbAsync.all(
      'SELECT * FROM sessions WHERE module_id = ? ORDER BY session_number',
      [module.id]
    );
    res.json({ success: true, sessions_count: sessions.length });
  }),
};