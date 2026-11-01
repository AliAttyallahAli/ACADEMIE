import { dbAsync } from '../config/database.js';

export const sessionRepo = {
  async createMany(module_id, sessions) {
    const stmt = `
      INSERT INTO sessions (module_id, session_number, title, content, content_type, scheduled_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    for (const s of sessions) {
      await dbAsync.run(stmt, [
        module_id,
        s.session_number,
        s.title ?? null,
        s.content ?? null,
        s.content_type ?? 'text',
        s.scheduled_date,
      ]);
    }
  },

  async findByModule(module_id) {
    return dbAsync.all(
      `SELECT s.*,
        (SELECT q.id FROM quizzes q WHERE q.session_id = s.id) AS quiz_id
       FROM sessions s
       WHERE s.module_id = ?
       ORDER BY s.session_number ASC`,
      [module_id]
    );
  },

  async findById(id) {
    return dbAsync.get(`SELECT * FROM sessions WHERE id = ?`, [id]);
  },

  async update(id, updates) {
    const allowed = ['title', 'content', 'content_type', 'scheduled_date'];
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
    await dbAsync.run(`UPDATE sessions SET ${sets.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  },

  async remove(id) {
    await dbAsync.run(`DELETE FROM sessions WHERE id = ?`, [id]);
  },

  async countByModule(module_id) {
    const row = await dbAsync.get(
      `SELECT COUNT(*) AS c FROM sessions WHERE module_id = ?`,
      [module_id]
    );
    return row?.c ?? 0;
  },
};