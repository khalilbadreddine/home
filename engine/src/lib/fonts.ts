import { useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";
import type { Treatment, VisualPlan } from "../types";

/** Block rendering until every font the treatment uses is decoded. */
export function useFontsReady(t: Treatment, plan?: VisualPlan) {
  const [handle] = useState(() => delayRender("Loading fonts"));
  useEffect(() => {
    const families = new Set<string>([t.fonts.display, t.fonts.body, t.fonts.accent ?? "Permanent Marker", t.fonts.mono ?? "JetBrains Mono", "Caveat"]);
    const loads: Promise<unknown>[] = [];
    families.forEach((f) => {
      for (const spec of ["400", "700", "800", "italic 400"]) {
        loads.push(document.fonts.load(`${spec} 64px "${f}"`).catch(() => undefined));
      }
    });
    // CJK glyphs live in unicode-range subsets that load lazily; request exactly the ones this plan uses.
    const cjk = Array.from(new Set((JSON.stringify(plan ?? {}).match(/[\u3000-\u30ff\u3400-\u9fff\uf900-\ufaff\uff00-\uffef]/g) ?? []))).join("");
    if (cjk) loads.push(document.fonts.load(`700 64px "Noto Serif JP"`, cjk).catch(() => undefined));
    Promise.all(loads)
      .then(() => document.fonts.ready)
      .finally(() => continueRender(handle));
  }, [handle, t.fonts.display, t.fonts.body, t.fonts.accent, t.fonts.mono]);
}
