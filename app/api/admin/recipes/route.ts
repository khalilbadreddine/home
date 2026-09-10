import { NextResponse } from 'next/server';
import * as repo from '@/lib/db/repo';
import { jparse } from '@/lib/db';
import { requireOwner, jsonError, readJson } from '@/lib/api-guards';
import { slugify } from '@/lib/utils';
import { fireTrigger } from '@/lib/workflow';

export const dynamic = 'force-dynamic';

function shape(r: any) {
  return {
    ...r,
    ingredients: jparse(r.ingredients, []),
    steps: jparse(r.steps, []),
    pins: jparse(r.pins, []),
    tips: jparse(r.tips, []),
  };
}

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;
  const recipes = await repo.listRecipes({ limit: 200 });
  return NextResponse.json(recipes.map(shape));
}

export async function POST(req: Request) {
  const { error } = await requireOwner();
  if (error) return error;
  const b = readJson(await req.text());
  if (!b.title?.trim()) return jsonError('A title is needed');
  const base = slugify(b.title);
  let slug = b.slug?.trim() ? slugify(b.slug) : base;
  let existing = await repo.getRecipeBySlug(slug);
  let n = 2;
  while (existing) {
    slug = `${base}-${n++}`;
    existing = await repo.getRecipeBySlug(slug);
  }
  const id = await repo.createRecipe({
    slug,
    title: b.title.trim(),
    kitchen_note: b.kitchen_note || '',
    moods: b.moods || '',
    time_min: Number(b.time_min) || 0,
    servings: Number(b.servings) || 0,
    difficulty: b.difficulty || 'easy',
    image: b.image || '',
    ingredients: Array.isArray(b.ingredients) ? b.ingredients : [],
    steps: Array.isArray(b.steps) ? b.steps : [],
    pins: Array.isArray(b.pins) ? b.pins : [],
    tips: Array.isArray(b.tips) ? b.tips : [],
    seo_title: b.seo_title || '',
    seo_description: b.seo_description || '',
    status: b.status === 'published' ? 'published' : 'draft',
  });
  if (b.status === 'published') {
    const pub = await repo.publishRecipe(id);
    if (pub) void fireTrigger('recipe_published', { recipe: pub }).catch(() => {});
  }
  return NextResponse.json({ ok: true, id, slug });
}
