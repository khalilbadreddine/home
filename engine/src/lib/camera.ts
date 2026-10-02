import type { Camera } from "../types";
import { easeFn, prog } from "./easing";
import { fbm } from "./noise";

export interface CamState {
  x: number; // translate, % of frame width
  y: number; // translate, % of frame height
  scale: number;
  rotate: number; // degrees
}

export const IDENTITY: CamState = { x: 0, y: 0, scale: 1, rotate: 0 };

/**
 * Camera state for a shot or layer.
 * @param p  0..1 progress through the visible span (eased here)
 * @param t  seconds since the shot started (drives shake + crash zoom)
 * @param depth  parallax depth multiplier (1 = flat media)
 */
export function cameraState(cam: Camera | undefined, p: number, t: number, seed = 0, depth = 1): CamState {
  if (!cam || cam.move === "static") return addShake(IDENTITY, cam, t, seed, depth);
  const k = cam.intensity ?? 0.5;
  const e = easeFn(cam.ease ?? "smooth")(p);
  let s: CamState = { ...IDENTITY };

  switch (cam.move) {
    case "push_in":
    case "dolly_zoom":
      s.scale = 1 + 0.3 * k * e * depth;
      break;
    case "pull_out":
      s.scale = 1 + 0.3 * k * (1 - e) * depth;
      break;
    case "pan_right":
    case "pan_left": {
      const travel = 16 * k * depth;
      const dir = cam.move === "pan_right" ? -1 : 1; // camera right => content left
      s.x = dir * (e - 0.5) * travel;
      s.scale = 1 + travel / 100 + 0.02;
      break;
    }
    case "tilt_up":
    case "tilt_down": {
      const travel = 14 * k * depth;
      const dir = cam.move === "tilt_up" ? 1 : -1; // camera up => content down
      s.y = dir * (e - 0.5) * travel;
      s.scale = 1 + travel / 100 + 0.02;
      break;
    }
    case "drift": {
      s.scale = 1.04 + 0.07 * k * e * depth;
      s.x = (e - 0.5) * 4 * k * depth;
      s.y = (0.5 - e) * 2 * k * depth;
      break;
    }
    case "handheld": {
      const a = 0.6 + k;
      s.scale = 1.06 + 0.02 * k;
      s.x = fbm(t * 0.9, seed) * 1.1 * a * depth;
      s.y = fbm(t * 0.8, seed + 3) * 0.9 * a * depth;
      s.rotate = fbm(t * 0.6, seed + 9) * 0.5 * a;
      break;
    }
    case "crash_zoom": {
      const hit = easeFn("snap")(prog(t, 0, 0.32));
      s.scale = 1 + (0.25 + 0.4 * k) * hit * depth + 0.03 * p;
      break;
    }
    case "rotate_cw":
    case "rotate_ccw": {
      const dir = cam.move === "rotate_cw" ? 1 : -1;
      s.rotate = dir * 4 * k * e;
      s.scale = 1.08 + 0.06 * k * e;
      break;
    }
    case "custom": {
      const f = cam.from ?? {};
      const to = cam.to ?? {};
      const lerp = (a: number | undefined, b: number | undefined, d: number) => {
        const A = a ?? d;
        const B = b ?? d;
        return A + (B - A) * e;
      };
      s = {
        x: lerp(f.x, to.x, 0) * depth,
        y: lerp(f.y, to.y, 0) * depth,
        scale: 1 + (lerp(f.scale, to.scale, 1) - 1) * depth,
        rotate: lerp(f.rotate, to.rotate, 0),
      };
      break;
    }
  }
  return addShake(s, cam, t, seed, depth);
}

function addShake(s: CamState, cam: Camera | undefined, t: number, seed: number, depth: number): CamState {
  const sh = cam?.shake ?? 0;
  if (sh <= 0) return s;
  return {
    x: s.x + fbm(t * 1.7, seed + 21) * 1.6 * sh * depth,
    y: s.y + fbm(t * 1.5, seed + 33) * 1.3 * sh * depth,
    scale: s.scale * (1 + 0.04 * sh),
    rotate: s.rotate + fbm(t * 1.1, seed + 41) * 0.7 * sh,
  };
}

/**
 * Parallax: each plane follows the camera scaled by depth. Far planes
 * (depth 0) barely move; near planes (depth 1) move the most. dolly_zoom
 * inverts the relationship for the background (vertigo effect).
 */
export function planeState(cam: Camera | undefined, p: number, t: number, depth: number, seed = 0): CamState {
  const m = 0.25 + 1.5 * depth;
  if (cam?.move === "dolly_zoom") {
    const k = cam.intensity ?? 0.5;
    const e = easeFn(cam.ease ?? "smooth")(p);
    const bg = 1 + 0.45 * k * e * (1 - depth);
    const fg = 1 - 0.06 * k * e * depth;
    return { x: 0, y: 0, scale: bg * fg, rotate: 0 };
  }
  return cameraState(cam, p, t, seed, m);
}

export function camTransform(s: CamState): string {
  return `translate(${s.x}%, ${s.y}%) scale(${s.scale}) rotate(${s.rotate}deg)`;
}

export function origin(cam: Camera | undefined): string {
  const tg = cam?.target;
  return tg ? `${tg.x}% ${tg.y}%` : "50% 50%";
}
