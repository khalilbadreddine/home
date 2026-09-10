import { NextResponse } from 'next/server';
import * as repo from '@/lib/db/repo';
import { requireOwner, jsonError, readJson } from '@/lib/api-guards';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireOwner();
  if (error) return error;
  const id = Number(params.id);
  const existing = await repo.getStoryById(id);
  if (!existing) return jsonError('Story not found', 404);
  const b = readJson(await req.text());
  await repo.updateStory(id, {
    title: b.title,
    slug: b.slug,
    excerpt: b.excerpt,
    body: b.body,
    image: b.image,
    tag: b.tag,
    seo_title: b.seo_title,
    seo_description: b.seo_description,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireOwner();
  if (error) return error;
  await repo.deleteStory(Number(params.id));
  return NextResponse.json({ ok: true });
}
