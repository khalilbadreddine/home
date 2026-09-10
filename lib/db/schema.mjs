/**
 * Single source of truth for the database schema.
 * Generates CREATE statements for both SQLite (local dev / preview)
 * and PostgreSQL (Neon — just set DATABASE_URL).
 * Portable types only: TEXT / INTEGER, JSON as TEXT, 0/1 booleans.
 */

export const SCHEMA_VERSION = '1';

const T = {
  meta: [
    { name: 'key', type: 'TEXT', pk: true },
    { name: 'value', type: 'TEXT' },
  ],
  users: [
    { name: 'id', type: 'INT', pk: true },
    { name: 'name', type: 'TEXT' },
    { name: 'email', type: 'TEXT', notnull: true, unique: true },
    { name: 'email_verified', type: 'TEXT' },
    { name: 'image', type: 'TEXT' },
    { name: 'password_hash', type: 'TEXT' },
    { name: 'is_owner', type: 'INT', default: '0' },
    { name: 'created_at', type: 'TEXT' },
  ],
  accounts: [
    { name: 'id', type: 'INT', pk: true },
    { name: 'user_id', type: 'INT', notnull: true },
    { name: 'type', type: 'TEXT' },
    { name: 'provider', type: 'TEXT' },
    { name: 'provider_account_id', type: 'TEXT' },
    { name: 'refresh_token', type: 'TEXT' },
    { name: 'access_token', type: 'TEXT' },
    { name: 'expires_at', type: 'INT' },
    { name: 'token_type', type: 'TEXT' },
    { name: 'scope', type: 'TEXT' },
    { name: 'id_token', type: 'TEXT' },
    { name: 'session_state', type: 'TEXT' },
  ],
  sessions: [
    { name: 'id', type: 'INT', pk: true },
    { name: 'session_token', type: 'TEXT', unique: true, notnull: true },
    { name: 'user_id', type: 'INT', notnull: true },
    { name: 'expires', type: 'TEXT' },
  ],
  verification_tokens: [
    { name: 'identifier', type: 'TEXT', composite: true },
    { name: 'token', type: 'TEXT', composite: true },
    { name: 'expires', type: 'TEXT', notnull: true },
  ],
  recipes: [
    { name: 'id', type: 'INT', pk: true },
    { name: 'slug', type: 'TEXT', unique: true, notnull: true },
    { name: 'title', type: 'TEXT', notnull: true },
    { name: 'kitchen_note', type: 'TEXT' },
    { name: 'moods', type: 'TEXT', default: "''" },
    { name: 'time_min', type: 'INT', default: '0' },
    { name: 'servings', type: 'INT', default: '0' },
    { name: 'difficulty', type: 'TEXT', default: "'easy'" },
    { name: 'image', type: 'TEXT' },
    { name: 'ingredients', type: 'TEXT', default: "'[]'" },
    { name: 'steps', type: 'TEXT', default: "'[]'" },
    { name: 'pins', type: 'TEXT', default: "'[]'" },
    { name: 'tips', type: 'TEXT', default: "'[]'" },
    { name: 'seo_title', type: 'TEXT' },
    { name: 'seo_description', type: 'TEXT' },
    { name: 'status', type: 'TEXT', default: "'draft'" },
    { name: 'published_at', type: 'TEXT' },
    { name: 'views', type: 'INT', default: '0' },
    { name: 'served', type: 'INT', default: '0' },
    { name: 'created_at', type: 'TEXT' },
    { name: 'updated_at', type: 'TEXT' },
  ],
  stories: [
    { name: 'id', type: 'INT', pk: true },
    { name: 'slug', type: 'TEXT', unique: true, notnull: true },
    { name: 'title', type: 'TEXT', notnull: true },
    { name: 'excerpt', type: 'TEXT' },
    { name: 'body', type: 'TEXT' },
    { name: 'image', type: 'TEXT' },
    { name: 'tag', type: 'TEXT', default: "'notes'" },
    { name: 'status', type: 'TEXT', default: "'draft'" },
    { name: 'seo_title', type: 'TEXT' },
    { name: 'seo_description', type: 'TEXT' },
    { name: 'published_at', type: 'TEXT' },
    { name: 'created_at', type: 'TEXT' },
    { name: 'updated_at', type: 'TEXT' },
  ],
  comments: [
    { name: 'id', type: 'INT', pk: true },
    { name: 'recipe_id', type: 'INT' },
    { name: 'story_id', type: 'INT' },
    { name: 'name', type: 'TEXT', notnull: true },
    { name: 'message', type: 'TEXT', notnull: true },
    { name: 'status', type: 'TEXT', default: "'visible'" },
    { name: 'created_at', type: 'TEXT' },
  ],
  subscribers: [
    { name: 'id', type: 'INT', pk: true },
    { name: 'email', type: 'TEXT', unique: true, notnull: true },
    { name: 'source', type: 'TEXT', default: "'site'" },
    { name: 'created_at', type: 'TEXT' },
  ],
  workflows: [
    { name: 'id', type: 'INT', pk: true },
    { name: 'name', type: 'TEXT', notnull: true },
    { name: 'description', type: 'TEXT' },
    { name: 'trigger', type: 'TEXT', default: "'manual'" },
    { name: 'steps', type: 'TEXT', default: "'[]'" },
    { name: 'active', type: 'INT', default: '1' },
    { name: 'schedule_hours', type: 'INT' },
    { name: 'last_run', type: 'TEXT' },
    { name: 'created_at', type: 'TEXT' },
    { name: 'updated_at', type: 'TEXT' },
  ],
  jobs: [
    { name: 'id', type: 'INT', pk: true },
    { name: 'workflow_id', type: 'INT' },
    { name: 'skill_id', type: 'TEXT' },
    { name: 'name', type: 'TEXT', notnull: true },
    { name: 'status', type: 'TEXT', default: "'queued'" },
    { name: 'input', type: 'TEXT', default: "'{}'" },
    { name: 'log', type: 'TEXT', default: "'[]'" },
    { name: 'output', type: 'TEXT', default: "'{}'" },
    { name: 'created_at', type: 'TEXT' },
    { name: 'finished_at', type: 'TEXT' },
  ],
  settings: [
    { name: 'key', type: 'TEXT', pk: true },
    { name: 'value', type: 'TEXT' },
  ],
};

const INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_recipes_status ON recipes(status)',
  'CREATE INDEX IF NOT EXISTS idx_comments_recipe ON comments(recipe_id)',
  'CREATE INDEX IF NOT EXISTS idx_comments_story ON comments(story_id)',
  'CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)',
  'CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)',
  'CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_provider_acc ON accounts(provider, provider_account_id)',
];

function columnDef(c, dialect) {
  if (c.composite) return `${c.name} TEXT`;
  if (c.type === 'INT') {
    if (c.pk) {
      return dialect === 'sqlite'
        ? `${c.name} INTEGER PRIMARY KEY AUTOINCREMENT`
        : `${c.name} BIGSERIAL PRIMARY KEY`;
    }
    let s = `${c.name} INTEGER`;
    if (c.notnull) s += ' NOT NULL';
    if (c.default != null) s += ` DEFAULT ${c.default}`;
    return s;
  }
  let s = `${c.name} TEXT`;
  if (c.pk) s += ' PRIMARY KEY';
  else if (c.notnull) s += ' NOT NULL';
  if (c.unique) s += ' UNIQUE';
  if (c.default != null) s += ` DEFAULT ${c.default}`;
  return s;
}

export function schemaSql(dialect) {
  const out = [];
  for (const [table, cols] of Object.entries(T)) {
    const hasComposite = cols.some((c) => c.composite);
    let body = cols.map((c) => columnDef(c, dialect)).join(',\n  ');
    if (hasComposite) {
      body += `,\n  PRIMARY KEY (${cols.filter((c) => c.composite).map((c) => c.name).join(', ')})`;
    }
    out.push(`CREATE TABLE IF NOT EXISTS ${table} (\n  ${body}\n);`);
  }
  out.push(...INDEXES);
  return out;
}

export const TABLE_NAMES = Object.keys(T);
