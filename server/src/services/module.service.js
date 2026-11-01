import { moduleRepo } from '../repositories/module.repo.js';
import { sessionRepo } from '../repositories/session.repo.js';
import { auditLogService } from './auditLog.service.js';
import { calculateSessionDates } from '../utils/scheduleCalculator.js';
import { dbAsync } from '../config/database.js';

export const moduleService = {
  async create(payload, actor, start_date) {
    const { title, description, cover_image_url, duration_weeks, frequency_per_week } = payload;

    const id = await moduleRepo.create({
      title,
      description,
      cover_image_url,
      duration_weeks,
      frequency_per_week,
    });

    // Génération automatique des séances (calendrier de référence du module)
    const totalSessions = duration_weeks * frequency_per_week;
    const baseDate = start_date || new Date().toISOString().split('T')[0];
    const dates = calculateSessionDates(baseDate, frequency_per_week, totalSessions);

    const sessions = dates.map((d, i) => ({
      session_number: i + 1,
      title: `Séance ${i + 1}`,
      scheduled_date: d,
    }));
    await sessionRepo.createMany(id, sessions);

    await auditLogService.log(
      { type: actor.type, id: actor.id, name: actor.name },
      'create_module',
      { type: 'module', id },
      { title, totalSessions }
    );

    return this.getById(id);
  },

  async getById(id) {
    const module = await moduleRepo.findById(id);
    if (!module) {
      const err = new Error('Module introuvable');
      err.status = 404;
      throw err;
    }
    module.sessions = await sessionRepo.findByModule(id);
    module.total_sessions = module.sessions.length;
    return module;
  },

  async list(query) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const offset = (page - 1) * limit;
    const items = await moduleRepo.findAll({ search: query.search, limit, offset });
    const total = await moduleRepo.count({ search: query.search });
    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  },

  async update(id, updates, actor) {
    await this.getById(id);
    const updated = await moduleRepo.update(id, updates);
    await auditLogService.log(
      { type: actor.type, id: actor.id, name: actor.name },
      'update_module',
      { type: 'module', id },
      { fields: Object.keys(updates) }
    );
    return updated;
  },

  async remove(id, actor) {
    await this.getById(id);
    await moduleRepo.remove(id);
    await auditLogService.log(
      { type: actor.type, id: actor.id, name: actor.name },
      'delete_module',
      { type: 'module', id },
      {}
    );
    return { deleted: true, id };
  },

  async regenerateSessions(id, start_date, actor) {
    const module = await this.getById(id);
    const totalSessions = module.duration_weeks * module.frequency_per_week;

    // Supprimer les séances existantes non démarrées (optionnel : ici on supprime tout)
    await dbAsync.run(`DELETE FROM sessions WHERE module_id = ?`, [id]);

    const dates = calculateSessionDates(start_date, module.frequency_per_week, totalSessions);
    const sessions = dates.map((d, i) => ({
      session_number: i + 1,
      title: `Séance ${i + 1}`,
      scheduled_date: d,
    }));
    await sessionRepo.createMany(id, sessions);

    await auditLogService.log(
      { type: actor.type, id: actor.id, name: actor.name },
      'regenerate_module_sessions',
      { type: 'module', id },
      { start_date, totalSessions }
    );

    return this.getById(id);
  },
};