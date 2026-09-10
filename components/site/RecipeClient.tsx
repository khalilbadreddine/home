'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Check, ChefHat, Copy, Flame, Link2 } from 'lucide-react';
import { cx } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

interface Ingredient {
  item: string;
  amount?: string;
  note?: string;
}

export function RecipeClient({
  recipeId,
  ingredients,
  steps,
  pins,
  served,
  views,
}: {
  recipeId: number;
  ingredients: Ingredient[];
  steps: string[];
  pins: { headline: string; description?: string; hashtags?: string[] }[];
  served: number;
  views: number;
}) {
  const storageKey = `seeker-ings-${recipeId}`;
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [loaded, setLoaded] = useState(false);
  const [cookMode, setCookMode] = useState(false);
  const [doneSteps, setDoneSteps] = useState<Record<number, boolean>>({});
  const [servedCount, setServedCount] = useState(served);
  const [servedFlash, setServedFlash] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [stepLine, setStepLine] = useState(false);
  const stepsRef = useRef<HTMLDivElement>(null);
  const servedBtnRef = useRef<HTMLButtonElement>(null);

  // load persisted checklist
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setChecked(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, [storageKey]);

  const toggleIng = (i: number) => {
    setChecked((c) => {
      const next = { ...c, [i]: !c[i] };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const gathered = Object.values(checked).filter(Boolean).length;
  const pct = ingredients.length ? Math.round((gathered / ingredients.length) * 100) : 0;

  // GSAP: step line draw + step cards
  useEffect(() => {
    if (!loaded) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStepLine(true);
      return;
    }
    const el = stepsRef.current;
    if (!el) return;
    const line = el.querySelector<HTMLElement>('.steps-line');
    if (line) {
      gsap.fromTo(line, { scaleY: 0 }, { scaleY: 1, transformOrigin: 'top', duration: 1.2, ease: 'power2.inOut', scrollTrigger: { trigger: el, start: 'top 75%', once: true } });
    }
    const cards = Array.from(el.querySelectorAll<HTMLElement>('.cook-step'));
    gsap.fromTo(
      cards,
      { x: 24, autoAlpha: 0 },
      { x: 0, autoAlpha: 1, duration: 0.6, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 80%', once: true } }
    );
    setStepLine(true);
  }, [loaded, cookMode]);

  const copy = async (text: string, tag: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(tag);
      setTimeout(() => setCopied(null), 1600);
    } catch {}
  };

  const onServed = async () => {
    if (servedFlash) return;
    setServedFlash(true);
    setServedCount((c) => c + 1);
    try {
      await fetch(`/api/recipes/${recipeId}/served`, { method: 'POST' });
    } catch {}
    const btn = servedBtnRef.current;
    if (btn && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.fromTo(btn, { scale: 1 }, { scale: 1.18, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.inOut' });
      // little flame burst
      const flames = Array.from(btn.querySelectorAll<HTMLElement>('.burst'));
      gsap.fromTo(
        flames,
        { y: 0, autoAlpha: 1, scale: 0.4 },
        { y: -34, autoAlpha: 0, scale: 1.2, duration: 0.9, stagger: 0.05, ease: 'power1.out', onComplete: () => setServedFlash(false) }
      );
    } else {
      setTimeout(() => setServedFlash(false), 900);
    }
  };

  const shareText = useMemo(() => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    return url;
  }, []);

  const progressRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (progressRef.current) {
      progressRef.current.style.width = `${pct}%`;
    }
  }, [pct, loaded]);

  return (
    <div className="mt-8">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button className={cx('btn-warm !rounded-xl !px-4 !py-2.5 !text-xs', cookMode && '!bg-sage')} onClick={() => setCookMode(!cookMode)}>
          <ChefHat size={14} /> {cookMode ? 'Back to the card' : 'I’m cooking now'}
        </button>
        <button ref={servedBtnRef} onClick={onServed} className="btn-ghost relative !rounded-xl !px-4 !py-2.5 !text-xs">
          <Flame size={14} className="text-terra" /> Served it at home · {servedCount}
          {servedFlash && (
            <span className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm">
              {['🔥', '✨', '🧡'].map((f, i) => (
                <span key={i} className="burst absolute left-0 top-0" style={{ transform: `translateX(${(i - 1) * 10}px)` }}>
                  {f}
                </span>
              ))}
            </span>
          )}
        </button>
        <button className="btn-ghost !rounded-xl !px-4 !py-2.5 !text-xs" onClick={() => copy(shareText, 'link')}>
          {copied === 'link' ? <Check size={14} className="text-sage" /> : <Link2 size={14} />} Copy link
        </button>
        <span className="ml-auto hidden font-hand text-base text-ink-soft sm:block">{views} visits · {servedCount} times served at home</span>
      </div>

      <div className={cx('mt-8 grid gap-8', cookMode ? 'grid-cols-1' : 'md:grid-cols-[0.9fr_1.1fr]')}>
        {/* ingredients */}
        {!cookMode && (
          <div className="paper-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">The list</h2>
              <span className="font-hand text-lg text-terra">{gathered}/{ingredients.length} gathered</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper2">
              <div ref={progressRef} className="h-full rounded-full bg-sage transition-all duration-500" style={{ width: '0%' }} />
            </div>
            <ul className="mt-4 space-y-1">
              {ingredients.map((ing, i) => (
                <li key={i}>
                  <div
                    role="checkbox"
                    aria-checked={!!checked[i]}
                    tabIndex={0}
                    onClick={() => toggleIng(i)}
                    onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleIng(i); } }}
                    className={cx('group flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-paper2/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-terra/50', checked[i] && 'opacity-60')}
                  >
                    <span
                      className={cx(
                        'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition-all',
                        checked[i] ? 'border-sage bg-sage text-white' : 'border-line bg-card group-hover:border-terra-soft'
                      )}
                    >
                      {checked[i] && <Check size={12} strokeWidth={3.5} />}
                    </span>
                    <span className="flex-1 text-sm">
                      <span className={cx('font-bold', checked[i] && 'line-through')}>{ing.item}</span>
                      {ing.amount && <span className="text-ink-soft"> — {ing.amount}</span>}
                      {ing.note && <span className="mt-0.5 block font-hand text-base text-ink-soft">{ing.note}</span>}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            {gathered === ingredients.length && ingredients.length > 0 && (
              <p className="mt-4 rounded-xl bg-sage/10 px-4 py-3 text-center font-hand text-xl text-sage-deep">
                everything’s on the counter — let’s cook 🧡
              </p>
            )}
          </div>
        )}

        {/* steps */}
        <div ref={stepsRef} className={cx('relative', !cookMode && 'pl-6')}>
          <div className="steps-line absolute left-1 top-2 bottom-2 hidden w-0.5 rounded-full bg-terra-soft/70 md:block" />
          <h2 className="mb-5 font-display text-xl font-semibold">
            {cookMode ? 'Cook with me' : 'The method'}
          </h2>
          <ol className="space-y-4">
            {steps.map((s, i) => (
              <li key={i} className="cook-step relative" style={{ visibility: stepLine ? undefined : 'hidden' }}>
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => setDoneSteps((d) => ({ ...d, [i]: !d[i] }))}
                    className={cx(
                      'grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 font-display text-sm font-bold transition-all',
                      doneSteps[i] ? 'border-sage bg-sage text-white' : 'border-terra-soft bg-paper2 text-terra'
                    )}
                    title={doneSteps[i] ? 'Undo' : 'Mark done'}
                  >
                    {doneSteps[i] ? <Check size={16} strokeWidth={3} /> : i + 1}
                  </button>
                  <p className={cx('leading-relaxed text-ink-soft', cookMode ? 'py-2 text-xl text-ink sm:text-2xl' : 'pt-1.5 text-[15px]', doneSteps[i] && 'line-through opacity-60')}>
                    {s}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          {cookMode && (
            <div className="paper-card mt-6 flex items-center justify-between p-4">
              <p className="font-hand text-xl">you’re {Object.values(doneSteps).filter(Boolean).length} of {steps.length} steps in — the kitchen smells right.</p>
              <button className="btn-warm !rounded-full !px-5 !py-2 !text-xs" onClick={() => setCookMode(false)}>
                Done cooking
              </button>
            </div>
          )}
        </div>
      </div>

      {/* pinterest pins */}
      {pins.length > 0 && (
        <div className="paper-card mt-10 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl font-semibold">
              📌 Pin captions <span className="text-sm font-body font-normal text-ink-soft">(written for this recipe — steal them for your board)</span>
            </h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {pins.slice(0, 6).map((p, i) => (
              <div key={i} className="rounded-xl border border-line bg-paper2/50 p-4">
                <p className="text-sm font-bold">{p.headline}</p>
                {p.description && <p className="mt-1 text-xs leading-relaxed text-ink-soft">{p.description}</p>}
                {p.hashtags?.length ? <p className="mt-2 text-xs font-bold text-terra">{p.hashtags.join(' ')}</p> : null}
                <button
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-terra hover:text-terra-deep"
                  onClick={() => copy(`${p.headline}\n${p.description ?? ''}\n${(p.hashtags ?? []).join(' ')}`, `pin-${i}`)}
                >
                  {copied === `pin-${i}` ? <><Check size={12} /> copied!</> : <><Copy size={12} /> copy caption</>}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
