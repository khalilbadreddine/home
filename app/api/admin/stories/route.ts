import { NextResponse } from 'next/server';
import * as repo from '@/lib/db/repo';
import { requireOwner, jsonError, readJson } from '@/lib/api-guards';
import { slugify } from '@/lib/utils';
import { fireTrigger } from '@/lib/workflow';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;
  return NextResponse.json(await repo.listStories({ limit: 200 }));
}

export async function POST(req: Request) {
  const { error } = await requireOwner();
  if (error) return error;
  const b = readJson(await req.text());
  if (!b.title?.trim()) return jsonError('A title is needed');
  const base = slugify(b.title);
  let slug = b.slug?.trim() ? slugify(b.slug) : base;
  let existing = await repo.getStoryBySlug(slug);
  let n = 2;
  while (existing) {
    slug = `${base}-${n++}`;
    existing = await repo.getStoryBySlug(slug);
  }
  const id = await repo.createStory({
    slug,
    title: b.title.trim(),
    excerpt: b.excerpt || '',
    body: b.body || '',
    image: b.image || '',
    tag: b.tag || 'notes',
    status: b.status === 'published' ? 'published' : 'draft',
    seo_title: b.seo_title || '',
    seo_description: b.seo_description || '',
  });
  if (b.status === 'published') {
    const pub = await repo.publishStory(id);
    if (pub) void fireTrigger('story_published', { story: pub }).catch(() => {});
  }
  return NextResponse.json({ ok: true, id, slug });
}
