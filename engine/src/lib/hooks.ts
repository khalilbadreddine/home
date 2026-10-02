import { useCurrentFrame, useVideoConfig } from "remotion";
import { useLayerSpan } from "./context";

/** Layer-local time. t = seconds since the layer's nominal start, dur = nominal duration. */
export function useLayerTime() {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const span = useLayerSpan();
  const seqT = frame / fps;
  return {
    t: seqT + span.seqStart - span.start,
    dur: span.dur,
    seqT,
    seqDur: span.dur + (span.start - span.seqStart),
    shotT: seqT + span.seqStart,
    fps,
    width,
    height,
    frame,
  };
}
