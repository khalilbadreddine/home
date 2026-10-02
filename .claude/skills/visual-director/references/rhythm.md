# Rhythm, energy, retention, sound

A great plan with bad rhythm still feels amateur. Rhythm is shot length,
energy contour, where the surprises land, and sound.

## Shot length

| Context | Typical length |
|---|---|
| Hook (first 15–30 s) | 1–3 s, very varied |
| Normal explaining | 2.5–5 s |
| Data / map / diagram that needs reading | 4–7 s (with something animating inside) |
| Emotional beat, final line | 4–8 s, slower camera, fewer layers |
| Montage burst | 0.4–0.8 s per shot, 4–8 shots |

- Vary lengths. Uniform 3 s cuts feel mechanical even if every shot is good.
- A shot over ~6 s needs an internal event: an annotation drawing, a counter, a layer entering at a `cue_word`, a camera change.
- Cut **on the word** that starts the new idea (retime does this; it cuts ~80 ms before the word).
- After a big reveal, **hold**. Give the viewer one beat to feel it (`hold` in estimate mode; ask for the pause in TTS).

## Energy contour

Give each beat `energy` 1–5 and look at the curve `validate` prints. Good YouTube
contours look like a **sawtooth that climbs**: hook high, a dip to set context,
build, peak, short breath, build again higher, final peak, calm close.

Energy is made of: cut speed, camera intensity, transition type, text style
(slam vs reveal), music, and SFX density. To raise energy, change two of those.
To lower it, remove layers and slow the camera.

## Retention mechanics

- **Hook (0–5 s): show the promise.** The first frame should already raise a
  question (a number with no context, a striking image, a contradiction). No logos, no "in this video".
- **Hook (5–30 s): pay a little, promise more.** Answer the first question with a better one.
- **Pattern interrupts every 20–45 s**: a hero shot, a slam, a chapter card, a
  sudden silence, a format change (footage → full-screen typography → map). `validate` flags gaps > 45 s.
- **Open loops**: visually tease what's coming (a blurred image that resolves later, a map with a pin you return to).
- **Chapters** (videos > 3 min): `chapter` text + `dip_black` + music change. They reset attention.
- **Callbacks**: the opening image or motif returns at the end, changed. It makes the video feel designed.
- **End on the thesis**, not on "thanks for watching". The CTA can be a short final card.

## Section grammar

| Section | Visual behaviour |
|---|---|
| Hook | Fast, high contrast, a striking number or image, a slam. |
| Context | Slower, maps/archive/evidence, labels. Let the viewer orient. |
| Build | Alternating explanation (map, process, data) and proof (evidence, footage). |
| Turn / reveal | Hero shot, music change, transition with meaning. |
| Payoff | Biggest data shot, contrast, emotional character. |
| Close | Slow, warm or quiet, typography of the thesis, callback image. |

## Sound design (half of "production value")

- **Whoosh** under every whip and zoom_through (`at` ≈ −0.15).
- **Impact/boom** under slams, counters landing, stamps (sync with `cue_word`).
- **Riser** before a hero reveal (`at` ≈ −1.5 to −2.0), cut to silence or boom on the reveal.
- **Shutter/click** on freeze-frames and photos appearing; **pop** on pins and stamps.
- **Typing** under typewriter text; **tick** for countdowns/timelines; **heartbeat** for dread; **drone** for tension beds.
- **Silence** is the strongest sound: drop the music for the most important line.
- Music: one track per section or mood; `duck` keeps it under the voice. Change track at turns, not randomly.
- Don't stack: one SFX per moment. Volume 0.3–0.7; impacts can go higher.
