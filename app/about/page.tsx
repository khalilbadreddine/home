import Image from 'next/image';
import Link from 'next/link';
import { Reveal } from '@/components/site/Reveal';
import * as repo from '@/lib/db/repo';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'The Seeker — about this kitchen' };

const VALUES = [
  {
    emoji: '🏠',
    title: 'Home first',
    body: 'Every recipe starts with the feeling of the kitchen, not the technique. If a dish doesn’t make a room feel warmer, it doesn’t go on the board.',
  },
  {
    emoji: '🤝',
    title: 'A safe Circle',
    body: 'The internet can be loud and mean. Here it is quiet and kind. No grades, no critics, no comparison — just cooks passing notes to each other.',
  },
  {
    emoji: '📌',
    title: 'Built for the pin',
    body: 'This kitchen began as a Pinterest board. The 11k of you who follow it are the reason a website now lives around it — so the recipes have a home to come back to.',
  },
  {
    emoji: '✨',
    title: 'Real, not mock',
    body: 'Nothing here is filler. The recipes are real, the notes are honest, and the little kitchen AI runs on models you can run at home. If it’s on the card, it can be cooked.',
  },
];

export default async function AboutPage() {
  const s = await repo.getSettings();

  return (
    <div className="pt-32 sm:pt-36">
      <div className="container-site">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
          <Reveal>
            <p className="kicker">about this kitchen</p>
            <h1 className="h-display mt-3 text-4xl sm:text-5xl">The Seeker</h1>
            <div className="mt-6 space-y-5 text-base leading-relaxed text-ink-soft">
              <p>
                {s.hero_sub ||
                  'TherecipeSeeker is a small corner of the internet that feels like home.'}
              </p>
              <p>
                It started as a Pinterest board of recipes that felt different — not instructions, but
                little notes from someone who already loved you. When the board crossed eleven thousand
                followers, it needed a place to live. So this kitchen was built: a website where the
                recipes, the journal, and the circle can sit under one warm roof.
              </p>
              <p>
                Under the counter, it runs on your own technology — a free database, a free AI you run on
                your own machine, and a control room where the whole kitchen is yours to tend. But up
                top, in the part you’ll actually touch, there’s only a kettle, a dial, and a board of
                good food.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/" className="btn-warm">Come cook tonight</Link>
              <Link href="/journal" className="btn-ghost">Read the journal</Link>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="relative mx-auto max-w-sm">
              <Image
                src="/images/seeker.jpg"
                alt="Hands holding a handwritten recipe card"
                width={720}
                height={900}
                className="rounded-2xl border-8 border-card shadow-paper-lift"
                style={{ transform: 'rotate(2deg)' }}
              />
              <span className="pin-tape !right-8" />
              <div className="paper-card absolute -bottom-6 -left-6 max-w-[220px] p-4" style={{ transform: 'rotate(-3deg)' }}>
                <p className="font-hand text-lg leading-snug">“the kettle is always on.”</p>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="mt-24 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v, i) => (
            <Reveal key={v.title} delay={i * 0.07}>
              <div className="paper-card h-full p-6 transition-shadow hover:shadow-paper-lift">
                <span className="text-3xl">{v.emoji}</span>
                <h3 className="mt-3 font-display text-xl font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{v.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
