import React from "react";
import { AbsoluteFill } from "remotion";
import type { BackgroundLayer, ParallaxLayer } from "../types";
import { useShot } from "../lib/context";
import { color, font, rgba, weightFor } from "../lib/theme";
import { camTransform, planeState } from "../lib/camera";
import { prog } from "../lib/easing";
import { useLayerTime } from "../lib/hooks";
import { GradeWrap, MediaElement } from "./Media";
import { Placeholder } from "./Placeholder";

export const BackgroundView: React.FC<{ layer: BackgroundLayer }> = ({ layer }) => {
  const { palette } = useShot();
  const { shotT, height } = useLayerTime();
  const unit = height / 100;
  const cols = (layer.colors ?? []).map((c) => color(c, palette));
  const c0 = cols[0] ?? palette.bg;
  const c1 = cols[1] ?? palette.accent;
  const c2 = cols[2] ?? palette.accent2 ?? palette.accent;
  const anim = layer.animated !== false;
  const tt = anim ? shotT : 0;
  const angle = (layer.angle ?? 135) + (anim ? Math.sin(tt * 0.25) * 12 : 0);

  switch (layer.style ?? "solid") {
    case "linear":
      return <AbsoluteFill style={{ background: `linear-gradient(${angle}deg, ${c0} 0%, ${c1} 100%)` }} />;
    case "radial":
      return (
        <AbsoluteFill
          style={{ background: `radial-gradient(ellipse at ${50 + Math.sin(tt * 0.3) * 8}% ${45 + Math.cos(tt * 0.25) * 6}%, ${cols[1] ?? rgba(palette.accent, 0.35)} 0%, ${c0} 70%)` }}
        />
      );
    case "mesh": {
      const blobs = [
        { c: c1, x: 25 + Math.sin(tt * 0.31) * 12, y: 30 + Math.cos(tt * 0.27) * 10, s: 60 },
        { c: c2, x: 72 + Math.cos(tt * 0.23) * 12, y: 62 + Math.sin(tt * 0.29) * 12, s: 55 },
        { c: cols[3] ?? rgba(palette.fg, 0.25), x: 55 + Math.sin(tt * 0.19) * 18, y: 20 + Math.cos(tt * 0.33) * 8, s: 40 },
      ];
      return (
        <AbsoluteFill style={{ background: c0, overflow: "hidden" }}>
          {blobs.map((b, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${b.x}%`,
                top: `${b.y}%`,
                width: `${b.s}%`,
                aspectRatio: "1",
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                background: b.c,
                opacity: 0.55,
                filter: `blur(${unit * 12}px)`,
              }}
            />
          ))}
        </AbsoluteFill>
      );
    }
    case "grid": {
      const off = anim ? (tt * unit * 1.5) % (unit * 6) : 0;
      return (
        <AbsoluteFill style={{ background: c0 }}>
          <AbsoluteFill
            style={{
              backgroundImage: `linear-gradient(${rgba(palette.fg, 0.07)} 1px, transparent 1px), linear-gradient(90deg, ${rgba(palette.fg, 0.07)} 1px, transparent 1px)`,
              backgroundSize: `${unit * 6}px ${unit * 6}px`,
              backgroundPosition: `${off}px ${off}px`,
            }}
          />
          <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, transparent 30%, ${c0} 95%)` }} />
        </AbsoluteFill>
      );
    }
    case "dots":
      return (
        <AbsoluteFill style={{ background: c0 }}>
          <AbsoluteFill
            style={{
              backgroundImage: `radial-gradient(${rgba(palette.fg, 0.16)} 1.5px, transparent 1.6px)`,
              backgroundSize: `${unit * 3.2}px ${unit * 3.2}px`,
              backgroundPosition: anim ? `${tt * unit}px 0px` : undefined,
            }}
          />
          <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, transparent 35%, ${c0} 95%)` }} />
        </AbsoluteFill>
      );
    case "paper":
      return (
        <AbsoluteFill style={{ background: cols[0] ?? "#e9e1cf" }}>
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.35, mixBlendMode: "multiply" }}>
            <filter id="paper-noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.035 0.6" numOctaves={3} seed={4} />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#paper-noise)" />
          </svg>
          <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 45%, rgba(90,60,20,0.35) 100%)" }} />
        </AbsoluteFill>
      );
    case "noise":
      return (
        <AbsoluteFill style={{ background: c0 }}>
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.18 }}>
            <filter id="bg-noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves={2} seed={Math.floor(tt * 12) % 60} />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#bg-noise)" />
          </svg>
        </AbsoluteFill>
      );
    case "solid":
    default:
      return <AbsoluteFill style={{ background: c0 }} />;
  }
};

/**
 * 2.5D parallax: stacked planes driven by the shot camera, each moving in
 * proportion to its depth. Give it a background plate + a cut-out subject
 * (asset.needs_cutout) and a still photo starts to feel like a camera move.
 */
export const ParallaxView: React.FC<{ layer: ParallaxLayer }> = ({ layer }) => {
  const shot = useShot();
  const { palette, treatment, seed } = shot;
  const { shotT, height } = useLayerTime();
  const unit = height / 100;
  const cam = layer.camera ?? shot.camera ?? { move: "push_in", intensity: 0.5 };
  const span = shot.lead + shot.dur + shot.tail;
  const p = prog(shotT + shot.lead, 0, span);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {layer.planes.map((pl, i) => {
        const st = planeState(cam, p, shotT, pl.depth, seed);
        const b = pl.box;
        const posStyle: React.CSSProperties = b
          ? { position: "absolute", left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }
          : { position: "absolute", inset: 0 };
        const overscan = !b && pl.text === undefined && i === 0 ? 1.06 : 1;
        let content: React.ReactNode;
        if (pl.text !== undefined) {
          content = (
            <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
              <div
                style={{
                  fontFamily: font(pl.font ?? "display", treatment),
                  fontWeight: weightFor(pl.font ?? "display", treatment, 900),
                  fontSize: (pl.size ?? 30) * unit,
                  lineHeight: 0.85,
                  color: color(pl.color, palette, palette.fg),
                  textAlign: "center",
                  whiteSpace: "pre-line",
                  textTransform: "uppercase",
                  textShadow: "0 0.03em 0.25em rgba(0,0,0,0.35)",
                }}
              >
                {pl.text}
              </div>
            </AbsoluteFill>
          );
        } else if (!pl.src || pl._missing) {
          content = i === 0 ? <Placeholder asset={pl.asset} compact /> : null;
        } else {
          content = (
            <GradeWrap grade={pl.grade ?? treatment.grade}>
              <MediaElement spec={{ src: pl.src, isVideo: pl._isVideo, duration: pl._duration, fit: pl.fit ?? (i === 0 ? "cover" : "contain"), focus: pl.focus }} />
            </GradeWrap>
          );
        }
        return (
          <div
            key={i}
            style={{
              ...posStyle,
              transform: `${camTransform(st)} scale(${overscan})`,
              transformOrigin: cam.target ? `${cam.target.x}% ${cam.target.y}%` : "50% 50%",
              filter: pl.blur ? `blur(${pl.blur}px)` : undefined,
            }}
          >
            {content}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
