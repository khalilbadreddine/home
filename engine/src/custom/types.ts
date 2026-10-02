import type { Palette, Treatment } from "../types";

/** Every custom component receives layer-local time plus the plan's look. */
export interface CustomProps {
  t: number; // seconds since the layer started (negative before)
  dur: number; // layer duration in seconds
  palette: Palette;
  treatment: Treatment;
  props: Record<string, any>; // whatever the plan put in layer.props
}
