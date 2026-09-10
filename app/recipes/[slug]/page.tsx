import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import * as repo from '@/lib/db/repo';
import { jparse } from '@/lib/db';
import { RecipeClient } from '@/components/site/RecipeClient';
import { CommentSection } from '@/components/site/CommentSection';
import { RecipeCard } from '@/components/site/RecipeCard';
import { Reveal } from '@/components/site/Reveal';
import { fmtDate, moodMeta, splitMoods } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const r = await repo.getRecipeBySlug(params.slug);
  if (!r) return { title: 'Recipe not found' };
  return {
    title: r.seo_title || r.title,
    description: r.seo_description || r.kitchen_note || undefined,
    openGraph: { title: r.title, images: r.image ? [r.image] : undefined },
  };
}

export default async function RecipePage({ params }: { params: { slug: string } }) {
  const recipe = await repo.getRecipeBySlug(params.slug);
  if (!recipe) notFound();
  if (recipe.status === 'draft') notFound();

  void repo.bumpViews(recipe.id); // fire-and-forget

  const moods = splitMoods(recipe.moods);
  const related = (
    await repo.listRecipes({ status: 'published', limit: 20 })
  ).filter((r) => r.id !== recipe.id && moods.some((m) => (r.moods || '').split(',').includes(m))).slice(0, 3);

  const ingredients = jparse<any[]>(recipe.ingredients, []);
  const steps = jparse<string[]>(recipe.steps, []);
  const pins = jparse<any[]>(recipe.pins, []);
  const tips = jparse<string[]>(recipe.tips, []);

  return (
    <div className="pt-28 sm:pt-32">
      <div className="container-site">
        {/* breadcrumbs */}
        <p className="mb-6 text-sm font-bold text-ink-soft">
          <Link href="/" className="hover:text-terra">Tonight</Link>
          <span className="mx-2 opacity-50">/</span>
          <span className="text-ink">{recipe.title}</span>
        </p>

        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          {/* left: the photo, pinned */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="relative">
              <div className="rounded-2xl border-8 border-card bg-card shadow-paper-lift" style={{ transform: 'rotate(-1.5deg)' }}>
                {recipe.image ? (
                  <Image src={recipe.image} alt={recipe.title} width={900} height={680} className="aspect-[4/3] w-full rounded-xl object-cover" />
                ) : (
                  <div className="grid aspect-[4/3] w-full place-items-center rounded-xl bg-paper2 font-hand text-2xl text-ink-soft">
                    no photo yet — the card is still drying
                  </div>
                )}
              </div>
              <span className="pin-tape !left-10 !-top-3" />

              {tips.length > 0 && (
                <div className="paper-card mt-6 p-5" style={{ transform: 'rotate(1deg)' }}>
                  <p className="font-hand text-xl text-terra">from the Seeker’s notebook</p>
                  <ul className="mt-2 space-y-2">
                    {tips.map((t, i) => (
                      <li key={i} className="flex gap-2 text-sm leading-relaxed text-ink-soft">
                        <span className="text-terra">✳</span> {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* right: the card itself */}
          <div>
            <div className="flex flex-wrap gap-2">
              {moods.map((m) => (
                <span key={m} className="chip">{moodMeta(m).emoji} {moodMeta(m).label}</span>
              ))}
              <span className="chip">⏱ {recipe.time_min} min</span>
              <span className="chip">🍽 serves {recipe.servings}</span>
              <span className="chip capitalize">{recipe.difficulty}</span>
            </div>

            <h1 className="h-display mt-4 text-4xl sm:text-5xl text-balance">{recipe.title}</h1>
            {recipe.kitchen_note && (
              <p className="mt-5 border-l-4 border-terra-soft pl-4 font-hand text-2xl leading-snug text-ink-soft">
                {recipe.kitchen_note}
              </p>
            )}

            <RecipeClient
              recipeId={recipe.id}
              ingredients={ingredients}
              steps={steps}
              pins={pins}
              served={recipe.served}
              views={recipe.views}
            />

            <CommentSection kind="recipe" id={recipe.id} title={recipe.title} />
          </div>
        </div>

        {/* related */}
        {related.length > 0 && (
          <section className="mt-24">
            <Reveal>
              <p className="kicker">more for this evening</p>
              <h2 className="section-title mt-2">Keep the table full</h2>
            </Reveal>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r, i) => (
                <Reveal key={r.id} delay={i * 0.08}>
                  <RecipeCard recipe={r} index={i} compact />
                </Reveal>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
