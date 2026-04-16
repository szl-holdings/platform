import { z } from "zod";

export const ATLAS_VERSION = "1.0.0" as const;

export const ATLAS_DOMAINS = [
  "lyte",
  "aegis",
  "terra",
  "vessels",
  "carlota-jo",
  "alloy",
  "platform",
  "command",
] as const;
export type AtlasDomain = typeof ATLAS_DOMAINS[number];

export const ATLAS_ACTOR_TYPES = ["human", "agent", "system", "external"] as const;
export type AtlasActorType = typeof ATLAS_ACTOR_TYPES[number];

export const ATLAS_PLATFORM_ROLES = [
  "founder_admin",
  "admin",
  "operator",
  "analyst",
  "viewer",
  "client",
] as const;
export type AtlasPlatformRole = typeof ATLAS_PLATFORM_ROLES[number];

export const ConfidenceScoreSchema = z.number().min(0).max(1);
export type ConfidenceScore = z.infer<typeof ConfidenceScoreSchema>;

export const CanonicalIdSchema = z.string().uuid();
export type CanonicalId = z.infer<typeof CanonicalIdSchema>;

export const TenantIdSchema = z.string().min(1);
export type TenantId = z.infer<typeof TenantIdSchema>;

export const ActorRefSchema = z.object({
  actorId: z.string(),
  actorType: z.enum(ATLAS_ACTOR_TYPES),
  displayName: z.string().optional(),
  role: z.enum(ATLAS_PLATFORM_ROLES).optional(),
  domain: z.enum(ATLAS_DOMAINS).optional(),
  organizationId: z.string().optional(),
});
export type AtlasActorRef = z.infer<typeof ActorRefSchema>;

export const OwnershipSchema = z.object({
  ownerId: z.string(),
  ownerType: z.enum(ATLAS_ACTOR_TYPES),
  organizationId: z.string().optional(),
  delegateTo: z.array(z.string()).optional(),
  assignedAt: z.string().datetime(),
});
export type AtlasOwnership = z.infer<typeof OwnershipSchema>;

export const TemporalHistoryEntrySchema = z.object({
  timestamp: z.string().datetime(),
  field: z.string(),
  previousValue: z.unknown().optional(),
  newValue: z.unknown().optional(),
  changedBy: ActorRefSchema.optional(),
  reason: z.string().optional(),
});
export type AtlasTemporalHistoryEntry = z.infer<typeof TemporalHistoryEntrySchema>;

export const SourceAttributionSchema = z.object({
  sourceId: z.string(),
  sourceType: z.enum(["api", "feed", "manual", "agent", "system", "webhook", "import"]),
  sourceLabel: z.string().optional(),
  confidence: ConfidenceScoreSchema,
  collectedAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
  verifiedBy: ActorRefSchema.optional(),
});
export type AtlasSourceAttribution = z.infer<typeof SourceAttributionSchema>;

export const BusinessImpactSchema = z.object({
  financialImpactUsd: z.number().optional(),
  financialImpactCurrency: z.string().default("USD"),
  operationalImpact: z.enum(["none", "low", "medium", "high", "critical"]).optional(),
  reputationalRisk: z.enum(["none", "low", "medium", "high", "critical"]).optional(),
  complianceRisk: z.enum(["none", "low", "medium", "high", "critical"]).optional(),
  affectedEntities: z.number().int().nonnegative().optional(),
  estimatedResolutionHours: z.number().nonnegative().optional(),
  sloImpact: z.string().optional(),
});
export type AtlasBusinessImpact = z.infer<typeof BusinessImpactSchema>;

export const PolicyBindingSchema = z.object({
  policyId: z.string(),
  policyName: z.string(),
  policyVersion: z.string().optional(),
  appliedAt: z.string().datetime(),
  enforcedBy: ActorRefSchema.optional(),
  overridable: z.boolean().default(false),
  overrideRequires: z.string().optional(),
});
export type AtlasPolicyBinding = z.infer<typeof PolicyBindingSchema>;

export const BaseEntitySchema = z.object({
  id: z.string().uuid(),
  atlasVersion: z.string().default(ATLAS_VERSION),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  tenantId: z.string(),
  domain: z.enum(ATLAS_DOMAINS),
  ownership: OwnershipSchema.optional(),
  history: z.array(TemporalHistoryEntrySchema).optional(),
  sources: z.array(SourceAttributionSchema).optional(),
  businessImpact: BusinessImpactSchema.optional(),
  policies: z.array(PolicyBindingSchema).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type AtlasBaseEntity = z.infer<typeof BaseEntitySchema>;

export const SIGNAL_SEVERITIES = ["info", "low", "medium", "high", "critical"] as const;
export type AtlasSignalSeverity = typeof SIGNAL_SEVERITIES[number];

export const SIGNAL_STATUSES = ["raw", "normalized", "processed", "acknowledged", "resolved", "dismissed"] as const;
export type AtlasSignalStatus = typeof SIGNAL_STATUSES[number];

export const SignalSchema = BaseEntitySchema.extend({
  entityType: z.literal("signal"),
  title: z.string(),
  description: z.string().optional(),
  severity: z.enum(SIGNAL_SEVERITIES),
  status: z.enum(SIGNAL_STATUSES),
  confidence: ConfidenceScoreSchema,
  source: SourceAttributionSchema,
  relatedEntityIds: z.array(z.string()).optional(),
  workflowId: z.string().optional(),
  prismDimension: z.enum(["pulse", "risk", "intelligence", "signals", "motion"]).optional(),
  rawPayload: z.record(z.unknown()).optional(),
});
export type AtlasSignal = z.infer<typeof SignalSchema>;

export const EVENT_TYPES = [
  "state_change",
  "threshold_breach",
  "anomaly_detected",
  "user_action",
  "system_event",
  "external_event",
  "scheduled",
  "ai_output",
] as const;
export type AtlasEventType = typeof EVENT_TYPES[number];

export const EventSchema = BaseEntitySchema.extend({
  entityType: z.literal("event"),
  eventType: z.enum(EVENT_TYPES),
  title: z.string(),
  description: z.string().optional(),
  actor: ActorRefSchema,
  targetEntityType: z.string().optional(),
  targetEntityId: z.string().optional(),
  workflowId: z.string().optional(),
  correlationId: z.string().optional(),
  sequenceNumber: z.number().int().nonnegative().optional(),
  payload: z.record(z.unknown()).optional(),
  immutable: z.boolean().default(true),
});
export type AtlasEvent = z.infer<typeof EventSchema>;

export const RISK_LEVELS = ["negligible", "low", "moderate", "high", "critical", "extreme"] as const;
export type AtlasRiskLevel = typeof RISK_LEVELS[number];

export const RISK_STATUSES = ["identified", "assessed", "mitigating", "accepted", "resolved", "monitoring"] as const;
export type AtlasRiskStatus = typeof RISK_STATUSES[number];

export const RiskSchema = BaseEntitySchema.extend({
  entityType: z.literal("risk"),
  title: z.string(),
  description: z.string(),
  riskLevel: z.enum(RISK_LEVELS),
  status: z.enum(RISK_STATUSES),
  likelihood: ConfidenceScoreSchema,
  impact: z.enum(["negligible", "low", "moderate", "high", "critical"]),
  riskScore: z.number().min(0).max(100),
  mitigationPlan: z.string().optional(),
  mitigationDueDate: z.string().datetime().optional(),
  residualRisk: z.enum(RISK_LEVELS).optional(),
  relatedSignalIds: z.array(z.string()).optional(),
  relatedControlIds: z.array(z.string()).optional(),
  reviewDate: z.string().datetime().optional(),
  acceptedBy: ActorRefSchema.optional(),
});
export type AtlasRisk = z.infer<typeof RiskSchema>;

export const OPPORTUNITY_STATUSES = [
  "identified",
  "qualifying",
  "active",
  "committed",
  "won",
  "lost",
  "deferred",
] as const;
export type AtlasOpportunityStatus = typeof OPPORTUNITY_STATUSES[number];

export const OpportunitySchema = BaseEntitySchema.extend({
  entityType: z.literal("opportunity"),
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(OPPORTUNITY_STATUSES),
  estimatedValueUsd: z.number().nonnegative().optional(),
  probability: ConfidenceScoreSchema,
  expectedCloseDate: z.string().datetime().optional(),
  actualCloseDate: z.string().datetime().optional(),
  relatedSignalIds: z.array(z.string()).optional(),
  assignedTo: ActorRefSchema.optional(),
});
export type AtlasOpportunity = z.infer<typeof OpportunitySchema>;

export const CONTROL_TYPES = [
  "preventive",
  "detective",
  "corrective",
  "compensating",
  "directive",
] as const;
export type AtlasControlType = typeof CONTROL_TYPES[number];

export const CONTROL_STATUSES = ["active", "inactive", "testing", "failed", "under_review"] as const;
export type AtlasControlStatus = typeof CONTROL_STATUSES[number];

export const ControlSchema = BaseEntitySchema.extend({
  entityType: z.literal("control"),
  title: z.string(),
  description: z.string(),
  controlType: z.enum(CONTROL_TYPES),
  status: z.enum(CONTROL_STATUSES),
  effectiveness: z.enum(["effective", "partially_effective", "ineffective", "not_tested"]),
  automationLevel: z.enum(["manual", "semi_automated", "fully_automated"]),
  mitigatedRiskIds: z.array(z.string()).optional(),
  testDate: z.string().datetime().optional(),
  nextReviewDate: z.string().datetime().optional(),
  evidenceIds: z.array(z.string()).optional(),
  frameworkMappings: z.array(z.string()).optional(),
});
export type AtlasControl = z.infer<typeof ControlSchema>;

export const WORKFLOW_STATUSES = [
  "pending",
  "running",
  "awaiting_approval",
  "approved",
  "rejected",
  "completed",
  "failed",
  "cancelled",
  "expired",
] as const;
export type AtlasWorkflowStatus = typeof WORKFLOW_STATUSES[number];

export const WorkflowSchema = BaseEntitySchema.extend({
  entityType: z.literal("workflow"),
  name: z.string(),
  description: z.string().optional(),
  status: z.enum(WORKFLOW_STATUSES),
  priority: z.enum(["low", "medium", "high", "urgent", "critical"]),
  triggeredBy: ActorRefSchema,
  triggeredBySignalId: z.string().optional(),
  triggeredByRecommendationId: z.string().optional(),
  currentStep: z.string().optional(),
  totalSteps: z.number().int().positive().optional(),
  completedSteps: z.number().int().nonnegative().optional(),
  approvalRequired: z.boolean().default(false),
  approvalDeadline: z.string().datetime().optional(),
  slaDeadline: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  outcome: z.string().optional(),
  actionIds: z.array(z.string()).optional(),
});
export type AtlasWorkflow = z.infer<typeof WorkflowSchema>;

export const RecommendationSchema = BaseEntitySchema.extend({
  entityType: z.literal("recommendation"),
  title: z.string(),
  summary: z.string(),
  reasoning: z.string(),
  confidence: ConfidenceScoreSchema,
  generatedBy: ActorRefSchema,
  evidenceChain: z.array(z.string()),
  relatedSignalIds: z.array(z.string()).optional(),
  relatedRiskIds: z.array(z.string()).optional(),
  suggestedActions: z.array(z.string()).optional(),
  status: z.enum(["pending", "accepted", "rejected", "expired", "superseded"]),
  acceptedBy: ActorRefSchema.optional(),
  acceptedAt: z.string().datetime().optional(),
  rejectionReason: z.string().optional(),
  workflowId: z.string().optional(),
  modelId: z.string().optional(),
  modelVersion: z.string().optional(),
});
export type AtlasRecommendation = z.infer<typeof RecommendationSchema>;

export const ACTION_STATUSES = [
  "proposed",
  "pending_approval",
  "approved",
  "executing",
  "completed",
  "failed",
  "cancelled",
  "rolled_back",
] as const;
export type AtlasActionStatus = typeof ACTION_STATUSES[number];

export const ActionSchema = BaseEntitySchema.extend({
  entityType: z.literal("action"),
  title: z.string(),
  description: z.string(),
  status: z.enum(ACTION_STATUSES),
  actionType: z.string(),
  executor: ActorRefSchema,
  approvedBy: ActorRefSchema.optional(),
  approvedAt: z.string().datetime().optional(),
  executedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  workflowId: z.string().optional(),
  recommendationId: z.string().optional(),
  targetEntityType: z.string().optional(),
  targetEntityId: z.string().optional(),
  payload: z.record(z.unknown()).optional(),
  result: z.record(z.unknown()).optional(),
  rollbackAvailable: z.boolean().default(false),
  rolledBackAt: z.string().datetime().optional(),
  rolledBackBy: ActorRefSchema.optional(),
});
export type AtlasAction = z.infer<typeof ActionSchema>;

export const APPROVAL_STATUSES = ["pending", "approved", "rejected", "expired", "cancelled", "delegated"] as const;
export type AtlasApprovalStatus = typeof APPROVAL_STATUSES[number];

export const ApprovalSchema = BaseEntitySchema.extend({
  entityType: z.literal("approval"),
  status: z.enum(APPROVAL_STATUSES),
  workflowId: z.string(),
  requestedBy: ActorRefSchema,
  requestedAt: z.string().datetime(),
  requiredApprovers: z.array(ActorRefSchema),
  actualApprover: ActorRefSchema.optional(),
  decision: z.enum(["approved", "rejected"]).optional(),
  decisionAt: z.string().datetime().optional(),
  decisionReason: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  escalatedTo: ActorRefSchema.optional(),
  delegatedTo: ActorRefSchema.optional(),
  quorumRequired: z.number().int().positive().default(1),
  quorumAchieved: z.number().int().nonnegative().default(0),
  humanGateRequired: z.boolean().default(true),
});
export type AtlasApproval = z.infer<typeof ApprovalSchema>;

export const EvidenceSchema = BaseEntitySchema.extend({
  entityType: z.literal("evidence"),
  title: z.string(),
  description: z.string().optional(),
  evidenceType: z.enum(["document", "log", "screenshot", "api_response", "audit_entry", "attestation", "measurement"]),
  url: z.string().url().optional(),
  hash: z.string().optional(),
  hashAlgorithm: z.enum(["sha256", "sha512"]).optional(),
  collectedBy: ActorRefSchema,
  collectedAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
  controlIds: z.array(z.string()).optional(),
  approvalIds: z.array(z.string()).optional(),
  verifiedBy: ActorRefSchema.optional(),
  verifiedAt: z.string().datetime().optional(),
});
export type AtlasEvidence = z.infer<typeof EvidenceSchema>;

export const OutcomeSchema = BaseEntitySchema.extend({
  entityType: z.literal("outcome"),
  title: z.string(),
  description: z.string(),
  outcomeType: z.enum(["success", "partial_success", "failure", "cancelled", "deferred"]),
  workflowId: z.string(),
  actionId: z.string().optional(),
  recordedBy: ActorRefSchema,
  recordedAt: z.string().datetime(),
  measuredValues: z.record(z.number()).optional(),
  targetValues: z.record(z.number()).optional(),
  sloMet: z.boolean().optional(),
  lessonLearned: z.string().optional(),
  followUpRequired: z.boolean().default(false),
  followUpWorkflowId: z.string().optional(),
});
export type AtlasOutcome = z.infer<typeof OutcomeSchema>;

export const PolicySchema = BaseEntitySchema.extend({
  entityType: z.literal("policy"),
  name: z.string(),
  description: z.string(),
  version: z.string(),
  status: z.enum(["draft", "active", "deprecated", "superseded"]),
  policyType: z.enum(["approval", "access", "retention", "compliance", "operational", "ai_governance"]),
  scope: z.array(z.enum(ATLAS_DOMAINS)),
  enforcementMode: z.enum(["advisory", "enforced", "blocking"]),
  rules: z.array(z.object({
    ruleId: z.string(),
    condition: z.string(),
    action: z.string(),
    priority: z.number().int(),
  })),
  approvedBy: ActorRefSchema.optional(),
  effectiveDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
  supersededById: z.string().optional(),
  controlIds: z.array(z.string()).optional(),
});
export type AtlasPolicy = z.infer<typeof PolicySchema>;

export const KpiSchema = BaseEntitySchema.extend({
  entityType: z.literal("kpi"),
  name: z.string(),
  description: z.string(),
  unit: z.string(),
  currentValue: z.number(),
  targetValue: z.number(),
  warningThreshold: z.number().optional(),
  criticalThreshold: z.number().optional(),
  direction: z.enum(["higher_better", "lower_better", "range"]),
  rangeMin: z.number().optional(),
  rangeMax: z.number().optional(),
  period: z.enum(["realtime", "hourly", "daily", "weekly", "monthly", "quarterly", "annual"]),
  calculatedAt: z.string().datetime(),
  trend: z.enum(["improving", "stable", "degrading", "unknown"]),
  linkedSloIds: z.array(z.string()).optional(),
  linkedSignalIds: z.array(z.string()).optional(),
});
export type AtlasKpi = z.infer<typeof KpiSchema>;

export const SloSchema = BaseEntitySchema.extend({
  entityType: z.literal("slo"),
  name: z.string(),
  description: z.string(),
  service: z.string(),
  indicator: z.string(),
  target: z.number().min(0).max(100),
  window: z.string(),
  currentCompliance: z.number().min(0).max(100),
  errorBudgetTotal: z.number(),
  errorBudgetConsumed: z.number(),
  errorBudgetRemaining: z.number(),
  status: z.enum(["healthy", "at_risk", "breached", "recovering"]),
  alertPolicies: z.array(z.string()).optional(),
  linkedKpiIds: z.array(z.string()).optional(),
  burnRateHourly: z.number().optional(),
});
export type AtlasSlo = z.infer<typeof SloSchema>;
