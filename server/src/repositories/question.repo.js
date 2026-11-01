import { dbAsync } from '../config/database.js';

export const questionRepo = {
  async createMany(quiz_id, questions) {
    const created = [];
    for (const q of questions) {
      const res = await dbAsync.run(
        `INSERT INTO questions (quiz_id, question_text, question_type, points)
         VALUES (?, ?, ?, ?)`,
        [quiz_id, q.question_text, q.question_type, q.points ?? 1]
      );
      const questionId = res.lastInsertRowid;

      for (const opt of q.options) {
        await dbAsync.run(
          `INSERT INTO options (question_id, option_text, is_correct)
           VALUES (?, ?, ?)`,
          [questionId, opt.option_text, opt.is_correct ? 1 : 0]
        );
      }
      created.push(questionId);
    }
    return created;
  },

  async findByQuiz(quiz_id) {
    const questions = await dbAsync.all(
      `SELECT * FROM questions WHERE quiz_id = ? ORDER BY id ASC`,
      [quiz_id]
    );
    for (const q of questions) {
      q.options = await dbAsync.all(
        `SELECT * FROM options WHERE question_id = ? ORDER BY id ASC`,
        [q.id]
      );
    }
    return questions;
  },

  async findById(id) {
    const q = await dbAsync.get(`SELECT * FROM questions WHERE id = ?`, [id]);
    if (q) {
      q.options = await dbAsync.all(
        `SELECT * FROM options WHERE question_id = ? ORDER BY id ASC`,
        [id]
      );
    }
    return q;
  },

  async remove(id) {
    await dbAsync.run(`DELETE FROM questions WHERE id = ?`, [id]);
  },

  async removeByQuiz(quiz_id) {
    await dbAsync.run(`DELETE FROM questions WHERE quiz_id = ?`, [quiz_id]);
  },

  async countByQuiz(quiz_id) {
    const row = await dbAsync.get(
      `SELECT COUNT(*) AS c FROM questions WHERE quiz_id = ?`,
      [quiz_id]
    );
    return row?.c ?? 0;
  },
};