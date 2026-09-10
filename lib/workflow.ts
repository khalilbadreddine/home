/**
 * Automation workflow engine.
 * Workflows = ordered steps, each step is one pre-built skill.
 * Triggers: manual, recipe_published, story_published, or a schedule (hours).
 * The worker runs in-process (works with `next dev` / `next start` on any Node host).
 */
import * as repo from './db/repo';
import { getSkill, runSkill, SKILLS } from './skills';
import { jparse } from './db';

export function resolveTemplate(str: string, ctx: any): string {
  return str.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path: string) => {
    const parts = path.split('.');
    let v: any = ctx;
    for (const p of parts) {
      if (v == null) return '';
      v = v[p];
    }
    if (v == null) return '';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  });
}

export interface StepDef {
  skill: string;
  label?: string;
  input?: Record<string, string>;
}

/** Run one job (a single skill, or a workflow's steps in order). */
export async function processJob(jobId: number): Promise<void> {
  const job = await repo.getJob(jobId);
  if (!job || job.status !== 'queued') return;

  const log: string[] = [];
  const outputs: Record<string, any> = {};
  const context: any = jparse(job.input, {});
  const started = Date.now();

  const pushLog = (m: string) => {
    log.push(`[${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}] ${m}`);
  };

  await repo.setJobStatus(jobId, 'running', log, outputs);
  pushLog('Job started');

  const steps: StepDef[] = job.workflow_id
    ? jparse((await repo.getWorkflow(job.workflow_id))?.steps, [])
    : [{ skill: job.skill_id, input: context.input || {} }];

  try {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const skill = getSkill(step.skill);
      if (!skill) throw new Error(`Step ${i + 1}: unknown skill "${step.skill}"`);
      const input: Record<string, string> = {};
      for (const [k, v] of Object.entries(step.input || {})) {
        input[k] = resolveTemplate(String(v), { ...context, outputs });
      }
      // template inside a step can reference the step's own recipe context ({{recipe.id}})
      if (context.recipe) input.__recipe_id ||= String(context.recipe.id);
      pushLog(`Step ${i + 1}/${steps.length}: ${skill.emoji} ${skill.name}${step.label ? ` — ${step.label}` : ''}`);
      const result = await runSkill(skill.id, input, context, pushLog);
      outputs[step.skill] = { ...result.data, summary: result.summary };
      pushLog(`→ ${result.summary}`);
    }
    pushLog(`Done in ${Math.round((Date.now() - started) / 100) / 10}s`);
    await repo.setJobStatus(jobId, 'done', log, outputs);
    if (job.workflow_id) await repo.setWorkflowLastRun(Number(job.workflow_id));
  } catch (e: any) {
    pushLog(`✗ ${e?.friendly || e?.message || 'Something went wrong'}`);
    await repo.setJobStatus(jobId, 'failed', log, { outputs, error: e?.friendly || e?.message });
  }
}

export async function runWorkflow(workflowId: number, context: any): Promise<number> {
  const wf = await repo.getWorkflow(workflowId);
  if (!wf) throw new Error('Workflow not found');
  const steps: StepDef[] = jparse(wf.steps, []);
  const name = steps.length > 1 ? wf.name : getSkill(steps[0]?.skill)?.name || wf.name;
  const jobId = await repo.createJob({ workflow_id: wf.id, skill_id: steps[0]?.skill || '', name, context });
  void processJob(jobId);
  return jobId;
}

export async function runSingleSkill(skillId: string, input: Record<string, string>, context: any = {}): Promise<number> {
  const skill = getSkill(skillId);
  if (!skill) throw new Error('Unknown skill');
  const jobId = await repo.createJob({ workflow_id: null, skill_id: skillId, name: skill.name, context: { input, ...context } });
  void processJob(jobId);
  return jobId;
}

/** Fire every active workflow matching an event (e.g. recipe_published). */
export async function fireTrigger(event: string, context: any): Promise<number[]> {
  const wfs = (await repo.listWorkflows()).filter((w) => w.trigger === event && w.active === 1);
  const ids: number[] = [];
  for (const wf of wfs) {
    ids.push(await runWorkflow(wf.id, context));
  }
  return ids;
}

/* ── in-process worker ─────────────────────────────── */
let _timer: any = null;
let _tick = false;

export function startWorker(intervalMs = 8000): void {
  if (_timer) return;
  const tick = async () => {
    if (_tick) return;
    _tick = true;
    try {
      // 1) scheduled workflows
      const wfs = (await repo.listWorkflows()).filter((w) => w.active === 1 && w.schedule_hours > 0);
      const nowIso = new Date().toISOString();
      for (const wf of wfs) {
        const last = wf.last_run ? new Date(wf.last_run).getTime() : 0;
        if (Date.now() - last > Number(wf.schedule_hours) * 3600_000) {
          await runWorkflow(wf.id, { scheduled: nowIso });
        }
      }
      // 2) queued jobs
      const queued = await repo.listQueuedJobs(3);
      for (const job of queued) {
        try {
          await processJob(job.id);
        } catch (e: any) {
          console.error('[worker] job failed', e?.message);
        }
      }
    } catch (e: any) {
      // DB not ready yet — retry next tick
      if (e?.message?.includes('SQLITE') || e?.message?.includes('relation')) console.warn('[worker] waiting for DB:', e?.message);
    } finally {
      _tick = false;
    }
  };
  _timer = setInterval(tick, intervalMs);
  _timer.unref?.();
  void tick();
}

export function stopWorker(): void {
  if (_timer) clearInterval(_timer);
  _timer = null;
}

export const ALL_TRIGGER_OPTIONS = [
  { value: 'manual', label: 'Manual (I press Run)' },
  { value: 'recipe_published', label: 'When a recipe is published' },
  { value: 'story_published', label: 'When a story is published' },
  { value: 'schedule', label: 'On a schedule (every N hours)' },
];

export { SKILLS };
