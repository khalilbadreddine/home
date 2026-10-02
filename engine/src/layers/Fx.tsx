import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { FxLayer } from "../types";
import { useShot } from "../lib/context";
import { color, font, rgba } from "../lib/theme";
import { easeOutCubic, prog } from "../lib/easing";
import { hash } from "../lib/noise";
import { useLayerTime } from "../lib/hooks";

const safeId = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, "");

export const Grain: React.FC<{ intensity: number; id: string }> = ({ intensity, id }) => {
  const frame = useCurrentFrame();
  const fid = safeId(`grain-${id}`);
  return (
    <AbsoluteFill style={{ opacity: Math.min(0.5, 0.08 + intensity * 0.32), mixBlendMode: "overlay", pointerEvents: "none" }}>
      <svg width="100%" height="100%">
        <filter id={fid}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={frame % 97} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${fid})`} />
      </svg>
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{ intensity: number }> = ({ intensity }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, transparent ${55 - intensity * 25}%, rgba(0,0,0,${0.35 + intensity * 0.5}) 100%)` }} />
);

export const FxView: React.FC<{ layer: FxLayer; idHint: string }> = ({ layer, idHint }) => {
  const { palette, treatment, seed: shotSeed } = useShot();
  const { t, dur, shotT, height, width, frame } = useLayerTime();
  const unit = height / 100;
  const k = layer.intensity ?? 0.5;
  const seed = layer.seed ?? shotSeed;

  switch (layer.effect) {
    case "grain":
      return <Grain intensity={k} id={idHint} />;
    case "vignette":
      return <Vignette intensity={k} />;
    case "light_leak": {
      const blobs = [
        { c: "255,122,24", x: 15 + Math.sin(shotT * 0.5 + seed) * 25, y: 20 + Math.cos(shotT * 0.4) * 15, s: 70 },
        { c: "255,45,85", x: 85 + Math.cos(shotT * 0.35 + seed) * 15, y: 70 + Math.sin(shotT * 0.45) * 20, s: 55 },
        { c: "255,211,107", x: 60 + Math.sin(shotT * 0.6) * 30, y: 10, s: 45 },
      ];
      const breathe = 0.75 + 0.25 * Math.sin(shotT * 1.3 + seed);
      return (
        <AbsoluteFill style={{ mixBlendMode: "screen", opacity: k * 0.9 * breathe, overflow: "hidden" }}>
          {blobs.map((b, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${b.x}%`,
                top: `${b.y}%`,
                width: `${b.s}%`,
                aspectRatio: "1.4",
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                background: `radial-gradient(ellipse at center, rgba(${b.c},0.9) 0%, rgba(${b.c},0) 70%)`,
                filter: `blur(${unit * 4}px)`,
              }}
            />
          ))}
        </AbsoluteFill>
      );
    }
    case "letterbox": {
      const target = Math.max(0, (1 - width / height / 2.39) / 2) * 100 * (0.6 + 0.4 * k);
      const h = target * easeOutCubic(prog(t, 0, 0.6));
      return (
        <AbsoluteFill>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: `${h}%`, background: "#000" }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${h}%`, background: "#000" }} />
        </AbsoluteFill>
      );
    }
    case "flash": {
      const o = Math.pow(1 - prog(t, 0, 0.12 + 0.35 * k), 2);
      return <AbsoluteFill style={{ background: color(layer.color, palette, "#ffffff"), opacity: o }} />;
    }
    case "scanlines":
      return (
        <AbsoluteFill
          style={{
            background: `repeating-linear-gradient(0deg, rgba(0,0,0,${0.15 + k * 0.3}) 0px, rgba(0,0,0,${0.15 + k * 0.3}) ${Math.max(1, unit * 0.15)}px, transparent ${Math.max(1, unit * 0.15)}px, transparent ${Math.max(2, unit * 0.4)}px)`,
            opacity: 0.85 + 0.15 * Math.sin(frame * 1.7),
          }}
        />
      );
    case "vhs": {
      const bandY = ((shotT * 0.35 + seed * 0.1) % 1.2) * 100 - 10;
      const jitter = hash(frame + seed) < 0.15 ? (hash(frame * 3) - 0.5) * unit * 1.2 : 0;
      return (
        <AbsoluteFill style={{ transform: `translateX(${jitter}px)` }}>
          <AbsoluteFill style={{ background: `repeating-linear-gradient(0deg, rgba(0,0,0,0.25) 0px, rgba(0,0,0,0.25) 2px, transparent 2px, transparent 4px)` }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: `${bandY}%`, height: "7%", background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.12), transparent)", mixBlendMode: "screen" }} />
          <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(255,0,80,0.08), rgba(0,200,255,0.08))", mixBlendMode: "screen", opacity: k }} />
          <div style={{ position: "absolute", left: unit * 4, bottom: unit * 5, fontFamily: font("mono", treatment), fontSize: unit * 3, color: "rgba(255,255,255,0.85)", textShadow: "2px 0 rgba(255,0,0,0.6), -2px 0 rgba(0,200,255,0.6)" }}>
            PLAY ▶
          </div>
        </AbsoluteFill>
      );
    }
    case "dust": {
      const specks = Array.from({ length: Math.round(6 + k * 18) }, (_, i) => {
        const h1 = hash(frame * 13.1 + i * 7.7 + seed);
        if (h1 > 0.55) return null;
        const x = hash(frame * 3.3 + i * 1.9 + seed) * 100;
        const y = hash(frame * 5.7 + i * 2.3 + seed) * 100;
        const s = 0.15 + hash(i * 9.1 + frame) * 0.5;
        const hair = hash(i * 4.4 + frame * 1.1) > 0.85;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: hair ? unit * 0.15 : unit * s,
              height: hair ? unit * (2 + s * 6) : unit * s,
              borderRadius: hair ? unit : "50%",
              background: hash(i + frame) > 0.5 ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)",
              transform: hair ? `rotate(${hash(i * 2 + frame) * 180}deg)` : undefined,
            }}
          />
        );
      });
      const scratch = hash(frame * 0.7 + seed) < 0.25 ? hash(Math.floor(frame / 3) + seed) * 100 : -10;
      return (
        <AbsoluteFill style={{ opacity: 0.4 + k * 0.5 }}>
          {specks}
          <div style={{ position: "absolute", left: `${scratch}%`, top: 0, bottom: 0, width: Math.max(1, unit * 0.1), background: "rgba(255,255,255,0.35)" }} />
        </AbsoluteFill>
      );
    }
    case "film_burn": {
      const p = prog(t, 0, Math.max(0.3, dur));
      const o = Math.sin(p * Math.PI) * (0.6 + 0.4 * k);
      return (
        <AbsoluteFill style={{ mixBlendMode: "screen", opacity: o }}>
          <AbsoluteFill style={{ background: `radial-gradient(ellipse at ${10 + p * 70}% ${80 - p * 40}%, rgba(255,250,220,1) 0%, rgba(255,140,30,0.9) 25%, rgba(200,30,0,0.6) 50%, transparent 75%)`, filter: `blur(${unit * 2}px)` }} />
        </AbsoluteFill>
      );
    }
    case "particles": {
      const kind = layer.kind ?? "bokeh";
      const n = kind === "bokeh" ? 14 : kind === "snow" ? 70 : 45;
      return (
        <AbsoluteFill style={{ mixBlendMode: "screen", opacity: 0.35 + 0.65 * k, overflow: "hidden" }}>
          {Array.from({ length: n }, (_, i) => {
            const r1 = hash(i * 1.37 + seed);
            const r2 = hash(i * 2.71 + seed);
            const r3 = hash(i * 3.97 + seed);
            let x = r1 * 100;
            let y = r2 * 100;
            let size = unit * 0.4;
            let bg = "rgba(255,255,255,0.8)";
            let blur = 0;
            let op = 1;
            if (kind === "bokeh") {
              size = unit * (4 + r3 * 10);
              x += Math.sin(shotT * 0.2 + i) * 3;
              y = ((r2 * 100 - shotT * (1 + r3 * 2)) % 110 + 110) % 110 - 5;
              bg = `radial-gradient(circle, ${rgba(i % 3 === 0 ? palette.accent : "#ffffff", 0.35)} 0%, transparent 70%)`;
              blur = unit * 0.5;
            } else if (kind === "embers") {
              size = unit * (0.2 + r3 * 0.5);
              y = 105 - (((shotT * (6 + r3 * 10) + r2 * 110) % 110));
              x += Math.sin(shotT * (1 + r3) + i) * 2;
              bg = r3 > 0.5 ? "rgba(255,170,60,1)" : "rgba(255,90,30,1)";
              op = 0.5 + 0.5 * Math.sin(shotT * 8 + i * 3);
              blur = unit * 0.1;
            } else if (kind === "snow") {
              size = unit * (0.2 + r3 * 0.6);
              y = ((shotT * (4 + r3 * 6) + r2 * 110) % 110) - 5;
              x += Math.sin(shotT * 0.8 + i) * 1.5;
              op = 0.6 + 0.4 * r3;
            } else {
              size = unit * (0.1 + r3 * 0.25);
              x += Math.sin(shotT * 0.3 + i * 1.3) * 4;
              y += Math.cos(shotT * 0.25 + i) * 3;
              op = 0.25 + 0.5 * Math.abs(Math.sin(shotT * 0.7 + i));
            }
            return (
              <div
                key={i}
                style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: size, height: size, borderRadius: "50%", background: bg, filter: blur ? `blur(${blur}px)` : undefined, opacity: op }}
              />
            );
          })}
        </AbsoluteFill>
      );
    }
    case "tint":
      return (
        <AbsoluteFill
          style={{ background: color(layer.color, palette, palette.accent), mixBlendMode: (layer.blend ?? "soft-light") as React.CSSProperties["mixBlendMode"], opacity: k }}
        />
      );
    case "viewfinder": {
      const c = "rgba(255,255,255,0.85)";
      const L = unit * 5;
      const m = unit * 5;
      const bw = Math.max(2, unit * 0.3);
      const corner = (s: React.CSSProperties) => <div style={{ position: "absolute", width: L, height: L, ...s }} />;
      return (
        <AbsoluteFill style={{ opacity: 0.6 + 0.4 * k }}>
          {corner({ left: m, top: m, borderLeft: `${bw}px solid ${c}`, borderTop: `${bw}px solid ${c}` })}
          {corner({ right: m, top: m, borderRight: `${bw}px solid ${c}`, borderTop: `${bw}px solid ${c}` })}
          {corner({ left: m, bottom: m, borderLeft: `${bw}px solid ${c}`, borderBottom: `${bw}px solid ${c}` })}
          {corner({ right: m, bottom: m, borderRight: `${bw}px solid ${c}`, borderBottom: `${bw}px solid ${c}` })}
          <div style={{ position: "absolute", left: "50%", top: "50%", width: unit * 3, height: bw, background: c, transform: "translate(-50%,-50%)" }} />
          <div style={{ position: "absolute", left: "50%", top: "50%", width: bw, height: unit * 3, background: c, transform: "translate(-50%,-50%)" }} />
          <div style={{ position: "absolute", right: m + unit, top: m + unit, fontFamily: font("mono", treatment), fontSize: unit * 2, color: c }}>4K · 24FPS</div>
        </AbsoluteFill>
      );
    }
    case "rec": {
      const on = Math.floor(shotT * 1.6) % 2 === 0;
      const total = Math.max(0, shotT);
      const tc = `${String(Math.floor(total / 3600)).padStart(2, "0")}:${String(Math.floor(total / 60) % 60).padStart(2, "0")}:${String(Math.floor(total) % 60).padStart(2, "0")}:${String(Math.floor((total % 1) * 24)).padStart(2, "0")}`;
      return (
        <AbsoluteFill>
          <div style={{ position: "absolute", left: unit * 5, top: unit * 5, display: "flex", alignItems: "center", gap: unit, fontFamily: font("mono", treatment), fontWeight: 700, fontSize: unit * 2.8, color: "#fff", textShadow: "0 1px 6px rgba(0,0,0,0.6)" }}>
            <div style={{ width: unit * 2, height: unit * 2, borderRadius: "50%", background: on ? "#ff2a2a" : "transparent" }} />
            REC
          </div>
          <div style={{ position: "absolute", right: unit * 5, top: unit * 5, fontFamily: font("mono", treatment), fontSize: unit * 2.6, color: "#fff", textShadow: "0 1px 6px rgba(0,0,0,0.6)" }}>{tc}</div>
        </AbsoluteFill>
      );
    }
    case "scrim": {
      const a = 0.35 + 0.55 * k;
      const side = layer.side ?? "bottom";
      const bg =
        side === "full"
          ? `rgba(0,0,0,${a})`
          : side === "center"
            ? `radial-gradient(ellipse at center, rgba(0,0,0,${a}) 0%, transparent 70%)`
            : `linear-gradient(to ${side === "bottom" ? "top" : side === "top" ? "bottom" : side === "left" ? "right" : "left"}, rgba(0,0,0,${a}) 0%, rgba(0,0,0,${a * 0.6}) 25%, transparent 60%)`;
      return <AbsoluteFill style={{ background: bg }} />;
    }
    default:
      return null;
  }
};
