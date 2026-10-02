#!/usr/bin/env node
// Create a studio project, optionally importing an OpenMontage project.
//
//   node engine/scripts/new-project.mjs <slug> [--title="..."] [--script=path.md|.txt|.json]
//                                       [--from-om=/path/to/OpenMontage/projects/<name>]
//
// --from-om copies artifacts/script.json (→ script.md), the narration audio
// (→ assets/audio/voiceover.*), music (→ assets/music/), and any transcript.
import fs from "node:fs";
import path from "node:path";
import { REPO_DIR, die, parseArgs, readJson } from "./lib.mjs";

const AUDIO = [".mp3", ".wav", ".m4a", ".aac", ".flac", ".ogg"];

function scriptJsonToMd(json) {
  const s = json.sections ?? [];
  return `# ${json.title ?? "Script"}\n\n` + s.map((x) => `## ${x.label ?? x.id}\n\n${x.text}\n`).join("\n");
}

function main() {
  const args = parseArgs();
  const slug = args._[0];
  if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) die("usage: new-project <kebab-case-slug> [--script=..] [--from-om=..]");
  const dir = path.join(REPO_DIR, "projects", slug);
  if (fs.existsSync(path.join(dir, "visual_plan.json"))) die(`${dir} already has a visual_plan.json`);
  for (const d of ["assets/footage", "assets/images", "assets/ai", "assets/cutouts", "assets/audio", "assets/music", "renders"]) fs.mkdirSync(path.join(dir, d), { recursive: true });

  const notes = [];
  if (typeof args.script === "string") {
    const src = path.resolve(args.script);
    if (!fs.existsSync(src)) die(`script not found: ${src}`);
    const md = src.endsWith(".json") ? scriptJsonToMd(readJson(src)) : fs.readFileSync(src, "utf8");
    fs.writeFileSync(path.join(dir, "script.md"), md);
    notes.push(`script ← ${src}`);
  }

  if (typeof args["from-om"] === "string") {
    const om = path.resolve(args["from-om"]);
    if (!fs.existsSync(om)) die(`OpenMontage project not found: ${om}`);
    const scriptJson = ["artifacts/script.json", "script.json"].map((p) => path.join(om, p)).find((p) => fs.existsSync(p));
    if (scriptJson && !fs.existsSync(path.join(dir, "script.md"))) {
      fs.writeFileSync(path.join(dir, "script.md"), scriptJsonToMd(readJson(scriptJson)));
      notes.push(`script ← ${scriptJson}`);
    }
    // Narration: prefer files named like a final mix / narration / voiceover, else the largest audio file.
    const audioDir = path.join(om, "assets", "audio");
    if (fs.existsSync(audioDir)) {
      const files = fs.readdirSync(audioDir).filter((f) => AUDIO.includes(path.extname(f).toLowerCase()));
      const ranked = files
        .map((f) => ({ f, size: fs.statSync(path.join(audioDir, f)).size, named: /(final|full|mix|narration|voice|vo)/i.test(f) ? 1 : 0 }))
        .sort((a, b) => b.named - a.named || b.size - a.size);
      if (ranked[0]) {
        const ext = path.extname(ranked[0].f);
        fs.copyFileSync(path.join(audioDir, ranked[0].f), path.join(dir, "assets", "audio", `voiceover${ext}`));
        notes.push(`voiceover ← ${ranked[0].f}${ranked.length > 1 ? ` (picked from ${ranked.length} audio files — check it is the full narration)` : ""}`);
      }
    }
    const musicDir = path.join(om, "assets", "music");
    if (fs.existsSync(musicDir)) {
      for (const f of fs.readdirSync(musicDir).filter((x) => AUDIO.includes(path.extname(x).toLowerCase()))) {
        fs.copyFileSync(path.join(musicDir, f), path.join(dir, "assets", "music", f));
        notes.push(`music ← ${f}`);
      }
    }
    const transcript = ["artifacts/transcript.json", "assets/audio/transcript.json", "transcript.json"].map((p) => path.join(om, p)).find((p) => fs.existsSync(p));
    if (transcript) {
      fs.copyFileSync(transcript, path.join(dir, "transcript.json"));
      notes.push(`transcript ← ${transcript}`);
    }
  }

  fs.writeFileSync(
    path.join(dir, "brief.md"),
    `# ${typeof args.title === "string" ? args.title : slug}\n\n- Audience:\n- Platform: YouTube 16:9\n- Tone / references:\n- Budget for AI images: (e.g. max 8)\n- Must show / must avoid:\n`,
  );
  console.log(`✓ projects/${slug}/`);
  notes.forEach((n) => console.log(`  ${n}`));
  if (!fs.existsSync(path.join(dir, "script.md"))) console.log("  ▲ no script yet: put the narration in script.md");
  console.log(`\nNext: in Claude Code run  /direct projects/${slug}`);
}

main();
