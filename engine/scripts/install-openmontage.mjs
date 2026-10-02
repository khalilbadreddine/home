#!/usr/bin/env node
// Optional: install the DirectorCut engine into an OpenMontage checkout so its
// own video_compose tool can render plans in "atelier" mode.
//
//   node engine/scripts/install-openmontage.mjs /path/to/OpenMontage [--deps]
//
// Copies engine/src → <OM>/remotion-composer/projects/director-cut/ and (with
// --deps) installs the few packages the engine needs beyond OpenMontage's own.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { ENGINE_DIR, die, parseArgs, readJson } from "./lib.mjs";

const args = parseArgs();
const om = args._[0] ? path.resolve(args._[0]) : process.env.OPENMONTAGE_DIR;
if (!om || !fs.existsSync(path.join(om, "remotion-composer"))) die("usage: install-openmontage.mjs /path/to/OpenMontage");
const composer = path.join(om, "remotion-composer");
const dest = path.join(composer, "projects", "director-cut");
fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(path.join(ENGINE_DIR, "src"), dest, { recursive: true });
console.log(`✓ engine copied to ${dest}`);

const ours = readJson(path.join(ENGINE_DIR, "package.json")).dependencies;
const theirs = readJson(path.join(composer, "package.json")).dependencies ?? {};
const needed = Object.keys(ours).filter((d) => !theirs[d] && !["@remotion/bundler", "@remotion/renderer", "ajv"].includes(d));
if (!needed.length) console.log("✓ remotion-composer already has every dependency");
else if (args.deps) {
  const r = spawnSync("npm", ["install", ...needed.map((d) => `${d}@${ours[d].replace(/^\^/, "")}`)], { cwd: composer, stdio: "inherit" });
  if (r.status !== 0) die("npm install failed");
} else console.log(`▲ remotion-composer is missing: ${needed.join(" ")}\n  run again with --deps, or: cd ${composer} && npm install ${needed.join(" ")}`);
console.log(`\nThen per project:\n  npm run render -- projects/<slug>          (simplest: render with this studio)\n  or: node engine/scripts/prepare.mjs projects/<slug> && npm run export:om -- projects/<slug> --om=${om}\n      and let OpenMontage's video_compose render edit_decisions.json (atelier mode).`);
