import { staticFile } from "remotion";

const VIDEO_EXT = [".mp4", ".mov", ".webm", ".m4v", ".mkv"];

export function resolveSrc(src: string): string {
  if (/^(https?:|data:|blob:)/.test(src)) return src;
  return staticFile(src.replace(/^\.?\//, ""));
}

export function isVideoSrc(src: string | undefined, hint?: boolean): boolean {
  if (hint !== undefined) return hint;
  if (!src) return false;
  const clean = src.toLowerCase().split("?")[0];
  return VIDEO_EXT.some((e) => clean.endsWith(e));
}
