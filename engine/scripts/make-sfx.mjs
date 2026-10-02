#!/usr/bin/env node
// Synthesize the built-in SFX library with ffmpeg (no downloads, no licences).
// Plans reference these by cue name: { "cue": "whoosh", "at": -0.15 }.
// Usage: node engine/scripts/make-sfx.mjs [--force]
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { SFX_LIBRARY, hasFfmpeg, parseArgs } from "./lib.mjs";

const N = "(2*random(0)-1)"; // white noise sample

// name -> [duration, aevalsrc expression, extra audio filters]
const SFX = {
  whoosh: [0.7, `${N}*pow(sin(PI*t/0.7),3)`, "lowpass=f=2400,highpass=f=180,volume=1.6"],
  whoosh_long: [1.4, `${N}*pow(sin(PI*t/1.4),2.5)`, "lowpass=f=1500,highpass=f=120,volume=1.8"],
  swish: [0.32, `${N}*pow(sin(PI*t/0.32),2)`, "highpass=f=1400,lowpass=f=7000,volume=1.2"],
  impact: [1.1, `0.9*sin(2*PI*(48*t+4.8*(1-exp(-t*25))))*exp(-t*4.5)+0.35*${N}*exp(-t*38)`, "lowpass=f=2500,volume=1.3"],
  boom: [2.6, `0.9*sin(2*PI*(36*t+6*(1-exp(-t*9))))*exp(-t*1.9)+0.25*${N}*exp(-t*3)`, "lowpass=f=900,volume=1.5"],
  riser: [2.2, `(0.28*sin(2*PI*(140*t+260*t*t))+0.35*${N})*pow(t/2.2,2)`, "highpass=f=250,volume=1.4"],
  click: [0.04, `${N}*exp(-t*260)`, "highpass=f=1800,volume=1.4"],
  pop: [0.14, `sin(2*PI*(620*t-1500*t*t))*exp(-t*38)`, "volume=1.2"],
  glitch: [0.45, `0.45*sin(2*PI*(220+660*mod(floor(t*36),5))*t)*exp(-t*2.5)*gt(mod(floor(t*53),3),0)`, "acrusher=bits=6:samples=6,volume=0.9"],
  ding: [1.6, `0.35*(sin(2*PI*1320*t)+0.5*sin(2*PI*2640*t)+0.22*sin(2*PI*3960*t))*exp(-t*3.2)`, "volume=1.0"],
  typing: [1.6, `${N}*exp(-mod(t+0.03*sin(t*37),0.095)*230)*0.8`, "highpass=f=1500,lowpass=f=6500,volume=1.2"],
  shutter: [0.3, `${N}*(exp(-t*130)+0.8*exp(-abs(t-0.085)*160))`, "highpass=f=900,lowpass=f=6000,volume=1.3"],
  tick: [0.06, `sin(2*PI*2900*t)*exp(-t*280)`, "volume=1.0"],
  heartbeat: [1.0, `sin(2*PI*52*t)*(exp(-t*16)+0.75*exp(-max(t-0.27,0)*16)*gt(t,0.27))`, "lowpass=f=180,volume=2.2"],
  drone: [8.0, `0.16*(sin(2*PI*55*t)+sin(2*PI*55.6*t)+0.6*sin(2*PI*82.4*t)+0.35*sin(2*PI*110.3*t))*(0.75+0.25*sin(2*PI*0.18*t))*min(t/2,1)*min((8-t)/2,1)`, "lowpass=f=700,volume=1.1"],
};

const args = parseArgs();
if (!hasFfmpeg()) {
  console.error("✖ ffmpeg not found; SFX library skipped (plans still render, just without built-in cues).");
  process.exit(0);
}
fs.mkdirSync(SFX_LIBRARY, { recursive: true });
let made = 0;
for (const [name, [d, expr, filters]] of Object.entries(SFX)) {
  const out = path.join(SFX_LIBRARY, `${name}.wav`);
  if (fs.existsSync(out) && !args.force) continue;
  const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "lavfi", "-i", `aevalsrc='${expr}':s=44100:d=${d}`, "-af", `${filters},alimiter=limit=0.9,afade=t=out:st=${Math.max(0, d - 0.03)}:d=0.03`, "-ac", "2", "-ar", "44100", out], { encoding: "utf8" });
  if (r.status !== 0) console.error(`✖ ${name}: ${r.stderr.trim().split("\n").pop()}`);
  else made++;
}
console.log(`✓ SFX library: ${made} generated, ${Object.keys(SFX).length} cues in ${path.relative(process.cwd(), SFX_LIBRARY)}`);
