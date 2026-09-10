import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ollamaHealth } from '@/lib/ollama';

export const dynamic = 'force-dynamic';

/** Public health probe: DB + AI status. Used by the admin onboarding screen. */
export async function GET() {
  let db: { ok: boolean; kind: string; error?: string } = { ok: false, kind: 'unknown' };
  try {
    const d = getDb();
    await d.query('SELECT 1 AS ok');
    db = { ok: true, kind: d.kind };
  } catch (e: any) {
    db = { ok: false, kind: getDb().kind, error: e?.message };
  }
  const ai = await ollamaHealth();
  const google = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  return NextResponse.json({ db, ai, google, next: process.env.NODE_ENV });
}
