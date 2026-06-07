export interface LatencyPercentiles {
  p50: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
  mean: number;
}

export function computeLatencyPercentiles(latenciesMs: number[]): LatencyPercentiles {
  if (latenciesMs.length === 0) {
    return { p50: 0, p95: 0, p99: 0, min: 0, max: 0, mean: 0 };
  }

  const sorted = [...latenciesMs].sort((a, b) => a - b);
  const n = sorted.length;

  function percentile(p: number): number {
    const index = Math.ceil((p / 100) * n) - 1;
    return sorted[Math.max(0, Math.min(n - 1, index))] ?? 0;
  }

  const mean = sorted.reduce((s, v) => s + v, 0) / n;

  return {
    p50: percentile(50),
    p95: percentile(95),
    p99: percentile(99),
    min: sorted[0] ?? 0,
    max: sorted[n - 1] ?? 0,
    mean,
  };
}
