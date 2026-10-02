# Treatments: the film's look and big idea

A treatment answers "what film is this?" before any shot is designed. Without
one, every shot is chosen in isolation and the video looks like a stock
compilation. With one, a viewer could recognise your channel from a single frame.

## Building a concept

1. Start from the **script's world** and **central metaphor** (Pass 0 notes).
2. Ask: *if a great documentary team made this, what would the camera be looking at
   all the time?* Desks and files? Maps? Machines? Faces? Archive? Data?
3. Turn that into a sentence: "**The story told as** a case file assembled on a desk",
   "**...as** a navigator's chart", "**...as** an exhibition in a museum of failures",
   "**...as** a lab notebook", "**...as** a live trading terminal".
4. Derive everything else from the sentence: palette, fonts, grade, texture,
   recurring layers (cards, maps, typewriter text), motifs and house rules.
5. Write 3 concepts that are **really different** (not three palettes of one idea).

A good concept is **specific** ("1970s NASA mission-control printouts" beats
"retro"), **fits the argument**, and **generates motifs** you can reuse.

## Palette rules

- 5 tokens: `bg`, `fg`, `accent` (what matters: numbers, key words, circles), `accent2` (danger/contrast), `muted`.
- Accent must pop on both bg and on graded footage. Test it in the storyboard.
- Use accent sparingly; it's the viewer's guide to what matters.

## Font pairings available

| Display | Body | Feel |
|---|---|---|
| Anton | Inter | Bold YouTube documentary, punchy numbers |
| Bebas Neue | Montserrat | Sports, energy, modern editorial |
| Oswald | Inter | Investigative, news, condensed and serious |
| Playfair Display | Inter | History, culture, elegance |
| DM Serif Display | Inter | Psychology, essays, editorial calm |
| Space Grotesk | Space Grotesk | Tech, science, startup |
| Montserrat | Inter | Clean business explainer |
Accent: `Permanent Marker` (bold marker), `Caveat` (handwriting). Mono: `JetBrains Mono`.

## Ready-made looks (starting points; adapt, don't copy)

### Chart Room (geopolitics, trade, geography)
Dark maps, navigator pen lines, cold footage. Palette `#07131f / #f2efe6 / #ffc83d / #ff5a36 / #7d8fa3`. Anton + Inter + Caveat. Grade `cold`, texture grain+vignette. Motifs: routes, pins, measurement lines. Heavy use of WorldMap, DotGlobe, label, counter.

### Case File (true crime, investigations, scandals)
Evidence board on paper, polaroids, red string, typewriter. Palette `#0e0e0e / #ece6d6 / #e63946 / #ffd166 / #8d8a80`. Oswald + Inter + Permanent Marker. Grade `bleach`, texture grain+dust. Motifs: stamps, redactions (box annotations), typewriter dates. Cards, annotations, freeze & circle.

### Archive (history, biographies)
Sepia scans, film burn between eras, elegant serif. Palette `#14110d / #f1e7d0 / #d4a24c / #9c2f2f / #8a7f6a`. Playfair Display + Inter + Caveat. Grade `vintage`, texture grain+dust. Motifs: polaroid frames, timeline, dates as labels. 2.5D parallax photos, Ken-Burns pushes toward faces, `film_burn`/`dip_black`.

### Terminal (tech, AI, cybersecurity, internet culture)
Dark grid, mono type, neon accent, glitch used only for "wrong". Palette `#05070a / #d7e2ea / #39ff88 / #ff3b6b / #5c6b77`. Space Grotesk + JetBrains Mono. Grade `cold` or `matrix` (sparingly), texture scanlines low. Motifs: typewriter logs, browser/phone cards, NetworkGraph. Transitions: cut, slide, glitch for errors.

### Ticker (finance, business, economics)
Clean navy, green/red, counters and bars, real places. Palette `#0a1020 / #eef2f7 / #22c55e / #ef4444 / #7b8aa5`. Montserrat + Inter. Grade `natural`. Motifs: price counters, bars, split contrasts, lower thirds for companies. Avoid stock-chart clichés: show the product, the factory, the queue.

### Observatory (science, space, nature)
Deep black, cyan, particles, slow camera. Palette `#020409 / #e6f1ff / #4cc9f0 / #f72585 / #6c7a96`. Space Grotesk + Inter. Grade `cinematic`, texture grain low + particles(dust) for space. Motifs: DotGlobe, scale counters ("1 in 10^12"), pull_out reveals.

### Editorial (psychology, self-improvement, essays)
Off-white paper, serif, negative space, warm film, a few strong images. Palette `#f3eee6 / #1c1a17 / #d9480f / #364fc7 / #8f877c` (light bg!). DM Serif Display + Inter + Caveat. Grade `warm_film`, texture grain low. Motifs: reveal/quote typography, marker notes, cards. Fewer, longer shots.

### Night (mysteries, horror, unexplained)
Night grade, VHS, heartbeat SFX, slow pushes, darkness as composition. Palette `#030305 / #dcdcdc / #c1121f / #e9c46a / #6b6b6b`. Bebas Neue + Inter + JetBrains Mono. Grade `night`, texture grain+vignette. Motifs: viewfinder/rec HUD, spotlight annotations, freeze frames. Transitions: dip_black, glitch.

### Broadcast (sports, competition, rankings)
Vivid, slams, whips, crash zooms, big numbers. Palette `#0b0b0b / #ffffff / #ffd60a / #ff006e / #9aa0a6`. Bebas Neue + Montserrat. Grade `vivid`. Motifs: rank stamps, counters, split head-to-heads. Energy high; still keep breaths.

## AI image style suffix

Every treatment defines `ai_image_style`, appended to every AI prompt so all
generated images share one look. Formula: *medium + lighting + palette + lens/grain + exclusions.*
- Chart Room: "cinematic documentary photograph, overcast cold light, muted navy and steel tones, subtle 35mm grain, no text, no logos"
- Archive: "black-and-white archival photograph, 1920s press photo, soft focus, film grain, slight vignette, no text"
- Editorial: "editorial photograph, soft window light, warm neutral tones, shallow depth of field, minimal composition, no text"
