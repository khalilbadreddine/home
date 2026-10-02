#!/usr/bin/env node
// Validate a visual plan: JSON schema + timeline sanity + creative lint.
// Usage: node engine/scripts/validate.mjs <project> [--json] [--strict]
import fs from "node:fs";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { ENGINE_DIR, SCHEMA_PATH, mediaSlots, parseArgs, readJson, resolveProject, words, fmt } from "./lib.mjs";

export function registeredCustomComponents() {
  const src = fs.readFileSync(path.join(ENGINE_DIR, "src", "custom", "index.ts"), "utf8");
  const block = src.match(/CUSTOM_COMPONENTS[^{]*\{([\s\S]*?)\}/);
  return new Set((block?.[1] ?? "").split(/[\s,]+/).map((s) => s.split(":")[0].trim()).filter(Boolean));
}

const GRAPHIC = new Set(["text", "counter", "annotation", "bars", "timeline", "custom"]);
const FANCY = new Set(["whip_left", "whip_right", "whip_up", "whip_down", "zoom_through", "zoom_out", "glitch", "iris", "film_burn", "slide_left", "slide_right", "slide_up", "wipe_left", "wipe_right"]);
const norm = (w) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

export function validatePlan(plan) {
  const errors = [];
  const warnings = [];
  const info = [];
  const E = (code, msg, where) => errors.push({ code, msg, where });
  const W = (code, msg, where) => warnings.push({ code, msg, where });
  const I = (code, msg, where) => info.push({ code, msg, where });

  // ---- schema ----
  const ajv = new Ajv2020({ allErrors: true, strict: false, discriminator: true });
  const validate = ajv.compile(readJson(SCHEMA_PATH));
  if (!validate(plan)) {
    for (const e of validate.errors ?? []) {
      const extra = e.params?.additionalProperty ?? e.params?.unevaluatedProperty ?? e.params?.allowedValues?.join(", ") ?? "";
      E("SCHEMA", `${e.instancePath || "/"} ${e.message}${extra ? ` (${extra})` : ""}`);
    }
    return { errors, warnings, info, stats: {} };
  }

  const shots = plan.shots;
  const custom = registeredCustomComponents();

  // ---- timeline ----
  const ids = new Set();
  shots.forEach((s, i) => {
    if (ids.has(s.id)) E("DUP_ID", `duplicate shot id "${s.id}"`, s.id);
    ids.add(s.id);
    const d = s.end - s.start;
    if (d <= 0) E("BAD_TIMES", `end (${s.end}) must be after start (${s.start})`, s.id);
    if (i > 0) {
      const prev = shots[i - 1];
      if (s.start < prev.end - 0.01) E("OVERLAP", `starts at ${s.start}s but ${prev.id} ends at ${prev.end}s (shots must be sorted and contiguous)`, s.id);
      else if (s.start - prev.end > 0.05) W("GAP", `${(s.start - prev.end).toFixed(2)}s gap after ${prev.id} renders as empty background`, s.id);
    } else if (s.start > 0.05) W("GAP", `video starts with ${s.start}s of nothing`, s.id);

    const sd = Math.max(0, d);
    if (sd > 12) E("LONG_SHOT", `${sd.toFixed(1)}s is far too long for one shot; split the beat`, s.id);
    else if (sd > (s.hero ? 9 : 7)) W("LONG_SHOT", `${sd.toFixed(1)}s shot: viewers drift after ~6s without a change; split it or add a mid-shot event (annotation, text, camera change)`, s.id);
    if (s.hero && sd < 1.5) W("HERO_SHORT", `hero shot lasts ${sd.toFixed(2)}s; a hero needs room. Ask for a pause in the voiceover (hold), merge it with the next beat, or demote it`, s.id);
    if (sd < 0.5 && s.strategy !== "montage") W("SHORT_SHOT", `${sd.toFixed(2)}s is a flash frame; only use in montage bursts`, s.id);
    if ((s.intent ?? "").trim().length < 15) W("WEAK_INTENT", "intent is too thin: say what the viewer must understand AND feel", s.id);

    (s.layers ?? []).forEach((l, li) => {
      const where = `${s.id}.L${li}`;
      if (l.start !== undefined && l.start >= sd) E("LAYER_TIME", `layer starts at ${l.start}s, after the shot ends (${sd.toFixed(2)}s)`, where);
      if (l.end !== undefined && l.start !== undefined && l.end <= l.start) E("LAYER_TIME", "layer end must be after start", where);
      if (l.type === "custom" && !custom.has(l.component)) E("CUSTOM", `component "${l.component}" is not registered in engine/src/custom/index.ts (registered: ${[...custom].join(", ")})`, where);
      if (l.type === "text") {
        const n = words(l.text).length;
        const max = l.style === "typewriter" || l.style === "quote" ? 25 : l.style === "slam" ? 4 : 12;
        if (n > max) W("TEXT_LONG", `${l.style ?? "title"} text has ${n} words (max ~${max}); on-screen text is read, not listened to`, where);
        const sw = new Set(words(s.script).map(norm));
        const tw = words(l.text).map(norm).filter(Boolean);
        if (tw.length > 5 && sw.size && tw.filter((w) => sw.has(w)).length / tw.length > 0.8 && l.style !== "kinetic" && l.style !== "quote")
          W("TEXT_ECHO", "text repeats the narration word for word; show the key term or a new fact instead (captions already carry the words)", where);
        if (l.style === "kinetic" && l.word_times && l.word_times.length !== words(l.text).length) W("WORD_TIMES", "word_times count does not match the number of words", where);
        if (l.position === "bottom" && plan.captions?.enabled && (plan.captions.position ?? "bottom") === "bottom") W("CAPTION_CLASH", "bottom text collides with bottom captions; use lower_third/top or hide captions for this shot", where);
      }
    });
  });

  // ---- media sources ----
  let assetsTotal = 0;
  let assetsTodo = 0;
  const assetKinds = {};
  for (const slot of mediaSlots(plan)) {
    const o = slot.obj;
    if (!o.src && !o.asset) {
      E("NO_SOURCE", "media has neither src nor asset request", slot.ref);
      continue;
    }
    assetsTotal++;
    if (!o.src) assetsTodo++;
    const k = o.asset?.kind ?? (o.src ? "provided" : "unknown");
    assetKinds[k] = (assetKinds[k] ?? 0) + 1;
    if (o.asset && !o.src) {
      if ((o.asset.kind.startsWith("stock") || o.asset.kind.startsWith("archive")) && !o.asset.query) W("NO_QUERY", "stock/archive asset needs a query", slot.ref);
      if (o.asset.kind.startsWith("ai_") && !o.asset.prompt) W("NO_PROMPT", "AI asset needs a prompt", slot.ref);
      if (!o.asset.description) I("NO_DESCRIPTION", "add asset.description so the animatic placeholder says what goes here", slot.ref);
    }
  }

  // ---- creative lint ----
  const n = shots.length;
  const durs = shots.map((s) => Math.max(0, s.end - s.start));
  const total = shots.length ? shots[n - 1].end : 0;
  const baseOf = (s) => {
    const l = (s.layers ?? []).find((x) => ["video", "image", "parallax", "split", "card", "background", "custom"].includes(x.type));
    if (!l) return "none";
    if (l.type === "image" || l.type === "video") return `${l.type}:${l.asset?.kind ?? "file"}`;
    if (l.type === "custom") return `custom:${l.component}`;
    return l.type;
  };
  const sig = (s) => `${baseOf(s).split(":")[0]}|${s.camera?.move ?? "static"}|${(s.layers ?? []).some((l) => GRAPHIC.has(l.type)) ? "g" : "-"}`;

  // hook pacing
  const hookShots = shots.filter((s) => s.start < 15);
  if (hookShots.length) {
    const asl = Math.min(15, total) / hookShots.length;
    if (durs[0] > 4) W("HOOK_SLOW", `first shot holds ${durs[0].toFixed(1)}s; open with a visual question in under 3s`, shots[0].id);
    if (asl > 3.5 && total > 30) W("HOOK_SLOW", `first 15s average ${asl.toFixed(1)}s per shot; hooks cut faster (1.5-3s)`, "hook");
  }

  // repetition
  let run = 1;
  for (let i = 1; i < n; i++) {
    run = sig(shots[i]) === sig(shots[i - 1]) ? run + 1 : 1;
    if (run === 3) W("REPEAT", `three shots in a row with the same base, camera move and overlay pattern (${sig(shots[i])}); vary scale, move or technique`, `${shots[i - 2].id}..${shots[i].id}`);
  }
  let camRun = 1;
  for (let i = 1; i < n; i++) {
    const a = shots[i].camera?.move ?? "static";
    camRun = a !== "static" && a === (shots[i - 1].camera?.move ?? "static") ? camRun + 1 : 1;
    if (camRun === 3) W("REPEAT_CAMERA", `"${a}" three times in a row; the move stops registering`, `${shots[i - 2].id}..${shots[i].id}`);
  }

  // slideshow risk
  const kenBurnsOnly = shots.filter((s) => {
    const ls = s.layers ?? [];
    const media = ls.filter((l) => !(l.type === "fx"));
    return media.length === 1 && media[0].type === "image" && ["push_in", "pull_out", "drift", "static", undefined].includes(s.camera?.move);
  });
  if (n >= 6 && kenBurnsOnly.length / n > 0.4)
    W("SLIDESHOW", `${kenBurnsOnly.length}/${n} shots are a single still with a slow zoom; that is the slideshow look. Use footage, parallax, cards, split screens, annotations or typography for at least half of them`, "plan");
  const dead = shots.filter((s) => {
    const ls = s.layers ?? [];
    const moving = ls.some((l) => l.type === "video" || l.type === "custom" || l.type === "parallax" || l.camera || (l.type === "fx" && ["particles", "light_leak"].includes(l.effect)));
    return !moving && (s.camera?.move ?? "static") === "static" && !ls.some((l) => GRAPHIC.has(l.type));
  });
  dead.forEach((s) => W("DEAD_FRAME", "nothing moves in this shot (static camera, stills, no animated graphics)", s.id));

  // text balance
  const withGraphic = shots.filter((s) => (s.layers ?? []).some((l) => GRAPHIC.has(l.type))).length;
  const withText = shots.filter((s) => (s.layers ?? []).some((l) => l.type === "text")).length;
  if (n >= 8 && withText / n > 0.65) W("TEXT_OVERLOAD", `${withText}/${n} shots carry text; let some images breathe`, "plan");
  if (n >= 8 && withGraphic / n < 0.12) W("GRAPHIC_STARVED", `only ${withGraphic}/${n} shots have graphic storytelling (text, numbers, annotations, maps); the video will feel like plain b-roll`, "plan");

  // transitions
  const cuts = shots.slice(1);
  const fancy = cuts.filter((s) => s.transition_in && FANCY.has(s.transition_in.type)).length;
  if (cuts.length >= 6 && fancy / cuts.length > 0.35) W("TRANSITION_SPAM", `${fancy}/${cuts.length} cuts use flashy transitions; most cuts should be hard cuts. Save effects for section changes and impacts`, "plan");

  // heroes and interrupts
  const heroes = shots.filter((s) => s.hero);
  if (n >= 8 && heroes.length === 0) W("NO_HERO", "no hero shots; pick 1 per section and spend budget there", "plan");
  if (n >= 8 && heroes.length > Math.max(2, Math.ceil(n * 0.2))) W("TOO_MANY_HEROES", `${heroes.length}/${n} shots marked hero; if everything is special nothing is`, "plan");
  const isInterrupt = (s, i) =>
    s.hero ||
    (s.beat?.energy ?? 0) >= 4 ||
    (i > 0 && s.section && s.section !== shots[i - 1].section) ||
    ["dip_black", "dip_white", "flash", "glitch", "film_burn"].includes(s.transition_in?.type) ||
    (s.layers ?? []).some((l) => l.type === "text" && ["slam", "chapter"].includes(l.style)) ||
    (s.post ?? []).length > 0;
  let last = 0;
  shots.forEach((s, i) => {
    if (isInterrupt(s, i)) {
      if (s.start - last > 45) W("NO_INTERRUPT", `${(s.start - last).toFixed(0)}s (${fmt(last)}–${fmt(s.start)}) without a pattern interrupt; add a hero, slam, chapter card or energy spike`, s.id);
      last = s.start;
    }
  });
  if (total - last > 45) W("NO_INTERRUPT", `${(total - last).toFixed(0)}s without a pattern interrupt at the end`, "ending");

  // strategy mix
  const strat = {};
  shots.forEach((s) => (strat[s.strategy ?? "unset"] = (strat[s.strategy ?? "unset"] ?? 0) + 1));
  if ((strat.unset ?? 0) > 0) I("NO_STRATEGY", `${strat.unset} shots have no strategy; naming it forces a deliberate choice`, "plan");
  if (n >= 8 && (strat.literal ?? 0) / n > 0.5) W("TOO_LITERAL", `${strat.literal}/${n} shots are literal; translate some beats into metaphor, evidence, data, contrast or specific detail`, "plan");

  // energy
  const energies = shots.map((s) => s.beat?.energy).filter((e) => typeof e === "number");
  if (energies.length >= 8) {
    const mean = energies.reduce((a, b) => a + b, 0) / energies.length;
    const sd = Math.sqrt(energies.reduce((a, b) => a + (b - mean) ** 2, 0) / energies.length);
    if (sd < 0.6) W("FLAT_ENERGY", `energy barely varies (σ=${sd.toFixed(2)}); plan peaks and valleys`, "plan");
  }

  if (!shots.some((s) => (s.sfx ?? []).length)) I("NO_SFX", "no sound design; whooshes on transitions and impacts on slams double perceived polish", "plan");
  if ((plan.treatment.texture_intensity ?? 0.35) > 0.6) W("TEXTURE_HEAVY", "texture intensity above 0.6 reads as a filter, not a look", "treatment");
  if (assetsTodo) I("ASSETS_TODO", `${assetsTodo}/${assetsTotal} media slots still need assets (animatic shows placeholders)`, "plan");

  // ---- stats ----
  const sorted = [...durs].sort((a, b) => a - b);
  const hist = (f) => shots.reduce((m, s) => ((m[f(s)] = (m[f(s)] ?? 0) + 1), m), {});
  const bins = 20;
  const curve = Array.from({ length: bins }, (_, b) => {
    const t0 = (b / bins) * total;
    const t1 = ((b + 1) / bins) * total;
    const inBin = shots.filter((s) => s.start < t1 && s.end > t0);
    const e = inBin.map((s) => s.beat?.energy ?? 3);
    return e.length ? e.reduce((a, c) => a + c, 0) / e.length : 0;
  });
  const stats = {
    duration: total,
    shots: n,
    asl: n ? total / n : 0,
    median: n ? sorted[Math.floor(n / 2)] : 0,
    heroes: heroes.length,
    strategies: strat,
    cameras: hist((s) => s.camera?.move ?? "static"),
    bases: hist(baseOf),
    transitions: hist((s) => s.transition_in?.type ?? "cut"),
    assets: { total: assetsTotal, todo: assetsTodo, kinds: assetKinds },
    energy_curve: curve.map((e) => "▁▂▃▄▅▆▇█"[Math.max(0, Math.min(7, Math.round(((e - 1) / 4) * 7)))]).join(""),
  };
  return { errors, warnings, info, stats };
}

function printReport(r, file) {
  const s = r.stats;
  console.log(`\nVisual plan: ${file}`);
  if (s.shots) {
    console.log(`  ${s.shots} shots · ${fmt(s.duration)} · avg ${s.asl.toFixed(2)}s · median ${s.median.toFixed(2)}s · heroes ${s.heroes}`);
    console.log(`  energy  ${s.energy_curve}`);
    const top = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}×${v}`).join("  ");
    console.log(`  strategy    ${top(s.strategies)}`);
    console.log(`  camera      ${top(s.cameras)}`);
    console.log(`  base        ${top(s.bases)}`);
    console.log(`  transitions ${top(s.transitions)}`);
    console.log(`  assets      ${s.assets.total - s.assets.todo}/${s.assets.total} acquired  (${top(s.assets.kinds)})`);
  }
  const line = (sym, x) => console.log(`  ${sym} [${x.code}]${x.where ? ` ${x.where}:` : ""} ${x.msg}`);
  if (r.errors.length) {
    console.log(`\nErrors (${r.errors.length})`);
    r.errors.forEach((x) => line("✖", x));
  }
  if (r.warnings.length) {
    console.log(`\nWarnings (${r.warnings.length})`);
    r.warnings.forEach((x) => line("▲", x));
  }
  if (r.info.length) {
    console.log(`\nNotes`);
    r.info.forEach((x) => line("·", x));
  }
  console.log(r.errors.length ? "\n✖ Plan is not renderable until errors are fixed.\n" : r.warnings.length ? "\n✓ Renderable. Review the warnings: each one is a craft problem a viewer will feel.\n" : "\n✓ Clean.\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs();
  const { planPath } = resolveProject(args._[0]);
  const plan = readJson(planPath);
  const r = validatePlan(plan);
  if (args.json) console.log(JSON.stringify(r, null, 2));
  else printReport(r, path.relative(process.cwd(), planPath));
  process.exit(r.errors.length || (args.strict && r.warnings.length) ? 1 : 0);
}
