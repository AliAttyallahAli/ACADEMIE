import { notificationService } from '../services/notification.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const notificationController = {
  /**
   * GET /api/notifications
   * Query : ?unread=true&limit=20
   */
  list: asyncHandler(async (req, res) => {
    const unread = req.query.unread === 'true';
    const limit = Number(req.query.limit) || 20;

    const items = await notificationService.listForLearner(req.user.id, {
      unread,
      limit,
    });
    const unreadCount = await notificationService.countUnread(req.user.id);

    res.json({
      items,
      unread_count: unreadCount,
    });
  }),

  /**
   * GET /api/notifications/count
   * Retourne uniquement le compteur (badge cloche).
   */
  count: asyncHandler(async (req, res) => {
    const unread = await notificationService.countUnread(req.user.id);
    res.json({ unread });
  }),

  /**
   * POST /api/notifications/:id/read
   */
  markRead: asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    await notificationService.markRead(req.user.id, id);
    const unread = await notificationService.countUnread(req.user.id);
    res.json({ success: true, unread_count: unread });
  }),

  /**
   * POST /api/notifications/read-all
   */
  markAllRead: asyncHandler(async (req, res) => {
    await notificationService.markAllRead(req.user.id);
    res.json({ success: true, unread_count: 0 });
  }),

  /**
   * DELETE /api/notifications/:id
   */
  remove: asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { dbAsync } = await import('../config/database.js');
    await dbAsync.run(
      `DELETE FROM notifications WHERE id = ? AND learner_id = ?`,
      [id, req.user.id]
    );
    res.json({ success: true, deleted: true });
  }),
};