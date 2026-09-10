import { NextResponse } from 'next/server';
import * as repo from '@/lib/db/repo';
import { requireOwner, readJson } from '@/lib/api-guards';
import { ollamaHealth } from '@/lib/ollama';

export const dynamic = 'force-dynamic';

const SENSITIVE = ['resend_api_key'];
const EDITABLE = [
  'site_name', 'tagline', 'hero_title', 'hero_sub', 'followers_note',
  'pinterest_url', 'instagram_url', 'circle_rules',
  'ollama_url', 'ollama_model', 'resend_api_key', 'newsletter_from',
];

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;
  const all = await repo.getSettings();
  const out: Record<string, string> = {};
  for (const k of EDITABLE) out[k] = all[k] ?? '';
  // mask sensitive values
  for (const k of SENSITIVE) {
    if (out[k]) out[k] = '••••' + out[k].slice(-4);
  }
  out.__env = JSON.stringify({
    hasResendEnv: Boolean(process.env.RESEND_API_KEY),
    hasGoogle: Boolean(process.env.GOOGLE_CLIENT_ID),
    ollamaUrlEnv: process.env.OLLAMA_BASE_URL || '',
    ollamaModelEnv: process.env.OLLAMA_MODEL || '',
    dbKind: (process.env.DATABASE_URL || '').startsWith('postgres') ? 'postgres (Neon)' : 'local sqlite',
  });
  const ai = await ollamaHealth();
  return NextResponse.json({ settings: out, ai });
}

export async function PUT(req: Request) {
  const { error } = await requireOwner();
  if (error) return error;
  const b = readJson<any>(await req.text(), {});
  for (const k of EDITABLE) {
    if (b[k] === undefined) continue;
    // don't overwrite a real key with its masked display value
    if (SENSITIVE.includes(k) && /^•{4}/.test(String(b[k]))) continue;
    await repo.setSetting(k, String(b[k] ?? ''));
  }
  return NextResponse.json({ ok: true });
}
