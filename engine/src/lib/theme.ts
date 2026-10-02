import type { Color, FontName, FontRole, Palette, Treatment } from "../types";

const FALLBACK_STACK = "Inter, Helvetica, Arial, sans-serif";

export const DEFAULT_PALETTE: Palette = {
  bg: "#0b0b0f",
  fg: "#f4f1ea",
  accent: "#ffcc33",
  accent2: "#e5484d",
  muted: "#8b8b93",
};

/** Resolve a palette token (bg, fg, accent, accent2, muted) or pass a literal color through. */
export function color(c: Color | undefined, palette: Palette, fallback: Color = palette.fg): Color {
  if (!c) return fallback;
  switch (c) {
    case "bg":
      return palette.bg;
    case "fg":
      return palette.fg;
    case "accent":
      return palette.accent;
    case "accent2":
      return palette.accent2 ?? palette.accent;
    case "muted":
      return palette.muted ?? palette.fg;
    default:
      return c;
  }
}

export function font(role: FontRole | undefined, t: Treatment, fallbackRole: FontRole = "body"): string {
  const r = role ?? fallbackRole;
  const fonts = t.fonts;
  const name: FontName | undefined =
    r === "display"
      ? fonts.display
      : r === "accent"
        ? fonts.accent ?? "Permanent Marker"
        : r === "mono"
          ? fonts.mono ?? "JetBrains Mono"
          : fonts.body;
  return `"${name ?? fonts.body}", ${FALLBACK_STACK}`;
}

/** Fonts that only ship one weight; never ask the browser to fake-bold them. */
export const SINGLE_WEIGHT: FontName[] = ["Anton", "Bebas Neue", "DM Serif Display", "Permanent Marker"];

export function weightFor(role: FontRole | undefined, t: Treatment, wanted: number): number {
  const r = role ?? "body";
  const name = r === "display" ? t.fonts.display : r === "accent" ? t.fonts.accent : r === "mono" ? t.fonts.mono : t.fonts.body;
  return name && SINGLE_WEIGHT.includes(name) ? 400 : wanted;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "").slice(0, 6);
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return { r: 255, g: 255, b: 255 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgba(hex: string, a: number): string {
  if (!hex.startsWith("#")) return hex;
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

/** A shadow that separates text from its background: dark halo for light text, light halo for dark ink. */
export function shadowFor(c: string): string {
  if (!c.startsWith("#")) return "0 0.04em 0.35em rgba(0,0,0,0.55), 0 0 0.08em rgba(0,0,0,0.4)";
  const { r, g, b } = hexToRgb(c);
  const lum = (r * 299 + g * 587 + b * 114) / 1000;
  return lum > 110 ? "0 0.04em 0.35em rgba(0,0,0,0.55), 0 0 0.08em rgba(0,0,0,0.4)" : "0 0 0.25em rgba(255,250,240,0.45)";
}
