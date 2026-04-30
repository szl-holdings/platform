/**
 * A11oy Forge — Governed Self-Evolution Runtime API
 *
 * Provides the data layer for the Forge Evolution Dashboard:
 *   GET  /alloy-forge/status                   — runtime health & generation summary
 *   GET  /alloy-forge/evolution-rounds          — active + recent evolution rounds
 *   GET  /alloy-forge/arena                     — competition arena: variant results
 *   GET  /alloy-forge/proof-ledger              — immutable evolution proof ledger
 *   GET  /alloy-forge/cross-domain              — cross-domain amplification proposals
 *   GET  /alloy-forge/drift-alerts              — anti-drift guardian alerts
 *   GET  /alloy-forge/timeline                  — agent evolution timeline
 *   POST /alloy-forge/rounds/:id/approve        — approve a pending evolution change
 *   POST /alloy-forge/rounds/:id/reject         — reject a pending evolution change
 */

import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

const now = () => Date.now();
const ago = (ms: number) => now() - ms;

// ─── Simulated state generators ──────────────────────────────────────────────

function buildForgeStatus() {
  return {
    generationCount: 47,
    cumulativeGain: 0.312,
    activeRounds: 3,
    pendingApprovals: 2,
    driftAlerts: 1,
    crossDomainProposals: 4,
    lastEvolutionAt: new Date(ago(23 * 60 * 1000)).toISOString(),
    overallHealth: 'healthy' as const,
    agents: [
      { agentId: 'vessels-risk-v3', domain: 'vessels', generation: 14, gainVsBaseline: 0.28, lastEvolvedAt: new Date(ago(2 * 60 * 60 * 1000)).toISOString() },
      { agentId: 'terra-intel-v2', domain: 'terra', generation: 11, gainVsBaseline: 0.34, lastEvolvedAt: new Date(ago(5 * 60 * 60 * 1000)).toISOString() },
      { agentId: 'sentra-threat-v4', domain: 'sentra', generation: 9, gainVsBaseline: 0.19, lastEvolvedAt: new Date(ago(8 * 60 * 60 * 1000)).toISOString() },
      { agentId: 'counsel-risk-v2', domain: 'counsel', generation: 7, gainVsBaseline: 0.41, lastEvolvedAt: new Date(ago(12 * 60 * 60 * 1000)).toISOString() },
      { agentId: 'szl-oracle-v1', domain: 'szl-holdings', generation: 6, gainVsBaseline: 0.22, lastEvolvedAt: new Date(ago(18 * 60 * 60 * 1000)).toISOString() },
    ],
  };
}

function buildEvolutionRounds() {
  return [
    {
      roundId: 'round-047',
      agentId: 'vessels-risk-v3',
      domain: 'vessels',
      generation: 14,
      status: 'running' as const,
      riskTier: 'low' as const,
      evolutionType: 'prompt_refinement' as const,
      governanceGate: 'auto_apply' as const,
      startedAt: new Date(ago(18 * 60 * 1000)).toISOString(),
      estimatedCompletionAt: new Date(now() + 7 * 60 * 1000).toISOString(),
      variants: 5,
      variantsEvaluated: 4,
      bestVariantScore: 0.893,
      baselineScore: 0.841,
      improvement: 0.052,
      description: 'Refining vessel risk scoring prompt for Southeast Asia route patterns — adjusting context window and chain-of-thought template.',
      proofPacketId: null,
    },
    {
      roundId: 'round-046',
      agentId: 'counsel-risk-v2',
      domain: 'counsel',
      generation: 7,
      status: 'pending_approval' as const,
      riskTier: 'medium' as const,
      evolutionType: 'tool_selection' as const,
      governanceGate: 'single_approval' as const,
      startedAt: new Date(ago(2 * 60 * 60 * 1000)).toISOString(),
      completedAt: new Date(ago(45 * 60 * 1000)).toISOString(),
      variants: 4,
      variantsEvaluated: 4,
      bestVariantScore: 0.912,
      baselineScore: 0.867,
      improvement: 0.045,
      description: 'Counsel agent proposing addition of jurisdiction-specific case law retrieval tool — increases accuracy on multi-jurisdiction matters by 4.5%.',
      proofPacketId: 'proof-ev-046',
      pendingApprover: 'operator',
    },
    {
      roundId: 'round-045',
      agentId: 'terra-intel-v2',
      domain: 'terra',
      generation: 11,
      status: 'pending_approval' as const,
      riskTier: 'high' as const,
      evolutionType: 'autonomy_level' as const,
      governanceGate: 'dual_approval' as const,
      startedAt: new Date(ago(5 * 60 * 60 * 1000)).toISOString(),
      completedAt: new Date(ago(3 * 60 * 60 * 1000)).toISOString(),
      variants: 3,
      variantsEvaluated: 3,
      bestVariantScore: 0.941,
      baselineScore: 0.887,
      improvement: 0.054,
      description: 'Terra intelligence agent requesting tier upgrade: autonomous-reversible → autonomous-irreversible for property valuation workflows. Dual executive + operator approval required.',
      proofPacketId: 'proof-ev-045',
      pendingApprover: 'executive',
    },
    {
      roundId: 'round-044',
      agentId: 'sentra-threat-v4',
      domain: 'sentra',
      generation: 9,
      status: 'completed' as const,
      riskTier: 'low' as const,
      evolutionType: 'routing_weights' as const,
      governanceGate: 'single_approval' as const,
      startedAt: new Date(ago(8 * 60 * 60 * 1000)).toISOString(),
      completedAt: new Date(ago(6 * 60 * 60 * 1000)).toISOString(),
      variants: 6,
      variantsEvaluated: 6,
      bestVariantScore: 0.877,
      baselineScore: 0.831,
      improvement: 0.046,
      appliedAt: new Date(ago(5 * 60 * 60 * 1000)).toISOString(),
      description: 'Adjusted threat classification routing weights — APT detection path now weighted 0.73 (was 0.61). Approved and applied.',
      proofPacketId: 'proof-ev-044',
    },
    {
      roundId: 'round-043',
      agentId: 'szl-oracle-v1',
      domain: 'szl-holdings',
      generation: 6,
      status: 'completed' as const,
      riskTier: 'low' as const,
      evolutionType: 'prompt_refinement' as const,
      governanceGate: 'auto_apply' as const,
      startedAt: new Date(ago(18 * 60 * 60 * 1000)).toISOString(),
      completedAt: new Date(ago(16 * 60 * 60 * 1000)).toISOString(),
      variants: 4,
      variantsEvaluated: 4,
      bestVariantScore: 0.856,
      baselineScore: 0.824,
      improvement: 0.032,
      appliedAt: new Date(ago(16 * 60 * 60 * 1000)).toISOString(),
      description: 'LP sentiment synthesis prompt refined — improved extraction of risk sentiment from unstructured LP meeting notes.',
      proofPacketId: 'proof-ev-043',
    },
  ];
}

function buildArena() {
  return {
    activeCompetitions: [
      {
        competitionId: 'comp-r047',
        roundId: 'round-047',
        agentId: 'vessels-risk-v3',
        domain: 'vessels',
        baselineVariant: {
          variantId: 'base-vessels-v13',
          label: 'Baseline (Gen 13)',
          accuracy: 0.841,
          latencyMs: 312,
          costPerDecision: 0.0032,
          userSatisfaction: 0.78,
          hallucinationRate: 0.031,
          composite: 0.823,
        },
        challengerVariants: [
          {
            variantId: 'var-v14-a',
            label: 'Variant A — Extended CoT',
            accuracy: 0.893,
            latencyMs: 428,
            costPerDecision: 0.0048,
            userSatisfaction: 0.81,
            hallucinationRate: 0.022,
            composite: 0.862,
            status: 'leading' as const,
          },
          {
            variantId: 'var-v14-b',
            label: 'Variant B — Compressed Template',
            accuracy: 0.867,
            latencyMs: 298,
            costPerDecision: 0.0029,
            userSatisfaction: 0.79,
            hallucinationRate: 0.028,
            composite: 0.851,
            status: 'evaluated' as const,
          },
          {
            variantId: 'var-v14-c',
            label: 'Variant C — Region-Specific Context',
            accuracy: 0.882,
            latencyMs: 381,
            costPerDecision: 0.0041,
            userSatisfaction: 0.83,
            hallucinationRate: 0.024,
            composite: 0.856,
            status: 'evaluated' as const,
          },
          {
            variantId: 'var-v14-d',
            label: 'Variant D — Minimal Prompt',
            accuracy: 0.814,
            latencyMs: 201,
            costPerDecision: 0.0021,
            userSatisfaction: 0.74,
            hallucinationRate: 0.041,
            composite: 0.802,
            status: 'eliminated' as const,
          },
          {
            variantId: 'var-v14-e',
            label: 'Variant E — Multi-Pass Verification',
            accuracy: null,
            latencyMs: null,
            costPerDecision: null,
            userSatisfaction: null,
            hallucinationRate: null,
            composite: null,
            status: 'running' as const,
          },
        ],
        statisticalSignificance: 0.92,
        sampleSize: 847,
        startedAt: new Date(ago(18 * 60 * 1000)).toISOString(),
      },
    ],
    recentResults: [
      {
        competitionId: 'comp-r044',
        roundId: 'round-044',
        agentId: 'sentra-threat-v4',
        domain: 'sentra',
        winner: 'var-s9-a',
        winnerLabel: 'APT Routing Weight Adjustment',
        baselineComposite: 0.831,
        winnerComposite: 0.877,
        gain: 0.046,
        completedAt: new Date(ago(6 * 60 * 60 * 1000)).toISOString(),
      },
      {
        competitionId: 'comp-r043',
        roundId: 'round-043',
        agentId: 'szl-oracle-v1',
        domain: 'szl-holdings',
        winner: 'var-o6-b',
        winnerLabel: 'LP Sentiment Extraction Refinement',
        baselineComposite: 0.824,
        winnerComposite: 0.856,
        gain: 0.032,
        completedAt: new Date(ago(16 * 60 * 60 * 1000)).toISOString(),
      },
    ],
  };
}

function buildProofLedger() {
  return [
    {
      proofId: 'proof-ev-046',
      roundId: 'round-046',
      agentId: 'counsel-risk-v2',
      domain: 'counsel',
      generation: 7,
      evolutionType: 'tool_selection',
      parentStrategyHash: 'a3f8c2d91e4b7a06',
      mutationDescription: 'Added jurisdiction-specific case law retrieval tool to counsel agent tool chain.',
      scoresBefore: { accuracy: 0.867, latency: 342, cost: 0.0041, satisfaction: 0.79 },
      scoresAfter: { accuracy: 0.912, latency: 398, cost: 0.0053, satisfaction: 0.84 },
      governanceGate: 'single_approval',
      gateDecision: 'pending',
      gateDecisionAt: null,
      approver: null,
      proofTimestamp: new Date(ago(45 * 60 * 1000)).toISOString(),
      learningDataRef: 'dataset-counsel-multijurisdiction-q1-2026',
      immutableHash: 'sha256:b7e3f1d9a4c28e5f09b1a6d2c7e4f8a3',
    },
    {
      proofId: 'proof-ev-045',
      roundId: 'round-045',
      agentId: 'terra-intel-v2',
      domain: 'terra',
      generation: 11,
      evolutionType: 'autonomy_level',
      parentStrategyHash: 'f2e7b9d41c3a8e06',
      mutationDescription: 'Proposed tier promotion from autonomous-reversible to autonomous-irreversible for property valuation workflow automation.',
      scoresBefore: { accuracy: 0.887, latency: 287, cost: 0.0038, satisfaction: 0.81 },
      scoresAfter: { accuracy: 0.941, latency: 291, cost: 0.0039, satisfaction: 0.88 },
      governanceGate: 'dual_approval',
      gateDecision: 'pending',
      gateDecisionAt: null,
      approver: null,
      proofTimestamp: new Date(ago(3 * 60 * 60 * 1000)).toISOString(),
      learningDataRef: 'dataset-terra-property-q4-2025-q1-2026',
      immutableHash: 'sha256:c9a4e2f7b1d83c6e05a2b9d4f7e1c3a8',
    },
    {
      proofId: 'proof-ev-044',
      roundId: 'round-044',
      agentId: 'sentra-threat-v4',
      domain: 'sentra',
      generation: 9,
      evolutionType: 'routing_weights',
      parentStrategyHash: 'd1b4e8c23f7a9e04',
      mutationDescription: 'APT detection routing weight adjusted from 0.61 to 0.73. Evaluated against 1,247 historical threat events.',
      scoresBefore: { accuracy: 0.831, latency: 218, cost: 0.0027, satisfaction: 0.76 },
      scoresAfter: { accuracy: 0.877, latency: 223, cost: 0.0028, satisfaction: 0.81 },
      governanceGate: 'single_approval',
      gateDecision: 'approved',
      gateDecisionAt: new Date(ago(5 * 60 * 60 * 1000)).toISOString(),
      approver: 'ops-admin',
      proofTimestamp: new Date(ago(6 * 60 * 60 * 1000)).toISOString(),
      learningDataRef: 'dataset-sentra-threat-history-2025',
      immutableHash: 'sha256:e8f2a1c4d7b3e9f0a6c1d4b7e2f5a8c3',
    },
    {
      proofId: 'proof-ev-043',
      roundId: 'round-043',
      agentId: 'szl-oracle-v1',
      domain: 'szl-holdings',
      generation: 6,
      evolutionType: 'prompt_refinement',
      parentStrategyHash: 'c8a3f7e21b4d9e03',
      mutationDescription: 'LP sentiment extraction template updated — refined entity extraction for risk-negative sentiment from meeting transcripts.',
      scoresBefore: { accuracy: 0.824, latency: 412, cost: 0.0044, satisfaction: 0.77 },
      scoresAfter: { accuracy: 0.856, latency: 409, cost: 0.0044, satisfaction: 0.80 },
      governanceGate: 'auto_apply',
      gateDecision: 'auto_approved',
      gateDecisionAt: new Date(ago(16 * 60 * 60 * 1000)).toISOString(),
      approver: 'system:guardian',
      proofTimestamp: new Date(ago(16 * 60 * 60 * 1000)).toISOString(),
      learningDataRef: 'dataset-lp-transcripts-2025-q4',
      immutableHash: 'sha256:a2d5f8b1e4c7a0d3b6e9f2c5a8d1b4e7',
    },
  ];
}

function buildCrossDomainProposals() {
  return [
    {
      proposalId: 'xdomain-001',
      sourceAgentId: 'vessels-risk-v3',
      sourceDomain: 'vessels',
      targetDomains: ['terra', 'szl-holdings'],
      strategyPattern: 'Multi-factor risk scoring with temporal decay weighting',
      description: 'Vessels agent discovered that applying temporal decay weighting to recent adverse events (last 90 days weighted 2× over 6-month window) improved risk score accuracy by 5.2%. Evaluation suggests this pattern is applicable to Terra property distress scoring and SZL portfolio risk signals.',
      sourceGain: 0.052,
      terraProjectedGain: 0.038,
      szlProjectedGain: 0.029,
      domainIsolationRisk: 'low' as const,
      status: 'under_evaluation' as const,
      proposedAt: new Date(ago(4 * 60 * 60 * 1000)).toISOString(),
      evaluationCompletesAt: new Date(now() + 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      proposalId: 'xdomain-002',
      sourceAgentId: 'counsel-risk-v2',
      sourceDomain: 'counsel',
      targetDomains: ['sentra'],
      strategyPattern: 'Jurisdiction-aware context framing with escalation pre-classification',
      description: 'Counsel agent\'s jurisdiction-aware framing technique — injecting regulatory jurisdiction metadata before analysis — shows promise for Sentra\'s compliance boundary detection. Projected 3.1% accuracy improvement for cross-border incident classification.',
      sourceGain: 0.045,
      sentraProjectedGain: 0.031,
      domainIsolationRisk: 'medium' as const,
      status: 'proposed' as const,
      proposedAt: new Date(ago(1 * 60 * 60 * 1000)).toISOString(),
      evaluationCompletesAt: null,
      isolationNote: 'Legal privilege boundaries require validation before Counsel strategies are shared with Sentra. Domain isolation policy review required.',
    },
    {
      proposalId: 'xdomain-003',
      sourceAgentId: 'terra-intel-v2',
      sourceDomain: 'terra',
      targetDomains: ['vessels'],
      strategyPattern: 'Multi-source corroboration with dissent flagging',
      description: 'Terra\'s multi-source property intelligence corroboration pattern (requiring 3+ source agreement before high-confidence assertion) may improve Vessels freight valuation accuracy by requiring corroboration from port authority data, satellite AIS, and broker feeds.',
      sourceGain: 0.054,
      vesselsProjectedGain: 0.041,
      domainIsolationRisk: 'low' as const,
      status: 'approved_for_test' as const,
      proposedAt: new Date(ago(6 * 60 * 60 * 1000)).toISOString(),
      evaluationCompletesAt: new Date(now() + 18 * 60 * 60 * 1000).toISOString(),
    },
    {
      proposalId: 'xdomain-004',
      sourceAgentId: 'sentra-threat-v4',
      sourceDomain: 'sentra',
      targetDomains: ['vessels', 'terra'],
      strategyPattern: 'Threat actor attribution with asset-risk propagation',
      description: 'Sentra\'s threat propagation model (mapping threat actor to affected asset classes) adapted for maritime cyber risk and construction supply chain disruption. Evaluation sandbox shows 2.8% improvement in cross-domain risk alerting.',
      sourceGain: 0.046,
      vesselsProjectedGain: 0.028,
      terraProjectedGain: 0.021,
      domainIsolationRisk: 'low' as const,
      status: 'rejected' as const,
      rejectionReason: 'Threat actor attribution data classified — cannot share threat actor entity graph with non-security domain agents. Generalized pattern only may proceed.',
      proposedAt: new Date(ago(12 * 60 * 60 * 1000)).toISOString(),
    },
  ];
}

function buildDriftAlerts() {
  return [
    {
      alertId: 'drift-001',
      agentId: 'terra-intel-v2',
      domain: 'terra',
      alertType: 'scope_expansion' as const,
      severity: 'medium' as const,
      description: 'Terra intelligence agent evolution round 45 proposes expanding scope beyond defined property valuation domain into mortgage origination recommendations. Scope certificate would be violated.',
      detectedAt: new Date(ago(3 * 60 * 60 * 1000)).toISOString(),
      evolutionRoundId: 'round-045',
      affectedConstraints: ['scope_certificate', 'domain_boundary'],
      guardianDecision: 'flagged_for_review' as const,
      status: 'active' as const,
    },
    {
      alertId: 'drift-002',
      agentId: 'vessels-risk-v3',
      domain: 'vessels',
      alertType: 'confidence_inflation' as const,
      severity: 'low' as const,
      description: 'Variant B in current Vessels evolution round shows confidence scores 8% higher than ground truth validation data suggests. Potential reward hacking detected — variant rewards high-confidence assertions even when accuracy does not support it.',
      detectedAt: new Date(ago(14 * 60 * 1000)).toISOString(),
      evolutionRoundId: 'round-047',
      affectedConstraints: ['calibration_constraint'],
      guardianDecision: 'variant_eliminated' as const,
      status: 'resolved' as const,
      resolvedAt: new Date(ago(12 * 60 * 1000)).toISOString(),
      resolutionNote: 'Variant D eliminated from competition. Anti-drift guardian auto-removed calibration-violating variant.',
    },
    {
      alertId: 'drift-003',
      agentId: 'counsel-risk-v2',
      domain: 'counsel',
      alertType: 'brand_voice_deviation' as const,
      severity: 'low' as const,
      description: 'Counsel agent prompt variant C produces responses with formal legal citation style inconsistent with A11oy brand voice guidelines. Flagged for human review before any approval.',
      detectedAt: new Date(ago(50 * 60 * 1000)).toISOString(),
      evolutionRoundId: 'round-046',
      affectedConstraints: ['brand_voice_policy'],
      guardianDecision: 'noted_for_approval_reviewer' as const,
      status: 'active' as const,
    },
  ];
}

function buildTimeline(agentId?: string) {
  const allEvents = [
    { agentId: 'vessels-risk-v3', domain: 'vessels', generation: 1, eventType: 'genesis', description: 'Agent created with base maritime risk scoring strategy', timestamp: new Date(ago(90 * 24 * 60 * 60 * 1000)).toISOString(), scoreBefore: null, scoreAfter: 0.721, roundId: null },
    { agentId: 'vessels-risk-v3', domain: 'vessels', generation: 5, eventType: 'evolution_applied', description: 'Prompt refinement: added weather pattern context injection. +4.2% accuracy.', timestamp: new Date(ago(60 * 24 * 60 * 60 * 1000)).toISOString(), scoreBefore: 0.756, scoreAfter: 0.798, roundId: 'round-031' },
    { agentId: 'vessels-risk-v3', domain: 'vessels', generation: 9, eventType: 'evolution_applied', description: 'Tool chain: added real-time AIS feed integration. Routing weight shift approved.', timestamp: new Date(ago(30 * 24 * 60 * 60 * 1000)).toISOString(), scoreBefore: 0.798, scoreAfter: 0.831, roundId: 'round-038' },
    { agentId: 'vessels-risk-v3', domain: 'vessels', generation: 13, eventType: 'evolution_applied', description: 'Cross-domain amplification from Terra: temporal decay weighting applied.', timestamp: new Date(ago(10 * 24 * 60 * 60 * 1000)).toISOString(), scoreBefore: 0.831, scoreAfter: 0.841, roundId: 'round-042' },
    { agentId: 'vessels-risk-v3', domain: 'vessels', generation: 14, eventType: 'evolution_running', description: 'Round 047 running: SEA route pattern refinement with 5 challenger variants.', timestamp: new Date(ago(18 * 60 * 1000)).toISOString(), scoreBefore: 0.841, scoreAfter: null, roundId: 'round-047' },

    { agentId: 'terra-intel-v2', domain: 'terra', generation: 1, eventType: 'genesis', description: 'Terra property intelligence agent initialized', timestamp: new Date(ago(85 * 24 * 60 * 60 * 1000)).toISOString(), scoreBefore: null, scoreAfter: 0.741, roundId: null },
    { agentId: 'terra-intel-v2', domain: 'terra', generation: 6, eventType: 'evolution_applied', description: 'Multi-source corroboration pattern introduced. Hallucination rate -18%.', timestamp: new Date(ago(45 * 24 * 60 * 60 * 1000)).toISOString(), scoreBefore: 0.791, scoreAfter: 0.834, roundId: 'round-027' },
    { agentId: 'terra-intel-v2', domain: 'terra', generation: 11, eventType: 'pending_approval', description: 'Tier upgrade proposed: autonomous-reversible → autonomous-irreversible. Dual approval required.', timestamp: new Date(ago(3 * 60 * 60 * 1000)).toISOString(), scoreBefore: 0.887, scoreAfter: null, roundId: 'round-045' },

    { agentId: 'counsel-risk-v2', domain: 'counsel', generation: 1, eventType: 'genesis', description: 'Counsel risk agent initialized from legal domain base model', timestamp: new Date(ago(75 * 24 * 60 * 60 * 1000)).toISOString(), scoreBefore: null, scoreAfter: 0.731, roundId: null },
    { agentId: 'counsel-risk-v2', domain: 'counsel', generation: 7, eventType: 'pending_approval', description: 'Tool selection change: jurisdiction case law retrieval tool proposed. Single approval required.', timestamp: new Date(ago(45 * 60 * 1000)).toISOString(), scoreBefore: 0.867, scoreAfter: null, roundId: 'round-046' },

    { agentId: 'sentra-threat-v4', domain: 'sentra', generation: 9, eventType: 'evolution_applied', description: 'APT routing weight adjustment approved and applied. +4.6% threat detection accuracy.', timestamp: new Date(ago(5 * 60 * 60 * 1000)).toISOString(), scoreBefore: 0.831, scoreAfter: 0.877, roundId: 'round-044' },

    { agentId: 'szl-oracle-v1', domain: 'szl-holdings', generation: 6, eventType: 'evolution_applied', description: 'LP sentiment extraction prompt auto-refined. +3.2% accuracy. Auto-applied (low risk).', timestamp: new Date(ago(16 * 60 * 60 * 1000)).toISOString(), scoreBefore: 0.824, scoreAfter: 0.856, roundId: 'round-043' },
  ];

  if (agentId) {
    return allEvents.filter((e) => e.agentId === agentId);
  }
  return allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// ─── Pending approvals state (in-memory for demo) ────────────────────────────

const pendingApprovals = new Map<string, { decision: string; decidedAt: string; decidedBy: string; reason?: string }>();

// ─── Routes ──────────────────────────────────────────────────────────────────

router.get('/alloy-forge/status', (_req, res) => {
  res.json({ ok: true, data: buildForgeStatus() });
});

router.get('/alloy-forge/evolution-rounds', (_req, res) => {
  const rounds = buildEvolutionRounds().map((r) => {
    const approval = pendingApprovals.get(r.roundId);
    if (approval) {
      return {
        ...r,
        status: approval.decision === 'approved' ? 'completed' : 'rejected',
        governanceDecision: approval,
      };
    }
    return r;
  });
  res.json({ ok: true, data: rounds });
});

router.get('/alloy-forge/arena', (_req, res) => {
  res.json({ ok: true, data: buildArena() });
});

router.get('/alloy-forge/proof-ledger', (_req, res) => {
  res.json({ ok: true, data: buildProofLedger() });
});

router.get('/alloy-forge/cross-domain', (_req, res) => {
  res.json({ ok: true, data: buildCrossDomainProposals() });
});

router.get('/alloy-forge/drift-alerts', (_req, res) => {
  res.json({ ok: true, data: buildDriftAlerts() });
});

router.get('/alloy-forge/timeline', (req, res) => {
  const agentId = typeof req.query.agentId === 'string' ? req.query.agentId : undefined;
  res.json({ ok: true, data: buildTimeline(agentId) });
});

router.post('/alloy-forge/rounds/:id/approve', authMiddleware(), (req, res) => {
  const roundId = req.params.id;
  pendingApprovals.set(roundId, {
    decision: 'approved',
    decidedAt: new Date().toISOString(),
    decidedBy: (req as { user?: { email?: string } }).user?.email ?? 'operator',
    reason: req.body?.reason ?? 'Approved via A11oy Forge dashboard',
  });
  res.json({
    ok: true,
    data: {
      roundId,
      decision: 'approved',
      decidedAt: new Date().toISOString(),
      proofEventId: `proof-approval-${randomUUID().slice(0, 8)}`,
    },
    message: `Evolution round ${roundId} approved — change will be applied to agent scaffold.`,
  });
});

router.post('/alloy-forge/rounds/:id/reject', authMiddleware(), (req, res) => {
  const roundId = req.params.id;
  pendingApprovals.set(roundId, {
    decision: 'rejected',
    decidedAt: new Date().toISOString(),
    decidedBy: (req as { user?: { email?: string } }).user?.email ?? 'operator',
    reason: req.body?.reason ?? 'Rejected via A11oy Forge dashboard',
  });
  res.json({
    ok: true,
    data: {
      roundId,
      decision: 'rejected',
      decidedAt: new Date().toISOString(),
      proofEventId: `proof-rejection-${randomUUID().slice(0, 8)}`,
    },
    message: `Evolution round ${roundId} rejected — agent scaffold unchanged. Rejection recorded in Proof Ledger.`,
  });
});

export default router;
