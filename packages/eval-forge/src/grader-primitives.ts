export const PASS_THRESHOLD = 0.7;

export function fieldScore(
  output: Record<string, unknown>,
  groundTruth: Record<string, unknown>,
): { score: number; failures: string[] } {
  const keys = Object.keys(groundTruth);
  if (keys.length === 0) return { score: 1.0, failures: [] };
  let matches = 0;
  const failures: string[] = [];
  for (const key of keys) {
    const gt = groundTruth[key];
    const out = output[key];
    if (typeof gt === 'object' && gt !== null && 'min' in gt && 'max' in gt) {
      const range = gt as { min: number; max: number };
      const num = typeof out === 'number' ? out : 0;
      if (num >= range.min && num <= range.max) matches++;
      else failures.push(`${key}: [${range.min},${range.max}] got ${num}`);
    } else if (JSON.stringify(out) === JSON.stringify(gt)) {
      matches++;
    } else if (gt !== null && gt !== undefined) {
      failures.push(`${key}: expected ${JSON.stringify(gt)} got ${JSON.stringify(out)}`);
    }
  }
  return { score: matches / keys.length, failures };
}
