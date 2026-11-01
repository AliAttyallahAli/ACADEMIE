import { dbAsync } from '../config/database.js';

export const progressRepo = {
  /**
   * Initialise la progression d'une apprenante pour un module.
   * La première séance est débloquée, les autres verrouillées.
   */
  async initializeForEnrollment(learner_id, sessions) {
    const stmt = `
      INSERT OR IGNORE INTO session_progress (learner_id, session_id, is_unlocked)
      VALUES (?, ?, ?)
    `;
    for (let i = 0; i < sessions.length; i++) {
      await dbAsync.run(stmt, [learner_id, sessions[i].id, i === 0 ? 1 : 0]);
    }
  },

  /**
   * Récupère la progression d'une apprenante sur une séance donnée.
   */
  async findByLearnerSession(learner_id, session_id) {
    return dbAsync.get(
      `SELECT * FROM session_progress WHERE learner_id = ? AND session_id = ?`,
      [learner_id, session_id]
    );
  },

  /**
   * Débloque une séance spécifique (si elle est encore verrouillée).
   */
  async unlockSession(learner_id, session_id) {
    await dbAsync.run(
      `UPDATE session_progress
       SET is_unlocked = 1, unlocked_at = datetime('now')
       WHERE learner_id = ? AND session_id = ? AND is_unlocked = 0`,
      [learner_id, session_id]
    );
  },

  /**
   * Alias de unlockSession (utilisé dans les services).
   */
  async unlockNext(learner_id, session_id) {
    return this.unlockSession(learner_id, session_id);
  },

  /**
   * Marque une séance comme complétée.
   */
  async markCompleted(learner_id, session_id) {
    await dbAsync.run(
      `UPDATE session_progress
       SET is_completed = 1, completed_at = datetime('now')
       WHERE learner_id = ? AND session_id = ?`,
      [learner_id, session_id]
    );
  },

  /**
   * Compte le nombre de séances validées par une apprenante (tous modules confondus).
   */
  async countForLearner(learner_id) {
    const row = await dbAsync.get(
      `SELECT COUNT(*) AS c FROM session_progress
       WHERE learner_id = ? AND is_completed = 1`,
      [learner_id]
    );
    return row?.c ?? 0;
  },

  /**
   * Compte le nombre de séances validées sur un module donné.
   */
  async countCompletedByModule(learner_id, module_id) {
    const row = await dbAsync.get(
      `SELECT COUNT(*) AS c
       FROM session_progress sp
       JOIN sessions s ON s.id = sp.session_id
       WHERE sp.learner_id = ? AND s.module_id = ? AND sp.is_completed = 1`,
      [learner_id, module_id]
    );
    return row?.c ?? 0;
  },

  /**
   * Retourne toute la progression d'une apprenante sur un module.
   */
  async listByModule(learner_id, module_id) {
    return dbAsync.all(
      `SELECT sp.*, s.session_number, s.title, s.scheduled_date
       FROM session_progress sp
       JOIN sessions s ON s.id = sp.session_id
       WHERE sp.learner_id = ? AND s.module_id = ?
       ORDER BY s.session_number`,
      [learner_id, module_id]
    );
  },

  /**
   * Retourne la prochaine séance non complétée d'une apprenante (tous modules confondus).
   * Priorité aux séances débloquées, puis par date croissante.
   */
  async findNextSession(learner_id) {
    return dbAsync.get(
      `SELECT s.id, s.title, s.scheduled_date, s.session_number,
              m.title AS module_title, m.id AS module_id,
              sp.is_unlocked, sp.is_completed
       FROM session_progress sp
       JOIN sessions s ON s.id = sp.session_id
       JOIN modules m ON m.id = s.module_id
       WHERE sp.learner_id = ?
         AND sp.is_completed = 0
       ORDER BY
         CASE WHEN sp.is_unlocked = 1 THEN 0 ELSE 1 END,
         s.scheduled_date ASC
       LIMIT 1`,
      [learner_id]
    );
  },

  /**
   * Vérifie si une apprenante a complété TOUTES les séances d'un module.
   */
  async isModuleCompleted(learner_id, module_id) {
    const row = await dbAsync.get(
      `SELECT
        (SELECT COUNT(*) FROM sessions WHERE module_id = ?) AS total,
        (SELECT COUNT(*) FROM session_progress sp
         JOIN sessions s ON s.id = sp.session_id
         WHERE sp.learner_id = ? AND s.module_id = ? AND sp.is_completed = 1) AS done`,
      [module_id, learner_id, module_id]
    );
    return row.total > 0 && row.total === row.done;
  },
};