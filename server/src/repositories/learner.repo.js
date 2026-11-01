import { dbAsync } from '../config/database.js';

export const learnerRepo = {
  async findByEmail(email) {
    return dbAsync.get(
      `SELECT * FROM learners WHERE email = ?`,
      [email]
    );
  },

  async findById(id) {
    return dbAsync.get(
      `SELECT id, full_name, email, birth_date, phone, country,
              bio, profile_photo_url, created_at
       FROM learners WHERE id = ?`,
      [id]
    );
  },

  async findByIdWithPassword(id) {
    return dbAsync.get(`SELECT * FROM learners WHERE id = ?`, [id]);
  },

  async create({ full_name, birth_date, email, password_hash }) {
    const result = await dbAsync.run(
      `INSERT INTO learners (full_name, birth_date, email, password_hash)
       VALUES (?, ?, ?, ?)`,
      [full_name, birth_date, email, password_hash]
    );
    return result.lastInsertRowid;
  },

  async updateLastLogin(id) {
    await dbAsync.run(
      `UPDATE learners SET updated_at = datetime('now') WHERE id = ?`,
      [id]
    );
  },

  async updateProfile(id, { full_name, phone, country, bio }) {
    await dbAsync.run(
      `UPDATE learners
       SET full_name = COALESCE(?, full_name),
           phone = COALESCE(?, phone),
           country = COALESCE(?, country),
           bio = COALESCE(?, bio),
           updated_at = datetime('now')
       WHERE id = ?`,
      [full_name ?? null, phone ?? null, country ?? null, bio ?? null, id]
    );
  },

  async updatePassword(id, password_hash) {
    await dbAsync.run(
      `UPDATE learners SET password_hash = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [password_hash, id]
    );
  },

  async updatePhoto(id, profile_photo_url) {
    await dbAsync.run(
      `UPDATE learners SET profile_photo_url = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [profile_photo_url, id]
    );
  },

  async deletePhoto(id) {
    await dbAsync.run(
      `UPDATE learners SET profile_photo_url = NULL, updated_at = datetime('now')
       WHERE id = ?`,
      [id]
    );
  },
};