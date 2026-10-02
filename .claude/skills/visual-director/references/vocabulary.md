# Vocabulary: everything the engine can render

This is the complete list. If a technique isn't here, the engine can't do it
yet; build it with the `director-engine` skill before planning around it.
Field-level truth lives in `schema/visual-plan.schema.json`.

**Units.** Shot `start`/`end` are absolute seconds. Layer `start`/`end`, sfx
`at` and post `start`/`end` are seconds **relative to the shot start**.
`x/y/w/h` are percent of the frame. Sizes (`size`) are percent of frame height.
Colors accept hex or palette tokens: `bg`, `fg`, `accent`, `accent2`, `muted`.

## Anatomy of a shot

```json
{
  "id": "s07", "section": "build", "start": 16.4, "end": 20.3,
  "script": "A port placed exactly where the world's shipping lanes already run.",
  "hold": 0,
  "beat": { "role": "explanation", "emotion": "clarity", "energy": 3, "info_type": "process", "key_terms": ["shipping lanes"] },
  "intent": "What the viewer understands + feels, and why this image does it.",
  "strategy": "abstract",
  "hero": false,
  "camera": { "move": "push_in", "intensity": 0.4, "target": { "x": 60, "y": 45 } },
  "grade": "cold",
  "layers": [ "...bottom to top..." ],
  "post": [ { "effect": "chromatic", "intensity": 0.3, "start": 0, "end": 0.4 } ],
  "transition_in": { "type": "crossfade", "duration": 0.6 },
  "sfx": [ { "cue": "whoosh", "at": -0.15 } ],
  "texture": "inherit",
  "notes": "why a lint warning is intentionally ignored, etc."
}
```

### Layer common fields (every layer)

| Field | Meaning |
|---|---|
| `start`, `end` | Shot-relative seconds. Omit to span the whole shot (including transition overlap). |
| `cue_word` | Snap `start` to the moment this word is spoken (resolved by `retime`). |
| `lock` | `world` = moves with the shot camera; `screen` = fixed (HUD). Defaults: `world` for video, image, card and annotation; `screen` for everything else. |
| `enter`, `exit` | Generic animation: `fade, pop, slide_up, slide_down, slide_left, slide_right, scale_up, scale_down, blur, wipe_right, wipe_up` (+ `duration`). Text styles already animate themselves; add these only for extra effect. |
| `opacity`, `blend` | `blend`: normal, screen, multiply, overlay, soft-light, lighten, darken, color-dodge, difference. |
| `box` | `{x,y,w,h}` placement for positioned layers (video/image as picture-in-picture, text, card, bars, timeline, annotation boxes). |

**World vs screen lock is a cinematic tool.** Put the footage on `world` and the
title on `screen`: the camera drifts through the image while the title stays
put, which reads as depth. Put an annotation on `world` and it sticks to the
detail as the camera pushes in.

---

## Base layers (what the frame is made of)

### `video`: footage
```json
{ "type": "video", "src": "footage/s03.mp4", "trim": 2.5, "speed": 0.7, "freeze_at": 1.8,
  "fit": "cover", "focus": { "x": 60, "y": 40 }, "grade": "cold", "darken": 0.3, "blur": 0,
  "camera": { "move": "push_in", "intensity": 0.2 },
  "asset": { "kind": "stock_video", "description": "...", "query": "...", "alternates": ["..."], "min_duration": 4 } }
```
- `trim` = start N seconds into the clip. `speed` < 1 = slow motion (0.5–0.8 adds weight).
- `freeze_at` = freeze-frame at that layer-relative second (pair with flash + shutter + annotation).
- Clips that run out freeze on their last frame automatically, but give `min_duration` so the scout gets long-enough clips.
- `fit: "blur_fill"` = contained clip over a blurred copy of itself (vertical/phone footage, low-res archive).
- `darken` (0–1) pushes the image back so text reads. `blur` for background plates.
- Muted by default (`volume` to keep source sound).

### `image`: photo, archive scan, AI image
Same fields as video minus trim/speed/freeze. **A still must move**: give the
shot a camera, the layer a `camera`, or put it in a parallax/card.

### `parallax`: 2.5D from stills (the cheapest way to look expensive)
```json
{ "type": "parallax", "planes": [
  { "depth": 0,    "src": "ai/port-bg.png" },
  { "depth": 0.45, "text": "TANGER MED", "color": "accent", "size": 24 },
  { "depth": 1,    "src": "cutouts/crane.png", "fit": "contain", "box": { "x": 55, "y": 10, "w": 40, "h": 90 } }
] }
```
- Planes far→near; each follows the **shot camera** scaled by depth (or the layer's own `camera`).
- A text plane between background and a cut-out subject = **text behind the subject**.
- Foregrounds come from `asset.needs_cutout: true` (OpenMontage `bg_remove`).
- Best camera moves: `push_in`, `pan_left/right`, `drift`, and `dolly_zoom` (vertigo; hero only).

### `background`: generated backdrops
`style`: `solid` · `linear` · `radial` · `mesh` (slow colour blobs) · `grid` (scrolling chart grid) · `dots` · `paper` (textured paper for evidence boards) · `noise`.
`colors` (1–4, tokens ok), `angle`, `animated` (default true).

### `split`: comparisons and multiplicity
```json
{ "type": "split", "layout": "two_vertical", "gap": 0.6, "gap_color": "bg", "stagger": 0.25,
  "panels": [ { "src": "footage/a.mp4", "label": "1990", "camera": { "move": "push_in" } },
              { "src": "footage/b.mp4", "label": "TODAY" } ] }
```
Layouts: `two_vertical`, `two_horizontal`, `three_vertical`, `grid_4`, `pip` (big + inset). Panels wipe in with a stagger. Panel `label` = chip bottom-left.

### `card`: media as an object in the world
```json
{ "type": "card", "frame": "polaroid", "src": "images/doc.jpg", "box": { "x": 24, "y": 12, "w": 46, "h": 68 },
  "rotate": -4, "tilt": 12, "caption": "Gibraltar, c. 1750", "grade": "vintage" }
```
Frames: `polaroid` (caption handwritten), `paper`, `torn`, `phone`, `browser` (caption = URL), `tv` (scanlines), `rounded`, `plain`.
Pops in, settles its rotation, floats slightly. Several cards on a `paper` background = an evidence board. Phone/browser = proof (a tweet, a headline, a website).

---

## Graphic layers (storytelling on top)

### `text`: twelve styles
| `style` | Looks like | Use for |
|---|---|---|
| `slam` | huge word punches in with overshoot + shake | 1–4 words. Shock numbers, verdicts, single key words. |
| `title` | letter-spaced blur-in, optional `subtitle` | Video/section titles, names of things. |
| `chapter` | kicker (`subtitle`) + line + big title | Section cards in videos > 3 min. |
| `kinetic` | words pop in one by one (`word_times` from retime) | Thesis lines, quotes, the sentence that matters. |
| `reveal` | lines rise from masks (`\n` separates lines) | Editorial statements, calm reveals. |
| `typewriter` | mono characters + cursor | Documents, code, transcripts, dates, "classified" feel. |
| `quote` | big quote mark + italic words + `— subtitle` | Real quotes with attribution. |
| `lower_third` | accent bar + name + subtitle | Introducing a person, place or source. |
| `label` | small mono chip with accent edge | Place/date/source tags: "PARIS, 1889", "SOURCE: IMF". |
| `stamp` | rotated bordered stamp | Verdicts: "FAILED", "Nº1", "CLASSIFIED", "STOP". |
| `marker` | handwritten accent font, written on | Navigator/teacher notes, asides, arrows "→". |
| `outline` | giant stroked text drifting | Background typography, texture, section mood. |

Fields: `text`, `subtitle`, `position` (center, top, bottom, left, right, top_left, top_right, bottom_left, bottom_right, lower_third) or `box`, `size`, `font` (display/body/accent/mono), `color`, `highlight` (words in accent), `highlight_color`, `align`, `uppercase`, `backdrop` (shadow default, box, blur, none), `rotate`.
Over busy footage add `darken` on the footage or an `fx: scrim`.

### `counter`: numbers that count
`{ "type": "counter", "from": 0, "to": 8000000, "prefix": "$", "suffix": "+", "decimals": 0, "label": "containers a year", "count_duration": 1.5, "cue_word": "eight" }`
Counts with an exponential ease and pops when it lands. Use `cue_word` so it lands on the spoken number.

### `annotation`: the director's pen
| `shape` | Fields | Use |
|---|---|---|
| `circle` | `at`, `radius`, `label` | Circle the detail that matters (hand-drawn ellipse). |
| `box` | `box` or 2 `points`, `label` | Frame a region, a face, a line of a document. |
| `underline` | 2 `points`, `label` | Underline a word on a document; also a measurement line. |
| `arrow` | `points` [from, to], `label` at the tail | Point at something. |
| `cross` | `box` or `at`+`radius` | Strike out: wrong, failed, cancelled. |
| `pin` | `at`, `label` | Map pin drop with pulse + label chip. |
| `route` | `points` (≥2), `dashed`, `label` | Journey on a map image or any path; drawn progressively with a moving head. |
| `bracket` | `box` | Group items in a list. |
| `spotlight` | `at`, `radius` | Darken everything except one area. |
| `highlight` | `box` | Highlighter pen over text in a document. |
`draw_duration` (default 0.6 s), `stroke`, `color` (default accent), `hand_drawn` (default true). Annotations are `world`-locked by default so they stick to the image under camera moves; set `lock: "screen"` on maps whose camera is internal.

### `bars`: quick comparisons
`{ "type": "bars", "title": "Revenue by year", "unit": "B", "orientation": "vertical", "highlight": 2, "data": [ { "label": "2022", "value": 1.2 }, { "label": "2023", "value": 1.9 }, { "label": "2024", "value": 4.1 } ] }` (max 8 bars).

### `timeline`: when things happened
`{ "type": "timeline", "highlight": 2, "items": [ { "date": "1869", "label": "Suez opens" }, { "date": "2007", "label": "Tanger Med opens" } ] }` (2–8 items, drawn left to right).

### `custom`: bespoke animations (no assets needed)
| `component` | Props | Use |
|---|---|---|
| `WorldMap` | `style` (dark, paper, blueprint, light), `from`/`to` `{lon, lat, zoom}` (zoom 1 = world), `highlight`/`highlight2` (Natural Earth country names: "Morocco", "United States of America", "Dem. Rep. Congo"...), `markers` `[{lon, lat, label, at}]`, `routes` `[{from, to, at}]`, `labels` `[{lon, lat, text}]` | Any place, border, trade route, journey, invasion, spread. The camera move is inside the map, so leave shot camera `static`. |
| `DotGlobe` | `from`/`to` `{lon, lat}`, `spin`, `size`, `x`, `y`, `markers`, `arcs` `[{from, to, at}]`, `dot_color` | Global scale, connections between continents, "the whole world". |
| `NetworkGraph` | `nodes`, `seed`, `hub_label`, `spread` (0–1), `color` | Spread, virality, contagion, supply chains, "everything is connected". |
New ones: `/new-effect`. Unregistered names render as a placeholder and fail validation.

---

## Effects

### `fx` layers (drawn on top)
| `effect` | Notes |
|---|---|
| `grain` | Animated film grain. Usually via treatment `texture`, not per shot. |
| `vignette` | Darkened edges. |
| `light_leak` | Warm drifting film leaks (screen blend). Nostalgia, warmth, endings. |
| `letterbox` | 2.39:1 bars slide in. "This is the cinematic moment." |
| `flash` | White (or `color`) flash decaying from the layer start. Pair with freezes, impacts. |
| `scanlines`, `vhs` | CRT/VHS. Archive TV, retro, "found footage". |
| `dust` | Film specks and scratches. Archival. |
| `film_burn` | Warm burn blooming across the layer duration. |
| `particles` | `kind`: `bokeh` (dreamy), `embers` (fire, war, energy), `dust` (motes in light), `snow`. |
| `tint` | Colour wash (`color`, `blend`, `intensity`). |
| `viewfinder`, `rec` | Camera HUD / REC + timecode. Surveillance, POV, "caught on camera". |
| `scrim` | Darkening gradient for text legibility; `side`: bottom, top, left, right, full, center. |
`intensity` 0–1 (default 0.5).

### `post` (filters on the whole shot, time-ranged)
`chromatic` (RGB split), `glitch` (displacement bursts), `blur`, `bloom` (glow), `desaturate`, `pulse` (zoom punch at `times` [..]: put pulses on music hits or impacts).

### Grades (`treatment.grade`, `shot.grade`, or per media layer)
`natural`, `cinematic` (teal shadows / warm highlights), `teal_orange`, `noir`, `warm_film`, `cold`, `bleach`, `vintage`, `vivid`, `muted`, `night`, `sepia`, `matrix`, `duotone` (accent→accent2), `none`.
One default grade for the film, and break it on purpose (the warm last shot in a cold film; a noir flashback).

---

## Camera (`shot.camera` or a media layer's `camera`)

| `move` | Feels like | Use |
|---|---|---|
| `static` | authority, stillness | Typography, data, maps (they move inside), punchlines. |
| `push_in` | importance, tension, leaning in | Building to a point. Use `target` to push toward the detail. |
| `pull_out` | reveal, context, isolation | Showing scale, endings, "and that was just one of them". |
| `pan_left` / `pan_right` | travel, scanning, progression | Reading across a scene, following a direction. (Camera direction: `pan_right` slides content left.) |
| `tilt_up` / `tilt_down` | awe / descent | Monuments, towers, falling, revealing the ground. |
| `drift` | contemplation, keeps stills alive | Default for calm stills; nearly invisible. |
| `handheld` | urgency, realism, POV | Breaking news, chaos, found footage. |
| `crash_zoom` | shock, comedy, punctuation | ≤ 1 per minute or it stops working. |
| `rotate_cw` / `rotate_ccw` | unease, dream, disorientation | Mental states, confusion, things going wrong. |
| `dolly_zoom` | vertigo, realization | Hero moments on parallax only. |
| `custom` | exact move | `from`/`to` `{x, y, scale, rotate}`. |
`intensity` 0–1 (0.2 subtle, 0.5 default, 0.8 strong), `ease` (linear, in, out, in_out, snap, smooth), `shake` 0–1 (adds handheld jitter to any move).

## Transitions (`shot.transition_in`)

| `type` | Means | Use |
|---|---|---|
| `cut` | continuity, energy | **Default. 70–90% of all cuts.** |
| `crossfade` | time passing, mood continuity | Slow sections, endings, montage of memories. |
| `dip_black` | ending, time jump, gravity | Section changes, before a serious line. |
| `dip_white`, `flash` | revelation, memory, energy jump | "Then everything changed", flashbacks, camera-flash moments. |
| `whip_left/right/up/down` | fast link between related things | Lists, "meanwhile", A→B with energy. |
| `slide_left/right/up` | sequence, next item | Steps, lists, UI-like progressions. |
| `zoom_through` | going deeper | Diving into a map, a detail, a screen, a concept. |
| `zoom_out` | stepping back | Conclusions, zooming out to the big picture. |
| `wipe_left/right` | before/after, comparison | Then vs now. |
| `iris` | focus, retro | Spotlighting one thing, vintage style. |
| `glitch` | error, tech, wrongness | Hacks, failures, "something is off". |
| `blur` | dream, state change | Memories, waking up, intoxication. |
| `film_burn` | archival change | Moving between eras. |
`duration` defaults to a sensible value per type. The transition is centred on the cut, so neither shot loses its words.

## Sound (`shot.sfx`)
Built-in cues (synthesized, royalty-free): `whoosh`, `whoosh_long`, `swish`, `impact`, `boom`, `riser`, `click`, `pop`, `glitch`, `ding`, `typing`, `shutter`, `tick`, `heartbeat`, `drone`.
`at` is shot-relative (negative = before the cut, e.g. a whoosh at −0.15 into a whip; a riser at −1.8 into a hero). `cue_word` syncs to speech. `volume` default 0.6. Or `src` for your own file.

## Captions, music, voiceover (plan level)
- `captions`: `{ "enabled": true, "style": "pop" | "karaoke" | "minimal", "position": "bottom", "max_words": 3, "hide_during": ["s06"] }`, using words from `transcript.json`. Hide them on full-screen typography shots.
- `audio.voiceover`: `{ "src": "audio/voiceover.mp3" }`.
- `audio.music`: list of tracks `{ src, start, end, offset, volume (0.25), fade_in, fade_out, duck (0.45 under speech) }`. Change track or drop music at section turns; silence is a tool.

## Global layers
`global_layers` render over the whole video (absolute times): a channel bug (`text/label` top_right), a persistent `fx: grain`, a chapter progress `timeline`. Keep them minimal.
