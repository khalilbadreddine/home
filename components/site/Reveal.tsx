'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function Reveal({
  children,
  className = '',
  delay = 0,
  y = 28,
  once = true,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const tween = gsap.fromTo(
      el,
      { y, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 0.9,
        delay,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once },
      }
    );
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [delay, y, once]);

  return (
    <div ref={ref} className={className} style={{ visibility: 'hidden' }}>
      {children}
    </div>
  );
}

/** Masked line reveal for display headings (server-side pre-split lines). */
export function LineReveal({ lines, className = '', stagger = 0.09 }: { lines: string[]; className?: string; stagger?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const words = el.querySelectorAll('[data-word]');
    gsap.fromTo(
      words,
      { yPercent: 110 },
      { yPercent: 0, duration: 0.9, stagger, ease: 'power4.out', delay: 0.15 }
    );
  }, [stagger]);
  return (
    <div ref={ref} className={className}>
      {lines.map((line, li) => (
        <span key={li} className="block overflow-hidden pb-1">
          {line.split(' ').map((w, wi) => (
            <span key={wi} className="inline-block overflow-hidden pb-1 align-bottom">
              <span data-word className="inline-block will-change-transform">
                {w}
                {wi < line.split(' ').length - 1 ? '\u00A0' : ''}
              </span>
            </span>
          ))}
        </span>
      ))}
    </div>
  );
}
