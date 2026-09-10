import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import * as repo from '@/lib/db/repo';
import { CommentSection } from '@/components/site/CommentSection';
import { RecipeCard } from '@/components/site/RecipeCard';
import { Reveal } from '@/components/site/Reveal';
import { fmtDate, readTime, renderMarkdown } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const s = await repo.getStoryBySlug(params.slug);
  if (!s) return { title: 'Note not found' };
  return { title: s.seo_title || s.title, description: s.seo_description || s.excerpt || undefined };
}

export default async function StoryPage({ params }: { params: { slug: string } }) {
  const story = await repo.getStoryBySlug(params.slug);
  if (!story || story.status === 'draft') notFound();

  const related = (await repo.listRecipes({ status: 'published', limit: 10 })).slice(0, 3);

  return (
    <div className="pt-32 sm:pt-36">
      <article className="container-site max-w-2xl">
        <p className="mb-6 text-sm font-bold text-ink-soft">
          <Link href="/journal" className="hover:text-terra">Journal</Link>
          <span className="mx-2 opacity-50">/</span>
          <span>{story.title}</span>
        </p>
        <Reveal>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-ink-soft">
            <span className="rounded-full bg-paper2 px-2.5 py-1">{story.tag}</span>
            <span>{fmtDate(story.published_at)}</span>
            <span className="opacity-60">·</span>
            <span>{readTime(story.body || '')}</span>
          </div>
          <h1 className="h-display mt-4 text-4xl sm:text-5xl text-balance">{story.title}</h1>
          {story.excerpt && <p className="mt-4 font-hand text-2xl leading-snug text-ink-soft">{story.excerpt}</p>}
        </Reveal>
        <div className="story-body mt-8" dangerouslySetInnerHTML={{ __html: renderMarkdown(story.body || '') }} />
        <CommentSection kind="story" id={story.id} title={story.title} />
      </article>

      {related.length > 0 && (
        <section className="container-site mt-20">
          <Reveal>
            <p className="kicker">put the words into practice</p>
            <h2 className="section-title mt-2">Cook something from the kitchen</h2>
          </Reveal>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r, i) => (
              <Reveal key={r.id} delay={i * 0.08}>
                <RecipeCard recipe={r} index={i} compact />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
