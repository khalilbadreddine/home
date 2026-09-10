'use client';
import { useEffect, useState } from 'react';
import { Check, Download, Loader2, Save } from 'lucide-react';
import { Card, SectionTitle, Spinner, post } from './ui';
import { cx } from '@/lib/utils';

const TEXT_FIELDS: { key: string; label: string; help?: string; area?: boolean }[] = [
  { key: 'site_name', label: 'Site name' },
  { key: 'tagline', label: 'Tagline' },
  { key: 'hero_title', label: 'Hero title (the big line)', area: true },
  { key: 'hero_sub', label: 'Hero sub (two warm sentences)', area: true },
  { key: 'followers_note', label: 'Followers note (under the hero)' },
  { key: 'pinterest_url', label: 'Pinterest URL' },
  { key: 'instagram_url', label: 'Instagram URL (optional)' },
  { key: 'circle_rules', label: 'The Circle — house rules (one per line)', area: true },
];

export function SettingsTab() {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [ai, setAi] = useState<any>(null);
  const [env, setEnv] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings').then((r) => r.json()).then((d) => {
      setVals(d.settings || {});
      setAi(d.ai);
      setEnv(JSON.parse(d.settings?.__env || '{}'));
    }).catch(() => {});
  }, []);

  const save = async () => {
    setBusy(true);
    setSaved(false);
    const res = await post('/api/admin/settings', vals);
    const d = await res.json();
    setBusy(false);
    setSaved(d.ok);
    setTimeout(() => setSaved(false), 2500);
  };

  const testAi = async () => {
    setBusy(true);
    const res = await fetch('/api/health');
    setAi((await res.json()).ai);
    setBusy(false);
  };

  const exportData = async () => {
    setExporting(true);
    try {
      const res = await post('/api/admin/export', {});
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `therecipeseeker-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  if (!vals && !ai) return <Spinner label="unlocking settings…" />;
  if (!ai) return <Spinner label="unlocking settings…" />;

  return (
    <div>
      <SectionTitle
        kicker="the keys to the house"
        title="Settings"
        sub="Everything here is optional — the site works without each one, and each unlocks more when you add it."
        right={
          <button className="btn-warm !px-4 !py-2.5 !text-xs" onClick={save} disabled={busy}>
            {saved ? <Check size={14} /> : <Save size={14} />} {saved ? 'Saved' : 'Save all'}
          </button>
        }
      />

      <div className="space-y-6">
        {/* identity */}
        <Card>
          <h2 className="font-display text-lg font-semibold">The house</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {TEXT_FIELDS.map((f) => (
              <div key={f.key} className={f.area ? 'sm:col-span-2' : ''}>
                <label className="label">{f.label}</label>
                {f.area ? (
                  <textarea className="field text-sm" rows={f.key === 'circle_rules' ? 5 : 2} value={vals[f.key] || ''} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} />
                ) : (
                  <input className="field text-sm" value={vals[f.key] || ''} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} />
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* AI */}
        <Card className={cx(ai?.ok ? '!border-sage/40' : '!border-terra/40')}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold">Saffron (your free AI)</h2>
            <button className="btn-ghost !px-3.5 !py-2 !text-xs" onClick={testAi} disabled={busy}>
              {busy ? <Loader2 size={13} className="animate-spin" /> : ai?.ok ? '✓ connected — ' + ai.model : 'not answering — test'}
            </button>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-ink-soft">
            Ollama runs on your own machine (free, private, offline). Install once:
            <span className="mx-1 rounded bg-paper2 px-1.5 py-0.5 font-mono text-[11px]">ollama serve</span> and
            <span className="mx-1 rounded bg-paper2 px-1.5 py-0.5 font-mono text-[11px]">ollama pull llama3.1</span>.
            If Ollama lives elsewhere (a VPS, a Raspberry Pi in the kitchen), point the URL below at it.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Ollama URL</label>
              <input className="field font-mono text-xs" placeholder="http://localhost:11434" value={vals.ollama_url || ''} onChange={(e) => setVals({ ...vals, ollama_url: e.target.value })} />
            </div>
            <div>
              <label className="label">Model</label>
              <input className="field font-mono text-xs" placeholder="llama3.1" value={vals.ollama_model || ''} onChange={(e) => setVals({ ...vals, ollama_model: e.target.value })} />
            </div>
          </div>
          {env?.ollamaUrlEnv && <p className="mt-2 text-[11px] text-ink-soft">env override: OLLAMA_BASE_URL={env.ollamaUrlEnv} (env wins over this field)</p>}
        </Card>

        {/* newsletter */}
        <Card>
          <h2 className="font-display text-lg font-semibold">The Sunday Spoon (email)</h2>
          <p className="mt-2 text-xs leading-relaxed text-ink-soft">
            Subscribers are saved from day one. To actually send letters, add a free{' '}
            <a className="link-warm" href="https://resend.com" target="_blank" rel="noreferrer">Resend</a> key (100 emails/day free) —
            or use the <span className="font-mono text-[11px]">RESEND_API_KEY</span> env variable.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Resend API key</label>
              <input className="field font-mono text-xs" placeholder="re_…" value={vals.resend_api_key || ''} onChange={(e) => setVals({ ...vals, resend_api_key: e.target.value })} />
              {env?.hasResendEnv && <p className="mt-1 text-[11px] text-sage-deep">env key present — it takes priority</p>}
            </div>
            <div>
              <label className="label">From</label>
              <input className="field font-mono text-xs" placeholder="The Sunday Spoon &lt;you@yourdomain.com&gt;" value={vals.newsletter_from || ''} onChange={(e) => setVals({ ...vals, newsletter_from: e.target.value })} />
            </div>
          </div>
        </Card>

        {/* data */}
        <Card>
          <h2 className="font-display text-lg font-semibold">Data & keys</h2>
          <div className="mt-3 space-y-2 text-xs text-ink-soft">
            <p><span className="font-bold text-ink">Database:</span> {env?.dbKind || 'local sqlite'} — switch to Neon by setting DATABASE_URL (free plan, no code change).</p>
            <p><span className="font-bold text-ink">Google login:</span> {env?.hasGoogle ? 'connected (GOOGLE_CLIENT_ID set)' : 'off — add GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET to connect the owner’s Google account'}</p>
            <p><span className="font-bold text-ink">Owner account:</span> ADMIN_EMAIL / ADMIN_PASSWORD env (the “owner key” — anyone else signing in cannot manage the kitchen).</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn-ghost !px-4 !py-2 !text-xs" onClick={exportData} disabled={exporting}>
              <Download size={13} /> {exporting ? 'packing…' : 'Export all data (JSON)'}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
