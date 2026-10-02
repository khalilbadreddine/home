# Asset brief — The 14 Kilometres That Move the World

Concept: The strait as a doorway. The film borrows the look of a navigator's chart: deep navy, signal-yellow pen lines drawn over the world, cold real footage. Every map is a 'door' seen from above; every number is stamped like a logbook entry.

Save every file under `assets/` at the suggested path, then run `npm run assets -- projects/demo set <ref> <path>`.

## stock_video (3)

### s03.L0 · 0:04.1–0:08.6 (4.48s)
- **Shot intent:** Scale shock. A single ship fills the frame while the count runs up to 100,000: one becomes many.
- **What:** Huge container ship moving through a narrow strait, aerial side view
- **Query:** `container ship aerial` · alternates: `cargo ship sea drone`, `ship strait timelapse`
- **Min clip length:** 4s
- **Save as:** `assets/footage/s03.L0.mp4`

### s10.L0.p0 · 0:30.4–0:34.3 (3.85s)
- **Shot intent:** The scale payoff: machinery on one side, an ocean of containers on the other, the number slamming in between, the gap between panels echoing the strait.
- **What:** Gantry crane lifting a container onto a ship, close
- **Query:** `container crane loading ship` · alternates: `port crane container close up`
- **Min clip length:** 5s
- **Save as:** `assets/footage/s10.L0.p0.mp4`

### s10.L0.p1 · 0:30.4–0:34.3 (3.85s)
- **Shot intent:** The scale payoff: machinery on one side, an ocean of containers on the other, the number slamming in between, the gap between panels echoing the strait.
- **What:** Top-down aerial of endless rows of colourful shipping containers
- **Query:** `shipping containers aerial top-down` · alternates: `container terminal drone`
- **Min clip length:** 5s
- **Save as:** `assets/footage/s10.L0.p1.mp4`

## archive_image (1)

### s04.L1 · 0:08.6–0:13.4 (4.85s)
- **Shot intent:** Drop the energy and step back in time: an old engraving of the strait pinned like a found document, the navigator's hand noting what it used to mean.
- **What:** 18th-century engraving or old map of the Strait of Gibraltar
- **Query:** `strait of gibraltar engraving` · alternates: `gibraltar old map`, `straits of gibraltar 18th century`
- **Save as:** `assets/images/s04.L1.jpg`

## ai_image (1)

### s06.L0.p0 · 0:18.4–0:20.6 (2.2s)
- **Shot intent:** Hero reveal of the name. The title lives inside the port: in front of the sky, behind the crane, while a dolly-zoom stretches the space.
- **What:** Giant container port at blue hour seen from the sea, rows of cranes
- **Prompt:** wide view of a giant container port at blue hour seen from the water, rows of gantry cranes, calm sea in foreground, cinematic documentary photograph, overcast cold light, muted navy and steel tones, subtle 35mm film grain, no text, no logos
- **Save as:** `assets/ai/s06.L0.p0.png`

## cutout (1)

### s06.L0.p2 · 0:18.4–0:20.6 (2.2s)
- **Shot intent:** Hero reveal of the name. The title lives inside the port: in front of the sky, behind the crane, while a dolly-zoom stretches the space.
- **What:** Single gantry crane silhouette, isolated, for the foreground plane
- **Prompt:** single ship-to-shore gantry crane, side view, isolated on plain light background, cinematic documentary photograph, overcast cold light, muted navy and steel tones, subtle 35mm film grain, no text, no logos
- **Cut-out:** run background removal, save PNG with alpha
- **Save as:** `assets/cutouts/s06.L0.p2.png`
