/**
 * Saffron — the AI kitchen companion.
 * Runs entirely on your own machine via Ollama (free, private, offline).
 * Point OLLAMA_BASE_URL at any Ollama server. Default: http://localhost:11434
 */
import { getSetting } from './db/repo';

export function ollamaUrl(): string {
  return (process.env.OLLAMA_BASE_URL || '').replace(/\/$/, '') || 'http://localhost:11434';
}
export function ollamaModel(): string {
  return process.env.OLLAMA_MODEL || 'llama3.1';
}

const SYSTEM_PERSONA = `You are Saffron, the AI kitchen companion of TherecipeSeeker — a warm recipe home made for women, like a kind friend who happens to cook beautifully. Voice: warm, specific, unhurried, a little playful. Never salesy, never generic, never use the words "delicious" more than twice. Write like a real woman in her own kitchen at 7pm. When asked for JSON, reply with ONLY valid JSON — no markdown fences, no commentary.`;

export interface ChatOpts {
  user: string;
  system?: string;
  json?: boolean;
  model?: string;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface OllamaError extends Error {
  friendly: string;
  code?: string;
}

export async function ollamaChat(opts: ChatOpts): Promise<string> {
  const base = await resolveBase();
  const model = opts.model || (await resolveModel());
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), opts.timeoutMs ?? 180000);
  try {
    const res = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        system: opts.system || SYSTEM_PERSONA,
        messages: [{ role: 'user', content: opts.user }],
        ...(opts.json ? { format: 'json' } : {}),
        options: { num_predict: opts.maxTokens ?? 1600, temperature: 0.75 },
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      if (res.status === 404) throw fail('MODEL_MISSING', `Ollama answered, but model "${model}" is not pulled. Run: ollama pull ${model}`);
      throw fail('AI_ERROR', `Ollama returned ${res.status}: ${body.slice(0, 200)}`);
    }
    const data = await res.json();
    const text: string = data?.message?.content ?? '';
    if (!text.trim()) throw fail('AI_EMPTY', 'The model returned an empty answer — try again or pull a bigger model.');
    return text;
  } catch (e: any) {
    if (e instanceof Error && 'friendly' in e) throw e;
    if (e?.name === 'AbortError') throw fail('AI_TIMEOUT', 'Ollama took too long. First runs can be slow while the model loads — try again in a moment.');
    throw fail('AI_UNREACHABLE', `Can't reach Ollama at ${base}. On your machine run "ollama serve", or set OLLAMA_BASE_URL to a reachable Ollama server.`);
  } finally {
    clearTimeout(t);
  }
}

function fail(code: string, friendly: string): OllamaError {
  const e = new Error(friendly) as OllamaError;
  e.friendly = friendly;
  e.code = code;
  return e;
}

let _baseCache: { url: string; at: number } | null = null;
async function resolveBase(): Promise<string> {
  if (_baseCache && Date.now() - _baseCache.at < 60000) return _baseCache.url;
  let url = ollamaUrl();
  try {
    const s = await getSetting('ollama_url');
    if (s) url = s.replace(/\/$/, '');
  } catch {}
  _baseCache = { url, at: Date.now() };
  return url;
}
async function resolveModel(): Promise<string> {
  try {
    const s = await getSetting('ollama_model');
    if (s) return s;
  } catch {}
  return ollamaModel();
}

export async function ollamaHealth(): Promise<{ ok: boolean; base: string; model: string; models: string[]; error?: string }> {
  const base = await resolveBase();
  try {
    const res = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = await res.json();
    const models: string[] = (data.models || []).map((m: any) => m.name);
    return { ok: true, base, model: await resolveModel(), models };
  } catch (e: any) {
    return { ok: false, base, model: ollamaModel(), models: [], error: e?.message || 'unreachable' };
  }
}

/** Defensively parse JSON out of a model answer (handles stray fences/text). */
export function parseJson<T = any>(text: string): T | null {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  const first = t.search(/[[{]/);
  if (first > 0) t = t.slice(first);
  const last = Math.max(t.lastIndexOf('}'), t.lastIndexOf(']'));
  if (last >= 0) t = t.slice(0, last + 1);
  try {
    return JSON.parse(t) as T;
  } catch {
    return null;
  }
}

export const SKILL_HINT = 'Reply with valid JSON only.';
