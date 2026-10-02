import { createContext, useContext } from "react";
import type { Camera, Palette, Shot, Treatment, VisualPlan } from "../types";

export interface ShotCtx {
  plan: VisualPlan;
  treatment: Treatment;
  palette: Palette;
  shot?: Shot; // undefined for global layers
  camera?: Camera;
  dur: number; // authored shot duration
  lead: number;
  tail: number;
  seed: number;
}

export const ShotContext = createContext<ShotCtx | null>(null);

export function useShot(): ShotCtx {
  const c = useContext(ShotContext);
  if (!c) throw new Error("useShot() outside a shot");
  return c;
}

export interface LayerCtx {
  /** Seconds since the layer's nominal start (negative while a transition is still bringing the shot in). */
  start: number; // shot-relative start of the layer's nominal time zero
  dur: number; // nominal duration (start -> end)
  seqStart: number; // shot-relative time where the layer's Sequence begins
}

export const LayerContext = createContext<LayerCtx>({ start: 0, dur: 1, seqStart: 0 });
export const useLayerSpan = () => useContext(LayerContext);
