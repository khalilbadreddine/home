import React from "react";
import { AbsoluteFill, Freeze, Img, OffthreadVideo, useVideoConfig } from "remotion";
import type { Asset, Camera, Grade, Point } from "../types";
import { useShot } from "../lib/context";
import { gradeLook } from "../lib/grade";
import { resolveSrc } from "../lib/media";
import { camTransform, cameraState, origin } from "../lib/camera";
import { prog } from "../lib/easing";
import { useLayerTime } from "../lib/hooks";
import { Placeholder } from "./Placeholder";

export const GradeWrap: React.FC<{ grade?: Grade; children: React.ReactNode; style?: React.CSSProperties }> = ({
  grade,
  children,
  style,
}) => {
  const { palette } = useShot();
  const look = gradeLook(grade, palette);
  return (
    <AbsoluteFill style={{ ...style, filter: look.filter === "none" ? style?.filter : `${look.filter} ${style?.filter ?? ""}` }}>
      {children}
      {look.overlay ? (
        <AbsoluteFill
          style={{
            background: look.overlay.background,
            mixBlendMode: look.overlay.blend as React.CSSProperties["mixBlendMode"],
            opacity: look.overlay.opacity,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

export interface MediaSpec {
  src?: string;
  asset?: Asset;
  isVideo?: boolean;
  missing?: boolean;
  duration?: number; // source duration, if known
  trim?: number;
  speed?: number;
  freezeAt?: number; // layer-relative seconds
  volume?: number;
  fit?: "cover" | "contain" | "blur_fill";
  focus?: Point;
  mirror?: boolean;
}

/** Raw media element (no grade / camera). Handles freeze frames and clips that run out. */
export const MediaElement: React.FC<{ spec: MediaSpec; style?: React.CSSProperties; fitOverride?: "cover" | "contain" }> = ({
  spec,
  style,
  fitOverride,
}) => {
  const { fps } = useVideoConfig();
  const { t, seqT } = useLayerTime();
  const fit = fitOverride ?? (spec.fit === "contain" ? "contain" : "cover");
  const objectPosition = spec.focus ? `${spec.focus.x}% ${spec.focus.y}%` : "50% 50%";
  const css: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: fit,
    objectPosition,
    transform: spec.mirror ? "scaleX(-1)" : undefined,
    ...style,
  };

  if (!spec.src || spec.missing) return null;

  if (!spec.isVideo) return <Img src={resolveSrc(spec.src)} style={css} />;

  const speed = spec.speed ?? 1;
  const trim = spec.trim ?? 0;
  const video = (
    <OffthreadVideo
      src={resolveSrc(spec.src)}
      trimBefore={Math.round(trim * fps)}
      playbackRate={speed}
      muted={!spec.volume}
      volume={spec.volume ?? 0}
      style={css}
    />
  );

  // Freeze on demand, or automatically on the last frame if the clip is too short.
  let freezeSeq: number | undefined;
  if (spec.freezeAt !== undefined) freezeSeq = Math.max(0, seqT - t + spec.freezeAt);
  if (spec.duration) {
    const playable = Math.max(0, (spec.duration - trim) / speed - 1 / fps);
    freezeSeq = freezeSeq === undefined ? playable : Math.min(freezeSeq, playable);
  }
  if (freezeSeq !== undefined && seqT >= freezeSeq) {
    return <Freeze frame={Math.max(0, Math.floor(freezeSeq * fps))}>{video}</Freeze>;
  }
  return video;
};

/** A full media layer: fit modes, grade, layer camera, darken/blur, placeholder. */
export const MediaLayerView: React.FC<{
  spec: MediaSpec;
  grade?: Grade;
  camera?: Camera;
  blur?: number;
  darken?: number;
  label?: string;
}> = ({ spec, grade, camera, blur, darken, label }) => {
  const { seqT, seqDur, shotT } = useLayerTime();
  const { treatment, seed } = useShot();
  const effectiveGrade = grade ?? treatment.grade;
  const cam = camera ? cameraState(camera, prog(seqT, 0, seqDur), shotT, seed + 5) : undefined;
  const missing = !spec.src || spec.missing;

  const content = missing ? (
    <Placeholder asset={spec.asset} label={label} isVideo={spec.isVideo} />
  ) : spec.fit === "blur_fill" ? (
    <>
      <AbsoluteFill style={{ transform: "scale(1.25)", filter: "blur(40px) brightness(0.55) saturate(1.2)" }}>
        <MediaElement spec={spec} fitOverride="cover" />
      </AbsoluteFill>
      <AbsoluteFill>
        <MediaElement spec={spec} fitOverride="contain" />
      </AbsoluteFill>
    </>
  ) : (
    <MediaElement spec={spec} />
  );

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: cam ? camTransform(cam) : undefined,
          transformOrigin: origin(camera),
          filter: blur ? `blur(${blur}px)` : undefined,
        }}
      >
        {missing ? content : <GradeWrap grade={effectiveGrade}>{content}</GradeWrap>}
      </AbsoluteFill>
      {darken ? <AbsoluteFill style={{ background: `rgba(0,0,0,${darken})` }} /> : null}
    </AbsoluteFill>
  );
};
