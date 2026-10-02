---
description: Acquire footage, archive, AI images and cut-outs for a plan via OpenMontage tools
argument-hint: <projects/slug> [budget e.g. "4 ai images"]
---

Acquire assets for: $ARGUMENTS

1. `npm run assets -- <project> list --todo` and `npm run assets -- <project> brief`.
2. Count paid slots (ai_image, ai_video, cutouts needing generation). If the user has
   not approved a budget in this conversation, show the count and estimated cost and ask.
3. Find the OpenMontage checkout: `$OPENMONTAGE_DIR`, else `../OpenMontage`, else ask the user.
4. Spawn the `asset-scout` agent with the project path, OPENMONTAGE_DIR and the approved budget.
5. When it returns: `npm run validate -- <project>`, re-run
   `npm run storyboard -- <project> --shots=<changed shots>` and Read the contact sheets.
   Where an asset is weaker than planned, compensate in the plan (grade, darken,
   focus/crop, annotation, card frame, shorter shot) rather than accepting a dull frame.
6. Report acquired/remaining, cost, credits, and suggest `/animatic`.
