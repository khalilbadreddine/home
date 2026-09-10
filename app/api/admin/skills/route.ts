import { NextResponse } from 'next/server';
import * as repo from '@/lib/db/repo';
import { requireOwner } from '@/lib/api-guards';
import { SKILLS } from '@/lib/skills';
import { ollamaHealth } from '@/lib/ollama';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;
  const ai = await ollamaHealth();
  const recipes = await repo.listRecipes({ limit: 100 });
  const stories = await repo.listStories({ limit: 100 });
  return NextResponse.json({
    ai,
    skills: SKILLS.map(({ run: _run, ...s }) => s),
    recipeOptions: recipes.map((r) => ({ value: String(r.id), label: r.title })),
    storyOptions: stories.map((s) => ({ value: String(s.id), label: s.title })),
  });
}
