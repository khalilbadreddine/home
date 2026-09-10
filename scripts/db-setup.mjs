/**
 * Creates the database schema (idempotent) on whichever database you point at:
 *   - no DATABASE_URL        → local SQLite at ./data/local.db (zero config)
 *   - DATABASE_URL=postgres… → Neon / Postgres
 * Also makes sure an owner user exists (ADMIN_EMAIL / ADMIN_PASSWORD).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { schemaSql, SCHEMA_VERSION } from '../lib/db/schema.mjs';

const require = createRequire(import.meta.url);

function loadEnvFile() {
  try {
    const f = path.join(process.cwd(), '.env');
    if (!existsSync(f)) return;
    for (const line of readFileSync(f, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {}
}
loadEnvFile();

const url = process.env.DATABASE_URL || '';
let dialect, execSql, insert, select, ph, phs;
let finish;

if (url.startsWith('postgres://') || url.startsWith('postgresql://')) {
  dialect = 'postgres';
  console.log('▶ Setting up PostgreSQL (Neon) at', url.replace(/:[^:@/]+@/, ':•••@'));
  const pg = require('pg');
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  execSql = (sql) => client.query(sql);
  insert = (sql, params) => client.query(sql, params);
  select = (sql, params) => client.query(sql, params).then((r) => r.rows);
  finish = () => client.end();
  ph = (i) => `$${i + 1}`;
  phs = (n) => Array.from({ length: n }, (_, i) => `$${i + 1}`).join(',');
} else {
  dialect = 'sqlite';
  const file = process.env.LOCAL_DB || path.join(process.cwd(), 'data', 'local.db');
  console.log('▶ Setting up local SQLite at', path.relative(process.cwd(), file) || file);
  mkdirSync(path.dirname(file), { recursive: true });
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL;');
  execSql = (sql) => db.exec(sql);
  insert = (sql, params = []) => db.prepare(sql).run(...params);
  select = (sql, params = []) => db.prepare(sql).all(...params);
  finish = () => db.close();
  ph = () => '?';
  phs = (n) => Array.from({ length: n }, () => '?').join(',');
}

const sqls = schemaSql(dialect);
for (const s of sqls) await execSql(s);
await execSql(
  `INSERT INTO meta (key, value) VALUES ('schema_version', '${SCHEMA_VERSION}')
   ON CONFLICT(key) DO UPDATE SET value = excluded.value`
);
console.log(`  schema v${SCHEMA_VERSION} ready (${sqls.length} statements)`);

// owner user
const adminEmail = (process.env.ADMIN_EMAIL || 'admin@therecipeseeker.com').toLowerCase();
const selSql = dialect === 'postgres' ? 'SELECT * FROM users WHERE lower(email) = $1' : 'SELECT * FROM users WHERE lower(email) = ?';
const existing = await select(selSql, [adminEmail]);
if (!existing.length) {
  let password = process.env.ADMIN_PASSWORD;
  const credFile = path.join(process.cwd(), 'data', 'owner-credentials.txt');
  if (!password) {
    password = randomBytes(6).toString('base64url');
    try {
      writeFileSync(
        credFile,
        `TherecipeSeeker owner login (generated — change it in Settings when ready)\nEmail:    ${adminEmail}\nPassword: ${password}\n`,
        { mode: 0o600 }
      );
      console.log('  owner created — credentials saved to data/owner-credentials.txt');
    } catch {
      console.log(`  owner created — Email: ${adminEmail}  Password: ${password}`);
    }
  } else {
    console.log('  owner created from ADMIN_EMAIL / ADMIN_PASSWORD');
  }
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash(password, 10);
  await insert(
    `INSERT INTO users (name, email, email_verified, password_hash, is_owner, created_at) VALUES (${phs(4)}, 1, ${ph(4)})`,
    ['The Seeker', adminEmail, new Date().toISOString(), hash, new Date().toISOString()]
  );
} else {
  console.log('  owner already exists (' + adminEmail + ')');
}

finish();
console.log('✅ Database ready. Run "npm run db:seed" to add starter content (idempotent).');
