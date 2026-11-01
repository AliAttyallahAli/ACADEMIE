import cron from 'node-cron';
import { dbAsync } from '../config/database.js';
import { notificationService } from '../services/notification.service.js';
import { NOTIFICATION_TYPES } from '../config/constants.js';
import { logger } from '../utils/logger.js';

export function startDailyUnlockJob() {
  // Tous les jours à 6h00
  cron.schedule('0 6 * * *', async () => {
    logger.info('⏰ [cron] Déblocage quotidien des séances');

    const today = new Date().toISOString().split('T')[0];

    try {
      // 1. Séances dont la date est atteinte mais pas encore débloquées
      //    ET dont la séance précédente est complétée (ou c'est la 1re)
      const sessionsToUnlock = await dbAsync.all(
        `SELECT sp.id AS progress_id, sp.learner_id, sp.session_id,
                s.title AS session_title, s.session_number, s.module_id,
                m.title AS module_title
         FROM session_progress sp
         JOIN sessions s ON s.id = sp.session_id
         JOIN modules m ON m.id = s.module_id
         JOIN enrollments e ON e.learner_id = sp.learner_id
                             AND e.module_id = s.module_id
                             AND e.payment_status = 'paid'
         WHERE s.scheduled_date <= ?
           AND sp.is_unlocked = 0
           AND sp.is_completed = 0
           AND (
             s.session_number = 1
             OR EXISTS (
               SELECT 1 FROM session_progress prev
               JOIN sessions prev_s ON prev_s.id = prev.session_id
               WHERE prev.learner_id = sp.learner_id
                 AND prev_s.module_id = s.module_id
                 AND prev_s.session_number = s.session_number - 1
                 AND prev.is_completed = 1
             )
           )`,
        [today]
      );

      if (!sessionsToUnlock.length) {
        logger.info('[cron] Aucune séance à débloquer aujourd\'hui.');
        return;
      }

      // 2. Débloquer + notifier
      for (const row of sessionsToUnlock) {
        await dbAsync.run(
          `UPDATE session_progress
           SET is_unlocked = 1, unlocked_at = datetime('now')
           WHERE id = ?`,
          [row.progress_id]
        );

        const notif = await notificationService.create(row.learner_id, {
          type: NOTIFICATION_TYPES.SESSION_UNLOCKED,
          session_title: row.session_title,
          module_title: row.module_title,
          session_id: row.session_id,
        });

        // Émission temps réel via socket global (optionnel)
        if (global.__io) {
          notificationService.emit(global.__io, row.learner_id, notif);
        }
      }

      logger.success(
        `[cron] ${sessionsToUnlock.length} séance(s) débloquée(s) + notifications envoyées.`
      );
    } catch (e) {
      logger.error('[cron] Erreur dailyUnlock :', e.message);
    }
  });

  logger.info('⏰ Job dailyUnlock démarré (tous les jours à 6h00)');
}