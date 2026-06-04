import { randomUUID } from 'node:crypto';
import type { DecisionObjectType } from './decision-objects.js';

export type SkillCapability =
  | 'triage'
  | 'incident_assessment'
  | 'risk_scoring'
  | 'escalation'
  | 'response_planning'
  | 'executive_briefing'
  | 'control_gap'
  | 'approval_recommendation'
  | 'alternative_analysis'
  | 'confidence_challenge'
  | 'adversary_pattern';

export type SkillDomain =
  | 'security'
  | 'compliance'
  | 'risk'
  | 'operations'
  | 'intelligence'
  | 'executive'
  | 'cross_domain';

export interface SkillInputField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
}

export interface SkillOutputField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  decisionObjectType?: DecisionObjectType;
}

export interface SkillTriggerCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gte' | 'lte' | 'contains' | 'exists';
  value: unknown;
  description: string;
}

export interface SkillChainMetadata {
  canChainTo: SkillCapability[];
  canChainFrom: SkillCapability[];
  requiredPreconditions: string[];
  outputsFedToNext: string[];
  maxChainDepth: number;
  parallelizable: boolean;
}

export interface SkillManifest {
  skillId: string;
  name: string;
  version: string;
  capability: SkillCapability;
  domain: SkillDomain;
  description: string;
  triggerConditions: SkillTriggerCondition[];
  requiredInputs: SkillInputField[];
  optionalInputs: SkillInputField[];
  outputSchema: SkillOutputField[];
  outputDecisionType: DecisionObjectType;
  chainMetadata: SkillChainMetadata;
  analyticMode: string;
  policyClass: string;
  estimatedLatencyMs: number;
  tags: string[];
  isBuiltin: boolean;
  isActive: boolean;
  registeredAt: string;
  updatedAt: string;
}

export interface SkillChain {
  chainId: string;
  name: string;
  description: string;
  skills: Array<{
    skillId: string;
    capability: SkillCapability;
    order: number;
    inputMapping: Record<string, string>;
    condition?: string;
  }>;
  totalEstimatedLatencyMs: number;
  createdAt: string;
}

const BUILTIN_SKILLS: SkillManifest[] = [
  {
    skillId: 'skill_triage_v1',
    name: 'Signal Triage',
    version: '1.0.0',
    capability: 'triage',
    domain: 'security',
    description:
      'Rapidly classify and prioritize an incoming signal or event. Identifies the most critical decision required and recommends routing with explicit confidence bounds using CIA analytic tradecraft.',
    triggerConditions: [
      { field: 'signalId', operator: 'exists', value: true, description: 'A signal ID is present' },
      {
        field: 'severity',
        operator: 'contains',
        value: ['critical', 'high', 'medium'],
        description: 'Signal has a severity level',
      },
    ],
    requiredInputs: [
      {
        name: 'context',
        type: 'string',
        required: true,
        description: 'Signal or event context including title, description, severity, source',
      },
      {
        name: 'tenantId',
        type: 'string',
        required: true,
        description: 'Tenant identifier for scoping',
      },
    ],
    optionalInputs: [
      {
        name: 'evidence',
        type: 'string',
        required: false,
        description: 'Pre-retrieved evidence context',
      },
      {
        name: 'analystNotes',
        type: 'string',
        required: false,
        description: 'Any analyst observations',
      },
      {
        name: 'caseId',
        type: 'string',
        required: false,
        description: 'Associated case ID if one exists',
      },
    ],
    outputSchema: [
      { name: 'priority', type: 'string', description: 'P0-P4 priority classification' },
      {
        name: 'triageDecision',
        type: 'string',
        description: 'escalate|investigate|monitor|dismiss|defer',
      },
      { name: 'routeTo', type: 'string', description: 'Recommended team or queue' },
      { name: 'confidence', type: 'number', description: '0.0-1.0 confidence score' },
    ],
    outputDecisionType: 'TriageDecision',
    chainMetadata: {
      canChainTo: ['incident_assessment', 'risk_scoring', 'escalation', 'response_planning'],
      canChainFrom: [],
      requiredPreconditions: [],
      outputsFedToNext: ['priority', 'triageDecision', 'confidence', 'category'],
      maxChainDepth: 4,
      parallelizable: false,
    },
    analyticMode: 'triage',
    policyClass: 'triage_decision',
    estimatedLatencyMs: 8000,
    tags: ['triage', 'signal', 'routing', 'classification'],
    isBuiltin: true,
    isActive: true,
    registeredAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    skillId: 'skill_incident_assessment_v1',
    name: 'Incident Assessment',
    version: '1.0.0',
    capability: 'incident_assessment',
    domain: 'security',
    description:
      'Build a structured incident hypothesis following CIA analytic tradecraft standards. Constructs the most defensible hypothesis using ACH methodology, considering competing hypotheses and explicit probability ratings.',
    triggerConditions: [
      {
        field: 'incidentId',
        operator: 'exists',
        value: true,
        description: 'An incident ID is present',
      },
      {
        field: 'triageDecision',
        operator: 'eq',
        value: 'escalate',
        description: 'Triage decision was to escalate',
      },
    ],
    requiredInputs: [
      {
        name: 'context',
        type: 'string',
        required: true,
        description: 'Incident context including title, description, severity',
      },
      { name: 'tenantId', type: 'string', required: true, description: 'Tenant identifier' },
    ],
    optionalInputs: [
      { name: 'timeline', type: 'string', required: false, description: 'Timeline of events' },
      { name: 'evidence', type: 'string', required: false, description: 'Retrieved evidence' },
      {
        name: 'priorIncidents',
        type: 'string',
        required: false,
        description: 'Related prior incidents',
      },
    ],
    outputSchema: [
      { name: 'primaryHypothesis', type: 'string', description: 'Most likely explanation' },
      { name: 'primaryHypothesisConfidence', type: 'string', description: 'high|medium|low' },
      {
        name: 'immediateContainmentRequired',
        type: 'boolean',
        description: 'Whether immediate containment is needed',
      },
      {
        name: 'observedTTPs',
        type: 'array',
        description: 'Array of observed techniques and procedures',
      },
    ],
    outputDecisionType: 'IncidentAssessment',
    chainMetadata: {
      canChainTo: ['risk_scoring', 'escalation', 'response_planning', 'executive_briefing'],
      canChainFrom: ['triage'],
      requiredPreconditions: ['context'],
      outputsFedToNext: ['primaryHypothesis', 'immediateContainmentRequired', 'confidence'],
      maxChainDepth: 3,
      parallelizable: false,
    },
    analyticMode: 'incident_hypothesis',
    policyClass: 'case_hypothesis',
    estimatedLatencyMs: 12000,
    tags: ['incident', 'hypothesis', 'ach', 'threat-actor'],
    isBuiltin: true,
    isActive: true,
    registeredAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    skillId: 'skill_risk_scoring_v1',
    name: 'Risk Scoring',
    version: '1.0.0',
    capability: 'risk_scoring',
    domain: 'risk',
    description:
      'Assess and score the risk level of a situation, producing quantitative risk scores, identifying affected assets, and generating prioritized mitigation steps with compliance implications.',
    triggerConditions: [
      {
        field: 'riskCategory',
        operator: 'exists',
        value: true,
        description: 'Risk category is identified',
      },
      {
        field: 'affectedAssets',
        operator: 'exists',
        value: true,
        description: 'Affected assets are known',
      },
    ],
    requiredInputs: [
      {
        name: 'context',
        type: 'string',
        required: true,
        description: 'Risk context including assets, exposure, and threat vectors',
      },
      { name: 'tenantId', type: 'string', required: true, description: 'Tenant identifier' },
    ],
    optionalInputs: [
      { name: 'evidence', type: 'string', required: false, description: 'Supporting evidence' },
      {
        name: 'complianceFramework',
        type: 'string',
        required: false,
        description: 'Relevant compliance frameworks',
      },
    ],
    outputSchema: [
      { name: 'riskScore', type: 'number', description: '0-100 composite risk score' },
      { name: 'riskCategory', type: 'string', description: 'Category of risk' },
      { name: 'residualRisk', type: 'string', description: 'Risk level after mitigation' },
      { name: 'mitigationSteps', type: 'array', description: 'Prioritized remediation steps' },
    ],
    outputDecisionType: 'RiskDecision',
    chainMetadata: {
      canChainTo: ['escalation', 'executive_briefing', 'approval_recommendation'],
      canChainFrom: ['triage', 'incident_assessment'],
      requiredPreconditions: ['context'],
      outputsFedToNext: ['riskScore', 'residualRisk', 'mitigationSteps'],
      maxChainDepth: 3,
      parallelizable: true,
    },
    analyticMode: 'triage',
    policyClass: 'risk_assessment',
    estimatedLatencyMs: 10000,
    tags: ['risk', 'scoring', 'mitigation', 'compliance'],
    isBuiltin: true,
    isActive: true,
    registeredAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    skillId: 'skill_escalation_v1',
    name: 'Escalation Recommendation',
    version: '1.0.0',
    capability: 'escalation',
    domain: 'operations',
    description:
      'Determine whether a situation warrants escalation, identify the appropriate escalation level, and recommend recipients and communication channels with explicit trigger factors.',
    triggerConditions: [
      {
        field: 'impactLevel',
        operator: 'contains',
        value: ['critical', 'high'],
        description: 'High or critical impact detected',
      },
      {
        field: 'humanReviewRequired',
        operator: 'eq',
        value: true,
        description: 'Human review is required',
      },
    ],
    requiredInputs: [
      {
        name: 'context',
        type: 'string',
        required: true,
        description: 'Situation context requiring escalation decision',
      },
      { name: 'tenantId', type: 'string', required: true, description: 'Tenant identifier' },
    ],
    optionalInputs: [
      { name: 'evidence', type: 'string', required: false, description: 'Supporting evidence' },
      {
        name: 'priorDecision',
        type: 'object',
        required: false,
        description: 'Prior triage or assessment decision',
      },
    ],
    outputSchema: [
      { name: 'shouldEscalate', type: 'boolean', description: 'Whether to escalate' },
      {
        name: 'escalationLevel',
        type: 'string',
        description: 'none|team_lead|manager|director|executive|external',
      },
      {
        name: 'recommendedRecipients',
        type: 'array',
        description: 'Recommended escalation recipients',
      },
    ],
    outputDecisionType: 'EscalationDecision',
    chainMetadata: {
      canChainTo: ['executive_briefing', 'approval_recommendation'],
      canChainFrom: ['triage', 'incident_assessment', 'risk_scoring'],
      requiredPreconditions: [],
      outputsFedToNext: ['escalationLevel', 'recommendedRecipients'],
      maxChainDepth: 2,
      parallelizable: true,
    },
    analyticMode: 'triage',
    policyClass: 'escalation_recommendation',
    estimatedLatencyMs: 8000,
    tags: ['escalation', 'routing', 'notification'],
    isBuiltin: true,
    isActive: true,
    registeredAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    skillId: 'skill_response_planning_v1',
    name: 'Response Planning',
    version: '1.0.0',
    capability: 'response_planning',
    domain: 'operations',
    description:
      'Generate a structured response plan with phased steps for containment, eradication, recovery, and post-incident review. Includes rollback plans, success criteria, and resource requirements.',
    triggerConditions: [
      {
        field: 'immediateContainmentRequired',
        operator: 'eq',
        value: true,
        description: 'Immediate containment is required',
      },
      {
        field: 'triageDecision',
        operator: 'eq',
        value: 'investigate',
        description: 'Decision to investigate',
      },
    ],
    requiredInputs: [
      {
        name: 'context',
        type: 'string',
        required: true,
        description: 'Incident or situation context',
      },
      { name: 'tenantId', type: 'string', required: true, description: 'Tenant identifier' },
    ],
    optionalInputs: [
      { name: 'evidence', type: 'string', required: false, description: 'Supporting evidence' },
      {
        name: 'playbooks',
        type: 'string',
        required: false,
        description: 'Available playbook content',
      },
      {
        name: 'phase',
        type: 'string',
        required: false,
        description: 'containment|eradication|recovery|post_incident',
      },
    ],
    outputSchema: [
      {
        name: 'steps',
        type: 'array',
        description: 'Ordered response steps with owners and deadlines',
      },
      { name: 'phase', type: 'string', description: 'Current response phase' },
      { name: 'successCriteria', type: 'array', description: 'Criteria to determine success' },
    ],
    outputDecisionType: 'ResponsePlan',
    chainMetadata: {
      canChainTo: ['approval_recommendation', 'executive_briefing'],
      canChainFrom: ['triage', 'incident_assessment'],
      requiredPreconditions: ['context'],
      outputsFedToNext: ['steps', 'phase', 'estimatedDurationHours'],
      maxChainDepth: 2,
      parallelizable: false,
    },
    analyticMode: 'incident_hypothesis',
    policyClass: 'response_plan',
    estimatedLatencyMs: 15000,
    tags: ['response', 'containment', 'eradication', 'recovery', 'playbook'],
    isBuiltin: true,
    isActive: true,
    registeredAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    skillId: 'skill_executive_briefing_v1',
    name: 'Executive Briefing',
    version: '1.0.0',
    capability: 'executive_briefing',
    domain: 'executive',
    description:
      'Translate complex technical or operational findings into a clear, actionable executive brief following CIA analytic tradecraft standards. Produces structured briefings for board, executive, or management audiences.',
    triggerConditions: [
      {
        field: 'audienceLevel',
        operator: 'exists',
        value: true,
        description: 'Audience level is specified',
      },
      {
        field: 'impactLevel',
        operator: 'contains',
        value: ['critical', 'high'],
        description: 'High or critical impact',
      },
    ],
    requiredInputs: [
      {
        name: 'context',
        type: 'string',
        required: true,
        description: 'Situation context and key findings',
      },
      { name: 'tenantId', type: 'string', required: true, description: 'Tenant identifier' },
    ],
    optionalInputs: [
      {
        name: 'findings',
        type: 'string',
        required: false,
        description: 'Key findings to summarize',
      },
      { name: 'evidence', type: 'string', required: false, description: 'Supporting evidence' },
      {
        name: 'audienceLevel',
        type: 'string',
        required: false,
        description: 'board|executive|management',
      },
    ],
    outputSchema: [
      { name: 'headline', type: 'string', description: 'Single-sentence situation statement' },
      { name: 'keyFindings', type: 'array', description: 'Severity-ranked findings' },
      {
        name: 'executiveRecommendations',
        type: 'array',
        description: 'Prioritized actions for decision-makers',
      },
      { name: 'riskSummary', type: 'object', description: 'Overall risk status and trend' },
    ],
    outputDecisionType: 'ExecutiveBrief',
    chainMetadata: {
      canChainTo: [],
      canChainFrom: [
        'triage',
        'incident_assessment',
        'risk_scoring',
        'escalation',
        'response_planning',
      ],
      requiredPreconditions: ['context'],
      outputsFedToNext: [],
      maxChainDepth: 0,
      parallelizable: false,
    },
    analyticMode: 'executive_summary',
    policyClass: 'executive_brief',
    estimatedLatencyMs: 12000,
    tags: ['executive', 'brief', 'board', 'summary', 'reporting'],
    isBuiltin: true,
    isActive: true,
    registeredAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    skillId: 'skill_approval_recommendation_v1',
    name: 'Approval Recommendation',
    version: '1.0.0',
    capability: 'approval_recommendation',
    domain: 'operations',
    description:
      'Determine the appropriate approval level for a proposed action, evaluate auto-approval eligibility, identify required approvers, and estimate impact across financial, operational, and reputational dimensions.',
    triggerConditions: [
      {
        field: 'approvalRequired',
        operator: 'eq',
        value: true,
        description: 'Approval has been flagged as required',
      },
    ],
    requiredInputs: [
      {
        name: 'context',
        type: 'string',
        required: true,
        description: 'Action context requiring approval decision',
      },
      {
        name: 'actionId',
        type: 'string',
        required: true,
        description: 'ID of the action requiring approval',
      },
      { name: 'tenantId', type: 'string', required: true, description: 'Tenant identifier' },
    ],
    optionalInputs: [
      { name: 'evidence', type: 'string', required: false, description: 'Supporting evidence' },
      {
        name: 'policyRefs',
        type: 'string',
        required: false,
        description: 'Relevant policy references',
      },
    ],
    outputSchema: [
      {
        name: 'approvalLevel',
        type: 'string',
        description: 'auto|operator|manager|executive|board',
      },
      {
        name: 'autoApprovalEligible',
        type: 'boolean',
        description: 'Whether auto-approval is allowed',
      },
      { name: 'requiredApprovers', type: 'array', description: 'Required approver roles or users' },
    ],
    outputDecisionType: 'ApprovalRecommendation',
    chainMetadata: {
      canChainTo: ['executive_briefing'],
      canChainFrom: ['risk_scoring', 'escalation', 'response_planning'],
      requiredPreconditions: ['actionId'],
      outputsFedToNext: ['approvalLevel'],
      maxChainDepth: 1,
      parallelizable: true,
    },
    analyticMode: 'triage',
    policyClass: 'approval_recommendation',
    estimatedLatencyMs: 8000,
    tags: ['approval', 'authorization', 'governance'],
    isBuiltin: true,
    isActive: true,
    registeredAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    skillId: 'skill_control_gap_v1',
    name: 'Control Gap Analysis',
    version: '1.0.0',
    capability: 'control_gap',
    domain: 'compliance',
    description:
      'Identify and analyze gaps in security controls against compliance frameworks, assess exploitability, and generate prioritized remediation steps with compliance risk scoring.',
    triggerConditions: [
      {
        field: 'framework',
        operator: 'exists',
        value: true,
        description: 'A compliance framework is specified',
      },
      {
        field: 'controlStatus',
        operator: 'eq',
        value: 'not_implemented',
        description: 'Control is not implemented',
      },
    ],
    requiredInputs: [
      {
        name: 'context',
        type: 'string',
        required: true,
        description: 'Control and compliance context',
      },
      { name: 'tenantId', type: 'string', required: true, description: 'Tenant identifier' },
    ],
    optionalInputs: [
      {
        name: 'evidence',
        type: 'string',
        required: false,
        description: 'Evidence of control status',
      },
      {
        name: 'framework',
        type: 'string',
        required: false,
        description: 'Compliance framework to assess against',
      },
    ],
    outputSchema: [
      { name: 'gapDescription', type: 'string', description: 'Description of the control gap' },
      { name: 'exploitability', type: 'string', description: 'active|likely|possible|theoretical' },
      { name: 'remediationSteps', type: 'array', description: 'Steps to close the gap' },
    ],
    outputDecisionType: 'ControlGapFinding',
    chainMetadata: {
      canChainTo: ['risk_scoring', 'executive_briefing'],
      canChainFrom: [],
      requiredPreconditions: ['context'],
      outputsFedToNext: ['gapDescription', 'exploitability'],
      maxChainDepth: 2,
      parallelizable: true,
    },
    analyticMode: 'confidence_challenge',
    policyClass: 'control_gap',
    estimatedLatencyMs: 10000,
    tags: ['compliance', 'control', 'gap', 'framework', 'audit'],
    isBuiltin: true,
    isActive: true,
    registeredAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export class SkillRegistry {
  private skills = new Map<string, SkillManifest>();

  constructor() {
    for (const skill of BUILTIN_SKILLS) {
      this.skills.set(skill.skillId, skill);
    }
  }

  register(manifest: Omit<SkillManifest, 'skillId' | 'registeredAt' | 'updatedAt'>): SkillManifest {
    const skillId = `skill_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
    const now = new Date().toISOString();
    const full: SkillManifest = { ...manifest, skillId, registeredAt: now, updatedAt: now };
    this.skills.set(skillId, full);
    return full;
  }

  update(
    skillId: string,
    patch: Partial<Omit<SkillManifest, 'skillId' | 'registeredAt'>>,
  ): SkillManifest | null {
    const existing = this.skills.get(skillId);
    if (!existing) return null;
    const updated: SkillManifest = {
      ...existing,
      ...patch,
      skillId,
      updatedAt: new Date().toISOString(),
    };
    this.skills.set(skillId, updated);
    return updated;
  }

  deactivate(skillId: string): boolean {
    const skill = this.skills.get(skillId);
    if (!skill) return false;
    this.skills.set(skillId, { ...skill, isActive: false, updatedAt: new Date().toISOString() });
    return true;
  }

  get(skillId: string): SkillManifest | null {
    return this.skills.get(skillId) ?? null;
  }

  getAll(includeInactive = false): SkillManifest[] {
    const all = [...this.skills.values()];
    return includeInactive ? all : all.filter((s) => s.isActive);
  }

  findByCapability(capability: SkillCapability): SkillManifest | null {
    return this.getAll().find((s) => s.capability === capability) ?? null;
  }

  findByDomain(domain: SkillDomain): SkillManifest[] {
    return this.getAll().filter((s) => s.domain === domain || s.domain === 'cross_domain');
  }

  findByTags(tags: string[]): SkillManifest[] {
    const tagSet = new Set(tags.map((t) => t.toLowerCase()));
    return this.getAll().filter((s) => s.tags.some((t) => tagSet.has(t.toLowerCase())));
  }

  matchTriggers(context: Record<string, unknown>): SkillManifest[] {
    return this.getAll().filter((skill) => {
      if (skill.triggerConditions.length === 0) return true;
      return skill.triggerConditions.some((cond) => {
        const val = context[cond.field];
        switch (cond.operator) {
          case 'exists':
            return val !== undefined && val !== null;
          case 'eq':
            return val === cond.value;
          case 'neq':
            return val !== cond.value;
          case 'gte':
            return typeof val === 'number' && typeof cond.value === 'number' && val >= cond.value;
          case 'lte':
            return typeof val === 'number' && typeof cond.value === 'number' && val <= cond.value;
          case 'contains':
            return Array.isArray(cond.value)
              ? (cond.value as unknown[]).includes(val)
              : String(val).includes(String(cond.value));
          default:
            return false;
        }
      });
    });
  }
}

export const skillRegistry = new SkillRegistry();
