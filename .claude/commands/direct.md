---
description: Direct a video: script → beats → treatment → shot-by-shot visual plan → lint → storyboard → critique → revise
argument-hint: <projects/slug | path/to/script | OpenMontage project path>
---

Direct the video for: $ARGUMENTS

Load the `visual-director` skill and follow its passes. Concretely:

1. **Project.** If the argument is a slug/folder under `projects/` use it. If it is
   a script file, run `npm run new -- <slug> --script=<file>`. If it is an
   OpenMontage project folder, run `npm run new -- <slug> --from-om=<folder>`.
   Read `script.md`, `brief.md`, and note whether `transcript.json` and
   `assets/audio/voiceover.*` exist.
2. **Intake** → `director_notes.md` (thesis, promise, arc, world, central metaphor, entities).
3. **Beats**: spawn the `script-analyst` agent for scripts over ~150 words; otherwise do it inline.
4. **Treatment**: three different concepts. If the user is present, ask them to
   pick (AskUserQuestion, 3 options with one-line pitches); otherwise choose and
   record alternatives.
5. **Heroes**, then **every shot** with the question ladder. Read
   `references/vocabulary.md` and `references/recipes.md` before writing JSON.
   Write `visual_plan.json` (exact narration in each `shot.script`; `cue_word` for sync;
   `asset` requests with description + query/prompt for every media slot without a file).
   Add voiceover/music/captions config if those files exist.
6. **Time**: `npm run retime -- projects/<slug>` (transcript) or `--estimate`.
7. **Lint**: `npm run validate -- projects/<slug>` until there are no errors; fix or justify warnings.
8. **Look**: `npm run storyboard -- projects/<slug>`, then Read every
   `storyboard/contact-sheet-*.jpg` and fix what you see.
9. **Critique**: spawn `visual-critic` on the project; apply the fixes you agree with;
   re-validate and re-storyboard changed shots (`--shots=...`).
10. **Hand-off**: reply with the concept, hero moments, shot count / average length,
    asset needs (free vs paid with cost estimate), what to fact-check, and the paths to
    `storyboard/index.html` and the contact sheets. Ask for approval before `/assets` spends money.
