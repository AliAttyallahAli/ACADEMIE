import { dbAsync } from '../config/database.js';

export const forumRepo = {
  async createPost({ module_id, learner_id, parent_id, content }) {
    const result = await dbAsync.run(
      `INSERT INTO forum_posts (module_id, learner_id, parent_id, content)
       VALUES (?, ?, ?, ?)`,
      [module_id, learner_id, parent_id ?? null, content]
    );
    return result.lastInsertRowid;
  },

  async findPostById(id) {
    return dbAsync.get(
      `SELECT fp.*, l.full_name AS author_name, l.profile_photo_url AS author_photo,
              m.title AS module_title
       FROM forum_posts fp
       JOIN learners l ON l.id = fp.learner_id
       JOIN modules m ON m.id = fp.module_id
       WHERE fp.id = ?`,
      [id]
    );
  },

  async listByModule(module_id) {
    // Posts racines (sujets)
    const roots = await dbAsync.all(
      `SELECT fp.*, l.full_name AS author_name, l.profile_photo_url AS author_photo,
              (SELECT COUNT(*) FROM forum_posts r WHERE r.parent_id = fp.id) AS replies_count
       FROM forum_posts fp
       JOIN learners l ON l.id = fp.learner_id
       WHERE fp.module_id = ? AND fp.parent_id IS NULL
       ORDER BY fp.created_at DESC`,
      [module_id]
    );
    return roots;
  },

  async listReplies(parent_id) {
    return dbAsync.all(
      `SELECT fp.*, l.full_name AS author_name, l.profile_photo_url AS author_photo
       FROM forum_posts fp
       JOIN learners l ON l.id = fp.learner_id
       WHERE fp.parent_id = ?
       ORDER BY fp.created_at ASC`,
      [parent_id]
    );
  },

  async deletePost(id) {
    // Supprime aussi les réponses (cascade manuelle)
    await dbAsync.run(`DELETE FROM forum_posts WHERE parent_id = ?`, [id]);
    await dbAsync.run(`DELETE FROM forum_posts WHERE id = ?`, [id]);
  },

  async countByModule(module_id) {
    const row = await dbAsync.get(
      `SELECT COUNT(*) AS c FROM forum_posts WHERE module_id = ? AND parent_id IS NULL`,
      [module_id]
    );
    return row?.c ?? 0;
  },

  async countAll() {
    const row = await dbAsync.get(`SELECT COUNT(*) AS c FROM forum_posts WHERE parent_id IS NULL`);
    return row?.c ?? 0;
  },
};