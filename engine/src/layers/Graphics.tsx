import React from "react";
import { AbsoluteFill } from "remotion";
import type { BarsLayer, CounterLayer, TimelineLayer } from "../types";
import { useShot } from "../lib/context";
import { color, font, rgba, weightFor } from "../lib/theme";
import { easeOutBack, easeOutCubic, prog } from "../lib/easing";
import { useLayerTime } from "../lib/hooks";
import { positionStyle } from "./Text";

const easeOutExpo = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));

function formatNumber(v: number, decimals: number, separator: boolean) {
  return v.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: separator,
  });
}

export const CounterView: React.FC<{ layer: CounterLayer }> = ({ layer }) => {
  const { palette, treatment } = useShot();
  const { t, height } = useLayerTime();
  const unit = height / 100;
  const cd = layer.count_duration ?? 1.6;
  const p = easeOutExpo(prog(t, 0, cd));
  const from = layer.from ?? 0;
  const value = from + (layer.to - from) * p;
  const land = prog(t, cd, cd + 0.3);
  const pop = land > 0 && land < 1 ? 1 + 0.06 * Math.sin(land * Math.PI) : 1;
  const size = (layer.size ?? 16) * unit;
  const fg = color(layer.color, palette, palette.accent);
  return (
    <AbsoluteFill style={positionStyle(layer.position ?? "center", unit)}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", opacity: prog(t, 0, 0.15) }}>
        <div
          style={{
            fontFamily: font("display", treatment),
            fontWeight: weightFor("display", treatment, 900),
            fontSize: size,
            lineHeight: 1,
            color: fg,
            fontVariantNumeric: "tabular-nums",
            transform: `scale(${pop})`,
            textShadow: "0 0.04em 0.4em rgba(0,0,0,0.5)",
            whiteSpace: "nowrap",
          }}
        >
          {layer.prefix ?? ""}
          {formatNumber(value, layer.decimals ?? 0, layer.separator ?? true)}
          {layer.suffix ?? ""}
        </div>
        {layer.label ? (
          <div
            style={{
              marginTop: unit * 1.5,
              fontFamily: font("body", treatment),
              fontWeight: 600,
              fontSize: size * 0.2,
              letterSpacing: "0.08em",
              color: palette.fg,
              opacity: easeOutCubic(prog(t, 0.3, 0.8)),
              textTransform: "uppercase",
              textShadow: "0 2px 12px rgba(0,0,0,0.6)",
            }}
          >
            {layer.label}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

export const BarsView: React.FC<{ layer: BarsLayer }> = ({ layer }) => {
  const { palette, treatment } = useShot();
  const { t, height } = useLayerTime();
  const unit = height / 100;
  const max = Math.max(...layer.data.map((d) => Math.abs(d.value)), 1e-9);
  const vertical = layer.orientation === "vertical";
  const b = layer.box ?? { x: 12, y: 18, w: 76, h: 64 };
  return (
    <div style={{ position: "absolute", left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%`, display: "flex", flexDirection: "column", gap: unit * 2 }}>
      {layer.title ? (
        <div style={{ fontFamily: font("display", treatment), fontWeight: weightFor("display", treatment, 800), fontSize: unit * 5, color: palette.fg, opacity: prog(t, 0, 0.4) }}>
          {layer.title}
        </div>
      ) : null}
      <div style={{ flex: 1, display: "flex", flexDirection: vertical ? "row" : "column", gap: unit * (vertical ? 3 : 1.6), alignItems: vertical ? "flex-end" : "stretch", justifyContent: "center" }}>
        {layer.data.map((d, i) => {
          const start = 0.2 + i * 0.12;
          const p = easeOutCubic(prog(t, start, start + 0.9));
          const isHl = layer.highlight === i;
          const fill = color(d.color, palette, isHl || layer.highlight === undefined ? palette.accent : rgba(palette.fg, 0.35));
          const frac = Math.abs(d.value) / max;
          const val = formatNumber(d.value * p, Number.isInteger(d.value) ? 0 : 1, true) + (layer.unit ?? "");
          if (vertical) {
            return (
              <div key={i} style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", gap: unit }}>
                <div style={{ fontFamily: font("mono", treatment), fontWeight: 700, fontSize: unit * 2.6, color: palette.fg, opacity: p }}>{val}</div>
                <div style={{ width: "100%", height: `${frac * 78 * p}%`, background: fill, borderRadius: `${unit * 0.4}px ${unit * 0.4}px 0 0` }} />
                <div style={{ fontFamily: font("body", treatment), fontWeight: 600, fontSize: unit * 2.2, color: rgba(palette.fg, 0.85), textAlign: "center" }}>{d.label}</div>
              </div>
            );
          }
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: unit * 1.5 }}>
              <div style={{ width: "22%", textAlign: "right", fontFamily: font("body", treatment), fontWeight: 600, fontSize: unit * 2.6, color: rgba(palette.fg, 0.9) }}>{d.label}</div>
              <div style={{ flex: 1, height: unit * 5, display: "flex", alignItems: "center", gap: unit * 1.2 }}>
                <div style={{ width: `${frac * 85 * p}%`, height: "100%", background: fill, borderRadius: `0 ${unit * 0.5}px ${unit * 0.5}px 0` }} />
                <div style={{ fontFamily: font("mono", treatment), fontWeight: 700, fontSize: unit * 2.6, color: isHl ? palette.accent : palette.fg, opacity: p, whiteSpace: "nowrap" }}>{val}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const TimelineView: React.FC<{ layer: TimelineLayer }> = ({ layer }) => {
  const { palette, treatment } = useShot();
  const { t, dur, height } = useLayerTime();
  const unit = height / 100;
  const n = layer.items.length;
  const b = layer.box ?? { x: 8, y: 30, w: 84, h: 40 };
  const lineP = easeOutCubic(prog(t, 0, Math.min(1.2, dur * 0.4)));
  return (
    <div style={{ position: "absolute", left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}>
      <div style={{ position: "absolute", left: 0, top: "50%", height: Math.max(2, unit * 0.35), width: `${lineP * 100}%`, background: rgba(palette.fg, 0.6) }} />
      {layer.items.map((it, i) => {
        const x = n === 1 ? 50 : (i / (n - 1)) * 100;
        const appear = (x / 100) * Math.min(1.2, dur * 0.4);
        const p = prog(t, appear, appear + 0.35);
        const hl = layer.highlight === i;
        const pulse = hl ? 1 + 0.15 * Math.max(0, Math.sin(t * 4)) : 1;
        return (
          <div key={i} style={{ position: "absolute", left: `${x}%`, top: "50%", transform: "translate(-50%, -50%)", display: "flex", flexDirection: "column", alignItems: "center", opacity: p }}>
            <div style={{ position: "absolute", bottom: unit * 3.2, fontFamily: font("mono", treatment), fontWeight: 700, fontSize: unit * (hl ? 3.2 : 2.6), color: hl ? palette.accent : palette.fg, whiteSpace: "nowrap" }}>
              {it.date ?? ""}
            </div>
            <div
              style={{
                width: unit * (hl ? 2.6 : 1.8),
                height: unit * (hl ? 2.6 : 1.8),
                borderRadius: "50%",
                background: hl ? palette.accent : palette.bg,
                border: `${Math.max(2, unit * 0.35)}px solid ${hl ? palette.accent : palette.fg}`,
                transform: `scale(${easeOutBack(p) * pulse})`,
              }}
            />
            <div style={{ position: "absolute", top: unit * 3.2, fontFamily: font("body", treatment), fontWeight: 600, fontSize: unit * (hl ? 2.8 : 2.3), color: hl ? palette.fg : rgba(palette.fg, 0.75), textAlign: "center", width: unit * 26 }}>
              {it.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};
