'use client';
import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, FlaskConical, Loader2, Plus, Search, Sparkles, X } from 'lucide-react';
import type { Row } from '@/lib/db';
import { cx, moodMeta, splitMoods } from '@/lib/utils';

interface Match {
  recipe: Row;
  matched: string[];
  missing: string[];
  score: number;
}

export function PantryClient({ recipes }: { recipes: Row[] }) {
  const [items, setItems] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const addItem = (raw: string) => {
    const it = raw.trim().toLowerCase().replace(/,$/, '');
    if (!it || items.includes(it) || items.length >= 12) return;
    setItems((xs) => [...xs, it]);
    setInput('');
  };

  const cook = async () => {
    if (!items.length || busy) return;
    setBusy(true);
    setMatches(null);
    setAiNote(null);
    setAiError(null);
    try {
      const res = await fetch('/api/pantry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'could not match');
      setMatches(data.matches || []);
      if (data.aiNote) setAiNote(data.aiNote);
      else if (data.aiNoteError) setAiError(data.aiNoteError);
    } catch (e: any) {
      setMatches([]);
      setAiError(e?.message || 'Something hiccuped — try again?');
    } finally {
      setBusy(false);
    }
  };

  const coverageLabel = (m: Match) => {
    const has = m.matched.length;
    const total = items.length;
    if (has === 0) return 'a stretch';
    if (has / total >= 0.6) return `uses ${has} of your ${total} things`;
    return `uses ${has} of your ${total} things`;
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* input */}
      <div className="paper-card p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addItem(input);
              }
            }}
            placeholder="type an ingredient, press enter…"
            className="field field-hand max-w-xs flex-1"
          />
          <button className="btn-ghost !rounded-full !px-4 !py-2.5 !text-xs" onClick={() => addItem(input)}>
            <Plus size={13} /> add
          </button>
          {items.length > 0 && (
            <button className="text-xs font-bold text-ink-soft hover:text-terra" onClick={() => setItems([])}>
              clear all
            </button>
          )}
        </div>

        {items.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {items.map((it) => (
              <span key={it} className="chip !py-1.5">
                {it}
                <button onClick={() => setItems((xs) => xs.filter((x) => x !== it))} aria-label={`remove ${it}`}>
                  <X size={11} className="opacity-60 hover:opacity-100" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button className="btn-warm" onClick={cook} disabled={!items.length || busy}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            Cook with what I have
          </button>
          <span className="font-hand text-lg text-ink-soft">
            {items.length ? `${items.length} things in the fridge` : 'even 3 things is a kitchen'}
          </span>
        </div>
      </div>

      {/* results */}
      {busy && (
        <div className="mt-10 text-center">
          <p className="font-hand text-2xl text-ink-soft">rummaging through the recipe drawer…</p>
        </div>
      )}

      {matches !== null && !busy && (
        <div className="mt-10">
          {aiNote && (
            <div className="paper-card mb-8 border-l-4 !border-l-terra p-6">
              <p className="flex items-center gap-2 font-bold text-terra">
                <Sparkles size={15} /> The Seeker says
              </p>
              <p className="mt-2 leading-relaxed text-ink-soft">{aiNote}</p>
            </div>
          )}
          {aiError && !matches.length && (
            <div className="paper-card mb-8 p-6">
              <p className="font-hand text-xl text-ink-soft">{aiError}</p>
            </div>
          )}

          {matches.length === 0 ? (
            <div className="paper-card p-8 text-center">
              <p className="text-3xl">🥕</p>
              <h3 className="mt-3 font-display text-2xl font-semibold">Nothing fits perfectly — yet</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
                No recipe in the kitchen uses exactly that mix. Try adding one more staple (eggs, rice,
                butter, onion…) or leave a note on The Circle — new recipes come from there.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <p className="font-hand text-2xl text-ink-soft">here’s what your fridge can do tonight ↓</p>
              {matches.map((m, i) => (
                <Link
                  key={m.recipe.id}
                  href={`/recipes/${m.recipe.slug}`}
                  className={cx('pin-card flex gap-4 p-4', i % 2 ? 'tilt-2' : 'tilt-1')}
                >
                  <div className="relative w-32 shrink-0 sm:w-44">
                    {m.recipe.image ? (
                      <Image src={m.recipe.image} alt={m.recipe.title} width={260} height={190} className="aspect-[4/3] w-full rounded-lg object-cover" />
                    ) : (
                      <div className="grid aspect-[4/3] w-full place-items-center rounded-lg bg-paper2 font-hand">soon</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 py-1">
                    <h3 className="font-display text-lg font-semibold leading-snug">{m.recipe.title}</h3>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-ink-soft">
                      <span className="flex items-center gap-1"><Clock size={11} className="text-terra" /> {m.recipe.time_min} min</span>
                      <span>serves {m.recipe.servings}</span>
                      {splitMoods(m.recipe.moods).slice(0, 2).map((mo) => (
                        <span key={mo}>{moodMeta(mo).emoji} {moodMeta(mo).label}</span>
                      ))}
                    </p>
                    <p className="mt-2 font-hand text-lg text-terra">{coverageLabel(m)}</p>
                    {m.matched.length > 0 && (
                      <p className="mt-1 text-xs text-ink-soft">
                        <span className="font-bold text-sage-deep">✓ {m.matched.slice(0, 5).join(', ')}{m.matched.length > 5 ? '…' : ''}</span>
                      </p>
                    )}
                    {m.missing.length > 0 && (
                      <p className="mt-0.5 text-xs text-ink-soft">
                        <span className="font-bold text-terra-deep">+ a little {m.missing.slice(0, 3).join(', ')}{m.missing.length > 3 ? '…' : ''}</span>
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
