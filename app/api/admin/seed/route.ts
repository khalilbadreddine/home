import { NextResponse } from 'next/server';
import { requireOwner } from '@/lib/api-guards';
import * as repo from '@/lib/db/repo';
import { fireTrigger } from '@/lib/workflow';

export const dynamic = 'force-dynamic';

/**
 * Adds the starter content (real recipes, story, settings, starter workflows)
 * if not already present. Idempotent — safe to press any time.
 */
export async function POST() {
  const { error } = await requireOwner();
  if (error) return error;

  const { RECIPES, STORIES, SETTINGS, WORKFLOWS } = await import('../../../../scripts/seed-data.mjs');
  let added = 0;

  for (const r of RECIPES) {
    if (await repo.getRecipeBySlug(r.slug)) continue;
    const id = await repo.createRecipe({
      slug: r.slug, title: r.title, kitchen_note: r.kitchen_note, moods: r.moods,
      time_min: r.time_min, servings: r.servings, difficulty: r.difficulty, image: r.image,
      ingredients: r.ingredients, steps: r.steps, pins: r.pins ?? [], tips: r.tips ?? [],
      status: r.status,
    });
    if (r.status === 'published') {
      const pub = await repo.publishRecipe(id);
      if (pub) void fireTrigger('recipe_published', { recipe: pub }).catch(() => {});
    }
    added++;
  }
  for (const s of STORIES) {
    if (await repo.getStoryBySlug(s.slug)) continue;
    const id = await repo.createStory({
      slug: s.slug, title: s.title, excerpt: s.excerpt, body: s.body,
      image: s.image, tag: s.tag, status: s.status,
    });
    if (s.status === 'published') {
      const pub = await repo.publishStory(id);
      if (pub) void fireTrigger('story_published', { story: pub }).catch(() => {});
    }
    added++;
  }
  for (const [k, v] of Object.entries(SETTINGS)) {
    if (await repo.getSetting(k)) continue;
    await repo.setSetting(k, v);
  }
  for (const w of WORKFLOWS) {
    const wfs = await repo.listWorkflows();
    if (wfs.find((x) => x.name === w.name)) continue;
    await repo.createWorkflow({
      name: w.name, description: w.description, trigger: w.trigger,
      steps: w.steps, active: w.active, schedule_hours: w.schedule_hours,
    });
    added++;
  }

  return NextResponse.json({ ok: true, added });
}
