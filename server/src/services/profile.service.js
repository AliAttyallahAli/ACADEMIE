import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { learnerRepo } from '../repositories/learner.repo.js';
import { comparePassword, hashPassword } from '../utils/hash.js';
import { env } from '../config/env.js';
import { dbAsync } from '../config/database.js';

const AVATARS_DIR = path.resolve(env.uploadDir, 'avatars');

export const profileService = {
  async getProfile(learner_id) {
    const user = await learnerRepo.findById(learner_id);
    if (!user) {
      const err = new Error('Profil introuvable');
      err.status = 404;
      throw err;
    }

    // Stats agrégées
    const [modulesRow, sessionsRow, quizzesRow, certsRow, appsRow] = await Promise.all([
      dbAsync.get(
        `SELECT COUNT(*) c FROM enrollments WHERE learner_id = ? AND status = 'completed'`,
        [learner_id]
      ),
      dbAsync.get(
        `SELECT COUNT(*) c FROM session_progress WHERE learner_id = ? AND is_completed = 1`,
        [learner_id]
      ),
      dbAsync.get(
        `SELECT COUNT(DISTINCT quiz_id) c FROM quiz_attempts WHERE learner_id = ? AND passed = 1`,
        [learner_id]
      ),
      dbAsync.get(
        `SELECT COUNT(*) c FROM certificates WHERE learner_id = ?`,
        [learner_id]
      ),
      dbAsync.get(
        `SELECT COUNT(*) c FROM scholarship_applications WHERE learner_id = ?`,
        [learner_id]
      ),
    ]);

    return {
      user,
      stats: {
        modules_count: modulesRow?.c ?? 0,
        sessions_completed: sessionsRow?.c ?? 0,
        quizzes_passed: quizzesRow?.c ?? 0,
        certificates_count: certsRow?.c ?? 0,
        scholarship_applications_count: appsRow?.c ?? 0,
      },
    };
  },

  async updateProfile(learner_id, updates) {
    await learnerRepo.updateProfile(learner_id, updates);
    return learnerRepo.findById(learner_id);
  },

  async uploadPhoto(learner_id, file) {
    if (!file || !file.buffer) {
      const err = new Error('Aucun fichier reçu');
      err.status = 400;
      throw err;
    }

    await fs.mkdir(AVATARS_DIR, { recursive: true });

    const filename = `avatar-${learner_id}-${crypto.randomUUID()}.webp`;
    const filepath = path.join(AVATARS_DIR, filename);

    // Suppression de l'ancienne photo si présente
    const current = await learnerRepo.findById(learner_id);
    if (current?.profile_photo_url) {
      const oldFile = path.join(
        AVATARS_DIR,
        path.basename(current.profile_photo_url)
      );
      await fs.unlink(oldFile).catch(() => {});
    }

    await sharp(file.buffer)
      .resize(256, 256, { fit: 'cover' })
      .webp({ quality: 85 })
      .toFile(filepath);

    const url = `/uploads/avatars/${filename}`;
    await learnerRepo.updatePhoto(learner_id, url);
    return { url };
  },

  async deletePhoto(learner_id) {
    const current = await learnerRepo.findById(learner_id);
    if (current?.profile_photo_url) {
      const oldFile = path.join(
        AVATARS_DIR,
        path.basename(current.profile_photo_url)
      );
      await fs.unlink(oldFile).catch(() => {});
    }
    await learnerRepo.deletePhoto(learner_id);
    return { deleted: true };
  },

  async changePassword(learner_id, { current_password, new_password }) {
    const user = await learnerRepo.findByIdWithPassword(learner_id);
    if (!user) {
      const err = new Error('Utilisateur introuvable');
      err.status = 404;
      throw err;
    }

    const ok = await comparePassword(current_password, user.password_hash);
    if (!ok) {
      const err = new Error('Mot de passe actuel incorrect');
      err.status = 401;
      throw err;
    }

    const newHash = await hashPassword(new_password);
    await learnerRepo.updatePassword(learner_id, newHash);
    return { success: true };
  },
};