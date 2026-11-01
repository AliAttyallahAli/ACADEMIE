import fs from 'node:fs';
import sqlite3 from 'sqlite3';
import { DB_PATH } from '../config/database.js';
import { hashPassword } from '../utils/hash.js';
import { logger } from '../utils/logger.js';

const openDb = (p) => new Promise((res, rej) => {
  const db = new sqlite3.Database(p, (e) => (e ? rej(e) : res(db)));
});
const run = (db, sql, params = []) => new Promise((res, rej) => {
  db.run(sql, params, function (e) { e ? rej(e) : res(this); });
});
const get = (db, sql, params = []) => new Promise((res, rej) => {
  db.get(sql, params, (e, r) => (e ? rej(e) : res(r)));
});
const close = (db) => new Promise((res) => db.close(() => res()));

async function seed() {
  logger.info('🌱 Seeding...');

  if (!fs.existsSync(DB_PATH)) {
    logger.error('❌ Base introuvable. Lancez : node src/db/init.js');
    process.exit(1);
  }

  const db = await openDb(DB_PATH);
  try {
    await run(db, 'PRAGMA foreign_keys = ON');

    const email = process.env.SEED_ADMIN_EMAIL || 'admin@alkher.com';
    const password = process.env.SEED_ADMIN_PASSWORD || 'Admin@2026';

    const existing = await get(db, 'SELECT id FROM admins WHERE email = ?', [email]);
    const hash = await hashPassword(password);

    if (existing) {
      await run(db, 'UPDATE admins SET password_hash = ? WHERE email = ?', [hash, email]);
      logger.success(`✅ Mot de passe réinitialisé : ${email}`);
    } else {
      await run(db, 'INSERT INTO admins (full_name, email, password_hash) VALUES (?, ?, ?)',
        ['Super Admin', email, hash]);
      logger.success(`✅ Admin créé : ${email} / ${password}`);
    }
  } finally {
    await close(db);
  }
  logger.success('🌱 Terminé.');
}

seed().catch((e) => {
  logger.error('❌ Erreur :', e.message);
  process.exit(1);
});