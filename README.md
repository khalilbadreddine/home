# Visual Director Studio

Turns Claude Code into the **visual director** of a narrated YouTube video.
OpenMontage writes the script and the voiceover; this studio decides what the
viewer sees, moment by moment, and renders it as layered video.

```
script.md ─► beats ─► treatment ─► visual_plan.json ─► validate ─► storyboard ─► critic ─► assets ─► animatic ─► final
```

## Why

OpenMontage's stock renderer shows one image per scene with a slow zoom, so
videos feel like slideshows. Here every shot is a **stack of layers** under a
virtual camera: footage / photo / AI image / parallax / map / globe at the
bottom; text, counters, annotations, framed cards, effects on top; plus
transitions, captions, music ducking and sound effects. Claude plans it all in
one file (`visual_plan.json`) using a documented visual vocabulary.

## Setup

```bash
npm run setup                      # installs the Remotion engine + builds the SFX library (needs ffmpeg)
export OPENMONTAGE_DIR=/path/to/OpenMontage   # for asset search / generation
```

## Use (in Claude Code, from this folder)

```bash
npm run new -- my-video --from-om=$OPENMONTAGE_DIR/projects/<name>   # or --script=script.md
```
then `/direct projects/my-video` → review the storyboard → `/assets` → `/animatic` → `/render`.

| Piece | Where |
|---|---|
| Director method + vocabulary + recipes | `.claude/skills/visual-director/` |
| Extending the renderer | `.claude/skills/director-engine/` |
| Agents (script analyst, visual critic, asset scout) | `.claude/agents/` |
| Commands (`/direct`, `/critique`, `/assets`, `/animatic`, `/render`, `/new-effect`) | `.claude/commands/` |
| Plan contract | `schema/visual-plan.schema.json` |
| Renderer + scripts | `engine/` |
| Example project (38 s, real TTS + transcript, mostly placeholders) | `projects/demo/` |

## Scripts

`npm run validate | retime | assets | storyboard | animatic | render | export:om -- projects/<slug>`
— see `CLAUDE.md` for details. Demo stand-in media: `node engine/scripts/make-demo-assets.mjs`
(the demo voiceover is not committed; generate one with any TTS and re-run `npm run retime`).
