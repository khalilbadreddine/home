export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'recipe';
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

export function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} d ago`;
  return fmtDate(iso);
}

/* ── The Tonight moods — the heart of the site ───────── */
export const MOODS = [
  { id: 'cozy', label: 'Cozy & Warm', emoji: '🕯️', line: 'for slow evenings, foggy windows, and blankets over the kitchen chairs.' },
  { id: 'quick', label: 'Quick & Kind', emoji: '⏱️', line: 'for nights when you did enough already — dinner in 30, still delicious.' },
  { id: 'family', label: 'Feeding a Crowd', emoji: '🍲', line: 'for tables that fill up — one pot, loud laughing, seconds for everyone.' },
  { id: 'light', label: 'Bright & Light', emoji: '🌿', line: 'for midweek reset evenings — cold-pressed, simple, still satisfying.' },
  { id: 'sweet', label: 'Sweet Ending', emoji: '🍯', line: 'because the day deserves a little something warm to finish on.' },
] as const;

export type MoodId = (typeof MOODS)[number]['id'];

export function moodMeta(id: string) {
  return MOODS.find((m) => m.id === id) ?? MOODS[0];
}

export function splitMoods(csv: string): string[] {
  return (csv || '').split(',').map((s) => s.trim()).filter(Boolean);
}

/* ── tiny safe markdown → HTML (escape first, then style) ── */
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function inline(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

export function renderMarkdown(md: string): string {
  const lines = esc(md || '').split('\n');
  const html: string[] = [];
  let inList = false;
  let para: string[] = [];
  const flushPara = () => {
    if (para.length) {
      html.push(`<p class="story-p">${inline(para.join(' '))}</p>`);
      para = [];
    }
  };
  const closeList = () => {
    if (inList) { html.push('</ul>'); inList = false; }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { flushPara(); closeList(); continue; }
    if (/^###\s+/.test(line)) { flushPara(); closeList(); html.push(`<h3 class="story-h">${inline(line.replace(/^###\s+/, ''))}</h3>`); continue; }
    if (/^##\s+/.test(line)) { flushPara(); closeList(); html.push(`<h2 class="story-h">${inline(line.replace(/^##\s+/, ''))}</h2>`); continue; }
    if (/^#{1}\s+/.test(line)) { flushPara(); closeList(); html.push(`<h2 class="story-h">${inline(line.replace(/^#\s+/, ''))}</h2>`); continue; }
    if (/^[-*]\s+/.test(line)) {
      flushPara();
      if (!inList) { html.push('<ul class="story-ul">'); inList = true; }
      html.push(`<li>${inline(line.replace(/^[-*]\s+/, ''))}</li>`);
      continue;
    }
    para.push(line.trim());
  }
  flushPara(); closeList();
  return html.join('\n');
}

export function readTime(body: string): string {
  const words = (body || '').split(/\s+/).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}
