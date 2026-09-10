import Image from 'next/image';
import { Reveal } from '@/components/site/Reveal';
import * as repo from '@/lib/db/repo';
import { timeAgo } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'The Circle — a quiet corner for women who cook' };

export default async function CirclePage() {
  const s = await repo.getSettings();
  const rules = (s.circle_rules || '').split('\n').filter(Boolean);
  const comments = await repo.listCommentsAll(50);
  const visible = comments.filter((c) => c.status === 'visible').slice(0, 8);

  return (
    <div className="pt-32 sm:pt-36">
      <div className="container-site">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <div className="lg:sticky lg:top-28">
              <p className="kicker">a quiet corner</p>
              <h1 className="h-display mt-3 text-4xl sm:text-5xl">The Circle</h1>
              <p className="mt-5 max-w-md text-base leading-relaxed text-ink-soft">
                This is the part of the site that exists for you, not for the algorithm. Leave a note
                under a recipe, read how it went in other kitchens, and feel the particular warmth of
                women talking shop about soup.
              </p>
              <div className="paper-card mt-8 p-6">
                <p className="font-hand text-2xl text-terra">the house rules</p>
                <ul className="mt-3 space-y-3">
                  {rules.map((r, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-terra-soft/50 font-display text-xs font-bold text-terra-deep">{i + 1}</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative mt-8 hidden lg:block">
                <Image
                  src="/images/seeker.jpg"
                  alt="Hands holding a handwritten recipe card"
                  width={600}
                  height={750}
                  className="w-72 rounded-2xl border-8 border-card shadow-paper-lift"
                  style={{ transform: 'rotate(-2deg)' }}
                />
              </div>
            </div>
          </Reveal>

          <div>
            <Reveal>
              <div className="flex items-center justify-between">
                <h2 className="section-title text-2xl sm:text-3xl">Fresh notes on the wall</h2>
                <span className="chip">🤝 read with a kind eye</span>
              </div>
            </Reveal>
            <div className="mt-6 space-y-4">
              {visible.length === 0 && (
                <div className="paper-card p-8 text-center">
                  <p className="text-3xl">🧡</p>
                  <p className="mt-3 font-display text-xl font-semibold">The wall is waiting for its first note</p>
                  <p className="mt-2 text-sm text-ink-soft">Open any recipe and leave a line about how it went — the Circle starts with one kind voice.</p>
                </div>
              )}
              {visible.map((c, i) => (
                <Reveal key={c.id} delay={Math.min(i * 0.05, 0.3)}>
                  <div className={`paper-card p-5 ${i % 2 ? 'tilt-1' : 'tilt-2'}`}>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-bold">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-terra-soft/60 font-hand text-terra-deep">
                          {c.name.slice(0, 1).toUpperCase()}
                        </span>
                        {c.name}
                      </span>
                      <span className="text-xs text-ink-soft">{timeAgo(c.created_at)}</span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-ink-soft">{c.message}</p>
                    {(c.recipe_title || c.story_title) && (
                      <p className="mt-3 border-t border-dashed border-line pt-2 text-xs font-bold text-ink-soft">
                        under <span className="text-terra">{c.recipe_title || c.story_title}</span>
                      </p>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
