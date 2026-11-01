/**
 * Calcule les dates de séances selon la fréquence hebdomadaire.
 * @param {string} startDate - Format YYYY-MM-DD
 * @param {number} frequencyPerWeek - ex: 2
 * @param {number} totalSessions - ex: 8
 * @returns {string[]} dates au format YYYY-MM-DD
 */
export function calculateSessionDates(startDate, frequencyPerWeek, totalSessions) {
  if (frequencyPerWeek < 1 || frequencyPerWeek > 7) {
    throw new Error('frequencyPerWeek doit être entre 1 et 7');
  }
  const intervalDays = 7 / frequencyPerWeek;
  const start = new Date(startDate);
  const dates = [];

  for (let i = 0; i < totalSessions; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + Math.round(i * intervalDays));
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}