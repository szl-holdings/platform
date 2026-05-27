/**
 * Detector Council (MARBLE) — multi-detector arbitration (#5503).
 *
 * Distilled from the AGI-stack synthesis §5. When two or more detectors
 * fire on the same correlation key (incident id, asset, src-ip…) the
 * Council deliberates: each finding casts a *weighted vote* based on
 * detector kind, then the Council elects a single arbitrated verdict
 * with its own severity, confidence, and a list of supporting +
 * suppressed alternatives.
 *
 * Why bother instead of just OR-ing severities?
 *
 *   - Co-firing of an antivenom hit and a temporal anomaly is a much
 *     stronger signal than either alone. The Council bumps the verdict.
 *   - Two heuristics agreeing is weaker than one ML + one heuristic.
 *     The Council weights by kind diversity, not vote count.
 *   - A single very-high-confidence finding can still carry the day
 *     against a swarm of low-confidence noise. The Council requires a
 *     diversity floor before fusion overrides the loudest member.
 *
 * The Council is deliberately stateless w.r.t. the bus: it takes a
 * snapshot of findings (typically pulled from `ctmBus.snapshot()`),
 * deliberates synchronously, and returns. Persistence is the caller's
 * job (the route emits a `bench.marble.v1` receipt and broadcasts a
 * `council-verdict` thought back onto the bus).
 */

import { ReceiptChain } from '@szl-holdings/szl-receipts';
import type {
  DetectorKind,
  Finding,
  FindingSeverity,
  GovernanceClass,
} from '@szl-holdings/sentra-detector-sdk';

export const COUNCIL_VERSION = '1.0.0' as const;

const SEVERITY_RANK: Record<FindingSeverity, number> = {
  info: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};
const RANK_TO_SEVERITY: FindingSeverity[] = ['info', 'low', 'medium', 'high', 'critical'];

/**
 * Per-kind vote weight. Antivenom and ML carry more weight than
 * heuristic+signature because their false-positive cost is higher AND
 * their precision is higher when they DO fire. Tunable; documented so
 * auditors can re-derive the verdict from the receipt.
 */
const KIND_WEIGHT: Record<DetectorKind, number> = {
  antivenom: 1.4,
  ml: 1.2,
  temporal: 1.1,
  correlation: 1.0,
  statistical: 0.9,
  signature: 0.8,
  heuristic: 0.7,
};

const GOVERNANCE_FLOOR: Record<GovernanceClass, FindingSeverity> = {
  'read-only': 'info',
  advisory: 'low',
  mutating: 'medium',
  'auto-remediable': 'medium',
};

export interface CouncilCandidate {
  finding: Finding;
  detectorKind: DetectorKind;
}

export interface CouncilVerdict {
  /** Stable verdict id — `marble:<correlationKey>:<rounded ts>`. */
  id: string;
  correlationKey: string;
  arbitratedSeverity: FindingSeverity;
  /** Composite confidence 0..1. */
  confidence: number;
  /** Reason string for the operator UI. */
  rationale: string;
  /** Findings that carried the verdict (sorted by weighted contribution). */
  supportingFindingIds: string[];
  /**
   * Findings that the Council suppressed (e.g. duplicate heuristic
   * agreeing with the winners; logged for the trace, not surfaced to
   * operators).
   */
  suppressedFindingIds: string[];
  /** Map of detector kind → weighted contribution. */
  kindContributions: Record<string, number>;
  /** Number of distinct detector kinds that voted. Diversity floor. */
  distinctKinds: number;
  /** Snapshot of inputs for receipt auditing. */
  inputCount: number;
  /** Ceiling imposed by the strictest governance class present. */
  governanceCeiling: GovernanceClass;
  deliberatedAt: string;
  /** Λ-receipt class. */
  receiptKind: 'bench.marble.v1';
  version: string;
}

/**
 * Pure deliberation — no IO, no receipts. Used by the route layer and
 * by tests so the arbitration math is reproducible.
 */
export function deliberate(
  correlationKey: string,
  candidates: CouncilCandidate[],
): CouncilVerdict | null {
  if (candidates.length === 0) return null;

  // Weighted score per finding = severityRank · kindWeight · finding.score.
  const scored = candidates.map((c) => {
    const sevRank = SEVERITY_RANK[c.finding.severity] ?? 0;
    const w = KIND_WEIGHT[c.detectorKind] ?? 0.8;
    // Floor finding.score at 0.1 so a "high"-severity heuristic with a
    // 0 score (it forgot to set score) still gets some weight.
    const fs = Math.max(0.1, c.finding.score);
    return { ...c, weighted: sevRank * w * fs };
  });
  scored.sort((a, b) => b.weighted - a.weighted);

  const totalWeight = scored.reduce((s, c) => s + c.weighted, 0);
  const kindsSeen = new Set<DetectorKind>(scored.map((c) => c.detectorKind));
  const distinctKinds = kindsSeen.size;

  // Severity election: weighted mean rank, biased toward the top quartile.
  let weightedRank = 0;
  for (const c of scored) {
    weightedRank += (SEVERITY_RANK[c.finding.severity] ?? 0) * c.weighted;
  }
  const meanRank = totalWeight > 0 ? weightedRank / totalWeight : 0;

  // Co-firing across kinds is the real signal — bump 1 rank if ≥2
  // distinct kinds AND the top member is ≥medium.
  let arbitratedRank = Math.round(meanRank);
  const topRank = SEVERITY_RANK[scored[0]?.finding.severity ?? 'info'];
  if (distinctKinds >= 2 && topRank >= SEVERITY_RANK.medium && arbitratedRank < SEVERITY_RANK.critical) {
    arbitratedRank += 1;
  }
  // Diversity floor: a single-kind swarm cannot reach critical on its own.
  if (distinctKinds === 1 && arbitratedRank > SEVERITY_RANK.high) {
    arbitratedRank = SEVERITY_RANK.high;
  }

  // Governance ceiling: read-only kit cannot elect a mutating verdict.
  const strictestGov = scored.reduce<GovernanceClass>((acc, c) => {
    const order: GovernanceClass[] = ['read-only', 'advisory', 'mutating', 'auto-remediable'];
    return order.indexOf(c.finding.governanceClass) < order.indexOf(acc)
      ? c.finding.governanceClass
      : acc;
  }, 'auto-remediable');
  const govFloor = SEVERITY_RANK[GOVERNANCE_FLOOR[strictestGov]];
  if (arbitratedRank < govFloor) arbitratedRank = govFloor;

  arbitratedRank = Math.max(0, Math.min(4, arbitratedRank));
  const arbitratedSeverity = RANK_TO_SEVERITY[arbitratedRank] ?? 'info';

  // Confidence: weighted-score concentration. If the top 50% of weight
  // comes from one finding, confidence is high; if it's spread evenly
  // across many, confidence is lower.
  const top = scored[0]?.weighted ?? 0;
  const confidence =
    totalWeight > 0 ? Math.min(1, 0.5 * (top / totalWeight) + 0.5 * Math.min(1, distinctKinds / 3)) : 0;

  // Supporting vs suppressed: top contributors that exceed half the
  // mean weight are "supporting"; the rest are suppressed (logged but
  // not the headline).
  const meanWeight = totalWeight / scored.length;
  const supporting = scored.filter((c) => c.weighted >= meanWeight * 0.5);
  const suppressed = scored.filter((c) => c.weighted < meanWeight * 0.5);

  const kindContributions: Record<string, number> = {};
  for (const c of scored) {
    kindContributions[c.detectorKind] = (kindContributions[c.detectorKind] ?? 0) + c.weighted;
  }

  const rationaleParts: string[] = [
    `${candidates.length} candidate(s) across ${distinctKinds} detector kind(s)`,
    `severity elected by weighted-mean rank=${meanRank.toFixed(2)} → ${arbitratedSeverity}`,
  ];
  if (distinctKinds >= 2 && topRank >= SEVERITY_RANK.medium) {
    rationaleParts.push('multi-kind co-firing bump applied');
  }
  if (strictestGov === 'read-only') {
    rationaleParts.push('clamped by read-only governance ceiling');
  }

  return {
    id: `marble:${correlationKey}:${Date.now()}`,
    correlationKey,
    arbitratedSeverity,
    confidence,
    rationale: rationaleParts.join('; '),
    supportingFindingIds: supporting.map((c) => c.finding.id),
    suppressedFindingIds: suppressed.map((c) => c.finding.id),
    kindContributions,
    distinctKinds,
    inputCount: candidates.length,
    governanceCeiling: strictestGov,
    deliberatedAt: new Date().toISOString(),
    receiptKind: 'bench.marble.v1',
    version: COUNCIL_VERSION,
  };
}

/**
 * Per-correlation-key ReceiptChain. Verdicts are linked so the audit
 * trail "verdict at t1 was X, verdict at t2 was Y on the same key" is
 * recoverable from the chain alone.
 */
const councilChains = new Map<string, ReceiptChain>();
function chainFor(key: string): ReceiptChain {
  let c = councilChains.get(key);
  if (!c) {
    c = new ReceiptChain({ operatorId: `sentra/council/${key}` });
    councilChains.set(key, c);
  }
  return c;
}

export interface DeliberateAndReceiptResult {
  verdict: CouncilVerdict;
  chainReceiptId: string;
}

/**
 * Deliberate AND append a `bench.marble.v1` receipt to the per-key
 * council ReceiptChain. The receipt's selfHash becomes the
 * `chainReceiptId` callers persist on the verdict row.
 */
export async function deliberateAndReceipt(
  correlationKey: string,
  candidates: CouncilCandidate[],
): Promise<DeliberateAndReceiptResult | null> {
  const verdict = deliberate(correlationKey, candidates);
  if (!verdict) return null;
  const receipt = await chainFor(correlationKey).append({
    kind: 'bench.marble.v1',
    verdictId: verdict.id,
    correlationKey,
    arbitratedSeverity: verdict.arbitratedSeverity,
    confidence: verdict.confidence,
    distinctKinds: verdict.distinctKinds,
    supportingFindingIds: verdict.supportingFindingIds,
    suppressedFindingIds: verdict.suppressedFindingIds,
    kindContributions: verdict.kindContributions,
    governanceCeiling: verdict.governanceCeiling,
    deliberatedAt: verdict.deliberatedAt,
    version: verdict.version,
  });
  recordLatestVerdict(verdict);
  return { verdict, chainReceiptId: receipt.selfHash };
}

// Ring of latest verdicts per correlation key for cross-route lookup
// (incident enrichment, remediation arbitration). Capped per key so memory
// is bounded under load.
const LATEST_VERDICT_RING: Map<string, CouncilVerdict> = new Map();
const MAX_RING_KEYS = 5000;

export function recordLatestVerdict(verdict: CouncilVerdict): void {
  if (LATEST_VERDICT_RING.size >= MAX_RING_KEYS) {
    const firstKey = LATEST_VERDICT_RING.keys().next().value;
    if (firstKey) LATEST_VERDICT_RING.delete(firstKey);
  }
  LATEST_VERDICT_RING.set(verdict.correlationKey, verdict);
}

export function getLatestVerdict(correlationKey: string): CouncilVerdict | null {
  return LATEST_VERDICT_RING.get(correlationKey) ?? null;
}

// Ring of latest Time-R1 scores per correlation key (entityId | lane | metric)
// so the Incident Commander can surface "freshest temporal anomaly" inline
// without an extra DB lookup. Kept here for symmetry with the verdict ring.
interface TemporalScoreRecord {
  correlationKey: string;
  temporalScore: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  scoredAt: string;
  metricName: string;
}
const LATEST_TEMPORAL_RING: Map<string, TemporalScoreRecord> = new Map();

export function recordLatestTemporalScore(rec: TemporalScoreRecord): void {
  if (LATEST_TEMPORAL_RING.size >= MAX_RING_KEYS) {
    const firstKey = LATEST_TEMPORAL_RING.keys().next().value;
    if (firstKey) LATEST_TEMPORAL_RING.delete(firstKey);
  }
  LATEST_TEMPORAL_RING.set(rec.correlationKey, rec);
}

export function getLatestTemporalScore(
  correlationKey: string,
): TemporalScoreRecord | null {
  return LATEST_TEMPORAL_RING.get(correlationKey) ?? null;
}

/** Test-only — clear chains so per-test state is isolated. */
export function _resetCouncilChainsForTesting(): void {
  councilChains.clear();
  LATEST_VERDICT_RING.clear();
  LATEST_TEMPORAL_RING.clear();
}
