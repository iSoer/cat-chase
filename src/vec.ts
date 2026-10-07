export interface Vec {
  x: number;
  y: number;
}

export function dist(a: Vec, b: Vec): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function between(lo: number, hi: number): number {
  return lo + Math.random() * (hi - lo);
}

/** The closest thing to `from` that is at most `within` px away, or null. */
export function nearest<T extends { pos: Vec }>(list: readonly T[], from: Vec, within: number): T | null {
  let best: T | null = null;
  let bestD = within;
  for (const t of list) {
    const d = dist(t.pos, from);
    if (d <= bestD) {
      bestD = d;
      best = t;
    }
  }
  return best;
}

/** Pick one entry at random, proportionally to its `weight`. */
export function weightedPick<T extends { weight: number }>(list: readonly T[]): T {
  const total = list.reduce((sum, t) => sum + t.weight, 0);
  let roll = Math.random() * total;
  for (const t of list) {
    roll -= t.weight;
    if (roll <= 0) return t;
  }
  return list[list.length - 1];
}
