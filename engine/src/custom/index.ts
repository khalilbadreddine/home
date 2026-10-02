import type React from "react";
import type { CustomProps } from "./types";
import { DotGlobe } from "./DotGlobe";
import { NetworkGraph } from "./NetworkGraph";
import { WorldMap } from "./WorldMap";

/**
 * Registry of bespoke animations a plan can reference with
 * { "type": "custom", "component": "<Name>", "props": {...} }.
 *
 * To add one: write src/custom/<Name>.tsx exporting React.FC<CustomProps>,
 * register it here, and document its props in
 * .claude/skills/visual-director/references/vocabulary.md (Custom section).
 */
export const CUSTOM_COMPONENTS: Record<string, React.FC<CustomProps>> = {
  DotGlobe,
  NetworkGraph,
  WorldMap,
};
