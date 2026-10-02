#!/usr/bin/env node
// Asset checklist for a plan. The asset-scout agent works from this.
//
//   node engine/scripts/assets.mjs <project> list [--todo] [--json]
//   node engine/scripts/assets.mjs <project> brief            → writes asset_brief.md
//   node engine/scripts/assets.mjs <project> set <ref> <src> [--status=found] [--credit=..] [--source_url=..] [--license=..] [--trim=SEC] [--cost=USD]
//
// <ref> is the slot id printed by `list`, e.g. s03.L0 (layer 0 of shot s03),
// s07.L1.p0 (plane/panel 0 of layer 1), global.L0.
import fs from "node:fs";
import path from "node:path";
import { die, fmt, mediaSlots, parseArgs, readJson, resolveProject, writeJson } from "./lib.mjs";

const VIDEO_KINDS = new Set(["stock_video", "archive_video", "ai_video"]);

export function suggestedPath(ref, asset) {
  const k = asset?.kind ?? "provided";
  const safe = ref.replace(/[^a-zA-Z0-9.]/g, "_");
  if (VIDEO_KINDS.has(k)) return `footage/${safe}.mp4`;
  if (k === "ai_image") return `ai/${safe}.png`;
  if (k === "cutout" || asset?.needs_cutout) return `cutouts/${safe}.png`;
  if (k === "screenshot") return `screens/${safe}.png`;
  if (k === "map") return `maps/${safe}.png`;
  return `images/${safe}.jpg`;
}

function rows(plan, project) {
  const out = [];
  for (const slot of mediaSlots(plan)) {
    const o = slot.obj;
    const a = o.asset ?? {};
    const exists = o.src ? /^https?:/.test(o.src) || fs.existsSync(path.join(project.assetsDir, o.src)) : false;
    out.push({
      ref: slot.ref,
      shot: slot.shot?.id ?? "global",
      time: slot.shot ? `${fmt(slot.shot.start)}–${fmt(slot.shot.end)}` : "",
      duration: slot.shot ? +(slot.shot.end - slot.shot.start).toFixed(2) : undefined,
      kind: a.kind ?? (o.src ? "provided" : "?"),
      status: o.src ? (exists ? a.status ?? "found" : "missing-file") : a.status ?? "todo",
      src: o.src,
      description: a.description,
      query: a.query,
      alternates: a.alternates,
      prompt: a.prompt,
      needs_cutout: a.needs_cutout,
      min_duration: a.min_duration ?? (VIDEO_KINDS.has(a.kind) && slot.shot ? Math.ceil(slot.shot.end - slot.shot.start + 1) : undefined),
      orientation: a.orientation,
      sources: a.sources,
      fallback: a.fallback,
      suggested: o.src && !exists ? o.src : suggestedPath(slot.ref, a),
      intent: slot.shot?.intent,
      refs: [slot.ref],
    });
  }
  return groupShared(out);
}

/**
 * Plates: several shots may plan the same file (one AI illustration framed
 * wide, then in detail). Merge those slots so it's acquired once; the first
 * slot that carries a prompt/description describes it.
 */
function groupShared(rows) {
  const byKey = new Map();
  const out = [];
  for (const r of rows) {
    const key = r.src ? `src:${r.src}` : `ref:${r.ref}`;
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, r);
      out.push(r);
      continue;
    }
    prev.refs.push(r.ref);
    for (const k of ["description", "query", "alternates", "prompt", "needs_cutout", "orientation", "sources", "fallback", "intent"]) prev[k] ??= r[k];
    if (prev.kind === "?" || prev.kind === "provided") prev.kind = r.kind;
  }
  return out;
}

const DONE = new Set(["found", "generated", "provided"]);

function findSlot(plan, ref) {
  for (const slot of mediaSlots(plan)) if (slot.ref === ref) return slot;
  return undefined;
}

function main() {
  const args = parseArgs();
  const project = resolveProject(args._[0]);
  const cmd = args._[1] ?? "list";
  const plan = readJson(project.planPath);

  if (cmd === "list") {
    let r = rows(plan, project);
    if (args.todo) r = r.filter((x) => !DONE.has(x.status));
    if (args.json) return console.log(JSON.stringify(r, null, 2));
    if (!r.length) return console.log("✓ nothing to acquire");
    for (const x of r) {
      console.log(`${DONE.has(x.status) ? "✓" : "○"} ${x.ref.padEnd(12)} ${x.time.padEnd(14)} ${x.kind.padEnd(14)} ${x.status === "missing-file" ? "→ " + x.src : x.src ?? "→ " + x.suggested}${x.refs.length > 1 ? `  (used by ${x.refs.length} shots: ${x.refs.map((q) => q.split(".")[0]).join(", ")})` : ""}`);
      if (x.description) console.log(`    what:   ${x.description}`);
      if (x.query) console.log(`    query:  ${x.query}${x.alternates?.length ? `  | alt: ${x.alternates.join(" / ")}` : ""}`);
      if (x.prompt) console.log(`    prompt: ${x.prompt}`);
    }
    const todo = r.filter((x) => !DONE.has(x.status)).length;
    console.log(`\n${r.length - todo}/${r.length} acquired`);
    return;
  }

  if (cmd === "brief") {
    const r = rows(plan, project).filter((x) => !DONE.has(x.status) && (!x.src || x.status === "missing-file"));
    const style = plan.treatment.ai_image_style ? `, ${plan.treatment.ai_image_style}` : "";
    const groups = {};
    r.forEach((x) => (groups[x.kind] ??= []).push(x));
    let md = `# Asset brief — ${plan.meta.title}\n\nConcept: ${plan.treatment.concept}\n\nSave every file under \`assets/\` at the suggested path, then run \`npm run assets -- ${path.relative(process.cwd(), project.dir)} set <ref> <path>\`.\n`;
    for (const [kind, list] of Object.entries(groups)) {
      md += `\n## ${kind} (${list.length})\n`;
      for (const x of list) {
        md += `\n### ${x.ref} · ${x.time}${x.duration ? ` (${x.duration}s)` : ""}${x.refs.length > 1 ? ` · used by ${x.refs.length} shots` : ""}\n- **Shot intent:** ${x.intent ?? ""}\n- **What:** ${x.description ?? ""}\n`;
        if (x.query) md += `- **Query:** \`${x.query}\`${x.alternates?.length ? ` · alternates: ${x.alternates.map((a) => `\`${a}\``).join(", ")}` : ""}\n`;
        if (x.prompt) md += `- **Prompt:** ${x.prompt}${style}\n`;
        if (x.min_duration) md += `- **Min clip length:** ${x.min_duration}s\n`;
        if (x.needs_cutout) md += `- **Cut-out:** run background removal, save PNG with alpha\n`;
        if (x.fallback) md += `- **Fallback:** ${x.fallback}\n`;
        md += `- **Save as:** \`assets/${x.suggested}\`${x.status === "missing-file" ? " (planned path: no `set` needed, just create the file)" : ""}\n`;
      }
    }
    const out = path.join(project.dir, "asset_brief.md");
    fs.writeFileSync(out, md);
    console.log(`✓ ${path.relative(process.cwd(), out)} (${r.length} assets)`);
    return;
  }

  if (cmd === "set") {
    const [ref, src] = [args._[2], args._[3]];
    if (!ref || !src) die("usage: set <ref> <src>");
    const slot = findSlot(plan, ref);
    if (!slot) die(`no media slot ${ref} (run list)`);
    if (!/^https?:/.test(src) && !fs.existsSync(path.join(project.assetsDir, src))) die(`assets/${src} does not exist`);
    slot.obj.src = src;
    slot.obj.asset ??= { kind: "provided" };
    const a = slot.obj.asset;
    a.status = typeof args.status === "string" ? args.status : a.kind?.startsWith("ai_") ? "generated" : "found";
    for (const k of ["credit", "source_url", "license", "notes"]) if (typeof args[k] === "string") a[k] = args[k];
    if (args.cost) a.cost_usd = Number(args.cost);
    if (args.trim !== undefined) {
      if (slot.kind === "video" || slot.kind === "card" || slot.kind === "panel") slot.obj.trim = Number(args.trim);
      else console.log(`▲ trim ignored: ${ref} is a ${slot.kind}, not a clip`);
    }
    writeJson(project.planPath, plan);
    console.log(`✓ ${ref} ← ${src} (${a.status})`);
    return;
  }
  die(`unknown command ${cmd}`);
}

main();
