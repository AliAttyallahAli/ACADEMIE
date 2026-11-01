import { dbAsync } from '../config/database.js';

/**
 * Middleware qui vérifie qu'une apprenante peut accéder à une séance.
 * Vérifications :
 *  1. La séance existe
 *  2. L'apprenante est inscrite au module correspondant (payment_status='paid')
 *  3. La date de la séance est atteinte (scheduled_date <= today)
 *  4. La séance est débloquée (session_progress.is_unlocked = 1)
 */
export async function checkSessionAccess(req, res, next) {
  try {
    const learner_id = req.user.id;
    const session_id = Number(req.params.id ?? req.params.sessionId);

    if (!session_id || isNaN(session_id)) {
      return res.status(400).json({ error: 'Identifiant de séance invalide' });
    }

    // 1. Récupérer la séance + module
    const session = await dbAsync.get(
      `SELECT s.*, m.id AS module_id, m.title AS module_title,
              m.duration_weeks, m.frequency_per_week
       FROM sessions s
       JOIN modules m ON m.id = s.module_id
       WHERE s.id = ?`,
      [session_id]
    );
    if (!session) {
      return res.status(404).json({ error: 'Séance introuvable' });
    }

    // 2. Vérifier inscription payée
    const enrollment = await dbAsync.get(
      `SELECT * FROM enrollments
       WHERE learner_id = ? AND module_id = ? AND payment_status = 'paid'`,
      [learner_id, session.module_id]
    );
    if (!enrollment) {
      return res.status(403).json({
        error: 'Vous n\'êtes pas inscrite à ce module ou le paiement n\'est pas validé',
      });
    }

    // 3. Vérifier date
    const today = new Date().toISOString().split('T')[0];
    if (session.scheduled_date > today) {
      return res.status(403).json({
        error: 'Séance pas encore disponible',
        available_on: session.scheduled_date,
      });
    }

    // 4. Vérifier déblocage
    const progress = await dbAsync.get(
      `SELECT * FROM session_progress WHERE learner_id = ? AND session_id = ?`,
      [learner_id, session_id]
    );
    if (!progress || progress.is_unlocked === 0) {
      return res.status(403).json({
        error: 'Séance verrouillée : terminez la séance précédente pour la débloquer',
      });
    }

    // Attacher au req pour éviter des requêtes supplémentaires
    req.session = session;
    req.enrollment = enrollment;
    req.progress = progress;
    next();
  } catch (e) {
    next(e);
  }
}