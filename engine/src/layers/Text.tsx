import React from "react";
import { AbsoluteFill } from "remotion";
import type { Position, TextLayer } from "../types";
import { useShot } from "../lib/context";
import { color, font, rgba, shadowFor, weightFor } from "../lib/theme";
import { easeFn, easeOutBack, easeOutCubic, prog } from "../lib/easing";
import { fbm } from "../lib/noise";
import { useLayerTime } from "../lib/hooks";

const DEFAULT_SIZE: Record<string, number> = {
  title: 9,
  slam: 17,
  kinetic: 7,
  typewriter: 4.4,
  reveal: 8,
  lower_third: 3.6,
  label: 2.7,
  quote: 5.2,
  stamp: 8,
  marker: 5.5,
  outline: 22,
  chapter: 10,
};

const DEFAULT_POSITION: Record<string, Position> = {
  lower_third: "lower_third",
  label: "top_left",
  typewriter: "left",
};

const UPPER_BY_DEFAULT = new Set(["title", "slam", "label", "stamp", "chapter", "outline"]);

export function positionStyle(pos: Position | undefined, unit: number): React.CSSProperties {
  const padX = unit * 6.5;
  const padY = unit * 7;
  const base: React.CSSProperties = { display: "flex", padding: `${padY}px ${padX}px` };
  switch (pos ?? "center") {
    case "top":
      return { ...base, justifyContent: "flex-start", alignItems: "center", flexDirection: "column" };
    case "bottom":
      return { ...base, justifyContent: "flex-end", alignItems: "center", flexDirection: "column", paddingBottom: unit * 13 };
    case "left":
      return { ...base, justifyContent: "center", alignItems: "flex-start", flexDirection: "column" };
    case "right":
      return { ...base, justifyContent: "center", alignItems: "flex-end", flexDirection: "column" };
    case "top_left":
      return { ...base, justifyContent: "flex-start", alignItems: "flex-start", flexDirection: "column" };
    case "top_right":
      return { ...base, justifyContent: "flex-start", alignItems: "flex-end", flexDirection: "column" };
    case "bottom_left":
      return { ...base, justifyContent: "flex-end", alignItems: "flex-start", flexDirection: "column" };
    case "bottom_right":
      return { ...base, justifyContent: "flex-end", alignItems: "flex-end", flexDirection: "column" };
    case "lower_third":
      return { ...base, justifyContent: "flex-end", alignItems: "flex-start", flexDirection: "column", paddingBottom: unit * 16 };
    case "center":
    default:
      return { ...base, justifyContent: "center", alignItems: "center", flexDirection: "column" };
  }
}

const norm = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}%$€£]/gu, "");

/** Split text into words, marking highlighted ones. Keeps explicit line breaks as "\n" tokens. */
function tokens(text: string, highlight: string[] | undefined) {
  const hl = new Set((highlight ?? []).flatMap((h) => h.split(/\s+/)).map(norm));
  const out: { w: string; hl: boolean; br: boolean }[] = [];
  text.split("\n").forEach((line, li) => {
    if (li > 0) out.push({ w: "", hl: false, br: true });
    line
      .split(/\s+/)
      .filter(Boolean)
      .forEach((w) => out.push({ w, hl: hl.has(norm(w)), br: false }));
  });
  return out;
}

export const TextView: React.FC<{ layer: TextLayer }> = ({ layer }) => {
  const { palette, treatment, seed } = useShot();
  const { t, dur, height } = useLayerTime();
  const unit = height / 100;
  const style = layer.style ?? "title";
  const size = (layer.size ?? DEFAULT_SIZE[style] ?? 6) * unit;
  const fg = color(layer.color, palette, style === "stamp" ? palette.accent2 ?? palette.accent : style === "marker" ? palette.accent : palette.fg);
  const hlColor = color(layer.highlight_color, palette, palette.accent);
  const upper = layer.uppercase ?? UPPER_BY_DEFAULT.has(style);
  const pos = layer.box ? undefined : layer.position ?? DEFAULT_POSITION[style];
  const align = layer.align ?? (pos && /left|lower_third/.test(pos) ? "left" : pos && /right/.test(pos) ? "right" : "center");
  const toks = tokens(upper ? layer.text.toUpperCase() : layer.text, layer.highlight);

  const roleFor = (fallback: "display" | "body" | "accent" | "mono") => layer.font ?? fallback;
  const shadow =
    layer.backdrop === "none"
      ? undefined
      : layer.backdrop === "box" || layer.backdrop === "blur"
        ? undefined
        : shadowFor(fg);
  const backdropStyle: React.CSSProperties =
    layer.backdrop === "box"
      ? { background: rgba(palette.bg, 0.86), padding: "0.18em 0.4em", borderRadius: unit * 0.4 }
      : layer.backdrop === "blur"
        ? { background: "rgba(0,0,0,0.35)", backdropFilter: "blur(14px)", padding: "0.2em 0.45em", borderRadius: unit * 0.8 }
        : {};

  const words = (render: (tok: { w: string; hl: boolean }, i: number) => React.ReactNode) =>
    toks.map((tok, i) => (tok.br ? <div key={i} style={{ flexBasis: "100%", height: 0 }} /> : render(tok, i)));

  const wordColor = (hl: boolean) => (hl ? hlColor : fg);
  const wrap: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center",
    columnGap: "0.24em",
    rowGap: "0.02em",
    maxWidth: "88%",
    textAlign: align,
  };

  let body: React.ReactNode;

  switch (style) {
    case "slam": {
      const hit = prog(t, 0, 0.2);
      const e = easeFn("snap")(hit);
      const scale = 2.3 - 1.3 * e + 0.04 * prog(t, 0.2, dur);
      const shake = (1 - prog(t, 0.18, 0.55)) * (t > 0.18 ? 1 : 0);
      const sx = fbm(t * 30, seed) * unit * 1.2 * shake;
      const sy = fbm(t * 30, seed + 4) * unit * 1.2 * shake;
      body = (
        <div
          style={{
            ...wrap,
            fontFamily: font(roleFor("display"), treatment),
            fontWeight: weightFor(roleFor("display"), treatment, 900),
            fontSize: size,
            lineHeight: 0.92,
            letterSpacing: "-0.01em",
            opacity: Math.min(1, hit * 4),
            transform: `translate(${sx}px, ${sy}px) scale(${scale}) rotate(${layer.rotate ?? 0}deg)`,
            textShadow: shadow,
            ...backdropStyle,
          }}
        >
          {words((tok, i) => (
            <span key={i} style={{ color: wordColor(tok.hl) }}>
              {tok.w}
            </span>
          ))}
        </div>
      );
      break;
    }
    case "kinetic": {
      const real = toks.filter((x) => !x.br);
      const spread = Math.min(dur * 0.75, real.length * 0.32);
      let wi = -1;
      body = (
        <div
          style={{
            ...wrap,
            fontFamily: font(roleFor("display"), treatment),
            fontWeight: weightFor(roleFor("display"), treatment, 800),
            fontSize: size,
            lineHeight: 1.05,
            textShadow: shadow,
            ...backdropStyle,
          }}
        >
          {words((tok, i) => {
            wi += 1;
            const at = layer.word_times?.[wi] ?? (real.length > 1 ? (wi / (real.length - 1)) * spread : 0);
            const p = prog(t, at, at + 0.18);
            return (
              <span
                key={i}
                style={{
                  color: wordColor(tok.hl),
                  display: "inline-block",
                  opacity: p,
                  transform: `translateY(${(1 - easeOutCubic(p)) * 35}%) scale(${0.9 + 0.1 * easeOutBack(p)})`,
                }}
              >
                {tok.w}
              </span>
            );
          })}
        </div>
      );
      break;
    }
    case "typewriter": {
      const full = upper ? layer.text.toUpperCase() : layer.text;
      const cps = Math.max(18, full.length / Math.max(0.4, dur * 0.7));
      const n = Math.floor(Math.max(0, t) * cps);
      const shown = full.slice(0, n);
      const cursorOn = Math.floor(t * 2.2) % 2 === 0 || n < full.length;
      body = (
        <div
          style={{
            fontFamily: font(roleFor("mono"), treatment),
            fontWeight: 700,
            fontSize: size,
            lineHeight: 1.35,
            color: fg,
            whiteSpace: "pre-wrap",
            maxWidth: "80%",
            textAlign: align,
            textShadow: shadow,
            ...backdropStyle,
          }}
        >
          {shown}
          <span style={{ display: "inline-block", width: "0.6em", height: "1.05em", verticalAlign: "-0.15em", marginLeft: "0.08em", background: cursorOn ? hlColor : "transparent" }} />
        </div>
      );
      break;
    }
    case "reveal": {
      const lines = (upper ? layer.text.toUpperCase() : layer.text).split("\n");
      body = (
        <div style={{ display: "flex", flexDirection: "column", alignItems: align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center", ...backdropStyle }}>
          {lines.map((line, i) => {
            const p = easeOutCubic(prog(t, i * 0.14, i * 0.14 + 0.55));
            return (
              <div key={i} style={{ overflow: "hidden", paddingBottom: "0.06em" }}>
                <div
                  style={{
                    fontFamily: font(roleFor("display"), treatment),
                    fontWeight: weightFor(roleFor("display"), treatment, 800),
                    fontSize: size,
                    lineHeight: 1.0,
                    color: fg,
                    transform: `translateY(${(1 - p) * 110}%)`,
                    textShadow: shadow,
                  }}
                >
                  {tokens(line, layer.highlight).map((tok, j) => (
                    <span key={j} style={{ color: wordColor(tok.hl) }}>
                      {tok.w}{" "}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      );
      break;
    }
    case "lower_third": {
      const bar = easeOutCubic(prog(t, 0, 0.45));
      const txt = easeOutCubic(prog(t, 0.15, 0.6));
      const sub = easeOutCubic(prog(t, 0.3, 0.75));
      body = (
        <div style={{ display: "flex", alignItems: "stretch", gap: unit * 1.2 }}>
          <div style={{ width: unit * 0.6, background: hlColor, transform: `scaleY(${bar})`, transformOrigin: "bottom" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: unit * 0.4 }}>
            <div style={{ overflow: "hidden" }}>
              <div
                style={{
                  fontFamily: font(roleFor("body"), treatment),
                  fontWeight: weightFor(roleFor("body"), treatment, 800),
                  fontSize: size,
                  color: fg,
                  transform: `translateX(${(txt - 1) * 105}%)`,
                  background: rgba(palette.bg, 0.7),
                  padding: `${unit * 0.3}px ${unit * 1}px`,
                }}
              >
                {upper ? layer.text.toUpperCase() : layer.text}
              </div>
            </div>
            {layer.subtitle ? (
              <div style={{ overflow: "hidden" }}>
                <div
                  style={{
                    fontFamily: font("mono", treatment),
                    fontSize: size * 0.58,
                    letterSpacing: "0.12em",
                    color: hlColor,
                    transform: `translateX(${(sub - 1) * 105}%)`,
                    background: rgba(palette.bg, 0.7),
                    padding: `${unit * 0.25}px ${unit * 1}px`,
                    textTransform: "uppercase",
                  }}
                >
                  {layer.subtitle}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      );
      break;
    }
    case "label": {
      const w = easeOutCubic(prog(t, 0, 0.4));
      body = (
        <div
          style={{
            clipPath: `inset(0 ${(1 - w) * 100}% 0 0)`,
            fontFamily: font(roleFor("mono"), treatment),
            fontWeight: 700,
            fontSize: size,
            letterSpacing: "0.22em",
            color: fg,
            background: rgba(palette.bg, 0.78),
            borderLeft: `${unit * 0.45}px solid ${hlColor}`,
            padding: `${unit * 0.6}px ${unit * 1.4}px`,
            display: "flex",
            flexDirection: "column",
            gap: unit * 0.3,
          }}
        >
          <span>{upper ? layer.text.toUpperCase() : layer.text}</span>
          {layer.subtitle ? <span style={{ color: palette.muted ?? fg, fontWeight: 400, fontSize: size * 0.8 }}>{layer.subtitle}</span> : null}
        </div>
      );
      break;
    }
    case "quote": {
      const real = toks.filter((x) => !x.br);
      const spread = Math.min(dur * 0.6, real.length * 0.12);
      const mark = easeOutBack(prog(t, 0, 0.45));
      let wi = -1;
      body = (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", maxWidth: "80%", ...backdropStyle }}>
          <div
            style={{
              fontFamily: font("display", treatment),
              fontSize: size * 2.6,
              lineHeight: 0.6,
              height: size * 1.2,
              color: hlColor,
              opacity: Math.min(1, mark),
              transform: `scale(${mark})`,
            }}
          >
            “
          </div>
          <div style={{ ...wrap, maxWidth: "100%", fontFamily: font(roleFor("display"), treatment), fontStyle: "italic", fontSize: size, lineHeight: 1.2, textShadow: shadow }}>
            {words((tok, i) => {
              wi += 1;
              const at = 0.25 + (real.length > 1 ? (wi / (real.length - 1)) * spread : 0);
              return (
                <span key={i} style={{ color: wordColor(tok.hl), opacity: prog(t, at, at + 0.35) }}>
                  {tok.w}
                </span>
              );
            })}
          </div>
          {layer.subtitle ? (
            <div
              style={{
                marginTop: unit * 2.5,
                fontFamily: font("mono", treatment),
                fontSize: size * 0.45,
                letterSpacing: "0.18em",
                color: palette.muted ?? fg,
                opacity: prog(t, 0.4 + spread, 0.8 + spread),
                textTransform: "uppercase",
              }}
            >
              — {layer.subtitle}
            </div>
          ) : null}
        </div>
      );
      break;
    }
    case "stamp": {
      const hit = easeFn("snap")(prog(t, 0, 0.16));
      body = (
        <div
          style={{
            fontFamily: font(roleFor("display"), treatment),
            fontWeight: weightFor(roleFor("display"), treatment, 900),
            fontSize: size,
            color: fg,
            border: `${unit * 0.7}px solid ${fg}`,
            outline: `${unit * 0.25}px solid ${fg}`,
            outlineOffset: unit * 0.5,
            padding: `${unit * 0.4}px ${unit * 2.2}px`,
            letterSpacing: "0.06em",
            opacity: Math.min(1, hit * 3) * 0.95,
            transform: `rotate(${layer.rotate ?? -9}deg) scale(${1.9 - 0.9 * hit})`,
            background: rgba(palette.bg, 0.35),
            textShadow: "0 0.03em 0.2em rgba(0,0,0,0.35)",
          }}
        >
          {upper ? layer.text.toUpperCase() : layer.text}
        </div>
      );
      break;
    }
    case "marker": {
      const w = easeFn("smooth")(prog(t, 0, Math.min(0.9, 0.12 * layer.text.length + 0.2)));
      body = (
        <div
          style={{
            fontFamily: font(roleFor("accent"), treatment),
            fontSize: size,
            lineHeight: 1.1,
            color: fg,
            transform: `rotate(${layer.rotate ?? -3}deg)`,
            clipPath: `inset(-20% ${(1 - w) * 100}% -20% -5%)`,
            textShadow: "0 0.05em 0.2em rgba(0,0,0,0.35)",
            maxWidth: "70%",
            textAlign: align,
          }}
        >
          {layer.text}
        </div>
      );
      break;
    }
    case "outline": {
      const drift = (t / Math.max(dur, 0.1)) * 6;
      body = (
        <div
          style={{
            fontFamily: font(roleFor("display"), treatment),
            fontWeight: weightFor(roleFor("display"), treatment, 900),
            fontSize: size,
            lineHeight: 0.9,
            color: "transparent",
            WebkitTextStroke: `${Math.max(2, unit * 0.22)}px ${fg}`,
            whiteSpace: "nowrap",
            opacity: 0.9 * easeOutCubic(prog(t, 0, 0.6)),
            transform: `translateX(${3 - drift}%) rotate(${layer.rotate ?? 0}deg)`,
          }}
        >
          {upper ? layer.text.toUpperCase() : layer.text}
        </div>
      );
      break;
    }
    case "chapter": {
      const kick = easeOutCubic(prog(t, 0, 0.5));
      const line = easeFn("smooth")(prog(t, 0.15, 0.8));
      const title = easeOutCubic(prog(t, 0.25, 0.85));
      body = (
        <div style={{ display: "flex", flexDirection: "column", alignItems: align === "left" ? "flex-start" : "center", gap: unit * 1.4 }}>
          {layer.subtitle ? (
            <div style={{ fontFamily: font("mono", treatment), fontSize: size * 0.24, letterSpacing: "0.45em", color: hlColor, opacity: kick, transform: `translateY(${(1 - kick) * 50}%)` }}>
              {layer.subtitle.toUpperCase()}
            </div>
          ) : null}
          <div style={{ width: unit * 22, height: Math.max(2, unit * 0.3), background: hlColor, transform: `scaleX(${line})` }} />
          <div style={{ overflow: "hidden" }}>
            <div
              style={{
                fontFamily: font(roleFor("display"), treatment),
                fontWeight: weightFor(roleFor("display"), treatment, 900),
                fontSize: size,
                lineHeight: 1,
                color: fg,
                textAlign: align,
                transform: `translateY(${(1 - title) * 105}%)`,
                textShadow: shadow,
              }}
            >
              {upper ? layer.text.toUpperCase() : layer.text}
            </div>
          </div>
        </div>
      );
      break;
    }
    case "title":
    default: {
      const p = easeOutCubic(prog(t, 0, 0.9));
      const sub = easeOutCubic(prog(t, 0.35, 1.0));
      body = (
        <div style={{ display: "flex", flexDirection: "column", alignItems: align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center", gap: unit * 1.2, ...backdropStyle }}>
          <div
            style={{
              ...wrap,
              maxWidth: "100%",
              fontFamily: font(roleFor("display"), treatment),
              fontWeight: weightFor(roleFor("display"), treatment, 900),
              fontSize: size,
              lineHeight: 0.98,
              letterSpacing: `${0.02 + (1 - p) * 0.25}em`,
              opacity: p,
              filter: `blur(${(1 - p) * 10}px)`,
              textShadow: shadow,
              transform: `rotate(${layer.rotate ?? 0}deg)`,
            }}
          >
            {words((tok, i) => (
              <span key={i} style={{ color: wordColor(tok.hl) }}>
                {tok.w}
              </span>
            ))}
          </div>
          {layer.subtitle ? (
            <div
              style={{
                fontFamily: font("body", treatment),
                fontWeight: 600,
                fontSize: size * 0.3,
                letterSpacing: "0.06em",
                color: layer.color ? fg : palette.muted ?? fg,
                opacity: sub,
                transform: `translateY(${(1 - sub) * 40}%)`,
                textShadow: shadow,
              }}
            >
              {layer.subtitle}
            </div>
          ) : null}
        </div>
      );
    }
  }

  if (layer.box) {
    const b = layer.box;
    return (
      <div
        style={{
          position: "absolute",
          left: `${b.x}%`,
          top: `${b.y}%`,
          width: `${b.w}%`,
          height: `${b.h}%`,
          display: "flex",
          alignItems: "center",
          justifyContent: align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center",
        }}
      >
        {body}
      </div>
    );
  }
  return <AbsoluteFill style={positionStyle(pos, unit)}>{body}</AbsoluteFill>;
};
