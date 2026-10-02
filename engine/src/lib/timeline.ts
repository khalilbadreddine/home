import type { Layer, Shot, Transition, TransitionType, VisualPlan } from "../types";

export const DEFAULT_TRANSITION_DUR: Record<TransitionType, number> = {
  cut: 0,
  crossfade: 0.5,
  dip_black: 0.8,
  dip_white: 0.6,
  flash: 0.3,
  whip_left: 0.36,
  whip_right: 0.36,
  whip_up: 0.36,
  whip_down: 0.36,
  slide_left: 0.5,
  slide_right: 0.5,
  slide_up: 0.5,
  zoom_through: 0.5,
  zoom_out: 0.6,
  wipe_left: 0.6,
  wipe_right: 0.6,
  iris: 0.7,
  glitch: 0.4,
  blur: 0.6,
  film_burn: 0.9,
};

export function transDur(tr: Transition | undefined): number {
  if (!tr || tr.type === "cut") return 0;
  return tr.duration ?? DEFAULT_TRANSITION_DUR[tr.type] ?? 0.5;
}

export interface ShotWindow {
  shot: Shot;
  index: number;
  dur: number; // authored duration (end - start)
  lead: number; // seconds rendered before shot.start (half the incoming transition)
  tail: number; // seconds rendered after shot.end (half the outgoing transition)
  inTr?: Transition;
  inDur: number;
  outTr?: Transition;
  outDur: number;
}

export function shotWindows(plan: VisualPlan): ShotWindow[] {
  const shots = plan.shots;
  const durs = shots.map((s) => Math.max(0.04, s.end - s.start));
  const inDurs = shots.map((s, i) => {
    if (i === 0) return 0;
    const d = transDur(s.transition_in);
    // A transition may never eat more than ~60% of either neighbouring shot.
    return Math.min(d, durs[i] * 0.6 * 2, durs[i - 1] * 0.6 * 2);
  });
  return shots.map((shot, i) => {
    const inDur = inDurs[i];
    const outDur = i + 1 < shots.length ? inDurs[i + 1] : 0;
    return {
      shot,
      index: i,
      dur: durs[i],
      lead: inDur / 2,
      tail: outDur / 2,
      inTr: i === 0 ? undefined : shot.transition_in,
      inDur,
      outTr: i + 1 < shots.length ? shots[i + 1].transition_in : undefined,
      outDur,
    };
  });
}

export function planDuration(plan: VisualPlan): number {
  const lastEnd = plan.shots.reduce((m, s) => Math.max(m, s.end), 0);
  const vo = plan.audio?.voiceover;
  const voEnd = vo?._duration ? (vo.offset ?? 0) + vo._duration : 0;
  return Math.max(plan.meta.duration ?? 0, lastEnd, voEnd, 0.5);
}

export const MEDIA_TYPES = new Set(["video", "image", "parallax", "card", "split", "background", "custom"]);

export function defaultLock(layer: Layer): "world" | "screen" {
  if (layer.lock) return layer.lock;
  return layer.type === "video" || layer.type === "image" || layer.type === "card" || layer.type === "annotation"
    ? "world"
    : "screen";
}
