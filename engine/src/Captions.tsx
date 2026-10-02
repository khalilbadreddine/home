import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { Captions, Treatment, VisualPlan, Word } from "./types";
import { easeOutBack, prog } from "./lib/easing";
import { font, hexToRgb, weightFor } from "./lib/theme";

interface Page {
  words: Word[];
  start: number;
  end: number;
}

export function paginate(words: Word[], maxWords: number): Page[] {
  const pages: Page[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (cur.length) pages.push({ words: cur, start: cur[0].start, end: cur[cur.length - 1].end });
    cur = [];
  };
  words.forEach((w, i) => {
    const prev = words[i - 1];
    if (cur.length && (cur.length >= maxWords || (prev && w.start - prev.end > 0.45) || /[.!?…]$/.test(prev?.word.trim() ?? ""))) flush();
    cur.push(w);
  });
  flush();
  // Hold each page until the next one starts (max +0.6s) so captions don't flicker.
  pages.forEach((p, i) => {
    const next = pages[i + 1];
    p.end = next ? Math.min(next.start, p.end + 0.6) : p.end + 0.6;
  });
  return pages;
}

export const CaptionsView: React.FC<{ plan: VisualPlan; captions: Captions; treatment: Treatment }> = ({ plan, captions, treatment }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const unit = height / 100;
  const t = frame / fps;
  const style = captions.style ?? "pop";
  const maxWords = captions.max_words ?? (style === "minimal" ? 8 : style === "karaoke" ? 6 : 3);
  const pages = useMemo(() => paginate(captions._words ?? [], maxWords), [captions._words, maxWords]);
  const page = pages.find((p) => t >= p.start - 0.05 && t < p.end);
  if (!page) return null;

  const hidden = captions.hide_during ?? [];
  const current = plan.shots.find((s) => t >= s.start && t < s.end);
  if (current && hidden.includes(current.id)) return null;

  const palette = treatment.palette;
  // Captions sit on a dark stroke/box, so they need a light text colour even when the palette ink is dark.
  const { r, g, b } = hexToRgb(palette.fg);
  const textColor = (r * 299 + g * 587 + b * 114) / 1000 > 140 ? palette.fg : "#f7f3ea";
  const role = captions.font ?? (style === "minimal" ? "body" : "display");
  const size = unit * (style === "minimal" ? 3.6 : style === "karaoke" ? 5 : 6.2);
  const upper = captions.uppercase ?? style !== "minimal";
  const pos = captions.position ?? "bottom";

  return (
    <AbsoluteFill
      style={{
        justifyContent: pos === "top" ? "flex-start" : pos === "center" ? "center" : "flex-end",
        alignItems: "center",
        padding: `${unit * 8}px ${unit * 8}px ${pos === "bottom" ? unit * 9 : unit * 8}px`,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          columnGap: "0.28em",
          maxWidth: "80%",
          fontFamily: font(role, treatment),
          fontWeight: weightFor(role, treatment, style === "minimal" ? 600 : 900),
          fontSize: size,
          lineHeight: 1.1,
          textAlign: "center",
          background: style === "minimal" ? "rgba(0,0,0,0.55)" : undefined,
          padding: style === "minimal" ? `${unit * 0.6}px ${unit * 1.4}px` : undefined,
          borderRadius: style === "minimal" ? unit * 0.6 : undefined,
        }}
      >
        {page.words.map((w, i) => {
          const active = t >= w.start && t < (page.words[i + 1]?.start ?? page.end);
          const spoken = t >= w.start;
          const txt = upper ? w.word.trim().toUpperCase() : w.word.trim();
          const p = easeOutBack(prog(t, w.start, w.start + 0.12), 2);
          const base: React.CSSProperties = {
            display: "inline-block",
            color: textColor,
            WebkitTextStroke: style === "minimal" ? undefined : `${unit * 0.18}px rgba(0,0,0,0.85)`,
            paintOrder: "stroke fill",
            textShadow: "0 0.05em 0.25em rgba(0,0,0,0.6)",
          };
          if (style === "pop") {
            return (
              <span key={i} style={{ ...base, color: active ? palette.accent : textColor, opacity: spoken ? 1 : 0, transform: `scale(${spoken ? (active ? 1.08 : 1) * (0.7 + 0.3 * p) : 0.7})` }}>
                {txt}
              </span>
            );
          }
          if (style === "karaoke") {
            return (
              <span key={i} style={{ ...base, color: spoken ? (active ? palette.accent : textColor) : "rgba(255,255,255,0.45)" }}>
                {txt}
              </span>
            );
          }
          return (
            <span key={i} style={{ ...base, opacity: 1 }}>
              {txt}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
