import { Easing } from "remotion";
import type { Ease } from "../types";

export function easeFn(e: Ease | undefined): (t: number) => number {
  switch (e) {
    case "linear":
      return (t) => t;
    case "in":
      return Easing.in(Easing.cubic);
    case "out":
      return Easing.out(Easing.cubic);
    case "snap":
      return Easing.bezier(0.8, 0, 0.1, 1);
    case "smooth":
      return Easing.bezier(0.45, 0, 0.55, 1);
    case "in_out":
    default:
      return Easing.inOut(Easing.cubic);
  }
}

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** 0..1 progress of t through [a, b], clamped. */
export function prog(t: number, a: number, b: number): number {
  if (b <= a) return t >= b ? 1 : 0;
  return clamp01((t - a) / (b - a));
}

export const easeOutBack = (t: number, s = 1.7) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
