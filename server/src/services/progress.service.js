import { dbAsync } from '../config/database.js';
import { progressRepo } from '../repositories/progress.repo.js';
import { sessionRepo } from '../repositories/session.repo.js';
import { enrollmentRepo } from '../repositories/enrollment.repo.js';
import { certificateService } from './certificate.service.js';
import { notificationService } from './notification.service.js';
import { NOTIFICATION_TYPES } from '../config/constants.js';

export const progressService = {
  /**
   * Débloque la séance suivante du module.
   * Si c'était la dernière séance → marque le module comme terminé.
   * Si tous les modules sont terminés → génère le certificat.
   */
  async unlockNextSession(learner_id, current_session_id, io) {
    const session = await sessionRepo.findById(current_session_id);
    if (!session) throw new Error('Séance introuvable');

    // Chercher la séance suivante
    const nextSession = await dbAsync.get(
      `SELECT * FROM sessions
       WHERE module_id = ? AND session_number = ?
       LIMIT 1`,
      [session.module_id, session.session_number + 1]
    );

    if (nextSession) {
      // Débloquer la suivante
      await progressRepo.unlockNext(learner_id, nextSession.id);

      // Notification
      const module = await dbAsync.get(
        `SELECT title FROM modules WHERE id = ?`,
        [session.module_id]
      );
      const notif = await notificationService.create(learner_id, {
        type: NOTIFICATION_TYPES.SESSION_UNLOCKED,
        session_title: nextSession.title,
        module_title: module?.title ?? '',
        session_id: nextSession.id,
      });
      notificationService.emit(io, learner_id, notif);

      return { unlocked: true, next_session_id: nextSession.id };
    }

    // C'était la dernière séance du module
    const total = await dbAsync.get(
      `SELECT COUNT(*) AS c FROM sessions WHERE module_id = ?`,
      [session.module_id]
    );
    const done = await dbAsync.get(
      `SELECT COUNT(*) AS c FROM session_progress sp
       JOIN sessions s ON s.id = sp.session_id
       WHERE sp.learner_id = ? AND s.module_id = ? AND sp.is_completed = 1`,
      [learner_id, session.module_id]
    );

    if (done.c >= total.c) {
      // Module terminé
      await enrollmentRepo.markCompleted(
        (await enrollmentRepo.findByLearnerModule(learner_id, session.module_id)).id
      );

      const module = await dbAsync.get(
        `SELECT title FROM modules WHERE id = ?`,
        [session.module_id]
      );
      const notifModule = await notificationService.create(learner_id, {
        type: NOTIFICATION_TYPES.MODULE_COMPLETED,
        module_title: module?.title ?? '',
      });
      notificationService.emit(io, learner_id, notifModule);

      // Vérifier si tous les modules sont terminés
      const allDone = await enrollmentRepo.isAllModulesCompleted(learner_id);
      if (allDone) {
        // Générer le certificat
        try {
          const cert = await certificateService.generateForLearner(learner_id);

          const notifFormation = await notificationService.create(learner_id, {
            type: NOTIFICATION_TYPES.FORMATION_COMPLETED,
          });
          notificationService.emit(io, learner_id, notifFormation);

          const notifCert = await notificationService.create(learner_id, {
            type: NOTIFICATION_TYPES.CERTIFICATE_ISSUED,
            uuid: cert.certificate_uuid,
          });
          notificationService.emit(io, learner_id, notifCert);
        } catch (e) {
          // Le certificat peut échouer sans bloquer la progression
          // eslint-disable-next-line no-console
          console.error('Erreur génération certificat :', e.message);
        }
      }
    }

    return { unlocked: false, module_completed: true };
  },
};