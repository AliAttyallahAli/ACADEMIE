import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { dbAsync } from '../config/database.js';

const router = Router();

/**
 * POST /api/alkherpay/simulate
 * Simule une confirmation de paiement en DEV.
 * Body : { enrollment_ids: [1, 2] }
 */
router.post('/simulate', asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Simulation désactivée en production' });
  }

  const { enrollment_ids } = req.body;
  if (!Array.isArray(enrollment_ids) || enrollment_ids.length === 0) {
    return res.status(422).json({ error: 'enrollment_ids requis' });
  }

  const results = [];

  for (const id of enrollment_ids) {
    const enrollment = await dbAsync.get('SELECT * FROM enrollments WHERE id = ?', [id]);
    if (!enrollment) {
      results.push({ id, error: 'Inscription introuvable' });
      continue;
    }

    if (enrollment.payment_status === 'paid') {
      results.push({ id, already_paid: true });
      continue;
    }

    // Marquer comme payée
    await dbAsync.run(
      `UPDATE enrollments SET payment_status = 'paid',
        validated_by = 'alkherpay', validated_at = datetime('now'),
        payment_ref = ?
       WHERE id = ?`,
      [`SIMULATE-${Date.now()}`, id]
    );

    // Générer les séances si pas déjà fait
    const module = await dbAsync.get('SELECT * FROM modules WHERE id = ?', [enrollment.module_id]);
    let sessions = await dbAsync.all(
      'SELECT id FROM sessions WHERE module_id = ? ORDER BY session_number',
      [enrollment.module_id]
    );

    if (sessions.length === 0 && module) {
      const total = module.duration_weeks * module.frequency_per_week;
      const start = new Date(enrollment.start_date);
      for (let i = 0; i < total; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + Math.round((i * 7) / module.frequency_per_week));
        await dbAsync.run(
          `INSERT INTO sessions (module_id, session_number, title, scheduled_date)
           VALUES (?, ?, ?, ?)`,
          [module.id, i + 1, `Séance ${i + 1}`, d.toISOString().split('T')[0]]
        );
      }
      sessions = await dbAsync.all(
        'SELECT id FROM sessions WHERE module_id = ? ORDER BY session_number',
        [enrollment.module_id]
      );
    }

    // Initialiser la progression : séance 1 débloquée
    for (let i = 0; i < sessions.length; i++) {
      await dbAsync.run(
        `INSERT OR IGNORE INTO session_progress (learner_id, session_id, is_unlocked)
         VALUES (?, ?, ?)`,
        [enrollment.learner_id, sessions[i].id, i === 0 ? 1 : 0]
      );
    }

    // Notification
    await dbAsync.run(
      `INSERT INTO notifications (learner_id, type, title, message, action_url, icon, color)
       VALUES (?, 'enrollment_validated', '🎉 Inscription validée',
         ?, '/dashboard', 'check-circle', 'green')`,
      [enrollment.learner_id, `Votre inscription au module "${module?.title || ''}" est active.`]
    );

    results.push({ id, activated: true, sessions_count: sessions.length });
  }

  res.json({ success: true, results });
}));

export default router;
