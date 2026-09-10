'use client';
import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cx } from '@/lib/utils';

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={cx('paper-card p-6', className)}>{children}</div>;
}

export function SectionTitle({ kicker, title, sub, right }: { kicker?: string; title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        {kicker && <p className="font-hand text-xl text-terra">{kicker}</p>}
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">{title}</h1>
        {sub && <p className="mt-1.5 max-w-2xl text-sm text-ink-soft">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold', ok ? 'bg-sage/15 text-sage-deep' : 'bg-terra/10 text-terra')}>
      <span className={cx('h-1.5 w-1.5 rounded-full', ok ? 'bg-sage' : 'bg-terra')} />
      {label}
    </span>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-ink-soft">
      <Loader2 size={16} className="animate-spin" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cx('relative w-full paper-card p-6 shadow-paper-lift', wide ? 'max-w-3xl' : 'max-w-xl')}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full border border-line text-ink-soft hover:text-terra">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** fetch-with-refresh helper */
export function useApi<T = any>(url: string, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || `HTTP ${res.status}`);
      setData(await res.json());
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'load failed');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => {
    void load();
  }, [load]);
  return { data, loading, error, reload: load, setData };
}

export function post(url: string, body?: any) {
  return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
}
export function patch(url: string, body: any) {
  return fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}
export function del(url: string) {
  return fetch(url, { method: 'DELETE' });
}

export function fmtDate(iso?: string | null) {
  return iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
}

export function statusColor(status: string) {
  switch (status) {
    case 'done': return 'bg-sage/15 text-sage-deep';
    case 'running': return 'bg-butter/20 text-butter';
    case 'failed': return 'bg-terra/10 text-terra';
    default: return 'bg-paper2 text-ink-soft';
  }
}
