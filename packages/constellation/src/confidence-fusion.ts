/**
 * Confidence Fusion — combine confidence signals from multiple sources into a
 * single fused score for a node or edge.
 *
 * Supported fusion strategies:
 *  - weighted_average: source-weight-weighted mean (default).
 *  - bayesian: Dempster–Shafer-like combination: fused = 1 − ∏(1 − cᵢ).
 *  - min: the most conservative (smallest) score.
 *  - max: the most optimistic (largest) score.
 */

export type FusionStrategy = "weighted_average" | "bayesian" | "min" | "max";

export interface ConfidenceSignal {
  value: number;
  /** Optional weight for the weighted_average strategy (defaults to 1). */
  weight?: number;
  /** Informational label for the signal source. */
  source?: string;
}

export interface FusionResult {
  fused: number;
  strategy: FusionStrategy;
  inputCount: number;
  signals: ConfidenceSignal[];
}

/**
 * Fuse multiple confidence signals into a single score.
 *
 * @param signals  Array of confidence signals. An empty array returns 0.
 * @param strategy Fusion algorithm. Defaults to "weighted_average".
 */
export function fuseConfidence(
  signals: ConfidenceSignal[],
  strategy: FusionStrategy = "weighted_average",
): FusionResult {
  const base: Omit<FusionResult, "fused"> = {
    strategy,
    inputCount: signals.length,
    signals,
  };

  if (signals.length === 0) return { ...base, fused: 0 };
  if (signals.length === 1) return { ...base, fused: clamp(signals[0]!.value) };

  let fused: number;

  switch (strategy) {
    case "weighted_average": {
      let totalWeight = 0;
      let weightedSum = 0;
      for (const s of signals) {
        const w = s.weight ?? 1;
        totalWeight += w;
        weightedSum += clamp(s.value) * w;
      }
      fused = totalWeight > 0 ? weightedSum / totalWeight : 0;
      break;
    }

    case "bayesian": {
      let product = 1;
      for (const s of signals) {
        product *= 1 - clamp(s.value);
      }
      fused = 1 - product;
      break;
    }

    case "min": {
      fused = Math.min(...signals.map((s) => clamp(s.value)));
      break;
    }

    case "max": {
      fused = Math.max(...signals.map((s) => clamp(s.value)));
      break;
    }

    default: {
      fused = signals.reduce((acc, s) => acc + clamp(s.value), 0) / signals.length;
    }
  }

  return { ...base, fused: clamp(fused) };
}

/**
 * Apply fused confidence back to a node's confidence field.
 * Returns a new node object (does not mutate).
 */
export function applyFusedConfidence<T extends { confidence: number }>(
  node: T,
  signals: ConfidenceSignal[],
  strategy: FusionStrategy = "weighted_average",
): T & { confidence: number } {
  const { fused } = fuseConfidence(signals, strategy);
  return { ...node, confidence: fused };
}

function clamp(v: number): number {
  return Math.min(1, Math.max(0, v));
}
