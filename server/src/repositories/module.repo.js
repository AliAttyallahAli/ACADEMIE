import { dbAsync } from '../config/database.js';

export const moduleRepo = {
  async create({ title, description, cover_image_url, duration_weeks, frequency_per_week }) {
    const result = await dbAsync.run(
      `INSERT INTO modules (title, description, cover_image_url, duration_weeks, frequency_per_week)
       VALUES (?, ?, ?, ?, ?)`,
      [title, description ?? null, cover_image_url ?? null, duration_weeks, frequency_per_week]
    );
    return result.lastInsertRowid;
  },

  async findById(id) {
    return dbAsync.get(`SELECT * FROM modules WHERE id = ?`, [id]);
  },

  async findAll({ search, limit = 50, offset = 0 } = {}) {
    const where = [];
    const params = [];
    if (search) {
      where.push('(title LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    const sql = `
      SELECT m.*,
        (SELECT COUNT(*) FROM sessions s WHERE s.module_id = m.id) AS total_sessions,
        (SELECT COUNT(*) FROM enrollments e WHERE e.module_id = m.id) AS total_enrollments
      FROM modules m
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);
    return dbAsync.all(sql, params);
  },

  async count({ search } = {}) {
    const where = [];
    const params = [];
    if (search) {
      where.push('(title LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    const sql = `SELECT COUNT(*) AS c FROM modules ${where.length ? 'WHERE ' + where.join(' AND ') : ''}`;
    const row = await dbAsync.get(sql, params);
    return row?.c ?? 0;
  },

  async update(id, updates) {
    const allowed = ['title', 'description', 'cover_image_url', 'duration_weeks', 'frequency_per_week'];
    const sets = [];
    const params = [];
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        sets.push(`${key} = ?`);
        params.push(updates[key]);
      }
    }
    if (!sets.length) return this.findById(id);
    params.push(id);
    await dbAsync.run(`UPDATE modules SET ${sets.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  },

  async remove(id) {
    await dbAsync.run(`DELETE FROM modules WHERE id = ?`, [id]);
  },
};