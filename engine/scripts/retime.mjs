#!/usr/bin/env node
// Fix shot timing so you never do timeline arithmetic by hand.
//
//   node engine/scripts/retime.mjs <project> --estimate [--wpm=160]
//       Times every shot from the word count of its `script` (before a voiceover exists).
//   node engine/scripts/retime.mjs <project> [--transcript=path.json]
//       Snaps shots to real word timestamps (OpenMontage transcriber / WhisperX JSON).
//
// Both modes also resolve `cue_word` on layers and sfx (sync an element to the
// moment a word is spoken), rescale other layer times to the new shot length,
// and fill `word_times` for kinetic text. Writes a .bak of the plan first.
import fs from "node:fs";
import path from "node:path";
import { findTranscript, loadWords, parseArgs, readJson, resolveProject, writeJson, words, fmt } from "./lib.mjs";

const norm = (w) => w.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]/gu, "");
const tokens = (s) => words(s).map(norm).filter(Boolean);

const NUM = {
  zero: "0", one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7", eight: "8", nine: "9", ten: "10",
  eleven: "11", twelve: "12", thirteen: "13", fourteen: "14", fifteen: "15", sixteen: "16", seventeen: "17", eighteen: "18",
  nineteen: "19", twenty: "20", thirty: "30", forty: "40", fifty: "50", sixty: "60", seventy: "70", eighty: "80", ninety: "90",
  hundred: "100", thousand: "000", first: "1st", second: "2nd", third: "3rd", percent: "%",
};

function lev(a, b) {
  const m = a.length;
  const n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}

/** How alike two normalised tokens are (0..1). Handles spelled-out numbers vs digits, UK/US spelling, inflections. */
export function similarity(a, b) {
  if (a === b) return 1;
  const ca = NUM[a] ?? a;
  const cb = NUM[b] ?? b;
  if (ca === cb) return 0.95;
  if (/^\d+$/.test(ca) && /^\d+$/.test(cb) && (ca.startsWith(cb) || cb.startsWith(ca))) return 0.7;
  if (Math.min(a.length, b.length) < 3) return 0;
  const r = 1 - lev(a, b) / Math.max(a.length, b.length);
  return r >= 0.7 ? r : 0;
}

/** Weighted LCS alignment of script tokens to transcript tokens. Returns map scriptIdx -> transcriptIdx. */
export function align(script, trans) {
  const n = script.length;
  const m = trans.length;
  const W = m + 1;
  const dp = new Float32Array((n + 1) * W);
  const simCache = new Map();
  const sim = (i, j) => {
    const k = script[i] + "\u0000" + trans[j];
    let v = simCache.get(k);
    if (v === undefined) simCache.set(k, (v = similarity(script[i], trans[j])));
    return v;
  };
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      const s = sim(i, j);
      const diag = s > 0 ? dp[(i + 1) * W + j + 1] + s : -1;
      dp[i * W + j] = Math.max(diag, dp[(i + 1) * W + j], dp[i * W + j + 1]);
    }
  }
  const map = new Map();
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    const s = sim(i, j);
    if (s > 0 && Math.abs(dp[i * W + j] - (dp[(i + 1) * W + j + 1] + s)) < 1e-4) {
      map.set(i, j);
      i++;
      j++;
    } else if (dp[(i + 1) * W + j] >= dp[i * W + j + 1]) i++;
    else j++;
  }
  return map;
}

function main() {
  const args = parseArgs();
  const project = resolveProject(args._[0]);
  const plan = readJson(project.planPath);
  const shots = plan.shots;
  const oldDur = shots.map((s) => s.end - s.start);
  const LEAD = 0.08; // cut a hair before the word lands

  // wordTimes[i] = absolute time of each script token of shot i (for cue_word / kinetic)
  const wordTimes = shots.map(() => []);
  let report = "";

  if (args.estimate) {
    const wps = Number(args.wpm ?? 160) / 60;
    let t = 0;
    shots.forEach((s, i) => {
      const toks = tokens(s.script);
      let d;
      if (toks.length) {
        const pauses = (s.script.match(/[.!?…:;]/g) ?? []).length * 0.25 + (s.script.match(/,/g) ?? []).length * 0.1;
        d = Math.max(1, toks.length / wps + pauses) + (s.hold ?? 0);
        toks.forEach((_, k) => wordTimes[i].push(t + (k / toks.length) * (d - 0.25)));
      } else d = oldDur[i] > 0 ? oldDur[i] : 1.5;
      s.start = +t.toFixed(3);
      t += d;
      s.end = +t.toFixed(3);
    });
    plan.meta.timing = "estimated";
    report = `estimated from word counts at ${args.wpm ?? 160} wpm → ${fmt(shots[shots.length - 1].end)}`;
  } else {
    const tPath = typeof args.transcript === "string" ? path.resolve(args.transcript) : findTranscript(project.dir);
    if (!tPath || !fs.existsSync(tPath)) {
      console.error("✖ No transcript. Pass --transcript=path.json (OpenMontage transcriber output) or use --estimate.");
      process.exit(1);
    }
    const tw = loadWords(tPath);
    const offset = plan.audio?.voiceover?.offset ?? 0;
    const T = tw.map((w) => ({ n: norm(w.word), start: w.start + offset, end: w.end + offset }));
    const flat = [];
    shots.forEach((s, i) => tokens(s.script).forEach((tok, k) => flat.push({ tok, shot: i, k })));
    const map = align(flat.map((f) => f.tok), T.map((t) => t.n));
    const matched = map.size;

    // Per shot: which transcript words it owns. A shot owns its matched words plus
    // unclaimed words before them (misheard or merged words like "Tanger Med" →
    // "Tangermet"); fully unmatched shots take the unclaimed gap between neighbours.
    const firstIdx = shots.map(() => undefined);
    const lastIdx = shots.map(() => undefined);
    const leading = shots.map(() => 0);
    const trailing = shots.map(() => 0);
    shots.forEach((s, i) => {
      const idxs = flat.map((f, idx) => (f.shot === i ? idx : -1)).filter((x) => x >= 0);
      const hits = idxs.map((idx) => map.get(idx));
      const firstHit = hits.findIndex((x) => x !== undefined);
      if (firstHit < 0) return;
      const lastHit = hits.length - 1 - [...hits].reverse().findIndex((x) => x !== undefined);
      firstIdx[i] = hits[firstHit];
      lastIdx[i] = hits[lastHit];
      leading[i] = firstHit;
      trailing[i] = hits.length - 1 - lastHit;
    });
    const first = shots.map(() => undefined);
    const lastEnd = shots.map(() => undefined);
    let prevLast = -1;
    let prevTrailing = 0;
    shots.forEach((s, i) => {
      if (!tokens(s.script).length) return;
      const gapStart = Math.min(T.length - 1, prevLast + 1 + prevTrailing);
      if (firstIdx[i] !== undefined) {
        const startIdx = leading[i] > 0 ? Math.min(firstIdx[i], Math.max(gapStart, firstIdx[i] - leading[i])) : firstIdx[i];
        first[i] = T[startIdx].start;
        lastEnd[i] = T[lastIdx[i]].end;
        prevLast = lastIdx[i];
        prevTrailing = trailing[i];
      } else {
        const later = firstIdx.slice(i + 1).filter((x) => x !== undefined);
        const nextFirst = later.length ? Math.min(...later) : T.length;
        if (gapStart < nextFirst && gapStart >= 0) {
          first[i] = T[gapStart].start;
          lastEnd[i] = T[nextFirst - 1].end;
          prevLast = nextFirst - 1;
          prevTrailing = 0;
        }
      }
    });
    // Token times: matched words exact, the rest interpolated inside the shot's span.
    shots.forEach((s, i) => {
      const toks = tokens(s.script);
      const idxs = flat.map((f, idx) => (f.shot === i ? idx : -1)).filter((x) => x >= 0);
      const times = idxs.map((idx) => (map.has(idx) ? T[map.get(idx)].start : undefined));
      if (times.every((x) => x === undefined) && first[i] !== undefined) {
        const span = Math.max(0.2, (lastEnd[i] ?? first[i] + 0.3 * times.length) - first[i]);
        times.forEach((_, k) => (times[k] = first[i] + (k / Math.max(1, times.length)) * span));
      }
      for (let k = 0; k < times.length; k++) {
        if (times[k] !== undefined) continue;
        const prev = times.slice(0, k).reverse().find((x) => x !== undefined);
        const next = times.slice(k + 1).find((x) => x !== undefined);
        times[k] = prev !== undefined && next !== undefined ? (prev + next) / 2 : prev !== undefined ? prev + 0.3 : next !== undefined ? Math.max(first[i] ?? 0, next - 0.3) : undefined;
      }
      wordTimes[i] = toks.length ? times : [];
    });

    // Starts for scripted shots; scriptless shots slot in after the previous words end.
    const starts = shots.map((s, i) => (first[i] !== undefined ? Math.max(0, first[i] - LEAD) : undefined));
    starts[0] = 0;
    for (let i = 1; i < shots.length; i++) {
      if (starts[i] !== undefined) continue;
      // run of scriptless shots i..k-1 between scripted neighbours
      let k = i;
      while (k < shots.length && starts[k] === undefined) k++;
      const prevEnd = lastEnd[i - 1] ?? (starts[i - 1] ?? 0) + oldDur[i - 1];
      const nextStart = k < shots.length ? starts[k] : prevEnd + oldDur.slice(i, k).reduce((a, b) => a + b, 0);
      const span = Math.max(0.4 * (k - i), nextStart - prevEnd);
      const weights = oldDur.slice(i, k);
      const wsum = weights.reduce((a, b) => a + b, 0) || 1;
      let t = Math.min(prevEnd + 0.05, nextStart - 0.4 * (k - i));
      for (let q = i; q < k; q++) {
        starts[q] = t;
        t += (span * weights[q - i]) / wsum;
      }
    }
    // Enforce monotonic starts with a minimum shot length.
    for (let i = 1; i < shots.length; i++) if (starts[i] < starts[i - 1] + 0.4) starts[i] = starts[i - 1] + 0.4;
    const vo = plan.audio?.voiceover;
    const tail = Math.max((T.length ? T[T.length - 1].end : 0) + 0.8, starts[starts.length - 1] + Math.max(1, oldDur[oldDur.length - 1]));
    shots.forEach((s, i) => {
      s.start = +starts[i].toFixed(3);
      s.end = +(i + 1 < shots.length ? starts[i + 1] : tail).toFixed(3);
    });
    plan.meta.timing = "voiceover";
    const pauses = [];
    shots.forEach((s, i) => {
      if (!s.hold || lastEnd[i] === undefined) return;
      const silence = s.end - lastEnd[i];
      if (silence + 0.15 < s.hold) pauses.push({ shot: s.id, after: words(s.script).slice(-3).join(" "), want: s.hold, has: +silence.toFixed(2) });
    });
    const unmatchedShots = shots.filter((s, i) => tokens(s.script).length && first[i] === undefined).map((s) => s.id);
    report = `matched ${matched}/${flat.length} script words to ${T.length} transcript words (${vo?.src ?? path.basename(tPath)})`;
    if (unmatchedShots.length) report += `\n▲ could not place: ${unmatchedShots.join(", ")} (script text differs from the voiceover?)`;
    const gapTimed = shots.filter((s, i) => tokens(s.script).length && firstIdx[i] === undefined && first[i] !== undefined).map((s) => s.id);
    if (gapTimed.length) report += `\n· timed from unrecognised speech between neighbours: ${gapTimed.join(", ")} (proper nouns often transcribe oddly; check these cuts)`;
    if (pauses.length) {
      report += `\n▲ the voiceover doesn't leave the holds the plan asks for:`;
      for (const p of pauses) report += `\n    ${p.shot}: ${p.want}s after "…${p.after}" (has ${p.has}s)`;
      report += `\n  Regenerate those lines with a pause (OpenMontage script delivery_cues.pause_after_seconds), or redesign the shot for its real length.`;
    }
    if (flat.length && matched / flat.length < 0.7) report += "\n▲ under 70% of words matched: make each shot's `script` the exact narration text.";
  }

  // Layers & sfx: cue_word sync, proportional rescale, kinetic word_times.
  let cues = 0;
  shots.forEach((s, i) => {
    const d = s.end - s.start;
    const ratio = oldDur[i] > 0 ? d / oldDur[i] : 1;
    const toks = tokens(s.script);
    const findWord = (w) => {
      const target = tokens(w);
      if (!target.length) return undefined;
      for (let k = 0; k <= toks.length - target.length; k++) {
        if (target.every((t, q) => toks[k + q] === t) && wordTimes[i][k] !== undefined) return wordTimes[i][k] - s.start;
      }
      return undefined;
    };
    for (const l of s.layers ?? []) {
      const len = l.start !== undefined && l.end !== undefined ? l.end - l.start : undefined;
      if (l.cue_word) {
        const at = findWord(l.cue_word);
        if (at !== undefined) {
          l.start = +Math.max(0, at).toFixed(3);
          if (len !== undefined) l.end = +Math.min(d, l.start + len * ratio).toFixed(3);
          cues++;
        } else console.log(`▲ ${s.id}: cue_word "${l.cue_word}" not found in the shot's script`);
      } else if (ratio !== 1) {
        if (l.start !== undefined) l.start = +(l.start * ratio).toFixed(3);
        if (l.end !== undefined) l.end = +(l.end * ratio).toFixed(3);
      }
      if (l.type === "text" && l.style === "kinetic") {
        const lw = words(l.text);
        const times = [];
        let from = 0;
        for (const w of lw) {
          const nw = norm(w);
          let k = toks.indexOf(nw, from);
          if (k >= 0 && wordTimes[i][k] !== undefined) {
            times.push(+(wordTimes[i][k] - s.start - (l.start ?? 0)).toFixed(3));
            from = k + 1;
          } else times.push(undefined);
        }
        if (times.some((x) => x !== undefined)) {
          for (let k = 0; k < times.length; k++) {
            if (times[k] === undefined) times[k] = k > 0 ? times[k - 1] + 0.2 : 0;
          }
          l.word_times = times.map((x) => Math.max(0, x));
        }
      }
    }
    for (const fx of s.sfx ?? []) {
      if (fx.cue_word) {
        const at = findWord(fx.cue_word);
        if (at !== undefined) {
          fx.at = +at.toFixed(3);
          cues++;
        }
      } else if (ratio !== 1 && fx.at !== undefined && fx.at > 0) fx.at = +(fx.at * ratio).toFixed(3);
    }
  });

  fs.copyFileSync(project.planPath, `${project.planPath}.bak`);
  writeJson(project.planPath, plan);
  console.log(`✓ ${report}`);
  if (cues) console.log(`✓ synced ${cues} cue_word element(s)`);
  console.log(`✓ ${shots.length} shots, ${fmt(shots[shots.length - 1].end)} total (backup: ${path.basename(project.planPath)}.bak)`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
