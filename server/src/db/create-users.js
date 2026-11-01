import { DB_PATH } from '../config/database.js';
import { hashPassword } from '../utils/hash.js';
import sqlite3 from 'sqlite3';
import { logger } from '../utils/logger.js';

const openDb = (p) => new Promise((res, rej) => {
  const db = new sqlite3.Database(p, (e) => (e ? rej(e) : res(db)));
});
const run = (db, sql, params = []) => new Promise((res, rej) => {
  db.run(sql, params, function (e) { e ? rej(e) : res(this); });
});
const close = (db) => new Promise((res) => db.close(() => res()));

async function upsertAdmin(db, fullName, email, password) {
  const hash = await hashPassword(password);
  await run(db, 'INSERT OR IGNORE INTO admins (full_name, email, password_hash) VALUES (?, ?, ?)', [fullName, email, hash]);
  await run(db, 'UPDATE admins SET full_name = ?, password_hash = ? WHERE email = ?', [fullName, hash, email]);
  logger.success(`✅ Admin : ${email} / ${password}`);
}

async function upsertLearner(db, fullName, birthDate, email, password) {
  const hash = await hashPassword(password);
  await run(db, 'INSERT OR IGNORE INTO learners (full_name, birth_date, email, password_hash) VALUES (?, ?, ?, ?)', [fullName, birthDate, email, hash]);
  await run(db, 'UPDATE learners SET full_name = ?, birth_date = ?, password_hash = ? WHERE email = ?', [fullName, birthDate, hash, email]);
  logger.success(`✅ Apprenante : ${email} / ${password}`);
}

async function main() {
  const db = await openDb(DB_PATH);
  try {
    await run(db, 'PRAGMA foreign_keys = ON');

    await upsertAdmin(db, 'Super Admin', 'admin@alkher.com', 'Admin@2026');
    await upsertAdmin(db, 'Super Admin 2', 'superadmin@alkher.com', 'SuperAdmin@2026');
    await upsertLearner(db, 'Test Apprenante', '1995-01-01', 'test@test.com', 'Test@2026');

    logger.success('🎉 Comptes prêts.');
  } finally {
    await close(db);
  }
}

main().catch((e) => { logger.error('❌', e.message); process.exit(1); });