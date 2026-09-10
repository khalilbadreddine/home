'use client';
import { useEffect, useState } from 'react';
import { Heart, Loader2, Send } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

interface Note {
  id: number;
  name: string;
  message: string;
  created_at: string;
}

export function CommentSection({ kind, id, title }: { kind: 'recipe' | 'story'; id: number; title: string }) {
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const res = await fetch(`/api/comments?${kind}_id=${id}`);
      if (res.ok) setNotes(await res.json());
    } catch {}
  };

  useEffect(() => {
    void load();
  }, [kind, id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || state === 'busy') return;
    setState('busy');
    setError('');
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [`${kind}_id`]: id, name: name || 'a friend of the kitchen', message: message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'could not save your note');
      setState('done');
      setMessage('');
      setTimeout(() => setState('idle'), 3000);
      void load();
    } catch (err: any) {
      setState('error');
      setError(err?.message || 'Something hiccuped — try again?');
    }
  };

  return (
    <section className="mt-14" id="notes">
      <div className="paper-card p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-2xl font-semibold">Notes from The Circle</h2>
          <span className="chip">🤝 safe space</span>
        </div>
        <p className="mt-2 max-w-xl text-sm text-ink-soft">
          How did “{title}” go in your kitchen? What did you change? The Circle reads everything with a kind
          eye — no grades, no critics, just cooks talking to cooks.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <div className="grid gap-3 sm:grid-cols-[220px_1fr]">
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className="field field-hand" placeholder="your name (optional)" />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={1000}
              rows={3}
              className="field field-hand resize-none"
              placeholder="we doubled it and the house is still happy…"
            />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" className="btn-warm !rounded-full !px-5 !py-2.5 !text-xs" disabled={state === 'busy' || !message.trim()}>
              {state === 'busy' ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Leave a note
            </button>
            {state === 'done' && <p className="font-hand text-lg text-sage-deep">your note is on the wall 🧡</p>}
            {state === 'error' && <p className="text-xs font-bold text-terra">{error}</p>}
          </div>
        </form>

        <div className="mt-8 space-y-4">
          {notes === null && (
            <p className="font-hand text-lg text-ink-soft">unfolding the notes…</p>
          )}
          {notes?.length === 0 && (
            <p className="font-hand text-lg text-ink-soft">no notes yet — yours will be the first pin on this card.</p>
          )}
          {notes?.map((n) => (
            <div key={n.id} className="rounded-xl border border-line bg-paper2/40 p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-bold">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-terra-soft/60 font-hand text-sm text-terra-deep">
                    {n.name.slice(0, 1).toUpperCase()}
                  </span>
                  {n.name}
                </span>
                <span className="text-xs text-ink-soft">{timeAgo(n.created_at)}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{n.message}</p>
              <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-ink-soft">
                <Heart size={11} className="text-terra" /> kind words only, always
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
