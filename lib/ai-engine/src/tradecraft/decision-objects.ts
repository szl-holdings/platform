import { randomUUID } from 'crypto';

export type DecisionObjectType =
  | 'TriageDecision'
  | 'IncidentAssessment'
  | 'RiskDecision'
  | 'EscalationDecision'
  | 'ApprovalRecommendation'
  | 'ResponsePlan'
  | 'ExecutiveBrief'
  | 'ControlGapFinding';

export type ImpactLevel = 'critical' | 'high' | 'medium' | 'low' | 'negligible';
export type UrgencyLevel = 'immediate' | 'urgent' | 'standard' | 'deferred';
export type ConfidenceLabel = 'high' | 'moderate' | 'low' | 'insufficient';

export interface EvidenceRef {
  refId: string;
  source: string;
  sourceType:
    | 'alert'
    | 'incident'
    | 'playbook'
    | 'approval'
    | 'analyst_note'
    | 'asset_metadata'
    | 'user_metadata'
    | 'control_doc'
    | 'retention_policy'
    | 'incident_timeline'
    | 'prior_decision'
    | 'retrieval';
  content: string;
  relevanceScore: number;
  freshness: 'current' | 'recent' | 'stale' | 'unknown';
  timestamp: string | null;
  objectId: string | null;
}

export interface AnalyticAssumption {
  assumption: string;
  basis: string;
  vulnerability: 'critical' | 'high' | 'medium' | 'low';
}

export interface AlternativeHypothesis {
  hypothesis: string;
  likelihood: 'high' | 'medium' | 'low' | 'remote';
  rationale: string;
  evidenceFor: string[];
  evidenceAgainst: string[];
}

export interface BaseDecisionObject {
  objectId: string;
  tenantId: string;
  decisionType: DecisionObjectType;
  schemaVersion: '2.0.0';
  summary: string;
  issueStatement: string;
  evidenceRefs: EvidenceRef[];
  evidenceQuality: 'high' | 'medium' | 'low' | 'insufficient';
  assumptions: AnalyticAssumption[];
  alternatives: AlternativeHypothesis[];
  confidence: number;
  confidenceLabel: ConfidenceLabel;
  confidenceStatement: string;
  gapsAndUnknowns: string[];
  impactLevel: ImpactLevel;
  urgency: UrgencyLevel;
  recommendedAction: string;
  ownerSuggestion: string | null;
  approvalRequired: boolean;
  approvalReason: string | null;
  policyClass: string;
  humanReviewRequired: boolean;
  humanReviewReason: string | null;
  modelRoute: string;
  rawOutput: string | null;
  createdAt: string;
}

export interface TriageDecisionObject extends BaseDecisionObject {
  decisionType: 'TriageDecision';
  caseId: string | null;
  signalId: string | null;
  priority: 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
  triageDecision: 'escalate' | 'investigate' | 'monitor' | 'dismiss' | 'defer';
  routeTo: string;
  routeReason: string;
  category: string;
  affectedScope: string;
}

export interface IncidentAssessmentObject extends BaseDecisionObject {
  decisionType: 'IncidentAssessment';
  caseId: string | null;
  incidentId: string | null;
  primaryHypothesis: string;
  primaryHypothesisConfidence: 'high' | 'medium' | 'low';
  attackVector: string | null;
  threatActorType: 'nation_state' | 'criminal' | 'insider' | 'hacktivist' | 'unknown' | null;
  progressionStage: string;
  estimatedImpact: string;
  immediateContainmentRequired: boolean;
  observedTTPs: Array<{
    technique: string;
    mitreId: string | null;
    confidence: 'confirmed' | 'probable' | 'suspected';
  }>;
}

export interface RiskDecisionObject extends BaseDecisionObject {
  decisionType: 'RiskDecision';
  caseId: string | null;
  signalId: string | null;
  riskScore: number;
  riskCategory: string;
  affectedAssets: string[];
  mitigationSteps: Array<{
    step: string;
    priority: number;
    owner: string | null;
    deadline: string | null;
  }>;
  residualRisk: ImpactLevel;
  complianceImplication: string | null;
}

export interface EscalationDecisionObject extends BaseDecisionObject {
  decisionType: 'EscalationDecision';
  caseId: string | null;
  signalId: string | null;
  shouldEscalate: boolean;
  escalationLevel: 'none' | 'team_lead' | 'manager' | 'director' | 'executive' | 'external';
  escalationReason: string;
  triggerFactors: string[];
  recommendedRecipients: string[];
  communicationChannel: 'in-app' | 'email' | 'sms' | 'phone' | 'slack' | 'pagerduty';
  timeToImpact: string | null;
  financialExposure: string | null;
}

export interface ApprovalRecommendationObject extends BaseDecisionObject {
  decisionType: 'ApprovalRecommendation';
  caseId: string | null;
  actionId: string;
  approvalLevel: 'auto' | 'operator' | 'manager' | 'executive' | 'board';
  riskClassification: ImpactLevel;
  policyRef: string | null;
  policyName: string | null;
  autoApprovalEligible: boolean;
  autoApprovalConditions: string[];
  requiredApprovers: string[];
  escalationIfDenied: string | null;
  timeConstraint: string | null;
  estimatedImpact: {
    financial: string | null;
    operational: string | null;
    reputational: string | null;
    compliance: string | null;
  };
}

export interface ResponsePlanObject extends BaseDecisionObject {
  decisionType: 'ResponsePlan';
  caseId: string | null;
  incidentId: string | null;
  phase: 'containment' | 'eradication' | 'recovery' | 'post_incident';
  steps: Array<{
    stepNumber: number;
    action: string;
    owner: string | null;
    deadline: string | null;
    status: 'pending' | 'in_progress' | 'complete' | 'skipped';
    notes: string | null;
  }>;
  rollbackPlan: string | null;
  successCriteria: string[];
  estimatedDurationHours: number | null;
  resourcesRequired: string[];
}

export interface ExecutiveBriefObject extends BaseDecisionObject {
  decisionType: 'ExecutiveBrief';
  caseId: string | null;
  headline: string;
  situationOverview: string;
  keyFindings: Array<{ finding: string; severity: ImpactLevel; evidenceRef: string | null }>;
  executiveRecommendations: Array<{
    action: string;
    priority: 'P0' | 'P1' | 'P2' | 'P3';
    owner: string | null;
    rationale: string;
  }>;
  riskSummary: {
    overallRisk: ImpactLevel;
    trending: 'increasing' | 'stable' | 'decreasing';
    mitigationStatus: string;
  };
  audienceLevel: 'board' | 'executive' | 'management';
  classificationLabel: string;
}

export interface ControlGapFindingObject extends BaseDecisionObject {
  decisionType: 'ControlGapFinding';
  caseId: string | null;
  controlId: string | null;
  controlName: string;
  framework: string;
  gapDescription: string;
  affectedAssets: string[];
  exploitability: 'active' | 'likely' | 'possible' | 'theoretical';
  remediationOwner: string | null;
  dueDate: string | null;
  complianceRisk: string;
  remediationSteps: string[];
}

export type AnyDecisionObject =
  | TriageDecisionObject
  | IncidentAssessmentObject
  | RiskDecisionObject
  | EscalationDecisionObject
  | ApprovalRecommendationObject
  | ResponsePlanObject
  | ExecutiveBriefObject
  | ControlGapFindingObject;

function labelConfidence(score: number): ConfidenceLabel {
  if (score >= 0.75) return 'high';
  if (score >= 0.5) return 'moderate';
  if (score >= 0.25) return 'low';
  return 'insufficient';
}

function validateBase(obj: Record<string, unknown>, errors: string[]): void {
  if (typeof obj.summary !== 'string' || obj.summary.length === 0) errors.push('Missing summary');
  if (typeof obj.issueStatement !== 'string' || obj.issueStatement.length === 0)
    errors.push('Missing issueStatement');
  if (!Array.isArray(obj.evidenceRefs)) errors.push('Missing evidenceRefs array');
  if (!Array.isArray(obj.assumptions)) errors.push('Missing assumptions array');
  if (!Array.isArray(obj.alternatives)) errors.push('Missing alternatives array');
  if (typeof obj.confidence !== 'number' || obj.confidence < 0 || obj.confidence > 1)
    errors.push('Invalid confidence');
  if (!['high', 'medium', 'low', 'insufficient'].includes(obj.evidenceQuality as string))
    errors.push('Invalid evidenceQuality');
  if (typeof obj.recommendedAction !== 'string') errors.push('Missing recommendedAction');
  if (typeof obj.approvalRequired !== 'boolean') errors.push('Missing approvalRequired');
  if (!Array.isArray(obj.gapsAndUnknowns)) errors.push('Missing gapsAndUnknowns');
  if (typeof obj.humanReviewRequired !== 'boolean') errors.push('Missing humanReviewRequired');
}

export interface ValidationResult<T> {
  valid: boolean;
  object: T | null;
  errors: string[];
  rawOutput: string | null;
}

function safeFallback<T extends BaseDecisionObject>(
  decisionType: T['decisionType'],
  rawOutput: string | null,
  tenantId: string,
  policyClass: string,
  errors: string[],
): ValidationResult<T> {
  return {
    valid: false,
    object: null,
    errors,
    rawOutput,
  };
}

export function validateAndBuildTriageDecision(
  raw: unknown,
  meta: { tenantId: string; modelRoute: string; rawOutput: string | null },
): ValidationResult<TriageDecisionObject> {
  const errors: string[] = [];
  if (!raw || typeof raw !== 'object')
    return { valid: false, object: null, errors: ['Not an object'], rawOutput: meta.rawOutput };
  const obj = raw as Record<string, unknown>;
  validateBase(obj, errors);
  if (!['P0', 'P1', 'P2', 'P3', 'P4'].includes(obj.priority as string))
    errors.push('Invalid priority');
  if (
    !['escalate', 'investigate', 'monitor', 'dismiss', 'defer'].includes(
      obj.triageDecision as string,
    )
  )
    errors.push('Invalid triageDecision');
  if (typeof obj.routeTo !== 'string') errors.push('Missing routeTo');
  if (typeof obj.category !== 'string') errors.push('Missing category');
  if (errors.length > 0)
    return safeFallback('TriageDecision', meta.rawOutput, meta.tenantId, 'triage_decision', errors);
  const confidence = obj.confidence as number;
  const built: TriageDecisionObject = {
    objectId: `triage_${randomUUID()}`,
    tenantId: meta.tenantId,
    decisionType: 'TriageDecision',
    schemaVersion: '2.0.0',
    summary: obj.summary as string,
    issueStatement: obj.issueStatement as string,
    evidenceRefs: (obj.evidenceRefs as EvidenceRef[]) || [],
    evidenceQuality: (obj.evidenceQuality as TriageDecisionObject['evidenceQuality']) || 'low',
    assumptions: (obj.assumptions as AnalyticAssumption[]) || [],
    alternatives: (obj.alternatives as AlternativeHypothesis[]) || [],
    confidence,
    confidenceLabel: labelConfidence(confidence),
    confidenceStatement:
      (obj.confidenceStatement as string) || `Confidence: ${Math.round(confidence * 100)}%`,
    gapsAndUnknowns: (obj.gapsAndUnknowns as string[]) || [],
    impactLevel: (obj.impactLevel as ImpactLevel) || 'medium',
    urgency: (obj.urgency as UrgencyLevel) || 'standard',
    recommendedAction: obj.recommendedAction as string,
    ownerSuggestion: (obj.ownerSuggestion as string) || null,
    approvalRequired: obj.approvalRequired as boolean,
    approvalReason: (obj.approvalReason as string) || null,
    policyClass: 'triage_decision',
    humanReviewRequired: obj.humanReviewRequired as boolean,
    humanReviewReason: (obj.humanReviewReason as string) || null,
    modelRoute: meta.modelRoute,
    rawOutput: meta.rawOutput,
    createdAt: new Date().toISOString(),
    caseId: (obj.caseId as string) || null,
    signalId: (obj.signalId as string) || null,
    priority: obj.priority as TriageDecisionObject['priority'],
    triageDecision: obj.triageDecision as TriageDecisionObject['triageDecision'],
    routeTo: obj.routeTo as string,
    routeReason: (obj.routeReason as string) || '',
    category: obj.category as string,
    affectedScope: (obj.affectedScope as string) || 'unknown',
  };
  return { valid: true, object: built, errors: [], rawOutput: meta.rawOutput };
}

export function validateAndBuildIncidentAssessment(
  raw: unknown,
  meta: { tenantId: string; modelRoute: string; rawOutput: string | null },
): ValidationResult<IncidentAssessmentObject> {
  const errors: string[] = [];
  if (!raw || typeof raw !== 'object')
    return { valid: false, object: null, errors: ['Not an object'], rawOutput: meta.rawOutput };
  const obj = raw as Record<string, unknown>;
  validateBase(obj, errors);
  if (typeof obj.primaryHypothesis !== 'string') errors.push('Missing primaryHypothesis');
  if (!['high', 'medium', 'low'].includes(obj.primaryHypothesisConfidence as string))
    errors.push('Invalid primaryHypothesisConfidence');
  if (typeof obj.progressionStage !== 'string') errors.push('Missing progressionStage');
  if (errors.length > 0)
    return safeFallback(
      'IncidentAssessment',
      meta.rawOutput,
      meta.tenantId,
      'case_hypothesis',
      errors,
    );
  const confidence = obj.confidence as number;
  const built: IncidentAssessmentObject = {
    objectId: `incident_${randomUUID()}`,
    tenantId: meta.tenantId,
    decisionType: 'IncidentAssessment',
    schemaVersion: '2.0.0',
    summary: obj.summary as string,
    issueStatement: obj.issueStatement as string,
    evidenceRefs: (obj.evidenceRefs as EvidenceRef[]) || [],
    evidenceQuality: (obj.evidenceQuality as IncidentAssessmentObject['evidenceQuality']) || 'low',
    assumptions: (obj.assumptions as AnalyticAssumption[]) || [],
    alternatives: (obj.alternatives as AlternativeHypothesis[]) || [],
    confidence,
    confidenceLabel: labelConfidence(confidence),
    confidenceStatement:
      (obj.confidenceStatement as string) || `Confidence: ${Math.round(confidence * 100)}%`,
    gapsAndUnknowns: (obj.gapsAndUnknowns as string[]) || [],
    impactLevel: (obj.impactLevel as ImpactLevel) || 'medium',
    urgency: (obj.urgency as UrgencyLevel) || 'standard',
    recommendedAction: obj.recommendedAction as string,
    ownerSuggestion: (obj.ownerSuggestion as string) || null,
    approvalRequired: obj.approvalRequired as boolean,
    approvalReason: (obj.approvalReason as string) || null,
    policyClass: 'case_hypothesis',
    humanReviewRequired: obj.humanReviewRequired as boolean,
    humanReviewReason: (obj.humanReviewReason as string) || null,
    modelRoute: meta.modelRoute,
    rawOutput: meta.rawOutput,
    createdAt: new Date().toISOString(),
    caseId: (obj.caseId as string) || null,
    incidentId: (obj.incidentId as string) || null,
    primaryHypothesis: obj.primaryHypothesis as string,
    primaryHypothesisConfidence:
      obj.primaryHypothesisConfidence as IncidentAssessmentObject['primaryHypothesisConfidence'],
    attackVector: (obj.attackVector as string) || null,
    threatActorType: (obj.threatActorType as IncidentAssessmentObject['threatActorType']) || null,
    progressionStage: obj.progressionStage as string,
    estimatedImpact: (obj.estimatedImpact as string) || 'unknown',
    immediateContainmentRequired: (obj.immediateContainmentRequired as boolean) ?? false,
    observedTTPs: (obj.observedTTPs as IncidentAssessmentObject['observedTTPs']) || [],
  };
  return { valid: true, object: built, errors: [], rawOutput: meta.rawOutput };
}

export function validateAndBuildRiskDecision(
  raw: unknown,
  meta: { tenantId: string; modelRoute: string; rawOutput: string | null },
): ValidationResult<RiskDecisionObject> {
  const errors: string[] = [];
  if (!raw || typeof raw !== 'object')
    return { valid: false, object: null, errors: ['Not an object'], rawOutput: meta.rawOutput };
  const obj = raw as Record<string, unknown>;
  validateBase(obj, errors);
  if (typeof obj.riskScore !== 'number' || obj.riskScore < 0 || obj.riskScore > 100)
    errors.push('Invalid riskScore');
  if (typeof obj.riskCategory !== 'string') errors.push('Missing riskCategory');
  if (errors.length > 0)
    return safeFallback('RiskDecision', meta.rawOutput, meta.tenantId, 'risk_assessment', errors);
  const confidence = obj.confidence as number;
  const built: RiskDecisionObject = {
    objectId: `risk_${randomUUID()}`,
    tenantId: meta.tenantId,
    decisionType: 'RiskDecision',
    schemaVersion: '2.0.0',
    summary: obj.summary as string,
    issueStatement: obj.issueStatement as string,
    evidenceRefs: (obj.evidenceRefs as EvidenceRef[]) || [],
    evidenceQuality: (obj.evidenceQuality as RiskDecisionObject['evidenceQuality']) || 'low',
    assumptions: (obj.assumptions as AnalyticAssumption[]) || [],
    alternatives: (obj.alternatives as AlternativeHypothesis[]) || [],
    confidence,
    confidenceLabel: labelConfidence(confidence),
    confidenceStatement:
      (obj.confidenceStatement as string) || `Confidence: ${Math.round(confidence * 100)}%`,
    gapsAndUnknowns: (obj.gapsAndUnknowns as string[]) || [],
    impactLevel: (obj.impactLevel as ImpactLevel) || 'medium',
    urgency: (obj.urgency as UrgencyLevel) || 'standard',
    recommendedAction: obj.recommendedAction as string,
    ownerSuggestion: (obj.ownerSuggestion as string) || null,
    approvalRequired: obj.approvalRequired as boolean,
    approvalReason: (obj.approvalReason as string) || null,
    policyClass: 'risk_assessment',
    humanReviewRequired: obj.humanReviewRequired as boolean,
    humanReviewReason: (obj.humanReviewReason as string) || null,
    modelRoute: meta.modelRoute,
    rawOutput: meta.rawOutput,
    createdAt: new Date().toISOString(),
    caseId: (obj.caseId as string) || null,
    signalId: (obj.signalId as string) || null,
    riskScore: obj.riskScore as number,
    riskCategory: obj.riskCategory as string,
    affectedAssets: (obj.affectedAssets as string[]) || [],
    mitigationSteps: (obj.mitigationSteps as RiskDecisionObject['mitigationSteps']) || [],
    residualRisk: (obj.residualRisk as ImpactLevel) || 'medium',
    complianceImplication: (obj.complianceImplication as string) || null,
  };
  return { valid: true, object: built, errors: [], rawOutput: meta.rawOutput };
}

export function validateAndBuildEscalationDecision(
  raw: unknown,
  meta: { tenantId: string; modelRoute: string; rawOutput: string | null },
): ValidationResult<EscalationDecisionObject> {
  const errors: string[] = [];
  if (!raw || typeof raw !== 'object')
    return { valid: false, object: null, errors: ['Not an object'], rawOutput: meta.rawOutput };
  const obj = raw as Record<string, unknown>;
  validateBase(obj, errors);
  if (typeof obj.shouldEscalate !== 'boolean') errors.push('Missing shouldEscalate');
  if (
    !['none', 'team_lead', 'manager', 'director', 'executive', 'external'].includes(
      obj.escalationLevel as string,
    )
  )
    errors.push('Invalid escalationLevel');
  if (typeof obj.escalationReason !== 'string') errors.push('Missing escalationReason');
  if (errors.length > 0)
    return safeFallback(
      'EscalationDecision',
      meta.rawOutput,
      meta.tenantId,
      'escalation_recommendation',
      errors,
    );
  const confidence = obj.confidence as number;
  const built: EscalationDecisionObject = {
    objectId: `esc_${randomUUID()}`,
    tenantId: meta.tenantId,
    decisionType: 'EscalationDecision',
    schemaVersion: '2.0.0',
    summary: obj.summary as string,
    issueStatement: obj.issueStatement as string,
    evidenceRefs: (obj.evidenceRefs as EvidenceRef[]) || [],
    evidenceQuality: (obj.evidenceQuality as EscalationDecisionObject['evidenceQuality']) || 'low',
    assumptions: (obj.assumptions as AnalyticAssumption[]) || [],
    alternatives: (obj.alternatives as AlternativeHypothesis[]) || [],
    confidence,
    confidenceLabel: labelConfidence(confidence),
    confidenceStatement:
      (obj.confidenceStatement as string) || `Confidence: ${Math.round(confidence * 100)}%`,
    gapsAndUnknowns: (obj.gapsAndUnknowns as string[]) || [],
    impactLevel: (obj.impactLevel as ImpactLevel) || 'medium',
    urgency: (obj.urgency as UrgencyLevel) || 'standard',
    recommendedAction: obj.recommendedAction as string,
    ownerSuggestion: (obj.ownerSuggestion as string) || null,
    approvalRequired: obj.approvalRequired as boolean,
    approvalReason: (obj.approvalReason as string) || null,
    policyClass: 'escalation_recommendation',
    humanReviewRequired: obj.humanReviewRequired as boolean,
    humanReviewReason: (obj.humanReviewReason as string) || null,
    modelRoute: meta.modelRoute,
    rawOutput: meta.rawOutput,
    createdAt: new Date().toISOString(),
    caseId: (obj.caseId as string) || null,
    signalId: (obj.signalId as string) || null,
    shouldEscalate: obj.shouldEscalate as boolean,
    escalationLevel: obj.escalationLevel as EscalationDecisionObject['escalationLevel'],
    escalationReason: obj.escalationReason as string,
    triggerFactors: (obj.triggerFactors as string[]) || [],
    recommendedRecipients: (obj.recommendedRecipients as string[]) || [],
    communicationChannel:
      (obj.communicationChannel as EscalationDecisionObject['communicationChannel']) || 'in-app',
    timeToImpact: (obj.timeToImpact as string) || null,
    financialExposure: (obj.financialExposure as string) || null,
  };
  return { valid: true, object: built, errors: [], rawOutput: meta.rawOutput };
}

export function validateAndBuildApprovalRecommendation(
  raw: unknown,
  meta: { tenantId: string; modelRoute: string; rawOutput: string | null },
): ValidationResult<ApprovalRecommendationObject> {
  const errors: string[] = [];
  if (!raw || typeof raw !== 'object')
    return { valid: false, object: null, errors: ['Not an object'], rawOutput: meta.rawOutput };
  const obj = raw as Record<string, unknown>;
  validateBase(obj, errors);
  if (typeof obj.actionId !== 'string') errors.push('Missing actionId');
  if (!['auto', 'operator', 'manager', 'executive', 'board'].includes(obj.approvalLevel as string))
    errors.push('Invalid approvalLevel');
  if (errors.length > 0)
    return safeFallback(
      'ApprovalRecommendation',
      meta.rawOutput,
      meta.tenantId,
      'approval_recommendation',
      errors,
    );
  const confidence = obj.confidence as number;
  const built: ApprovalRecommendationObject = {
    objectId: `appr_${randomUUID()}`,
    tenantId: meta.tenantId,
    decisionType: 'ApprovalRecommendation',
    schemaVersion: '2.0.0',
    summary: obj.summary as string,
    issueStatement: obj.issueStatement as string,
    evidenceRefs: (obj.evidenceRefs as EvidenceRef[]) || [],
    evidenceQuality:
      (obj.evidenceQuality as ApprovalRecommendationObject['evidenceQuality']) || 'low',
    assumptions: (obj.assumptions as AnalyticAssumption[]) || [],
    alternatives: (obj.alternatives as AlternativeHypothesis[]) || [],
    confidence,
    confidenceLabel: labelConfidence(confidence),
    confidenceStatement:
      (obj.confidenceStatement as string) || `Confidence: ${Math.round(confidence * 100)}%`,
    gapsAndUnknowns: (obj.gapsAndUnknowns as string[]) || [],
    impactLevel: (obj.impactLevel as ImpactLevel) || 'medium',
    urgency: (obj.urgency as UrgencyLevel) || 'standard',
    recommendedAction: obj.recommendedAction as string,
    ownerSuggestion: (obj.ownerSuggestion as string) || null,
    approvalRequired: obj.approvalRequired as boolean,
    approvalReason: (obj.approvalReason as string) || null,
    policyClass: 'approval_recommendation',
    humanReviewRequired: obj.humanReviewRequired as boolean,
    humanReviewReason: (obj.humanReviewReason as string) || null,
    modelRoute: meta.modelRoute,
    rawOutput: meta.rawOutput,
    createdAt: new Date().toISOString(),
    caseId: (obj.caseId as string) || null,
    actionId: obj.actionId as string,
    approvalLevel: obj.approvalLevel as ApprovalRecommendationObject['approvalLevel'],
    riskClassification: (obj.riskClassification as ImpactLevel) || 'medium',
    policyRef: (obj.policyRef as string) || null,
    policyName: (obj.policyName as string) || null,
    autoApprovalEligible: (obj.autoApprovalEligible as boolean) ?? false,
    autoApprovalConditions: (obj.autoApprovalConditions as string[]) || [],
    requiredApprovers: (obj.requiredApprovers as string[]) || [],
    escalationIfDenied: (obj.escalationIfDenied as string) || null,
    timeConstraint: (obj.timeConstraint as string) || null,
    estimatedImpact: (obj.estimatedImpact as ApprovalRecommendationObject['estimatedImpact']) || {
      financial: null,
      operational: null,
      reputational: null,
      compliance: null,
    },
  };
  return { valid: true, object: built, errors: [], rawOutput: meta.rawOutput };
}

export function validateAndBuildResponsePlan(
  raw: unknown,
  meta: { tenantId: string; modelRoute: string; rawOutput: string | null },
): ValidationResult<ResponsePlanObject> {
  const errors: string[] = [];
  if (!raw || typeof raw !== 'object')
    return { valid: false, object: null, errors: ['Not an object'], rawOutput: meta.rawOutput };
  const obj = raw as Record<string, unknown>;
  validateBase(obj, errors);
  if (!['containment', 'eradication', 'recovery', 'post_incident'].includes(obj.phase as string))
    errors.push('Invalid phase');
  if (!Array.isArray(obj.steps) || obj.steps.length === 0) errors.push('Missing or empty steps');
  if (!Array.isArray(obj.successCriteria)) errors.push('Missing successCriteria');
  if (errors.length > 0)
    return safeFallback('ResponsePlan', meta.rawOutput, meta.tenantId, 'response_plan', errors);
  const confidence = obj.confidence as number;
  const built: ResponsePlanObject = {
    objectId: `resp_${randomUUID()}`,
    tenantId: meta.tenantId,
    decisionType: 'ResponsePlan',
    schemaVersion: '2.0.0',
    summary: obj.summary as string,
    issueStatement: obj.issueStatement as string,
    evidenceRefs: (obj.evidenceRefs as EvidenceRef[]) || [],
    evidenceQuality: (obj.evidenceQuality as ResponsePlanObject['evidenceQuality']) || 'low',
    assumptions: (obj.assumptions as AnalyticAssumption[]) || [],
    alternatives: (obj.alternatives as AlternativeHypothesis[]) || [],
    confidence,
    confidenceLabel: labelConfidence(confidence),
    confidenceStatement:
      (obj.confidenceStatement as string) || `Confidence: ${Math.round(confidence * 100)}%`,
    gapsAndUnknowns: (obj.gapsAndUnknowns as string[]) || [],
    impactLevel: (obj.impactLevel as ImpactLevel) || 'medium',
    urgency: (obj.urgency as UrgencyLevel) || 'standard',
    recommendedAction: obj.recommendedAction as string,
    ownerSuggestion: (obj.ownerSuggestion as string) || null,
    approvalRequired: obj.approvalRequired as boolean,
    approvalReason: (obj.approvalReason as string) || null,
    policyClass: 'response_plan',
    humanReviewRequired: obj.humanReviewRequired as boolean,
    humanReviewReason: (obj.humanReviewReason as string) || null,
    modelRoute: meta.modelRoute,
    rawOutput: meta.rawOutput,
    createdAt: new Date().toISOString(),
    caseId: (obj.caseId as string) || null,
    incidentId: (obj.incidentId as string) || null,
    phase: obj.phase as ResponsePlanObject['phase'],
    steps: obj.steps as ResponsePlanObject['steps'],
    rollbackPlan: (obj.rollbackPlan as string) || null,
    successCriteria: obj.successCriteria as string[],
    estimatedDurationHours: (obj.estimatedDurationHours as number) || null,
    resourcesRequired: (obj.resourcesRequired as string[]) || [],
  };
  return { valid: true, object: built, errors: [], rawOutput: meta.rawOutput };
}

export function validateAndBuildExecutiveBrief(
  raw: unknown,
  meta: { tenantId: string; modelRoute: string; rawOutput: string | null },
): ValidationResult<ExecutiveBriefObject> {
  const errors: string[] = [];
  if (!raw || typeof raw !== 'object')
    return { valid: false, object: null, errors: ['Not an object'], rawOutput: meta.rawOutput };
  const obj = raw as Record<string, unknown>;
  validateBase(obj, errors);
  if (typeof obj.headline !== 'string' || obj.headline.length === 0)
    errors.push('Missing headline');
  if (typeof obj.situationOverview !== 'string') errors.push('Missing situationOverview');
  if (!Array.isArray(obj.keyFindings)) errors.push('Missing keyFindings');
  if (!Array.isArray(obj.executiveRecommendations)) errors.push('Missing executiveRecommendations');
  if (!['board', 'executive', 'management'].includes(obj.audienceLevel as string))
    errors.push('Invalid audienceLevel');
  if (errors.length > 0)
    return safeFallback('ExecutiveBrief', meta.rawOutput, meta.tenantId, 'executive_brief', errors);
  const confidence = obj.confidence as number;
  const built: ExecutiveBriefObject = {
    objectId: `exec_${randomUUID()}`,
    tenantId: meta.tenantId,
    decisionType: 'ExecutiveBrief',
    schemaVersion: '2.0.0',
    summary: obj.summary as string,
    issueStatement: obj.issueStatement as string,
    evidenceRefs: (obj.evidenceRefs as EvidenceRef[]) || [],
    evidenceQuality: (obj.evidenceQuality as ExecutiveBriefObject['evidenceQuality']) || 'low',
    assumptions: (obj.assumptions as AnalyticAssumption[]) || [],
    alternatives: (obj.alternatives as AlternativeHypothesis[]) || [],
    confidence,
    confidenceLabel: labelConfidence(confidence),
    confidenceStatement:
      (obj.confidenceStatement as string) || `Confidence: ${Math.round(confidence * 100)}%`,
    gapsAndUnknowns: (obj.gapsAndUnknowns as string[]) || [],
    impactLevel: (obj.impactLevel as ImpactLevel) || 'medium',
    urgency: (obj.urgency as UrgencyLevel) || 'standard',
    recommendedAction: obj.recommendedAction as string,
    ownerSuggestion: (obj.ownerSuggestion as string) || null,
    approvalRequired: obj.approvalRequired as boolean,
    approvalReason: (obj.approvalReason as string) || null,
    policyClass: 'executive_brief',
    humanReviewRequired: obj.humanReviewRequired as boolean,
    humanReviewReason: (obj.humanReviewReason as string) || null,
    modelRoute: meta.modelRoute,
    rawOutput: meta.rawOutput,
    createdAt: new Date().toISOString(),
    caseId: (obj.caseId as string) || null,
    headline: obj.headline as string,
    situationOverview: obj.situationOverview as string,
    keyFindings: (obj.keyFindings as ExecutiveBriefObject['keyFindings']) || [],
    executiveRecommendations:
      (obj.executiveRecommendations as ExecutiveBriefObject['executiveRecommendations']) || [],
    riskSummary: (obj.riskSummary as ExecutiveBriefObject['riskSummary']) || {
      overallRisk: 'medium',
      trending: 'stable',
      mitigationStatus: 'unknown',
    },
    audienceLevel: obj.audienceLevel as ExecutiveBriefObject['audienceLevel'],
    classificationLabel: (obj.classificationLabel as string) || 'INTERNAL USE ONLY',
  };
  return { valid: true, object: built, errors: [], rawOutput: meta.rawOutput };
}

export function validateAndBuildControlGapFinding(
  raw: unknown,
  meta: { tenantId: string; modelRoute: string; rawOutput: string | null },
): ValidationResult<ControlGapFindingObject> {
  const errors: string[] = [];
  if (!raw || typeof raw !== 'object')
    return { valid: false, object: null, errors: ['Not an object'], rawOutput: meta.rawOutput };
  const obj = raw as Record<string, unknown>;
  validateBase(obj, errors);
  if (typeof obj.controlName !== 'string') errors.push('Missing controlName');
  if (typeof obj.framework !== 'string') errors.push('Missing framework');
  if (typeof obj.gapDescription !== 'string') errors.push('Missing gapDescription');
  if (!['active', 'likely', 'possible', 'theoretical'].includes(obj.exploitability as string))
    errors.push('Invalid exploitability');
  if (errors.length > 0)
    return safeFallback(
      'ControlGapFinding',
      meta.rawOutput,
      meta.tenantId,
      'control_gap_summary',
      errors,
    );
  const confidence = obj.confidence as number;
  const built: ControlGapFindingObject = {
    objectId: `ctrl_${randomUUID()}`,
    tenantId: meta.tenantId,
    decisionType: 'ControlGapFinding',
    schemaVersion: '2.0.0',
    summary: obj.summary as string,
    issueStatement: obj.issueStatement as string,
    evidenceRefs: (obj.evidenceRefs as EvidenceRef[]) || [],
    evidenceQuality: (obj.evidenceQuality as ControlGapFindingObject['evidenceQuality']) || 'low',
    assumptions: (obj.assumptions as AnalyticAssumption[]) || [],
    alternatives: (obj.alternatives as AlternativeHypothesis[]) || [],
    confidence,
    confidenceLabel: labelConfidence(confidence),
    confidenceStatement:
      (obj.confidenceStatement as string) || `Confidence: ${Math.round(confidence * 100)}%`,
    gapsAndUnknowns: (obj.gapsAndUnknowns as string[]) || [],
    impactLevel: (obj.impactLevel as ImpactLevel) || 'medium',
    urgency: (obj.urgency as UrgencyLevel) || 'standard',
    recommendedAction: obj.recommendedAction as string,
    ownerSuggestion: (obj.ownerSuggestion as string) || null,
    approvalRequired: obj.approvalRequired as boolean,
    approvalReason: (obj.approvalReason as string) || null,
    policyClass: 'control_gap_summary',
    humanReviewRequired: obj.humanReviewRequired as boolean,
    humanReviewReason: (obj.humanReviewReason as string) || null,
    modelRoute: meta.modelRoute,
    rawOutput: meta.rawOutput,
    createdAt: new Date().toISOString(),
    caseId: (obj.caseId as string) || null,
    controlId: (obj.controlId as string) || null,
    controlName: obj.controlName as string,
    framework: obj.framework as string,
    gapDescription: obj.gapDescription as string,
    affectedAssets: (obj.affectedAssets as string[]) || [],
    exploitability: obj.exploitability as ControlGapFindingObject['exploitability'],
    remediationOwner: (obj.remediationOwner as string) || null,
    dueDate: (obj.dueDate as string) || null,
    complianceRisk: (obj.complianceRisk as string) || 'unknown',
    remediationSteps: (obj.remediationSteps as string[]) || [],
  };
  return { valid: true, object: built, errors: [], rawOutput: meta.rawOutput };
}

export function validateAndBuildDecision(
  raw: unknown,
  decisionType: DecisionObjectType,
  meta: { tenantId: string; modelRoute: string; rawOutput: string | null },
): ValidationResult<AnyDecisionObject> {
  switch (decisionType) {
    case 'TriageDecision':
      return validateAndBuildTriageDecision(raw, meta) as ValidationResult<AnyDecisionObject>;
    case 'IncidentAssessment':
      return validateAndBuildIncidentAssessment(raw, meta) as ValidationResult<AnyDecisionObject>;
    case 'RiskDecision':
      return validateAndBuildRiskDecision(raw, meta) as ValidationResult<AnyDecisionObject>;
    case 'EscalationDecision':
      return validateAndBuildEscalationDecision(raw, meta) as ValidationResult<AnyDecisionObject>;
    case 'ApprovalRecommendation':
      return validateAndBuildApprovalRecommendation(
        raw,
        meta,
      ) as ValidationResult<AnyDecisionObject>;
    case 'ResponsePlan':
      return validateAndBuildResponsePlan(raw, meta) as ValidationResult<AnyDecisionObject>;
    case 'ExecutiveBrief':
      return validateAndBuildExecutiveBrief(raw, meta) as ValidationResult<AnyDecisionObject>;
    case 'ControlGapFinding':
      return validateAndBuildControlGapFinding(raw, meta) as ValidationResult<AnyDecisionObject>;
    default: {
      const exhaustive: never = decisionType;
      return {
        valid: false,
        object: null,
        errors: [`Unknown decisionType: ${exhaustive}`],
        rawOutput: meta.rawOutput,
      };
    }
  }
}
