/**
 * Policy-Aware Passport Diff
 *
 * Structured diff of two passports that classifies each delta as:
 *   - 'regression'   — capability loss, policy weakening, higher cost/latency
 *   - 'neutral'      — cosmetic or metadata-only change
 *   - 'improvement'  — capability gain, policy strengthening, lower cost/latency
 *
 * Used in the Approval Queue when a passport supersedes an existing one.
 * Reviewers must acknowledge flagged regressions before approval is enabled.
 */

import type { ModelPassport, PassportPolicyEnvelope } from './types.js';

export type DiffClassification = 'regression' | 'neutral' | 'improvement';

export interface DiffEntry {
  field: string;
  section: string;
  classification: DiffClassification;
  from: unknown;
  to: unknown;
  description: string;
}

export interface PassportDiffResult {
  fromPassportId: string;
  toPassportId: string;
  diffedAt: string;
  regressions: DiffEntry[];
  improvements: DiffEntry[];
  neutral: DiffEntry[];
  all: DiffEntry[];
  hasRegressions: boolean;
  regressionAcknowledgementRequired: boolean;
  costDeltaPct: number | null;
  latencyP95DeltaPct: number | null;
  evalPassRateDelta: number | null;
}

const AUTONOMY_RANK: Record<string, number> = {
  read_only: 0, advisory: 1, supervised: 2, autonomous: 3,
};

const PII_RANK: Record<string, number> = {
  blocked: 0, redacted: 1, allowed: 2,
};

function classifyAutonomyChange(from: string, to: string): DiffClassification {
  const fromR = AUTONOMY_RANK[from] ?? 2;
  const toR = AUTONOMY_RANK[to] ?? 2;
  if (toR > fromR) return 'regression';
  if (toR < fromR) return 'improvement';
  return 'neutral';
}

function classifyPIIChange(from: string, to: string): DiffClassification {
  const fromR = PII_RANK[from] ?? 1;
  const toR = PII_RANK[to] ?? 1;
  if (toR > fromR) return 'regression';
  if (toR < fromR) return 'improvement';
  return 'neutral';
}

function classifyCostChange(from: number, to: number): DiffClassification {
  if (to > from * 1.05) return 'regression';
  if (to < from * 0.95) return 'improvement';
  return 'neutral';
}

function classifyLatencyChange(from: number, to: number): DiffClassification {
  if (to > from * 1.1) return 'regression';
  if (to < from * 0.9) return 'improvement';
  return 'neutral';
}

function classifyEvalChange(from: number, to: number): DiffClassification {
  if (to < from - 0.02) return 'regression';
  if (to > from + 0.02) return 'improvement';
  return 'neutral';
}

function diffPolicyEnvelopes(
  from: PassportPolicyEnvelope,
  to: PassportPolicyEnvelope,
): DiffEntry[] {
  const entries: DiffEntry[] = [];

  if (from.autonomyTier !== to.autonomyTier) {
    const cls = classifyAutonomyChange(from.autonomyTier, to.autonomyTier);
    entries.push({
      field: 'autonomyTier',
      section: 'Policy Envelope',
      classification: cls,
      from: from.autonomyTier,
      to: to.autonomyTier,
      description:
        cls === 'regression'
          ? `Autonomy increased: ${from.autonomyTier} → ${to.autonomyTier} (higher autonomy = less oversight)`
          : cls === 'improvement'
            ? `Autonomy tightened: ${from.autonomyTier} → ${to.autonomyTier}`
            : `Autonomy unchanged in rank`,
    });
  }

  if (from.piiHandling !== to.piiHandling) {
    const cls = classifyPIIChange(from.piiHandling, to.piiHandling);
    entries.push({
      field: 'piiHandling',
      section: 'Policy Envelope',
      classification: cls,
      from: from.piiHandling,
      to: to.piiHandling,
      description:
        cls === 'regression'
          ? `PII handling weakened: ${from.piiHandling} → ${to.piiHandling}`
          : cls === 'improvement'
            ? `PII handling tightened: ${from.piiHandling} → ${to.piiHandling}`
            : `PII handling unchanged`,
    });
  }

  const fromDomains = new Set(from.allowedDomains);
  const toDomains = new Set(to.allowedDomains);
  const added = to.allowedDomains.filter((d) => !fromDomains.has(d));
  const removed = from.allowedDomains.filter((d) => !toDomains.has(d));

  if (added.length > 0) {
    entries.push({
      field: 'allowedDomains.added',
      section: 'Policy Envelope',
      classification: 'regression',
      from: [],
      to: added,
      description: `Domains added (scope expansion): ${added.join(', ')}`,
    });
  }
  if (removed.length > 0) {
    entries.push({
      field: 'allowedDomains.removed',
      section: 'Policy Envelope',
      classification: 'improvement',
      from: removed,
      to: [],
      description: `Domains removed (scope reduction): ${removed.join(', ')}`,
    });
  }

  const fromBudget = from.maxBudgetUsdPerCall;
  const toBudget = to.maxBudgetUsdPerCall;
  if (fromBudget !== toBudget) {
    const cls =
      toBudget == null
        ? 'regression'
        : fromBudget == null
          ? 'neutral'
          : toBudget > fromBudget
            ? 'regression'
            : 'improvement';
    entries.push({
      field: 'maxBudgetUsdPerCall',
      section: 'Policy Envelope',
      classification: cls,
      from: fromBudget,
      to: toBudget,
      description:
        cls === 'regression'
          ? `Cost ceiling raised/removed: $${fromBudget} → $${toBudget ?? 'unlimited'}`
          : cls === 'improvement'
            ? `Cost ceiling lowered: $${fromBudget} → $${toBudget}`
            : `Cost ceiling changed`,
    });
  }

  return entries;
}

function diffCapabilities(from: ModelPassport, to: ModelPassport): DiffEntry[] {
  const entries: DiffEntry[] = [];

  const fromLanes = new Set(from.capabilitySurface.lanes);
  const toLanes = new Set(to.capabilitySurface.lanes);
  const addedLanes = to.capabilitySurface.lanes.filter((l) => !fromLanes.has(l));
  const removedLanes = from.capabilitySurface.lanes.filter((l) => !toLanes.has(l));

  if (addedLanes.length > 0) {
    entries.push({
      field: 'capabilitySurface.lanes.added',
      section: 'Capability Surface',
      classification: 'improvement',
      from: [],
      to: addedLanes,
      description: `Lanes added: ${addedLanes.join(', ')}`,
    });
  }
  if (removedLanes.length > 0) {
    entries.push({
      field: 'capabilitySurface.lanes.removed',
      section: 'Capability Surface',
      classification: 'regression',
      from: removedLanes,
      to: [],
      description: `Lanes removed (capability loss): ${removedLanes.join(', ')}`,
    });
  }

  return entries;
}

function diffCostProfile(from: ModelPassport, to: ModelPassport): DiffEntry[] {
  const entries: DiffEntry[] = [];
  const fc = from.costProfile;
  const tc = to.costProfile;

  if (Math.abs(fc.costPer1kTokensUsd - tc.costPer1kTokensUsd) > 0.00001) {
    const cls = classifyCostChange(fc.costPer1kTokensUsd, tc.costPer1kTokensUsd);
    entries.push({
      field: 'costProfile.costPer1kTokensUsd',
      section: 'Cost / Latency',
      classification: cls,
      from: fc.costPer1kTokensUsd,
      to: tc.costPer1kTokensUsd,
      description: `Cost per 1K tokens: $${fc.costPer1kTokensUsd} → $${tc.costPer1kTokensUsd}`,
    });
  }

  if (Math.abs(fc.p95LatencyMs - tc.p95LatencyMs) > 50) {
    const cls = classifyLatencyChange(fc.p95LatencyMs, tc.p95LatencyMs);
    entries.push({
      field: 'costProfile.p95LatencyMs',
      section: 'Cost / Latency',
      classification: cls,
      from: fc.p95LatencyMs,
      to: tc.p95LatencyMs,
      description: `P95 latency: ${fc.p95LatencyMs}ms → ${tc.p95LatencyMs}ms`,
    });
  }

  if (Math.abs(fc.evalPassRate - tc.evalPassRate) > 0.01) {
    const cls = classifyEvalChange(fc.evalPassRate, tc.evalPassRate);
    entries.push({
      field: 'costProfile.evalPassRate',
      section: 'Cost / Latency',
      classification: cls,
      from: fc.evalPassRate,
      to: tc.evalPassRate,
      description: `Eval pass rate: ${Math.round(fc.evalPassRate * 100)}% → ${Math.round(tc.evalPassRate * 100)}%`,
    });
  }

  return entries;
}

export function diffPassports(
  fromPassport: ModelPassport,
  toPassport: ModelPassport,
): PassportDiffResult {
  const all: DiffEntry[] = [
    ...diffCapabilities(fromPassport, toPassport),
    ...diffCostProfile(fromPassport, toPassport),
    ...diffPolicyEnvelopes(fromPassport.policyEnvelope, toPassport.policyEnvelope),
  ];

  if (fromPassport.quantProfile.tier !== toPassport.quantProfile.tier) {
    all.push({
      field: 'quantProfile.tier',
      section: 'Quant Profile',
      classification: 'neutral',
      from: fromPassport.quantProfile.tier,
      to: toPassport.quantProfile.tier,
      description: `Quant tier changed: ${fromPassport.quantProfile.tier} → ${toPassport.quantProfile.tier}`,
    });
  }

  const regressions = all.filter((e) => e.classification === 'regression');
  const improvements = all.filter((e) => e.classification === 'improvement');
  const neutral = all.filter((e) => e.classification === 'neutral');

  const fc = fromPassport.costProfile;
  const tc = toPassport.costProfile;

  const costDeltaPct =
    fc.costPer1kTokensUsd > 0
      ? ((tc.costPer1kTokensUsd - fc.costPer1kTokensUsd) / fc.costPer1kTokensUsd) * 100
      : null;

  const latencyP95DeltaPct =
    fc.p95LatencyMs > 0
      ? ((tc.p95LatencyMs - fc.p95LatencyMs) / fc.p95LatencyMs) * 100
      : null;

  const evalPassRateDelta = tc.evalPassRate - fc.evalPassRate;

  return {
    fromPassportId: fromPassport.identity.id,
    toPassportId: toPassport.identity.id,
    diffedAt: new Date().toISOString(),
    regressions,
    improvements,
    neutral,
    all,
    hasRegressions: regressions.length > 0,
    regressionAcknowledgementRequired: regressions.length > 0,
    costDeltaPct,
    latencyP95DeltaPct,
    evalPassRateDelta,
  };
}
