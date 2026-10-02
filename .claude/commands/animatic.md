---
description: Render a half-resolution review cut with placeholders and shot badges
argument-hint: <projects/slug> [--from=SEC --to=SEC]
---

1. `npm run validate -- $ARGUMENTS` (stop and fix errors).
2. `npm run animatic -- $ARGUMENTS`
3. Extract a few frames around the key transitions and hero shots with ffmpeg
   (`ffmpeg -ss <t> -i renders/<slug>-animatic.mp4 -frames:v 1 -vf scale=640:-1 <out>.jpg`)
   and Read them to check motion, transitions and text timing.
4. Tell the user where the file is, what to watch for, and any issues you saw.
