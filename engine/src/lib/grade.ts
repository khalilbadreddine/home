import type { Grade, Palette } from "../types";

export interface GradeLook {
  filter: string;
  overlay?: { background: string; blend: string; opacity: number };
}

/**
 * Color grades built from CSS filters + an optional blended color wash.
 * Cheap, deterministic, and good enough to make mismatched stock clips feel
 * like they belong to the same film.
 */
export function gradeLook(g: Grade | undefined, palette: Palette): GradeLook {
  switch (g) {
    case undefined:
    case "none":
      return { filter: "none" };
    case "natural":
      return { filter: "contrast(1.05) saturate(1.05)" };
    case "cinematic":
      return {
        filter: "contrast(1.12) saturate(0.9) brightness(0.96)",
        overlay: {
          background: "linear-gradient(180deg, rgba(0,70,90,0.55) 0%, rgba(0,40,60,0.35) 45%, rgba(255,140,60,0.35) 100%)",
          blend: "soft-light",
          opacity: 0.8,
        },
      };
    case "teal_orange":
      return {
        filter: "contrast(1.15) saturate(1.15)",
        overlay: {
          background: "radial-gradient(ellipse at 50% 55%, rgba(255,150,70,0.55) 0%, rgba(0,110,130,0.6) 75%)",
          blend: "soft-light",
          opacity: 0.9,
        },
      };
    case "noir":
      return { filter: "grayscale(1) contrast(1.45) brightness(0.92)" };
    case "warm_film":
      return {
        filter: "sepia(0.25) saturate(1.1) contrast(1.05) brightness(1.02)",
        overlay: { background: "rgba(255,170,90,1)", blend: "soft-light", opacity: 0.3 },
      };
    case "cold":
      return {
        filter: "saturate(0.8) contrast(1.08) brightness(0.97)",
        overlay: { background: "rgba(60,120,200,1)", blend: "soft-light", opacity: 0.45 },
      };
    case "bleach":
      return { filter: "saturate(0.45) contrast(1.35) brightness(1.02)" };
    case "vintage":
      return {
        filter: "sepia(0.45) contrast(0.9) brightness(1.05) saturate(0.85)",
        overlay: { background: "rgba(120,80,40,1)", blend: "lighten", opacity: 0.18 },
      };
    case "vivid":
      return { filter: "saturate(1.45) contrast(1.12)" };
    case "muted":
      return { filter: "saturate(0.6) contrast(0.95) brightness(1.03)" };
    case "night":
      return {
        filter: "brightness(0.75) saturate(0.7) contrast(1.15)",
        overlay: { background: "rgba(20,40,120,1)", blend: "soft-light", opacity: 0.6 },
      };
    case "sepia":
      return { filter: "sepia(0.85) contrast(1.05)" };
    case "matrix":
      return {
        filter: "saturate(0.5) contrast(1.2) brightness(0.9)",
        overlay: { background: "rgba(0,255,120,1)", blend: "soft-light", opacity: 0.4 },
      };
    case "duotone":
      return {
        filter: "grayscale(1) contrast(1.25)",
        overlay: {
          background: `linear-gradient(135deg, ${palette.accent} 0%, ${palette.accent2 ?? palette.bg} 100%)`,
          blend: "color",
          opacity: 0.85,
        },
      };
    default:
      return { filter: "none" };
  }
}
