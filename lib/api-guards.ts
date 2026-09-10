import { NextResponse } from 'next/server';
import { getServerSession } from './auth';
import { jparse } from './db';

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Owner-only gate for /api/admin/*. Returns the session or an error response. */
export async function requireOwner() {
  const session = await getServerSession();
  if (!session?.user?.email) return { session: null as any, error: jsonError('Not signed in', 401) };
  if (!session.user.isOwner) {
    return { session, error: jsonError('This kitchen belongs to its owner (ADMIN_EMAIL).', 403) };
  }
  return { session, error: null };
}

export function readJson<T = any>(body: any, fallback: T = {} as T): T {
  if (!body) return fallback;
  if (typeof body === 'object') return body as T;
  return jparse(body, fallback);
}

export function publicSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || '';
}
