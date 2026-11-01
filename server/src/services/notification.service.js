import { dbAsync } from '../config/database.js';
import { NOTIFICATION_TYPES } from '../config/constants.js';

/**
 * Templates par type de notification.
 */
const TEMPLATES = {
  [NOTIFICATION_TYPES.SESSION_UNLOCKED]: (p) => ({
    title: '🔓 Nouvelle séance disponible',
    message: `La séance "${p.session_title}" du module "${p.module_title}" est ouverte.`,
    action_url: `/sessions/${p.session_id}`,
    icon: 'lock-open',
    color: 'blue',
  }),
  [NOTIFICATION_TYPES.QUIZ_PASSED]: (p) => ({
    title: '✅ Quiz réussi !',
    message: `Score : ${Math.round(p.score)}%. Vous pouvez passer à la suite.`,
    action_url: p.next_session_id ? `/sessions/${p.next_session_id}` : '/modules',
    icon: 'check',
    color: 'green',
  }),
  [NOTIFICATION_TYPES.QUIZ_FAILED]: (p) => ({
    title: '❌ Quiz échoué',
    message: `Score : ${Math.round(p.score)}% (minimum 60%). Tentatives restantes : ${p.attempts_left}.`,
    action_url: `/quiz/${p.quiz_id}`,
    icon: 'x',
    color: 'red',
  }),
  [NOTIFICATION_TYPES.MODULE_COMPLETED]: (p) => ({
    title: '🎓 Module terminé',
    message: `Félicitations ! Vous avez terminé "${p.module_title}".`,
    action_url: '/modules',
    icon: 'award',
    color: 'green',
  }),
  [NOTIFICATION_TYPES.FORMATION_COMPLETED]: () => ({
    title: '🏆 Formation terminée !',
    message: "Rendez-vous sur votre page d'orientation pour récupérer votre certificat.",
    action_url: '/orientation',
    icon: 'trophy',
    color: 'gold',
  }),
  [NOTIFICATION_TYPES.CERTIFICATE_ISSUED]: (p) => ({
    title: '📜 Certificat disponible',
    message: 'Votre certificat ALKHER ACADEMY est prêt à être téléchargé.',
    action_url: `/certificate/${p.uuid}`,
    icon: 'certificate',
    color: 'gold',
  }),
  [NOTIFICATION_TYPES.ENROLLMENT_VALIDATED]: (p) => ({
    title: '🎉 Inscription validée',
    message: p.message || 'Votre inscription est active.',
    action_url: '/dashboard',
    icon: 'check-circle',
    color: 'green',
  }),
  [NOTIFICATION_TYPES.FORUM_REPLY]: (p) => ({
    title: '💬 Nouvelle réponse au forum',
    message: `${p.author_name} a répondu à votre sujet "${p.post_title}".`,
    action_url: `/forum/${p.module_id}`,
    icon: 'message',
    color: 'blue',
  }),
  [NOTIFICATION_TYPES.SUPPORT_REPLY]: () => ({
    title: '📩 Réponse du support',
    message: "L'équipe pédagogique a répondu à votre ticket.",
    action_url: '/support',
    icon: 'mail',
    color: 'blue',
  }),
  [NOTIFICATION_TYPES.SCHOLARSHIP_PUBLISHED]: (p) => ({
    title: '💼 Nouvelle bourse disponible',
    message: `"${p.title}" — ${p.organization || 'ALKHER ACADEMY'}`,
    action_url: `/scholarships/${p.scholarship_id}`,
    icon: 'briefcase',
    color: 'gold',
  }),
  [NOTIFICATION_TYPES.SCHOLARSHIP_RESULT]: (p) => ({
    title: p.accepted ? '🎉 Candidature acceptée' : '📋 Candidature refusée',
    message: p.message,
    action_url: `/scholarships/${p.scholarship_id}`,
    icon: p.accepted ? 'check' : 'x',
    color: p.accepted ? 'green' : 'red',
  }),
};

export const notificationService = {
  /**
   * Crée une notification (sans émettre Socket.IO).
   */
  async create(learner_id, data) {
    let payload = { ...data };

    if (data.type && TEMPLATES[data.type] && (!data.title || !data.message)) {
      const tpl = TEMPLATES[data.type](data);
      payload = { ...tpl, ...data };
    }

    const result = await dbAsync.run(
      `INSERT INTO notifications
        (learner_id, type, title, message, action_url, icon, color)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        learner_id,
        payload.type,
        payload.title,
        payload.message,
        payload.action_url ?? null,
        payload.icon ?? null,
        payload.color ?? null,
      ]
    );

    return {
      id: result.lastInsertRowid,
      learner_id,
      ...payload,
      is_read: 0,
    };
  },

  /**
   * Émet via Socket.IO.
   */
  emit(io, learner_id, notification) {
    if (!io) return;
    io.to(`notif:learner:${learner_id}`).emit('notification', notification);
  },

  async listForLearner(learner_id, { unread, limit = 20 } = {}) {
    const where = ['learner_id = ?'];
    const params = [learner_id];
    if (unread) { where.push('is_read = 0'); }
    const sql = `
      SELECT * FROM notifications
      WHERE ${where.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT ?
    `;
    params.push(limit);
    return dbAsync.all(sql, params);
  },

  async countUnread(learner_id) {
    const row = await dbAsync.get(
      `SELECT COUNT(*) AS c FROM notifications WHERE learner_id = ? AND is_read = 0`,
      [learner_id]
    );
    return row?.c ?? 0;
  },

  async markRead(learner_id, notification_id) {
    await dbAsync.run(
      `UPDATE notifications SET is_read = 1, read_at = datetime('now')
       WHERE id = ? AND learner_id = ?`,
      [notification_id, learner_id]
    );
  },

  async markAllRead(learner_id) {
    await dbAsync.run(
      `UPDATE notifications SET is_read = 1, read_at = datetime('now')
       WHERE learner_id = ? AND is_read = 0`,
      [learner_id]
    );
  },
};