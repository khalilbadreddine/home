import { NextResponse } from 'next/server';
import * as repo from '@/lib/db/repo';
import { requireOwner } from '@/lib/api-guards';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;
  return NextResponse.json(await repo.listSubscribers());
}
