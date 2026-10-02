import React, { useMemo } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { geoContains, geoDistance, geoInterpolate, geoOrthographic } from "d3-geo";
import type { CustomProps } from "./types";
import { land, type LonLat } from "./geo";
import { easeFn, easeOutBack, prog } from "../lib/easing";
import { font, rgba } from "../lib/theme";

let _dots: [number, number][] | null = null;

/** Fibonacci-sphere sample of land points (computed once per bundle). */
function landDots(n = 5200): [number, number][] {
  if (_dots) return _dots;
  const L = land();
  const out: [number, number][] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const theta = golden * i;
    const lat = (Math.asin(y) * 180) / Math.PI;
    const lon = ((((theta * 180) / Math.PI) % 360) + 540) % 360 - 180;
    if (geoContains(L, [lon, lat])) out.push([lon, lat]);
  }
  _dots = out;
  return out;
}

/**
 * Rotating dotted Earth with glowing markers and arcs.
 *
 * props: {
 *   from?: {lon, lat}, to?: {lon, lat},     // globe centre at layer start / end (default: slow spin)
 *   spin?: number,                         // extra degrees/second of rotation (default 6 if no `to`)
 *   size?: number,                         // diameter in % of frame height (default 78)
 *   x?: number, y?: number,                // centre in % of frame (default 50, 52)
 *   markers?: {lon, lat, label?, at?}[],
 *   arcs?: {from: {lon,lat}, to: {lon,lat}, at?}[],
 *   dot_color?: string
 * }
 */
export const DotGlobe: React.FC<CustomProps> = ({ t, dur, palette, treatment, props }) => {
  const { width: W, height: H } = useVideoConfig();
  const unit = H / 100;
  const dots = useMemo(() => landDots(), []);
  const R = ((props.size ?? 78) / 100) * H * 0.5;
  const cx = ((props.x ?? 50) / 100) * W;
  const cy = ((props.y ?? 52) / 100) * H;
  const from: LonLat = { lon: 0, lat: 15, ...(props.from ?? {}) };
  const to: LonLat | undefined = props.to;
  const e = easeFn("smooth")(prog(t, 0, Math.max(0.5, dur * 0.85)));
  const spin = props.spin ?? (to ? 0 : 6);
  const lon = (to ? from.lon + (to.lon - from.lon) * e : from.lon) + spin * t;
  const lat = to ? from.lat + (to.lat - from.lat) * e : from.lat;
  const proj = geoOrthographic().scale(R).translate([cx, cy]).rotate([-lon, -lat]);
  const center: [number, number] = [lon, lat];
  const appear = easeOutBack(prog(t, 0, 0.8), 1.1);
  const dotColor = props.dot_color ?? palette.fg;

  const markers: (LonLat & { label?: string; at?: number })[] = props.markers ?? [];
  const arcs: { from: LonLat; to: LonLat; at?: number }[] = props.arcs ?? [];

  return (
    <AbsoluteFill style={{ transform: `scale(${0.85 + 0.15 * appear})`, opacity: Math.min(1, appear * 1.5) }}>
      <svg width={W} height={H}>
        <defs>
          <radialGradient id="globe-ocean" cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor={rgba(palette.accent, 0.12)} />
            <stop offset="60%" stopColor={rgba(palette.bg, 0.9)} />
            <stop offset="100%" stopColor={palette.bg} />
          </radialGradient>
          <radialGradient id="globe-glow" cx="50%" cy="50%" r="50%">
            <stop offset="80%" stopColor={rgba(palette.accent, 0)} />
            <stop offset="92%" stopColor={rgba(palette.accent, 0.25)} />
            <stop offset="100%" stopColor={rgba(palette.accent, 0)} />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={R * 1.12} fill="url(#globe-glow)" />
        <circle cx={cx} cy={cy} r={R} fill="url(#globe-ocean)" stroke={rgba(palette.fg, 0.15)} strokeWidth={1} />
        {dots.map((d, i) => {
          const dist = geoDistance(d, center);
          if (dist > Math.PI / 2) return null;
          const p = proj(d);
          if (!p) return null;
          const facing = Math.cos(dist);
          return <circle key={i} cx={p[0]} cy={p[1]} r={unit * (0.18 + 0.22 * facing)} fill={dotColor} opacity={0.25 + 0.65 * facing} />;
        })}
        {arcs.map((a, i) => {
          const start = a.at ?? 0.8 + i * 0.4;
          const p = easeFn("smooth")(prog(t, start, start + 1.2));
          if (p <= 0) return null;
          const interp = geoInterpolate([a.from.lon, a.from.lat], [a.to.lon, a.to.lat]);
          const pts: string[] = [];
          for (let k = 0; k <= 40 * p; k++) {
            const f = k / 40;
            const ll = interp(f);
            if (geoDistance(ll, center) > Math.PI / 2) continue;
            const q = proj(ll);
            if (!q) continue;
            const lift = 1 + 0.18 * Math.sin(Math.PI * f);
            pts.push(`${cx + (q[0] - cx) * lift},${cy + (q[1] - cy) * lift}`);
          }
          return pts.length > 1 ? <polyline key={`a${i}`} points={pts.join(" ")} fill="none" stroke={palette.accent} strokeWidth={unit * 0.35} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 ${unit * 0.6}px ${palette.accent})` }} /> : null;
        })}
        {markers.map((m, i) => {
          const start = m.at ?? 0.6 + i * 0.3;
          const p = prog(t, start, start + 0.4);
          if (p <= 0 || geoDistance([m.lon, m.lat], center) > Math.PI / 2) return null;
          const q = proj([m.lon, m.lat]);
          if (!q) return null;
          const ring = ((t - start) % 1.5) / 1.5;
          return (
            <g key={`m${i}`}>
              <circle cx={q[0]} cy={q[1]} r={unit * (0.6 + ring * 3)} fill="none" stroke={palette.accent} strokeWidth={unit * 0.2} opacity={1 - ring} />
              <circle cx={q[0]} cy={q[1]} r={unit * 0.8 * easeOutBack(p, 2)} fill={palette.accent} style={{ filter: `drop-shadow(0 0 ${unit}px ${palette.accent})` }} />
            </g>
          );
        })}
      </svg>
      {markers.map((m, i) => {
        const start = m.at ?? 0.6 + i * 0.3;
        if (!m.label || prog(t, start + 0.2, start + 0.5) <= 0 || geoDistance([m.lon, m.lat], center) > Math.PI / 2.2) return null;
        const q = proj([m.lon, m.lat]);
        if (!q) return null;
        return (
          <div key={`ml${i}`} style={{ position: "absolute", left: q[0] + unit * 1.6, top: q[1] - unit * 1.4, fontFamily: font("mono", treatment), fontWeight: 700, fontSize: unit * 2, letterSpacing: "0.14em", color: palette.fg, textShadow: "0 1px 8px rgba(0,0,0,0.8)", opacity: prog(t, start + 0.2, start + 0.5), whiteSpace: "nowrap" }}>
            {m.label.toUpperCase()}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
