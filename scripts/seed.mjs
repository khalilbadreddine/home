/**
 * Seeds starter content (idempotent — safe to run any time).
 * Starter recipes/story are REAL content: edit or delete them from the dashboard.
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { RECIPES, STORIES, SETTINGS, WORKFLOWS } from './seed-data.mjs';

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
let ph, insert, select, update, close;

if (url.startsWith('postgres://') || url.startsWith('postgresql://')) {
  const pg = require('pg');
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  ph = (n) => `$${n + 1}`;
  insert = (sql, params) => client.query(sql, params);
  select = (sql, params) => client.query(sql, params).then((r) => r.rows);
  update = (sql, params) => client.query(sql, params);
  close = () => client.end();
  console.log('▶ Seeding PostgreSQL (Neon)');
} else {
  const file = process.env.LOCAL_DB || path.join(process.cwd(), 'data', 'local.db');
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(file);
  ph = () => '?';
  insert = (sql, params = []) => db.prepare(sql).run(...params);
  select = (sql, params = []) => db.prepare(sql).all(...params);
  update = (sql, params = []) => db.prepare(sql).run(...params);
  close = () => db.close();
  console.log('▶ Seeding local SQLite at', path.relative(process.cwd(), file) || file);
}

const j = (v) => JSON.stringify(v ?? null);
const now = () => new Date().toISOString();

let made = 0;

// recipes
for (const r of RECIPES) {
  const exists = await select(`SELECT id FROM recipes WHERE slug = ${ph(0)}`, [r.slug]);
  if (exists.length) continue;
  await insert(
    `INSERT INTO recipes (slug, title, kitchen_note, moods, time_min, servings, difficulty, image, ingredients, steps, pins, tips, seo_title, seo_description, status, published_at, created_at, updated_at)
     VALUES (${ph(0)},${ph(1)},${ph(2)},${ph(3)},${ph(4)},${ph(5)},${ph(6)},${ph(7)},${ph(8)},${ph(9)},${ph(10)},${ph(11)},'','',${ph(12)},${ph(13)},${ph(14)},${ph(15)})`,
    [
      r.slug, r.title, r.kitchen_note, r.moods, r.time_min, r.servings, r.difficulty, r.image,
      j(r.ingredients), j(r.steps), j(r.pins ?? []), j(r.tips ?? []), r.status, now(), now(), now(),
    ]
  );
  console.log(`  + recipe: ${r.title}`);
  made++;
}

// stories
for (const s of STORIES) {
  const exists = await select(`SELECT id FROM stories WHERE slug = ${ph(0)}`, [s.slug]);
  if (exists.length) continue;
  await insert(
    `INSERT INTO stories (slug, title, excerpt, body, image, tag, status, published_at, created_at, updated_at)
     VALUES (${ph(0)},${ph(1)},${ph(2)},${ph(3)},${ph(4)},${ph(5)},${ph(6)},${ph(7)},${ph(8)},${ph(9)})`,
    [s.slug, s.title, s.excerpt, s.body, s.image, s.tag, s.status, now(), now(), now()]
  );
  console.log(`  + story: ${s.title}`);
  made++;
}

// settings
for (const [k, v] of Object.entries(SETTINGS)) {
  const exists = await select(`SELECT key FROM settings WHERE key = ${ph(0)}`, [k]);
  if (exists.length) continue;
  await insert(`INSERT INTO settings (key, value) VALUES (${ph(0)},${ph(1)})`, [k, v]);
  made++;
}
console.log('  + default settings (site name, moods, circle rules, …)');

// starter workflows
for (const w of WORKFLOWS) {
  const exists = await select(`SELECT id FROM workflows WHERE name = ${ph(0)}`, [w.name]);
  if (exists.length) continue;
  await insert(
    `INSERT INTO workflows (name, description, trigger, steps, active, schedule_hours, created_at, updated_at)
     VALUES (${ph(0)},${ph(1)},${ph(2)},${ph(3)},${ph(4)},${ph(5)},${ph(6)},${ph(7)})`,
    [w.name, w.description, w.trigger, j(w.steps), w.active ? 1 : 0, w.schedule_hours, now(), now()]
  );
  console.log(`  + workflow: ${w.name}`);
  made++;
}

close();
console.log(made ? `✅ Seeded (${made} new items).` : '✅ Nothing new to seed — everything already exists.');
