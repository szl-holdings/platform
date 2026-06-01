export function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededRng(seed: number) {
  const rand = mulberry32(seed);
  return {
    next: rand,
    range: (min: number, max: number) => min + rand() * (max - min),
    int: (min: number, max: number) => Math.floor(min + rand() * (max - min + 1)),
    pick: <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)] as T,
    bool: (p = 0.5) => rand() < p,
    gauss: (mean: number, std: number) => {
      const u = 1 - rand();
      const v = rand();
      const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      return mean + z * std;
    },
  };
}
