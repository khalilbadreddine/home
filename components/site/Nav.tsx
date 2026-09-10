'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Flame, Menu, Moon, X } from 'lucide-react';
import { useSite } from './SiteProvider';
import { cx } from '@/lib/utils';

const LINKS = [
  { href: '/', label: 'Tonight' },
  { href: '/pantry', label: 'My Pantry' },
  { href: '/journal', label: 'Journal' },
  { href: '/circle', label: 'The Circle' },
  { href: '/about', label: 'The Seeker' },
];

export function Nav() {
  const pathname = usePathname();
  const { siteName, evening, setEvening, eveningNudgeDismissed, dismissEveningNudge } = useSite();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [nudge, setNudge] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = barRef.current;
    if (el) {
      gsap.fromTo(el, { y: -64, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, ease: 'power3.out' });
    }
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // evening light nudge (once, if it's after 6pm and user hasn't chosen)
  useEffect(() => {
    try {
      const chosen = localStorage.getItem('seeker-evening');
      const h = new Date().getHours();
      if (chosen === null && (h >= 18 || h < 5) && !eveningNudgeDismissed) {
        const t = setTimeout(() => setNudge(true), 4000);
        return () => clearTimeout(t);
      }
    } catch {}
  }, [eveningNudgeDismissed]);

  return (
    <>
      <div ref={barRef} className={cx('fixed inset-x-0 top-0 z-50 transition-all duration-500', scrolled ? 'py-2' : 'py-4')}>
        <div className={cx('container-site flex items-center justify-between rounded-2xl px-4 sm:px-6 py-3 transition-all duration-500', scrolled ? 'paper-card' : 'bg-transparent border border-transparent')}>
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-terra text-white shadow-glow transition-transform duration-500 group-hover:rotate-12">
              <Flame size={17} strokeWidth={2.5} />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">
              {siteName.replace('therecipeseeker', 'TherecipeSeeker')}
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => {
              const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cx(
                    'relative rounded-full px-3.5 py-2 text-sm font-bold transition-colors',
                    active ? 'text-terra' : 'text-ink-soft hover:text-ink'
                  )}
                >
                  {l.label}
                  <span
                    className={cx(
                      'absolute inset-x-3.5 -bottom-0.5 h-0.5 rounded-full bg-terra transition-all duration-300',
                      active ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setEvening(!evening)}
              title={evening ? 'Daytime lights' : 'Evening lights'}
              className={cx(
                'grid h-9 w-9 place-items-center rounded-full border transition-all duration-300',
                evening
                  ? 'border-butter/60 bg-butter/15 text-butter shadow-glow'
                  : 'border-line text-ink-soft hover:border-terra hover:text-terra'
              )}
            >
              {evening ? <Moon size={15} /> : <Moon size={15} className="opacity-50" />}
            </button>
            <Link href="/admin" className="btn-ghost hidden !px-4 !py-2 text-xs sm:inline-flex">
              The Stove <span className="opacity-60">(admin)</span>
            </Link>
            <button className="grid h-9 w-9 place-items-center rounded-full border border-line md:hidden" onClick={() => setOpen(!open)}>
              {open ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* mobile menu */}
      <div
        className={cx(
          'fixed inset-0 z-40 transition-all duration-400 md:hidden',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <div className="absolute inset-x-3 top-20 rounded-2xl paper-card p-4">
          {LINKS.map((l, i) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-4 py-3 font-display text-xl font-medium hover:bg-paper2"
            >
              {l.label}
            </Link>
          ))}
          <Link href="/admin" onClick={() => setOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-bold text-terra">
            The Stove (admin) →
          </Link>
        </div>
      </div>

      {/* evening lights nudge */}
      {nudge && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2">
          <div className="paper-card flex items-center gap-3 rounded-full py-2.5 pl-4 pr-2 shadow-paper-lift">
            <span className="text-lg">🕯️</span>
            <p className="text-sm font-medium">It&apos;s past six — want the evening lights on?</p>
            <button className="btn-warm !px-4 !py-2 !text-xs" onClick={() => { setEvening(true); setNudge(false); }}>
              Light them
            </button>
            <button className="btn-ghost !px-3 !py-2 !text-xs" onClick={() => { setEvening(false); setNudge(false); dismissEveningNudge(); }}>
              Not yet
            </button>
          </div>
        </div>
      )}
    </>
  );
}
