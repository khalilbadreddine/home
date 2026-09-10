import { createRequire } from 'node:module';

export type Row = Record<string, any>;

export interface Db {
  kind: 'sqlite' | 'postgres';
  query(sql: string, params?: any[]): Promise<Row[]>;
  get(sql: string, params?: any[]): Promise<Row | undefined>;
  /** Runs an INSERT (SQL must end with RETURNING id) or UPDATE; returns { id?, changes } */
  run(sql: string, params?: any[]): Promise<{ id?: number; changes: number }>;
  exec(sql: string): Promise<void>;
}

const require = createRequire(import.meta.url);

// Normalize $1,$2… placeholders to ? for SQLite
function toSqliteSql(sql: string): string {
  return sql.replace(/\$\d+/g, '?');
}

function sqliteDriver(file: string): Db {
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  return {
    kind: 'sqlite',
    async query(sql, params = []) {
      const rows = db.prepare(toSqliteSql(sql)).all(...params) as Row[];
      // node:sqlite returns null-prototype objects — RSC serialization needs plain ones
      return rows.map((r) => ({ ...r }));
    },
    async get(sql, params = []) {
      const row = db.prepare(toSqliteSql(sql)).get(...params) as Row | undefined;
      return row ? { ...row } : undefined;
    },
    async run(sql, params = []) {
      const r = db.prepare(toSqliteSql(sql)).run(...params);
      const id = Number((r as any).lastInsertRowid);
      return { id: id > 0 ? id : undefined, changes: Number(r.changes) };
    },
    async exec(sql) {
      db.exec(sql);
    },
  };
}

function postgresDriver(url: string): Db {
  const pg = require('pg') as any;
  const pool = new pg.Pool({ connectionString: url, max: 5 });
  return {
    kind: 'postgres',
    async query(sql, params = []) {
      const r = await pool.query(sql, params);
      return r.rows as Row[];
    },
    async get(sql, params = []) {
      const r = await pool.query(sql, params);
      return (r.rows[0] as Row) ?? undefined;
    },
    async run(sql, params = []) {
      const r = await pool.query(sql, params);
      return { id: r.rows?.[0]?.id ?? undefined, changes: r.rowCount ?? 0 };
    },
    async exec(sql) {
      await pool.query(sql);
    },
  };
}

let _db: Db | null = null;

export function getDb(): Db {
  if (_db) return _db;
  const url = process.env.DATABASE_URL || '';
  if (url.startsWith('postgres://') || url.startsWith('postgresql://')) {
    _db = postgresDriver(url);
  } else {
    const path = require('node:path');
    const file = process.env.LOCAL_DB || path.join(process.cwd(), 'data', 'local.db');
    const fs = require('node:fs');
    fs.mkdirSync(file.replace(/\/[^/]+$/, ''), { recursive: true });
    _db = sqliteDriver(file);
  }
  return _db;
}

let _ensured: Promise<void> | null = null;
export function ensureSchema(): Promise<void> {
  if (!_ensured) {
    _ensured = (async () => {
      const { schemaSql, SCHEMA_VERSION } = await import('./schema.mjs');
      const db = getDb();
      // create the tiny meta table first so we can version-check
      await db.exec(`CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);`);
      const row = await db.get('SELECT value FROM meta WHERE key = ?', ['schema_version']);
      if (row?.value === SCHEMA_VERSION) return;
      for (const stmt of schemaSql(db.kind)) await db.exec(stmt);
      await db.exec(
        `INSERT INTO meta (key, value) VALUES ('schema_version', ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`
      );
    })();
    _ensured.catch(() => (_ensured = null));
  }
  return _ensured;
}

export const now = () => new Date().toISOString();

export function jparse<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

export function jstring(v: unknown): string {
  return JSON.stringify(v ?? null);
}
