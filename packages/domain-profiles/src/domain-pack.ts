/**
 * DomainPack — the typed contract for A11oy's Vertical Orchestrator.
 *
 * A DomainPack describes every governance dimension that A11oy manages for a
 * vertical: its constitution articles, data-source scope, evaluators, approval
 * gates, self-optimization signals, and learning-loop calibration metric.
 *
 * The six built-in verticals (Counsel, Vessels, Terra, Sentra, Aegis, Command)
 * are expressed as DomainPack records seeded at migration time. Operator-
 * composed packs follow exactly the same schema.
 */

export type DomainPackLifecycle =
  | 'draft'
  | 'pending_activation'
  | 'active'
  | 'rejected'
  | 'archived';

export type RiskTier = 'low' | 'medium' | 'high' | 'critical';

export interface ConstitutionRef {
  articleId: string;
  version: string;
  promptRegistryKey?: string;
}

export interface DataSourceRef {
  connectorId: string;
  displayName: string;
  riskLevel: RiskTier;
  allowedTools: string[];
  blockedTools: string[];
}

export interface EvaluatorRef {
  evaluatorId: string;
  displayName: string;
  passThreshold: number;
  dimensions: string[];
}

export interface ApprovalRule {
  riskTier: RiskTier;
  requiresApprover: string;
  autoApproveBelow?: number;
}

export interface SelfOptimizationConfig {
  rewardSignals: string[];
  lockedParameters: string[];
  tuningCronUtc?: string;
}

export interface LearningLoopConfig {
  calibrationMetric: string;
  driftThresholdPct: number;
  recalibrationTrigger: 'auto' | 'manual';
}

export interface DomainPack {
  slug: string;
  name: string;
  description: string;
  industry: string;
  uiShellTemplate: 'standard' | 'defense' | 'legal' | 'maritime' | 'real-estate' | 'custom';

  constitution: ConstitutionRef[];
  dataSources: DataSourceRef[];
  evaluators: EvaluatorRef[];
  approvalRules: ApprovalRule[];
  selfOptimization: SelfOptimizationConfig;
  learningLoop: LearningLoopConfig;

  lifecycle: DomainPackLifecycle;
  createdAt: string;
  updatedAt: string;
  activatedAt?: string;
  rejectionReason?: string;
  activationDecisionId?: string;
}

export interface DomainPackRevision {
  id: number;
  slug: string;
  lifecycle: DomainPackLifecycle;
  pack: DomainPack;
  actorId: string;
  note?: string;
  createdAt: string;
}

export interface DomainPackAuditEvent {
  id: number;
  slug: string;
  action: string;
  actorId: string;
  packSlug: string;
  outcome: string;
  detail?: Record<string, unknown>;
  createdAt: string;
}

export type DomainPackHealthKpis = {
  slug: string;
  decisions24h: number;
  mirrorEvalPassRate: number | null;
  approvalQueueMedianTtrMs: number | null;
  connectorFirewallBlocks: number;
  proofLedgerIntegrity: 'ok' | 'degraded' | 'unknown';
  selfOptimizationLastTuneAt: string | null;
  dataAsOf: string;
};

/** Reference packs for the six built-in A11oy verticals */
export const REFERENCE_DOMAIN_PACKS: DomainPack[] = [
  {
    slug: 'counsel',
    name: 'Counsel — Legal Matter Command',
    description:
      'Governed decision intelligence for legal matter management: discovery tracking, deadline monitoring, privilege gate, and escalation routing.',
    industry: 'Legal',
    uiShellTemplate: 'legal',
    constitution: [
      { articleId: 'I', version: 'v4.2.0', promptRegistryKey: 'constitution.attribution' },
      { articleId: 'II', version: 'v4.2.0', promptRegistryKey: 'constitution.human-authority' },
      { articleId: 'V', version: 'v4.2.0', promptRegistryKey: 'constitution.right-to-audit' },
    ],
    dataSources: [
      { connectorId: 'court-docket-api', displayName: 'Court Docket API', riskLevel: 'low', allowedTools: ['docket_search', 'deadline_monitor', 'document_retrieve'], blockedTools: ['filing_submit', 'document_modify'] },
    ],
    evaluators: [
      { evaluatorId: 'mirroreval-counsel', displayName: 'MirrorEval — Legal', passThreshold: 0.90, dimensions: ['groundedness', 'policy_compliance', 'evidence_coverage', 'hallucination_risk'] },
    ],
    approvalRules: [
      { riskTier: 'critical', requiresApprover: 'General Counsel' },
      { riskTier: 'high', requiresApprover: 'Senior Counsel', autoApproveBelow: 0.70 },
      { riskTier: 'medium', requiresApprover: 'Matter Lead', autoApproveBelow: 0.60 },
    ],
    selfOptimization: { rewardSignals: ['acceptance_rate', 'deadline_miss_rate'], lockedParameters: ['privilege_gate_threshold'] },
    learningLoop: { calibrationMetric: 'legal_outcome_accuracy', driftThresholdPct: 2.0, recalibrationTrigger: 'auto' },
    lifecycle: 'active',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-04-20T00:00:00Z',
    activatedAt: '2026-01-15T00:00:00Z',
  },
  {
    slug: 'vessels',
    name: 'Vessels — Maritime Intelligence',
    description:
      'Governed maritime decision intelligence: AIS tracking, port congestion, demurrage optimization, and route advisory.',
    industry: 'Maritime',
    uiShellTemplate: 'maritime',
    constitution: [
      { articleId: 'I', version: 'v4.2.0', promptRegistryKey: 'constitution.attribution' },
      { articleId: 'II', version: 'v4.2.0', promptRegistryKey: 'constitution.human-authority' },
    ],
    dataSources: [
      { connectorId: 'ais-live-api', displayName: 'AIS Live API', riskLevel: 'low', allowedTools: ['vessel_track', 'eta_lookup', 'port_congestion'], blockedTools: ['cargo_manifest_write', 'flag_state_modify'] },
    ],
    evaluators: [
      { evaluatorId: 'mirroreval-maritime', displayName: 'MirrorEval — Maritime', passThreshold: 0.88, dimensions: ['groundedness', 'action_safety', 'stale_context', 'evidence_coverage'] },
    ],
    approvalRules: [
      { riskTier: 'high', requiresApprover: 'VP Operations' },
      { riskTier: 'medium', requiresApprover: 'Fleet Manager', autoApproveBelow: 0.60 },
      { riskTier: 'low', requiresApprover: 'Duty Officer', autoApproveBelow: 0.40 },
    ],
    selfOptimization: { rewardSignals: ['demurrage_avoided', 'eta_accuracy'], lockedParameters: [] },
    learningLoop: { calibrationMetric: 'port_call_outcome_accuracy', driftThresholdPct: 2.5, recalibrationTrigger: 'auto' },
    lifecycle: 'active',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-04-20T00:00:00Z',
    activatedAt: '2026-01-15T00:00:00Z',
  },
  {
    slug: 'terra',
    name: 'Terra — Real Estate Intelligence',
    description:
      'Governed real estate decision intelligence: cap rate analysis, LOI routing, portfolio risk, and acquisition advisory.',
    industry: 'Real Estate',
    uiShellTemplate: 'real-estate',
    constitution: [
      { articleId: 'I', version: 'v4.2.0', promptRegistryKey: 'constitution.attribution' },
      { articleId: 'II', version: 'v4.2.0', promptRegistryKey: 'constitution.human-authority' },
      { articleId: 'VI', version: 'v4.2.0', promptRegistryKey: 'constitution.pre-deployment-review' },
    ],
    dataSources: [],
    evaluators: [
      { evaluatorId: 'mirroreval-terra', displayName: 'MirrorEval — Real Estate', passThreshold: 0.85, dimensions: ['groundedness', 'evidence_coverage', 'approval_alignment', 'counterfactual_strength'] },
    ],
    approvalRules: [
      { riskTier: 'high', requiresApprover: 'Investment Committee Chair' },
      { riskTier: 'medium', requiresApprover: 'Portfolio Manager' },
      { riskTier: 'low', requiresApprover: 'Asset Manager', autoApproveBelow: 0.50 },
    ],
    selfOptimization: { rewardSignals: ['cap_rate_accuracy', 'acquisition_outcome'], lockedParameters: ['cap_rate_compression_threshold'] },
    learningLoop: { calibrationMetric: 'asset_valuation_accuracy', driftThresholdPct: 3.0, recalibrationTrigger: 'auto' },
    lifecycle: 'active',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-04-20T00:00:00Z',
    activatedAt: '2026-01-15T00:00:00Z',
  },
  {
    slug: 'sentra',
    name: 'Sentra — Cyber Resilience Command',
    description:
      'Governed cyber defense intelligence: threat detection, adversarial simulation, incident response routing, and CISO escalation.',
    industry: 'Cybersecurity',
    uiShellTemplate: 'defense',
    constitution: [
      { articleId: 'I', version: 'v4.2.0', promptRegistryKey: 'constitution.attribution' },
      { articleId: 'II', version: 'v4.2.0', promptRegistryKey: 'constitution.human-authority' },
      { articleId: 'III', version: 'v4.2.0', promptRegistryKey: 'constitution.bounded-capability' },
      { articleId: 'IX', version: 'v4.2.0', promptRegistryKey: 'constitution.adversarial-covenants' },
    ],
    dataSources: [
      { connectorId: 'defense-intel-feed', displayName: 'Defense Intelligence Feed', riskLevel: 'low', allowedTools: ['threat_lookup', 'indicator_enrich', 'cve_query'], blockedTools: ['classified_retrieve', 'cisa_report_submit'] },
    ],
    evaluators: [
      { evaluatorId: 'mirroreval-sentra', displayName: 'MirrorEval — Defense', passThreshold: 0.95, dimensions: ['groundedness', 'action_safety', 'policy_compliance', 'scope_adherence', 'proof_completeness'] },
    ],
    approvalRules: [
      { riskTier: 'critical', requiresApprover: 'CISO' },
      { riskTier: 'high', requiresApprover: 'Incident Commander' },
      { riskTier: 'medium', requiresApprover: 'SOC Lead', autoApproveBelow: 0.65 },
    ],
    selfOptimization: { rewardSignals: ['detection_latency', 'false_positive_rate'], lockedParameters: ['threat_escalation_confidence', 'privilege_escalation_threshold'] },
    learningLoop: { calibrationMetric: 'threat_classification_accuracy', driftThresholdPct: 1.0, recalibrationTrigger: 'manual' },
    lifecycle: 'active',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-04-20T00:00:00Z',
    activatedAt: '2026-01-15T00:00:00Z',
  },
  {
    slug: 'aegis',
    name: 'Aegis — Defense & Intelligence',
    description:
      'Governed defense intelligence for investor and portfolio risk: threat modeling, scenario analysis, and strategic advisory.',
    industry: 'Defense & Intelligence',
    uiShellTemplate: 'defense',
    constitution: [
      { articleId: 'I', version: 'v4.2.0', promptRegistryKey: 'constitution.attribution' },
      { articleId: 'II', version: 'v4.2.0', promptRegistryKey: 'constitution.human-authority' },
      { articleId: 'III', version: 'v4.2.0', promptRegistryKey: 'constitution.bounded-capability' },
    ],
    dataSources: [],
    evaluators: [
      { evaluatorId: 'mirroreval-aegis', displayName: 'MirrorEval — Defense Intelligence', passThreshold: 0.95, dimensions: ['groundedness', 'action_safety', 'policy_compliance', 'proof_completeness'] },
    ],
    approvalRules: [
      { riskTier: 'critical', requiresApprover: 'Board Intelligence Committee' },
      { riskTier: 'high', requiresApprover: 'Senior Analyst' },
      { riskTier: 'medium', requiresApprover: 'Intelligence Lead', autoApproveBelow: 0.65 },
    ],
    selfOptimization: { rewardSignals: ['scenario_accuracy', 'analyst_acceptance'], lockedParameters: [] },
    learningLoop: { calibrationMetric: 'threat_scenario_accuracy', driftThresholdPct: 1.5, recalibrationTrigger: 'manual' },
    lifecycle: 'active',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-04-20T00:00:00Z',
    activatedAt: '2026-01-15T00:00:00Z',
  },
  {
    slug: 'command',
    name: 'Command — Unified Command Center',
    description:
      'Governed command intelligence for cross-vertical orchestration: signal aggregation, cross-domain routing, and executive briefing.',
    industry: 'Enterprise Command',
    uiShellTemplate: 'standard',
    constitution: [
      { articleId: 'I', version: 'v4.2.0', promptRegistryKey: 'constitution.attribution' },
      { articleId: 'II', version: 'v4.2.0', promptRegistryKey: 'constitution.human-authority' },
      { articleId: 'IV', version: 'v4.2.0', promptRegistryKey: 'constitution.truthful-self-report' },
      { articleId: 'VIII', version: 'v4.2.0', promptRegistryKey: 'constitution.mutability' },
    ],
    dataSources: [],
    evaluators: [
      { evaluatorId: 'mirroreval-command', displayName: 'MirrorEval — Command', passThreshold: 0.90, dimensions: ['groundedness', 'evidence_coverage', 'approval_alignment', 'policy_compliance'] },
    ],
    approvalRules: [
      { riskTier: 'critical', requiresApprover: 'C-Suite' },
      { riskTier: 'high', requiresApprover: 'VP Level' },
      { riskTier: 'medium', requiresApprover: 'Director', autoApproveBelow: 0.60 },
    ],
    selfOptimization: { rewardSignals: ['cross_vertical_routing_accuracy', 'executive_acceptance'], lockedParameters: [] },
    learningLoop: { calibrationMetric: 'cross_domain_outcome_accuracy', driftThresholdPct: 2.0, recalibrationTrigger: 'auto' },
    lifecycle: 'active',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-04-20T00:00:00Z',
    activatedAt: '2026-01-15T00:00:00Z',
  },
];
