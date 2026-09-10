import { NextResponse } from 'next/server';
import * as repo from '@/lib/db/repo';
import { requireOwner } from '@/lib/api-guards';
import { jparse } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;
  const jobs = await repo.listJobs(100);
  return NextResponse.json(
    jobs.map((j) => ({ ...j, input: jparse(j.input, {}), log: jparse(j.log, []), output: jparse(j.output, {}) }))
  );
}
