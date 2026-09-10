import { NextResponse } from 'next/server';
import * as repo from '@/lib/db/repo';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let email = '';
  let source = 'site';
  try {
    const body = await req.json();
    email = String(body?.email || '').trim().toLowerCase();
    source = String(body?.source || 'site').slice(0, 40);
  } catch {}
  try {
    const { added } = await repo.addSubscriber(email, source);
    return NextResponse.json({ ok: true, added, message: added ? 'Welcome to The Sunday Spoon.' : 'You were already in — see you Sunday.' });
  } catch (e: any) {
    if (e?.message === 'INVALID_EMAIL') return NextResponse.json({ error: 'INVALID_EMAIL' }, { status: 400 });
    return NextResponse.json({ error: 'Could not save you yet — try again.' }, { status: 500 });
  }
}
