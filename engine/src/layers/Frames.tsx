import React from "react";
import { AbsoluteFill } from "remotion";
import type { CardLayer, SplitLayer } from "../types";
import { useShot } from "../lib/context";
import { color, font, rgba } from "../lib/theme";
import { camTransform, cameraState, origin } from "../lib/camera";
import { easeOutBack, easeOutCubic, prog } from "../lib/easing";
import { useLayerTime } from "../lib/hooks";
import { isVideoSrc } from "../lib/media";
import { GradeWrap, MediaElement } from "./Media";
import { Placeholder } from "./Placeholder";

const TORN =
  "polygon(0% 2%, 6% 0%, 13% 2.5%, 21% 0.5%, 29% 2%, 37% 0%, 45% 2.2%, 54% 0.4%, 62% 2.4%, 70% 0.3%, 78% 2%, 86% 0.2%, 93% 2.3%, 100% 0.6%, 100% 98%, 94% 100%, 87% 97.6%, 79% 99.6%, 71% 97.8%, 63% 100%, 55% 97.5%, 47% 99.5%, 38% 97.7%, 30% 99.8%, 22% 97.6%, 14% 99.6%, 7% 97.8%, 0% 99.5%)";

export const CardView: React.FC<{ layer: CardLayer }> = ({ layer }) => {
  const { palette, treatment, seed } = useShot();
  const { t, seqT, seqDur, shotT, height } = useLayerTime();
  const unit = height / 100;
  const b = layer.box ?? { x: 22, y: 14, w: 56, h: 66 };
  const frame = layer.frame ?? "rounded";
  const isVideo = layer._isVideo ?? isVideoSrc(layer.src, layer.is_video);
  const missing = !layer.src || layer._missing;
  const enterP = easeOutBack(prog(t, 0, 0.55), 1.2);
  const float = Math.sin(shotT * 1.3 + seed) * unit * 0.35;
  const rot = (layer.rotate ?? 0) + (1 - enterP) * 6;
  const cam = layer.camera ? cameraState(layer.camera, prog(seqT, 0, seqDur), shotT, seed + 9) : undefined;

  const pad =
    frame === "polaroid" ? { p: unit * 1.4, pb: unit * 7 } : frame === "paper" || frame === "torn" ? { p: unit * 1.2, pb: unit * 1.2 } : frame === "phone" ? { p: unit * 1.2, pb: unit * 1.2 } : frame === "tv" ? { p: unit * 2.2, pb: unit * 2.2 } : frame === "browser" ? { p: 0, pb: 0 } : { p: 0, pb: 0 };
  const outerBg =
    frame === "polaroid" ? "#f6f3ec" : frame === "paper" || frame === "torn" ? "#efe9dc" : frame === "phone" ? "#0c0c0e" : frame === "tv" ? "#1a1a1a" : frame === "browser" ? "#22252b" : "transparent";
  const radius = frame === "phone" ? unit * 4 : frame === "rounded" || frame === "browser" ? unit * 1.4 : frame === "tv" ? unit * 2.4 : unit * 0.2;
  const innerRadius = frame === "phone" ? unit * 3 : frame === "rounded" ? unit * 1.4 : frame === "tv" ? unit * 1.6 : 0;

  const media = missing ? (
    <Placeholder asset={layer.asset} isVideo={isVideo} compact />
  ) : (
    <GradeWrap grade={layer.grade ?? treatment.grade}>
      <MediaElement spec={{ src: layer.src, isVideo, duration: layer._duration, trim: layer.trim, fit: layer.fit === "contain" ? "contain" : "cover", focus: layer.focus, mirror: layer.mirror }} />
    </GradeWrap>
  );

  return (
    <AbsoluteFill style={{ perspective: 1600 }}>
      <div
        style={{
          position: "absolute",
          left: `${b.x}%`,
          top: `${b.y}%`,
          width: `${b.w}%`,
          height: `${b.h}%`,
          transform: `translateY(${float + (1 - enterP) * unit * 8}px) rotate(${rot}deg) rotateY(${layer.tilt ?? 0}deg) scale(${0.85 + 0.15 * enterP})`,
          opacity: Math.min(1, prog(t, 0, 0.2) * 1.5),
          background: outerBg,
          borderRadius: radius,
          padding: `${frame === "browser" ? unit * 3.4 : pad.p}px ${pad.p}px ${pad.pb}px ${pad.p}px`,
          boxShadow: layer.shadow === false ? undefined : `0 ${unit * 2}px ${unit * 5}px rgba(0,0,0,0.55), 0 ${unit * 0.4}px ${unit}px rgba(0,0,0,0.35)`,
          clipPath: frame === "torn" ? TORN : undefined,
          boxSizing: "border-box",
        }}
      >
        {frame === "browser" ? (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: unit * 3.4, display: "flex", alignItems: "center", gap: unit * 0.8, padding: `0 ${unit * 1.2}px` }}>
            {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
              <div key={c} style={{ width: unit * 1.1, height: unit * 1.1, borderRadius: "50%", background: c }} />
            ))}
            <div style={{ marginLeft: unit, flex: 1, height: unit * 2, borderRadius: unit, background: "rgba(255,255,255,0.08)", fontFamily: font("mono", treatment), fontSize: unit * 1.3, color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", paddingLeft: unit }}>
              {layer.caption ?? ""}
            </div>
          </div>
        ) : null}
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", borderRadius: innerRadius, background: "#000" }}>
          <AbsoluteFill style={{ transform: cam ? camTransform(cam) : undefined, transformOrigin: origin(layer.camera) }}>{media}</AbsoluteFill>
          {frame === "tv" ? (
            <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0 2px, transparent 2px 4px), radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.55) 100%)" }} />
          ) : null}
          {frame === "paper" || frame === "torn" ? <AbsoluteFill style={{ background: "rgba(239,233,220,0.12)", mixBlendMode: "multiply" }} /> : null}
        </div>
        {frame === "polaroid" && layer.caption ? (
          <div style={{ position: "absolute", left: 0, right: 0, bottom: unit * 1.4, textAlign: "center", fontFamily: font("accent", treatment), fontSize: unit * 3.4, color: "#222" }}>{layer.caption}</div>
        ) : null}
      </div>
      {frame !== "polaroid" && frame !== "browser" && layer.caption ? (
        <div
          style={{
            position: "absolute",
            left: `${b.x}%`,
            top: `calc(${b.y + b.h}% + ${unit * 2}px)`,
            width: `${b.w}%`,
            textAlign: "center",
            fontFamily: font("mono", treatment),
            fontSize: unit * 2,
            letterSpacing: "0.12em",
            color: rgba(palette.fg, 0.85),
            opacity: easeOutCubic(prog(t, 0.4, 0.8)),
            textTransform: "uppercase",
          }}
        >
          {layer.caption}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const LAYOUTS: Record<string, { x: number; y: number; w: number; h: number }[]> = {
  two_vertical: [
    { x: 0, y: 0, w: 50, h: 100 },
    { x: 50, y: 0, w: 50, h: 100 },
  ],
  two_horizontal: [
    { x: 0, y: 0, w: 100, h: 50 },
    { x: 0, y: 50, w: 100, h: 50 },
  ],
  three_vertical: [
    { x: 0, y: 0, w: 33.34, h: 100 },
    { x: 33.33, y: 0, w: 33.34, h: 100 },
    { x: 66.66, y: 0, w: 33.34, h: 100 },
  ],
  grid_4: [
    { x: 0, y: 0, w: 50, h: 50 },
    { x: 50, y: 0, w: 50, h: 50 },
    { x: 0, y: 50, w: 50, h: 50 },
    { x: 50, y: 50, w: 50, h: 50 },
  ],
  pip: [
    { x: 0, y: 0, w: 100, h: 100 },
    { x: 64, y: 58, w: 31, h: 34 },
  ],
};

export const SplitView: React.FC<{ layer: SplitLayer }> = ({ layer }) => {
  const { palette, treatment, seed } = useShot();
  const { t, seqT, seqDur, shotT, height } = useLayerTime();
  const unit = height / 100;
  const layout = LAYOUTS[layer.layout ?? "two_vertical"];
  const gap = (layer.gap ?? 0.4) / 2;
  const gapColor = color(layer.gap_color, palette, palette.bg);
  const stagger = layer.stagger ?? 0.25;
  return (
    <AbsoluteFill style={{ background: gapColor }}>
      {layer.panels.slice(0, layout.length).map((panel, i) => {
        const r = layout[i];
        const isPip = layer.layout === "pip" && i === 1;
        const p = easeOutCubic(prog(t, i * stagger, i * stagger + 0.5));
        const isVideo = panel._isVideo ?? isVideoSrc(panel.src, panel.is_video);
        const missing = !panel.src || panel._missing;
        const cam = panel.camera ? cameraState(panel.camera, prog(seqT, 0, seqDur), shotT, seed + i * 3) : undefined;
        const vertical = r.h > r.w * 1.2 || layer.layout === "two_vertical" || layer.layout === "three_vertical";
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `calc(${r.x}% + ${isPip ? 0 : gap}%)`,
              top: `calc(${r.y}% + ${isPip ? 0 : gap}%)`,
              width: `calc(${r.w}% - ${isPip ? 0 : gap * 2}%)`,
              height: `calc(${r.h}% - ${isPip ? 0 : gap * 2}%)`,
              overflow: "hidden",
              clipPath: vertical ? `inset(${(1 - p) * 100}% 0 0 0)` : `inset(0 ${(1 - p) * 100}% 0 0)`,
              border: isPip ? `${unit * 0.4}px solid ${palette.fg}` : undefined,
              boxShadow: isPip ? `0 ${unit}px ${unit * 3}px rgba(0,0,0,0.5)` : undefined,
              borderRadius: isPip ? unit : 0,
            }}
          >
            <AbsoluteFill style={{ transform: cam ? camTransform(cam) : undefined, transformOrigin: origin(panel.camera) }}>
              {missing ? (
                <Placeholder asset={panel.asset} isVideo={isVideo} label={panel.label} compact />
              ) : (
                <GradeWrap grade={panel.grade ?? treatment.grade}>
                  <MediaElement spec={{ src: panel.src, isVideo, duration: panel._duration, trim: panel.trim, focus: panel.focus }} />
                </GradeWrap>
              )}
            </AbsoluteFill>
            {panel.label ? (
              <div
                style={{
                  position: "absolute",
                  left: unit * 2,
                  bottom: unit * 2,
                  fontFamily: font("mono", treatment),
                  fontWeight: 700,
                  fontSize: unit * 2.4,
                  letterSpacing: "0.16em",
                  color: palette.fg,
                  background: rgba(palette.bg, 0.78),
                  borderLeft: `${unit * 0.4}px solid ${palette.accent}`,
                  padding: `${unit * 0.5}px ${unit * 1.2}px`,
                  opacity: prog(t, i * stagger + 0.35, i * stagger + 0.7),
                  textTransform: "uppercase",
                }}
              >
                {panel.label}
              </div>
            ) : null}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
