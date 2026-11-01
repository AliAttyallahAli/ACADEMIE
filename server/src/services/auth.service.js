import { learnerRepo } from '../repositories/learner.repo.js';
import { adminRepo } from '../repositories/admin.repo.js';
import { responsibleRepo } from '../repositories/responsible.repo.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { signToken } from '../utils/jwt.js';
import { ROLES, RESPONSIBLE_ROLES } from '../config/constants.js';
import { dbAsync } from '../config/database.js';

/**
 * Construit le payload JWT selon le type d'utilisateur.
 */
function buildAuthPayload(user, type) {
  const base = { id: user.id, email: user.email, type };
  if (type === ROLES.LEARNER) {
    return { ...base, full_name: user.full_name };
  }
  if (type === ROLES.ADMIN) {
    return { ...base, full_name: user.full_name };
  }
  if (type === ROLES.RESPONSIBLE) {
    return {
      ...base,
      full_name: user.full_name,
      role: user.role,
      permissions_json: user.permissions_json,
    };
  }
  return base;
}

export const authService = {
  // ═══════════════════════════════════════════════════
  // APPRENANTE
  // ═══════════════════════════════════════════════════
  async registerLearner({ full_name, birth_date, email, password }) {
    const existing = await learnerRepo.findByEmail(email);
    if (existing) {
      const err = new Error('Un compte existe déjà avec cet email');
      err.status = 409;
      throw err;
    }

    const password_hash = await hashPassword(password);
    const id = await learnerRepo.create({ full_name, birth_date, email, password_hash });

    const user = await learnerRepo.findById(id);
    const token = signToken(buildAuthPayload(user, ROLES.LEARNER));
    return {
      user: { ...user, type: ROLES.LEARNER },
      token,
    };
  },

  async loginLearner({ email, password }) {
    const user = await learnerRepo.findByEmail(email);

    if (!user) {
      const err = new Error('Email ou mot de passe incorrect');
      err.status = 401;
      throw err;
    }

    // ✅ ORDRE CORRECT : password en premier, hash en second
    const ok = await comparePassword(password, user.password_hash);

    if (!ok) {
      const err = new Error('Email ou mot de passe incorrect');
      err.status = 401;
      throw err;
    }

    await learnerRepo.updateLastLogin(user.id);
    const safe = await learnerRepo.findById(user.id);
    const token = signToken(buildAuthPayload(safe, ROLES.LEARNER));
    return {
      user: { ...safe, type: ROLES.LEARNER },
      token,
    };
  },

  // ═══════════════════════════════════════════════════
  // ADMIN (super-admin)
  // ═══════════════════════════════════════════════════
  async loginAdmin({ email, password }) {
    // Log de debug
    console.log('[auth.service.loginAdmin] tentative pour:', email);

    const user = await adminRepo.findByEmail(email);

    if (!user) {
      console.log('[auth.service.loginAdmin] ❌ Admin non trouvé en base');
      const err = new Error('Email ou mot de passe incorrect');
      err.status = 401;
      throw err;
    }

    console.log('[auth.service.loginAdmin] ✅ Admin trouvé:', user.email);
    console.log('[auth.service.loginAdmin] Hash:', user.password_hash?.slice(0, 30) + '...');
    console.log('[auth.service.loginAdmin] Hash length:', user.password_hash?.length);

    // ✅ ORDRE CORRECT : password en premier, hash en second
    const ok = await comparePassword(password, user.password_hash);

    console.log('[auth.service.loginAdmin] comparePassword:', ok ? '✅ OK' : '❌ KO');

    if (!ok) {
      const err = new Error('Email ou mot de passe incorrect');
      err.status = 401;
      throw err;
    }

    const token = signToken(buildAuthPayload(user, ROLES.ADMIN));
    return {
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        type: ROLES.ADMIN,
      },
      token,
    };
  },

  // ═══════════════════════════════════════════════════
  // RESPONSABLE
  // ═══════════════════════════════════════════════════
  async loginResponsible({ email, password }) {
    const user = await responsibleRepo.findByEmail(email);

    if (!user) {
      const err = new Error('Email ou mot de passe incorrect, ou compte désactivé');
      err.status = 401;
      throw err;
    }

    // ✅ ORDRE CORRECT
    const ok = await comparePassword(password, user.password_hash);

    if (!ok) {
      const err = new Error('Email ou mot de passe incorrect');
      err.status = 401;
      throw err;
    }

    await responsibleRepo.updateLastLogin(user.id);
    const token = signToken(buildAuthPayload(user, ROLES.RESPONSIBLE));
    return {
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        type: ROLES.RESPONSIBLE,
        role: user.role,
        permissions_json: user.permissions_json,
      },
      token,
    };
  },

  // ═══════════════════════════════════════════════════
  // CRÉATION RESPONSABLE (super-admin)
  // ═══════════════════════════════════════════════════
  async createResponsible(
    { full_name, email, password, role, permissions_json },
    created_by_admin_id
  ) {
    if (!RESPONSIBLE_ROLES.includes(role)) {
      const err = new Error('Rôle de responsable invalide');
      err.status = 422;
      throw err;
    }

    const existing = await dbAsync.get(
      'SELECT id FROM responsibles WHERE email = ?',
      [email]
    );
    if (existing) {
      const err = new Error('Un responsable existe déjà avec cet email');
      err.status = 409;
      throw err;
    }

    const password_hash = await hashPassword(password);
    const id = await responsibleRepo.create({
      full_name,
      email,
      password_hash,
      role,
      permissions_json: JSON.stringify(permissions_json || {}),
      created_by_admin_id,
    });

    return responsibleRepo.findById(id);
  },
};