'use client';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { MOODS, cx } from '@/lib/utils';

/**
 * The Tonight Dial — instead of a filter bar, you tell the kitchen how
 * your evening feels, and the needle swings over with a soft bounce.
 */
export function MoodDial({ active, onSelect }: { active: string | null; onSelect: (m: string | null) => void }) {
  const needleRef = useRef<HTMLDivElement>(null);
  const dialRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const angleFor = (i: number) => (i * 360) / MOODS.length - 90; // start at top, clockwise

  useEffect(() => {
    const el = needleRef.current;
    if (!el) return;
    const target = active ? angleFor(MOODS.findIndex((m) => m.id === active)) : -90;
    gsap.to(el, { rotation: target, duration: 0.9, ease: 'elastic.out(1, 0.55)' });
  }, [active]);

  useEffect(() => {
    const el = dialRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.fromTo(el, { scale: 0.9, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1, ease: 'power3.out' });
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div ref={dialRef} className="relative h-[240px] w-[240px] sm:h-[280px] sm:w-[280px]">
        {/* dial face */}
        <div className="absolute inset-0 rounded-full border border-line bg-card/70 shadow-paper backdrop-blur-sm" />
        <div className="absolute inset-4 rounded-full border border-dashed border-line/80" />
        <div className="absolute inset-10 rounded-full bg-paper2/60" />

        {/* needle */}
        <div className="absolute inset-0 grid place-items-center">
          <div ref={needleRef} className="relative h-0 w-0">
            <div
              className={cx(
                'absolute left-1/2 top-0 h-[calc(50%-34px)] w-[3px] -translate-x-1/2 origin-bottom rounded-full',
                active ? 'bg-terra' : 'bg-terra-soft'
              )}
              style={{ transform: 'translateX(-50%)', transformOrigin: 'bottom center' }}
            />
            <div className={cx('absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full', active ? 'bg-terra shadow-glow' : 'bg-terra-soft')} />
          </div>
        </div>

        {/* hub */}
        <button
          onClick={() => onSelect(null)}
          title="Show everything"
          className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-line bg-card font-hand text-lg text-ink shadow-paper transition-all duration-300 hover:scale-105 hover:border-terra"
        >
          tonight
        </button>

        {/* mood stations */}
        {MOODS.map((m, i) => {
          const a = (angleFor(i) * Math.PI) / 180;
          const R = 82; // % of half-size
          const x = 50 + R * Math.cos(a) * 0.92;
          const y = 50 + R * Math.sin(a) * 0.92;
          const on = active === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onSelect(on ? null : m.id)}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="absolute -translate-x-1/2 -translate-y-1/2 outline-none"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <span
                className={cx(
                  'grid h-12 w-12 place-items-center rounded-full border text-xl transition-all duration-300',
                  on
                    ? 'scale-110 border-terra bg-terra text-white shadow-glow'
                    : 'border-line bg-card shadow-paper hover:scale-110 hover:border-terra-soft'
                )}
              >
                {m.emoji}
              </span>
              <span
                className={cx(
                  'pointer-events-none absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold transition-all duration-300',
                  on || hovered === i ? 'bg-ink text-paper opacity-100' : 'opacity-0'
                )}
              >
                {m.label}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-5 min-h-[2.5rem] max-w-sm text-center font-hand text-xl text-ink-soft transition-all" aria-live="polite">
        {active ? (
          <>
            {MOODS.find((m) => m.id === active)?.emoji}{' '}
            <span className="text-ink">{MOODS.find((m) => m.id === active)?.label}</span> —{' '}
            {MOODS.find((m) => m.id === active)?.line}
          </>
        ) : (
          <>spin the dial, or tap <span className="text-terra">tonight</span> to see everything on the board.</>
        )}
      </p>
    </div>
  );
}
