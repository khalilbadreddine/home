import { NextResponse } from 'next/server';
import { requireOwner, jsonError, readJson } from '@/lib/api-guards';
import { getSkill } from '@/lib/skills';
import { runSingleSkill } from '@/lib/workflow';
import * as repo from '@/lib/db/repo';

export const dynamic = 'force-dynamic';

/** Run one skill right now (job is created; poll /api/admin/jobs for progress). */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireOwner();
  if (error) return error;
  const skill = getSkill(params.id);
  if (!skill) return jsonError('Unknown skill', 404);
  const b = readJson<any>(await req.text(), {});
  const input: Record<string, string> = {};
  for (const p of skill.params) {
    const v = b?.input?.[p.key] ?? b?.[p.key] ?? p.default ?? '';
    input[p.key] = String(v ?? '');
  }
  // recipe/story select params can arrive as numbers
  for (const k of Object.keys(input)) {
    if ((k === 'recipe_id' || k === 'story_id') && input[k]) input[k] = String(Number(input[k]) || input[k]);
  }

  // quick validation of required selects
  if (input.recipe_id) {
    const r = await repo.getRecipeById(Number(input.recipe_id));
    if (!r) return jsonError('That recipe no longer exists');
  }
  if (input.story_id) {
    const s = await repo.getStoryById(Number(input.story_id));
    if (!s) return jsonError('That story no longer exists');
  }

  try {
    const jobId = await runSingleSkill(skill.id, input, {});
    return NextResponse.json({ ok: true, jobId });
  } catch (e: any) {
    return jsonError(e?.friendly || e?.message || 'Could not start the skill', 400);
  }
}
