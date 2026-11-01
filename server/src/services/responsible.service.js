import { responsibleRepo } from '../repositories/responsible.repo.js';
import { auditLogService } from './auditLog.service.js';
import { hashPassword } from '../utils/hash.js';
import { RESPONSIBLE_ROLES } from '../config/constants.js';
import { dbAsync } from '../config/database.js';

/**
 * Permissions par défaut selon le rôle.
 */
const DEFAULT_PERMISSIONS = {
  pedagogique: {
    modules: ['read', 'write'],
    sessions: ['read', 'write'],
    quizzes: ['read', 'write'],
    resources: ['read', 'write'],
    stats: ['read'],
  },
  inscriptions: {
    enrollments: ['read', 'validate', 'reject'],
    learners: ['read'],
    stats: ['read'],
  },
  bourses: {
    scholarships: ['read', 'write', 'review'],
    stats: ['read'],
  },
  support: {
    support: ['read', 'reply'],
    forum: ['read', 'moderate'],
    stats: ['read'],
  },
  lecture: {
    modules: ['read'],
    sessions: ['read'],
    enrollments: ['read'],
    learners: ['read'],
    scholarships: ['read'],
    stats: ['read'],
  },
};

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let pwd = '';
  for (let i = 0; i < 12; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  return pwd + '@1'; // garantit majuscule + chiffre + symbole
}

export const responsibleService = {
  async create({ full_name, email, role, permissions_json, send_password_by_email }, admin) {
    if (!RESPONSIBLE_ROLES.includes(role)) {
      const err = new Error('Rôle invalide');
      err.status = 422;
      throw err;
    }

    // Vérifier email unique
    const existing = await dbAsync.get(
      `SELECT id FROM responsibles WHERE email = ?`,
      [email]
    );
    if (existing) {
      const err = new Error('Un responsable existe déjà avec cet email');
      err.status = 409;
      throw err;
    }

    const tempPassword = generateTempPassword();
    const password_hash = await hashPassword(tempPassword);

    const permissions = permissions_json && Object.keys(permissions_json).length
      ? permissions_json
      : DEFAULT_PERMISSIONS[role];

    const id = await responsibleRepo.create({
      full_name,
      email,
      password_hash,
      role,
      permissions_json: JSON.stringify(permissions),
      created_by_admin_id: admin.id,
    });

    await auditLogService.log(
      { type: 'admin', id: admin.id, name: admin.full_name },
      'create_responsible',
      { type: 'responsible', id },
      { email, role }
    );

    // TODO : envoyer email avec tempPassword si send_password_by_email

    const created = await responsibleRepo.findById(id);
    return {
      responsible: created,
      // En prod : ne PAS renvoyer le mot de passe en clair, uniquement par email
      tempPassword: process.env.NODE_ENV === 'development' ? tempPassword : undefined,
    };
  },

  async list({ role, is_active, search, page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    const items = await responsibleRepo.findAll({ role, is_active, search, limit, offset });
    const total = await responsibleRepo.count({ role, is_active });
    return {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  },

  async getById(id) {
    const r = await responsibleRepo.findById(id);
    if (!r) {
      const err = new Error('Responsable introuvable');
      err.status = 404;
      throw err;
    }
    return r;
  },

  async update(id, updates, admin) {
    const existing = await this.getById(id);

    const allowed = ['full_name', 'role', 'permissions_json'];
    const sets = [];
    const params = [];

    for (const key of allowed) {
      if (updates[key] !== undefined) {
        sets.push(`${key} = ?`);
        params.push(
          key === 'permissions_json'
            ? JSON.stringify(updates[key])
            : updates[key]
        );
      }
    }

    if (!sets.length) return existing;

    params.push(id);
    await dbAsync.run(
      `UPDATE responsibles SET ${sets.join(', ')} WHERE id = ?`,
      params
    );

    await auditLogService.log(
      { type: 'admin', id: admin.id, name: admin.full_name },
      'update_responsible',
      { type: 'responsible', id },
      { changes: Object.keys(updates) }
    );

    return responsibleRepo.findById(id);
  },

  async toggle(id, admin) {
    const r = await this.getById(id);
    const newState = !r.is_active;
    await responsibleRepo.setActive(id, newState);

    await auditLogService.log(
      { type: 'admin', id: admin.id, name: admin.full_name },
      newState ? 'activate_responsible' : 'deactivate_responsible',
      { type: 'responsible', id },
      {}
    );

    return { id, is_active: newState };
  },

  async resetPassword(id, admin) {
    await this.getById(id);
    const tempPassword = generateTempPassword();
    const password_hash = await hashPassword(tempPassword);
    await responsibleRepo.updatePassword(id, password_hash);

    await auditLogService.log(
      { type: 'admin', id: admin.id, name: admin.full_name },
      'reset_responsible_password',
      { type: 'responsible', id },
      {}
    );

    return {
      tempPassword: process.env.NODE_ENV === 'development' ? tempPassword : undefined,
      message: 'Mot de passe réinitialisé. Communiquez-le de façon sécurisée.',
    };
  },

  async remove(id, admin) {
    await this.getById(id);
    await dbAsync.run(`DELETE FROM responsibles WHERE id = ?`, [id]);

    await auditLogService.log(
      { type: 'admin', id: admin.id, name: admin.full_name },
      'delete_responsible',
      { type: 'responsible', id },
      {}
    );

    return { deleted: true, id };
  },

  async getActivity(id, limit = 20) {
    return auditLogService.findAll({ actor_type: 'responsible', actor_id: id, limit });
  },
};