# TherecipeSeeker — a kitchen that feels like home 🥣

The website for **@therecipeseeker** on Pinterest (11k friends, 68k visits/month) — built to feel
like a warm kitchen, not a content mill. Next.js 14 + GSAP + Three.js, free database, free local AI.

> **“Tonight, let’s make something kind to yourself.”**

---

## What makes this site not-generic

| Most recipe sites | This kitchen |
|---|---|
| Filter by category (dinner, dessert…) | **The Tonight Dial** — you tell the kitchen how your *evening feels* (Cozy, Quick, Feeding a Crowd, Bright, Sweet) and the pinboard rearranges around it |
| Search a recipe index | **My Pantry** — type what’s in your fridge and it ranks recipes by what you can *actually* make tonight, with an AI suggestion if Ollama is running |
| Blog posts | **Notes from the counter** — a notebook, not a blog |
| Comments / reviews | **The Circle** — a quiet, women-first space with house rules and a gentle moderation filter |
| White layout, hero banner | **Recipe cards on a pinboard** — taped, tilted, hoverable; the site even **dims into evening lights after 6pm** (and the hero drifts flour-dust in a Three.js sunbeam) |
| Static content | **The Stove** — a full owner dashboard with an **automation control center**: 6 pre-built AI skills (recipe writer, blog writer, Pinterest pins, SEO, newsletter, tips) chained into workflows that run automatically when you publish |

**No mock data.** The 4 starter recipes + journal story are real, complete content, editable or
deletable from the dashboard. Everything else is empty until *you* fill it — or until the automation does.

---

## 5-minute start (local)

```bash
npm install
npm run setup        # creates data/local.db + owner login + starter content
npm run dev          # http://localhost:3000
```

That’s it. SQLite is local (zero config), the owner password is generated and printed in
`data/owner-credentials.txt`, and the AI features light up the moment you run Ollama.

### Your first evening
1. Open the site, spin the Tonight dial, watch the board rearrange.
2. Click the moon icon (top right) — or wait past 6pm — for the evening lights.
3. Type `chicken, lemon, potatoes` in **My Pantry** → *Cook with what I have*.
4. Go to **The Stove** (`/admin`) with your owner key.
5. In **Automation → Run a skill**, press *Run now* on “Pinterest Pins” for a recipe.

---

## Put in your keys and it works

Everything is optional and additive. `.env.example` documents every variable.

| Key | Where to get it (all free) | What it unlocks |
|---|---|---|
| *(none)* | — | Full site on local SQLite, generated owner login, everything works |
| `DATABASE_URL` | [Neon.tech](https://neon.tech) → new project → copy **pooled** connection string | **Online Postgres** (same schema, zero code change) — required for Vercel |
| `ADMIN_EMAIL` + `ADMIN_PASSWORD` | choose | Your owner login at `/admin` (replaces the generated one) |
| `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → OAuth client (Web). Redirect URI: `https://yoursite/api/auth/callback/google` | “Continue with Google” on `/admin`. Sign in with the **same email as `ADMIN_EMAIL`** to be the owner |
| Ollama (local, free) | [ollama.com](https://ollama.com) → `ollama serve` + `ollama pull llama3.1` | All 6 AI skills, pantry “The Seeker says”, weekly letter drafts — **private, offline, on your machine**. Remote Ollama? set `OLLAMA_BASE_URL` |
| `RESEND_API_KEY` | [Resend.com](https://resend.com) (100 emails/day free) | The Sunday Spoon actually sends. Without it, letters save as drafts |
| `AUTH_SECRET` | any long string | NextAuth secret (auto-generated & persisted if empty) |
| `NEXT_PUBLIC_SITE_URL` | your deployed URL | share links / metadata |

> **Owner rule:** only the account matching `ADMIN_EMAIL` can manage the kitchen.
> Everyone else who signs in sees a gentle “this kitchen has an owner” screen.

---

## The Stove (owner dashboard)

`/admin` — seven rooms:

- **Overview** — published recipes, views, “served at home” counts, circle notes, subscribers, automations run.
- **Recipes** — full editor (kitchen note, moods, ingredients, steps, photo, SEO), publish/unpublish (publishing **fires the automation workflows**).
- **Stories** — journal notes with markdown.
- **The Circle** — moderation queue. Kind notes publish automatically; anything that trips the gentle filter (slurs, links, handles) is held for you.
- **Newsletter** — “The Sunday Spoon”: AI-drafted, you review, one click to send to all subscribers.
- **Automation** — the control center:
  - **6 pre-built skills**: Recipe Writer · Blog Writer · Pinterest Pins (10 captions + hashtags) · SEO Polish · Sunday Letter · Kitchen Tips.
  - **Workflows**: chain skills with `{{recipe.id}}`-style variables. Triggers: manual, *recipe published*, *story published*, or schedule (e.g. the weekly letter).
  - **Job history** with live logs.
  - 4 workflows are pre-built and active: *New recipe → set the table* (SEO + pins + tips), *New story → polish it*, *The Sunday Spoon (weekly)*, *Quick: write a recipe from scratch*.
- **Settings** — site identity, hero copy, circle rules, Ollama URL/model (with live “test”), Resend key, JSON export of all data.

---

## The stack

- **Next.js 14** (App Router, TypeScript) — server components for pages, client islands for the dial, board, pantry, cooking mode.
- **GSAP + ScrollTrigger** — hero word-mask reveal, mood-dial needle (elastic bounce), pinboard stagger, step-line draw, served-flame burst, page-level reveals.
- **Three.js** — the “sunbeam”: ~370 soft flour-dust particles drifting in warm light with mouse parallax; it warms to candlelight in evening mode and steps aside for `prefers-reduced-motion`.
- **Database** — one schema, two drivers, auto-detected:
  - `node:sqlite` (built into Node 22) for local — zero install.
  - `pg` (pure JS) for **Neon Postgres** when `DATABASE_URL` is set.
  - Schema is created automatically on boot; `npm run setup` is the explicit path (also seeds).
- **Auth** — NextAuth v4: Google OAuth + owner email/password (bcrypt), JWT sessions, owner gating on every admin route.
- **AI** — Ollama (`/api/chat`, JSON mode). All prompts are in `lib/skills.ts`; all models stay free & local.
- **Newsletter** — subscribers always saved; Resend optional.
- **Safety** — comments pass a conservative word/link filter before showing; the Circle shows its house rules everywhere; admin sees the hold queue.

---

## Deploy (free tier, ~15 min)

1. **Neon**: create a project, copy the *pooled* connection string → `DATABASE_URL`.
2. **Vercel**: import the repo. Add env vars (at minimum `DATABASE_URL`, `ADMIN_EMAIL`,
   `ADMIN_PASSWORD`, `AUTH_SECRET`; add Google + Resend when ready).
   Build command: `npm run setup && next build` (creates the schema + owner on Neon at deploy).
3. **Google**: add `https://yoursite.vercel.app/api/auth/callback/google` to the OAuth redirect URIs.
4. **Resend**: verify your sending domain, paste the key into Settings.
5. **Ollama**: AI features run where Ollama runs. Options:
   - run the site locally (`npm run start`) with Ollama on the same machine — full AI;
   - put Ollama on a small always-on machine/VPS and set `OLLAMA_BASE_URL`
     (on pure Vercel serverless, long-running Ollama calls aren’t available — everything else still works).

### Switching a local kitchen to Neon
```bash
export DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.aws.neon.tech/neondb?sslmode=require"
npm run setup        # creates the identical schema on Postgres
npm run db:seed      # adds starter content (idempotent)
npm run start
```
(Your local `data/local.db` stays untouched; export it first from Settings → *Export all data*
if you want to carry custom content over.)

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | dev server on :3000 |
| `npm run build` / `npm run start` | production |
| `npm run db:setup` | create schema + owner (auto-runs on boot too) |
| `npm run db:seed` | add starter content (idempotent) |
| `npm run setup` | both of the above |

## Structure

```
app/            pages (Tonight, Pantry, Journal, Circle, About, Admin) + all API routes
components/
  site/         Nav, MoodDial, Pinboard, RecipeClient (cooking mode), PantryClient,
                AmbientKitchen (three.js), Reveal (GSAP), …
  admin/        The Stove: Shell, Overview, Content, CircleTab, NewsletterTab,
                Automation (skills + workflows + jobs), Settings
lib/
  db/           dual driver (node:sqlite ⇄ pg) + repo + portable schema
  auth.ts       NextAuth (Google + owner credentials) + custom adapter
  skills.ts     the 6 pre-built AI skills
  workflow.ts   workflow engine + in-process worker + triggers
  ollama.ts     Ollama client (JSON mode, friendly errors)
  safety.ts     Circle moderation filter
scripts/        db-setup.mjs, seed.mjs, seed-data.mjs (starter content)
```

---

### A note on the name
*The Seeker* isn’t a logo — it’s the voice. When a visitor has a question, the answer sounds like
the note a friend would leave on the counter. Keep it that way; that’s the whole brand.
