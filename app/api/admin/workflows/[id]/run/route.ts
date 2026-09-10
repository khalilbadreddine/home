import { NextResponse } from 'next/server';
import * as repo from '@/lib/db/repo';
import { requireOwner, jsonError, readJson } from '@/lib/api-guards';
import { runWorkflow } from '@/lib/workflow';

export const dynamic = 'force-dynamic';

/** POST { input?: {...} } — run the workflow now. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireOwner();
  if (error) return error;
  const id = Number(params.id);
  const wf = await repo.getWorkflow(id);
  if (!wf) return jsonError('Workflow not found', 404);
  let b: any = {};
  try {
    b = await req.json();
  } catch {}
  const context = { input: b?.input || {} };
  // convenience: if the workflow expects recipe/story context and none given, skip
  const jobId = await runWorkflow(id, context);
  return NextResponse.json({ ok: true, jobId });
}
