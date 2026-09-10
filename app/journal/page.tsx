import Link from 'next/link';
import { Reveal } from '@/components/site/Reveal';
import * as repo from '@/lib/db/repo';
import { fmtDate, readTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'The Journal — notes from the counter' };

export default async function JournalPage() {
  const stories = await repo.listStories({ status: 'published', limit: 50 });
  return (
    <div className="pt-32 sm:pt-36">
      <div className="container-site">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="kicker">notes from the counter</p>
          <h1 className="h-display mt-3 text-4xl sm:text-5xl">The Journal</h1>
          <p className="section-sub mx-auto mt-4">
            Not a blog — a notebook. Why the recipes are the way they are, what went wrong,
            and the small things that make a kitchen feel like home.
          </p>
        </Reveal>

        <div className="mx-auto mt-14 max-w-2xl">
          {stories.length === 0 && (
            <div className="paper-card p-10 text-center">
              <p className="text-3xl">📓</p>
              <p className="mt-3 font-display text-2xl font-semibold">The notebook is still being written</p>
              <p className="mt-2 text-sm text-ink-soft">The first note is on its way — follow on Pinterest so you catch it.</p>
            </div>
          )}
          <div className="space-y-6">
            {stories.map((s, i) => (
              <Reveal key={s.id} delay={Math.min(i * 0.06, 0.3)}>
                <Link href={`/journal/${s.slug}`} className="paper-card group relative block p-7 transition-shadow hover:shadow-paper-lift">
                  <span className="absolute left-7 top-8 h-2.5 w-2.5 rounded-full bg-terra-soft/80 transition-transform group-hover:scale-125" />
                  <div className="flex flex-wrap items-center gap-2 pl-6 text-xs font-bold text-ink-soft">
                    <span className="rounded-full bg-paper2 px-2.5 py-1">{s.tag}</span>
                    <span>{fmtDate(s.published_at)}</span>
                    <span className="opacity-60">·</span>
                    <span>{readTime(s.body || '')}</span>
                  </div>
                  <h2 className="mt-3 pl-6 font-display text-2xl font-semibold leading-snug group-hover:text-terra transition-colors">
                    {s.title}
                  </h2>
                  <p className="mt-2 pl-6 text-sm leading-relaxed text-ink-soft">{s.excerpt}</p>
                  <p className="mt-4 pl-6 font-hand text-lg text-terra">read the note →</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
