import { dbAsync } from '../config/database.js';
import { notificationService } from './notification.service.js';
import { NOTIFICATION_TYPES } from '../config/constants.js';
import { auditLogService } from './auditLog.service.js';

export const supportService = {
  // ─── Apprenante ───
  async createTicket({ learner_id, subject, message }) {
    const result = await dbAsync.run(
      `INSERT INTO support_tickets (learner_id, subject, message, status)
       VALUES (?, ?, ?, 'open')`,
      [learner_id, subject, message]
    );
    return dbAsync.get(`SELECT * FROM support_tickets WHERE id = ?`, [result.lastInsertRowid]);
  },

  async listMyTickets(learner_id) {
    return dbAsync.all(
      `SELECT * FROM support_tickets WHERE learner_id = ? ORDER BY created_at DESC`,
      [learner_id]
    );
  },

  async getTicketDetail(id, learner_id) {
    const ticket = await dbAsync.get(
      `SELECT * FROM support_tickets WHERE id = ? AND learner_id = ?`,
      [id, learner_id]
    );
    if (!ticket) {
      const err = new Error('Ticket introuvable');
      err.status = 404;
      throw err;
    }
    return ticket;
  },

  // ─── Admin / Responsable ───
  async listAllTickets({ status } = {}) {
    const where = [];
    const params = [];
    if (status) { where.push('st.status = ?'); params.push(status); }

    return dbAsync.all(
      `SELECT st.*, l.full_name AS learner_name, l.email AS learner_email
       FROM support_tickets st
       JOIN learners l ON l.id = st.learner_id
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY 
         CASE WHEN st.status = 'open' THEN 0 ELSE 1 END,
         st.created_at DESC`,
      params
    );
  },

  async replyToTicket(ticket_id, { reply }, actor, io) {
    const ticket = await dbAsync.get(
      `SELECT * FROM support_tickets WHERE id = ?`,
      [ticket_id]
    );
    if (!ticket) {
      const err = new Error('Ticket introuvable');
      err.status = 404;
      throw err;
    }

    // Mettre à jour statut + réponse (append)
    const newMessage = `${ticket.message}\n\n───────────────\n\n💬 Réponse (${new Date().toLocaleDateString('fr-FR')}):\n${reply}`;
    await dbAsync.run(
      `UPDATE support_tickets SET message = ?, status = 'replied' WHERE id = ?`,
      [newMessage, ticket_id]
    );

    // Notifier l'apprenante
    const notif = await notificationService.create(ticket.learner_id, {
      type: NOTIFICATION_TYPES.SUPPORT_REPLY,
    });
    if (io) notificationService.emit(io, ticket.learner_id, notif);

    await auditLogService.log(
      { type: actor.type, id: actor.id, name: actor.name },
      'reply_support_ticket',
      { type: 'support_ticket', id: ticket_id },
      {}
    );

    return dbAsync.get(`SELECT * FROM support_tickets WHERE id = ?`, [ticket_id]);
  },

  async closeTicket(ticket_id, actor) {
    await dbAsync.run(
      `UPDATE support_tickets SET status = 'closed' WHERE id = ?`,
      [ticket_id]
    );
    await auditLogService.log(
      { type: actor.type, id: actor.id, name: actor.name },
      'close_support_ticket',
      { type: 'support_ticket', id: ticket_id },
      {}
    );
    return { closed: true };
  },
};