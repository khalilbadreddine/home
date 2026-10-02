#!/usr/bin/env node
// Synthetic stand-in media for projects/demo so the engine can be tested
// without API keys. Real projects get real footage via the asset-scout.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { REPO_DIR, hasFfmpeg } from "./lib.mjs";

const A = path.join(REPO_DIR, "projects", "demo", "assets");
if (!hasFfmpeg()) {
  console.error("✖ ffmpeg required");
  process.exit(1);
}
const jobs = {
  "footage/sea.mp4": ["-f", "lavfi", "-i", "gradients=s=1920x1080:c0=0x06243a:c1=0x1d6f8f:c2=0x0b3550:c3=0x2a8fa8:n=4:speed=0.015:d=10:r=30", "-vf", "noise=alls=14:allf=t,gblur=sigma=1.2,eq=contrast=1.1", "-t", "10"],
  "footage/city-lights.mp4": ["-f", "lavfi", "-i", "cellauto=s=480x270:rule=110:r=30:random_fill_ratio=0.2", "-vf", "scale=1920:1080:flags=neighbor,colorchannelmixer=rr=1:gg=0.6:bb=0.2,gblur=sigma=6,eq=brightness=-0.05:saturation=1.4", "-t", "8"],
  "music/bed.wav": ["-f", "lavfi", "-i", "aevalsrc='0.18*(sin(2*PI*110*t)+0.7*sin(2*PI*164.8*t)+0.5*sin(2*PI*220*t)*(0.6+0.4*sin(2*PI*0.25*t)))*(0.7+0.3*sin(2*PI*2*t)^8)+0.12*sin(2*PI*55*t)*exp(-mod(t,0.5)*9)':s=44100:d=50", "-af", "lowpass=f=1800,afade=t=in:d=2,afade=t=out:st=46:d=4", "-ac", "2"],
  "images/sunset.jpg": ["-f", "lavfi", "-i", "color=c=black:s=1920x1080:d=1", "-vf", "geq=r='clip(255*(0.25+0.75*(1-Y/H*1.6))+180*exp(-((X-W*0.62)^2+(Y-H*0.55)^2)/(2*(H*0.09)^2)),0,255)':g='clip(255*(0.08+0.5*(1-Y/H*1.8))+140*exp(-((X-W*0.62)^2+(Y-H*0.55)^2)/(2*(H*0.08)^2)),0,255)*lt(Y,H*0.62)+30*gte(Y,H*0.62)':b='clip(90+90*(Y/H),0,255)*lt(Y,H*0.62)+(60+40*sin(X/9+Y/3))*gte(Y,H*0.62)'", "-frames:v", "1"],
};
for (const [rel, a] of Object.entries(jobs)) {
  const out = path.join(A, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const extra = out.endsWith(".wav") ? [] : out.endsWith(".mp4") ? ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "veryfast", "-crf", "23"] : ["-q:v", "3"];
  const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", ...a, ...extra, out], { encoding: "utf8" });
  console.log(r.status === 0 ? `✓ ${rel}` : `✖ ${rel}: ${r.stderr}`);
}
