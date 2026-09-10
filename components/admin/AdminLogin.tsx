'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Flame, Loader2 } from 'lucide-react';

export function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'idle' | 'google' | 'creds'>('idle');
  const [error, setError] = useState('');

  const google = async () => {
    setBusy('google');
    setError('');
    await signIn('google', { callbackUrl: '/admin' });
  };

  const creds = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy('creds');
    setError('');
    const res = await signIn('credentials', { email, password, redirect: false });
    if (res?.error) {
      setError('The email or password doesn’t match the owner account.');
      setBusy('idle');
    } else {
      router.refresh();
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-6 pt-20">
      <div className="w-full max-w-md">
        <div className="paper-card p-8">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-terra text-white shadow-glow">
              <Flame size={20} strokeWidth={2.5} />
            </span>
            <div>
              <h1 className="font-display text-2xl font-semibold">The Stove</h1>
              <p className="text-xs text-ink-soft">the control room of TherecipeSeeker</p>
            </div>
          </div>

          <button onClick={google} disabled={busy !== 'idle'} className="btn-warm mt-7 w-full" style={{ background: 'var(--ink)', boxShadow: 'none' }}>
            {busy === 'google' ? <Loader2 size={15} className="animate-spin" /> : <span className="text-lg">G</span>}
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-ink-soft">
            <div className="dotted-rule flex-1" /> or the owner key <div className="dotted-rule flex-1" />
          </div>

          <form onSubmit={creds} className="space-y-3">
            <div>
              <label className="label" htmlFor="ae">Email</label>
              <input id="ae" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="field" placeholder="owner@yourkitchen.com" />
            </div>
            <div>
              <label className="label" htmlFor="ap">Password</label>
              <input id="ap" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="field" placeholder="••••••••" />
            </div>
            {error && <p className="text-xs font-bold text-terra">{error}</p>}
            <button type="submit" className="btn-ghost w-full" disabled={busy !== 'idle'}>
              {busy === 'creds' ? <Loader2 size={15} className="animate-spin" /> : 'Unlock with email'}
            </button>
          </form>

          <p className="mt-5 text-center font-hand text-lg text-ink-soft">
            first time? your owner key is in <span className="text-terra">data/owner-credentials.txt</span>
          </p>
        </div>
        <p className="mt-4 text-center text-xs text-ink-soft">
          <a href="/" className="hover:text-terra">← back to the kitchen</a>
        </p>
      </div>
    </div>
  );
}
