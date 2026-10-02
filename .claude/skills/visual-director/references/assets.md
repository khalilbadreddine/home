# Assets: free first, generated where it counts

## Choosing the source for a media slot

| Need | Use | `asset.kind` |
|---|---|---|
| Real place, real activity, nature, cities, machines | Stock video (Pexels, Pixabay, Coverr, Mixkit, Videvo) | `stock_video` |
| Historical events, old photos, documents | Archive (Wikimedia, Archive.org, Library of Congress, NARA, NASA, ESA, NOAA) | `archive_video`, `archive_image` |
| A specific moment nobody filmed, a metaphor, a stylised hero image | AI image (then parallax / camera) | `ai_image` |
| A moving shot that doesn't exist and matters | AI video (expensive; heroes only, with the user's OK) | `ai_video` |
| A web page, a post, an app | Screenshot | `screenshot` |
| Foreground for parallax / text-behind-subject | Any image + background removal | `cutout` or `needs_cutout: true` |
| Maps, globes, networks, numbers, timelines | **Don't fetch anything**: use `WorldMap`, `DotGlobe`, `NetworkGraph`, counter, bars, timeline | — |

**Budget rule:** free sources and engine graphics for ~85–100% of shots.
Default AI image budget ≈ 1 per 30–45 s of video, spent on heroes and
impossible-to-find moments, unless `brief.md` says otherwise. Always tell the
user the count and estimated cost before generating.

## Plates: one drawing, many shots

For illustrated videos, plan AI images as **plates** with a fixed path and reuse
them: wide on first appearance, then details via camera `target`/`custom` moves,
as polaroid `card`s, in `split`s, and as callbacks later in the film.
- Give the layer a planned `src` (e.g. `plates/himiko.png`) and put the `prompt`
  on its first use; later uses only need the same `src` (+ a short description).
- `npm run assets -- <project> list` and `brief` merge slots that share a `src`, so
  each plate is generated once. Creating the file at the planned path is enough;
  no `set` needed.
- Ask for plates at the highest resolution the provider offers: detail shots
  zoom to 1.5–2×.

## Writing stock queries

- 2–4 keywords, **subject first**, plus a **POV word**: drone/aerial, close-up/macro,
  top-down, handheld, timelapse, slow motion, over-the-shoulder, locked-off.
  "container ship aerial", "hands typing close-up", "tokyo crossing timelapse".
- Give 2–3 `alternates` with synonyms and a different POV.
- Set `min_duration` ≥ shot length + 1 s; `orientation: "landscape"` for 16:9.
- `description` says what the frame must show **and why** (the scout judges by it).
- Archive queries name the era and medium: "1920s bank run photograph", "apollo 11 launch footage".

## Writing AI image prompts

Formula: **subject + action → setting → composition/lens → light → mood**. The
scout appends the treatment's `ai_image_style`.
- "a woman in a 1923 Berlin apartment wallpapering a wall with stacks of banknotes, medium-wide shot, 35mm, soft window light from the left, quiet resignation"
- Ask for the composition you need: "subject on the right third, empty sky on the left for text".
- For parallax: generate the **background plate without the subject** and the
  **subject isolated** ("on a plain light grey background") as two images; mark the subject `needs_cutout`.
- No text in images (models garble it); put text in text layers.
- Keep people consistent by reusing a precise description across prompts.

## OpenMontage tools (run from the OpenMontage checkout)

The asset-scout runs these with `OPENMONTAGE_DIR` set. Always write into this
project's `assets/` folder (absolute paths).

```bash
cd "$OPENMONTAGE_DIR" && python - <<'PY'
from tools.tool_registry import registry
registry.discover()
r = registry.get("direct_clip_search").execute({
    "output_dir": "/abs/path/projects/<slug>/assets/_candidates/s03.L0",
    "queries": [{"query": "container ship aerial", "slot_id": "s03.L0", "kind": "video"},
                {"query": "cargo ship sea drone", "slot_id": "s03.L0", "kind": "video"}],
    "clips_per_query": 3,
    "filters": {"min_duration": 5, "orientation": "landscape"},
})
print(r.success, r.error)
for c in r.data.get("clips", []):
    print(c["path"], c["thumbnail"], c["duration"], c["source"], c["creator"], c["license"], c["source_url"])
PY
```

- **Look at the thumbnails** (Read the JPGs) and pick by the slot's `description` and shot `intent`, not by filename.
- Images: same tool with `"kind": "image"`, or `pexels_image` / `pixabay_image` (`query`, `orientation`, `output_path`).
- AI images: `image_selector` (auto-picks an available provider) or `flux_image` / `openai_image` with `prompt`, `width: 1920`, `height: 1080`, `output_path`.
- Cut-outs: `bg_remove` with `input_path`, `output_path` (PNG with alpha).
- Music: `music_library` / `pixabay_music` / `freesound_music`; SFX beyond the built-ins: the OpenMontage `sound-effects` skill.

Then register the file: `npm run assets -- projects/<slug> set s03.L0 footage/s03.L0.mp4 --credit="Name (Pexels)" --source_url=... --trim=2.5`.
`trim` = where the good part of the clip starts.

## Quality bar for a found asset

Score 1–5 against the description; use 4–5, accept 3 only with a fix (crop via
`focus`, grade, darken, blur_fill). Reject: watermarks, wrong POV, wrong era,
visible brand logos, faces of private people in sensitive contexts, < 1080p for
full-frame footage (OK inside cards/splits), clips shorter than the shot.
