import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { FxLayer, VisualPlan } from "./types";
import { ShotContext, LayerContext } from "./lib/context";
import { camTransform, cameraState, origin } from "./lib/camera";
import { prog } from "./lib/easing";
import { seeded } from "./lib/noise";
import { color, font, rgba } from "./lib/theme";
import type { ShotWindow } from "./lib/timeline";
import { LayerStack } from "./layers";
import { FxView } from "./layers/Fx";
import { PostWrap, enterLook, exitLook } from "./Effects";

export const ShotView: React.FC<{ w: ShotWindow; plan: VisualPlan }> = ({ w, plan }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const { shot } = w;
  const treatment = plan.treatment;
  const palette = treatment.palette;
  const t = frame / fps - w.lead; // shot-relative seconds
  const span = w.lead + w.dur + w.tail;
  const seed = seeded(shot.id);

  const cam = cameraState(shot.camera, prog(t + w.lead, 0, span), t, seed);
  const camStyle: React.CSSProperties = { transform: camTransform(cam), transformOrigin: origin(shot.camera) };

  const enterP = w.inDur > 0 ? prog(t, -w.lead, w.lead) : 1;
  const exitQ = w.outDur > 0 ? prog(t, w.dur - w.tail, w.dur + w.tail) : 0;
  const en = enterLook(w.inTr, enterP, shot.id);
  const ex = exitLook(w.outTr, exitQ, shot.id);

  const texture = shot.texture === "none" ? [] : treatment.texture ?? [];
  const tk = treatment.texture_intensity ?? 0.35;
  const unit = height / 100;

  return (
    <ShotContext.Provider value={{ plan, treatment, palette, shot, camera: shot.camera, dur: w.dur, lead: w.lead, tail: w.tail, seed }}>
      <AbsoluteFill style={ex.style}>
        {ex.defs}
        <AbsoluteFill style={en.style}>
          {en.defs}
          <PostWrap posts={shot.post} t={t} id={shot.id}>
            <AbsoluteFill style={{ background: color(shot.background, palette, palette.bg), overflow: "hidden" }}>
              <LayerStack layers={shot.layers} camStyle={camStyle} idPrefix={shot.id} />
              {texture.length ? (
                <LayerContext.Provider value={{ start: -1000, dur: 1e6, seqStart: -w.lead }}>
                  {texture.map((fx) => (
                    <AbsoluteFill key={fx}>
                      <FxView layer={{ type: "fx", effect: fx, intensity: tk } as FxLayer} idHint={`${shot.id}-tex-${fx}`} />
                    </AbsoluteFill>
                  ))}
                </LayerContext.Provider>
              ) : null}
            </AbsoluteFill>
          </PostWrap>
          {plan._render?.animatic ? (
            <div
              style={{
                position: "absolute",
                right: unit * 2,
                top: unit * 2,
                fontFamily: font("mono", treatment),
                fontSize: unit * 1.7,
                color: "#fff",
                background: rgba("#000000", 0.6),
                padding: `${unit * 0.4}px ${unit * 0.9}px`,
                borderRadius: unit * 0.4,
                letterSpacing: "0.08em",
              }}
            >
              {shot.id} · {shot.strategy ?? "—"}
              {shot.hero ? " · ★" : ""} · {(w.dur).toFixed(1)}s
            </div>
          ) : null}
        </AbsoluteFill>
      </AbsoluteFill>
    </ShotContext.Provider>
  );
};
