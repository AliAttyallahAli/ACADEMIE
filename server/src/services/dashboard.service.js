import { dbAsync } from '../config/database.js';
import { notificationService } from './notification.service.js';

export const dashboardService = {
  /**
   * Agrège toutes les infos du dashboard apprenante :
   *  - Profil + photo
   *  - Progression globale (% séances validées, % modules terminés)
   *  - Prochaine séance (date + statut)
   *  - Liste des modules avec leur progression
   *  - Notifications récentes + compteur non-lus
   *  - Certificats disponibles
   *  - Statistiques personnelles
   */
  async getDashboard(learner_id) {
    // ─── 1. Profil ───
    const learner = await dbAsync.get(
      `SELECT id, full_name, email, birth_date, phone, country, bio,
              profile_photo_url, created_at
       FROM learners WHERE id = ?`,
      [learner_id]
    );
    if (!learner) {
      const err = new Error('Apprenante introuvable');
      err.status = 404;
      throw err;
    }

    // ─── 2. Inscriptions + progression par module ───
    const enrollments = await dbAsync.all(
      `SELECT e.id AS enrollment_id, e.module_id, e.start_date, e.status,
              e.payment_status, e.completed_at,
              m.title, m.description, m.cover_image_url,
              m.duration_weeks, m.frequency_per_week,
              (SELECT COUNT(*) FROM sessions s WHERE s.module_id = m.id) AS total_sessions,
              (SELECT COUNT(*) FROM session_progress sp
                 JOIN sessions s2 ON s2.id = sp.session_id
                 WHERE sp.learner_id = e.learner_id
                   AND s2.module_id = m.id
                   AND sp.is_completed = 1) AS completed_sessions
       FROM enrollments e
       JOIN modules m ON m.id = e.module_id
       WHERE e.learner_id = ? AND e.payment_status = 'paid'
       ORDER BY e.enrolled_at DESC`,
      [learner_id]
    );

    const modules = enrollments.map((e) => ({
      enrollment_id: e.enrollment_id,
      module_id: e.module_id,
      title: e.title,
      description: e.description,
      cover_image_url: e.cover_image_url,
      start_date: e.start_date,
      status: e.status,
      completed_at: e.completed_at,
      total_sessions: e.total_sessions,
      completed_sessions: e.completed_sessions,
      progress_percent:
        e.total_sessions > 0
          ? Math.round((e.completed_sessions / e.total_sessions) * 100)
          : 0,
    }));

    // ─── 3. Progression globale ───
    const totalSessions = modules.reduce((acc, m) => acc + m.total_sessions, 0);
    const completedSessions = modules.reduce((acc, m) => acc + m.completed_sessions, 0);
    const globalProgress = {
      total_sessions: totalSessions,
      completed_sessions: completedSessions,
      progress_percent:
        totalSessions > 0
          ? Math.round((completedSessions / totalSessions) * 100)
          : 0,
      modules_count: modules.length,
      modules_completed: modules.filter((m) => m.status === 'completed').length,
    };

    // ─── 4. Prochaine séance ───
    const nextSession = await dbAsync.get(
      `SELECT s.id, s.title, s.scheduled_date, s.session_number,
              m.title AS module_title, m.id AS module_id,
              sp.is_unlocked, sp.is_completed
       FROM session_progress sp
       JOIN sessions s ON s.id = sp.session_id
       JOIN modules m ON m.id = s.module_id
       WHERE sp.learner_id = ?
         AND sp.is_completed = 0
       ORDER BY
         CASE WHEN sp.is_unlocked = 1 THEN 0 ELSE 1 END,
         s.scheduled_date ASC
       LIMIT 1`,
      [learner_id]
    );

    const nextSessionInfo = nextSession
      ? {
          id: nextSession.id,
          title: nextSession.title,
          scheduled_date: nextSession.scheduled_date,
          session_number: nextSession.session_number,
          module_title: nextSession.module_title,
          module_id: nextSession.module_id,
          status: nextSession.is_unlocked === 1 ? 'available' : 'locked',
        }
      : null;

    // ─── 5. Notifications récentes ───
    const recentNotifications = await notificationService.listForLearner(learner_id, {
      limit: 5,
    });
    const unreadCount = await notificationService.countUnread(learner_id);

    // ─── 6. Certificats ───
    const certificates = await dbAsync.all(
      `SELECT certificate_uuid, issued_at FROM certificates
       WHERE learner_id = ? ORDER BY issued_at DESC`,
      [learner_id]
    );

    // ─── 7. Statistiques personnelles ───
    const [quizzesPassed, attemptsCount, scholarshipApps] = await Promise.all([
      dbAsync.get(
        `SELECT COUNT(DISTINCT quiz_id) AS c FROM quiz_attempts
         WHERE learner_id = ? AND passed = 1`,
        [learner_id]
      ),
      dbAsync.get(
        `SELECT COUNT(*) AS c FROM quiz_attempts WHERE learner_id = ?`,
        [learner_id]
      ),
      dbAsync.get(
        `SELECT COUNT(*) AS c FROM scholarship_applications WHERE learner_id = ?`,
        [learner_id]
      ),
    ]);

    const stats = {
      quizzes_passed: quizzesPassed?.c ?? 0,
      quiz_attempts: attemptsCount?.c ?? 0,
      certificates_count: certificates.length,
      scholarship_applications: scholarshipApps?.c ?? 0,
    };

    // ─── 8. Réponse finale ───
    return {
      learner: {
        id: learner.id,
        full_name: learner.full_name,
        email: learner.email,
        birth_date: learner.birth_date,
        phone: learner.phone,
        country: learner.country,
        bio: learner.bio,
        profile_photo_url: learner.profile_photo_url,
      },
      global_progress: globalProgress,
      modules,
      next_session: nextSessionInfo,
      notifications: {
        recent: recentNotifications,
        unread_count: unreadCount,
      },
      certificates: certificates.map((c) => ({
        certificate_uuid: c.certificate_uuid,
        issued_at: c.issued_at,
        download_url: `/api/certificates/${c.certificate_uuid}/download`,
      })),
      stats,
    };
  },
};