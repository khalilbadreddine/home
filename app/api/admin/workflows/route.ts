import { NextResponse } from 'next/server';
import * as repo from '@/lib/db/repo';
import { requireOwner, jsonError, readJson } from '@/lib/api-guards';
import { SKILLS } from '@/lib/skills';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;
  return NextResponse.json(await repo.listWorkflows());
}

export async function POST(req: Request) {
  const { error } = await requireOwner();
  if (error) return error;
  const b = readJson<any>(await req.text(), {});
  if (!b.name?.trim()) return jsonError('Give the workflow a name');
  const steps = Array.isArray(b.steps) ? b.steps.filter((s: any) => s && SKILLS.some((k) => k.id === s.skill)) : [];
  const trigger = String(b.trigger || 'manual');
  const scheduleHours = trigger === 'schedule' ? (Number(b.schedule_hours) > 0 ? Number(b.schedule_hours) : 24) : null;
  const id = await repo.createWorkflow({
    name: b.name.trim(),
    description: b.description || '',
    trigger,
    steps,
    active: b.active !== false,
    schedule_hours: scheduleHours,
  });
  return NextResponse.json({ ok: true, id });
}
