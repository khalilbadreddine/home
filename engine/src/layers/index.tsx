import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import type { Layer } from "../types";
import { LayerContext, useShot } from "../lib/context";
import { enterExitStyle } from "../lib/anim";
import { useLayerTime } from "../lib/hooks";
import { defaultLock } from "../lib/timeline";
import { CUSTOM_COMPONENTS } from "../custom";
import { MediaLayerView } from "./Media";
import { Placeholder } from "./Placeholder";
import { TextView } from "./Text";
import { BarsView, CounterView, TimelineView } from "./Graphics";
import { AnnotationView } from "./Annotation";
import { CardView, SplitView } from "./Frames";
import { BackgroundView, ParallaxView } from "./Scenery";
import { FxView } from "./Fx";

const LayerBody: React.FC<{ layer: Layer; idHint: string }> = ({ layer, idHint }) => {
  const shot = useShot();
  const { t, dur } = useLayerTime();
  switch (layer.type) {
    case "video":
    case "image": {
      const view = (
        <MediaLayerView
          spec={{
            src: layer.src,
            asset: layer.asset,
            isVideo: layer.type === "video" ? true : layer._isVideo ?? false,
            missing: layer._missing,
            duration: layer._duration,
            trim: layer.type === "video" ? layer.trim : undefined,
            speed: layer.type === "video" ? layer.speed : undefined,
            freezeAt: layer.type === "video" ? layer.freeze_at : undefined,
            volume: layer.type === "video" ? layer.volume : undefined,
            fit: layer.fit,
            focus: layer.focus,
            mirror: layer.mirror,
          }}
          grade={layer.grade ?? shot.shot?.grade}
          camera={layer.camera}
          blur={layer.blur}
          darken={layer.darken}
        />
      );
      if (!layer.box) return view;
      const b = layer.box;
      return (
        <div style={{ position: "absolute", left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%`, overflow: "hidden" }}>
          <AbsoluteFill>{view}</AbsoluteFill>
        </div>
      );
    }
    case "parallax":
      return <ParallaxView layer={layer} />;
    case "background":
      return <BackgroundView layer={layer} />;
    case "text":
      return <TextView layer={layer} />;
    case "counter":
      return <CounterView layer={layer} />;
    case "annotation":
      return <AnnotationView layer={layer} />;
    case "card":
      return <CardView layer={layer} />;
    case "split":
      return <SplitView layer={layer} />;
    case "bars":
      return <BarsView layer={layer} />;
    case "timeline":
      return <TimelineView layer={layer} />;
    case "fx":
      return <FxView layer={layer} idHint={idHint} />;
    case "custom": {
      const C = CUSTOM_COMPONENTS[layer.component];
      if (!C) return <Placeholder asset={{ kind: "render", description: `custom component "${layer.component}" is not registered` }} />;
      return <C t={t} dur={dur} palette={shot.palette} treatment={shot.treatment} props={layer.props ?? {}} />;
    }
    default:
      return null;
  }
};

const LayerWrap: React.FC<{ layer: Layer; camStyle?: React.CSSProperties; idHint: string }> = ({ layer, camStyle, idHint }) => {
  const { t, dur } = useLayerTime();
  const anim = enterExitStyle(layer.enter, layer.exit, t, dur);
  const world = defaultLock(layer) === "world";
  return (
    <AbsoluteFill
      style={{
        ...(world ? camStyle : {}),
        mixBlendMode: (layer.blend ?? "normal") as React.CSSProperties["mixBlendMode"],
        opacity: layer.opacity ?? 1,
      }}
    >
      <AbsoluteFill style={anim}>
        <LayerBody layer={layer} idHint={idHint} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/**
 * Renders layers bottom→top. Each layer lives in its own Sequence so videos
 * start playing at the layer's start and every component gets local time.
 * Times are shot-relative; `lead`/`tail` extend the visible span for transitions.
 */
export const LayerStack: React.FC<{ layers: Layer[]; camStyle?: React.CSSProperties; idPrefix: string }> = ({ layers, camStyle, idPrefix }) => {
  const { fps } = useVideoConfig();
  const shot = useShot();
  const visibleEnd = shot.dur + shot.tail;
  return (
    <>
      {layers.map((layer, i) => {
        const nominalStart = layer.start ?? 0;
        const seqStart = layer.start ?? -shot.lead;
        const seqEnd = Math.min(layer.end ?? visibleEnd, visibleEnd);
        const nominalDur = Math.max(0.04, (layer.end ?? shot.dur) - nominalStart);
        const from = Math.round((seqStart + shot.lead) * fps);
        const frames = Math.round((seqEnd - seqStart) * fps);
        if (frames <= 0) return null;
        return (
          <Sequence key={i} from={from} durationInFrames={frames} name={`${layer.type}${layer.id ? `:${layer.id}` : ""}`}>
            <LayerContext.Provider value={{ start: nominalStart, dur: nominalDur, seqStart }}>
              <LayerWrap layer={layer} camStyle={camStyle} idHint={`${idPrefix}-${i}`} />
            </LayerContext.Provider>
          </Sequence>
        );
      })}
    </>
  );
};
