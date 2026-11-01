import { dbAsync } from '../config/database.js';

export const adminRepo = {
  async findByEmail(email) {
    return dbAsync.get(`SELECT * FROM admins WHERE email = ?`, [email]);
  },

  async findById(id) {
    return dbAsync.get(
      `SELECT id, full_name, email, created_at FROM admins WHERE id = ?`,
      [id]
    );
  },

  async create({ full_name, email, password_hash }) {
    const result = await dbAsync.run(
      `INSERT INTO admins (full_name, email, password_hash) VALUES (?, ?, ?)`,
      [full_name, email, password_hash]
    );
    return result.lastInsertRowid;
  },
};