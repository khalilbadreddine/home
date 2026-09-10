'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Plus, Sparkles, Trash2, X, Zap } from 'lucide-react';
import { Card, Modal, SectionTitle, Spinner, del, fmtDate, patch, post, useApi } from './ui';
import { cx, MOODS } from '@/lib/utils';

interface Skill {
  id: string; name: string; emoji: string; category: string; description: string; savesTo: string;
  params: { key: string; label: string; type: string; placeholder?: string; options?: { value: string; label: string }[]; required?: boolean; default?: string; help?: string }[];
}
interface Step { skill: string; label?: string; input?: Record<string, string> }
interface WF {
  id: number; name: string; description: string; trigger: string; steps: Step[];
  active: number | boolean; schedule_hours: number | null; last_run: string | null;
}

const TRIGGERS = [
  { value: 'manual', label: 'Manual — I press Run' },
  { value: 'recipe_published', label: 'When a recipe is published' },
  { value: 'story_published', label: 'When a story is published' },
  { value: 'schedule', label: 'On a schedule (every N hours)' },
];

export function Automation() {
  const { data, loading, reload } = useApi<{ ai: any; skills: Skill[]; recipeOptions: any[]; storyOptions: any[] }>('/api/admin/skills');
  const { data: wfs, reload: reloadWfs } = useApi<WF[]>('/api/admin/workflows');
  const { data: jobs, reload: reloadJobs } = useApi<any[]>('/api/admin/jobs');
  const [runSkill, setRunSkill] = useState<Skill | null>(null);
  const [editWf, setEditWf] = useState<Partial<WF> | null>(null);
  const [openWf, setOpenWf] = useState(false);

  if (loading || !data || !wfs) return <Spinner label="waking the kitchen AI…" />;

  const aiOn = data.ai.ok;

  return (
    <div>
      <SectionTitle
        kicker="the automation control center"
        title="Automation"
        sub="Pre-built kitchen skills that write, polish, and market for you on your own free AI (Ollama). Chain them into workflows that run the moment you publish."
        right={
          <button className="btn-warm !px-4 !py-2.5 !text-xs" onClick={() => { setEditWf({ name: '', description: '', trigger: 'manual', steps: [], active: true, schedule_hours: null }); setOpenWf(true); }}>
            <Plus size={14} /> New workflow
          </button>
        }
      />

      {/* AI status */}
      <Card className={cx('mb-6 !p-4', !aiOn && '!border-terra/40')}>
        <div className="flex flex-wrap items-center gap-3">
          <span className={cx('grid h-10 w-10 place-items-center rounded-full', aiOn ? 'bg-sage/15 text-sage-deep' : 'bg-terra/10 text-terra')}>
            <Zap size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">
              {aiOn ? (
                <>Saffron is home — <span className="text-sage-deep">{data.ai.base}</span> · model <span className="text-sage-deep">{data.ai.model}</span>{data.ai.models.length > 0 && <> · {data.ai.models.length} model{data.ai.models.length > 1 ? 's' : ''} pulled</>}</>
              ) : (
                <>Saffron is not answering at <span className="font-mono text-xs">{data.ai.base}</span></>
              )}
            </p>
            <p className="text-xs text-ink-soft">
              {aiOn
                ? 'Free, private, offline — your words never leave your machine.'
                : 'Run “ollama serve” and “ollama pull llama3.1” on your machine (or set OLLAMA_BASE_URL in Settings), then run any skill.'}
            </p>
          </div>
          {!aiOn && (
            <button className="btn-ghost !px-3.5 !py-2 !text-xs" onClick={() => location.reload()}>
              Try again
            </button>
          )}
        </div>
      </Card>

      {/* skills */}
      <h2 className="mb-3 font-display text-xl font-semibold">Pre-built skills</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.skills.map((s) => (
          <Card key={s.id} className="flex flex-col !p-5">
            <div className="flex items-start justify-between">
              <span className="text-2xl">{s.emoji}</span>
              <span className="chip !py-0.5 !text-[10px] uppercase">{s.category}</span>
            </div>
            <h3 className="mt-2 font-display text-lg font-semibold">{s.name}</h3>
            <p className="mt-1 flex-1 text-xs leading-relaxed text-ink-soft">{s.description}</p>
            <p className="mt-2 text-[11px] font-bold text-ink-soft">saves → {s.savesTo}</p>
            <button className="btn-warm mt-4 !px-4 !py-2 !text-xs" onClick={() => setRunSkill(s)}>
              <Play size={13} /> Run now
            </button>
          </Card>
        ))}
      </div>

      {/* workflows */}
      <div className="mt-10 flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold">Workflows</h2>
        <span className="font-hand text-lg text-ink-soft">pressing publish runs these automatically</span>
      </div>
      <div className="mt-3 space-y-3">
        {wfs.map((w) => (
          <Card key={w.id} className="!p-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                className={cx('relative h-6 w-11 rounded-full transition-colors', w.active ? 'bg-sage' : 'bg-line')}
                onClick={async () => { await patch(`/api/admin/workflows/${w.id}`, { active: !w.active }); void reloadWfs(); }}
                title={w.active ? 'active' : 'paused'}
              >
                <span className={cx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', w.active ? 'left-[22px]' : 'left-0.5')} />
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-base font-semibold">{w.name}</h3>
                  <span className="chip !py-0.5 !text-[10px]">
                    {TRIGGERS.find((t) => t.value === w.trigger)?.label || w.trigger}
                    {w.trigger === 'schedule' && w.schedule_hours ? ` · every ${w.schedule_hours}h` : ''}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-ink-soft">{w.description || 'no description'}</p>
                <p className="mt-1.5 flex flex-wrap items-center gap-1 text-[11px] font-bold text-ink-soft">
                  {(w.steps || []).map((st, i) => (
                    <span key={i} className="flex items-center gap-1">
                      {i > 0 && <span className="text-terra">→</span>}
                      <span className="rounded-md bg-paper2 px-1.5 py-0.5">{skillEmoji(data.skills, st.skill)} {skillName(data.skills, st.skill)}</span>
                    </span>
                  ))}
                  {w.last_run && <span className="ml-2 font-normal">last run {fmtDate(w.last_run)}</span>}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button className="btn-warm !px-3.5 !py-2 !text-xs" onClick={async () => { await post(`/api/admin/workflows/${w.id}/run`, { input: {} }); void reloadJobs(); }}>
                  <Play size={13} /> Run
                </button>
                <button className="btn-ghost !px-3 !py-2 !text-xs" onClick={() => { setEditWf(w); setOpenWf(true); }}>Edit</button>
                <button className="btn-ghost !px-3 !py-2 !text-xs hover:!border-terra hover:!text-terra" onClick={async () => { if (confirm(`Delete "${w.name}"?`)) { await del(`/api/admin/workflows/${w.id}`); void reloadWfs(); } }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* jobs */}
      <div className="mt-10 flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold">Job history</h2>
        <button className="text-xs font-bold text-terra hover:underline" onClick={() => reloadJobs()}>refresh</button>
      </div>
      <div className="mt-3 space-y-2">
        {!jobs?.length && <Card><p className="font-hand text-lg text-ink-soft">no jobs yet — run a skill or press publish.</p></Card>}
        {jobs?.map((j) => (
          <JobRow key={j.id} job={j} />
        ))}
      </div>

      <RunSkillModal skill={runSkill} onClose={() => setRunSkill(null)} recipeOptions={data.recipeOptions} storyOptions={data.storyOptions} onDone={reloadJobs} />
      <WfModal open={openWf} onClose={() => { setOpenWf(false); setEditWf(null); }} value={editWf} skills={data.skills} onSaved={() => { setOpenWf(false); setEditWf(null); void reloadWfs(); }} />
    </div>
  );
}

function skillEmoji(skills: Skill[], id: string) { return skills.find((s) => s.id === id)?.emoji || '⚙️'; }
function skillName(skills: Skill[], id: string) { return skills.find((s) => s.id === id)?.name || id; }

/* ── job row with expandable log ── */
function JobRow({ job }: { job: any }) {
  const [open, setOpen] = useState(job.status === 'running');
  const [live, setLive] = useState<any>(null);

  useEffect(() => {
    if (job.status !== 'running') return;
    let stop = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/admin/jobs/${job.id}`, { cache: 'no-store' });
        if (res.ok) {
          const j = await res.json();
          if (!stop) setLive(j);
        }
      } catch {}
    };
    void poll();
    const t = setInterval(poll, 2500);
    return () => { stop = true; clearInterval(t); };
  }, [job.status, job.id]);

  const j = live || job;

  return (
    <div className="paper-card !p-3.5">
      <button className="flex w-full flex-wrap items-center gap-2 text-left" onClick={() => setOpen(!open)}>
        <span className={cx('rounded-full px-2.5 py-1 text-[11px] font-bold', j.status === 'done' ? 'bg-sage/15 text-sage-deep' : j.status === 'failed' ? 'bg-terra/10 text-terra' : j.status === 'running' ? 'bg-butter/20 text-butter' : 'bg-paper2 text-ink-soft')}>
          {j.status}
        </span>
        <span className="text-sm font-bold">{j.name}</span>
        {j.workflow_name && <span className="chip !py-0.5 !text-[10px]">{j.workflow_name}</span>}
        <span className="ml-auto text-[11px] text-ink-soft">{fmtDate(j.created_at)}{j.finished_at ? ` → ${new Date(j.finished_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}</span>
        <button
          className="ml-2 grid h-6 w-6 place-items-center rounded-full border border-line text-[10px] text-ink-soft hover:text-terra"
          onClick={(e) => { e.stopPropagation(); del(`/api/admin/jobs/${j.id}`).then(() => location.reload()); }}
          title="clear"
        >
          <X size={10} />
        </button>
      </button>

      {open && (
        <div className="mt-3 border-t border-dashed border-line pt-3">
          <div className="rounded-xl bg-paper2/60 p-3 font-mono text-[11px] leading-relaxed text-ink-soft">
            {(j.log || []).map((l: string, i: number) => (
              <div key={i} className={l.startsWith('✗') ? 'text-terra' : ''}>{l}</div>
            ))}
            {!j.log?.length && <div>…</div>}
          </div>
          {j.output && Object.keys(j.output).length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-[11px] font-bold text-terra">output</summary>
              <pre className="mt-1 max-h-72 overflow-auto rounded-xl bg-paper2/60 p-3 text-[11px] text-ink-soft">{JSON.stringify(j.output, null, 2)}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

/* ── run-skill modal ── */
function RunSkillModal({ skill, onClose, recipeOptions, storyOptions, onDone }: { skill: Skill | null; onClose: () => void; recipeOptions: any[]; storyOptions: any[]; onDone: () => void }) {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [jobId, setJobId] = useState<number | null>(null);
  const timer = useRef<any>(null);

  useEffect(() => {
    if (skill) {
      const init: Record<string, string> = {};
      for (const p of skill.params) init[p.key] = p.default || '';
      setVals(init);
      setMsg('');
      setJobId(null);
      if (timer.current) clearInterval(timer.current);
    }
  }, [skill]);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  if (!skill) return null;

  const run = async () => {
    setBusy(true);
    setMsg('');
    try {
      const res = await post(`/api/admin/skills/${skill.id}/run`, { input: vals });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'could not start');
      setJobId(d.jobId);
      setMsg('Running — this can take a minute while the model thinks…');
      // poll the job
      timer.current = setInterval(async () => {
        try {
          const jr = await fetch(`/api/admin/jobs/${d.jobId}`, { cache: 'no-store' });
          if (!jr.ok) return;
          const job = await jr.json();
          if (job.status === 'done') {
            clearInterval(timer.current);
            setMsg(`✅ ${firstSummary(job.output)}`);
            setBusy(false);
            onDone();
          } else if (job.status === 'failed') {
            clearInterval(timer.current);
            setMsg(`✗ ${(job.log || []).filter((l: string) => l.startsWith('✗')).pop() || 'It failed — check the log below.'}`);
            setBusy(false);
            onDone();
          }
        } catch {}
      }, 3000);
    } catch (e: any) {
      setMsg(e?.message || 'Could not start the skill.');
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`${skill.emoji} ${skill.name}`}>
      <p className="text-xs leading-relaxed text-ink-soft">{skill.description}</p>
      <div className="mt-4 space-y-3">
        {skill.params.map((p) => (
          <div key={p.key}>
            <label className="label">{p.label}{p.required ? ' *' : ''}</label>
            {p.type === 'select' ? (
              <select className="field" value={vals[p.key] || ''} onChange={(e) => setVals({ ...vals, [p.key]: e.target.value })}>
                <option value="">{p.placeholder || 'choose…'}</option>
                {(p.key === 'recipe_id' ? recipeOptions : p.key === 'story_id' ? storyOptions : p.options || []).map((o: any) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ) : p.type === 'textarea' ? (
              <textarea className="field" rows={3} value={vals[p.key] || ''} onChange={(e) => setVals({ ...vals, [p.key]: e.target.value })} placeholder={p.placeholder} />
            ) : (
              <input className="field" value={vals[p.key] || ''} onChange={(e) => setVals({ ...vals, [p.key]: e.target.value })} placeholder={p.placeholder} />
            )}
            {p.help && <p className="mt-1 text-[11px] text-ink-soft">{p.help}</p>}
          </div>
        ))}
      </div>
      {msg && <p className={cx('mt-4 rounded-xl px-4 py-3 text-xs font-bold', msg.startsWith('✅') ? 'bg-sage/10 text-sage-deep' : msg.startsWith('✗') ? 'bg-terra/10 text-terra' : 'bg-paper2 text-ink-soft')}>{msg}</p>}
      <div className="mt-5 flex justify-end gap-2 border-t border-line pt-4">
        <button className="btn-ghost" onClick={onClose}>{busy ? 'Leave it running' : 'Close'}</button>
        <button className="btn-warm" onClick={run} disabled={busy}>
          <Sparkles size={14} /> {busy ? 'Writing…' : 'Run'}
        </button>
      </div>
    </Modal>
  );
}

function firstSummary(output: any): string {
  const entry = Object.values(output || {})[0] as any;
  return entry?.summary || 'Done — open the job log for the full story.';
}

/* ── workflow builder modal ── */
function WfModal({ open, onClose, value, skills, onSaved }: { open: boolean; onClose: () => void; value: Partial<WF> | null; skills: Skill[]; onSaved: () => void }) {
  const [v, setV] = useState<Partial<WF>>(value || {});
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (value) setV(value); }, [value]);
  if (!open || !value) return null;

  const addStep = () => setV({ ...v, steps: [...(v.steps || []), { skill: skills[0]?.id || '', input: {} }] });
  const setStep = (i: number, patch: Partial<Step>) => {
    const steps = [...(v.steps || [])];
    steps[i] = { ...steps[i], ...patch };
    setV({ ...v, steps });
  };
  const stepSkill = (i: number) => skills.find((s) => s.id === v.steps?.[i]?.skill);

  const save = async () => {
    if (!v.name?.trim() || !v.steps?.length) return;
    setBusy(true);
    if (v.id) await patch(`/api/admin/workflows/${v.id}`, v);
    else await post('/api/admin/workflows', v);
    setBusy(false);
    onSaved();
  };

  return (
    <Modal open={open} onClose={onClose} title={v.id ? `Edit — ${v.name}` : 'New workflow'} wide>
      <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Name</label>
            <input className="field" value={v.name || ''} onChange={(e) => setV({ ...v, name: e.target.value })} placeholder="New recipe → set the table" />
          </div>
          <div>
            <label className="label">Trigger</label>
            <select className="field" value={v.trigger || 'manual'} onChange={(e) => setV({ ...v, trigger: e.target.value })}>
              {TRIGGERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          {v.trigger === 'schedule' && (
            <div>
              <label className="label">Every N hours</label>
              <input className="field" type="number" min={1} value={v.schedule_hours || 24} onChange={(e) => setV({ ...v, schedule_hours: Number(e.target.value) })} />
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <input className="field" value={v.description || ''} onChange={(e) => setV({ ...v, description: e.target.value })} />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="label !mb-0">Steps (run in order)</label>
            <button type="button" className="text-xs font-bold text-terra hover:underline" onClick={addStep}>+ add step</button>
          </div>
          <div className="space-y-3">
            {(v.steps || []).length === 0 && (
              <p className="rounded-xl bg-paper2/60 p-4 font-hand text-lg text-ink-soft">a workflow is just skills chained: pick the first, then add more.</p>
            )}
            {(v.steps || []).map((st, i) => {
              const sk = stepSkill(i);
              return (
                <div key={i} className="rounded-xl border border-line bg-paper2/40 p-3">
                  <div className="flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-card font-display text-xs font-bold text-terra">{i + 1}</span>
                    <select className="field !w-auto flex-1 !py-2 text-sm" value={st.skill} onChange={(e) => setStep(i, { skill: e.target.value, input: {} })}>
                      {skills.map((s) => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
                    </select>
                    <button type="button" className="text-ink-soft hover:text-terra" onClick={() => setV({ ...v, steps: (v.steps || []).filter((_: any, x: number) => x !== i) })}>✕</button>
                  </div>
                  {sk && sk.params.length > 0 && (
                    <div className="mt-2 grid gap-2 pl-8 sm:grid-cols-2">
                      {sk.params.map((p) => (
                        <div key={p.key}>
                          <label className="label !mb-1 text-[10px]">{p.label}</label>
                          <input
                            className="field !py-1.5 font-mono !text-[11px]"
                            placeholder={'{{recipe.id}} or plain text'}
                            value={st.input?.[p.key] || ''}
                            onChange={(e) => setStep(i, { input: { ...(st.input || {}), [p.key]: e.target.value } })}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="mt-2 pl-8 font-mono text-[10px] text-ink-soft">
                    available: {'{{recipe.id}} {{recipe.title}} {{story.id}} {{story.title}} {{input.title}} …'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" className="h-4 w-4 accent-[var(--terra)]" checked={v.active ? true : false} onChange={(e) => setV({ ...v, active: e.target.checked })} />
          active (runs automatically on its trigger)
        </label>
      </div>
      <div className="mt-5 flex justify-end gap-2 border-t border-line pt-4">
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn-warm" onClick={save} disabled={busy || !v.name?.trim() || !(v.steps || []).length}>
          {v.id ? 'Save workflow' : 'Create workflow'}
        </button>
      </div>
    </Modal>
  );
}
