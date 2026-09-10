import { NextResponse } from 'next/server';
import * as repo from '@/lib/db/repo';
import { requireOwner } from '@/lib/api-guards';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;
  const counts = await repo.countCommentsByStatus();
  const all = await repo.listCommentsAll(300);
  return NextResponse.json({ counts, all });
}
