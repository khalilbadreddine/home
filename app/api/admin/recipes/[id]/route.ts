import { NextResponse } from 'next/server';
import * as repo from '@/lib/db/repo';
import { requireOwner, jsonError, readJson } from '@/lib/api-guards';
import { jparse } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireOwner();
  if (error) return error;
  const r = await repo.getRecipeById(Number(params.id));
  if (!r) return jsonError('Recipe not found', 404);
  return NextResponse.json({ ...r, ingredients: jparse(r.ingredients, []), steps: jparse(r.steps, []), pins: jparse(r.pins, []), tips: jparse(r.tips, []) });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireOwner();
  if (error) return error;
  const id = Number(params.id);
  const existing = await repo.getRecipeById(id);
  if (!existing) return jsonError('Recipe not found', 404);
  const b = readJson(await req.text());
  await repo.updateRecipe(id, {
    title: b.title,
    slug: b.slug,
    kitchen_note: b.kitchen_note,
    moods: b.moods,
    time_min: b.time_min,
    servings: b.servings,
    difficulty: b.difficulty,
    image: b.image,
    ingredients: Array.isArray(b.ingredients) ? b.ingredients : undefined,
    steps: Array.isArray(b.steps) ? b.steps : undefined,
    pins: Array.isArray(b.pins) ? b.pins : undefined,
    tips: Array.isArray(b.tips) ? b.tips : undefined,
    seo_title: b.seo_title,
    seo_description: b.seo_description,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireOwner();
  if (error) return error;
  await repo.deleteRecipe(Number(params.id));
  return NextResponse.json({ ok: true });
}
