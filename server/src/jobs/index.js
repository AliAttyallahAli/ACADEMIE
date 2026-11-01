import { startDailyUnlockJob } from './dailyUnlock.job.js';
import { startScholarshipReminderJob } from './scholarshipsClosingReminder.job.js';

export function startJobs() {
  startDailyUnlockJob();
  startScholarshipReminderJob();
}