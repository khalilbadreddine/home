'use client';
import { useState } from 'react';
import { Check, Loader2, Mail, Send, Sparkles } from 'lucide-react';
import { Card, SectionTitle, Spinner, post, useApi, fmtDate } from './ui';

export function NewsletterTab() {
  const { data: subs, loading, reload } = useApi<any[]>('/api/admin/subscribers');
  const [subject, setSubject] = useState('');
  const [preview, setPreview] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState<'idle' | 'draft' | 'send'>('idle');
  const [msg, setMsg] = useState('');

  const draft = async () => {
    setBusy('draft');
    setMsg('');
    try {
      const res = await post('/api/admin/skills/newsletter_draft/run', {});
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'could not draft');
      // the draft lands in the Automation log; pull it after it finishes
      setMsg('The kitchen AI is writing the letter — open Automation in a moment to copy it here. (Run needs Ollama at home.)');
      setTimeout(async () => {
        try {
          const jres = await fetch(`/api/admin/jobs/${d.jobId}`, { cache: 'no-store' });
          if (jres.ok) {
            const job = await jres.json();
            if (job.status === 'done' && job.output?.subject) {
              setSubject(job.output.subject);
              setPreview(job.output.preview || '');
              setBody(job.output.body || '');
              setMsg('Draft pulled into the composer — review it, then send.');
            }
          }
        } catch {}
      }, 9000);
    } catch (e: any) {
      setMsg(e?.message || 'Could not start the draft — is Ollama running?');
    } finally {
      setBusy('idle');
    }
  };

  const saveDraft = async () => {
    if (!subject.trim() || !body.trim()) return;
    setBusy('send');
    setMsg('');
    const res = await post('/api/admin/newsletter', { subject, preview, body, send: false });
    const d = await res.json();
    setMsg(d.note || 'Saved as a draft.');
    setBusy('idle');
    void reload();
  };

  const send = async () => {
    if (!subject.trim() || !body.trim()) return;
    if (!confirm(`Send "${subject}" to ${subs?.length ?? 0} subscribers?`)) return;
    setBusy('send');
    setMsg('');
    const res = await post('/api/admin/newsletter', { subject, preview, body, send: true });
    const d = await res.json();
    setMsg(d.message || d.note || 'Done.');
    setBusy('idle');
    void reload();
  };

  if (loading) return <Spinner label="counting the table…" />;

  return (
    <div>
      <SectionTitle
        kicker="The Sunday Spoon"
        title="Newsletter"
        sub="One warm letter a week. The AI drafts it, you read it out loud, then it goes out — never without you."
      />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">This week’s letter</h2>
            <button className="btn-ghost !px-3.5 !py-2 !text-xs" onClick={draft} disabled={busy !== 'idle'}>
              {busy === 'draft' ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              Ask the kitchen AI
            </button>
          </div>
          <div className="mt-4 space-y-3">
            <div>
              <label className="label">Subject</label>
              <input className="field" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="a slow sunday, one pot, and an apology to the oven" />
            </div>
            <div>
              <label className="label">Preview text</label>
              <input className="field" value={preview} onChange={(e) => setPreview(e.target.value)} placeholder="what shows in the inbox" />
            </div>
            <div>
              <label className="label">The letter</label>
              <textarea className="field min-h-[260px] text-sm leading-relaxed" value={body} onChange={(e) => setBody(e.target.value)} placeholder={'hey — this week was…\n\n(speak like you’re texting a friend who loves you)'} />
            </div>
            {msg && <p className="rounded-xl bg-paper2 px-4 py-3 text-xs font-bold text-ink-soft">{msg}</p>}
            <div className="flex flex-wrap gap-2">
              <button className="btn-ghost" onClick={saveDraft} disabled={busy !== 'idle'}>
                <Check size={14} /> Save draft only
              </button>
              <button className="btn-warm" onClick={send} disabled={busy !== 'idle'}>
                {busy === 'send' ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Send to {subs?.length ?? 0}
              </button>
            </div>
            <p className="text-[11px] text-ink-soft">
              Sending needs a Resend key (free tier: 100/day) — add it in Settings. Without it, letters save as drafts.
            </p>
          </div>
        </Card>

        <Card>
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <Mail size={16} className="text-terra" /> At the table ({subs?.length ?? 0})
          </h2>
          <div className="mt-4 max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
            {!subs?.length && (
              <p className="font-hand text-lg text-ink-soft">
                no one is subscribed yet — the form on your homepage will fill this in.
              </p>
            )}
            {subs?.slice(0, 120).map((s: any) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg bg-paper2/50 px-3 py-2 text-sm">
                <span className="truncate font-medium">{s.email}</span>
                <span className="ml-3 shrink-0 text-[10px] text-ink-soft">{fmtDate(s.created_at)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
