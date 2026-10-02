import React, { useMemo } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import type { CustomProps } from "./types";
import { easeOutBack, prog } from "../lib/easing";
import { hash } from "../lib/noise";
import { font, rgba } from "../lib/theme";

interface Graph {
  nodes: { x: number; y: number; depth: number }[];
  edges: [number, number][];
  maxDepth: number;
}

function build(n: number, seed: number, w: number, h: number): Graph {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const nodes = Array.from({ length: n }, (_, i) => {
    const r = Math.sqrt(i / n) * 0.46;
    const a = i * golden + seed;
    return {
      x: 0.5 + Math.cos(a) * r * (h / w) * 1.7 + (hash(i + seed) - 0.5) * 0.03,
      y: 0.5 + Math.sin(a) * r + (hash(i * 3 + seed) - 0.5) * 0.03,
      depth: -1,
    };
  });
  const edges: [number, number][] = [];
  const seen = new Set<string>();
  nodes.forEach((a, i) => {
    const near = nodes
      .map((b, j) => ({ j, d: Math.hypot((a.x - b.x) * (w / h), a.y - b.y) }))
      .filter((o) => o.j !== i)
      .sort((p, q) => p.d - q.d)
      .slice(0, 3);
    near.forEach(({ j }) => {
      const k = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (!seen.has(k)) {
        seen.add(k);
        edges.push([i, j]);
      }
    });
  });
  // BFS from the hub (node 0) gives the spread order.
  nodes[0].depth = 0;
  const queue = [0];
  while (queue.length) {
    const c = queue.shift()!;
    for (const [a, b] of edges) {
      const o = a === c ? b : b === c ? a : -1;
      if (o >= 0 && nodes[o].depth < 0) {
        nodes[o].depth = nodes[c].depth + 1;
        queue.push(o);
      }
    }
  }
  nodes.forEach((nd) => (nd.depth = nd.depth < 0 ? 1 : nd.depth));
  return { nodes, edges, maxDepth: Math.max(...nodes.map((nd) => nd.depth)) };
}

/**
 * A network that lights up from a central hub outwards: spread, virality,
 * contagion, supply chains, "everything is connected".
 *
 * props: { nodes?: number (default 34), seed?: number, hub_label?: string, spread?: number (0..1 of duration, default 0.7), color?: string }
 */
export const NetworkGraph: React.FC<CustomProps> = ({ t, dur, palette, treatment, props }) => {
  const { width: W, height: H } = useVideoConfig();
  const unit = H / 100;
  const g = useMemo(() => build(props.nodes ?? 34, props.seed ?? 1, W, H), [props.nodes, props.seed, W, H]);
  const span = Math.max(0.5, dur * (props.spread ?? 0.7));
  const step = span / Math.max(1, g.maxDepth);
  const c = props.color ?? palette.accent;
  const at = (i: number) => g.nodes[i].depth * step;
  return (
    <AbsoluteFill>
      <svg width={W} height={H}>
        {g.edges.map(([a, b], i) => {
          const [s, e2] = at(a) <= at(b) ? [a, b] : [b, a];
          const p = prog(t, at(s), at(s) + step);
          if (p <= 0) return null;
          const A = g.nodes[s];
          const B = g.nodes[e2];
          const x2 = A.x + (B.x - A.x) * p;
          const y2 = A.y + (B.y - A.y) * p;
          const pulse = ((t * 0.8 + i * 0.13) % 1);
          return (
            <g key={i}>
              <line x1={A.x * W} y1={A.y * H} x2={x2 * W} y2={y2 * H} stroke={rgba(c.startsWith("#") ? c : palette.accent, 0.55)} strokeWidth={unit * 0.18} />
              {p >= 1 ? <circle cx={(A.x + (B.x - A.x) * pulse) * W} cy={(A.y + (B.y - A.y) * pulse) * H} r={unit * 0.28} fill={palette.fg} opacity={0.8} /> : null}
            </g>
          );
        })}
        {g.nodes.map((nd, i) => {
          const p = prog(t, at(i), at(i) + 0.35);
          if (p <= 0) return null;
          const r = unit * (i === 0 ? 2.2 : 0.7 + hash(i * 7) * 0.7) * easeOutBack(p, 2);
          return (
            <g key={`n${i}`}>
              <circle cx={nd.x * W} cy={nd.y * H} r={r * 2.4} fill={c} opacity={0.12} />
              <circle cx={nd.x * W} cy={nd.y * H} r={r} fill={i === 0 ? c : palette.fg} stroke={c} strokeWidth={unit * 0.15} />
            </g>
          );
        })}
      </svg>
      {props.hub_label ? (
        <div style={{ position: "absolute", left: g.nodes[0].x * W, top: g.nodes[0].y * H + unit * 3.5, transform: "translateX(-50%)", fontFamily: font("mono", treatment), fontWeight: 700, fontSize: unit * 2.4, letterSpacing: "0.16em", color: palette.fg, textShadow: "0 1px 8px rgba(0,0,0,0.8)", opacity: prog(t, 0.2, 0.6) }}>
          {String(props.hub_label).toUpperCase()}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
