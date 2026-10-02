import React from "react";
import { AbsoluteFill } from "remotion";
import type { AnnotationLayer, Point } from "../types";
import { useShot } from "../lib/context";
import { color, font, rgba } from "../lib/theme";
import { easeFn, easeOutBack, easeOutCubic, prog } from "../lib/easing";
import { noise1 } from "../lib/noise";
import { useLayerTime } from "../lib/hooks";

type P = [number, number];

function catmull(points: P[], steps = 12): P[] {
  if (points.length < 3) return points;
  const out: P[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

const toPath = (pts: P[]) => pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");

function pointAt(pts: P[], frac: number): { p: P; angle: number } {
  const lens: number[] = [0];
  for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = lens[lens.length - 1] || 1;
  const target = frac * total;
  for (let i = 1; i < pts.length; i++) {
    if (lens[i] >= target) {
      const seg = lens[i] - lens[i - 1] || 1;
      const k = (target - lens[i - 1]) / seg;
      const a = pts[i - 1];
      const b = pts[i];
      return { p: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k], angle: Math.atan2(b[1] - a[1], b[0] - a[0]) };
    }
  }
  const n = pts.length;
  return { p: pts[n - 1], angle: n > 1 ? Math.atan2(pts[n - 1][1] - pts[n - 2][1], pts[n - 1][0] - pts[n - 2][0]) : 0 };
}

/** Add a marker-pen wobble to a polyline. */
function wobble(pts: P[], amp: number, seed: number): P[] {
  return pts.map((p, i) => [p[0] + noise1(i * 0.35, seed) * amp, p[1] + noise1(i * 0.35, seed + 50) * amp]);
}

export const AnnotationView: React.FC<{ layer: AnnotationLayer }> = ({ layer }) => {
  const { palette, treatment, seed } = useShot();
  const { t, width: W, height: H } = useLayerTime();
  const unit = H / 100;
  const px = (pt: Point): P => [(pt.x / 100) * W, (pt.y / 100) * H];
  const stroke = (layer.stroke ?? 6) * (H / 1080);
  const c = color(layer.color, palette, palette.accent);
  const drawDur = layer.draw_duration ?? 0.6;
  const p = easeFn("smooth")(prog(t, 0, Math.max(0.01, drawDur)));
  const hand = layer.hand_drawn ?? true;
  const amp = hand ? stroke * 0.5 : 0;
  const s = seed + 17;

  const at = layer.at ? px(layer.at) : ([W / 2, H / 2] as P);
  const r = (layer.radius ?? 9) * unit;
  const pts = (layer.points ?? []).map(px);
  const box = layer.box
    ? { x: (layer.box.x / 100) * W, y: (layer.box.y / 100) * H, w: (layer.box.w / 100) * W, h: (layer.box.h / 100) * H }
    : pts.length >= 2
      ? { x: Math.min(pts[0][0], pts[1][0]), y: Math.min(pts[0][1], pts[1][1]), w: Math.abs(pts[1][0] - pts[0][0]), h: Math.abs(pts[1][1] - pts[0][1]) }
      : { x: at[0] - r * 1.4, y: at[1] - r, w: r * 2.8, h: r * 2 };

  const strokeProps = {
    fill: "none",
    stroke: c,
    strokeWidth: stroke,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    pathLength: 1,
    strokeDasharray: 1,
    strokeDashoffset: 1 - p,
    style: { filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.45))" },
  };

  const labelChip = (x: number, y: number, anchor: "left" | "right" | "center" = "left") =>
    layer.label ? (
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          transform: `translate(${anchor === "left" ? "0" : anchor === "right" ? "-100%" : "-50%"}, -50%)`,
          fontFamily: font("accent", treatment),
          fontSize: unit * 3.6,
          color: c,
          whiteSpace: "nowrap",
          opacity: easeOutCubic(prog(t, drawDur * 0.7, drawDur + 0.3)),
          textShadow: "0 2px 10px rgba(0,0,0,0.6)",
        }}
      >
        {layer.label}
      </div>
    ) : null;

  let svg: React.ReactNode = null;
  let extra: React.ReactNode = null;

  switch (layer.shape) {
    case "circle": {
      const ring: P[] = [];
      const a0 = -1.9;
      for (let i = 0; i <= 64; i++) {
        const a = a0 + (i / 64) * Math.PI * 2.12;
        const rr = 1 + (hand ? noise1(i * 0.2, s) * 0.05 : 0);
        ring.push([at[0] + Math.cos(a) * r * 1.35 * rr, at[1] + Math.sin(a) * r * rr]);
      }
      svg = <path d={toPath(ring)} {...strokeProps} />;
      extra = labelChip(at[0] + r * 1.5, at[1] - r * 0.6);
      break;
    }
    case "box": {
      const o = hand ? stroke : 0;
      const corners: P[] = [
        [box.x - o, box.y],
        [box.x + box.w, box.y - o * 0.5],
        [box.x + box.w + o * 0.5, box.y + box.h],
        [box.x, box.y + box.h + o * 0.3],
        [box.x + o * 0.5, box.y - o * 1.2],
      ];
      const dense: P[] = [];
      for (let i = 0; i < corners.length - 1; i++) {
        for (let k = 0; k < 10; k++) {
          const f = k / 10;
          dense.push([corners[i][0] + (corners[i + 1][0] - corners[i][0]) * f, corners[i][1] + (corners[i + 1][1] - corners[i][1]) * f]);
        }
      }
      dense.push(corners[corners.length - 1]);
      svg = <path d={toPath(wobble(dense, amp * 0.6, s))} {...strokeProps} />;
      extra = labelChip(box.x, box.y - unit * 3);
      break;
    }
    case "underline": {
      const a = pts[0] ?? [box.x, box.y + box.h];
      const b = pts[1] ?? [box.x + box.w, box.y + box.h];
      const line: P[] = [];
      for (let i = 0; i <= 24; i++) {
        const f = i / 24;
        line.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f + Math.sin(f * Math.PI) * stroke * 0.8]);
      }
      svg = <path d={toPath(wobble(line, amp * 0.5, s))} {...strokeProps} />;
      extra = labelChip((a[0] + b[0]) / 2, Math.max(a[1], b[1]) + unit * 4, "center");
      break;
    }
    case "arrow": {
      const a = pts[0] ?? [at[0] - r * 2, at[1] + r * 1.5];
      const b = pts[1] ?? at;
      const mid: P = [(a[0] + b[0]) / 2 + (b[1] - a[1]) * 0.12, (a[1] + b[1]) / 2 - (b[0] - a[0]) * 0.12];
      const line = catmull([a, mid, b], 10);
      const head = pointAt(line, 1);
      const hl = stroke * 4.5;
      const hp = prog(t, drawDur * 0.75, drawDur + 0.15);
      const h1: P = [head.p[0] - Math.cos(head.angle - 0.5) * hl, head.p[1] - Math.sin(head.angle - 0.5) * hl];
      const h2: P = [head.p[0] - Math.cos(head.angle + 0.5) * hl, head.p[1] - Math.sin(head.angle + 0.5) * hl];
      svg = (
        <>
          <path d={toPath(wobble(line, amp * 0.4, s))} {...strokeProps} />
          <path d={toPath([h1, head.p, h2])} {...strokeProps} strokeDashoffset={1 - hp} />
        </>
      );
      extra = labelChip(a[0], a[1] + unit * 3, "center");
      break;
    }
    case "cross": {
      const l1: P[] = [
        [box.x, box.y],
        [box.x + box.w, box.y + box.h],
      ];
      const l2: P[] = [
        [box.x + box.w, box.y],
        [box.x, box.y + box.h],
      ];
      const p1 = easeFn("snap")(prog(t, 0, drawDur * 0.5));
      const p2 = easeFn("snap")(prog(t, drawDur * 0.5, drawDur));
      svg = (
        <>
          <path d={toPath(l1)} {...strokeProps} strokeWidth={stroke * 1.6} strokeDashoffset={1 - p1} />
          <path d={toPath(l2)} {...strokeProps} strokeWidth={stroke * 1.6} strokeDashoffset={1 - p2} />
        </>
      );
      break;
    }
    case "route": {
      const line = catmull(pts.length >= 2 ? pts : [at, [at[0] + r * 3, at[1]]], 14);
      const head = pointAt(line, p);
      const maskId = `route-${s}-${(layer.id ?? "r").replace(/[^a-z0-9]/gi, "")}`;
      svg = (
        <>
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
              <path d={toPath(line)} fill="none" stroke="#fff" strokeWidth={stroke * 3} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
            </mask>
          </defs>
          <path
            d={toPath(line)}
            fill="none"
            stroke={c}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={layer.dashed ? `${stroke * 2.5} ${stroke * 2}` : undefined}
            mask={`url(#${maskId})`}
            style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.5))" }}
          />
          <circle cx={line[0][0]} cy={line[0][1]} r={stroke * 1.4} fill={c} />
          {p > 0 ? <circle cx={head.p[0]} cy={head.p[1]} r={stroke * (1.6 + 0.4 * Math.sin(t * 10))} fill={palette.fg} stroke={c} strokeWidth={stroke * 0.6} /> : null}
        </>
      );
      const end = line[line.length - 1];
      extra = labelChip(end[0] + unit * 2, end[1] - unit * 2.5);
      break;
    }
    case "pin": {
      const drop = easeOutBack(prog(t, 0, 0.5), 2.2);
      const yOff = (1 - drop) * -H * 0.12;
      const size = unit * 4.2;
      const ring = (t % 1.4) / 1.4;
      svg = (
        <>
          <ellipse cx={at[0]} cy={at[1]} rx={size * 0.45 * drop} ry={size * 0.14 * drop} fill="rgba(0,0,0,0.45)" />
          {t > 0.5 ? <circle cx={at[0]} cy={at[1]} r={size * (0.3 + ring * 1.4)} fill="none" stroke={c} strokeWidth={stroke * 0.6} opacity={1 - ring} /> : null}
          <g transform={`translate(${at[0]}, ${at[1] + yOff})`} opacity={Math.min(1, prog(t, 0, 0.1) * 2)}>
            <path
              d={`M0,0 C${-size * 0.15},${-size * 0.45} ${-size * 0.55},${-size * 0.7} ${-size * 0.55},${-size * 1.1} A${size * 0.55},${size * 0.55} 0 1 1 ${size * 0.55},${-size * 1.1} C${size * 0.55},${-size * 0.7} ${size * 0.15},${-size * 0.45} 0,0 Z`}
              fill={c}
              stroke="rgba(0,0,0,0.35)"
              strokeWidth={stroke * 0.3}
            />
            <circle cx={0} cy={-size * 1.1} r={size * 0.22} fill={palette.bg} />
          </g>
        </>
      );
      extra = layer.label ? (
        <div
          style={{
            position: "absolute",
            left: at[0] + size * 0.9,
            top: at[1] - size * 1.1,
            transform: "translateY(-50%)",
            fontFamily: font("mono", treatment),
            fontWeight: 700,
            fontSize: unit * 2.4,
            letterSpacing: "0.12em",
            color: palette.fg,
            background: rgba(palette.bg, 0.8),
            borderLeft: `${unit * 0.4}px solid ${c}`,
            padding: `${unit * 0.4}px ${unit * 1}px`,
            whiteSpace: "nowrap",
            clipPath: `inset(0 ${(1 - easeOutCubic(prog(t, 0.45, 0.85))) * 100}% 0 0)`,
          }}
        >
          {layer.label.toUpperCase()}
        </div>
      ) : null;
      break;
    }
    case "bracket": {
      const x = box.x;
      const tick = unit * 2;
      const line: P[] = [
        [x + tick, box.y],
        [x, box.y],
        [x, box.y + box.h],
        [x + tick, box.y + box.h],
      ];
      svg = <path d={toPath(line)} {...strokeProps} />;
      extra = labelChip(x - unit * 1.5, box.y + box.h / 2, "right");
      break;
    }
    case "spotlight": {
      const o = easeOutCubic(prog(t, 0, Math.max(0.2, drawDur)));
      const ex = (at[0] / W) * 100;
      const ey = (at[1] / H) * 100;
      return (
        <AbsoluteFill>
          <AbsoluteFill
            style={{
              background: `radial-gradient(circle ${r * (1.6 - 0.3 * o)}px at ${ex}% ${ey}%, transparent 0%, transparent 70%, rgba(0,0,0,${0.78 * o}) 100%)`,
            }}
          />
          {labelChip(at[0], at[1] + r * 1.5, "center")}
        </AbsoluteFill>
      );
    }
    case "highlight": {
      const w = box.w * p;
      return (
        <AbsoluteFill>
          <div
            style={{
              position: "absolute",
              left: box.x,
              top: box.y,
              width: w,
              height: box.h,
              background: rgba(c.startsWith("#") ? c : palette.accent, 0.55),
              mixBlendMode: "multiply",
              borderRadius: unit * 0.3,
              transform: "skewX(-4deg)",
            }}
          />
          {labelChip(box.x, box.y - unit * 3)}
        </AbsoluteFill>
      );
    }
  }

  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {svg}
      </svg>
      {extra}
    </AbsoluteFill>
  );
};
