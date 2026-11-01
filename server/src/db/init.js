import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import sqlite3 from 'sqlite3';
import { DB_PATH } from '../config/database.js';
import { hashPassword } from '../utils/hash.js';
import { logger } from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function openDb(p) {
  return new Promise((res, rej) => {
    const db = new sqlite3.Database(p, (e) => (e ? rej(e) : res(db)));
  });
}
const run = (db, sql, params = []) => new Promise((res, rej) => {
  db.run(sql, params, function (e) { e ? rej(e) : res(this); });
});
const get = (db, sql, params = []) => new Promise((res, rej) => {
  db.get(sql, params, (e, r) => (e ? rej(e) : res(r)));
});
const all = (db, sql, params = []) => new Promise((res, rej) => {
  db.all(sql, params, (e, r) => (e ? rej(e) : res(r)));
});
const close = (db) => new Promise((res) => db.close(() => res()));

async function init() {
  logger.info('🔄 Initialisation de la base de données...');
  logger.info(`📁 Chemin cible : ${DB_PATH}`);

  // 1. Vérifier schema.sql
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    logger.error('❌ schema.sql introuvable');
    process.exit(1);
  }

  const schema = fs.readFileSync(schemaPath, 'utf8');
  const count = (schema.match(/CREATE TABLE/gi) || []).length;
  logger.info(`📝 schema.sql : ${count} CREATE TABLE`);

  if (count < 15) {
    logger.error(`❌ Schema incomplet (${count} tables)`);
    process.exit(1);
  }

  // 2. Supprimer l'ancienne base
  for (const f of [DB_PATH, `${DB_PATH}-shm`, `${DB_PATH}-wal`]) {
    if (fs.existsSync(f)) {
      fs.unlinkSync(f);
      logger.info(`🗑️  Supprimé : ${path.basename(f)}`);
    }
  }
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  // 3. Appliquer le schéma via CLI (fiable)
  logger.info('📥 Application via sqlite3 CLI...');
  try {
    execSync(`sqlite3 "${DB_PATH}" < "${schemaPath}"`, { stdio: 'pipe' });
    logger.success('✅ Schéma appliqué');
  } catch (e) {
    logger.error('❌ CLI erreur :', e.message);
    process.exit(1);
  }

  // 4. Vérifier
  const db = await openDb(DB_PATH);
  try {
    await run(db, 'PRAGMA foreign_keys = ON');
    const tables = await all(db,
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    logger.info(`📋 ${tables.length} table(s)`);

    if (tables.length < 15) {
      logger.error(`❌ Seulement ${tables.length} tables`);
      process.exit(1);
    }

    // 5. Admin
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@alkher.com';
    const password = process.env.SEED_ADMIN_PASSWORD || 'Admin@2026';

    const existing = await get(db, 'SELECT id FROM admins WHERE email = ?', [email]);
    if (!existing) {
      const hash = await hashPassword(password);
      await run(db, 'INSERT INTO admins (full_name, email, password_hash) VALUES (?, ?, ?)',
        ['Super Admin', email, hash]);
      logger.success(`✅ Admin créé : ${email} / ${password}`);
    } else {
      logger.info(`ℹ️  Admin existant : ${email}`);
    }

    const size = fs.statSync(DB_PATH).size;
    logger.info('📊 État :');
    logger.info(`   - Fichier : ${DB_PATH} (${size} octets)`);
    logger.info(`   - Tables  : ${tables.length}`);

    if (size < 20000) {
      logger.error(`❌ Taille suspecte : ${size}`);
      process.exit(1);
    }

    logger.success('🎉 Base prête.');
  } finally {
    await close(db);
    logger.info(`📁 Taille finale : ${fs.statSync(DB_PATH).size} octets`);
  }
}

init().catch((e) => {
  logger.error('❌ Erreur fatale :', e.message);
  process.exit(1);
});