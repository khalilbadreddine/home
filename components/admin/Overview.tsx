'use client';
import Link from 'next/link';
import { ArrowRight, Eye, Flame, Heart, Mail, Pencil, Sparkles } from 'lucide-react';
import { Card, SectionTitle, Spinner, useApi, fmtDate, statusColor } from './ui';

export function Overview({ goTo }: { goTo: (t: string) => void }) {
  const { data, loading } = useApi('/api/admin/overview');

  if (loading || !data) return <Spinner label="warming up the stove…" />;
  const { stats, latestJobs } = data;

  const tiles = [
    { label: 'Published recipes', value: stats.published, icon: Pencil, tab: 'recipes', color: 'text-terra' },
    { label: 'Viewed on the site', value: stats.views, icon: Eye, tab: 'recipes', color: 'text-sage-deep' },
    { label: 'Served at home', value: stats.served, icon: Flame, tab: 'recipes', color: 'text-butter' },
    { label: 'Circle notes', value: stats.comments, icon: Heart, tab: 'circle', color: 'text-blush' },
    { label: 'Subscribers', value: stats.subscribers, icon: Mail, tab: 'newsletter', color: 'text-terra-deep' },
    { label: 'Automations run', value: stats.jobsDone, icon: Sparkles, tab: 'automation', color: 'text-sage-deep' },
  ];

  return (
    <div>
      <SectionTitle kicker="the whole kitchen at a glance" title="Overview" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.label} onClick={() => goTo(t.tab)} className="paper-card group p-5 text-left transition-shadow hover:shadow-paper-lift">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">{t.label}</p>
                <Icon size={15} className={t.color} />
              </div>
              <p className="mt-2 font-display text-3xl font-semibold">{t.value}</p>
              <p className="mt-1 text-[11px] font-bold text-ink-soft opacity-0 transition-opacity group-hover:opacity-100">open →</p>
            </button>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Latest automation activity</h2>
            <button className="text-xs font-bold text-terra hover:underline" onClick={() => goTo('automation')}>
              control center →
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {latestJobs.length === 0 && (
              <p className="font-hand text-lg text-ink-soft">
                nothing has run yet — your pre-built workflows are waiting in <span className="text-terra">Automation</span>.
              </p>
            )}
            {latestJobs.slice(0, 6).map((j: any) => (
              <div key={j.id} className="flex items-center justify-between rounded-xl border border-line bg-paper2/40 px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{j.name}</p>
                  <p className="text-[11px] text-ink-soft">{fmtDate(j.created_at)}</p>
                </div>
                <span className={`ml-3 shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${statusColor(j.status)}`}>{j.status}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-lg font-semibold">From the front door</h2>
          <div className="mt-4 space-y-3 text-sm">
            <Link href="/recipes" className="flex items-center justify-between rounded-xl border border-line px-4 py-3 hover:border-terra">
              <span className="font-bold">Tonight’s board</span>
              <ArrowRight size={14} className="text-terra" />
            </Link>
            <Link href="/pantry" className="flex items-center justify-between rounded-xl border border-line px-4 py-3 hover:border-terra">
              <span className="font-bold">The pantry matcher</span>
              <ArrowRight size={14} className="text-terra" />
            </Link>
            <Link href="/circle" className="flex items-center justify-between rounded-xl border border-line px-4 py-3 hover:border-terra">
              <span className="font-bold">The Circle wall</span>
              <ArrowRight size={14} className="text-terra" />
            </Link>
            <p className="font-hand text-base text-ink-soft pt-1">
              {stats.published === 0 ? 'your first recipe will appear on the board the moment you publish it.' : 'everything you publish appears here immediately — no deploys.'}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
