import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles, Users } from 'lucide-react';
import { AmbientKitchen } from '@/components/site/AmbientKitchen';
import { HeroKicker } from '@/components/site/HeroKicker';
import { TonightAndBoard } from '@/components/site/TonightAndBoard';
import { NewsletterForm } from '@/components/site/NewsletterForm';
import { Reveal, LineReveal } from '@/components/site/Reveal';
import * as repo from '@/lib/db/repo';
import { fmtDate, readTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [s, recipes, stories] = await Promise.all([
    repo.getSettings(),
    repo.listRecipes({ status: 'published', limit: 60 }),
    repo.listStories({ status: 'published', limit: 3 }),
  ]);
  const heroTitle = s.hero_title || 'Tonight, let’s make something kind to yourself.';
  const rules = (s.circle_rules || '').split('\n').filter(Boolean);

  return (
    <>
      {/* ── HERO ─────────────────────────────────── */}
      <section className="relative overflow-hidden pt-36 pb-20 sm:pt-44">
        {/* warm light wash */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_20%_10%,var(--glow),transparent_70%)]" />
        <AmbientKitchen />
        <div className="container-site relative">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <HeroKicker>a kitchen on the internet, for you</HeroKicker>
              <h1 className="h-display mt-4 text-4xl sm:text-6xl lg:text-[4.2rem] text-balance">
                <LineReveal lines={heroTitle.split('\n').length > 1 ? heroTitle.split('\n') : splitLines(heroTitle)} />
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
                {s.hero_sub ||
                  'Real recipes with a why before the how, a pantry that cooks with what you already have, and a circle of women who leave the world at the door.'}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a href="#board" className="btn-warm">
                  See tonight’s board <ArrowRight size={15} />
                </a>
                <Link href="/pantry" className="btn-ghost">
                  <Sparkles size={15} className="text-terra" /> What’s in my fridge?
                </Link>
              </div>
              {s.followers_note && (
                <p className="mt-6 font-hand text-xl text-ink-soft">📌 {s.followers_note}</p>
              )}
            </div>

            <div className="relative hidden lg:block">
              <div className="relative mx-auto max-w-sm">
                <Image
                  src="/images/hero-kitchen.jpg"
                  alt="A warm kitchen counter in morning light"
                  width={720}
                  height={900}
                  className="rounded-2xl border-8 border-card shadow-paper-lift"
                  style={{ transform: 'rotate(2deg)' }}
                />
                <div className="paper-card absolute -bottom-8 -left-10 max-w-[240px] p-4" style={{ transform: 'rotate(-3deg)' }}>
                  <p className="font-hand text-xl leading-snug text-ink">
                    “the soup made a house smell like home.”
                  </p>
                  <p className="mt-1 text-xs font-bold text-ink-soft">— a note from The Circle</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TONIGHT RITUAL + PINBOARD ────────────── */}
      <TonightAndBoard recipes={recipes} />

      {/* ── PANTRY BAND ──────────────────────────── */}
      <section className="note-band py-20">
        <div className="container-site">
          <Reveal>
            <div className="paper-card mx-auto grid max-w-4xl gap-8 p-8 sm:p-12 md:grid-cols-2 md:items-center">
              <div>
                <p className="kicker">the pantry trick</p>
                <h2 className="section-title mt-2 text-3xl">“What’s in my fridge?”</h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft sm:text-base">
                  Type what you already have — even just three things. The Seeker matches them to recipes
                  and ranks them by what you can actually make <em>tonight</em>, plus a small suggestion
                  from the kitchen AI if you have one running at home.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {['chicken', 'lemons', 'potatoes', 'eggs', 'tomatoes', 'butter', 'rice', 'basil'].map((i) => (
                    <span key={i} className="chip">try: {i}</span>
                  ))}
                </div>
                <Link href="/pantry" className="btn-warm mt-7">
                  Cook with what I have <ArrowRight size={15} />
                </Link>
              </div>
              <div className="flex justify-center">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { img: '/images/recipes/lemon-chicken.jpg', t: 'matched: lemon chicken' },
                    { img: '/images/recipes/tomato-soup.jpg', t: 'matched: tomato soup' },
                  ].map((x, i) => (
                    <div key={i} className={`pin-card w-36 ${i ? 'mt-6' : ''}`}>
                      <Image src={x.img} alt={x.t} width={200} height={150} className="aspect-[4/3] w-full rounded-t-[11px] object-cover" />
                      <p className="p-2 text-center font-hand text-sm text-ink-soft">{x.t}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── JOURNAL TEASER ───────────────────────── */}
      <section className="py-20">
        <div className="container-site">
          <Reveal className="mb-10 flex items-end justify-between">
            <div>
              <p className="kicker">notes from the counter</p>
              <h2 className="section-title mt-2">The Journal</h2>
            </div>
            <Link href="/journal" className="link-warm text-sm">all notes →</Link>
          </Reveal>
          {stories.length ? (
            <div className="grid gap-6 md:grid-cols-3">
              {stories.map((st, i) => (
                <Reveal key={st.id} delay={i * 0.08}>
                  <Link href={`/journal/${st.slug}`} className="paper-card group block h-full p-6 transition-shadow hover:shadow-paper-lift">
                    <div className="flex items-center gap-2 text-xs font-bold text-ink-soft">
                      <span className="rounded-full bg-paper2 px-2.5 py-1">{st.tag}</span>
                      <span>{fmtDate(st.published_at)}</span>
                    </div>
                    <h3 className="mt-3 font-display text-xl font-semibold leading-snug group-hover:text-terra transition-colors">
                      {st.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">{st.excerpt}</p>
                    <p className="mt-4 font-hand text-base text-terra">{readTime(st.body || '')} →</p>
                  </Link>
                </Reveal>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-soft">The journal is being written — the first note is on its way.</p>
          )}
        </div>
      </section>

      {/* ── CIRCLE TEASER ────────────────────────── */}
      <section className="note-band py-20">
        <div className="container-site">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <Reveal>
              <div className="relative">
                <Image
                  src="/images/seeker.jpg"
                  alt="Hands holding a handwritten recipe card"
                  width={720}
                  height={900}
                  className="rounded-2xl border-8 border-card shadow-paper-lift"
                  style={{ transform: 'rotate(-2deg)' }}
                />
                <span className="pin-tape !left-6" />
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="kicker">a quiet corner</p>
              <h2 className="section-title mt-2">The Circle</h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-soft sm:text-base">
                A place to leave a note under a recipe — how it went, what you changed, what surprised you.
                Women cook here. The internet does not. The house rules are short and kind:
              </p>
              <ul className="mt-5 space-y-2.5">
                {rules.slice(0, 4).map((r, i) => (
                  <li key={i} className="flex gap-2.5 text-sm">
                    <span className="mt-0.5 text-terra">✳</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
              <Link href="/circle" className="btn-ghost mt-7">
                <Users size={15} className="text-terra" /> Step into the Circle
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ───────────────────────────── */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(70%_80%_at_50%_100%,var(--glow),transparent_70%)]" />
        <div className="container-site text-center">
          <Reveal>
            <p className="kicker">every sunday, 5 minutes</p>
            <h2 className="section-title mt-2">The Sunday Spoon</h2>
            <p className="section-sub mx-auto">
              One short letter: the weekend’s recipes and exactly why, one honest kitchen mistake,
              and one line that makes you feel seen. Read it out loud — it’s written to be.
            </p>
            <div className="mt-8">
              <NewsletterForm />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

/** split a long title into 2-3 balanced lines for the masked reveal */
function splitLines(title: string): string[] {
  const words = title.split(' ');
  if (words.length <= 6) return [title];
  const third = Math.ceil(words.length / 3);
  return [words.slice(0, third).join(' '), words.slice(third, third * 2).join(' '), words.slice(third * 2).join(' ')].filter(Boolean);
}
