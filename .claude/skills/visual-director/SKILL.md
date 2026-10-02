---
name: visual-director
description: The method for turning a narration script into a directed, layered, shot-by-shot visual plan (visual_plan.json) for the DirectorCut engine. Load before analysing a script, writing a treatment, designing or revising shots, or critiquing visuals.
---

# Visual Director

You think like a documentary director and an editor at the same time: every
second of narration gets a deliberate image, built from layers, moving with
intent, cut on rhythm. This file is the method. The references hold the craft:

| Reference | Read when |
|---|---|
| `references/vocabulary.md` | Always, before writing shots. Everything the engine can render, with JSON. |
| `references/visual-thinking.md` | Designing a shot: turning words into images (the question ladder, 14 strategies, clichés to avoid). |
| `references/recipes.md` | You want a proven layer stack (Number Slam, Map Dive, Freeze & Circle...). |
| `references/rhythm.md` | Timing, energy, hooks, pattern interrupts, sound. |
| `references/treatments.md` | Choosing the film's look: concept, palette, fonts, grade, motifs. |
| `references/assets.md` | Writing stock queries and AI prompts, choosing free vs paid. |

## Pass 0: Intake (don't skip)

Read `script.md` end to end **twice**, plus `brief.md` and any notes. Then write
down, in `projects/<slug>/director_notes.md`:

- **Thesis**: the one sentence the video argues.
- **Promise**: what the viewer clicked for (the title's question). The hook must show it.
- **Arc**: how the emotion moves (curiosity → shock → understanding → resolve...).
- **World**: the physical world of the subject (ports, labs, courtrooms, markets,
  servers...). That's where your images and motifs come from.
- **Central metaphor**: the script usually has one (a door, a race, a machine, a
  virus). If it doesn't, find one. It becomes the visual throughline.
- **Concrete nouns & numbers**: every name, place, date, number. These are your
  data, map and evidence shots.

Check for `transcript.json` (word timestamps). If it exists, timing is real.

## Pass 1: Beat map

Split the narration into **beats**: one idea per beat, usually 1.5–6 s. Cut at
idea changes, not at sentence ends: before a "but/then/so", on a number, on a
name, on a reveal. Long sentences become 2–3 beats; a punchy line can be its own beat.

For long scripts, spawn the `script-analyst` agent to produce
`projects/<slug>/beats.json`. Each beat gets: `script` (exact words), `role`,
`emotion`, `energy` 1–5, `info_type`, `key_terms`, and **visual hooks**: the
concrete things in it that could be shown.

## Pass 2: Treatment (the big idea)

Draft **three genuinely different** visual concepts (see `treatments.md`). A
concept is not a colour scheme; it's a way of seeing the story ("the strait as a
doorway, drawn on a navigator's chart", "a case file assembled on a desk", "a
museum of failed products"). Each concept defines:

concept · why it fits · palette (5 tokens) · fonts (display/body/accent/mono) ·
default grade · texture · 2–3 motifs with meaning · house rules · AI image style suffix.

If the user is available, show the three in 3–4 lines each and let them pick
(AskUserQuestion). Otherwise choose and record the others in
`alternatives_considered`. Write the chosen one into `visual_plan.json → treatment`.

## Pass 3: Hero moments first

Before designing ordinary shots, choose the **hero beats**: roughly one per
30–45 s and one per section. Typical heroes: the hook image, the thesis reveal,
the biggest number, the emotional turn, the last line. Decide what each hero gets
(parallax AI image, custom animation, map dive, full-screen typography, freeze &
circle). Heroes get the budget; everything else is built from free media + layers.

## Pass 4: Design every shot

For each beat, walk the **question ladder** (`visual-thinking.md`):

1. What must the viewer **understand** here?
2. What must they **feel**?
3. What is the **literal** image? (Name it, then usually reject it as the only layer.)
4. Pick a **strategy**: specific_detail, metaphor, data, evidence, map, contrast,
   process, typography, reenactment, montage, abstract, character, callback, literal.
5. Choose the **base layer** (footage, photo, archive, AI image, parallax, map,
   globe, background).
6. Add **at most one or two storytelling layers** that add information the
   narration doesn't (a number, a name, a date, a circle on the detail, a route).
7. Choose the **camera** by emotion (`vocabulary.md → Camera`).
8. Choose the **transition in** by the relationship to the previous shot (cut is
   the default; effects mark meaning).
9. Add **sound**: a whoosh on a whip, an impact on a slam, a shutter on a freeze.
10. Write the `intent` sentence. If it sounds generic, the shot is generic.

Then write the shot into `visual_plan.json`. Rules of thumb:

- For illustrated videos, plan **plates** (see `assets.md`): one AI drawing serves a wide shot, a detail, a card and a callback.
- Make stock footage **specific**: grade it into the treatment, crop with `focus`,
  label it (place/date), annotate the detail, freeze it, slow it, frame it in a card.
- **Vary scale and technique** across neighbours: wide → detail → graphic → face → map.
  Never three shots with the same base + camera + overlay pattern.
- **Text is for what the ear can't hold**: numbers, names, dates, key terms, the
  thesis. Never subtitle the narration with titles (captions do that).
- Use `cue_word` to land graphics, slams and impacts **on the spoken word**.
- Let some shots breathe: no overlays, slower camera, longer hold after a big moment.
- Close with a **callback**: the opening motif returns, transformed.

## Pass 5: Time it

- Real voiceover + `transcript.json`: `npm run retime -- projects/<slug>`
- No voiceover yet: `npm run retime -- projects/<slug> --estimate` (add `hold`
  seconds to reveals that need a beat of silence, and ask for that pause in the TTS direction).

## Pass 6: Lint, then look

```bash
npm run validate -- projects/<slug>
npm run storyboard -- projects/<slug>
```

Fix **every error**. Treat every warning as a note from an editor: fix it, or
write in `shot.notes` why the rule is wrong here. Then **Read the contact sheet
JPGs** (`projects/<slug>/storyboard/contact-sheet-*.jpg`) and judge them as a viewer:

- Would I know what this video is about with the sound off?
- Does each frame have one clear focal point? Is text readable at phone size?
- Do neighbouring frames look different enough? Does the palette hold?
- Where would I get bored? Where is the eye lost?

## Pass 7: Fresh eyes

Spawn the `visual-critic` agent on the project. It has none of your context, so
it sees what a viewer sees. Apply its fixes that you agree with, re-validate,
re-storyboard the changed shots (`--shots=s04,s09`).

## Pass 8: Hand-off

Summarise for the user: the concept (2 lines), the hero moments, the shot count
and pacing, asset needs (free vs paid, estimated cost), and the storyboard path.
**Wait for approval before acquiring paid assets.** Then `/assets`, `/animatic`, `/render`.

## Revising

When the user gives feedback ("shot 12 is boring", "more energy in the middle"),
change the plan, not just the words: different strategy, different base, a new
layer, a camera change. Re-run validate + storyboard for the touched shots and
show the before/after stills.

## Failure modes this method exists to prevent

- **Literal noun matching**: "economy" → stock chart; "hacker" → hoodie in the dark.
- **Slideshow**: one still + slow zoom, every shot, same length.
- **Wallpaper b-roll**: pretty footage that says nothing; no graphic storytelling at all.
- **Text soup**: titles repeating the narration; more than ~12 words on screen.
- **Effect salad**: random transitions, glitch on a cooking video, grain at 0.9.
- **No throughline**: every shot from a different film; no motif, palette or rules.
- **Monotone energy**: the hook cut like the middle; no peaks, no breaths.
- **Silence**: no SFX; transitions and slams feel weightless.
