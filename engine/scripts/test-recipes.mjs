#!/usr/bin/env node
// Keep the docs honest: every ```json block in recipes.md must be a valid shot body.
import fs from "node:fs";
import path from "node:path";
import { REPO_DIR } from "./lib.mjs";
import { validatePlan } from "./validate.mjs";

const file = path.join(REPO_DIR, ".claude", "skills", "visual-director", "references", "recipes.md");
const md = fs.readFileSync(file, "utf8");
const blocks = [...md.matchAll(/```json\n([\s\S]*?)```/g)].map((m) => m[1]);
let failed = 0;
blocks.forEach((src, i) => {
  let shot;
  try {
    shot = JSON.parse(src);
  } catch (e) {
    console.log(`✖ recipe ${i + 1}: invalid JSON (${e.message})`);
    failed++;
    return;
  }
  const plan = {
    version: "1.0",
    meta: { title: "recipe test" },
    treatment: { concept: "test", palette: { bg: "#000000", fg: "#ffffff", accent: "#ffcc00" }, fonts: { display: "Anton", body: "Inter" } },
    shots: [{ id: "r", start: 0, end: 4, script: "test", ...shot }],
  };
  const r = validatePlan(plan);
  if (r.errors.length) {
    failed++;
    console.log(`✖ recipe ${i + 1}:`);
    r.errors.forEach((e) => console.log(`    ${e.msg}`));
  }
});
console.log(failed ? `✖ ${failed}/${blocks.length} recipes invalid` : `✓ ${blocks.length} recipes valid`);
process.exit(failed ? 1 : 0);
