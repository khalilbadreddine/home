import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import type { VisualPlan } from "./types";
import { useFontsReady } from "./lib/fonts";
import { DEFAULT_PALETTE } from "./lib/theme";
import { planDuration, shotWindows } from "./lib/timeline";
import { ShotContext } from "./lib/context";
import { ShotView } from "./Shot";
import { LayerStack } from "./layers";
import { CaptionsView } from "./Captions";
import { AudioTracks } from "./AudioTracks";
import { OVERLAY_TRANSITIONS, TransitionOverlay } from "./Effects";

/**
 * The whole video: shots (with overlapping transitions), transition overlays,
 * global layers, captions, then audio. Everything is driven by the plan.
 */
export const DirectorCut: React.FC<VisualPlan> = (plan) => {
  const { fps } = useVideoConfig();
  const treatment = { ...plan.treatment, palette: { ...DEFAULT_PALETTE, ...plan.treatment.palette } };
  const p: VisualPlan = { ...plan, treatment };
  useFontsReady(treatment);
  const windows = shotWindows(p);
  const total = planDuration(p);
  const totalFrames = Math.ceil(total * fps);

  return (
    <AbsoluteFill style={{ background: treatment.palette.bg }}>
      {windows.map((w) => {
        const from = Math.round((w.shot.start - w.lead) * fps);
        const frames = Math.max(1, Math.round((w.shot.end + w.tail) * fps) - from);
        return (
          <Sequence key={w.shot.id} from={from} durationInFrames={frames} name={`shot ${w.shot.id}`}>
            <ShotView w={w} plan={p} />
          </Sequence>
        );
      })}

      {windows
        .filter((w) => w.inTr && OVERLAY_TRANSITIONS.has(w.inTr.type) && w.inDur > 0)
        .map((w) => (
          <Sequence key={`tr-${w.shot.id}`} from={Math.round((w.shot.start - w.lead) * fps)} durationInFrames={Math.max(1, Math.round(w.inDur * fps))} name={`transition ${w.inTr!.type}`}>
            <TransitionOverlay tr={w.inTr!} dur={w.inDur} />
          </Sequence>
        ))}

      {p.global_layers?.length ? (
        <ShotContext.Provider value={{ plan: p, treatment, palette: treatment.palette, dur: total, lead: 0, tail: 0, seed: 7 }}>
          <Sequence from={0} durationInFrames={totalFrames} name="global layers">
            <LayerStack layers={p.global_layers} idPrefix="global" />
          </Sequence>
        </ShotContext.Provider>
      ) : null}

      {p.captions?.enabled && p.captions._words?.length ? <CaptionsView plan={p} captions={p.captions} treatment={treatment} /> : null}

      <AudioTracks plan={p} total={total} />
    </AbsoluteFill>
  );
};
