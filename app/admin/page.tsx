import type { Metadata } from 'next';
import { getServerSession } from '@/lib/auth';
import { AdminLogin } from '@/components/admin/AdminLogin';
import { AdminShell } from '@/components/admin/Shell';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'The Stove — admin' };

export default async function AdminPage() {
  const session = await getServerSession();
  const isOwner = Boolean(session?.user?.isOwner);

  if (!session?.user?.email) {
    return <AdminLogin />;
  }
  if (!isOwner) {
    return (
      <div className="grid min-h-screen place-items-center px-6 pt-20">
        <div className="paper-card max-w-md p-8 text-center">
          <p className="text-4xl">🔒</p>
          <h1 className="mt-4 font-display text-2xl font-semibold">This kitchen has an owner</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            You’re signed in as <span className="font-bold text-ink">{session.user.email}</span>, but the
            stove is keyed to the owner account
            <span className="font-bold text-ink"> (ADMIN_EMAIL)</span>. Sign in with the owner’s Google
            account (same email) or the owner’s email &amp; password to manage the kitchen.
          </p>
          <a href="/api/auth/signout?callbackUrl=/admin" className="btn-ghost mt-6">Sign out</a>
        </div>
      </div>
    );
  }
  return <AdminShell userEmail={session.user.email!} />;
}
