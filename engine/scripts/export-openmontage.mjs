#!/usr/bin/env node
// Export a visual plan into OpenMontage artifacts so its tooling (reviewer,
// slideshow-risk scorer, Backlot board, video_compose) understands it.
//
//   node engine/scripts/export-openmontage.mjs <project> [--out=<dir>] [--om=<path to OpenMontage checkout>]
//
// Writes:
//   scene_plan.json       valid against OpenMontage schemas/artifacts/scene_plan.schema.json
//   edit_decisions.json   composition_mode "atelier" → video_compose renders the DirectorCut engine
//   asset_requests.json   flat list of media to acquire, for the OpenMontage asset stage
import path from "node:path";
import { ENGINE_DIR, mediaSlots, parseArgs, readJson, resolveProject, writeJson } from "./lib.mjs";

const CAMERA = {
  static: "static",
  push_in: "dolly_in",
  pull_out: "dolly_out",
  pan_left: "pan_left",
  pan_right: "pan_right",
  tilt_up: "tilt_up",
  tilt_down: "tilt_down",
  drift: "steadicam",
  handheld: "handheld",
  crash_zoom: "zoom_in",
  rotate_cw: "orbital",
  rotate_ccw: "orbital",
  dolly_zoom: "dolly_in",
  custom: "static",
};
const ROLE = {
  hook: "build_tension",
  setup: "establish_context",
  context: "establish_context",
  build: "build_tension",
  tension: "build_tension",
  reveal: "deliver_payload",
  payoff: "deliver_payload",
  evidence: "evidence",
  comparison: "comparison",
  explanation: "deliver_payload",
  emotional: "emotional_beat",
  transition: "transition",
  recap: "resolution",
  cta: "call_to_action",
};

function sceneType(shot) {
  const ls = shot.layers ?? [];
  const media = ls.find((l) => ["video", "image", "parallax", "card", "split"].includes(l.type));
  if (ls.some((l) => l.type === "custom" || l.type === "bars" || l.type === "timeline" || l.type === "counter")) return media ? "broll" : "diagram";
  if (!media) return ls.some((l) => l.type === "text") ? "text_card" : "animation";
  const kind = media.asset?.kind ?? "";
  if (kind.startsWith("ai_")) return "generated";
  if (kind === "screenshot") return "screen_recording";
  if (media.type === "parallax" || media.type === "card" || media.type === "split") return "animation";
  return "broll";
}

function main() {
  const args = parseArgs();
  const project = resolveProject(args._[0]);
  const plan = readJson(project.planPath);
  const out = path.resolve(typeof args.out === "string" ? args.out : path.join(project.dir, "openmontage"));
  const assetsBySlot = {};
  for (const slot of mediaSlots(plan)) (assetsBySlot[slot.shot?.id ?? "global"] ??= []).push(slot);

  const scenes = plan.shots.map((s) => {
    const slots = assetsBySlot[s.id] ?? [];
    const texts = (s.layers ?? []).filter((l) => l.type === "text").map((l) => `${l.style ?? "title"}: ${l.text}`);
    const scene = {
      id: s.id,
      type: sceneType(s),
      description: s.intent,
      start_seconds: s.start,
      end_seconds: s.end,
      movement: s.camera?.move ?? "static",
      transition_in: s.transition_in?.type ?? "cut",
      overlay_notes: texts.join(" | ") || undefined,
      shot_language: { camera_movement: CAMERA[s.camera?.move ?? "static"] ?? "static" },
      shot_intent: s.intent,
      narrative_role: ROLE[s.beat?.role] ?? undefined,
      information_role: s.script,
      hero_moment: !!s.hero,
      texture_keywords: plan.treatment.texture ?? [],
      required_assets: slots.map((sl) => ({
        type: sl.obj.asset?.kind ?? (sl.obj.src ? "provided" : "media"),
        description: sl.obj.asset?.description ?? sl.obj.asset?.query ?? sl.obj.src ?? "",
        source: sl.obj.asset?.kind?.startsWith("ai_") ? "generate" : sl.obj.src || sl.obj.asset?.kind === "provided" ? "provided" : "source",
      })),
    };
    if (s.section) scene.script_section_id = s.section;
    return JSON.parse(JSON.stringify(scene));
  });
  writeJson(path.join(out, "scene_plan.json"), { version: "1.0", scenes, metadata: { generator: "visual-director", concept: plan.treatment.concept } });

  const omDir = typeof args.om === "string" ? path.resolve(args.om) : undefined;
  writeJson(path.join(out, "edit_decisions.json"), {
    version: "1.0",
    render_runtime: "remotion",
    composition_mode: "atelier",
    renderer_family: "animation-first",
    cuts: plan.shots.map((s) => {
      const media = (assetsBySlot[s.id] ?? []).find((sl) => sl.obj.src);
      return { id: s.id, source: media?.obj.src ?? "graphic", in_seconds: s.start, out_seconds: s.end, reason: s.intent };
    }),
    bespoke: {
      entry: omDir ? path.join(omDir, "remotion-composer", "projects", "director-cut", "index.ts") : "remotion-composer/projects/director-cut/index.ts",
      composition_id: "DirectorCut",
      art_direction: plan.treatment.concept,
      props_path: path.join(project.rendersDir, "props.json"),
      public_dir: project.assetsDir,
    },
    metadata: { note: `Run \`node ${path.relative(process.cwd(), path.join(ENGINE_DIR, "scripts", "prepare.mjs"))} ${path.relative(process.cwd(), project.dir)}\` before video_compose so props.json is current. See docs/openmontage.md for installing the engine into remotion-composer.` },
  });

  const requests = [];
  for (const slot of mediaSlots(plan)) {
    if (slot.obj.src) continue;
    const a = slot.obj.asset ?? {};
    requests.push({ slot: slot.ref, scene_id: slot.shot?.id, kind: a.kind, description: a.description, query: a.query, alternates: a.alternates, prompt: a.prompt ? `${a.prompt}${plan.treatment.ai_image_style ? `, ${plan.treatment.ai_image_style}` : ""}` : undefined, needs_cutout: a.needs_cutout, min_duration: a.min_duration, orientation: a.orientation });
  }
  writeJson(path.join(out, "asset_requests.json"), { project: plan.meta.title, requests });
  console.log(`✓ OpenMontage artifacts in ${path.relative(process.cwd(), out)}/ (scene_plan.json, edit_decisions.json, asset_requests.json)`);
}

main();
