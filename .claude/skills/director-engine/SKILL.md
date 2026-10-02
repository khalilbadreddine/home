---
name: director-engine
description: How the DirectorCut Remotion engine is built and how to extend it - new custom animations (/new-effect), new layer types, effects, transitions, grades, SFX - while keeping schema, types, lint and docs in sync. Load before editing anything under engine/ or schema/.
---

# DirectorCut engine

`engine/` is a Remotion 4 project that renders a `visual_plan.json` (passed as
input props) into video. Scripts in `engine/scripts/` wrap validation, timing,
asset prep, rendering and storyboards.

## Map

| Path | Role |
|---|---|
| `src/index.ts` | Registers the root, imports bundled fonts (@fontsource). |
| `src/Root.tsx` | `DirectorCut` composition; size/fps/duration from the plan (`calculateMetadata`). |
| `src/DirectorCut.tsx` | Timeline: shots (overlapping by transition windows), transition overlays, global layers, captions, audio. |
| `src/Shot.tsx` | One shot: camera, enter/exit transition styles, post filters, layer stack, treatment texture, animatic badge. |
| `src/layers/index.tsx` | `LayerStack`: one `<Sequence>` per layer (local time, video start), world/screen lock, enter/exit; dispatch by `type`. |
| `src/layers/*.tsx` | Media (video/image, freeze, blur_fill, grade), Text (12 styles), Graphics (counter, bars, timeline), Annotation, Frames (card, split), Scenery (background, parallax), Fx, Placeholder. |
| `src/Effects.tsx` | Post filters (SVG/CSS), shot transitions (enter/exit looks), transition overlays. |
| `src/custom/` | Bespoke animations + registry (`index.ts`). `geo.ts` loads Natural Earth data. |
| `src/lib/` | camera math, easing, deterministic noise, grades, theme tokens/fonts, timeline windows, contexts, hooks. |
| `src/types.ts` | TS mirror of `schema/visual-plan.schema.json`. |
| `scripts/` | validate (schema + lint), retime, prepare, render, storyboard, assets, export-openmontage, make-sfx, new-project, test-recipes. |

### Time model
- Shot window = `[start − lead, end + tail]`, where lead/tail are half of the
  incoming/outgoing transition. Inside a shot, `t` = seconds since `shot.start` (negative during lead).
- Each layer gets its own `Sequence`; `useLayerTime()` returns `t` (since the
  layer's nominal start), `dur`, `shotT`, `seqT`, `seqDur`, `width`, `height`, `frame`.
- Everything must be a **pure function of the frame**: no `Math.random()`, no state
  carried between frames, no timers. Use `lib/noise.ts` (`hash`, `noise1`, `fbm`).

### Units
Frame-relative: percentages for position, `height / 100` ("unit") for sizes.
Never use `vw/vh` (wrong in Remotion Studio's scaled preview).

## Adding a custom component (`/new-effect`)

1. **Design the props** a director would want to write (few, named in plain
   words, with defaults). Think about the moment it serves and how it animates in.
2. Write `engine/src/custom/<Name>.tsx`:
   ```tsx
   import React from "react";
   import { AbsoluteFill, useVideoConfig } from "remotion";
   import type { CustomProps } from "./types";
   import { easeOutCubic, prog } from "../lib/easing";

   export const Name: React.FC<CustomProps> = ({ t, dur, palette, treatment, props }) => {
     const { width: W, height: H } = useVideoConfig();
     const unit = H / 100;
     const p = easeOutCubic(prog(t, 0, Math.min(1.2, dur * 0.5)));
     return <AbsoluteFill>{/* draw with SVG/divs using palette tokens */}</AbsoluteFill>;
   };
   ```
   Use `palette.accent` for what matters, `font(role, treatment)` from `lib/theme` for text,
   `prog`/easings for timing, and SVG for shapes. Keep it legible at phone size.
3. Register it in `engine/src/custom/index.ts` (`CUSTOM_COMPONENTS`).
4. Document it in `.claude/skills/visual-director/references/vocabulary.md` →
   Custom table (props + when to use). Add a recipe if it unlocks a new idea.
5. Test:
   ```bash
   npm run typecheck
   npm run new -- lab-<name>        # scratch project; write a one-shot visual_plan.json using the component
   npm run storyboard -- projects/lab-<name> --frames=3 --final
   ```
   Read the contact sheet. Check the start, middle and end frames: does it
   animate in, read clearly, and sit in the palette? Iterate.
6. Delete the scratch project when done.

## Adding a layer type, text style, fx, post effect, transition, grade, camera move or SFX cue

Every vocabulary change touches the same five places. Do all five:

1. **Schema**: `schema/visual-plan.schema.json` (new enum value or a new layer
   `$defs` entry added to `layer.oneOf`; layers use `unevaluatedProperties: false`).
2. **Types**: `engine/src/types.ts`.
3. **Renderer**: the matching file (`layers/Text.tsx` styles, `layers/Fx.tsx`,
   `Effects.tsx` for post/transitions, `lib/grade.ts`, `lib/camera.ts`,
   `scripts/make-sfx.mjs` for cues; new layer types dispatch in `layers/index.tsx`).
4. **Lint**: update `scripts/validate.mjs` if the new thing has misuse patterns
   (e.g. a style that needs a word limit) and `scripts/lib.mjs → mediaSlots` if it carries media.
5. **Docs**: `vocabulary.md` (+ a recipe if useful). Then run `node engine/scripts/test-recipes.mjs`.

Verify with `npm run typecheck`, `npm run validate -- projects/demo`, and a storyboard of a
shot that uses the new feature.

## Performance notes
- SVG filters (grain, chromatic, glitch, bloom) are the costliest; keep them to where they matter.
- `WorldMap` re-projects 50m country data every frame; fine for a few shots, not for minutes.
- Video layers use `OffthreadVideo`; very long 4K sources slow renders, so pre-trim with ffmpeg if needed.
- Render drafts with `--draft` (half res) and segments with `--from/--to`.

## Rendering environment
Scripts find a headless Chromium via `REMOTION_BROWSER`, Playwright installs, or
let Remotion download its own. Fonts are bundled (no network at render time).
Assets are served from `projects/<slug>/assets/` (Remotion `--public-dir`).
