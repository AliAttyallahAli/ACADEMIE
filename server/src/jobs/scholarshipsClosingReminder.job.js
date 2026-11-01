import cron from 'node-cron';
import { logger } from '../utils/logger.js';

export function startScholarshipReminderJob() {
  cron.schedule('0 8 * * *', async () => {
    logger.info('⏰ [cron] Rappel clôture bourses');
    // Logique à venir : rappel 3 jours avant closing_date
  });
}