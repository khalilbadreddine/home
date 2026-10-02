import type { VisualPlan } from "./types";

/** Asset-free sample so `npm run studio` opens on something. Real plans live in projects/<slug>/visual_plan.json. */
export const SAMPLE_PLAN: VisualPlan = {
  version: "1.0",
  meta: { title: "Engine sample", fps: 30, width: 1920, height: 1080 },
  treatment: {
    concept: "Engine smoke test",
    palette: { bg: "#0b0b0f", fg: "#f4f1ea", accent: "#ffcc33", accent2: "#e5484d", muted: "#8b8b93" },
    fonts: { display: "Anton", body: "Inter", accent: "Permanent Marker", mono: "JetBrains Mono" },
    texture: ["grain", "vignette"],
  },
  shots: [
    {
      id: "s01",
      start: 0,
      end: 3,
      intent: "Hook",
      camera: { move: "push_in", intensity: 0.4 },
      layers: [
        { type: "background", style: "mesh" },
        { type: "text", text: "Every 40 seconds", style: "slam", highlight: ["40"] },
      ],
    },
    {
      id: "s02",
      start: 3,
      end: 6.5,
      intent: "Number",
      transition_in: { type: "whip_left" },
      layers: [
        { type: "background", style: "grid" },
        { type: "counter", to: 2160000, label: "people a day", suffix: "" },
      ],
    },
    {
      id: "s03",
      start: 6.5,
      end: 10,
      intent: "Place",
      transition_in: { type: "zoom_through" },
      layers: [
        { type: "custom", component: "DotGlobe", props: { from: { lon: -20, lat: 20 }, to: { lon: 10, lat: 30 }, markers: [{ lon: -7.6, lat: 33.6, label: "Casablanca" }] } },
      ],
    },
  ],
};
