'use client';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { Row } from '@/lib/db';
import { MOODS, cx } from '@/lib/utils';
import { RecipeCard } from './RecipeCard';
import Link from 'next/link';

export function PinboardClient({ recipes, mood: moodProp, setMood: setMoodProp }: { recipes: Row[]; mood?: string | null; setMood?: (m: string | null) => void }) {
  const [internal, setInternal] = useState<string | null>(null);
  const mood = moodProp !== undefined ? moodProp : internal;
  const setMood = setMoodProp ?? setInternal;
  const gridRef = useRef<HTMLDivElement>(null);

  const visible = mood ? recipes.filter((r) => (r.moods || '').split(',').includes(mood)) : recipes;

  // GSAP stagger whenever the board changes
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const cards = Array.from(grid.querySelectorAll<HTMLElement>('.pin-card'));
    if (!cards.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.fromTo(
      cards,
      { y: 26, autoAlpha: 0, scale: 0.96 },
      { y: 0, autoAlpha: 1, scale: 1, duration: 0.65, stagger: 0.07, ease: 'power3.out', clearProps: 'scale' }
    );
  }, [mood, recipes.length]);

  if (!recipes.length) {
    return (
      <div className="paper-card mx-auto max-w-lg p-10 text-center">
        <p className="text-4xl">🥣</p>
        <h3 className="mt-3 font-display text-2xl font-semibold">The shelves are being set</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          The first recipes are still on the stove. Follow along on Pinterest so you taste them the moment they come out —
          or come back after Sunday.
        </p>
        <a
          href="https://www.pinterest.com/therecipeseeker"
          target="_blank"
          rel="noreferrer"
          className="btn-warm mt-6"
        >
          📌 Follow on Pinterest
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-center justify-center gap-2">
        <button onClick={() => setMood(null)} className={cx('chip cursor-pointer !px-4 !py-1.5 transition-all', !mood && 'chip-on')}>
          ✨ Everything
        </button>
        {MOODS.map((m) => (
          <button
            key={m.id}
            onClick={() => setMood(mood === m.id ? null : m.id)}
            className={cx('chip cursor-pointer !px-4 !py-1.5 transition-all', mood === m.id && 'chip-on')}
          >
            {m.emoji} {m.label}
          </button>
        ))}
      </div>

      <div ref={gridRef} className="columns-1 gap-6 sm:columns-2 lg:columns-3 [column-fill:_balance]">
        {visible.map((r, i) => (
          <div key={r.id} className="mb-6 break-inside-avoid">
            <RecipeCard recipe={r} index={i} />
          </div>
        ))}
      </div>

      {visible.length === 0 && (
        <div className="paper-card mx-auto max-w-md p-8 text-center">
          <p className="text-3xl">🕯️</p>
          <p className="mt-3 font-display text-xl font-semibold">Nothing under that mood — yet</p>
          <p className="mt-2 text-sm text-ink-soft">
            The Seeker is still writing for this one. Try another evening, or{' '}
            <Link href="/pantry" className="link-warm">cook from your pantry</Link> instead.
          </p>
        </div>
      )}
    </div>
  );
}
