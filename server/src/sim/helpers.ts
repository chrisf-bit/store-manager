export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function applyDeltas(
  metrics: Record<string, number>,
  deltas: Record<string, number>
): Record<string, number> {
  const result = { ...metrics };
  for (const [key, delta] of Object.entries(deltas)) {
    if (key in result) {
      result[key] = result[key] + delta;
    }
  }
  return result;
}

// Simple seeded RNG (mulberry32)
export function createRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function weightedRandomChoice<T extends { weightBase: number }>(
  items: T[],
  weights: number[],
  rng: () => number
): T {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let r = rng() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}
