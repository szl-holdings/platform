/**
 * Recommendation Rendering — Cross-Product Proof-Chain Coverage
 *
 * Verifies that `createRecommendation()` produces a complete, correctly-shaped
 * Recommendation object for every product domain in the SZL Holdings platform.
 * "Rendering" here means: the full recommendation data structure that each
 * product surfaces to its users — the exact payload that travels from the
 * signal-mesh through the decision-engine and into the recommendation table.
 *
 * Covered domains / products:
 *   maritime      — SEXTANT Maritime Intelligence
 *   legal         — Counsel / Counsel Legal Matter Command
 *   security      — Sentra Cyber Resilience Command
 *   finance       — SZL Holdings Treasury / Pulse Executive Briefing
 *   real-estate   — DOMAINE Real Estate Intelligence
 *
 * For each domain this suite asserts:
 *   1. Recommendation object is created without throwing (schema validation)
 *   2. All 8 required proof-chain fields are present and non-empty
 *   3. policyEvaluation has the correct shape ({ outcome, policyIds })
 *   4. Numeric fields are within expected ranges (confidence 0–1, freshness 0–1)
 *   5. evidenceIds array is non-empty (grounding requirement)
 *   6. Tags identify the product domain
 */

import { describe, expect, it } from 'vitest';
import { type Recommendation, type RecommendationPolicyStatus, createRecommendation, RecommendationSchema } from './evidence.js';

// Minimal evidence ID stubs — the schema validates these are strings, not DB refs
const EV = (n: number) => `ev-test-${n.toString().padStart(3, '0')}`;
const POLICY_EVAL = { outcome: 'pending' as const, policyIds: [] };

function assertProofChain(rec: Recommendation, label: string) {
  // 1. The 8 required Gate 3 proof-chain fields
  expect(rec.evidenceIds, `${label}: evidenceIds missing`).toBeDefined();
  expect(rec.evidenceIds?.length, `${label}: evidenceIds must be non-empty`).toBeGreaterThan(0);

  expect(rec.confidence, `${label}: confidence missing`).toBeDefined();
  expect(rec.confidence, `${label}: confidence must be 0–1`).toBeGreaterThan(0);
  expect(rec.confidence, `${label}: confidence must be 0–1`).toBeLessThanOrEqual(1);

  expect(rec.freshness, `${label}: freshness missing`).toBeDefined();
  expect(rec.freshness, `${label}: freshness must be 0–1`).toBeGreaterThan(0);
  expect(rec.freshness, `${label}: freshness must be 0–1`).toBeLessThanOrEqual(1);

  expect(rec.rationale, `${label}: rationale missing`).toBeTruthy();
  expect(typeof rec.rationale, `${label}: rationale must be a string`).toBe('string');

  expect(rec.domain, `${label}: domain missing`).toBeTruthy();

  expect(rec.projectedImpact, `${label}: projectedImpact missing`).toBeTruthy();
  expect(typeof rec.projectedImpact, `${label}: projectedImpact must be a string`).toBe('string');

  expect(rec.projectedRisk, `${label}: projectedRisk missing`).toBeTruthy();
  expect(typeof rec.projectedRisk, `${label}: projectedRisk must be a string`).toBe('string');

  expect(rec.policyEvaluation, `${label}: policyEvaluation missing`).toBeDefined();
  const pe: RecommendationPolicyStatus = rec.policyEvaluation;
  expect(pe.outcome, `${label}: policyEvaluation.outcome missing`).toBeTruthy();
  expect(['allow', 'require-approval', 'block', 'pending']).toContain(pe.outcome);
}

// ---------------------------------------------------------------------------
// maritime — SEXTANT Maritime Intelligence
// ---------------------------------------------------------------------------

describe('recommendation rendering — maritime (SEXTANT)', () => {
  it('renders a complete vessel-reroute recommendation with all 8 proof-chain fields', () => {
    const rec = createRecommendation({
      domain: 'maritime',
      title: 'Reroute MV Soltana — OFAC corridor detected',
      summary:
        'AIS dark event correlated with OFAC-sanctioned port proximity. Reroute via Khor Fakkan.',
      rationale:
        "3-signal correlation: AIS dark event (74 min), OFAC match tier-2, port congestion spike. Confidence derived from Reuters sanctions feed and Lloyd's AIS feed convergence.",
      suggestedAction: 'execute',
      actionPayload: { vesselId: 'IMO-9234567', newRoute: 'khor-fakkan-bypass' },
      confidence: 0.92,
      freshness: 0.89,
      projectedImpact:
        'Reroute via Khor Fakkan avoids $185K/day demurrage and clears OFAC gate within 48 hours.',
      projectedRisk:
        'Without reroute, vessel enters sanctioned corridor — $3.2M cargo exposure and potential port detention.',
      policyEvaluation: POLICY_EVAL,
      evidenceIds: [EV(1), EV(2), EV(3)],
      signalIds: ['sig-ais-001', 'sig-ofac-002'],
      entityRefs: [],
      generatedBy: 'signal-pipeline/maritime-risk',
      provenance: { sourceService: 'test' },
      generatedAt: new Date().toISOString(),
      tags: ['maritime', 'ofac', 'vessels'],
    });

    assertProofChain(rec, 'maritime');
    expect(rec.domain).toBe('maritime');
    expect(rec.tags).toContain('maritime');
  });

  it('renders a vessel-hold recommendation with approval-required policy outcome', () => {
    const rec = createRecommendation({
      domain: 'maritime',
      title: 'Hold MV Albatross at Anchorage',
      summary: 'Port congestion spike — 38hr avg wait. Hold pending berth confirmation.',
      rationale:
        'Port congestion index at 82/100 with no berth ETA. Holding saves $185K/day demurrage.',
      suggestedAction: 'approve',
      actionPayload: { vesselId: 'IMO-9876543', action: 'hold' },
      confidence: 0.87,
      freshness: 0.94,
      projectedImpact: 'Holding MV Albatross saves $185K/day demurrage until berth is confirmed.',
      projectedRisk: 'Proceeding without berth confirmation risks $370K demurrage over 2-day wait.',
      policyEvaluation: { outcome: 'require-approval', policyIds: ['pol-maritime-high-value-001'] },
      evidenceIds: [EV(4), EV(5)],
      signalIds: [],
      entityRefs: [],
      generatedBy: 'signal-pipeline/maritime-ops',
      provenance: { sourceService: 'test' },
      generatedAt: new Date().toISOString(),
      tags: ['maritime', 'demurrage', 'vessels'],
    });

    assertProofChain(rec, 'maritime/hold');
    expect(rec.policyEvaluation.outcome).toBe('require-approval');
  });
});

// ---------------------------------------------------------------------------
// legal — Counsel / Counsel Legal Matter Command
// ---------------------------------------------------------------------------

describe('recommendation rendering — legal (Counsel / PRISM)', () => {
  it('renders a complete filing-deadline recommendation with all 8 proof-chain fields', () => {
    const rec = createRecommendation({
      domain: 'legal',
      title: 'File Discovery Response — Parallel Track',
      summary:
        'Discovery blockage + counsel lag detected 11 days before filing deadline. Parallel track required.',
      rationale:
        'Outside counsel performance index at 34/100 with discovery blockage. Court deadline in 11 days; single-track response has <20% completion probability.',
      suggestedAction: 'execute',
      actionPayload: { matterId: 'matter-lawsuit-001', track: 'parallel' },
      confidence: 0.94,
      freshness: 0.92,
      projectedImpact:
        'Parallel filing track eliminates deadline breach risk and preserves $4.1M litigation position.',
      projectedRisk:
        'Without parallel track, single-track discovery yields <20% completion — $4.1M exposure crystallises on missed deadline.',
      policyEvaluation: POLICY_EVAL,
      evidenceIds: [EV(6), EV(7), EV(8)],
      signalIds: ['sig-deadline-001'],
      entityRefs: [],
      generatedBy: 'signal-pipeline/legal-risk',
      provenance: { sourceService: 'test' },
      generatedAt: new Date().toISOString(),
      tags: ['legal', 'counsel', 'deadline'],
    });

    assertProofChain(rec, 'legal');
    expect(rec.domain).toBe('legal');
    expect(rec.tags).toContain('counsel');
  });
});

// ---------------------------------------------------------------------------
// security — Sentra Cyber Resilience Command
// ---------------------------------------------------------------------------

describe('recommendation rendering — security (PARAGON)', () => {
  it('renders a complete ransomware-isolation recommendation with all 8 proof-chain fields', () => {
    const rec = createRecommendation({
      domain: 'security',
      title: 'Isolate SCADA + HMI OT Network Segment',
      summary:
        'Ransomware lateral movement detected across 3 OT assets. Immediate isolation required.',
      rationale:
        'CrowdStrike telemetry shows ransomware footprint on SCADA, HMI, and PLC. Lateral movement velocity: 4 assets/hr. OT network exposure window: <4 hours.',
      suggestedAction: 'execute',
      actionPayload: { segmentIds: ['scada-001', 'hmi-001', 'plc-001'] },
      confidence: 0.91,
      freshness: 0.96,
      projectedImpact:
        'Isolation contains ransomware spread, preserving $2.8M cost-avoidance and maintaining production continuity.',
      projectedRisk:
        'Without isolation, SCADA breach containment fails within 4 hours — $2.8M downtime and potential multi-site OT shutdown.',
      policyEvaluation: POLICY_EVAL,
      evidenceIds: [EV(9), EV(10), EV(11)],
      signalIds: ['sig-ransomware-001'],
      entityRefs: [],
      generatedBy: 'sentra-resilience-orchestrator',
      provenance: { sourceService: 'test' },
      generatedAt: new Date().toISOString(),
      tags: ['security', 'sentra', 'ransomware', 'ot'],
    });

    assertProofChain(rec, 'security');
    expect(rec.domain).toBe('security');
    expect(rec.tags).toContain('sentra');
  });
});

// ---------------------------------------------------------------------------
// finance — SZL Holdings Treasury / Pulse
// ---------------------------------------------------------------------------

describe('recommendation rendering — finance (SZL Treasury / Pulse)', () => {
  it('renders a treasury hedge recommendation with all 8 proof-chain fields', () => {
    const rec = createRecommendation({
      domain: 'finance',
      title: 'Hedge USD/GBP Exposure — Forward Contract',
      summary: 'FX exposure spike detected: $2.1M USD/GBP unhedged. Forward contract recommended.',
      rationale:
        'GBP/USD volatility at 85th percentile. Unhedged position of $2.1M at risk of 12% adverse move over 30-day window. Alpaca macro signals confirm trend.',
      suggestedAction: 'approve',
      actionPayload: { instrument: 'USD/GBP-forward-30d', notional: 2_100_000 },
      confidence: 0.88,
      freshness: 0.91,
      projectedImpact:
        '30-day forward contract locks $2.1M at current rate, eliminating adverse FX exposure.',
      projectedRisk:
        'Without hedge, a 12% adverse GBP move crystallises $252K loss on unhedged position.',
      policyEvaluation: POLICY_EVAL,
      evidenceIds: [EV(12), EV(13)],
      signalIds: ['sig-fx-001'],
      entityRefs: [],
      generatedBy: 'signal-pipeline/treasury',
      provenance: { sourceService: 'test' },
      generatedAt: new Date().toISOString(),
      tags: ['finance', 'treasury', 'fx-hedge'],
    });

    assertProofChain(rec, 'finance');
    expect(rec.domain).toBe('finance');
  });
});

// ---------------------------------------------------------------------------
// real-estate — DOMAINE Real Estate Intelligence
// ---------------------------------------------------------------------------

describe('recommendation rendering — real-estate (DOMAINE)', () => {
  it('renders a property acquisition recommendation with all 8 proof-chain fields', () => {
    const rec = createRecommendation({
      domain: 'real-estate',
      title: 'Accelerate Acquisition — 1430 Industrial Parkway',
      summary:
        'Competing bid detected. Accelerate acquisition timeline to secure asset before deadline.',
      rationale:
        'PropertyRadar data indicates competing LOI submitted 2 days ago. Cap rate at 6.8% — 40bps above comparable comps. LinkedIn signals confirm seller motivation.',
      suggestedAction: 'approve',
      actionPayload: { propertyId: 'prop-1430-industrial', targetCloseDate: '2026-05-01' },
      confidence: 0.85,
      freshness: 0.88,
      projectedImpact:
        'Accelerating acquisition locks 6.8% cap rate asset — $480K projected annual NOI on $7.1M purchase price.',
      projectedRisk:
        'Delay risks competing bid prevailing — $480K/yr NOI opportunity lost and replacement asset at lower cap rate.',
      policyEvaluation: POLICY_EVAL,
      evidenceIds: [EV(14), EV(15)],
      signalIds: ['sig-property-001'],
      entityRefs: [],
      generatedBy: 'signal-pipeline/real-estate',
      provenance: { sourceService: 'test' },
      generatedAt: new Date().toISOString(),
      tags: ['real-estate', 'terra', 'acquisition'],
    });

    assertProofChain(rec, 'real-estate');
    expect(rec.domain).toBe('real-estate');
    expect(rec.tags).toContain('terra');
  });
});

// ---------------------------------------------------------------------------
// Cross-product schema invariants
// ---------------------------------------------------------------------------

describe('recommendation rendering — cross-product schema invariants', () => {
  const ALL_DOMAINS = ['maritime', 'legal', 'security', 'finance', 'real-estate'] as const;

  it.each(
    ALL_DOMAINS,
  )("domain '%s' produces a recommendation with a unique recommendationId", (domain) => {
    const rec = createRecommendation({
      domain,
      title: `Test recommendation for ${domain}`,
      summary: `Schema validation for ${domain} recommendation rendering.`,
      rationale: `Signal detected in ${domain} domain. Action required.`,
      suggestedAction: 'monitor',
      actionPayload: {},
      confidence: 0.8,
      freshness: 0.8,
      projectedImpact: `Taking action in ${domain} reduces exposure and improves outcomes.`,
      projectedRisk: `Without action, ${domain} exposure remains unresolved and escalates.`,
      policyEvaluation: POLICY_EVAL,
      evidenceIds: [EV(99)],
      signalIds: [],
      entityRefs: [],
      generatedBy: `test-renderer/${domain}`,
      provenance: { sourceService: 'test' },
      generatedAt: new Date().toISOString(),
    });

    expect(rec.recommendationId, `${domain}: recommendationId must be set`).toBeTruthy();
    expect(typeof rec.recommendationId).toBe('string');
    assertProofChain(rec, domain);
    expect(rec.domain).toBe(domain);
  });

  it('block policyEvaluation outcome is accepted without throwing', () => {
    const rec = createRecommendation({
      domain: 'maritime',
      title: 'Blocked action',
      summary: 'Policy blocked this action.',
      rationale: 'OFAC sanctions policy blocks this route.',
      suggestedAction: 'dismiss',
      actionPayload: {},
      confidence: 0.99,
      freshness: 0.99,
      projectedImpact: 'N/A — action blocked by policy.',
      projectedRisk: 'Attempting blocked action would violate OFAC sanctions.',
      policyEvaluation: { outcome: 'block', policyIds: ['pol-ofac-001'] },
      evidenceIds: [EV(99)],
      signalIds: [],
      entityRefs: [],
      generatedBy: 'policy-engine/block',
      provenance: { sourceService: 'test' },
      generatedAt: new Date().toISOString(),
    });

    expect(rec.policyEvaluation.outcome).toBe('block');
    assertProofChain(rec, 'maritime/blocked');
  });
});

// ---------------------------------------------------------------------------
// 6. Schema boundary — non-factory object literals rejected at ingestion point
// ---------------------------------------------------------------------------
// These tests verify that raw object literals (bypassing createRecommendation)
// are rejected by RecommendationSchema.safeParse(), closing the ingestion/
// serialization adapter bypass class identified in the CI review.

describe('RecommendationSchema — non-factory literal rejection', () => {
  it('rejects an empty object literal — no silent fallback for non-factory construction', () => {
    const result = RecommendationSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects a partial object missing evidenceIds and policyEvaluation', () => {
    const result = RecommendationSchema.safeParse({
      domain: 'maritime',
      title: 'Route risk detected',
      confidence: 0.85,
    });
    expect(result.success).toBe(false);
  });

  it('rejects an object missing confidence (required proof-chain field)', () => {
    const result = RecommendationSchema.safeParse({
      domain: 'maritime',
      title: 'T',
      rationale: 'R',
      projectedImpact: 'I',
      projectedRisk: 'Risk',
      policyEvaluation: { outcome: 'pending' },
      evidenceIds: ['ev-001'],
      freshness: 0.9,
      generatedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });

  it('accepts a fully-formed object satisfying all required schema fields', () => {
    const compliant = {
      recommendationId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      domain: 'maritime',
      title: 'Schema boundary pass',
      summary: 'All required schema fields are present.',
      rationale: 'All required fields present.',
      suggestedAction: 'acknowledge',
      confidence: 0.88,
      freshness: 0.9,
      projectedImpact: 'Positive if accepted.',
      projectedRisk: 'Risk if dismissed.',
      policyEvaluation: { outcome: 'pending' as const, policyIds: [] },
      evidenceIds: ['ev-schema-001'],
      generatedAt: new Date().toISOString(),
    };
    const result = RecommendationSchema.safeParse(compliant);
    expect(result.success).toBe(true);
  });
});
