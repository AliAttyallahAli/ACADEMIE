import { dbAsync } from '../config/database.js';

export const enrollmentRepo = {
  /**
   * Crée une nouvelle inscription.
   */
  async create({ learner_id, module_id, start_date, payment_status = 'pending' }) {
    const result = await dbAsync.run(
      `INSERT INTO enrollments (learner_id, module_id, start_date, payment_status)
       VALUES (?, ?, ?, ?)`,
      [learner_id, module_id, start_date, payment_status]
    );
    return result.lastInsertRowid;
  },

  /**
   * Récupère une inscription par son ID avec les infos jointes.
   */
  async findById(id) {
    return dbAsync.get(
      `SELECT e.*, l.full_name AS learner_name, l.email AS learner_email,
              m.title AS module_title, m.duration_weeks, m.frequency_per_week
       FROM enrollments e
       JOIN learners l ON l.id = e.learner_id
       JOIN modules m ON m.id = e.module_id
       WHERE e.id = ?`,
      [id]
    );
  },

  /**
   * Vérifie si une apprenante est déjà inscrite à un module.
   */
  async findByLearnerModule(learner_id, module_id) {
    return dbAsync.get(
      `SELECT * FROM enrollments WHERE learner_id = ? AND module_id = ?`,
      [learner_id, module_id]
    );
  },

  /**
   * Liste les inscriptions d'une apprenante (toutes).
   */
  async findByLearner(learner_id) {
    return dbAsync.all(
      `SELECT e.*, m.title AS module_title, m.duration_weeks,
              m.frequency_per_week, m.cover_image_url
       FROM enrollments e
       JOIN modules m ON m.id = e.module_id
       WHERE e.learner_id = ?
       ORDER BY e.enrolled_at DESC`,
      [learner_id]
    );
  },

  /**
   * Liste les inscriptions en attente de validation (pour l'admin).
   */
  async findPending({ limit = 50, offset = 0 } = {}) {
    return dbAsync.all(
      `SELECT e.*, l.full_name AS learner_name, l.email AS learner_email,
              l.birth_date, m.title AS module_title
       FROM enrollments e
       JOIN learners l ON l.id = e.learner_id
       JOIN modules m ON m.id = e.module_id
       WHERE e.payment_status = 'pending'
       ORDER BY e.enrolled_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
  },

  /**
   * Compte les inscriptions en attente.
   */
  async countPending() {
    const row = await dbAsync.get(
      `SELECT COUNT(*) AS c FROM enrollments WHERE payment_status = 'pending'`
    );
    return row?.c ?? 0;
  },

  /**
   * Liste complète filtrable (pour l'admin).
   */
  async findAll({ status, module_id, learner_id, limit = 50, offset = 0 } = {}) {
    const where = [];
    const params = [];
    if (status) { where.push('e.payment_status = ?'); params.push(status); }
    if (module_id) { where.push('e.module_id = ?'); params.push(module_id); }
    if (learner_id) { where.push('e.learner_id = ?'); params.push(learner_id); }

    const sql = `
      SELECT e.*, l.full_name AS learner_name, l.email AS learner_email,
             m.title AS module_title
      FROM enrollments e
      JOIN learners l ON l.id = e.learner_id
      JOIN modules m ON m.id = e.module_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY e.enrolled_at DESC
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);
    return dbAsync.all(sql, params);
  },

  /**
   * Compte total des inscriptions avec filtres.
   */
  async count({ status } = {}) {
    const where = [];
    const params = [];
    if (status) { where.push('payment_status = ?'); params.push(status); }
    const sql = `SELECT COUNT(*) AS c FROM enrollments ${where.length ? 'WHERE ' + where.join(' AND ') : ''}`;
    const row = await dbAsync.get(sql, params);
    return row?.c ?? 0;
  },

  /**
   * Marque une inscription comme payée (validation AlkherPay ou admin).
   */
  async markPaid(id, { validated_by, validated_by_admin_id, validation_note }) {
    await dbAsync.run(
      `UPDATE enrollments
       SET payment_status = 'paid',
           validated_by = ?,
           validated_by_admin_id = ?,
           validation_note = ?,
           validated_at = datetime('now')
       WHERE id = ?`,
      [validated_by, validated_by_admin_id ?? null, validation_note ?? null, id]
    );
  },

  /**
   * Rejette une inscription.
   */
  async markRejected(id, { note, admin_id }) {
    await dbAsync.run(
      `UPDATE enrollments
       SET payment_status = 'rejected',
           validation_note = ?,
           validated_by = 'admin',
           validated_by_admin_id = ?,
           validated_at = datetime('now')
       WHERE id = ?`,
      [note ?? 'Rejetée par admin', admin_id, id]
    );
  },

  /**
   * Enregistre la référence de paiement AlkherPay.
   */
  async setPaymentRef(id, payment_ref) {
    await dbAsync.run(
      `UPDATE enrollments SET payment_ref = ? WHERE id = ?`,
      [payment_ref, id]
    );
  },

  /**
   * Marque un module comme terminé pour une apprenante.
   */
  async markCompleted(id) {
    await dbAsync.run(
      `UPDATE enrollments
       SET status = 'completed', completed_at = datetime('now')
       WHERE id = ?`,
      [id]
    );
  },

  /**
   * Vérifie si une apprenante a complété tous ses modules payés.
   */
  async isAllModulesCompleted(learner_id) {
    const row = await dbAsync.get(
      `SELECT
        (SELECT COUNT(*) FROM enrollments WHERE learner_id = ? AND payment_status = 'paid') AS total,
        (SELECT COUNT(*) FROM enrollments WHERE learner_id = ? AND status = 'completed') AS done`,
      [learner_id, learner_id]
    );
    return row.total > 0 && row.total === row.done;
  },
};