'use client';
import { useState } from 'react';
import { MoodDial } from './MoodDial';
import { PinboardClient } from './PinboardClient';
import { Reveal } from './Reveal';
import type { Row } from '@/lib/db';

/** The "Tonight" ritual + the pinboard, wired together by one shared mood. */
export function TonightAndBoard({ recipes }: { recipes: Row[] }) {
  const [mood, setMood] = useState<string | null>(null);

  return (
    <>
      <section className="note-band py-20" id="tonight">
        <div className="container-site">
          <Reveal className="text-center">
            <p className="kicker">first things first</p>
            <h2 className="section-title mt-2">How is your kitchen tonight?</h2>
            <p className="section-sub mx-auto">
              We don’t decide what to cook — we decide how the kitchen is <em>feeling</em>. Tell the dial,
              and the board below rearranges itself around your evening.
            </p>
          </Reveal>
          <Reveal delay={0.15} className="mt-10">
            <MoodDial active={mood} onSelect={setMood} />
          </Reveal>
        </div>
      </section>

      <section className="py-20" id="board">
        <div className="container-site">
          <Reveal className="mb-10 text-center">
            <p className="kicker">the pinboard</p>
            <h2 className="section-title mt-2">Pinned for you</h2>
            <p className="section-sub mx-auto">
              Every card is a real recipe from this kitchen — note first, method second.
              Pin the ones that feel right; they’re already on our board at 11k.
            </p>
          </Reveal>
          <PinboardClient mood={mood} setMood={setMood} recipes={recipes} />
        </div>
      </section>
    </>
  );
}
