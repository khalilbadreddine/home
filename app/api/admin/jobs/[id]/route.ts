import { NextResponse } from 'next/server';
import * as repo from '@/lib/db/repo';
import { requireOwner, jsonError } from '@/lib/api-guards';
import { jparse } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireOwner();
  if (error) return error;
  const j = await repo.getJob(Number(params.id));
  if (!j) return jsonError('Job not found', 404);
  return NextResponse.json({ ...j, input: jparse(j.input, {}), log: jparse(j.log, []), output: jparse(j.output, {}) });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireOwner();
  if (error) return error;
  await repo.deleteJob(Number(params.id));
  return NextResponse.json({ ok: true });
}
