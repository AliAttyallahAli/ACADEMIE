import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDb, closeDb } from '../config/database.js';
import { env } from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  console.log('🔄 Migration ALKHER ACADEMY...');
  console.log(`📁 Base : ${env.dbPath}`);

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  try {
    const db = getDb();
    db.exec(schema);
    console.log('✅ Migration terminée avec succès.');
  } catch (e) {
    console.error('❌ Erreur de migration :', e.message);
    process.exitCode = 1;
  } finally {
    closeDb();
  }
}

migrate();