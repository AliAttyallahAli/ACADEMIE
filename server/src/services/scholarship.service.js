import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { scholarshipRepo } from '../repositories/scholarship.repo.js';
import { notificationService } from './notification.service.js';
import { auditLogService } from './auditLog.service.js';
import { env } from '../config/env.js';
import { dbAsync } from '../config/database.js';
import { NOTIFICATION_TYPES, SCHOLARSHIP_STATUS, APPLICATION_STATUS } from '../config/constants.js';
import { logger } from '../utils/logger.js';

const DOCS_DIR = path.resolve(env.uploadDir, 'scholarship-docs');

export const scholarshipService = {
  // ═══════════ ADMIN : BOURSES ═══════════

  async create(data, actor) {
    if (!['formation', 'recherche', 'stage', 'autre'].includes(data.type)) {
      const err = new Error('Type de bourse invalide');
      err.status = 422;
      throw err;
    }
    if (data.opening_date && data.closing_date && data.opening_date > data.closing_date) {
      const err = new Error('Date de clôture antérieure à l\'ouverture');
      err.status = 422;
      throw err;
    }

    const id = await scholarshipRepo.create({
      ...data,
      created_by_type: actor.type,
      created_by_id: actor.id,
    });

    await auditLogService.log(
      { type: actor.type, id: actor.id, name: actor.name },
      'create_scholarship',
      { type: 'scholarship', id },
      { title: data.title, type: data.type }
    );

    return this.getById(id);
  },

  async getById(id) {
    const s = await scholarshipRepo.findById(id);
    if (!s) {
      const err = new Error('Bourse introuvable');
      err.status = 404;
      throw err;
    }
    return s;
  },

  async listAdmin(query) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const offset = (page - 1) * limit;
    const items = await scholarshipRepo.findAll({
      status: query.status,
      type: query.type,
      search: query.search,
      limit,
      offset,
    });
    const total = await scholarshipRepo.count({
      status: query.status,
      type: query.type,
      search: query.search,
    });
    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  },

  async update(id, updates, actor) {
    await this.getById(id);
    const updated = await scholarshipRepo.update(id, updates);
    await auditLogService.log(
      { type: actor.type, id: actor.id, name: actor.name },
      'update_scholarship',
      { type: 'scholarship', id },
      { fields: Object.keys(updates) }
    );
    return updated;
  },

  async publish(id, actor) {
    const s = await this.getById(id);
    if (s.status === SCHOLARSHIP_STATUS.PUBLISHED) {
      return s;
    }

    await scholarshipRepo.update(id, { status: SCHOLARSHIP_STATUS.PUBLISHED });

    // Notifier TOUTES les apprenantes actives (optionnel : filtrer par éligibilité)
    const learners = await dbAsync.all(
      `SELECT id FROM learners`
    );

    for (const l of learners) {
      const notif = await notificationService.create(l.id, {
        type: NOTIFICATION_TYPES.SCHOLARSHIP_PUBLISHED,
        title: s.title,
        organization: s.organization,
        scholarship_id: id,
      });
      // Socket.IO optionnel : broadcast si global.__io disponible
      if (global.__io) notificationService.emit(global.__io, l.id, notif);
    }

    await auditLogService.log(
      { type: actor.type, id: actor.id, name: actor.name },
      'publish_scholarship',
      { type: 'scholarship', id },
      { notified_learners: learners.length }
    );

    return this.getById(id);
  },

  async close(id, actor) {
    await this.getById(id);
    await scholarshipRepo.update(id, { status: SCHOLARSHIP_STATUS.CLOSED });
    await auditLogService.log(
      { type: actor.type, id: actor.id, name: actor.name },
      'close_scholarship',
      { type: 'scholarship', id },
      {}
    );
    return this.getById(id);
  },

  async remove(id, actor) {
    await this.getById(id);
    await scholarshipRepo.remove(id);
    await auditLogService.log(
      { type: actor.type, id: actor.id, name: actor.name },
      'delete_scholarship',
      { type: 'scholarship', id },
      {}
    );
    return { deleted: true, id };
  },

  // ═══════════ APPRENANTE : CONSULTATION ═══════════

  async listPublished() {
    return scholarshipRepo.findPublished();
  },

  async getPublishedDetail(id, learner_id) {
    const s = await this.getById(id);
    if (s.status !== SCHOLARSHIP_STATUS.PUBLISHED && s.status !== SCHOLARSHIP_STATUS.CLOSED) {
      const err = new Error('Cette bourse n\'est pas accessible');
      err.status = 403;
      throw err;
    }

    // Candidature existante de cette apprenante
    const application = await scholarshipRepo.findApplicationByLearnerScholarship(
      learner_id,
      id
    );

    return { scholarship: s, my_application: application ?? null };
  },

  // ═══════════ APPRENANTE : CANDIDATURE ═══════════

  async apply(scholarship_id, learner_id, { motivation_letter, cv }, extraFiles, io) {
    const s = await this.getById(scholarship_id);

    if (s.status !== SCHOLARSHIP_STATUS.PUBLISHED) {
      const err = new Error('Cette bourse n\'accepte plus de candidatures');
      err.status = 400;
      throw err;
    }

    const today = new Date().toISOString().split('T')[0];
    if (s.closing_date && today > s.closing_date) {
      const err = new Error('La date de clôture est dépassée');
      err.status = 400;
      throw err;
    }

    const existing = await scholarshipRepo.findApplicationByLearnerScholarship(
      learner_id,
      scholarship_id
    );
    if (existing) {
      const err = new Error('Vous avez déjà postulé à cette bourse');
      err.status = 409;
      throw err;
    }

    // Upload CV
    await fs.mkdir(DOCS_DIR, { recursive: true });
    let cv_url = null;
    if (cv) {
      const filename = `cv-${learner_id}-${scholarship_id}-${crypto.randomUUID()}.pdf`;
      const filepath = path.join(DOCS_DIR, filename);
      await fs.writeFile(filepath, cv.buffer);
      cv_url = `/uploads/scholarship-docs/${filename}`;
    }

    // Upload documents additionnels
    const extra_docs = [];
    if (extraFiles && extraFiles.length) {
      for (const f of extraFiles) {
        const filename = `doc-${learner_id}-${scholarship_id}-${crypto.randomUUID()}${path.extname(f.originalname)}`;
        const filepath = path.join(DOCS_DIR, filename);
        await fs.writeFile(filepath, f.buffer);
        extra_docs.push({
          name: f.originalname,
          url: `/uploads/scholarship-docs/${filename}`,
        });
      }
    }

    const id = await scholarshipRepo.createApplication({
      scholarship_id,
      learner_id,
      motivation_letter,
      cv_url,
      extra_docs,
    });

    // Notifier l'apprenante
    const notif = await notificationService.create(learner_id, {
      type: 'application_submitted',
      title: '📩 Candidature envoyée',
      message: `Votre candidature à "${s.title}" a bien été enregistrée.`,
      action_url: `/scholarships/${scholarship_id}`,
      icon: 'send',
      color: 'blue',
    });
    if (io) notificationService.emit(io, learner_id, notif);

    await auditLogService.log(
      { type: 'learner', id: learner_id, name: 'apprenante' },
      'submit_scholarship_application',
      { type: 'application', id },
      { scholarship_id }
    );

    return scholarshipRepo.findApplicationById(id);
  },

  async listMyApplications(learner_id) {
    return scholarshipRepo.findApplicationsByLearner(learner_id);
  },

  // ═══════════ ADMIN : REVIEW CANDIDATURES ═══════════

  async listApplicationsForScholarship(scholarship_id) {
    await this.getById(scholarship_id);
    return scholarshipRepo.findApplicationsByScholarship(scholarship_id);
  },

  async reviewApplication(application_id, { status, review_note }, actor, io) {
    if (![APPLICATION_STATUS.ACCEPTED, APPLICATION_STATUS.REJECTED].includes(status)) {
      const err = new Error('Statut de review invalide');
      err.status = 422;
      throw err;
    }

    const app = await scholarshipRepo.findApplicationById(application_id);
    if (!app) {
      const err = new Error('Candidature introuvable');
      err.status = 404;
      throw err;
    }

    if (app.status !== APPLICATION_STATUS.PENDING) {
      const err = new Error('Candidature déjà traitée');
      err.status = 400;
      throw err;
    }

    await scholarshipRepo.updateApplicationStatus(application_id, {
      status,
      review_note,
      reviewer_type: actor.type,
      reviewer_id: actor.id,
    });

    // Notifier l'apprenante
    const accepted = status === APPLICATION_STATUS.ACCEPTED;
    const notif = await notificationService.create(app.learner_id, {
      type: NOTIFICATION_TYPES.SCHOLARSHIP_RESULT,
      accepted,
      message: accepted
        ? `Félicitations ! Votre candidature à "${app.scholarship_title}" a été acceptée.`
        : `Votre candidature à "${app.scholarship_title}" a été refusée.${review_note ? ` Motif : ${review_note}` : ''}`,
      scholarship_id: app.scholarship_id,
    });
    if (io) notificationService.emit(io, app.learner_id, notif);

    await auditLogService.log(
      { type: actor.type, id: actor.id, name: actor.name },
      accepted ? 'accept_application' : 'reject_application',
      { type: 'application', id: application_id },
      { review_note }
    );

    return scholarshipRepo.findApplicationById(application_id);
  },
};