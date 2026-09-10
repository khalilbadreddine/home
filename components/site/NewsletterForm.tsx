'use client';
import { useState } from 'react';
import { Check, Loader2, Mail } from 'lucide-react';

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || state === 'busy') return;
    setState('busy');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'site' }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'failed');
      setState('done');
    } catch (err: any) {
      setState('error');
      setMsg(err?.message?.includes('EMAIL') ? 'That email doesn’t look quite right — try again?' : 'Something hiccuped — try again in a moment.');
    }
  };

  if (state === 'done') {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-sage/40 bg-sage/10 px-5 py-4">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-sage text-white"><Check size={16} /></span>
        <div>
          <p className="font-bold">You’re in. The first spoon lands Sunday.</p>
          <p className="text-xs text-ink-soft">One letter a week. Unsubscribing is one click, no guilt.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={compact ? 'flex max-w-md gap-2' : 'mx-auto flex w-full max-w-md flex-col gap-2 sm:flex-row'}>
      <div className="relative flex-1">
        <Mail size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft" />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@yourkitchen.com"
          className="field !rounded-full !pl-10"
          aria-label="Your email"
        />
      </div>
      <button type="submit" className="btn-warm !rounded-full" disabled={state === 'busy'}>
        {state === 'busy' ? <Loader2 size={15} className="animate-spin" /> : 'Join The Sunday Spoon'}
      </button>
      {state === 'error' && <p className="sm:-mt-1 text-xs font-bold text-terra sm:mt-3">{msg}</p>}
    </form>
  );
}
