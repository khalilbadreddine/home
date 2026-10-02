import type { CSSProperties } from "react";
import type { Anim } from "../types";
import { easeOutBack, easeOutCubic, prog } from "./easing";

interface Parts {
  opacity: number;
  transforms: string[];
  filters: string[];
  clip?: string;
}

function apply(a: Anim | undefined, p: number, entering: boolean, parts: Parts) {
  if (!a || a.type === "none" || a.type === "draw") return;
  // p: 0 = fully hidden, 1 = fully shown
  const e = easeOutCubic(p);
  const dist = entering ? 1 : -1;
  switch (a.type) {
    case "fade":
      parts.opacity *= e;
      break;
    case "pop":
      parts.opacity *= Math.min(1, p * 3);
      parts.transforms.push(`scale(${entering ? 0.55 + 0.45 * easeOutBack(p) : 0.8 + 0.2 * e})`);
      break;
    case "slide_up":
      parts.opacity *= e;
      parts.transforms.push(`translateY(${(1 - e) * 6 * dist}%)`);
      break;
    case "slide_down":
      parts.opacity *= e;
      parts.transforms.push(`translateY(${-(1 - e) * 6 * dist}%)`);
      break;
    case "slide_left":
      parts.opacity *= e;
      parts.transforms.push(`translateX(${(1 - e) * 6 * dist}%)`);
      break;
    case "slide_right":
      parts.opacity *= e;
      parts.transforms.push(`translateX(${-(1 - e) * 6 * dist}%)`);
      break;
    case "scale_up":
      parts.opacity *= e;
      parts.transforms.push(`scale(${1.18 - 0.18 * e})`);
      break;
    case "scale_down":
      parts.opacity *= e;
      parts.transforms.push(`scale(${0.82 + 0.18 * e})`);
      break;
    case "blur":
      parts.opacity *= e;
      parts.filters.push(`blur(${(1 - e) * 24}px)`);
      break;
    case "wipe_right":
      parts.clip = entering ? `inset(0 ${(1 - e) * 100}% 0 0)` : `inset(0 0 0 ${(1 - e) * 100}%)`;
      break;
    case "wipe_up":
      parts.clip = entering ? `inset(${(1 - e) * 100}% 0 0 0)` : `inset(0 0 ${(1 - e) * 100}% 0)`;
      break;
  }
}

/** Generic enter/exit animation for any layer wrapper. */
export function enterExitStyle(enter: Anim | undefined, exit: Anim | undefined, t: number, dur: number): CSSProperties {
  const parts: Parts = { opacity: 1, transforms: [], filters: [] };
  if (enter && enter.type !== "none") apply(enter, prog(t, 0, enter.duration ?? 0.4), true, parts);
  if (exit && exit.type !== "none") {
    const d = exit.duration ?? 0.3;
    apply(exit, 1 - prog(t, dur - d, dur), false, parts);
  }
  return {
    opacity: parts.opacity,
    transform: parts.transforms.length ? parts.transforms.join(" ") : undefined,
    filter: parts.filters.length ? parts.filters.join(" ") : undefined,
    clipPath: parts.clip,
  };
}
