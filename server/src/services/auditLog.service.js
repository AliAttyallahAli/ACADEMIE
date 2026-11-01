import { dbAsync } from '../config/database.js';
import { logger } from '../utils/logger.js';

export const auditLogService = {
  /**
   * Enregistre une action dans le journal d'audit.
   * @param {Object} actor - { type: 'admin'|'responsible'|'system', id, name }
   * @param {string} action - ex: 'validate_enrollment'
   * @param {Object} target - { type: 'enrollment', id: 12 }
   * @param {Object} details - objet libre
   */
  async log(actor, action, target = {}, details = {}) {
    try {
      await dbAsync.run(
        `INSERT INTO admin_actions_log
          (actor_type, actor_id, actor_name, action_type,
           target_type, target_id, details_json)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          actor.type,
          actor.id,
          actor.name || null,
          action,
          target.type || null,
          target.id || null,
          JSON.stringify(details),
        ]
      );
    } catch (e) {
      logger.error('Erreur audit log :', e.message);
    }
  },

  async findAll({ actor_type, actor_id, action_type, limit = 50, offset = 0 }) {
    const where = [];
    const params = [];

    if (actor_type) { where.push('actor_type = ?'); params.push(actor_type); }
    if (actor_id) { where.push('actor_id = ?'); params.push(actor_id); }
    if (action_type) { where.push('action_type = ?'); params.push(action_type); }

    const sql = `
      SELECT * FROM admin_actions_log
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);
    return dbAsync.all(sql, params);
  },

  async count({ actor_type, actor_id, action_type }) {
    const where = [];
    const params = [];
    if (actor_type) { where.push('actor_type = ?'); params.push(actor_type); }
    if (actor_id) { where.push('actor_id = ?'); params.push(actor_id); }
    if (action_type) { where.push('action_type = ?'); params.push(action_type); }

    const sql = `SELECT COUNT(*) AS c FROM admin_actions_log ${where.length ? 'WHERE ' + where.join(' AND ') : ''}`;
    const row = await dbAsync.get(sql, params);
    return row?.c ?? 0;
  },
};