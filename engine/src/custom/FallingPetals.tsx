import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import type { CustomProps } from "./types";
import { hash } from "../lib/noise";
import { prog } from "../lib/easing";

const KINDS = {
  petal: { colors: ["#f7c6d0", "#f4b0c0", "#fde2e7"], radius: "60% 0 60% 0", w: 1.0, h: 0.7 },
  leaf: { colors: ["#c8642b", "#e09a3a", "#a8431f"], radius: "0 80% 0 80%", w: 1.2, h: 0.6 },
  confetti: { colors: ["#ffcc33", "#e5484d", "#3e8ef7", "#2fbf71"], radius: "2px", w: 0.6, h: 1.0 },
};

/**
 * Falling, tumbling petals / leaves / confetti drifting on the wind. Cherry
 * blossoms for Japan, autumn leaves for endings, confetti for victories.
 *
 * props: { kind?: "petal" | "leaf" | "confetti", count?: number (default 36),
 *          wind?: number (sideways drift, default 1; negative = leftwards),
 *          speed?: number (fall speed multiplier, default 1), size?: number (default 1),
 *          color?: string (override palette of the kind) }
 */
export const FallingPetals: React.FC<CustomProps> = ({ t, props }) => {
  const { height } = useVideoConfig();
  const unit = height / 100;
  const kind = KINDS[(props.kind as keyof typeof KINDS) ?? "petal"] ?? KINDS.petal;
  const count = props.count ?? 36;
  const wind = props.wind ?? 1;
  const speed = props.speed ?? 1;
  const size = props.size ?? 1;
  const fadeIn = prog(t, 0, 0.6);
  return (
    <AbsoluteFill style={{ overflow: "hidden", opacity: fadeIn }}>
      {Array.from({ length: count }, (_, i) => {
        const r1 = hash(i * 1.71 + 3);
        const r2 = hash(i * 2.93 + 7);
        const r3 = hash(i * 4.37 + 11);
        const depth = 0.5 + r3; // nearer petals are bigger and faster
        const fall = (5 + r2 * 6) * speed * depth;
        const y = ((r1 * 130 + t * fall) % 130) - 15;
        const x = ((r2 * 120 - 10 + t * wind * 3 * depth + Math.sin(t * (0.7 + r1) + i) * 4) % 120 + 120) % 120 - 10;
        const flip = Math.cos(t * (1.5 + r3 * 2.5) + i * 1.3);
        const rot = t * (40 + r1 * 120) * (i % 2 ? 1 : -1) + i * 37;
        const s = (0.9 + r3 * 1.4) * size;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: s * kind.w * 1.6 * unit,
              height: s * kind.h * 1.6 * unit,
              borderRadius: kind.radius,
              background: props.color ?? kind.colors[i % kind.colors.length],
              opacity: 0.55 + 0.45 * r2,
              transform: `rotate(${rot}deg) scaleX(${0.25 + 0.75 * Math.abs(flip)})`,
              boxShadow: `0 ${unit * 0.2}px ${unit * 0.6}px rgba(0,0,0,0.15)`,
              filter: depth > 1.3 ? "blur(1px)" : undefined,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
