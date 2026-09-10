'use client';
import { useState } from 'react';
import { Check, EyeOff, Trash2 } from 'lucide-react';
import { Card, SectionTitle, Spinner, del, fmtDate, patch, useApi } from './ui';
import { cx } from '@/lib/utils';

type Filter = 'all' | 'visible' | 'hidden';

export function CircleTab() {
  const { data, loading, reload } = useApi<{ counts: any[]; all: any[] }>('/api/admin/comments');
  const [filter, setFilter] = useState<Filter>('all');

  const setStatus = async (id: number, status: string) => {
    await patch(`/api/admin/comments/${id}`, { status });
    void reload();
  };
  const remove = async (id: number) => {
    if (!confirm('Delete this note for good?')) return;
    await del(`/api/admin/comments/${id}`);
    void reload();
  };

  if (loading || !data) return <Spinner label="reading the wall…" />;

  const hiddenCount = data.counts.find((c: any) => c.status === 'hidden')?.n ?? 0;
  const visible = data.all.filter((c: any) => (filter === 'all' ? true : c.status === filter));

  return (
    <div>
      <SectionTitle
        kicker="gentle moderation"
        title="The Circle"
        sub="Notes pass automatically unless the kind-words filter catches something — those wait here for you. Links and handles are kept out of comments on purpose."
        right={
          <div className="flex gap-1.5">
            {(['all', 'visible', 'hidden'] as Filter[]).map((f) => (
              <button key={f} className={cx('chip cursor-pointer capitalize', filter === f && 'chip-on')} onClick={() => setFilter(f)}>
                {f}{f === 'hidden' && hiddenCount ? ` (${hiddenCount})` : ''}
              </button>
            ))}
          </div>
        }
      />

      <div className="space-y-3">
        {visible.length === 0 && (
          <Card><p className="font-hand text-xl text-ink-soft">nothing here — the wall is quiet and kind.</p></Card>
        )}
        {visible.map((c: any) => (
          <Card key={c.id} className={cx('!p-4', c.status === 'hidden' && '!border-terra/40')}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-terra-soft/60 font-hand text-terra-deep">
                  {c.name.slice(0, 1).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-bold">{c.name}</p>
                  <p className="text-[11px] text-ink-soft">
                    {fmtDate(c.created_at)}
                    {(c.recipe_title || c.story_title) && <> · under <span className="text-terra">{c.recipe_title || c.story_title}</span></>}
                    {c.status === 'hidden' && <> · <span className="font-bold text-terra">held by the filter</span></>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {c.status !== 'visible' && (
                  <button className="btn-ghost !px-3 !py-2 !text-xs" onClick={() => setStatus(c.id, 'visible')}>
                    <Check size={13} /> Approve
                  </button>
                )}
                {c.status !== 'hidden' && (
                  <button className="btn-ghost !px-3 !py-2 !text-xs" onClick={() => setStatus(c.id, 'hidden')}>
                    <EyeOff size={13} /> Hide
                  </button>
                )}
                <button className="btn-ghost !px-3 !py-2 !text-xs hover:!border-terra hover:!text-terra" onClick={() => remove(c.id)}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <p className="mt-3 rounded-xl bg-paper2/50 p-3 text-sm leading-relaxed text-ink-soft">{c.message}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
