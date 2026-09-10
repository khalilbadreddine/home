'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface SiteCtx {
  siteName: string;
  evening: boolean;
  setEvening: (v: boolean) => void;
  /** true when we've decided to nudge the user about evening lights */
  eveningNudgeDismissed: boolean;
  dismissEveningNudge: () => void;
}

const Ctx = createContext<SiteCtx>({
  siteName: 'TherecipeSeeker',
  evening: false,
  setEvening: () => {},
  eveningNudgeDismissed: false,
  dismissEveningNudge: () => {},
});

export function useSite() {
  return useContext(Ctx);
}

export function SiteProvider({ children, siteName }: { children: React.ReactNode; siteName: string }) {
  const [evening, setEveningState] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('seeker-evening');
      if (saved === '1') {
        setEveningState(true);
        document.documentElement.classList.add('evening');
      } else if (saved === '0') {
        setEveningState(false);
      } else {
        // unset: follow the clock — after 6pm the kitchen dims
        const h = new Date().getHours();
        if (h >= 18 || h < 5) {
          setEveningState(true);
          document.documentElement.classList.add('evening');
        }
      }
    } catch {}
    setReady(true);
  }, []);

  const setEvening = useCallback((v: boolean) => {
    setEveningState(v);
    document.documentElement.classList.toggle('evening', v);
    try {
      localStorage.setItem('seeker-evening', v ? '1' : '0');
    } catch {}
  }, []);

  const dismissNudge = useCallback(() => {
    setNudgeDismissed(true);
    try {
      localStorage.setItem('seeker-evening-nudge', '1');
    } catch {}
  }, []);

  useEffect(() => {
    try {
      if (localStorage.getItem('seeker-evening-nudge') === '1') setNudgeDismissed(true);
    } catch {}
  }, []);

  return (
    <Ctx.Provider value={{ siteName, evening, setEvening, eveningNudgeDismissed: nudgeDismissed, dismissEveningNudge: dismissNudge }}>
      {children}
    </Ctx.Provider>
  );
}
