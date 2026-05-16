import { WitnessAnchor, computeMerkleRoot, sha256, type AnchorConfig, type AnchorEntry } from '@workspace/ouroboros-anchor';
import type { ForecastSummary } from './forecast-summary';

/**
 * Default replay-root chain id for daily forecast.summary receipts.
 *
 * The ouroboros replay-root chain is keyed by (chainId, rootHash). Pinning a
 * single canonical chainId for forecast summaries means any verifier can
 * unambiguously locate the right anchor for `forecast.summary@DATE`.
 */
export const FORECAST_REPLAY_CHAIN_ID = 'agi-forecast.summary.v1';

/**
 * Canonical leaf encoding for a forecast.summary receipt.
 *
 * A leaf is `<id>:<receiptHash>` so that:
 *  - the leaf is uniquely identified by date (id contains the date),
 *  - the leaf is bound to the snapshot content (receiptHash is sha256 of the
 *    canonicalized snapshot),
 *  - leaves are stable across machines (no timestamps, no env-dependent data).
 */
export function forecastSummaryLeaf(summary: Pick<ForecastSummary, 'id' | 'receiptHash'>): string {
  return `${summary.id}:${summary.receiptHash}`;
}

export interface ForecastAnchorEntry extends AnchorEntry {
  /** The leaf set used to build the Merkle root, in insertion order. */
  readonly leaves: readonly string[];
}

/**
 * Append a batch of daily forecast summaries to the ouroboros replay-root
 * chain via the existing WitnessAnchor.
 *
 * Order is preserved (Merkle root is order-sensitive). Callers that want a
 * deterministic root across runs should pass summaries in a stable order
 * (e.g. sorted by date).
 */
export async function anchorForecastSummaries(
  summaries: readonly ForecastSummary[],
  config: AnchorConfig = { driver: 'LOCAL' },
  chainId: string = FORECAST_REPLAY_CHAIN_ID,
): Promise<ForecastAnchorEntry> {
  if (summaries.length === 0) {
    throw new Error('anchorForecastSummaries: refusing to anchor an empty batch');
  }
  const leaves = summaries.map(forecastSummaryLeaf);
  const witness = new WitnessAnchor(config);
  const entry = await witness.anchor(chainId, leaves);
  return { ...entry, leaves };
}

export type ForecastInclusionVerdict =
  | { included: true; rootMatches: true; leafIndex: number }
  | {
      included: false;
      rootMatches: boolean;
      reason: 'leaf-not-in-chain' | 'root-mismatch' | 'chain-id-mismatch';
    };

export interface VerifyOptions {
  /**
   * Chain id the proof must be bound to. Defaults to
   * {@link FORECAST_REPLAY_CHAIN_ID}; pass `null` to skip the check (e.g. when
   * verifying entries from an alternate, caller-defined chain namespace).
   */
  readonly expectedChainId?: string | null;
}

/**
 * Verify that a given forecast summary is included in a previously anchored
 * replay-root chain entry.
 *
 * Inclusion is proven by:
 *   1. checking the entry is bound to the expected chain id,
 *   2. checking the canonical leaf for `summary` is present in `entry.leaves`,
 *   3. recomputing the Merkle root from `entry.leaves` and comparing to
 *      `entry.rootHash` (i.e. the entry hasn't been tampered with).
 */
export function verifyForecastSummaryInclusion(
  summary: Pick<ForecastSummary, 'id' | 'receiptHash'>,
  entry: ForecastAnchorEntry,
  options: VerifyOptions = {},
): ForecastInclusionVerdict {
  const expectedChainId =
    options.expectedChainId === undefined ? FORECAST_REPLAY_CHAIN_ID : options.expectedChainId;
  const recomputed = computeMerkleRoot([...entry.leaves]);
  const rootMatches = recomputed === entry.rootHash;
  if (expectedChainId !== null && entry.chainId !== expectedChainId) {
    return { included: false, rootMatches, reason: 'chain-id-mismatch' };
  }
  const leaf = forecastSummaryLeaf(summary);
  const leafIndex = entry.leaves.indexOf(leaf);
  if (leafIndex < 0) {
    return { included: false, rootMatches, reason: 'leaf-not-in-chain' };
  }
  if (!rootMatches) {
    return { included: false, rootMatches: false, reason: 'root-mismatch' };
  }
  return { included: true, rootMatches: true, leafIndex };
}

export { sha256 };
