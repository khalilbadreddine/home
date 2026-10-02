#!/usr/bin/env node
// Render one or more stills per shot and build a storyboard: contact-sheet
// JPEGs (for Claude to look at) and an index.html (for humans).
// Usage: node engine/scripts/storyboard.mjs <project> [--shots=s01,s04] [--frames=1|3] [--scale=0.5] [--final]
//   --final  render without animatic badges
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import { findBrowser, fmt, hasFfmpeg, parseArgs, resolveProject } from "./lib.mjs";
import { prepare } from "./prepare.mjs";
import { bundleEngine, chromiumOptions } from "./render.mjs";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function layerSummary(l) {
  switch (l.type) {
    case "text":
      return `text/${l.style ?? "title"}: “${l.text}”`;
    case "video":
    case "image":
    case "card":
      return `${l.type}${l.type === "card" ? `/${l.frame ?? "rounded"}` : ""}: ${l.src ?? `⟨${l.asset?.kind ?? "?"}⟩ ${l.asset?.description ?? l.asset?.query ?? ""}`}${l.camera ? ` · ${l.camera.move}` : ""}`;
    case "custom":
      return `custom: ${l.component}`;
    case "fx":
      return `fx: ${l.effect}${l.kind ? `/${l.kind}` : ""}`;
    case "annotation":
      return `annotation: ${l.shape}${l.label ? ` “${l.label}”` : ""}`;
    case "counter":
      return `counter: ${l.prefix ?? ""}${l.to}${l.suffix ?? ""}`;
    case "parallax":
      return `parallax: ${l.planes.length} planes`;
    case "split":
      return `split/${l.layout ?? "two_vertical"}: ${l.panels.length} panels`;
    default:
      return l.type;
  }
}

async function main() {
  const args = parseArgs();
  const project = resolveProject(args._[0]);
  const { props } = prepare(project, { animatic: !args.final });
  const only = typeof args.shots === "string" ? new Set(args.shots.split(",")) : null;
  const perShot = Number(args.frames ?? 1);
  const fracs = perShot >= 3 ? [0.12, 0.5, 0.9] : perShot === 2 ? [0.25, 0.8] : [0.55];
  const scale = Number(args.scale ?? 0.5);
  const outDir = path.join(project.dir, "storyboard");
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(outDir, "frames"), { recursive: true });

  console.log("• bundling engine…");
  const serveUrl = await bundleEngine(project.assetsDir);
  const browserExecutable = findBrowser();
  const browser = await openBrowser("chrome", { browserExecutable, chromiumOptions });
  const composition = await selectComposition({ serveUrl, id: "DirectorCut", inputProps: props, browserExecutable, puppeteerInstance: browser });
  const fps = composition.fps;

  const shots = props.shots.filter((s) => !only || only.has(s.id));
  const cards = [];
  let n = 0;
  for (const shot of shots) {
    const imgs = [];
    for (const f of fracs) {
      const frame = Math.min(composition.durationInFrames - 1, Math.round((shot.start + (shot.end - shot.start) * f) * fps));
      n++;
      const file = path.join(outDir, "frames", `${String(n).padStart(4, "0")}_${shot.id}.jpg`);
      await renderStill({ serveUrl, composition, frame, output: file, imageFormat: "jpeg", jpegQuality: 82, scale, inputProps: props, puppeteerInstance: browser });
      imgs.push(path.relative(outDir, file));
    }
    process.stdout.write(`  ${shot.id} ✓\n`);
    cards.push({ shot, imgs });
  }
  await browser.close({ silent: true });

  // Contact sheets: 12 frames per sheet, in shot order, badges baked in.
  const sheets = [];
  if (hasFfmpeg()) {
    const frames = fs.readdirSync(path.join(outDir, "frames")).sort();
    const cols = 4;
    const per = 12;
    for (let i = 0; i < frames.length; i += per) {
      const tmp = path.join(outDir, `.sheet-${i}`);
      fs.mkdirSync(tmp, { recursive: true });
      frames.slice(i, i + per).forEach((f, j) => fs.copyFileSync(path.join(outDir, "frames", f), path.join(tmp, `${String(j + 1).padStart(4, "0")}.jpg`)));
      const count = Math.min(per, frames.length - i);
      const rows = Math.ceil(count / cols);
      const sheet = path.join(outDir, `contact-sheet-${String(sheets.length + 1).padStart(2, "0")}.jpg`);
      spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", "1", "-i", path.join(tmp, "%04d.jpg"), "-vf", `scale=640:-2,tile=${cols}x${rows}:padding=10:margin=10:color=0x101014`, "-frames:v", "1", "-q:v", "3", sheet]);
      fs.rmSync(tmp, { recursive: true, force: true });
      if (fs.existsSync(sheet)) sheets.push(path.basename(sheet));
    }
  }

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(props.meta.title)} storyboard</title>
<style>
:root{--bg:#0e0f13;--card:#171920;--fg:#ecebe6;--mut:#8b8d98;--acc:${esc(props.treatment.palette.accent)}}
body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.45 system-ui,sans-serif}
header{padding:24px 28px;border-bottom:1px solid #23252e}h1{margin:0 0 6px;font-size:22px}
.concept{color:var(--mut);max-width:900px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:18px;padding:24px 28px}
.card{background:var(--card);border-radius:10px;overflow:hidden;border:1px solid #23252e}
.card.hero{border-color:var(--acc)}
.imgs{display:flex;gap:2px;background:#000}.imgs img{width:100%;min-width:0;flex:1;display:block}
.body{padding:12px 14px}.meta{font:12px ui-monospace,monospace;color:var(--mut);display:flex;gap:10px;flex-wrap:wrap}
.meta b{color:var(--acc);font-weight:600}.script{margin:8px 0;font-style:italic}.intent{color:#c9c8c2}
ul{margin:8px 0 0;padding-left:18px;color:var(--mut);font:12px ui-monospace,monospace}
</style></head><body>
<header><h1>${esc(props.meta.title)}</h1><div class="concept">${esc(props.treatment.concept)}</div></header>
<div class="grid">
${cards
  .map(
    ({ shot, imgs }) => `<div class="card${shot.hero ? " hero" : ""}">
<div class="imgs">${imgs.map((i) => `<img src="${esc(i)}" loading="lazy">`).join("")}</div>
<div class="body"><div class="meta"><b>${esc(shot.id)}</b><span>${fmt(shot.start)}–${fmt(shot.end)} (${(shot.end - shot.start).toFixed(1)}s)</span><span>${esc(shot.section ?? "")}</span><span>${esc(shot.strategy ?? "")}</span><span>energy ${esc(shot.beat?.energy ?? "–")}</span><span>${esc(shot.camera?.move ?? "static")}</span><span>in: ${esc(shot.transition_in?.type ?? "cut")}</span>${shot.hero ? "<span>★ hero</span>" : ""}</div>
${shot.script ? `<div class="script">“${esc(shot.script)}”</div>` : ""}<div class="intent">${esc(shot.intent)}</div>
<ul>${shot.layers.map((l) => `<li>${esc(layerSummary(l))}</li>`).join("")}${(shot.sfx ?? []).map((s) => `<li>sfx: ${esc(s.cue ?? s.src)} @${s.at ?? 0}s</li>`).join("")}</ul></div></div>`,
  )
  .join("\n")}
</div></body></html>`;
  fs.writeFileSync(path.join(outDir, "index.html"), html);
  console.log(`✓ storyboard: ${path.relative(process.cwd(), path.join(outDir, "index.html"))}`);
  sheets.forEach((s) => console.log(`✓ contact sheet: ${path.relative(process.cwd(), path.join(outDir, s))}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
