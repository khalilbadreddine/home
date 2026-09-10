import Link from 'next/link';
import { Flame, Instagram, Mail, MapPin } from 'lucide-react';
import * as repo from '@/lib/db/repo';

export const dynamic = 'force-dynamic';

export async function Footer() {
  let s: Record<string, string> = {};
  try {
    s = await repo.getSettings();
  } catch {}
  const name = s.site_name || 'TherecipeSeeker';
  const rules = (s.circle_rules || '').split('\n').filter(Boolean);

  return (
    <footer className="note-band mt-24">
      <div className="container-site grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-terra text-white">
              <Flame size={17} strokeWidth={2.5} />
            </span>
            <span className="font-display text-lg font-semibold">{name}</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-soft">
            {s.tagline || 'A kitchen on the internet, for you.'} Recipes with a why before the how, and a circle
            that leaves the world at the door.
          </p>
          <p className="kicker mt-5">{s.followers_note || ''}</p>
          <div className="mt-5 flex gap-2">
            {s.pinterest_url && (
              <a href={s.pinterest_url} target="_blank" rel="noreferrer" className="btn-ghost !px-4 !py-2 text-xs" title="Pinterest">
                📌 Pinterest
              </a>
            )}
            {s.instagram_url && (
              <a href={s.instagram_url} target="_blank" rel="noreferrer" className="btn-ghost !px-4 !py-2 text-xs" title="Instagram">
                <Instagram size={13} /> Instagram
              </a>
            )}
          </div>
        </div>

        <div>
          <p className="label">Wander</p>
          <ul className="space-y-2.5 text-sm font-bold text-ink-soft">
            <li><Link className="hover:text-terra" href="/">Tonight</Link></li>
            <li><Link className="hover:text-terra" href="/pantry">My Pantry</Link></li>
            <li><Link className="hover:text-terra" href="/journal">Journal</Link></li>
            <li><Link className="hover:text-terra" href="/circle">The Circle</Link></li>
            <li><Link className="hover:text-terra" href="/about">The Seeker</Link></li>
            <li><Link className="hover:text-terra" href="/admin">The Stove (admin)</Link></li>
          </ul>
        </div>

        <div>
          <p className="label">House rules</p>
          <ul className="space-y-2 text-sm leading-relaxed text-ink-soft">
            {rules.slice(0, 4).map((r, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-terra">✳</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-line/60 py-5">
        <div className="container-site flex flex-wrap items-center justify-between gap-2 text-xs text-ink-soft">
          <span className="flex items-center gap-1.5">
            <MapPin size={12} /> made at home, one recipe at a time
          </span>
          <span className="font-hand text-base text-terra">the kettle is always on ☕</span>
        </div>
      </div>
    </footer>
  );
}
