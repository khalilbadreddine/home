---
description: Final render of a project
argument-hint: <projects/slug> [--draft] [--from=SEC --to=SEC]
---

1. `npm run validate -- $ARGUMENTS` (no errors allowed) and `npm run assets -- <project> list --todo`.
   If media is still missing, say which shots will show placeholders and ask before rendering a final.
2. Check audio: voiceover present? transcript for captions/ducking? music licensed?
3. `npm run render -- $ARGUMENTS` (use `--draft` for a fast half-res check first on long videos).
4. Verify with `ffprobe` (duration, audio stream) and Read 4–6 extracted frames.
5. Report the output path, duration, and the credits list from the plan's assets (for the video description).
