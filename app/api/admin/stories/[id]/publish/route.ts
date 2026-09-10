import { NextResponse } from 'next/server';
import * as repo from '@/lib/db/repo';
import { requireOwner, jsonError } from '@/lib/api-guards';
import { fireTrigger } from '@/lib/workflow';

export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireOwner();
  if (error) return error;
  const id = Number(params.id);
  const existing = await repo.getStoryById(id);
  if (!existing) return jsonError('Story not found', 404);
  if (existing.status === 'published') {
    await repo.unpublishStory(id);
    return NextResponse.json({ ok: true, status: 'draft' });
  }
  const pub = await repo.publishStory(id);
  if (pub) void fireTrigger('story_published', { story: pub }).catch(() => {});
  return NextResponse.json({ ok: true, status: 'published' });
}
