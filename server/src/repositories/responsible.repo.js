import { dbAsync } from '../config/database.js';

export const responsibleRepo = {
  async findByEmail(email) {
    return dbAsync.get(
      `SELECT * FROM responsibles WHERE email = ? AND is_active = 1`,
      [email]
    );
  },

  async findById(id) {
    return dbAsync.get(
      `SELECT id, full_name, email, role, permissions_json,
              is_active, last_login_at, created_at
       FROM responsibles WHERE id = ?`,
      [id]
    );
  },

  async create({
    full_name,
    email,
    password_hash,
    role,
    permissions_json,
    created_by_admin_id,
  }) {
    const result = await dbAsync.run(
      `INSERT INTO responsibles
        (full_name, email, password_hash, role, permissions_json, created_by_admin_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [full_name, email, password_hash, role, permissions_json, created_by_admin_id]
    );
    return result.lastInsertRowid;
  },

  async updateLastLogin(id) {
    await dbAsync.run(
      `UPDATE responsibles SET last_login_at = datetime('now') WHERE id = ?`,
      [id]
    );
  },

  async setActive(id, is_active) {
    await dbAsync.run(
      `UPDATE responsibles SET is_active = ? WHERE id = ?`,
      [is_active ? 1 : 0, id]
    );
  },

  async updatePassword(id, password_hash) {
    await dbAsync.run(
      `UPDATE responsibles SET password_hash = ? WHERE id = ?`,
      [password_hash, id]
    );
  },

  async findAll({ role, is_active, search, limit = 50, offset = 0 }) {
    const where = [];
    const params = [];
    if (role) { where.push('role = ?'); params.push(role); }
    if (is_active !== undefined) { where.push('is_active = ?'); params.push(is_active ? 1 : 0); }
    if (search) {
      where.push('(full_name LIKE ? OR email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    const sql = `
      SELECT id, full_name, email, role, permissions_json,
             is_active, last_login_at, created_at
      FROM responsibles
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);
    return dbAsync.all(sql, params);
  },

  async count({ role, is_active }) {
    const where = [];
    const params = [];
    if (role) { where.push('role = ?'); params.push(role); }
    if (is_active !== undefined) { where.push('is_active = ?'); params.push(is_active ? 1 : 0); }
    const sql = `SELECT COUNT(*) AS c FROM responsibles ${where.length ? 'WHERE ' + where.join(' AND ') : ''}`;
    const row = await dbAsync.get(sql, params);
    return row?.c ?? 0;
  },
};