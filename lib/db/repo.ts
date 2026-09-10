import { ensureSchema, getDb, jparse, jstring, now, type Row } from './index';

async function db() {
  await ensureSchema();
  return getDb();
}

/* ── settings ─────────────────────────────────────── */
export async function getSetting(key: string, fallback = ''): Promise<string> {
  const d = await db();
  const row = await d.get('SELECT value FROM settings WHERE key = $1', [key]);
  return row?.value ?? fallback;
}

export async function getSettings(): Promise<Record<string, string>> {
  const d = await db();
  const rows = await d.query('SELECT key, value FROM settings');
  const out: Record<string, string> = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const d = await db();
  await d.run(
    `INSERT INTO settings (key, value) VALUES ($1, $2)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value]
  );
}

export async function getMeta(key: string): Promise<string | undefined> {
  const d = await db();
  const row = await d.get('SELECT value FROM meta WHERE key = $1', [key]);
  return row?.value;
}
export async function setMeta(key: string, value: string): Promise<void> {
  const d = await db();
  await d.run(
    `INSERT INTO meta (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value]
  );
}

/* ── recipes ──────────────────────────────────────── */
export interface RecipeInput {
  slug: string; title: string; kitchen_note?: string; moods?: string;
  time_min?: number; servings?: number; difficulty?: string; image?: string;
  ingredients?: any[]; steps?: string[]; pins?: any[]; tips?: string[];
  seo_title?: string; seo_description?: string; status?: string;
}

export async function listRecipes(opts: { status?: string; mood?: string; limit?: number } = {}): Promise<Row[]> {
  const d = await db();
  const where: string[] = [];
  const params: any[] = [];
  if (opts.status) { params.push(opts.status); where.push(`status = $${params.length}`); }
  if (opts.mood) { params.push(`%${opts.mood}%`); where.push(`moods LIKE $${params.length}`); }
  const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const lim = opts.limit ? `LIMIT ${Math.min(opts.limit, 200)}` : '';
  return d.query(
    `SELECT * FROM recipes ${w} ORDER BY published_at IS NULL, published_at DESC ${lim}`,
    params
  );
}

export async function getRecipeBySlug(slug: string): Promise<Row | undefined> {
  const d = await db();
  return d.get('SELECT * FROM recipes WHERE slug = $1', [slug]);
}

export async function getRecipeById(id: number): Promise<Row | undefined> {
  const d = await db();
  return d.get('SELECT * FROM recipes WHERE id = $1', [id]);
}

export async function createRecipe(input: RecipeInput): Promise<number> {
  const d = await db();
  const ts = now();
  const r = await d.run(
    `INSERT INTO recipes (slug, title, kitchen_note, moods, time_min, servings, difficulty, image,
       ingredients, steps, pins, tips, seo_title, seo_description, status, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$16) RETURNING id`,
    [
      input.slug, input.title, input.kitchen_note ?? '', input.moods ?? '',
      input.time_min ?? 0, input.servings ?? 0, input.difficulty ?? 'easy', input.image ?? '',
      jstring(input.ingredients ?? []), jstring(input.steps ?? []), jstring(input.pins ?? []), jstring(input.tips ?? []),
      input.seo_title ?? '', input.seo_description ?? '', input.status ?? 'draft', ts,
    ]
  );
  return r.id!;
}

export async function updateRecipe(id: number, input: Partial<RecipeInput>): Promise<void> {
  const d = await db();
  const sets: string[] = [];
  const params: any[] = [];
  const map: Record<string, (v: any) => any> = {
    slug: (v) => v, title: (v) => v, kitchen_note: (v) => v, moods: (v) => v,
    image: (v) => v, seo_title: (v) => v, seo_description: (v) => v, status: (v) => v,
    time_min: (v) => Number(v) || 0, servings: (v) => Number(v) || 0, difficulty: (v) => v,
    ingredients: (v) => jstring(v), steps: (v) => jstring(v), pins: (v) => jstring(v), tips: (v) => jstring(v),
  };
  for (const [k, fn] of Object.entries(map)) {
    if (input[k as keyof RecipeInput] !== undefined) {
      params.push(fn(input[k as keyof RecipeInput]!));
      sets.push(`${k} = $${params.length}`);
    }
  }
  if (sets.length) {
    params.push(id);
    await d.run(`UPDATE recipes SET ${sets.join(', ')}, updated_at = ? WHERE id = $${params.length}`, [now(), ...[params.pop()!]]);
  }
}

export async function deleteRecipe(id: number): Promise<void> {
  const d = await db();
  await d.run('DELETE FROM recipes WHERE id = $1', [id]);
  await d.run('DELETE FROM comments WHERE recipe_id = $1', [id]);
}

export async function publishRecipe(id: number): Promise<Row | undefined> {
  const d = await db();
  await d.run('UPDATE recipes SET status = $1, published_at = $2, updated_at = $2 WHERE id = $3', ['published', now(), id]);
  return getRecipeById(id);
}

export async function unpublishRecipe(id: number): Promise<void> {
  const d = await db();
  await d.run('UPDATE recipes SET status = $1, published_at = NULL, updated_at = $2 WHERE id = $3', ['draft', now(), id]);
}

export async function bumpViews(id: number): Promise<void> {
  const d = await db();
  await d.run('UPDATE recipes SET views = views + 1 WHERE id = $1', [id]);
}

export async function bumpServed(id: number): Promise<void> {
  const d = await db();
  await d.run('UPDATE recipes SET served = served + 1 WHERE id = $1', [id]);
}

/* ── stories ──────────────────────────────────────── */
export interface StoryInput {
  slug: string; title: string; excerpt?: string; body?: string; image?: string;
  tag?: string; status?: string; seo_title?: string; seo_description?: string;
}

export async function listStories(opts: { status?: string; limit?: number } = {}): Promise<Row[]> {
  const d = await db();
  if (opts.status) {
    const lim = opts.limit ? `LIMIT ${Math.min(opts.limit, 200)}` : '';
    return d.query(`SELECT * FROM stories WHERE status = $1 ORDER BY published_at IS NULL, published_at DESC ${lim}`, [opts.status]);
  }
  const lim = opts.limit ? `LIMIT ${Math.min(opts.limit, 200)}` : '';
  return d.query(`SELECT * FROM stories ORDER BY published_at IS NULL, published_at DESC ${lim}`);
}

export async function getStoryBySlug(slug: string): Promise<Row | undefined> {
  const d = await db();
  return d.get('SELECT * FROM stories WHERE slug = $1', [slug]);
}

export async function getStoryById(id: number): Promise<Row | undefined> {
  const d = await db();
  return d.get('SELECT * FROM stories WHERE id = $1', [id]);
}

export async function createStory(input: StoryInput): Promise<number> {
  const d = await db();
  const ts = now();
  const r = await d.run(
    `INSERT INTO stories (slug, title, excerpt, body, image, tag, status, seo_title, seo_description, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10) RETURNING id`,
    [
      input.slug, input.title, input.excerpt ?? '', input.body ?? '', input.image ?? '',
      input.tag ?? 'notes', input.status ?? 'draft', input.seo_title ?? '', input.seo_description ?? '', ts,
    ]
  );
  return r.id!;
}

export async function updateStory(id: number, input: Partial<StoryInput>): Promise<void> {
  const d = await db();
  const sets: string[] = [];
  const params: any[] = [];
  const keys = ['slug', 'title', 'excerpt', 'body', 'image', 'tag', 'status', 'seo_title', 'seo_description'] as const;
  for (const k of keys) {
    const v = (input as any)[k];
    if (v !== undefined) { params.push(v); sets.push(`${k} = $${params.length}`); }
  }
  if (sets.length) {
    params.push(now());
    sets.push(`updated_at = $${params.length}`);
    params.push(id);
    await d.run(`UPDATE stories SET ${sets.join(', ')} WHERE id = $${params.length}`, params);
  }
}

export async function deleteStory(id: number): Promise<void> {
  const d = await db();
  await d.run('DELETE FROM stories WHERE id = $1', [id]);
  await d.run('DELETE FROM comments WHERE story_id = $1', [id]);
}

export async function publishStory(id: number): Promise<Row | undefined> {
  const d = await db();
  await d.run('UPDATE stories SET status = $1, published_at = $2, updated_at = $2 WHERE id = $3', ['published', now(), id]);
  return getStoryById(id);
}

export async function unpublishStory(id: number): Promise<void> {
  const d = await db();
  await d.run('UPDATE stories SET status = $1, published_at = NULL, updated_at = $2 WHERE id = $3', ['draft', now(), id]);
}

/* ── comments ─────────────────────────────────────── */
export async function listVisibleComments(kind: 'recipe' | 'story', id: number): Promise<Row[]> {
  const d = await db();
  const col = kind === 'recipe' ? 'recipe_id' : 'story_id';
  return d.query(
    `SELECT id, name, message, created_at FROM comments WHERE ${col} = $1 AND status = 'visible' ORDER BY created_at DESC LIMIT 100`,
    [id]
  );
}

export async function addComment(input: { recipe_id?: number; story_id?: number; name: string; message: string; status?: string }): Promise<number> {
  const d = await db();
  const r = await d.run(
    `INSERT INTO comments (recipe_id, story_id, name, message, status, created_at)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [input.recipe_id ?? null, input.story_id ?? null, input.name.slice(0, 60), input.message.slice(0, 1200), input.status ?? 'visible', now()]
  );
  return r.id!;
}

export async function listCommentsAll(limit = 200): Promise<Row[]> {
  const d = await db();
  return d.query(
    `SELECT c.*, r.title AS recipe_title, s.title AS story_title
     FROM comments c
     LEFT JOIN recipes r ON r.id = c.recipe_id
     LEFT JOIN stories s ON s.id = c.story_id
     ORDER BY c.created_at DESC LIMIT ${Math.min(limit, 500)}`
  );
}

export async function setCommentStatus(id: number, status: string): Promise<void> {
  const d = await db();
  await d.run('UPDATE comments SET status = $1 WHERE id = $2', [status, id]);
}

export async function deleteComment(id: number): Promise<void> {
  const d = await db();
  await d.run('DELETE FROM comments WHERE id = $1', [id]);
}

export async function countCommentsByStatus(): Promise<Row[]> {
  const d = await db();
  return d.query('SELECT status, COUNT(*) AS n FROM comments GROUP BY status');
}

/* ── subscribers ──────────────────────────────────── */
export async function addSubscriber(email: string, source = 'site'): Promise<{ added: boolean }> {
  const d = await db();
  const clean = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean)) throw new Error('INVALID_EMAIL');
  const existing = await d.get('SELECT id FROM subscribers WHERE email = $1', [clean]);
  if (existing) return { added: false };
  await d.run('INSERT INTO subscribers (email, source, created_at) VALUES ($1,$2,$3)', [clean, source, now()]);
  return { added: true };
}

export async function listSubscribers(): Promise<Row[]> {
  const d = await db();
  return d.query('SELECT email, source, created_at FROM subscribers ORDER BY created_at DESC LIMIT 2000');
}

/* ── workflows ────────────────────────────────────── */
export async function listWorkflows(): Promise<Row[]> {
  const d = await db();
  return d.query('SELECT * FROM workflows ORDER BY id');
}
export async function getWorkflow(id: number): Promise<Row | undefined> {
  const d = await db();
  return d.get('SELECT * FROM workflows WHERE id = $1', [id]);
}
export async function createWorkflow(input: { name: string; description?: string; trigger?: string; steps?: any[]; active?: boolean; schedule_hours?: number | null }): Promise<number> {
  const d = await db();
  const ts = now();
  const r = await d.run(
    `INSERT INTO workflows (name, description, trigger, steps, active, schedule_hours, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$7) RETURNING id`,
    [input.name, input.description ?? '', input.trigger ?? 'manual', jstring(input.steps ?? []), input.active === false ? 0 : 1, input.schedule_hours ?? null, ts]
  );
  return r.id!;
}
export async function updateWorkflow(id: number, input: Partial<{ name: string; description: string; trigger: string; steps: any[]; active: boolean; schedule_hours: number | null }>): Promise<void> {
  const d = await db();
  const sets: string[] = [];
  const params: any[] = [];
  if (input.name !== undefined) { params.push(input.name); sets.push(`name = $${params.length}`); }
  if (input.description !== undefined) { params.push(input.description); sets.push(`description = $${params.length}`); }
  if (input.trigger !== undefined) { params.push(input.trigger); sets.push(`trigger = $${params.length}`); }
  if (input.steps !== undefined) { params.push(jstring(input.steps)); sets.push(`steps = $${params.length}`); }
  if (input.active !== undefined) { params.push(input.active ? 1 : 0); sets.push(`active = $${params.length}`); }
  if (input.schedule_hours !== undefined) { params.push(input.schedule_hours); sets.push(`schedule_hours = $${params.length}`); }
  if (sets.length) {
    params.push(now());
    sets.push(`updated_at = $${params.length}`);
    params.push(id);
    await d.run(`UPDATE workflows SET ${sets.join(', ')} WHERE id = $${params.length}`, params);
  }
}
export async function deleteWorkflow(id: number): Promise<void> {
  const d = await db();
  await d.run('DELETE FROM workflows WHERE id = $1', [id]);
}
export async function setWorkflowLastRun(id: number): Promise<void> {
  const d = await db();
  await d.run('UPDATE workflows SET last_run = $1 WHERE id = $2', [now(), id]);
}

/* ── jobs ─────────────────────────────────────────── */
export async function createJob(input: { workflow_id?: number | null; skill_id: string; name: string; context?: any }): Promise<number> {
  const d = await db();
  const r = await d.run(
    `INSERT INTO jobs (workflow_id, skill_id, name, status, input, log, created_at)
     VALUES ($1,$2,$3,'queued',$4,'[]',$5) RETURNING id`,
    [input.workflow_id ?? null, input.skill_id, input.name, jstring(input.context ?? {}), now()]
  );
  return r.id!;
}

export async function getJob(id: number): Promise<Row | undefined> {
  const d = await db();
  return d.get(
    `SELECT j.*, w.name AS workflow_name FROM jobs j LEFT JOIN workflows w ON w.id = j.workflow_id WHERE j.id = $1`,
    [id]
  );
}

export async function listJobs(limit = 100): Promise<Row[]> {
  const d = await db();
  return d.query(
    `SELECT j.*, w.name AS workflow_name FROM jobs j LEFT JOIN workflows w ON w.id = j.workflow_id
     ORDER BY j.id DESC LIMIT ${Math.min(limit, 500)}`
  );
}

export async function listQueuedJobs(limit = 5): Promise<Row[]> {
  const d = await db();
  return d.query(`SELECT * FROM jobs WHERE status = 'queued' ORDER BY id LIMIT ${Math.min(limit, 20)}`);
}

export async function setJobStatus(id: number, status: string, log?: any[], output?: any): Promise<void> {
  const d = await db();
  if (status === 'done' || status === 'failed') {
    await d.run('UPDATE jobs SET status = $1, log = $2, output = $3, finished_at = $4 WHERE id = $5',
      [status, jstring(log ?? []), jstring(output ?? {}), now(), id]);
  } else {
    await d.run('UPDATE jobs SET status = $1, log = $2, output = $3 WHERE id = $4',
      [status, jstring(log ?? []), jstring(output ?? {}), id]);
  }
}

export async function deleteJob(id: number): Promise<void> {
  const d = await db();
  await d.run('DELETE FROM jobs WHERE id = $1', [id]);
}

/* ── users (auth adapter) ─────────────────────────── */
export async function dbCreateUser(data: any): Promise<any> {
  const d = await db();
  const r = await d.run(
    'INSERT INTO users (name, email, email_verified, image, password_hash, is_owner, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
    [data.name ?? null, data.email, data.emailVerified ?? null, data.image ?? null, data.password_hash ?? null, data.is_owner ? 1 : 0, now()]
  );
  const row = await d.get('SELECT * FROM users WHERE id = $1', [r.id]);
  return row as any;
}

export async function dbGetUser(id: string): Promise<any> {
  const d = await db();
  return d.get('SELECT * FROM users WHERE id = $1', [Number(id)]);
}

export async function dbGetUserByEmail(email: string): Promise<any> {
  const d = await db();
  return d.get('SELECT * FROM users WHERE lower(email) = lower($1)', [email]);
}

export async function dbUpdateUser(id: string, data: any): Promise<any> {
  const d = await db();
  const sets: string[] = [];
  const params: any[] = [];
  const map: Record<string, string> = { name: 'name', email: 'email', image: 'image', email_verified: 'email_verified', is_owner: 'is_owner', password_hash: 'password_hash' };
  for (const [k, col] of Object.entries(map)) {
    if (data[k] !== undefined) {
      params.push(k === 'is_owner' ? (data[k] ? 1 : 0) : data[k]);
      sets.push(`${col} = $${params.length}`);
    }
  }
  if (sets.length) {
    params.push(Number(id));
    const idParam = `$${params.length}`;
    await d.run(`UPDATE users SET ${sets.join(', ')} WHERE id = ${idParam}`, params);
  }
  return dbGetUser(id);
}

export async function dbLinkAccount(account: any, userId: number): Promise<any> {
  const d = await db();
  await d.run(
    `INSERT INTO accounts (user_id, provider, provider_account_id, type, access_token, refresh_token, expires_at, token_type, scope, id_token, session_state)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [userId, account.provider, account.providerAccountId, account.type ?? 'database',
     account.accessToken ?? null, account.refreshToken ?? null, account.expiresAt ?? null,
     account.tokenType ?? null, account.scope ?? null, account.idToken ?? null, account.sessionState ?? null]
  );
}

export async function dbCreateSession(session: { sessionToken: string; userId: number; expires: string | Date }): Promise<void> {
  const d = await db();
  await d.run('INSERT INTO sessions (session_token, user_id, expires) VALUES ($1,$2,$3)',
    [session.sessionToken, session.userId, new Date(session.expires).toISOString()]);
}

export async function dbGetSession(token: string): Promise<any> {
  const d = await db();
  const row = await d.get(
    `SELECT s.*, u.id AS user_id, u.name, u.email, u.image, u.is_owner
     FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.session_token = $1`,
    [token]
  );
  if (!row) return undefined;
  const { user_id, ...rest } = row;
  return { ...rest, user: { id: String(user_id), name: row.name, email: row.email, image: row.image } };
}

export async function dbUpdateSession(token: string, data: any): Promise<void> {
  await dbGetSession(token); // existence check
}

export async function dbDeleteSession(token: string): Promise<void> {
  const d = await db();
  await d.run('DELETE FROM sessions WHERE session_token = $1', [token]);
}

export async function dbGetUserByAccount(provider: string, providerAccountId: string): Promise<any> {
  const d = await db();
  const row = await d.get(
    `SELECT u.* FROM accounts a JOIN users u ON u.id = a.user_id
     WHERE a.provider = $1 AND a.provider_account_id = $2`,
    [provider, providerAccountId]
  );
  return row;
}

export async function dbDeleteUser(id: string): Promise<void> {
  const d = await db();
  await d.run('DELETE FROM users WHERE id = $1', [Number(id)]);
}

/* ── misc ─────────────────────────────────────────── */
export async function overviewStats(): Promise<Row> {
  const d = await db();
  const [recipes, published, stories, subs, comments, views, served, jobs] = await Promise.all([
    d.get('SELECT COUNT(*) AS n FROM recipes'),
    d.get("SELECT COUNT(*) AS n FROM recipes WHERE status='published'"),
    d.get("SELECT COUNT(*) AS n FROM stories WHERE status='published'"),
    d.get('SELECT COUNT(*) AS n FROM subscribers'),
    d.get('SELECT COUNT(*) AS n FROM comments'),
    d.get('SELECT COALESCE(SUM(views),0) AS n FROM recipes'),
    d.get('SELECT COALESCE(SUM(served),0) AS n FROM recipes'),
    d.get("SELECT COUNT(*) AS n FROM jobs WHERE status='done'"),
  ]);
  return {
    recipes: recipes?.n ?? 0,
    published: published?.n ?? 0,
    stories: stories?.n ?? 0,
    subscribers: subs?.n ?? 0,
    comments: comments?.n ?? 0,
    views: views?.n ?? 0,
    served: served?.n ?? 0,
    jobsDone: jobs?.n ?? 0,
  };
}

export { jparse };
