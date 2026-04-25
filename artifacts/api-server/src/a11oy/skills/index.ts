import type { OperatorId } from '../runtime/types.js';

export interface SkillDefinition {
  id: string;
  name: string;
  objective: string;
  requiredInputs: string[];
  safeDefaults: Record<string, unknown>;
  allowedCommands: string[];
  blockedCommands: string[];
  workflow: string[];
  expectedOutput: string;
  mirrorEvalCriteria: string[];
  proofRequirements: string[];
  pceRequirements: string[];
  failureHandling: string;
  vertical: string;
  primaryOperator: OperatorId;
}

export const SKILLS: SkillDefinition[] = [
  {
    id: 'revenue-friction',
    name: 'Revenue Friction Analysis',
    objective: 'Identify and quantify friction points preventing revenue recognition across the pipeline.',
    requiredInputs: ['vertical', 'period', 'accountIds'],
    safeDefaults: { period: 'Q-current', accountIds: [] },
    allowedCommands: ['runRevenueFrictionCheck', 'generateExecutiveSummary', 'runMirrorEval'],
    blockedCommands: ['updateOpportunityStatus', 'createJiraTicket'],
    workflow: ['context_building', 'revenue_friction_check', 'analysis', 'brief_creation'],
    expectedOutput: 'Revenue friction report with quantified blockers and actionable recommendations.',
    mirrorEvalCriteria: ['groundedness >= 0.7', 'evidence_coverage >= 0.6', 'action_safety >= 0.8'],
    proofRequirements: ['evidence_chain_length >= 3', 'analyst_signoff'],
    pceRequirements: ['source_coverage >= 0.6', 'mirrorEval.disposition != blocked'],
    failureHandling: 'Escalate to analyst operator with raw signal data.',
    vertical: 'lyte-revenue',
    primaryOperator: 'analyst',
  },
  {
    id: 'sow-aging',
    name: 'SOW Aging Detection',
    objective: 'Detect and escalate aging Statements of Work approaching deadline or past due.',
    requiredInputs: ['matterId', 'agingThresholdDays'],
    safeDefaults: { agingThresholdDays: 30 },
    allowedCommands: ['createMatterDeadlineAlert', 'generateExecutiveSummary', 'runMirrorEval'],
    blockedCommands: ['flagDuplicateScopeStackEntry'],
    workflow: ['context_building', 'aging_scan', 'alert_creation', 'escalation'],
    expectedOutput: 'List of aging SOWs with deadline alerts and escalation paths.',
    mirrorEvalCriteria: ['groundedness >= 0.6', 'policy_compliance >= 0.9'],
    proofRequirements: ['deadline_evidence', 'counsel_review'],
    pceRequirements: ['source_coverage >= 0.5', 'approval_tier >= executive'],
    failureHandling: 'Default to conservative alert: flag all SOWs > 15 days without evidence.',
    vertical: 'prism-counsel',
    primaryOperator: 'analyst',
  },
  {
    id: 'duplicate-scopestack',
    name: 'Duplicate ScopeStack Detection',
    objective: 'Identify and flag duplicate entries in the ScopeStack contract pipeline.',
    requiredInputs: ['entryId', 'pipelineId'],
    safeDefaults: { pipelineId: 'default' },
    allowedCommands: ['flagDuplicateScopeStackEntry', 'runMirrorEval', 'generateExecutiveSummary'],
    blockedCommands: [],
    workflow: ['scan', 'deduplication_check', 'flagging', 'routing'],
    expectedOutput: 'Duplicate detection report with flagged entries and review assignments.',
    mirrorEvalCriteria: ['action_safety >= 0.9', 'evidence_coverage >= 0.5'],
    proofRequirements: ['duplicate_evidence_chain'],
    pceRequirements: ['source_coverage >= 0.4'],
    failureHandling: 'Flag all ambiguous entries for manual review.',
    vertical: 'prism-counsel',
    primaryOperator: 'analyst',
  },
  {
    id: 'voyage-risk',
    name: 'Voyage Risk Assessment',
    objective: 'Assess and alert on maritime voyage risk including PSC compliance, sanctions, and weather.',
    requiredInputs: ['vesselId', 'routeId', 'riskTypes'],
    safeDefaults: { riskTypes: ['psc', 'sanctions', 'weather'] },
    allowedCommands: ['createVoyageRiskAlert', 'runMirrorEval', 'generateExecutiveSummary'],
    blockedCommands: [],
    workflow: ['risk_data_collection', 'risk_scoring', 'alert_generation', 'authority_notification'],
    expectedOutput: 'Voyage risk assessment with alerts and port authority notification.',
    mirrorEvalCriteria: ['groundedness >= 0.8', 'action_safety >= 0.7'],
    proofRequirements: ['voyage_data_chain', 'authority_confirmation'],
    pceRequirements: ['source_coverage >= 0.7', 'approval_tier >= operator'],
    failureHandling: 'Issue conservative risk alert: assume worst-case PSC risk.',
    vertical: 'vessels-maritime',
    primaryOperator: 'risk',
  },
  {
    id: 'sanctions-watch',
    name: 'Sanctions Watch',
    objective: 'Monitor and flag entities, vessels, and routes against sanctions databases.',
    requiredInputs: ['entityIds', 'sanctionsLists'],
    safeDefaults: { sanctionsLists: ['OFAC', 'EU', 'UN'] },
    allowedCommands: ['createSecurityIncidentNote', 'runMirrorEval', 'generateExecutiveSummary'],
    blockedCommands: [],
    workflow: ['entity_screening', 'sanctions_match', 'incident_recording', 'escalation'],
    expectedOutput: 'Sanctions screening report with match flags and compliance actions.',
    mirrorEvalCriteria: ['policy_compliance >= 0.95', 'groundedness >= 0.85'],
    proofRequirements: ['sanctions_data_chain', 'compliance_officer_review'],
    pceRequirements: ['source_coverage >= 0.8', 'approval_tier >= executive'],
    failureHandling: 'Escalate all potential matches to compliance team immediately.',
    vertical: 'aegis-defense',
    primaryOperator: 'risk',
  },
  {
    id: 'capex-overrun',
    name: 'CapEx Overrun Detection',
    objective: 'Detect capital expenditure overruns against approved budgets and flag for executive review.',
    requiredInputs: ['projectId', 'budgetPeriod', 'threshold'],
    safeDefaults: { threshold: 0.1 },
    allowedCommands: ['createRevOpsUpdate', 'generateExecutiveSummary', 'runMirrorEval'],
    blockedCommands: [],
    workflow: ['budget_comparison', 'overrun_calculation', 'executive_brief', 'approval_routing'],
    expectedOutput: 'CapEx overrun report with variance analysis and approval recommendation.',
    mirrorEvalCriteria: ['evidence_coverage >= 0.75', 'business_impact >= 0.6'],
    proofRequirements: ['budget_data_chain', 'cfo_acknowledgement'],
    pceRequirements: ['source_coverage >= 0.7', 'approval_tier >= executive'],
    failureHandling: 'Flag any variance > 5% without budget data for immediate CFO review.',
    vertical: 'alloy-core',
    primaryOperator: 'analyst',
  },
  {
    id: 'security-incident',
    name: 'Security Incident Response',
    objective: 'Create security incident records, initiate response, and route to cyber team.',
    requiredInputs: ['incidentId', 'severity', 'affectedSystems'],
    safeDefaults: { severity: 'medium' },
    allowedCommands: ['createSecurityIncidentNote', 'createVendorEscalation', 'runMirrorEval'],
    blockedCommands: ['updateOpportunityStatus'],
    workflow: ['incident_triage', 'record_creation', 'team_routing', 'escalation', 'proof_generation'],
    expectedOutput: 'Security incident record with response status and escalation chain.',
    mirrorEvalCriteria: ['action_safety >= 0.8', 'policy_compliance >= 0.95'],
    proofRequirements: ['incident_chain', 'ciso_acknowledgement'],
    pceRequirements: ['source_coverage >= 0.6', 'approval_tier >= executive'],
    failureHandling: 'Default to critical severity and escalate to CISO immediately.',
    vertical: 'aegis-defense',
    primaryOperator: 'risk',
  },
  {
    id: 'legal-deadline',
    name: 'Legal Deadline Management',
    objective: 'Monitor and alert on approaching legal deadlines across all matter types.',
    requiredInputs: ['matterId', 'deadlineDate', 'matterType'],
    safeDefaults: { alertThresholdDays: 14 },
    allowedCommands: ['createMatterDeadlineAlert', 'generateExecutiveSummary', 'runMirrorEval'],
    blockedCommands: [],
    workflow: ['deadline_monitoring', 'alert_creation', 'counsel_notification', 'escalation'],
    expectedOutput: 'Legal deadline alert with counsel notification and escalation chain.',
    mirrorEvalCriteria: ['policy_compliance >= 0.9', 'groundedness >= 0.7'],
    proofRequirements: ['deadline_evidence', 'counsel_confirmation'],
    pceRequirements: ['source_coverage >= 0.6', 'approval_tier >= executive'],
    failureHandling: 'Issue immediate alert for any deadline within 7 days without evidence.',
    vertical: 'prism-counsel',
    primaryOperator: 'action',
  },
  {
    id: 'residence-escalation',
    name: 'Residence Escalation',
    objective: 'Detect and escalate residence/occupancy issues in the real estate portfolio.',
    requiredInputs: ['propertyId', 'issueType', 'urgency'],
    safeDefaults: { urgency: 'normal' },
    allowedCommands: ['createVendorEscalation', 'generateExecutiveSummary', 'runMirrorEval'],
    blockedCommands: [],
    workflow: ['issue_detection', 'impact_assessment', 'escalation_routing', 'resolution_tracking'],
    expectedOutput: 'Residence escalation report with resolution timeline and assigned owner.',
    mirrorEvalCriteria: ['groundedness >= 0.6', 'business_impact >= 0.5'],
    proofRequirements: ['property_data_chain'],
    pceRequirements: ['source_coverage >= 0.5'],
    failureHandling: 'Escalate to property manager with all available context.',
    vertical: 'terra-real-estate',
    primaryOperator: 'analyst',
  },
  {
    id: 'board-packet',
    name: 'Board Packet Generation',
    objective: 'Generate comprehensive board-ready briefing packets from the current fabric state.',
    requiredInputs: ['period', 'verticals', 'includeProof'],
    safeDefaults: { includeProof: true },
    allowedCommands: ['generateBoardPacket', 'generateBoardroomModeSummary', 'runMirrorEval'],
    blockedCommands: [],
    workflow: ['data_aggregation', 'narrative_construction', 'proof_inclusion', 'packet_generation'],
    expectedOutput: 'Board packet PDF with executive summary, risk assessment, and proof ledger.',
    mirrorEvalCriteria: ['evidence_coverage >= 0.8', 'verification_readiness >= 0.7'],
    proofRequirements: ['complete_evidence_chain', 'board_approval'],
    pceRequirements: ['source_coverage >= 0.8', 'approval_tier >= board'],
    failureHandling: 'Generate partial packet with available data, flagging missing sections.',
    vertical: 'alloy-core',
    primaryOperator: 'board-packet',
  },
  {
    id: 'proof-reconstruction',
    name: 'Proof Trail Reconstruction',
    objective: 'Reconstruct and verify the full causal proof trail for any executed action.',
    requiredInputs: ['actionId', 'depth'],
    safeDefaults: { depth: 5 },
    allowedCommands: ['reconstructProofTrail', 'validatePCEContract', 'runMirrorEval'],
    blockedCommands: [],
    workflow: ['trace_retrieval', 'chain_reconstruction', 'verification', 'proof_issuance'],
    expectedOutput: 'Complete proof trail with all nodes, edges, and verification status.',
    mirrorEvalCriteria: ['groundedness >= 0.85', 'verification_readiness >= 0.9'],
    proofRequirements: ['complete_chain', 'hash_verification'],
    pceRequirements: ['source_coverage >= 0.7'],
    failureHandling: 'Return partial trail with missing nodes flagged for investigation.',
    vertical: 'alloy-core',
    primaryOperator: 'proof',
  },
  {
    id: 'code-audit',
    name: 'Code Quality Audit',
    objective: 'Audit code and configuration quality, policy compliance, and automation coverage.',
    requiredInputs: ['repoId', 'auditType', 'vertical'],
    safeDefaults: { auditType: 'full' },
    allowedCommands: ['generateExecutiveSummary', 'runMirrorEval', 'createJiraTicket'],
    blockedCommands: ['updateOpportunityStatus'],
    workflow: ['code_analysis', 'policy_check', 'finding_classification', 'report_generation'],
    expectedOutput: 'Code audit report with classified findings and remediation tickets.',
    mirrorEvalCriteria: ['evidence_coverage >= 0.6', 'action_safety >= 0.9'],
    proofRequirements: ['audit_evidence_chain'],
    pceRequirements: ['source_coverage >= 0.5'],
    failureHandling: 'Report all findings as potential issues pending manual review.',
    vertical: 'alloy-core',
    primaryOperator: 'code',
  },
  {
    id: 'data-quality',
    name: 'Data Quality Assessment',
    objective: 'Assess data completeness, freshness, and accuracy across signal sources.',
    requiredInputs: ['dataSource', 'vertical', 'metrics'],
    safeDefaults: { metrics: ['completeness', 'freshness', 'accuracy'] },
    allowedCommands: ['runOutcomeDriftCheck', 'runBusinessTwinDriftCheck', 'runMirrorEval'],
    blockedCommands: [],
    workflow: ['data_profiling', 'quality_scoring', 'anomaly_detection', 'report_generation'],
    expectedOutput: 'Data quality scorecard with issue flags and remediation priorities.',
    mirrorEvalCriteria: ['evidence_coverage >= 0.7', 'hallucination_risk >= 0.6'],
    proofRequirements: ['data_lineage_chain'],
    pceRequirements: ['source_coverage >= 0.5'],
    failureHandling: 'Flag all unscored data fields as potentially stale.',
    vertical: 'alloy-core',
    primaryOperator: 'analyst',
  },
  {
    id: 'business-twin-drift',
    name: 'Business Twin Drift Monitoring',
    objective: 'Monitor and alert on drift between Business Twin models and live signal data.',
    requiredInputs: ['twinId', 'vertical', 'driftThreshold'],
    safeDefaults: { driftThreshold: 0.15 },
    allowedCommands: ['runBusinessTwinDriftCheck', 'runOutcomeDriftCheck', 'runMirrorEval'],
    blockedCommands: [],
    workflow: ['twin_state_fetch', 'live_signal_comparison', 'drift_calculation', 'alert_routing'],
    expectedOutput: 'Drift analysis report with divergence scores and recommended resync.',
    mirrorEvalCriteria: ['groundedness >= 0.7', 'stale_context >= 0.6'],
    proofRequirements: ['twin_snapshot_chain'],
    pceRequirements: ['source_coverage >= 0.6'],
    failureHandling: 'Trigger resync with most recent available signal data.',
    vertical: 'alloy-core',
    primaryOperator: 'analyst',
  },
  {
    id: 'executive-briefing',
    name: 'Executive Briefing',
    objective: 'Generate structured executive briefings from current fabric signals and outcomes.',
    requiredInputs: ['period', 'audience', 'verticals'],
    safeDefaults: { audience: 'executive', verticals: ['alloy-core'] },
    allowedCommands: ['generateExecutiveSummary', 'generateBoardroomModeSummary', 'runMirrorEval'],
    blockedCommands: [],
    workflow: ['signal_aggregation', 'narrative_synthesis', 'impact_prioritization', 'briefing_generation'],
    expectedOutput: 'Executive briefing with prioritized insights, risk flags, and action recommendations.',
    mirrorEvalCriteria: ['evidence_coverage >= 0.7', 'action_specificity >= 0.6'],
    proofRequirements: ['evidence_chain'],
    pceRequirements: ['source_coverage >= 0.6'],
    failureHandling: 'Generate partial briefing with available data, flag missing context.',
    vertical: 'alloy-core',
    primaryOperator: 'board-packet',
  },
  {
    id: 'connector-health',
    name: 'Connector Health Check',
    objective: 'Validate health and connectivity of all registered external connectors.',
    requiredInputs: ['connectorIds'],
    safeDefaults: { connectorIds: ['*'] },
    allowedCommands: ['runConnectorHealthCheck', 'createVendorEscalation', 'runMirrorEval'],
    blockedCommands: [],
    workflow: ['connector_ping', 'latency_measurement', 'auth_validation', 'health_report'],
    expectedOutput: 'Connector health report with status, latency, and escalation for failures.',
    mirrorEvalCriteria: ['action_safety >= 0.9', 'evidence_coverage >= 0.5'],
    proofRequirements: ['health_evidence_chain'],
    pceRequirements: ['source_coverage >= 0.4'],
    failureHandling: 'Report degraded connector status; escalate if multiple connectors fail.',
    vertical: 'alloy-core',
    primaryOperator: 'connector',
  },
  {
    id: 'pce-validation',
    name: 'PCE Contract Validation',
    objective: 'Validate existing PCE contracts for evidence integrity and policy compliance.',
    requiredInputs: ['contractId'],
    safeDefaults: {},
    allowedCommands: ['validatePCEContract', 'reconstructProofTrail', 'runMirrorEval'],
    blockedCommands: [],
    workflow: ['contract_retrieval', 'evidence_chain_validation', 'policy_compliance_check', 'validation_report'],
    expectedOutput: 'PCE validation report with compliance status and any violation flags.',
    mirrorEvalCriteria: ['policy_compliance >= 0.95', 'verification_readiness >= 0.85'],
    proofRequirements: ['contract_proof_chain'],
    pceRequirements: ['source_coverage >= 0.7'],
    failureHandling: 'Flag contract as invalid and route to proof operator for remediation.',
    vertical: 'alloy-core',
    primaryOperator: 'proof',
  },
];

const skillMap = new Map<string, SkillDefinition>(SKILLS.map((s) => [s.id, s]));

export function getSkill(skillId: string): SkillDefinition | undefined {
  return skillMap.get(skillId);
}

export function listSkills(): SkillDefinition[] {
  return SKILLS;
}

export function getSkillsByVertical(vertical: string): SkillDefinition[] {
  return SKILLS.filter((s) => s.vertical === vertical || s.vertical === 'alloy-core');
}

export async function executeSkill(
  skillId: string,
  input: Record<string, unknown>,
): Promise<{ ok: boolean; result?: Record<string, unknown>; error?: string }> {
  const skill = skillMap.get(skillId);
  if (!skill) return { ok: false, error: `Skill "${skillId}" not found.` };

  for (const req of skill.requiredInputs) {
    if (!(req in input) && !(req in skill.safeDefaults)) {
      return { ok: false, error: `Required input "${req}" is missing for skill "${skillId}".` };
    }
  }

  const mergedInput = { ...skill.safeDefaults, ...input };

  return {
    ok: true,
    result: {
      skillId,
      name: skill.name,
      status: 'executed',
      input: mergedInput,
      expectedOutput: skill.expectedOutput,
      workflow: skill.workflow,
      demo: true,
      executedAt: new Date().toISOString(),
    },
  };
}
