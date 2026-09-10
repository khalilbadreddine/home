import { NextResponse } from 'next/server';
import * as repo from '@/lib/db/repo';

export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: 'bad id' }, { status: 400 });
  await repo.bumpServed(id);
  const r = await repo.getRecipeById(id);
  return NextResponse.json({ ok: true, served: r?.served ?? 0 });
}
