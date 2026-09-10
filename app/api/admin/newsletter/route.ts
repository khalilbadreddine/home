import { NextResponse } from 'next/server';
import * as repo from '@/lib/db/repo';
import { requireOwner, jsonError, readJson } from '@/lib/api-guards';
import { getSetting, setSetting } from '@/lib/db/repo';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/newsletter { subject, body, preview?, send? }
 * Drafts are always saved as a job (visible in Automation).
 * With send:true AND a Resend key, the letter actually goes out to subscribers.
 */
export async function POST(req: Request) {
  const { error } = await requireOwner();
  if (error) return error;
  const b = readJson(await req.text());
  const subject = String(b.subject || '').trim();
  const body = String(b.body || '').trim();
  if (!subject || !body) return jsonError('Subject and body are needed');

  const jobId = await repo.createJob({
    workflow_id: null,
    skill_id: 'newsletter_draft',
    name: 'Newsletter draft',
    context: { input: { subject, body, preview: b.preview || '' } },
  });
  await repo.setJobStatus(jobId, 'done', [`[manual] letter saved: "${subject}"`], { subject, preview: b.preview || '', body });

  if (!b.send) {
    return NextResponse.json({ ok: true, jobId, sent: false, note: 'Saved as a draft — review it, then press Send.' });
  }

  const key = process.env.RESEND_API_KEY || (await getSetting('resend_api_key'));
  if (!key) {
    return NextResponse.json({
      ok: true,
      jobId,
      sent: false,
      note: 'No Resend key yet — the letter is saved. Add RESEND_API_KEY (or paste it in Settings) and send again.',
    });
  }

  const subs = await repo.listSubscribers();
  if (!subs.length) {
    return NextResponse.json({ ok: true, jobId, sent: 0, note: 'Nobody is subscribed yet — the letter is saved for when they are.' });
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(key);
    const from = (await getSetting('newsletter_from', '')) || 'The Seeker <onboarding@resend.dev>';
    const html = emailHtml(subject, body);
    const res = await resend.emails.send({
      from,
      to: subs.map((s) => s.email),
      subject,
      html,
      text: `${subject}\n\n${body}`,
    });
    const accepted = (((res.data as any)?.accepted) || []).length;
    await repo.setJobStatus(jobId, 'done', [`[manual] letter saved`, `sent to ${accepted} home cooks via Resend (${res.data?.id})`], { subject, preview: b.preview || '', body });
    return NextResponse.json({ ok: true, jobId, sent: accepted, message: `The Sunday Spoon is on its way to ${accepted} home cooks.` });
  } catch (e: any) {
    return NextResponse.json({ ok: true, jobId, sent: 0, note: `Saved, but Resend refused: ${e?.message || 'unknown error'}. Check your key and sender domain.` });
  }
}

function emailHtml(subject: string, body: string): string {
  const text = body
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 18px;line-height:1.75;color:#33241b;font-size:15px;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');
  return `<!doctype html><html><body style="margin:0;padding:0;background:#faf3e7;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;font-family:Georgia,'Times New Roman',serif;">
    <div style="text-align:center;padding:18px 0 26px;">
      <div style="font-size:26px;">🥣</div>
      <h1 style="margin:8px 0 0;font-size:24px;color:#96421f;">The Sunday Spoon</h1>
      <p style="margin:6px 0 0;color:#6d584a;font-size:13px;">TherecipeSeeker · a kitchen that feels like home</p>
    </div>
    <div style="background:#fffdf6;border:1px solid #e3d5bd;border-radius:14px;padding:28px 26px;">
      <h2 style="margin:0 0 18px;font-size:19px;color:#33241b;">${subject}</h2>
      ${text}
      <p style="margin:22px 0 0;color:#96421f;font-size:15px;font-style:italic;">see you at the stove — S</p>
    </div>
    <p style="text-align:center;color:#6d584a;font-size:12px;margin-top:24px;">You joined The Sunday Spoon. Unsubscribe anytime — one click, no guilt.</p>
  </div></body></html>`;
}
