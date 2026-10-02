#!/usr/bin/env node
// Render a project with the DirectorCut engine.
// Usage:
//   node engine/scripts/render.mjs <project> [--animatic] [--draft] [--from=SEC] [--to=SEC]
//                                            [--scale=0.5] [--crf=18] [--concurrency=N] [--out=path.mp4]
//   --animatic  placeholders for missing media + shot id badges (review cut)
//   --draft     half resolution, faster encode
import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { ENGINE_DIR, findBrowser, parseArgs, resolveProject } from "./lib.mjs";
import { prepare } from "./prepare.mjs";
import { validatePlan } from "./validate.mjs";

export async function bundleEngine(publicDir) {
  return bundle({ entryPoint: path.join(ENGINE_DIR, "src", "index.ts"), publicDir, onProgress: () => undefined });
}

export const chromiumOptions = {};

async function main() {
  const args = parseArgs();
  const project = resolveProject(args._[0]);
  const { props, warnings } = prepare(project, { animatic: !!args.animatic });

  const report = validatePlan(stripPrivate(props));
  if (report.errors.length) {
    report.errors.forEach((e) => console.error(`✖ [${e.code}] ${e.where ?? ""} ${e.msg}`));
    process.exit(1);
  }
  warnings.forEach((w) => console.log(`▲ ${w}`));

  const slug = props.meta.slug ?? path.basename(project.dir);
  const kind = args.animatic ? "animatic" : args.draft ? "draft" : "final";
  const out = path.resolve(typeof args.out === "string" ? args.out : path.join(project.rendersDir, `${slug}-${kind}.mp4`));
  fs.mkdirSync(path.dirname(out), { recursive: true });

  console.log("• bundling engine…");
  const serveUrl = await bundleEngine(project.assetsDir);
  const browserExecutable = findBrowser();
  const composition = await selectComposition({ serveUrl, id: "DirectorCut", inputProps: props, browserExecutable, chromiumOptions });
  const fps = composition.fps;
  const frameRange =
    args.from !== undefined || args.to !== undefined
      ? [Math.max(0, Math.round(Number(args.from ?? 0) * fps)), Math.min(composition.durationInFrames - 1, Math.round(Number(args.to ?? composition.durationInFrames / fps) * fps) - 1)]
      : undefined;
  const scale = args.scale ? Number(args.scale) : args.draft || args.animatic ? 0.5 : 1;

  console.log(`• rendering ${kind} ${composition.width}x${composition.height}@${fps} ×${scale} → ${path.relative(process.cwd(), out)}`);
  let lastPct = -1;
  await renderMedia({
    serveUrl,
    composition,
    inputProps: props,
    codec: "h264",
    outputLocation: out,
    browserExecutable,
    chromiumOptions,
    scale,
    frameRange,
    crf: args.crf ? Number(args.crf) : args.draft || args.animatic ? 26 : 18,
    concurrency: args.concurrency ? Number(args.concurrency) : undefined,
    pixelFormat: "yuv420p",
    onProgress: ({ progress }) => {
      const pct = Math.floor(progress * 100);
      if (pct % 10 === 0 && pct !== lastPct) {
        lastPct = pct;
        process.stdout.write(`  ${pct}%\n`);
      }
    },
  });
  console.log(`✓ ${out}`);
}

/** Validation runs on the authored shape; strip prepare-time fields first. */
export function stripPrivate(obj) {
  return JSON.parse(JSON.stringify(obj, (k, v) => (k.startsWith("_") ? undefined : v)));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
