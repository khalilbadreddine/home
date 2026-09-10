import { NextResponse } from 'next/server';
import * as repo from '@/lib/db/repo';
import { requireOwner } from '@/lib/api-guards';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;
  const stats = await repo.overviewStats();
  const pendingComments = await repo.countCommentsByStatus();
  const latestJobs = await repo.listJobs(8);
  return NextResponse.json({ stats, pendingComments, latestJobs });
}
