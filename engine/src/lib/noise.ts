// Deterministic pseudo-random helpers. Remotion renders frames in parallel and
// out of order, so nothing may depend on Math.random() or on previous frames.

export function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

/** Smooth 1D value noise in [-1, 1]. */
export function noise1(t: number, seed = 0): number {
  const i = Math.floor(t);
  const f = t - i;
  const a = hash(i + seed * 1000);
  const b = hash(i + 1 + seed * 1000);
  const u = f * f * (3 - 2 * f);
  return (a + (b - a) * u) * 2 - 1;
}

/** Layered noise: organic handheld-like motion. */
export function fbm(t: number, seed = 0): number {
  return noise1(t, seed) * 0.6 + noise1(t * 2.13, seed + 7) * 0.3 + noise1(t * 4.37, seed + 13) * 0.1;
}

export function seeded(seed: string | number): number {
  if (typeof seed === "number") return seed;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h % 9973);
}
