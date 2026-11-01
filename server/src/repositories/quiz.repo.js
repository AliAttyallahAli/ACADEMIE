import { dbAsync } from '../config/database.js';

export const quizRepo = {
  async createOrUpdate(session_id, { pass_threshold, max_attempts }) {
    const existing = await dbAsync.get(
      `SELECT id FROM quizzes WHERE session_id = ?`,
      [session_id]
    );
    if (existing) {
      await dbAsync.run(
        `UPDATE quizzes SET pass_threshold = ?, max_attempts = ? WHERE id = ?`,
        [pass_threshold ?? 60, max_attempts ?? 3, existing.id]
      );
      return existing.id;
    }
    const result = await dbAsync.run(
      `INSERT INTO quizzes (session_id, pass_threshold, max_attempts) VALUES (?, ?, ?)`,
      [session_id, pass_threshold ?? 60, max_attempts ?? 3]
    );
    return result.lastInsertRowid;
  },

  async findBySession(session_id) {
    return dbAsync.get(`SELECT * FROM quizzes WHERE session_id = ?`, [session_id]);
  },

  async findById(id) {
    return dbAsync.get(`SELECT * FROM quizzes WHERE id = ?`, [id]);
  },

  async removeBySession(session_id) {
    await dbAsync.run(`DELETE FROM quizzes WHERE session_id = ?`, [session_id]);
  },
};