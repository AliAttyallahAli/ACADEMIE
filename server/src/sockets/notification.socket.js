import { logger } from '../utils/logger.js';

export function registerNotificationSocket(io) {
  io.on('connection', (socket) => {
    // Le client envoie son { type, id } pour rejoindre sa room
    socket.on('join', ({ type, id }) => {
      const room = `notif:${type}:${id}`;
      socket.join(room);
      logger.info(`🔌 Socket ${socket.id} → room ${room}`);
    });

    socket.on('disconnect', () => {});
  });
}

/**
 * Émet une notification vers une room utilisateur.
 */
export function emitNotification(io, { type, id }, payload) {
  if (!io) return;
  io.to(`notif:${type}:${id}`).emit('notification', payload);
}