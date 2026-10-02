#!/usr/bin/env node
// Turn an authored plan into render props: resolve media on disk, mark what is
// missing (animatic placeholders), probe durations, inline captions, attach
// built-in SFX, compute speech spans for music ducking.
// Usage: node engine/scripts/prepare.mjs <project> [--animatic]   (writes renders/props.json)
import fs from "node:fs";
import path from "node:path";
import { SFX_LIBRARY, ffprobeDuration, findTranscript, isRemote, isVideoPath, loadWords, mediaSlots, parseArgs, readJson, resolveProject, writeJson } from "./lib.mjs";

export function prepare(project, opts = {}) {
  const plan = structuredClone(readJson(project.planPath));
  const warnings = [];
  const assetsDir = project.assetsDir;
  fs.mkdirSync(assetsDir, { recursive: true });

  const local = (src) => path.join(assetsDir, src.replace(/^\.?\//, ""));
  const check = (obj, where) => {
    if (!obj.src) {
      obj._missing = true;
      return;
    }
    if (isRemote(obj.src)) {
      obj._isVideo = isVideoPath(obj.src);
      return;
    }
    const file = local(obj.src);
    if (!fs.existsSync(file)) {
      obj._missing = true;
      warnings.push(`${where}: ${obj.src} not found in assets/ (placeholder)`);
      return;
    }
    obj._isVideo = isVideoPath(obj.src);
    if (obj._isVideo) obj._duration = ffprobeDuration(file);
  };

  for (const slot of mediaSlots(plan)) check(slot.obj, slot.ref);

  // Built-in SFX: copy the synthesized cue into the project so it is inside the public dir.
  for (const shot of plan.shots) {
    for (const s of shot.sfx ?? []) {
      if (!s.src && s.cue) {
        const lib = path.join(SFX_LIBRARY, `${s.cue}.wav`);
        if (fs.existsSync(lib)) {
          const rel = `_lib/sfx/${s.cue}.wav`;
          fs.mkdirSync(path.dirname(local(rel)), { recursive: true });
          if (!fs.existsSync(local(rel))) fs.copyFileSync(lib, local(rel));
          s.src = rel;
        }
      }
      if (!s.src || (!isRemote(s.src) && !fs.existsSync(local(s.src)))) {
        s._missing = true;
        if (s.src || s.cue) warnings.push(`${shot.id}: sfx ${s.src ?? s.cue} unavailable (run npm run setup to build the SFX library)`);
      }
    }
  }

  const audio = plan.audio ?? {};
  if (audio.voiceover) {
    const vo = audio.voiceover;
    if (!isRemote(vo.src) && !fs.existsSync(local(vo.src))) {
      vo._missing = true;
      warnings.push(`voiceover ${vo.src} not found (rendering silent)`);
    } else if (!isRemote(vo.src)) vo._duration = ffprobeDuration(local(vo.src));
  }
  for (const m of audio.music ?? []) {
    if (!isRemote(m.src) && !fs.existsSync(local(m.src))) {
      m._missing = true;
      warnings.push(`music ${m.src} not found`);
    } else if (!isRemote(m.src)) m._duration = ffprobeDuration(local(m.src));
  }

  // Captions + ducking spans from the transcript.
  const tPath = plan.captions?.src ? path.join(project.dir, plan.captions.src) : findTranscript(project.dir);
  let words = [];
  if (tPath && fs.existsSync(tPath)) words = loadWords(tPath);
  const offset = audio.voiceover?.offset ?? 0;
  words = words.map((w) => ({ ...w, start: w.start + offset, end: w.end + offset }));
  if (plan.captions?.enabled) {
    if (words.length) plan.captions._words = words;
    else warnings.push("captions enabled but no transcript found (transcript.json); captions skipped");
  }
  const spans = [];
  for (const w of words) {
    const last = spans[spans.length - 1];
    if (last && w.start - last[1] < 0.35) last[1] = Math.max(last[1], w.end);
    else spans.push([w.start, w.end]);
  }

  plan._render = { ...(plan._render ?? {}), animatic: !!opts.animatic, speechSpans: spans };
  return { props: plan, warnings };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs();
  const project = resolveProject(args._[0]);
  const { props, warnings } = prepare(project, { animatic: !!args.animatic });
  const out = path.join(project.rendersDir, "props.json");
  writeJson(out, props);
  warnings.forEach((w) => console.log(`▲ ${w}`));
  console.log(`✓ wrote ${path.relative(process.cwd(), out)}`);
}
