import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { Post, Transition } from "./types";
import { easeFn, easeInOutCubic, easeOutCubic, prog } from "./lib/easing";
import { hash } from "./lib/noise";

const safe = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, "");

// ---------------------------------------------------------------------------
// Post effects (filters on a whole shot)
// ---------------------------------------------------------------------------

function inRange(p: Post, t: number) {
  return t >= (p.start ?? -1e9) && t <= (p.end ?? 1e9);
}

function ramp(p: Post, t: number) {
  const a = p.start ?? -1e9;
  const b = p.end ?? 1e9;
  return Math.min(prog(t, a, a + 0.2), 1 - prog(t, b - 0.2, b));
}

export const PostWrap: React.FC<{ posts?: Post[]; t: number; id: string; children: React.ReactNode }> = ({ posts, t, id, children }) => {
  const frame = useCurrentFrame();
  if (!posts || posts.length === 0) return <>{children}</>;
  const filters: string[] = [];
  const defs: React.ReactNode[] = [];
  let scale = 1;
  let shiftX = 0;

  posts.forEach((p, i) => {
    const k = p.intensity ?? 0.5;
    const fid = safe(`post-${id}-${i}`);
    if (p.effect === "pulse") {
      for (const at of p.times ?? [0]) {
        if (t >= at) scale += 0.06 * k * Math.exp(-(t - at) * 9);
      }
      return;
    }
    if (!inRange(p, t)) return;
    const r = ramp(p, t);
    switch (p.effect) {
      case "chromatic": {
        const dx = (2 + 10 * k) * r;
        defs.push(<ChromaFilter key={fid} id={fid} dx={dx} />);
        filters.push(`url(#${fid})`);
        break;
      }
      case "glitch": {
        const on = hash(Math.floor(frame / 2) * 1.7 + i) < 0.25 + 0.45 * k;
        if (!on) break;
        defs.push(<GlitchFilter key={fid} id={fid} seed={frame % 50} scale={20 + 70 * k} dx={6 + 16 * k} />);
        filters.push(`url(#${fid})`);
        shiftX += (hash(frame * 3.1 + i) - 0.5) * 3 * k;
        break;
      }
      case "blur":
        filters.push(`blur(${24 * k * r}px)`);
        break;
      case "bloom":
        defs.push(<BloomFilter key={fid} id={fid} k={k * r} />);
        filters.push(`url(#${fid})`);
        break;
      case "desaturate":
        filters.push(`grayscale(${k * r})`);
        break;
    }
  });

  return (
    <AbsoluteFill
      style={{
        filter: filters.length ? filters.join(" ") : undefined,
        transform: scale !== 1 || shiftX ? `translateX(${shiftX}%) scale(${scale})` : undefined,
      }}
    >
      {defs.length ? (
        <svg width={0} height={0} style={{ position: "absolute" }}>
          {defs}
        </svg>
      ) : null}
      {children}
    </AbsoluteFill>
  );
};

const ChromaFilter: React.FC<{ id: string; dx: number }> = ({ id, dx }) => (
  <filter id={id} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
    <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
    <feOffset in="r" dx={dx} dy={0} result="ro" />
    <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
    <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
    <feOffset in="b" dx={-dx} dy={0} result="bo" />
    <feBlend in="ro" in2="g" mode="screen" result="rg" />
    <feBlend in="rg" in2="bo" mode="screen" />
  </filter>
);

const GlitchFilter: React.FC<{ id: string; seed: number; scale: number; dx: number }> = ({ id, seed, scale, dx }) => (
  <filter id={id} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
    <feTurbulence type="turbulence" baseFrequency="0.0001 0.09" numOctaves={1} seed={seed} result="n" />
    <feDisplacementMap in="SourceGraphic" in2="n" scale={scale} xChannelSelector="R" yChannelSelector="A" result="d" />
    <feColorMatrix in="d" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
    <feOffset in="r" dx={dx} dy={0} result="ro" />
    <feColorMatrix in="d" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="gb" />
    <feBlend in="ro" in2="gb" mode="screen" />
  </filter>
);

const BloomFilter: React.FC<{ id: string; k: number }> = ({ id, k }) => (
  <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
    <feGaussianBlur in="SourceGraphic" stdDeviation={8 + 22 * k} result="b" />
    <feComponentTransfer in="b" result="bb">
      <feFuncR type="linear" slope={1 + k} intercept={-0.25} />
      <feFuncG type="linear" slope={1 + k} intercept={-0.25} />
      <feFuncB type="linear" slope={1 + k} intercept={-0.25} />
    </feComponentTransfer>
    <feBlend in="SourceGraphic" in2="bb" mode="screen" />
  </filter>
);

// ---------------------------------------------------------------------------
// Shot transitions
// ---------------------------------------------------------------------------

export interface TransitionLook {
  style: React.CSSProperties;
  defs?: React.ReactNode;
}

function dirBlur(id: string, amount: number, vertical: boolean): TransitionLook["defs"] {
  return (
    <svg width={0} height={0} style={{ position: "absolute" }}>
      <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation={vertical ? `0 ${amount}` : `${amount} 0`} />
      </filter>
    </svg>
  );
}

/** Style for the incoming shot. p goes 0 → 1 across the transition window. */
export function enterLook(tr: Transition | undefined, p: number, id: string): TransitionLook {
  if (!tr || tr.type === "cut" || p >= 1) return { style: {} };
  const e = easeInOutCubic(p);
  switch (tr.type) {
    case "crossfade":
    case "film_burn":
      return { style: { opacity: e } };
    case "dip_black":
    case "dip_white":
    case "flash":
      return { style: { opacity: p >= 0.5 ? 1 : 0 } };
    case "whip_left":
    case "whip_right":
    case "whip_up":
    case "whip_down": {
      const vertical = tr.type === "whip_up" || tr.type === "whip_down";
      const sign = tr.type === "whip_left" || tr.type === "whip_up" ? 1 : -1;
      const fid = safe(`whip-in-${id}`);
      const blur = Math.sin(Math.PI * p) * 60;
      return {
        style: { transform: vertical ? `translateY(${sign * (1 - e) * 100}%)` : `translateX(${sign * (1 - e) * 100}%)`, filter: `url(#${fid})` },
        defs: dirBlur(fid, blur, vertical),
      };
    }
    case "slide_left":
    case "slide_right":
    case "slide_up": {
      const o = easeOutCubic(p);
      if (tr.type === "slide_up") return { style: { transform: `translateY(${(1 - o) * 100}%)` } };
      return { style: { transform: `translateX(${(tr.type === "slide_left" ? 1 : -1) * (1 - o) * 100}%)` } };
    }
    case "zoom_through":
      return { style: { transform: `scale(${1.8 - 0.8 * easeOutCubic(p)})`, opacity: prog(p, 0.35, 0.6), filter: `blur(${(1 - p) * 18}px)` } };
    case "zoom_out":
      return { style: { transform: `scale(${2 - easeOutCubic(p)})`, opacity: prog(p, 0.3, 0.6), filter: `blur(${(1 - p) * 12}px)` } };
    case "wipe_left":
      return { style: { clipPath: `inset(0 0 0 ${(1 - e) * 100}%)` } };
    case "wipe_right":
      return { style: { clipPath: `inset(0 ${(1 - e) * 100}% 0 0)` } };
    case "iris":
      return { style: { clipPath: `circle(${e * 75}% at 50% 50%)` } };
    case "glitch": {
      const visible = hash(Math.floor(p * 14) + 3) < p * 1.3;
      const jx = (hash(Math.floor(p * 20)) - 0.5) * 8 * (1 - p);
      return { style: { opacity: visible ? 1 : 0, transform: `translateX(${jx}%)`, filter: p < 0.85 ? `hue-rotate(${(1 - p) * 90}deg) saturate(${1 + (1 - p) * 2})` : undefined } };
    }
    case "blur":
      return { style: { opacity: e, filter: `blur(${(1 - e) * 22}px)` } };
    default:
      return { style: { opacity: e } };
  }
}

/** Style for the outgoing shot. q goes 0 → 1 across the transition window. */
export function exitLook(tr: Transition | undefined, q: number, id: string): TransitionLook {
  if (!tr || tr.type === "cut" || q <= 0) return { style: {} };
  const e = easeInOutCubic(q);
  switch (tr.type) {
    case "whip_left":
    case "whip_right":
    case "whip_up":
    case "whip_down": {
      const vertical = tr.type === "whip_up" || tr.type === "whip_down";
      const sign = tr.type === "whip_left" || tr.type === "whip_up" ? -1 : 1;
      const fid = safe(`whip-out-${id}`);
      return {
        style: { transform: vertical ? `translateY(${sign * e * 100}%)` : `translateX(${sign * e * 100}%)`, filter: `url(#${fid})` },
        defs: dirBlur(fid, Math.sin(Math.PI * q) * 60, vertical),
      };
    }
    case "slide_left":
    case "slide_right":
    case "slide_up": {
      const o = easeOutCubic(q);
      if (tr.type === "slide_up") return { style: { transform: `translateY(${-o * 35}%)`, filter: `brightness(${1 - 0.5 * o})` } };
      return { style: { transform: `translateX(${(tr.type === "slide_left" ? -1 : 1) * o * 35}%)`, filter: `brightness(${1 - 0.5 * o})` } };
    }
    case "zoom_through":
      return { style: { transform: `scale(${1 + 2.2 * easeFn("in")(q)})`, filter: `blur(${q * 16}px)` } };
    case "zoom_out":
      return { style: { transform: `scale(${1 - 0.45 * easeFn("in")(q)})`, filter: `blur(${q * 8}px)` } };
    case "blur":
      return { style: { filter: `blur(${e * 22}px)` } };
    default:
      return { style: {} };
  }
}

/** Full-frame overlays that sit above both shots during a transition (dips, flashes, glitch bars, burns). */
export const TransitionOverlay: React.FC<{ tr: Transition; dur: number }> = ({ tr, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = prog(frame / fps, 0, dur);
  const tri = 1 - Math.abs(2 * p - 1);
  switch (tr.type) {
    case "dip_black":
      return <AbsoluteFill style={{ background: tr.color ?? "#000", opacity: Math.min(1, tri * 1.15) }} />;
    case "dip_white":
      return <AbsoluteFill style={{ background: tr.color ?? "#fff", opacity: Math.min(1, tri * 1.15) }} />;
    case "flash":
      return <AbsoluteFill style={{ background: tr.color ?? "#fff", opacity: Math.pow(tri, 0.6) }} />;
    case "glitch": {
      const bars = Array.from({ length: 7 }, (_, i) => {
        const on = hash(frame * 1.3 + i * 7) < 0.55 * tri + 0.1;
        if (!on) return null;
        const y = hash(frame * 2.1 + i) * 100;
        const h = 1 + hash(frame + i * 3) * 7;
        const c = i % 3 === 0 ? "rgba(255,0,80,0.55)" : i % 3 === 1 ? "rgba(0,220,255,0.5)" : "rgba(255,255,255,0.35)";
        return <div key={i} style={{ position: "absolute", left: 0, right: 0, top: `${y}%`, height: `${h}%`, background: c, mixBlendMode: "screen", transform: `translateX(${(hash(i + frame) - 0.5) * 20}%)` }} />;
      });
      return <AbsoluteFill>{bars}</AbsoluteFill>;
    }
    case "film_burn":
      return (
        <AbsoluteFill style={{ mixBlendMode: "screen", opacity: tri }}>
          <AbsoluteFill style={{ background: `radial-gradient(ellipse at ${20 + p * 60}% ${70 - p * 30}%, rgba(255,250,225,1) 0%, rgba(255,150,40,0.95) 28%, rgba(210,40,0,0.7) 55%, transparent 80%)`, filter: "blur(30px)" }} />
        </AbsoluteFill>
      );
    default:
      return null;
  }
};

export const OVERLAY_TRANSITIONS = new Set(["dip_black", "dip_white", "flash", "glitch", "film_burn"]);
