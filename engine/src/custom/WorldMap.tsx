import React, { useMemo } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { geoInterpolate, geoMercator, geoPath } from "d3-geo";
import type { CustomProps } from "./types";
import { countries, type LonLat } from "./geo";
import { easeFn, easeOutBack, easeOutCubic, prog } from "../lib/easing";
import { font, rgba } from "../lib/theme";

interface View extends LonLat {
  zoom: number;
}

const STYLES = {
  dark: { ocean: "#0a0f17", land: "#1f2733", border: "rgba(255,255,255,0.12)", label: "rgba(255,255,255,0.7)" },
  paper: { ocean: "#d9cfb8", land: "#efe7d4", border: "rgba(80,60,30,0.35)", label: "rgba(50,40,20,0.8)" },
  blueprint: { ocean: "#0b2a4a", land: "#123d66", border: "rgba(160,210,255,0.35)", label: "rgba(200,230,255,0.85)" },
  light: { ocean: "#e8edf2", land: "#ffffff", border: "rgba(0,0,0,0.15)", label: "rgba(0,0,0,0.7)" },
};

/**
 * Real world map (Natural Earth 1:50m) with an animated camera, highlighted
 * countries, dropping pins and travelling route arcs. No image assets needed.
 *
 * props: {
 *   style?: "dark" | "paper" | "blueprint" | "light",
 *   from?: {lon, lat, zoom}, to?: {lon, lat, zoom},       // camera move (zoom 1 = whole world)
 *   highlight?: string[], highlight2?: string[],           // country names (Natural Earth names, e.g. "Morocco", "United States of America")
 *   markers?: {lon, lat, label?, at?}[],                   // at = seconds after layer start
 *   routes?: {from: {lon,lat}, to: {lon,lat}, at?, label?}[],
 *   labels?: {lon, lat, text}[]
 * }
 */
export const WorldMap: React.FC<CustomProps> = ({ t, dur, palette, treatment, props }) => {
  const { width: W, height: H } = useVideoConfig();
  const unit = H / 100;
  const st = STYLES[(props.style as keyof typeof STYLES) ?? "dark"] ?? STYLES.dark;
  const from: View = { lon: 10, lat: 25, zoom: 1, ...(props.from ?? {}) };
  const to: View = { ...from, ...(props.to ?? {}) };
  const e = easeFn("smooth")(prog(t, 0, Math.max(0.5, dur * 0.9)));
  const view: View = {
    lon: from.lon + (to.lon - from.lon) * e,
    lat: from.lat + (to.lat - from.lat) * e,
    zoom: Math.exp(Math.log(from.zoom) + (Math.log(to.zoom) - Math.log(from.zoom)) * e),
  };
  const proj = geoMercator()
    .center([view.lon, view.lat])
    .scale((W / (2 * Math.PI)) * view.zoom * 1.05)
    .translate([W / 2, H / 2]);
  const path = geoPath(proj);
  const fc = useMemo(() => countries(), []);
  const hl = new Set<string>((props.highlight ?? []).map((s: string) => s.toLowerCase()));
  const hl2 = new Set<string>((props.highlight2 ?? []).map((s: string) => s.toLowerCase()));
  const hlP = easeOutCubic(prog(t, 0.3, 1.1));

  const markers: (LonLat & { label?: string; at?: number })[] = props.markers ?? [];
  const routes: { from: LonLat; to: LonLat; at?: number; label?: string }[] = props.routes ?? [];

  return (
    <AbsoluteFill style={{ background: st.ocean }}>
      <svg width={W} height={H}>
        {fc.features.map((f, i) => {
          const name = (f.properties?.name ?? "").toLowerCase();
          const isHl = hl.has(name);
          const isHl2 = hl2.has(name);
          const d = path(f);
          if (!d) return null;
          const fill = isHl ? palette.accent : isHl2 ? palette.accent2 ?? palette.accent : st.land;
          return (
            <path
              key={i}
              d={d}
              fill={isHl || isHl2 ? fill : st.land}
              fillOpacity={isHl || isHl2 ? 0.2 + 0.65 * hlP : 1}
              stroke={isHl || isHl2 ? fill : st.border}
              strokeWidth={isHl || isHl2 ? 1.5 : 0.8}
            />
          );
        })}
        {routes.map((r, i) => {
          const start = r.at ?? 0.6 + i * 0.5;
          const p = easeFn("smooth")(prog(t, start, start + 1.2));
          if (p <= 0) return null;
          const interp = geoInterpolate([r.from.lon, r.from.lat], [r.to.lon, r.to.lat]);
          const pts: [number, number][] = [];
          const a = proj([r.from.lon, r.from.lat]);
          const b = proj([r.to.lon, r.to.lat]);
          if (!a || !b) return null;
          const dist = Math.hypot(b[0] - a[0], b[1] - a[1]);
          for (let k = 0; k <= 48 * p; k++) {
            const f = k / 48;
            const q = proj(interp(f));
            if (!q) continue;
            pts.push([q[0], q[1] - Math.sin(Math.PI * f) * dist * 0.18]);
          }
          if (pts.length < 2) return null;
          const head = pts[pts.length - 1];
          return (
            <g key={`r${i}`}>
              <polyline points={pts.map((q) => q.join(",")).join(" ")} fill="none" stroke={palette.accent} strokeWidth={unit * 0.4} strokeLinecap="round" strokeDasharray={`${unit * 1.2} ${unit * 0.8}`} />
              <circle cx={head[0]} cy={head[1]} r={unit * 0.7} fill={palette.fg} stroke={palette.accent} strokeWidth={unit * 0.25} />
            </g>
          );
        })}
      </svg>
      {(props.labels ?? []).map((l: LonLat & { text: string }, i: number) => {
        const q = proj([l.lon, l.lat]);
        if (!q) return null;
        return (
          <div key={`l${i}`} style={{ position: "absolute", left: q[0], top: q[1], transform: "translate(-50%,-50%)", fontFamily: font("mono", treatment), fontWeight: 700, fontSize: unit * 2.6, letterSpacing: "0.3em", color: st.label, textShadow: "0 1px 8px rgba(0,0,0,0.6)", opacity: prog(t, 0.2, 0.7), whiteSpace: "nowrap" }}>
            {l.text.toUpperCase()}
          </div>
        );
      })}
      {markers.map((m, i) => {
        const q = proj([m.lon, m.lat]);
        if (!q) return null;
        const start = m.at ?? 0.5 + i * 0.35;
        const p = prog(t, start, start + 0.45);
        if (p <= 0) return null;
        const ring = ((t - start) % 1.4) / 1.4;
        return (
          <div key={`m${i}`} style={{ position: "absolute", left: q[0], top: q[1] }}>
            <div style={{ position: "absolute", width: unit * 6, height: unit * 6, left: -unit * 3, top: -unit * 3, borderRadius: "50%", border: `${unit * 0.25}px solid ${palette.accent}`, transform: `scale(${0.2 + ring})`, opacity: (1 - ring) * p }} />
            <div style={{ position: "absolute", width: unit * 1.6, height: unit * 1.6, left: -unit * 0.8, top: -unit * 0.8, borderRadius: "50%", background: palette.accent, boxShadow: `0 0 ${unit * 2}px ${palette.accent}`, transform: `scale(${easeOutBack(p, 2)})` }} />
            {m.label ? (
              <div
                style={{
                  position: "absolute",
                  left: unit * 1.8,
                  top: -unit * 1.6,
                  fontFamily: font("mono", treatment),
                  fontWeight: 700,
                  fontSize: unit * 2.2,
                  letterSpacing: "0.12em",
                  color: palette.fg,
                  background: rgba(palette.bg, 0.8),
                  padding: `${unit * 0.3}px ${unit * 0.9}px`,
                  borderLeft: `${unit * 0.35}px solid ${palette.accent}`,
                  whiteSpace: "nowrap",
                  clipPath: `inset(0 ${(1 - easeOutCubic(prog(t, start + 0.2, start + 0.6))) * 100}% 0 0)`,
                }}
              >
                {m.label.toUpperCase()}
              </div>
            ) : null}
          </div>
        );
      })}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.45) 100%)" }} />
    </AbsoluteFill>
  );
};
