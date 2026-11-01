import sqlite3 from 'sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ✅ CHEMIN ABSOLU UNIQUE — peu importe le cwd
// database.js est dans src/config/, la base est dans server/data/
export const DB_PATH = path.resolve(__dirname, '../../data/alkher.db');

let db = null;
let dbReady = null;

export function getDb() {
  if (db) return db;

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('[db] Erreur ouverture :', err.message);
      process.exit(1);
    }
    const size = fs.existsSync(DB_PATH) ? fs.statSync(DB_PATH).size : 0;
    console.log(`[db] Fichier ouvert : ${DB_PATH} (${size} octets)`);
  });

  dbReady = new Promise((resolve) => {
    db.serialize(() => {
      db.run('PRAGMA journal_mode = WAL');
      db.run('PRAGMA synchronous = NORMAL');
      db.run('PRAGMA foreign_keys = ON');
      db.run('PRAGMA busy_timeout = 5000');
      db.run('PRAGMA wal_autocheckpoint = 1000', () => resolve());
    });
  });

  return db;
}

export async function waitReady() {
  getDb();
  await dbReady;
}

export const dbAsync = {
  async all(sql, params = []) {
    await waitReady();
    return new Promise((res, rej) => {
      db.all(sql, params, (e, r) =>
        e ? rej(new Error(`[dbAsync.all] ${e.message}`)) : res(r)
      );
    });
  },
  async get(sql, params = []) {
    await waitReady();
    return new Promise((res, rej) => {
      db.get(sql, params, (e, r) =>
        e ? rej(new Error(`[dbAsync.get] ${e.message}`)) : res(r)
      );
    });
  },
  async run(sql, params = []) {
    await waitReady();
    return new Promise((res, rej) => {
      db.run(sql, params, function (e) {
        if (e) return rej(new Error(`[dbAsync.run] ${e.message}`));
        res({ changes: this.changes, lastInsertRowid: this.lastID });
      });
    });
  },
  async exec(sql) {
    await waitReady();
    return new Promise((res, rej) => {
      db.exec(sql, (e) =>
        e ? rej(new Error(`[dbAsync.exec] ${e.message}`)) : res()
      );
    });
  },
  async transaction(cb) {
    await waitReady();
    await this.exec('BEGIN');
    try {
      const result = await cb();
      await this.exec('COMMIT');
      return result;
    } catch (e) {
      try { await this.exec('ROLLBACK'); } catch {}
      throw e;
    }
  },
};

export function closeDb() {
  return new Promise((resolve) => {
    if (!db) return resolve();
    db.close((err) => {
      if (err) console.warn('[db] Erreur fermeture :', err.message);
      db = null;
      dbReady = null;
      resolve();
    });
  });
}