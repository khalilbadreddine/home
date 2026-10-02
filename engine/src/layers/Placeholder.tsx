import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import type { Asset } from "../types";
import { useShot } from "../lib/context";
import { font, rgba } from "../lib/theme";

const KIND_LABEL: Record<string, string> = {
  stock_video: "STOCK VIDEO",
  stock_image: "STOCK PHOTO",
  archive_video: "ARCHIVE VIDEO",
  archive_image: "ARCHIVE PHOTO",
  ai_image: "AI IMAGE",
  ai_video: "AI VIDEO",
  screenshot: "SCREENSHOT",
  map: "MAP",
  provided: "PROVIDED",
  cutout: "CUT-OUT",
  render: "RENDER",
};

/**
 * Stand-in for media that has not been acquired yet. The animatic renders
 * these so the visual flow (timing, camera, overlays) can be judged before
 * spending anything on assets.
 */
export const Placeholder: React.FC<{ asset?: Asset; label?: string; isVideo?: boolean; compact?: boolean }> = ({
  asset,
  label,
  isVideo,
  compact,
}) => {
  const { palette, treatment } = useShot();
  const { height } = useVideoConfig();
  const kind = asset?.kind ? KIND_LABEL[asset.kind] ?? asset.kind.toUpperCase() : isVideo ? "VIDEO" : "MEDIA";
  const text = asset?.description ?? asset?.query ?? asset?.prompt ?? label ?? "missing media";
  const unit = height / 100;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 30% 30%, ${rgba(palette.accent, 0.18)} 0%, transparent 55%), linear-gradient(135deg, #1b1d24 0%, #0d0e12 100%)`,
        overflow: "hidden",
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: `${unit * 6}px ${unit * 6}px`,
        }}
      />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: compact ? unit * 2 : unit * 8,
          textAlign: "center",
          gap: unit * 1.6,
        }}
      >
        <div
          style={{
            fontFamily: font("mono", treatment),
            fontSize: unit * (compact ? 1.8 : 2.2),
            letterSpacing: "0.25em",
            color: palette.accent,
            border: `2px solid ${palette.accent}`,
            padding: `${unit * 0.5}px ${unit * 1.2}px`,
          }}
        >
          {kind}
        </div>
        <div
          style={{
            fontFamily: font("body", treatment),
            fontWeight: 600,
            fontSize: unit * (compact ? 2.4 : 3.6),
            lineHeight: 1.25,
            color: "rgba(255,255,255,0.85)",
            maxWidth: "85%",
          }}
        >
          {text}
        </div>
        {asset?.query && asset.description ? (
          <div style={{ fontFamily: font("mono", treatment), fontSize: unit * 1.8, color: "rgba(255,255,255,0.45)" }}>
            search: “{asset.query}”
          </div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
