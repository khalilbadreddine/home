import { NextResponse } from 'next/server';
import * as repo from '@/lib/db/repo';
import { jparse } from '@/lib/db';
import { ollamaChat } from '@/lib/ollama';

export const dynamic = 'force-dynamic';

/**
 * POST /api/pantry { items: string[] }
 * Matches the visitor's fridge against every published recipe,
 * ranks by ingredient coverage, and (if Ollama is running) adds
 * a warm suggestion from the kitchen AI.
 */
export async function POST(req: Request) {
  let items: string[] = [];
  try {
    const body = await req.json();
    items = (body?.items || [])
      .map((s: any) => String(s).toLowerCase().trim().replace(/,$/, ''))
      .filter(Boolean)
      .slice(0, 14);
  } catch {
    return NextResponse.json({ error: 'Send { "items": ["chicken", "lemon", …] }' }, { status: 400 });
  }
  if (!items.length) return NextResponse.json({ error: 'Add at least one thing from your fridge.' }, { status: 400 });

  const recipes = await repo.listRecipes({ status: 'published', limit: 200 });

  const wordSet = new Set<string>();
  for (const it of items) {
    wordSet.add(it);
    for (const w of it.split(/\s+/)) if (w.length >= 3) wordSet.add(w);
  }

  const matches = recipes
    .map((r) => {
      const ings: any[] = jparse(r.ingredients, []);
      const matched: string[] = [];
      const missing: string[] = [];
      for (const ing of ings) {
        const hay = String(ing.item || '').toLowerCase();
        const hayWords = hay.split(/[^a-z]+/).filter((w) => w.length >= 3);
        const hit = [...wordSet].some(
          (w) =>
            hay.includes(w) ||
            hayWords.some((hw) => hw.startsWith(w) || w.startsWith(hw))
        );
        (hit ? matched : missing).push(ing.item);
      }
      const score = matched.length / Math.max(1, ings.length);
      return { recipe: r, matched, missing, score, matchedCount: matched.length };
    })
    .filter((m) => m.matchedCount > 0)
    .sort((a, b) => b.matchedCount - a.matchedCount || b.score - a.score)
    .slice(0, 8)
    .map(({ recipe, matched, missing, score }) => ({
      recipe: {
        id: recipe.id,
        slug: recipe.slug,
        title: recipe.title,
        image: recipe.image,
        time_min: recipe.time_min,
        servings: recipe.servings,
        moods: recipe.moods,
      },
      matched: matched.slice(0, 8),
      missing: missing.slice(0, 8),
      score: Math.round(score * 100),
    }));

  // AI suggestion (best effort — never blocks the results)
  let aiNote: string | null = null;
  let aiNoteError: string | null = null;
  const top = matches.slice(0, 3).map((m) => m.recipe.title);
  try {
    const answer = await ollamaChat({
      timeoutMs: 45000,
      maxTokens: 220,
      user: `A home cook has these things in their fridge: ${items.join(', ')}.
Their top matched recipes: ${top.join(' · ') || 'none'}.
In two short, warm sentences (no bullet points, no headings), tell them what to cook tonight and why, and one tiny honest warning about that dish. Plain text.`,
    });
    aiNote = answer.trim().slice(0, 400);
  } catch (e: any) {
    aiNoteError = e?.friendly || 'The kitchen AI is not running right now — the matches below still work.';
  }

  return NextResponse.json({ matches, aiNote, aiNoteError });
}
