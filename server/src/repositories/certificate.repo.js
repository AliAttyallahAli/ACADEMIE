import { dbAsync } from '../config/database.js';

export const certificateRepo = {
  async create({ certificate_uuid, learner_id, modules_snapshot, verify_signature }) {
    const result = await dbAsync.run(
      `INSERT INTO certificates
        (certificate_uuid, learner_id, modules_snapshot, verify_signature)
       VALUES (?, ?, ?, ?)`,
      [certificate_uuid, learner_id, modules_snapshot, verify_signature]
    );
    return result.lastInsertRowid;
  },

  async findByUuid(uuid) {
    return dbAsync.get(
      `SELECT * FROM certificates WHERE certificate_uuid = ?`,
      [uuid]
    );
  },

  async findByLearner(learner_id) {
    return dbAsync.all(
      `SELECT * FROM certificates WHERE learner_id = ?
       ORDER BY issued_at DESC`,
      [learner_id]
    );
  },

  async findLatestByLearner(learner_id) {
    return dbAsync.get(
      `SELECT * FROM certificates WHERE learner_id = ?
       ORDER BY issued_at DESC LIMIT 1`,
      [learner_id]
    );
  },

  async existsForLearner(learner_id) {
    const row = await dbAsync.get(
      `SELECT id FROM certificates WHERE learner_id = ? LIMIT 1`,
      [learner_id]
    );
    return !!row;
  },
};