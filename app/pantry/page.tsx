import { Reveal } from '@/components/site/Reveal';
import { PantryClient } from '@/components/site/PantryClient';
import * as repo from '@/lib/db/repo';
import { FlaskConical } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My Pantry — cook with what you have' };

export default async function PantryPage() {
  const recipes = await repo.listRecipes({ status: 'published', limit: 100 });
  return (
    <div className="pt-32 sm:pt-36">
      <div className="container-site">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="kicker">the pantry trick</p>
          <h1 className="h-display mt-3 text-4xl sm:text-5xl">What’s in your fridge?</h1>
          <p className="section-sub mx-auto mt-4">
            No shopping list required. Tell the kitchen what you already have and it will match you to
            real recipes from this drawer — ranked by what you can actually make tonight.
          </p>
        </Reveal>
        <Reveal delay={0.12} className="mt-10">
          <PantryClient recipes={recipes} />
        </Reveal>
      </div>
    </div>
  );
}
