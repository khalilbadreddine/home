'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function HeroKicker({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.fromTo(el, { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, delay: 0.1, ease: 'power3.out' });
  }, []);
  return (
    <p ref={ref} className="kicker" style={{ opacity: 0 }}>
      {children}
    </p>
  );
}
