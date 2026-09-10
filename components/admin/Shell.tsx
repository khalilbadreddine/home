'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import {
  BookOpen, CalendarCheck, Flame, LayoutDashboard, Mail, Newspaper,
  Sparkles, Wrench, X,
} from 'lucide-react';
import { Card, SectionTitle, Spinner, StatusPill, post } from './ui';
import { Overview } from './Overview';
import { Content } from './Content';
import { CircleTab } from './CircleTab';
import { NewsletterTab } from './NewsletterTab';
import { Automation } from './Automation';
import { SettingsTab } from './SettingsTab';
import { cx } from '@/lib/utils';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'recipes', label: 'Recipes', icon: BookOpen },
  { id: 'stories', label: 'Stories', icon: Newspaper },
  { id: 'circle', label: 'The Circle', icon: CalendarCheck },
  { id: 'newsletter', label: 'Newsletter', icon: Mail },
  { id: 'automation', label: 'Automation', icon: Sparkles },
  { id: 'settings', label: 'Settings', icon: Wrench },
];

export function AdminShell({ userEmail }: { userEmail: string }) {
  const [tab, setTab] = useState('overview');
  const [health, setHealth] = useState<any>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');

  useEffect(() => {
    fetch('/api/health').then((r) => r.json()).then(setHealth).catch(() => {});
  }, []);

  const seed = async () => {
    setSeeding(true);
    setSeedMsg('');
    try {
      const res = await post('/api/admin/seed');
      const d = await res.json();
      setSeedMsg(d.added ? `Starter kitchen set — ${d.added} items added.` : 'Kitchen already has content — nothing to add.');
    } catch {
      setSeedMsg('Could not seed right now — try again.');
    } finally {
      setSeeding(false);
    }
  };

  const dbOk = health?.db?.ok;
  const aiOk = health?.ai?.ok;
  const googleOk = health?.google;
  const hasContent = health !== null; // (checked inside Overview via its own fetch)

  return (
    <div className="min-h-screen pb-24">
      {/* admin topbar */}
      <div className="sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-3">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-terra text-white">
              <Flame size={16} strokeWidth={2.5} />
            </span>
            <div>
              <p className="font-display text-base font-semibold leading-tight">The Stove</p>
              <p className="text-[11px] leading-tight text-ink-soft">{userEmail}</p>
            </div>
          </Link>
          <div className="hidden items-center gap-2 md:flex">
            <StatusPill ok={!!dbOk} label={dbOk ? `DB · ${health?.db?.kind}` : 'DB · offline'} />
            <StatusPill ok={!!aiOk} label={aiOk ? `AI · ${health?.ai?.model}` : 'AI · off'} />
            <StatusPill ok={!!googleOk} label={googleOk ? 'Google · on' : 'Google · off'} />
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="btn-ghost !px-4 !py-2 text-xs">View site</Link>
            <button className="btn-ghost !px-4 !py-2 text-xs" onClick={() => signOut({ callbackUrl: '/' })}>
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1200px] gap-8 px-5 pt-8 lg:grid-cols-[220px_1fr]">
        {/* sidebar */}
        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cx(
                  'flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-all',
                  tab === t.id ? 'bg-terra text-white shadow-glow' : 'text-ink-soft hover:bg-paper2 hover:text-ink'
                )}
              >
                <Icon size={15} /> {t.label}
              </button>
            );
          })}
        </nav>

        {/* content */}
        <div className="min-w-0">
          {/* onboarding strip */}
          <Card className="mb-6 !p-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="font-hand text-xl text-terra">welcome back, keeper of the kitchen</p>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                {!aiOk && (
                  <button className="chip cursor-pointer hover:border-terra" onClick={() => setTab('settings')}>
                    🔌 connect Ollama →
                  </button>
                )}
                <button className={cx('chip cursor-pointer hover:border-terra', hasContent && 'opacity-70')} onClick={seed} disabled={seeding}>
                  {seeding ? 'setting the table…' : '✨ set the starter table'}
                </button>
              </div>
              {seedMsg && <p className="w-full text-xs font-bold text-sage-deep">{seedMsg}</p>}
            </div>
          </Card>

          {tab === 'overview' && <Overview goTo={setTab} />}
          {tab === 'recipes' && <Content />}
          {tab === 'stories' && <Content storiesOnly />}
          {tab === 'circle' && <CircleTab />}
          {tab === 'newsletter' && <NewsletterTab />}
          {tab === 'automation' && <Automation />}
          {tab === 'settings' && <SettingsTab />}
        </div>
      </div>
    </div>
  );
}
