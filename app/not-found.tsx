import Link from 'next/link';

export const metadata = { title: 'Lost in the kitchen' };

export default function NotFound() {
  return (
    <div className="grid min-h-[70vh] place-items-center px-6 pt-24">
      <div className="text-center">
        <p className="text-5xl">🥣</p>
        <h1 className="h-display mt-5 text-3xl sm:text-4xl">This drawer is empty</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
          The page you’re after isn’t on the board — maybe it was moved, or never pinned at all.
          Let’s get you back to something warm.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-warm">Back to tonight’s board</Link>
          <Link href="/pantry" className="btn-ghost">Cook from my pantry</Link>
        </div>
      </div>
    </div>
  );
}
