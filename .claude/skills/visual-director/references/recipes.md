# Recipes: proven layer stacks

Each recipe is a complete shot body (add `id`, `start`, `end`, `script`).
They are validated by `engine/scripts/test-recipes.mjs`, so they always match
the schema. Adapt them; don't paste them unchanged into every video.

---

### 1. Number Slam
A figure that must hit hard. Footage pushed back, the count lands on the spoken number.
```json
{
  "intent": "The scale lands physically: the count runs and slams as the narrator says it.",
  "strategy": "data",
  "camera": { "move": "drift", "intensity": 0.4 },
  "layers": [
    { "type": "video", "darken": 0.45, "asset": { "kind": "stock_video", "description": "Wide shot showing many of the counted thing", "query": "crowd aerial timelapse" } },
    { "type": "fx", "effect": "scrim", "side": "center", "intensity": 0.4 },
    { "type": "counter", "to": 2400000, "label": "people every day", "cue_word": "million", "count_duration": 1.4 }
  ],
  "post": [{ "effect": "pulse", "intensity": 0.6, "times": [1.6] }],
  "sfx": [{ "cue": "impact", "cue_word": "million", "volume": 0.6 }]
}
```

### 2. Freeze & Circle
Stop the footage on the telling frame, flash, circle the detail. Documentary "look here".
```json
{
  "intent": "The clip stops on the exact frame that proves the point and the circle tells the viewer where to look.",
  "strategy": "evidence",
  "layers": [
    { "type": "video", "freeze_at": 1.2, "asset": { "kind": "stock_video", "description": "Clip containing the detail", "query": "subject action close-up" } },
    { "type": "fx", "effect": "flash", "start": 1.2, "intensity": 0.3 },
    { "type": "annotation", "shape": "circle", "at": { "x": 62, "y": 44 }, "radius": 10, "label": "the detail", "start": 1.35 }
  ],
  "post": [{ "effect": "desaturate", "intensity": 0.7, "start": 1.2 }],
  "sfx": [{ "cue": "shutter", "at": 1.2, "volume": 0.8 }]
}
```

### 3. Map Dive
Arrive somewhere. Zoom from the region into the place; highlight, pin, label.
```json
{
  "intent": "The viewer lands exactly where the story happens and sees its neighbours.",
  "strategy": "map",
  "transition_in": { "type": "zoom_through", "duration": 0.5 },
  "layers": [
    { "type": "custom", "component": "WorldMap", "props": {
      "style": "dark", "from": { "lon": 10, "lat": 30, "zoom": 1.6 }, "to": { "lon": -7.6, "lat": 33.6, "zoom": 9 },
      "highlight": ["Morocco"], "markers": [{ "lon": -7.6, "lat": 33.6, "label": "Casablanca", "at": 1.4 }] } }
  ],
  "sfx": [{ "cue": "whoosh", "at": -0.15, "volume": 0.5 }]
}
```

### 4. Route / Journey
A path between places: trade, migration, invasion, a trip.
```json
{
  "intent": "The journey is drawn as the narrator describes it, so distance and direction become intuitive.",
  "strategy": "map",
  "layers": [
    { "type": "custom", "component": "WorldMap", "props": {
      "style": "paper", "from": { "lon": 20, "lat": 35, "zoom": 2.4 }, "to": { "lon": 15, "lat": 38, "zoom": 2.8 },
      "routes": [{ "from": { "lon": 12.5, "lat": 41.9 }, "to": { "lon": 31.2, "lat": 30 }, "at": 0.4 }],
      "markers": [{ "lon": 12.5, "lat": 41.9, "label": "Rome", "at": 0.2 }, { "lon": 31.2, "lat": 30, "label": "Cairo", "at": 1.5 }] } }
  ]
}
```

### 5. Globe Connect
Global reach, connections between continents.
```json
{
  "intent": "Lines converge on one point on the planet: this place is a hub.",
  "strategy": "abstract",
  "layers": [
    { "type": "background", "style": "radial", "colors": ["bg", "#10283f"] },
    { "type": "custom", "component": "DotGlobe", "props": {
      "from": { "lon": 60, "lat": 20 }, "to": { "lon": 0, "lat": 30 },
      "markers": [{ "lon": -0.1, "lat": 51.5, "label": "London", "at": 1.0 }],
      "arcs": [{ "from": { "lon": -74, "lat": 40.7 }, "to": { "lon": -0.1, "lat": 51.5 } }, { "from": { "lon": 103.8, "lat": 1.3 }, "to": { "lon": -0.1, "lat": 51.5 } }] } }
  ]
}
```

### 6. Text Behind Subject
The title sits between the background and a cut-out subject. Expensive look, zero video cost.
```json
{
  "intent": "The name is literally inside the scene, which makes the reveal feel monumental.",
  "strategy": "typography",
  "hero": true,
  "camera": { "move": "push_in", "intensity": 0.5 },
  "layers": [
    { "type": "parallax", "planes": [
      { "depth": 0, "asset": { "kind": "ai_image", "description": "Background plate of the scene without the subject", "prompt": "wide establishing shot of the location at dusk" } },
      { "depth": 0.45, "text": "THE NAME", "color": "accent", "size": 26 },
      { "depth": 1, "fit": "contain", "asset": { "kind": "cutout", "description": "The subject isolated", "prompt": "the subject, full body, plain light background", "needs_cutout": true } }
    ] }
  ],
  "sfx": [{ "cue": "riser", "at": -1.6, "volume": 0.45 }, { "cue": "boom", "at": 0, "volume": 0.6 }]
}
```

### 7. 2.5D Photo
Bring an archive photo or AI image to life with depth.
```json
{
  "intent": "A still photograph gains depth so the moment feels lived-in, not presented.",
  "strategy": "reenactment",
  "camera": { "move": "pan_right", "intensity": 0.4 },
  "layers": [
    { "type": "parallax", "planes": [
      { "depth": 0, "asset": { "kind": "archive_image", "description": "Full photo (background plate)", "query": "historic street photo 1920s" } },
      { "depth": 0.9, "fit": "contain", "asset": { "kind": "cutout", "description": "Main figure cut out of the same photo", "needs_cutout": true } }
    ] },
    { "type": "fx", "effect": "dust", "intensity": 0.35 }
  ],
  "grade": "vintage"
}
```

### 8. Evidence Board
Several documents/photos pinned and connected: investigations, timelines of a case.
```json
{
  "intent": "The pieces of the case appear one by one and the red line connects them: the viewer sees the pattern.",
  "strategy": "evidence",
  "camera": { "move": "drift", "intensity": 0.5 },
  "layers": [
    { "type": "background", "style": "paper" },
    { "type": "card", "frame": "polaroid", "box": { "x": 8, "y": 14, "w": 28, "h": 44 }, "rotate": -6, "caption": "suspect A", "asset": { "kind": "archive_image", "description": "Portrait A" } },
    { "type": "card", "frame": "torn", "box": { "x": 40, "y": 30, "w": 26, "h": 40 }, "rotate": 3, "start": 0.5, "asset": { "kind": "archive_image", "description": "Newspaper clipping" } },
    { "type": "card", "frame": "polaroid", "box": { "x": 68, "y": 10, "w": 26, "h": 42 }, "rotate": 5, "start": 1.0, "caption": "the bank", "asset": { "kind": "archive_image", "description": "Building photo" } },
    { "type": "annotation", "shape": "route", "points": [{ "x": 22, "y": 40 }, { "x": 52, "y": 50 }, { "x": 81, "y": 32 }], "color": "accent2", "start": 1.5, "draw_duration": 1.0 }
  ],
  "sfx": [{ "cue": "click", "at": 0 }, { "cue": "click", "at": 0.5 }, { "cue": "click", "at": 1.0 }]
}
```

### 9. Split Contrast
Then vs now, us vs them, expectation vs reality.
```json
{
  "intent": "Both realities are on screen at once, so the difference is seen, not just told.",
  "strategy": "contrast",
  "transition_in": { "type": "wipe_right" },
  "layers": [
    { "type": "split", "layout": "two_vertical", "panels": [
      { "label": "1990", "grade": "vintage", "asset": { "kind": "archive_video", "description": "The place in 1990" } },
      { "label": "Today", "asset": { "kind": "stock_video", "description": "The same place today", "query": "city skyline drone" } }
    ] }
  ]
}
```

### 10. Kinetic Thesis
The sentence that matters, word by word, synced to the voice.
```json
{
  "intent": "The thesis is written as it's spoken; the key word lands in accent.",
  "strategy": "typography",
  "hero": true,
  "layers": [
    { "type": "video", "blur": 14, "darken": 0.55, "asset": { "kind": "stock_video", "description": "Slow, moody texture footage" } },
    { "type": "text", "text": "Geography is destiny", "style": "kinetic", "highlight": ["destiny"], "size": 8 },
    { "type": "fx", "effect": "light_leak", "intensity": 0.35 }
  ]
}
```

### 11. Montage Burst
Many things fast: accumulation, chaos, time passing. One shot per item; this is one of them.
```json
{
  "intent": "One of six 0.5 s flashes; together they say 'everywhere, all at once'.",
  "strategy": "montage",
  "transition_in": { "type": "cut" },
  "camera": { "move": "crash_zoom", "intensity": 0.4 },
  "layers": [
    { "type": "video", "speed": 1.2, "asset": { "kind": "stock_video", "description": "One instance of the thing" } }
  ],
  "sfx": [{ "cue": "tick", "at": 0, "volume": 0.4 }]
}
```

### 12. Chapter Card
Section reset in long videos.
```json
{
  "intent": "A clean break: the viewer knows a new part begins and what it's about.",
  "strategy": "typography",
  "transition_in": { "type": "dip_black", "duration": 0.7 },
  "layers": [
    { "type": "background", "style": "grid" },
    { "type": "text", "text": "The Door Opens", "subtitle": "Part 2", "style": "chapter" }
  ],
  "sfx": [{ "cue": "whoosh_long", "at": -0.3, "volume": 0.4 }]
}
```

### 13. Lower Third Intro
Introduce a person or source over footage; the camera moves, the name stays.
```json
{
  "intent": "We meet the person and immediately know who they are and why they matter.",
  "strategy": "character",
  "camera": { "move": "push_in", "intensity": 0.3, "target": { "x": 45, "y": 40 } },
  "layers": [
    { "type": "image", "asset": { "kind": "archive_image", "description": "Portrait of the person" } },
    { "type": "fx", "effect": "scrim", "side": "bottom", "intensity": 0.5 },
    { "type": "text", "text": "Alexander Fleming", "subtitle": "Bacteriologist · London", "style": "lower_third", "start": 0.4 }
  ]
}
```

### 14. Phone Proof
A post, a headline, a website as evidence.
```json
{
  "intent": "The claim is backed by the real post, and the highlight shows the exact line.",
  "strategy": "evidence",
  "layers": [
    { "type": "background", "style": "mesh" },
    { "type": "card", "frame": "phone", "box": { "x": 38, "y": 6, "w": 24, "h": 88 }, "tilt": -10, "asset": { "kind": "screenshot", "description": "Screenshot of the post" } },
    { "type": "annotation", "shape": "highlight", "box": { "x": 40, "y": 42, "w": 20, "h": 5 }, "start": 0.8 }
  ],
  "sfx": [{ "cue": "pop", "at": 0 }]
}
```

### 15. Timeline Jump
Placing events in time.
```json
{
  "intent": "The viewer sees how far apart these moments are and where we are now.",
  "strategy": "process",
  "layers": [
    { "type": "background", "style": "dots" },
    { "type": "timeline", "highlight": 2, "items": [{ "date": "1869", "label": "Suez Canal opens" }, { "date": "1956", "label": "Suez Crisis" }, { "date": "2007", "label": "Tanger Med opens" }] }
  ],
  "sfx": [{ "cue": "tick", "at": 0.2 }, { "cue": "tick", "at": 0.6 }, { "cue": "ding", "at": 1.0 }]
}
```

### 16. Spotlight Detail
Darken everything but the thing that matters in a still.
```json
{
  "intent": "In a busy image, only the important figure stays lit.",
  "strategy": "specific_detail",
  "camera": { "move": "push_in", "intensity": 0.45, "target": { "x": 70, "y": 40 } },
  "layers": [
    { "type": "image", "asset": { "kind": "archive_image", "description": "Crowded photo" } },
    { "type": "annotation", "shape": "spotlight", "at": { "x": 70, "y": 40 }, "radius": 14, "start": 0.4, "draw_duration": 0.8 }
  ]
}
```

### 17. Found Footage
POV, surveillance, "caught on camera".
```json
{
  "intent": "It feels recorded, raw and real, like evidence rather than production.",
  "strategy": "evidence",
  "camera": { "move": "handheld", "intensity": 0.6 },
  "grade": "bleach",
  "layers": [
    { "type": "video", "asset": { "kind": "stock_video", "description": "Handheld street footage", "query": "street night handheld" } },
    { "type": "fx", "effect": "vhs", "intensity": 0.5 },
    { "type": "fx", "effect": "rec" }
  ]
}
```

### 18. Stamp Verdict
Judgement, ranking, failure.
```json
{
  "intent": "The verdict lands like an official stamp: final and a bit funny.",
  "strategy": "typography",
  "layers": [
    { "type": "image", "darken": 0.3, "asset": { "kind": "stock_image", "description": "The thing being judged" } },
    { "type": "text", "text": "FAILED", "style": "stamp", "start": 0.4, "cue_word": "failed" }
  ],
  "sfx": [{ "cue": "impact", "cue_word": "failed", "volume": 0.6 }]
}
```

### 19. Network Spread
Something propagating through a system.
```json
{
  "intent": "From one point it reaches everything, and the viewer feels the speed of spread.",
  "strategy": "abstract",
  "layers": [
    { "type": "background", "style": "grid" },
    { "type": "custom", "component": "NetworkGraph", "props": { "nodes": 40, "hub_label": "Patient zero", "spread": 0.75 } }
  ]
}
```

### 20. Quote Card
Someone's exact words, with attribution.
```json
{
  "intent": "The person's own words carry authority the narrator's paraphrase can't.",
  "strategy": "evidence",
  "layers": [
    { "type": "image", "blur": 18, "darken": 0.6, "asset": { "kind": "archive_image", "description": "Portrait of the speaker" } },
    { "type": "text", "text": "One sometimes finds what one is not looking for.", "subtitle": "Alexander Fleming", "style": "quote", "highlight": ["not"] }
  ]
}
```

### 21. Vertical Clip, Done Right
Phone footage or tall archive scans in a 16:9 frame.
```json
{
  "intent": "Authentic phone footage shown full height without ugly black bars.",
  "strategy": "evidence",
  "layers": [
    { "type": "video", "fit": "blur_fill", "asset": { "kind": "provided", "description": "Vertical phone clip" } },
    { "type": "text", "text": "Filmed by a passenger", "style": "label", "position": "bottom_left", "start": 0.3 }
  ]
}
```

### 22. Breath
After a peak: no text, slow camera, warm leak, room to feel.
```json
{
  "intent": "A pause after the revelation so it can sink in.",
  "strategy": "metaphor",
  "camera": { "move": "pull_out", "intensity": 0.3 },
  "transition_in": { "type": "crossfade", "duration": 0.8 },
  "layers": [
    { "type": "video", "speed": 0.6, "asset": { "kind": "stock_video", "description": "Calm, wide, beautiful shot related to the theme" } },
    { "type": "fx", "effect": "light_leak", "intensity": 0.3 }
  ]
}
```
