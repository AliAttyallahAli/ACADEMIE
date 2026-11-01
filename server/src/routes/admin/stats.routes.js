import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { dbAsync } from '../../config/database.js';

const router = Router();

/**
 * GET /api/admin/stats
 * Stats agrégées pour le dashboard admin.
 */
router.get('/', asyncHandler(async (req, res) => {
  // ─── Compteurs généraux ───
  const [modulesCount, learnersCount, enrollmentsCount, certificatesCount] = await Promise.all([
    dbAsync.get('SELECT COUNT(*) AS c FROM modules'),
    dbAsync.get('SELECT COUNT(*) AS c FROM learners'),
    dbAsync.get('SELECT COUNT(*) AS c FROM enrollments'),
    dbAsync.get('SELECT COUNT(*) AS c FROM certificates'),
  ]);

  // ─── Répartition des inscriptions ───
  const enrollmentStats = await dbAsync.all(
    `SELECT payment_status AS status, COUNT(*) AS count
     FROM enrollments GROUP BY payment_status`
  );
  const enrollmentsByStatus = {
    paid: 0, pending: 0, rejected: 0,
    ...Object.fromEntries(enrollmentStats.map((e) => [e.status, e.count])),
  };

  // ─── Inscriptions par mois (12 derniers mois) ───
  const enrollmentsByMonth = await dbAsync.all(
    `SELECT strftime('%Y-%m', enrolled_at) AS month, COUNT(*) AS count
     FROM enrollments
     WHERE enrolled_at >= date('now', '-12 months')
     GROUP BY month
     ORDER BY month ASC`
  );

  // ─── Progression globale (répartition) ───
  const progressRows = await dbAsync.all(
    `SELECT
      e.learner_id,
      COUNT(DISTINCT s.id) AS total_sessions,
      COUNT(DISTINCT CASE WHEN sp.is_completed = 1 THEN sp.session_id END) AS completed_sessions
     FROM enrollments e
     JOIN sessions s ON s.module_id = e.module_id
     LEFT JOIN session_progress sp ON sp.session_id = s.id AND sp.learner_id = e.learner_id
     WHERE e.payment_status = 'paid'
     GROUP BY e.learner_id`
  );

  const progressionBuckets = { '0-25%': 0, '26-50%': 0, '51-75%': 0, '76-99%': 0, '100%': 0 };
  progressRows.forEach((r) => {
    const pct = r.total_sessions > 0 ? (r.completed_sessions / r.total_sessions) * 100 : 0;
    if (pct === 0) progressionBuckets['0-25%']++;
    else if (pct <= 25) progressionBuckets['0-25%']++;
    else if (pct <= 50) progressionBuckets['26-50%']++;
    else if (pct <= 75) progressionBuckets['51-75%']++;
    else if (pct < 100) progressionBuckets['76-99%']++;
    else progressionBuckets['100%']++;
  });

  const progression = Object.entries(progressionBuckets).map(([name, value]) => ({ name, value }));

  // ─── Top 5 modules par inscriptions ───
  const topModules = await dbAsync.all(
    `SELECT m.title AS name, COUNT(e.id) AS value
     FROM modules m
     LEFT JOIN enrollments e ON e.module_id = m.id
     GROUP BY m.id
     ORDER BY value DESC
     LIMIT 5`
  );

  // ─── Quiz : taux de réussite ───
  const quizStats = await dbAsync.get(
    `SELECT
      COUNT(*) AS total_attempts,
      SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) AS passed_attempts,
      AVG(score_percent) AS avg_score
     FROM quiz_attempts`
  );

  res.json({
    counters: {
      modules: modulesCount.c,
      learners: learnersCount.c,
      enrollments: enrollmentsCount.c,
      certificates: certificatesCount.c,
    },
    enrollmentsByStatus,
    enrollmentsByMonth,
    progression,
    topModules,
    quiz: {
      total_attempts: quizStats.total_attempts || 0,
      passed_attempts: quizStats.passed_attempts || 0,
      pass_rate: quizStats.total_attempts > 0
        ? Math.round((quizStats.passed_attempts / quizStats.total_attempts) * 100)
        : 0,
      avg_score: Math.round(quizStats.avg_score || 0),
    },
  });
}));

export default router;
