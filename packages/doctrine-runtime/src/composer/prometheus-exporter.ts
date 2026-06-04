/**
 * prometheus-exporter.ts — Composition Runtime Prometheus Metrics
 * Exports szl_composition_overhead_microseconds histogram and related counters.
 *
 * References
 * ----------
 * [1] Prometheus data model: https://prometheus.io/docs/concepts/data_model/
 * [2] OpenMetrics spec v1.0: https://github.com/OpenObservability/OpenMetrics
 */

// ─────────────────────────────────────────────────────────────────────────────
// Minimal self-contained Prometheus text-format emitter
// (no external SDK dependency — avoids transitive supply-chain risk per
//  Doctrine v6 §5.1 "minimal-footprint" constraint [1])
// ─────────────────────────────────────────────────────────────────────────────

export interface HistogramSample {
  value: number;        // microseconds
  labels: Record<string, string>;
}

export interface CounterState {
  value: number;
  labels: Record<string, string>;
}

/** Histogram bucket upper bounds in µs — chosen to cover sub-µs to 10 ms range */
const COMPOSITION_BUCKETS_US = [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, Infinity];

interface HistogramBucketState {
  counts: number[];   // parallel to COMPOSITION_BUCKETS_US
  sum: number;
  totalCount: number;
  labels: Record<string, string>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Registry
// ─────────────────────────────────────────────────────────────────────────────

function labelKey(labels: Record<string, string>): string {
  return Object.entries(labels)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}="${v}"`)
    .join(",");
}

function renderLabels(labels: Record<string, string>): string {
  const parts = Object.entries(labels)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}="${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`);
  return parts.length > 0 ? `{${parts.join(",")}}` : "";
}

class CompositionMetricsRegistry {
  // szl_composition_overhead_microseconds — histogram
  private readonly overheadHistogram = new Map<string, HistogramBucketState>();

  // szl_composition_total — counter
  private readonly compositionTotal = new Map<string, CounterState>();

  // szl_composition_errors_total — counter
  private readonly compositionErrors = new Map<string, CounterState>();

  // szl_composition_lambda_value — gauge (last observed Λ per mode)
  private readonly lambdaGauge = new Map<string, number>();

  /**
   * Records one composition overhead observation.
   * @param micros  Elapsed microseconds
   * @param mode    "geometric_mean" | "min_lambda"
   * @param inputCount Number of input policies
   */
  recordOverhead(micros: number, mode: string, inputCount: number): void {
    const labels: Record<string, string> = {
      mode,
      input_count_bucket: inputCountBucket(inputCount),
    };
    const key = labelKey(labels);

    if (!this.overheadHistogram.has(key)) {
      this.overheadHistogram.set(key, {
        counts: new Array<number>(COMPOSITION_BUCKETS_US.length).fill(0),
        sum: 0,
        totalCount: 0,
        labels,
      });
    }
    const state = this.overheadHistogram.get(key)!;
    state.sum += micros;
    state.totalCount += 1;
    for (let i = 0; i < COMPOSITION_BUCKETS_US.length; i++) {
      if (micros <= COMPOSITION_BUCKETS_US[i]) {
        state.counts[i] += 1;
      }
    }
  }

  recordComposition(mode: string, success: boolean, inputCount: number): void {
    const labels: Record<string, string> = { mode, success: String(success) };
    const key = labelKey(labels);

    if (success) {
      if (!this.compositionTotal.has(key)) {
        this.compositionTotal.set(key, { value: 0, labels });
      }
      this.compositionTotal.get(key)!.value += 1;
    } else {
      if (!this.compositionErrors.has(key)) {
        this.compositionErrors.set(key, { value: 0, labels });
      }
      this.compositionErrors.get(key)!.value += 1;
    }
    void inputCount; // available for future label extension
  }

  recordLambda(lambda: number, mode: string): void {
    this.lambdaGauge.set(mode, lambda);
  }

  /** Render all metrics in Prometheus text format (OpenMetrics v1.0 [2]) */
  renderText(): string {
    const lines: string[] = [];

    // ── szl_composition_overhead_microseconds ────────────────────────────────
    lines.push("# HELP szl_composition_overhead_microseconds Doctrine v6 policy composition latency in microseconds");
    lines.push("# TYPE szl_composition_overhead_microseconds histogram");
    for (const state of this.overheadHistogram.values()) {
      const lbase = renderLabels(state.labels);
      let cumulative = 0;
      for (let i = 0; i < COMPOSITION_BUCKETS_US.length; i++) {
        cumulative += state.counts[i];
        const le = COMPOSITION_BUCKETS_US[i] === Infinity ? "+Inf" : String(COMPOSITION_BUCKETS_US[i]);
        const lblStr = lbase === "" ? `{le="${le}"}` : `${lbase.slice(0, -1)},le="${le}"}`;
        lines.push(`szl_composition_overhead_microseconds_bucket${lblStr} ${cumulative}`);
      }
      lines.push(`szl_composition_overhead_microseconds_sum${lbase} ${state.sum}`);
      lines.push(`szl_composition_overhead_microseconds_count${lbase} ${state.totalCount}`);
    }

    // ── szl_composition_total ────────────────────────────────────────────────
    lines.push("# HELP szl_composition_total Total Doctrine v6 policy compositions");
    lines.push("# TYPE szl_composition_total counter");
    for (const state of this.compositionTotal.values()) {
      lines.push(`szl_composition_total${renderLabels(state.labels)} ${state.value}`);
    }

    // ── szl_composition_errors_total ─────────────────────────────────────────
    lines.push("# HELP szl_composition_errors_total Total failed Doctrine v6 compositions");
    lines.push("# TYPE szl_composition_errors_total counter");
    for (const state of this.compositionErrors.values()) {
      lines.push(`szl_composition_errors_total${renderLabels(state.labels)} ${state.value}`);
    }

    // ── szl_composition_lambda_value ─────────────────────────────────────────
    lines.push("# HELP szl_composition_lambda_value Last observed composed Λ score per mode");
    lines.push("# TYPE szl_composition_lambda_value gauge");
    for (const [mode, val] of this.lambdaGauge.entries()) {
      lines.push(`szl_composition_lambda_value{mode="${mode}"} ${val}`);
    }

    lines.push("# EOF");
    return lines.join("\n") + "\n";
  }
}

function inputCountBucket(n: number): string {
  if (n <= 2) return "1-2";
  if (n <= 5) return "3-5";
  if (n <= 10) return "6-10";
  return "11+";
}

// Singleton registry
export const compositionMetrics = new CompositionMetricsRegistry();

/**
 * Wraps DoctrineComposer.compose() with automatic metric recording.
 */
export function withMetrics<T extends { overheadMicros: number; mode: string; inputCount: number; policy: { lambda: number } }>(
  fn: () => T
): T {
  try {
    const result = fn();
    compositionMetrics.recordOverhead(result.overheadMicros, result.mode, result.inputCount);
    compositionMetrics.recordComposition(result.mode, true, result.inputCount);
    compositionMetrics.recordLambda(result.policy.lambda, result.mode);
    return result;
  } catch (err) {
    compositionMetrics.recordComposition("unknown", false, 0);
    throw err;
  }
}
