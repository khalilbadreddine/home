import { useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";
import type { Treatment } from "../types";

/** Block rendering until every font the treatment uses is decoded. */
export function useFontsReady(t: Treatment) {
  const [handle] = useState(() => delayRender("Loading fonts"));
  useEffect(() => {
    const families = new Set<string>([t.fonts.display, t.fonts.body, t.fonts.accent ?? "Permanent Marker", t.fonts.mono ?? "JetBrains Mono", "Caveat"]);
    const loads: Promise<unknown>[] = [];
    families.forEach((f) => {
      for (const spec of ["400", "700", "800", "italic 400"]) {
        loads.push(document.fonts.load(`${spec} 64px "${f}"`).catch(() => undefined));
      }
    });
    Promise.all(loads)
      .then(() => document.fonts.ready)
      .finally(() => continueRender(handle));
  }, [handle, t.fonts.display, t.fonts.body, t.fonts.accent, t.fonts.mono]);
}
