import { DB_PATH } from '../config/database.js';
import { hashPassword } from '../utils/hash.js';
import sqlite3 from 'sqlite3';
import { logger } from '../utils/logger.js';

const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.log('Usage : node src/db/reset-admin.js <email> <password>');
  process.exit(1);
}

const db = new sqlite3.Database(DB_PATH);

db.run(
  'UPDATE admins SET password_hash = ? WHERE email = ?',
  [await hashPassword(password), email],
  function (err) {
    if (err) { logger.error('❌', err.message); process.exit(1); }
    logger.success(this.changes ? `✅ Mot de passe réinitialisé : ${email}` : `❌ Admin introuvable : ${email}`);
    db.close();
  }
);