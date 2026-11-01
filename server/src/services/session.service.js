import { sessionRepo } from '../repositories/session.repo.js';
import { moduleRepo } from '../repositories/module.repo.js';
import { auditLogService } from './auditLog.service.js';

export const sessionService = {
  async getById(id) {
    const s = await sessionRepo.findById(id);
    if (!s) {
      const err = new Error('Séance introuvable');
      err.status = 404;
      throw err;
    }
    return s;
  },

  async listByModule(module_id) {
    const module = await moduleRepo.findById(module_id);
    if (!module) {
      const err = new Error('Module introuvable');
      err.status = 404;
      throw err;
    }
    const sessions = await sessionRepo.findByModule(module_id);
    return { module, sessions };
  },

  async update(id, updates, actor) {
    await this.getById(id);
    const updated = await sessionRepo.update(id, updates);
    await auditLogService.log(
      { type: actor.type, id: actor.id, name: actor.name },
      'update_session',
      { type: 'session', id },
      { fields: Object.keys(updates) }
    );
    return updated;
  },

  async remove(id, actor) {
    await this.getById(id);
    await sessionRepo.remove(id);
    await auditLogService.log(
      { type: actor.type, id: actor.id, name: actor.name },
      'delete_session',
      { type: 'session', id },
      {}
    );
    return { deleted: true, id };
  },
};