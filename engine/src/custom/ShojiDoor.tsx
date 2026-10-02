import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import type { CustomProps } from "./types";
import { easeFn, prog } from "../lib/easing";

interface Key {
  at: number;
  open: number; // 0 = closed, 1 = fully open
}

function keysFromProps(props: Record<string, any>): Key[] {
  if (Array.isArray(props.keys) && props.keys.length) return [...props.keys].sort((a, b) => a.at - b.at);
  const at = props.at ?? 0;
  const max = props.max ?? 1;
  switch (props.mode ?? "open") {
    case "close":
      return [
        { at, open: max },
        { at: at + (props.duration ?? 0.35), open: 0 },
      ];
    case "hold":
      return [{ at: 0, open: props.open ?? 0 }];
    case "open":
    default:
      return [
        { at, open: 0 },
        { at: at + (props.duration ?? 0.9), open: max },
      ];
  }
}

function openAt(keys: Key[], t: number): number {
  if (t <= keys[0].at) return keys[0].open;
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (t <= b.at) {
      const closing = b.open < a.open;
      const fast = b.at - a.at <= 0.45;
      const e = easeFn(closing && fast ? "in" : "in_out")(prog(t, a.at, b.at));
      return a.open + (b.open - a.open) * e;
    }
  }
  const last = keys[keys.length - 1];
  const prev = keys[keys.length - 2];
  // A slammed door rebounds a little.
  if (prev && last.open < prev.open && last.at - prev.at <= 0.45) {
    const dt = t - last.at;
    if (dt < 0.35) return last.open + 0.025 * Math.sin(dt * 28) * Math.exp(-dt * 10);
  }
  return last.open;
}

const Panel: React.FC<{ side: "left" | "right"; shift: number; unit: number; paper: string; wood: string }> = ({ side, shift, unit, paper, wood }) => {
  const frame = unit * 1.3;
  const bar = Math.max(2, unit * 0.32);
  const cols = 3;
  const rows = 6;
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        width: "50%",
        left: side === "left" ? 0 : "50%",
        transform: `translateX(${side === "left" ? -shift * 100 : shift * 100}%)`,
        boxSizing: "border-box",
        border: `${frame}px solid ${wood}`,
        background: `radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.35), transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(120,90,50,0.08), transparent 55%), ${paper}`,
        boxShadow: side === "left" ? `inset -${unit * 0.6}px 0 ${unit * 1.2}px rgba(0,0,0,0.18), ${unit * 0.4}px 0 ${unit * 1.5}px rgba(0,0,0,0.25)` : `inset ${unit * 0.6}px 0 ${unit * 1.2}px rgba(0,0,0,0.18), -${unit * 0.4}px 0 ${unit * 1.5}px rgba(0,0,0,0.25)`,
        opacity: 0.97,
      }}
    >
      {Array.from({ length: cols - 1 }, (_, i) => (
        <div key={`c${i}`} style={{ position: "absolute", top: 0, bottom: 0, left: `${((i + 1) / cols) * 100}%`, width: bar, marginLeft: -bar / 2, background: wood }} />
      ))}
      {Array.from({ length: rows - 1 }, (_, i) => (
        <div key={`r${i}`} style={{ position: "absolute", left: 0, right: 0, top: `${((i + 1) / rows) * 100}%`, height: bar, marginTop: -bar / 2, background: wood }} />
      ))}
      {/* hikite: the recessed finger pull on the meeting edge */}
      <div
        style={{
          position: "absolute",
          top: "52%",
          [side === "left" ? "right" : "left"]: unit * 1.6,
          width: unit * 1.4,
          height: unit * 3.2,
          borderRadius: unit,
          background: "rgba(40,28,18,0.75)",
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.6)",
        }}
      />
    </div>
  );
};

/**
 * Sliding shōji doors over the shot: the "opening / closing the country" motif.
 * Put it as the TOP layer; what's beneath is revealed when the panels part.
 *
 * props: {
 *   mode?: "open" | "close" | "hold",   // presets (default "open")
 *   at?: number, duration?: number,      // seconds (open ~0.9 s, close/slam ~0.35 s)
 *   max?: number,                        // how far it opens (0..1, default 1)
 *   open?: number,                       // hold: fixed opening (0..1)
 *   gap?: number,                        // never closes tighter than this (0..1), e.g. 0.12 = "almost shut"
 *   keys?: {at, open}[],                 // full control: e.g. open → shut → open
 *   paper?: string, wood?: string
 * }
 */
export const ShojiDoor: React.FC<CustomProps> = ({ t, props }) => {
  const { height } = useVideoConfig();
  const unit = height / 100;
  const keys = keysFromProps(props);
  const gap = props.gap ?? 0;
  const o = Math.max(gap, Math.min(1, openAt(keys, t)));
  if (o >= 0.999) return null;
  const paper = props.paper ?? "#f3ecda";
  const wood = props.wood ?? "#4b3a2a";
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Panel side="left" shift={o} unit={unit} paper={paper} wood={wood} />
      <Panel side="right" shift={o} unit={unit} paper={paper} wood={wood} />
    </AbsoluteFill>
  );
};
