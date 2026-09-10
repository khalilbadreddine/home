import Link from 'next/link';
import Image from 'next/image';
import { Clock, Flame } from 'lucide-react';
import type { Row } from '@/lib/db';
import { cx, moodMeta, splitMoods } from '@/lib/utils';

const TILTS = ['tilt-1', 'tilt-2', 'tilt-3', 'tilt-2', 'tilt-1', 'tilt-3'];

export function RecipeCard({ recipe, index = 0, compact = false }: { recipe: Row; index?: number; compact?: boolean }) {
  const moods = splitMoods(recipe.moods);
  return (
    <Link
      href={`/recipes/${recipe.slug}`}
      className={cx('pin-card group block overflow-hidden', TILTS[index % TILTS.length])}
      style={{ display: 'block' }}
    >
      <span className="pin-tape" />
      <div className="relative m-2 overflow-hidden rounded-lg">
        {recipe.image ? (
          <Image
            src={recipe.image}
            alt={recipe.title}
            width={640}
            height={420}
            className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="grid aspect-[4/3] w-full place-items-center bg-paper2 font-hand text-2xl text-ink-soft">
            no photo yet — coming soon
          </div>
        )}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-paper/90 px-2.5 py-1 text-xs font-bold text-ink backdrop-blur-sm">
          <Clock size={12} className="text-terra" /> {recipe.time_min} min
        </div>
      </div>
      <div className={cx('px-4 pb-4', compact ? 'pt-1' : 'pt-2')}>
        <h3 className="font-display text-lg font-semibold leading-snug text-ink group-hover:text-terra transition-colors">
          {recipe.title}
        </h3>
        {!compact && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-soft">{recipe.kitchen_note}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {moods.map((m) => (
            <span key={m} className="chip !py-0.5 !text-[11px]">
              {moodMeta(m).emoji} {moodMeta(m).label}
            </span>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-hand text-base text-ink-soft">serves {recipe.servings}</span>
          <span className="flex items-center gap-1 text-xs font-bold text-terra">
            <Flame size={12} /> {recipe.served > 0 ? `${recipe.served} served` : 'serve it at home'}
          </span>
        </div>
      </div>
    </Link>
  );
}
