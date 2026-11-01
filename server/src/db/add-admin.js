import { DB_PATH } from '../config/database.js';
import { hashPassword } from '../utils/hash.js';
import sqlite3 from 'sqlite3';
import { logger } from '../utils/logger.js';

const [fullName = 'Admin', email = 'admin2@alkher.com', password = 'Admin@2026'] = process.argv.slice(2);

const db = new sqlite3.Database(DB_PATH);

db.run(
  'INSERT OR IGNORE INTO admins (full_name, email, password_hash) VALUES (?, ?, ?)',
  [fullName, email, await hashPassword(password)],
  function (err) {
    if (err) { logger.error('❌', err.message); process.exit(1); }
    logger.success(this.changes ? `✅ Admin créé : ${email}` : `ℹ️  Existe déjà : ${email}`);
    db.close();
  }
);