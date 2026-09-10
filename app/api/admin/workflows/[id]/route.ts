import { NextResponse } from 'next/server';
import * as repo from '@/lib/db/repo';
import { requireOwner, jsonError, readJson } from '@/lib/api-guards';
import { SKILLS } from '@/lib/skills';
import { runWorkflow } from '@/lib/workflow';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireOwner();
  if (error) return error;
  const id = Number(params.id);
  const wf = await repo.getWorkflow(id);
  if (!wf) return jsonError('Workflow not found', 404);
  const b = readJson<any>(await req.text(), {});
  const steps = Array.isArray(b.steps) ? b.steps.filter((s: any) => s && SKILLS.some((k) => k.id === s.skill)) : wf.steps;
  const trigger = b.trigger !== undefined ? String(b.trigger) : wf.trigger;
  const scheduleHours =
    b.schedule_hours !== undefined
      ? trigger === 'schedule'
        ? Number(b.schedule_hours) > 0
          ? Number(b.schedule_hours)
          : 24
        : null
      : wf.schedule_hours;
  await repo.updateWorkflow(id, {
    name: b.name,
    description: b.description,
    trigger,
    steps,
    active: b.active,
    schedule_hours: scheduleHours,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireOwner();
  if (error) return error;
  await repo.deleteWorkflow(Number(params.id));
  return NextResponse.json({ ok: true });
}
