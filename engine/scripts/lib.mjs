// Shared helpers for the studio scripts. Plain ESM so it runs with `node` directly.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const ENGINE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const REPO_DIR = path.resolve(ENGINE_DIR, "..");
export const SCHEMA_PATH = path.join(REPO_DIR, "schema", "visual-plan.schema.json");
export const SFX_LIBRARY = path.join(REPO_DIR, "library", "sfx");

export function parseArgs(argv = process.argv.slice(2)) {
  const args = { _: [] };
  for (const a of argv) {
    if (a.startsWith("--")) {
      const [k, ...rest] = a.slice(2).split("=");
      args[k] = rest.length ? rest.join("=") : true;
    } else args._.push(a);
  }
  return args;
}

/** Accepts a project dir, a plan file, or a slug under projects/. */
export function resolveProject(input) {
  if (!input) die("Usage: <script> <project-dir | projects/<slug> | path/to/visual_plan.json>");
  let p = path.resolve(input);
  if (!fs.existsSync(p) && fs.existsSync(path.join(REPO_DIR, "projects", input))) p = path.join(REPO_DIR, "projects", input);
  if (!fs.existsSync(p)) die(`Not found: ${input}`);
  let dir = p;
  let planPath = path.join(p, "visual_plan.json");
  if (fs.statSync(p).isFile()) {
    planPath = p;
    dir = path.dirname(p);
  }
  if (!fs.existsSync(planPath)) die(`No visual_plan.json in ${dir}`);
  return { dir, planPath, assetsDir: path.join(dir, "assets"), rendersDir: path.join(dir, "renders") };
}

export function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    die(`Could not parse ${p}: ${e.message}`);
  }
}

export function writeJson(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n");
}

export function die(msg) {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

const VIDEO_EXT = [".mp4", ".mov", ".webm", ".m4v", ".mkv"];
export const isVideoPath = (p) => VIDEO_EXT.includes(path.extname(p.split("?")[0]).toLowerCase());
export const isRemote = (p) => /^(https?:|data:)/.test(p);

export function ffprobeDuration(file) {
  const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", file], { encoding: "utf8" });
  const d = parseFloat((r.stdout || "").trim());
  return Number.isFinite(d) ? d : undefined;
}

export function hasFfmpeg() {
  return spawnSync("ffmpeg", ["-version"], { encoding: "utf8" }).status === 0;
}

/** Headless Chromium to use. REMOTION_BROWSER wins; otherwise look for Playwright installs; else let Remotion download its own. */
export function findBrowser() {
  if (process.env.REMOTION_BROWSER) return process.env.REMOTION_BROWSER;
  const roots = [process.env.PLAYWRIGHT_BROWSERS_PATH, "/opt/pw-browsers", path.join(process.env.HOME ?? "", ".cache", "ms-playwright")].filter(Boolean);
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const d of fs.readdirSync(root).sort().reverse()) {
      if (!d.startsWith("chromium_headless_shell")) continue;
      for (const rel of ["chrome-linux/headless_shell", "chrome-headless-shell-linux64/chrome-headless-shell", "chrome-mac/headless_shell"]) {
        const c = path.join(root, d, rel);
        if (fs.existsSync(c)) return c;
      }
    }
  }
  return undefined;
}

/**
 * Normalise any transcript shape into [{word,start,end}]:
 *  - OpenMontage transcriber: { word_timestamps: [...] } or { segments: [{ words: [...] }] }
 *  - WhisperX: { segments: [{ words: [{ word, start, end }] }] }
 *  - plain array of words, or { words: [...] }
 */
export function loadWords(file) {
  const data = readJson(file);
  let words = [];
  if (Array.isArray(data)) words = data;
  else if (Array.isArray(data.word_timestamps) && data.word_timestamps.length) words = data.word_timestamps;
  else if (Array.isArray(data.words)) words = data.words;
  else if (Array.isArray(data.segments)) words = data.segments.flatMap((s) => s.words ?? []);
  return words
    .map((w) => ({ word: String(w.word ?? w.text ?? "").trim(), start: Number(w.start), end: Number(w.end ?? w.start) }))
    .filter((w) => w.word && Number.isFinite(w.start));
}

export function findTranscript(dir) {
  for (const name of ["transcript.json", "words.json", "assets/audio/transcript.json", "assets/transcript.json"]) {
    const p = path.join(dir, name);
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

/** Iterate every media-bearing object in a plan (layers, parallax planes, split panels), with a stable reference string. */
export function* mediaSlots(plan) {
  const visit = function* (layers, prefix, shot) {
    for (let i = 0; i < (layers ?? []).length; i++) {
      const l = layers[i];
      const ref = `${prefix}.L${i}`;
      if (l.type === "video" || l.type === "image" || l.type === "card") yield { ref, obj: l, layer: l, shot, kind: l.type };
      if (l.type === "parallax") for (let j = 0; j < l.planes.length; j++) if (l.planes[j].text === undefined) yield { ref: `${ref}.p${j}`, obj: l.planes[j], layer: l, shot, kind: "plane" };
      if (l.type === "split") for (let j = 0; j < l.panels.length; j++) yield { ref: `${ref}.p${j}`, obj: l.panels[j], layer: l, shot, kind: "panel" };
    }
  };
  for (const shot of plan.shots ?? []) yield* visit(shot.layers, shot.id, shot);
  yield* visit(plan.global_layers, "global", undefined);
}

export const words = (s) => (s ?? "").split(/\s+/).filter(Boolean);
export const fmt = (s) => {
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toFixed(1).padStart(4, "0")}`;
};
