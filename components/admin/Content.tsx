'use client';
import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Eye, Newspaper, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { Card, Modal, SectionTitle, Spinner, del, fmtDate, patch, post, useApi } from './ui';
import { MOODS, cx } from '@/lib/utils';

interface RecipeRow {
  id: number; slug: string; title: string; moods: string; time_min: number; servings: number;
  difficulty: string; image: string; ingredients: any[]; steps: string[]; pins: any[]; tips: string[];
  kitchen_note: string; status: string; views: number; served: number;
  seo_title: string; seo_description: string; created_at: string;
}

export function Content({ storiesOnly = false }: { storiesOnly?: boolean }) {
  if (storiesOnly) return <StoriesTab />;
  return <RecipesTab />;
}

/* ─────────────────────────── RECIPES ─────────────────────────── */

function RecipesTab() {
  const { data, loading, reload } = useApi<RecipeRow[]>('/api/admin/recipes');
  const [editing, setEditing] = useState<Partial<RecipeRow> | null>(null);
  const [open, setOpen] = useState(false);

  const blank = { title: '', kitchen_note: '', moods: 'cozy', time_min: 30, servings: 4, difficulty: 'easy', image: '', ingredients: [] as any[], steps: [] as string[], status: 'draft', seo_title: '', seo_description: '' };

  const save = async () => {
    if (!editing?.title?.trim()) return;
    const payload = { ...editing, moods: (editing.moods || '').split(',').map((s) => s.trim()).filter(Boolean).join(',') };
    if (editing.id) await patch(`/api/admin/recipes/${editing.id}`, payload);
    else await post('/api/admin/recipes', payload);
    setOpen(false);
    setEditing(null);
    void reload();
  };

  const togglePublish = async (r: RecipeRow) => {
    await post(`/api/admin/recipes/${r.id}/publish`);
    void reload();
  };
  const remove = async (r: RecipeRow) => {
    if (!confirm(`Delete "${r.title}"? This cannot be undone.`)) return;
    await del(`/api/admin/recipes/${r.id}`);
    void reload();
  };

  if (loading || !data) return <Spinner label="opening the recipe drawer…" />;

  return (
    <div>
      <SectionTitle
        kicker="the recipe drawer"
        title="Recipes"
        sub="Drafts stay hidden from the board; publishing puts them on tonight’s pinboard instantly — and runs your automation."
        right={
          <button className="btn-warm !px-4 !py-2.5 !text-xs" onClick={() => { setEditing(blank); setOpen(true); }}>
            <Plus size={14} /> New recipe
          </button>
        }
      />

      <div className="space-y-3">
        {data.length === 0 && (
          <Card>
            <p className="font-hand text-xl text-ink-soft">the drawer is empty — add your first recipe, or press “set the starter table” above.</p>
          </Card>
        )}
        {data.map((r) => (
          <Card key={r.id} className="!p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-semibold">{r.title}</h3>
                  <span className={cx('rounded-full px-2.5 py-0.5 text-[11px] font-bold', r.status === 'published' ? 'bg-sage/15 text-sage-deep' : 'bg-paper2 text-ink-soft')}>
                    {r.status}
                  </span>
                  <span className="chip !py-0.5 !text-[11px]">⏱ {r.time_min} min</span>
                  {r.pins?.length > 0 && <span className="chip !py-0.5 !text-[11px]">📌 {r.pins.length} pins</span>}
                </div>
                <p className="mt-1 truncate text-xs text-ink-soft">
                  {r.moods} · serves {r.servings} · {r.views} views · {r.served} served · added {fmtDate(r.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {r.status === 'published' ? (
                  <>
                    <Link href={`/recipes/${r.slug}`} className="btn-ghost !px-3.5 !py-2 !text-xs">
                      <Eye size={13} /> View
                    </Link>
                    <button className="btn-ghost !px-3 !py-2 !text-xs" onClick={() => togglePublish(r)}>Unpublish</button>
                  </>
                ) : (
                  <button className="btn-warm !px-3.5 !py-2 !text-xs" onClick={() => togglePublish(r)}>Publish</button>
                )}
                <button className="btn-ghost !px-3 !py-2 !text-xs" onClick={() => { setEditing(r); setOpen(true); }}>
                  <Pencil size={13} />
                </button>
                <button className="btn-ghost !px-3 !py-2 !text-xs hover:!border-terra hover:!text-terra" onClick={() => remove(r)}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <RecipeEditor open={open} onClose={() => { setOpen(false); setEditing(null); }} value={editing} onSave={save} onChange={setEditing} />
    </div>
  );
}

function RecipeEditor({ open, onClose, value, onSave, onChange }: any) {
  const v = value || {};
  const [imgBusy, setImgBusy] = useState(false);

  const setIng = (i: number, field: string, val: string) => {
    const ings = [...(v.ingredients || [])];
    ings[i] = { ...ings[i], [field]: val };
    onChange({ ...v, ingredients: ings });
  };
  const setStep = (i: number, val: string) => {
    const steps = [...(v.steps || [])];
    steps[i] = val;
    onChange({ ...v, steps });
  };

  const upload = async (file: File) => {
    // store as a data URL (simple, no external storage). For big images, paste a URL instead.
    setImgBusy(true);
    const reader = new FileReader();
    reader.onload = () => onChange({ ...v, image: String(reader.result) });
    reader.readAsDataURL(file);
    setTimeout(() => setImgBusy(false), 400);
  };

  return (
    <Modal open={open} onClose={onClose} title={v.id ? `Edit — ${v.title}` : 'New recipe'} wide>
      <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Title</label>
            <input className="field" value={v.title || ''} onChange={(e) => onChange({ ...v, title: e.target.value })} placeholder="Sunday Tomato & Basil Soup" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">The kitchen note (the “why” — shown in handwritten ink)</label>
            <textarea className="field field-hand !text-lg" rows={2} value={v.kitchen_note || ''} onChange={(e) => onChange({ ...v, kitchen_note: e.target.value })} placeholder="What this dish feels like, why it exists…" />
          </div>
          <div>
            <label className="label">Moods</label>
            <div className="flex flex-wrap gap-1.5">
              {MOODS.map((m) => {
                const on = (v.moods || '').split(',').includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    className={cx('chip cursor-pointer', on && 'chip-on')}
                    onClick={() => {
                      const cur = (v.moods || '').split(',').filter(Boolean);
                      onChange({ ...v, moods: (on ? cur.filter((x: string) => x !== m.id) : [...cur, m.id]).join(',') });
                    }}
                  >
                    {m.emoji} {m.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Minutes</label>
              <input className="field" type="number" value={v.time_min ?? 30} onChange={(e) => onChange({ ...v, time_min: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">Serves</label>
              <input className="field" type="number" value={v.servings ?? 4} onChange={(e) => onChange({ ...v, servings: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">Level</label>
              <select className="field" value={v.difficulty || 'easy'} onChange={(e) => onChange({ ...v, difficulty: e.target.value })}>
                <option value="easy">easy</option>
                <option value="medium">medium</option>
              </select>
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Photo (URL, or upload)</label>
            <div className="flex gap-2">
              <input className="field flex-1" placeholder="/images/… or https://…" value={v.image?.startsWith('data:') ? '(uploaded image stored)' : v.image || ''} onChange={(e) => onChange({ ...v, image: e.target.value })} />
              <label className="btn-ghost !px-3.5 !py-2 !text-xs cursor-pointer">
                <Upload size={13} /> {imgBusy ? '…' : 'upload'}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
              </label>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="label !mb-0">Ingredients</label>
            <button type="button" className="text-xs font-bold text-terra hover:underline" onClick={() => onChange({ ...v, ingredients: [...(v.ingredients || []), { item: '', amount: '', note: '' }] })}>
              + add ingredient
            </button>
          </div>
          <div className="space-y-2">
            {(v.ingredients || []).map((ing: any, i: number) => (
              <div key={i} className="grid grid-cols-[1fr_110px_1fr_28px] gap-2">
                <input className="field !py-2 text-sm" placeholder="ingredient" value={ing.item || ''} onChange={(e) => setIng(i, 'item', e.target.value)} />
                <input className="field !py-2 text-sm" placeholder="amount" value={ing.amount || ''} onChange={(e) => setIng(i, 'amount', e.target.value)} />
                <input className="field !py-2 text-sm" placeholder="tip (optional)" value={ing.note || ''} onChange={(e) => setIng(i, 'note', e.target.value)} />
                <button type="button" className="text-ink-soft hover:text-terra" onClick={() => onChange({ ...v, ingredients: (v.ingredients || []).filter((_: any, x: number) => x !== i) })}>✕</button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="label !mb-0">Steps</label>
            <button type="button" className="text-xs font-bold text-terra hover:underline" onClick={() => onChange({ ...v, steps: [...(v.steps || []), ''] })}>
              + add step
            </button>
          </div>
          <div className="space-y-2">
            {(v.steps || []).map((s: string, i: number) => (
              <div key={i} className="flex gap-2">
                <span className="mt-2.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-paper2 font-display text-xs font-bold text-terra">{i + 1}</span>
                <textarea className="field flex-1 !py-2 text-sm" rows={2} value={s} onChange={(e) => setStep(i, e.target.value)} placeholder="What happens in this step — specific, with amounts and cues." />
                <button type="button" className="self-start mt-2 text-ink-soft hover:text-terra" onClick={() => onChange({ ...v, steps: (v.steps || []).filter((_: string, x: number) => x !== i) })}>✕</button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">SEO title (optional)</label>
            <input className="field text-sm" value={v.seo_title || ''} onChange={(e) => onChange({ ...v, seo_title: e.target.value })} />
          </div>
          <div>
            <label className="label">SEO description (optional)</label>
            <input className="field text-sm" value={v.seo_description || ''} onChange={(e) => onChange({ ...v, seo_description: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2 border-t border-line pt-4">
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn-warm" onClick={onSave} disabled={!v.title?.trim()}>
          {v.status === 'published' ? 'Save & keep published' : v.id ? 'Save changes' : 'Save as draft'}
        </button>
      </div>
    </Modal>
  );
}

/* ─────────────────────────── STORIES ─────────────────────────── */

function StoriesTab() {
  const { data, loading, reload } = useApi<any[]>('/api/admin/stories');
  const [editing, setEditing] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const blank = { title: '', excerpt: '', body: '', tag: 'notes', status: 'draft', seo_title: '', seo_description: '' };

  const save = async () => {
    if (!editing?.title?.trim()) return;
    if (editing.id) await patch(`/api/admin/stories/${editing.id}`, editing);
    else await post('/api/admin/stories', editing);
    setOpen(false);
    setEditing(null);
    void reload();
  };
  const togglePublish = async (s: any) => {
    await post(`/api/admin/stories/${s.id}/publish`);
    void reload();
  };
  const remove = async (s: any) => {
    if (!confirm(`Delete "${s.title}"?`)) return;
    await del(`/api/admin/stories/${s.id}`);
    void reload();
  };

  if (loading || !data) return <Spinner label="opening the notebook…" />;

  return (
    <div>
      <SectionTitle
        kicker="notes from the counter"
        title="Stories"
        sub="The journal — honest notes, not a blog. Markdown is welcome (## headings, - lists, **bold**)."
        right={
          <button className="btn-warm !px-4 !py-2.5 !text-xs" onClick={() => { setEditing(blank); setOpen(true); }}>
            <Plus size={14} /> New note
          </button>
        }
      />
      <div className="space-y-3">
        {data.length === 0 && (
          <Card><p className="font-hand text-xl text-ink-soft">no notes yet — the notebook is waiting for its first line.</p></Card>
        )}
        {data.map((s) => (
          <Card key={s.id} className="!p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-semibold">{s.title}</h3>
                  <span className={cx('rounded-full px-2.5 py-0.5 text-[11px] font-bold', s.status === 'published' ? 'bg-sage/15 text-sage-deep' : 'bg-paper2 text-ink-soft')}>{s.status}</span>
                  <span className="chip !py-0.5 !text-[11px]">{s.tag}</span>
                </div>
                <p className="mt-1 truncate text-xs text-ink-soft">{s.excerpt} · added {fmtDate(s.created_at)}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {s.status === 'published' && (
                  <Link href={`/journal/${s.slug}`} className="btn-ghost !px-3.5 !py-2 !text-xs"><Eye size={13} /> View</Link>
                )}
                <button className={s.status === 'published' ? 'btn-ghost !px-3.5 !py-2 !text-xs' : 'btn-warm !px-3.5 !py-2 !text-xs'} onClick={() => togglePublish(s)}>
                  {s.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>
                <button className="btn-ghost !px-3 !py-2 !text-xs" onClick={() => { setEditing(s); setOpen(true); }}><Pencil size={13} /></button>
                <button className="btn-ghost !px-3 !py-2 !text-xs hover:!border-terra hover:!text-terra" onClick={() => remove(s)}><Trash2 size={13} /></button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => { setOpen(false); setEditing(null); }} title={editing?.id ? `Edit — ${editing.title}` : 'New note'} wide>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <div>
            <label className="label">Title</label>
            <input className="field" value={editing?.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Excerpt (the hook)</label>
            <textarea className="field" rows={2} value={editing?.excerpt || ''} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} />
          </div>
          <div>
            <label className="label">The note (markdown)</label>
            <textarea className="field font-mono !text-[13px]" rows={14} value={editing?.body || ''} onChange={(e) => setEditing({ ...editing, body: e.target.value })} placeholder={'### A small heading\n\nWrite like a notebook, not a blog…'} />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2 border-t border-line pt-4">
          <button className="btn-ghost" onClick={() => { setOpen(false); setEditing(null); }}>Cancel</button>
          <button className="btn-warm" onClick={save} disabled={!editing?.title?.trim()}>{editing?.id ? 'Save changes' : 'Save as draft'}</button>
        </div>
      </Modal>
    </div>
  );
}
