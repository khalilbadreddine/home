import { NextResponse } from 'next/server';
import * as repo from '@/lib/db/repo';
import { requireOwner, jsonError, readJson } from '@/lib/api-guards';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireOwner();
  if (error) return error;
  const b = readJson(await req.text());
  const status = String(b.status || '');
  if (!['visible', 'hidden', 'deleted'].includes(status)) return jsonError('status must be visible|hidden|deleted');
  if (status === 'deleted') await repo.deleteComment(Number(params.id));
  else await repo.setCommentStatus(Number(params.id), status);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireOwner();
  if (error) return error;
  await repo.deleteComment(Number(params.id));
  return NextResponse.json({ ok: true });
}
