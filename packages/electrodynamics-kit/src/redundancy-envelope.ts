/**
 * Redundancy envelope — re-expressed from Honeywell / Collins / Parker's
 * public posture on triple-modular and dissimilar redundancy with typed
 * graceful-degradation ladders. See
 * docs/research/electrodynamics-synthesis-2026.md §8.
 *
 *   "Silent degradation (no transition receipt) is a doctrine violation."
 */

export interface RedundancyLadderRung {
  /** Minimum number of healthy channels required to remain in this mode. */
  readonly minHealthy: number;
  /** Mode identifier (e.g. `'full'`, `'reduced'`, `'limp-home'`). */
  readonly mode: string;
}

export interface RedundancyEnvelope {
  readonly subsystemRef: string;
  /** Total number of redundant channels. */
  readonly channels: number;
  /** Ladder from highest to lowest (sorted by minHealthy descending). */
  readonly ladder: readonly RedundancyLadderRung[];
  /** If healthy channels fall below this, the subsystem refuses to operate. */
  readonly refusalAt: number;
}

export interface RedundancyEvaluation {
  readonly subsystemRef: string;
  readonly channelsHealthy: number;
  readonly mode: string | null;
  readonly refused: boolean;
  readonly reason: string;
}

/**
 * Pure: evaluate the current mode given a healthy-channel count.
 * Returns the named mode the envelope dictates or refusal.
 */
export function evaluateRedundancy(
  envelope: RedundancyEnvelope,
  channelsHealthy: number,
): RedundancyEvaluation {
  if (!Number.isInteger(channelsHealthy) || channelsHealthy < 0) {
    throw new Error(
      `redundancy-envelope: channelsHealthy must be a non-negative integer, got ${channelsHealthy}`,
    );
  }
  if (channelsHealthy > envelope.channels) {
    throw new Error(
      `redundancy-envelope: channelsHealthy ${channelsHealthy} exceeds channels ${envelope.channels}`,
    );
  }
  if (channelsHealthy < envelope.refusalAt) {
    return {
      subsystemRef: envelope.subsystemRef,
      channelsHealthy,
      mode: null,
      refused: true,
      reason: `healthy ${channelsHealthy} below refusalAt ${envelope.refusalAt}`,
    };
  }
  const sorted = [...envelope.ladder].sort((a, b) => b.minHealthy - a.minHealthy);
  for (const rung of sorted) {
    if (channelsHealthy >= rung.minHealthy) {
      return {
        subsystemRef: envelope.subsystemRef,
        channelsHealthy,
        mode: rung.mode,
        refused: false,
        reason: `mode ${rung.mode} (healthy ${channelsHealthy} ≥ ${rung.minHealthy})`,
      };
    }
  }
  return {
    subsystemRef: envelope.subsystemRef,
    channelsHealthy,
    mode: null,
    refused: true,
    reason: `no ladder rung satisfied for healthy ${channelsHealthy}`,
  };
}

/**
 * Detect whether two evaluations represent a mode transition; used by
 * the consumer to decide whether to emit a `redundancy.mode-transition.v1`
 * receipt.
 */
export function isModeTransition(
  prior: RedundancyEvaluation,
  next: RedundancyEvaluation,
): boolean {
  return prior.mode !== next.mode || prior.refused !== next.refused;
}
