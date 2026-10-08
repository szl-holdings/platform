/**
 * SZL Holdings — Agent Gateway Types
 * Phase 11 — Agent Gateway
 *
 * All data shapes crossing the gateway boundary are defined here.
 * Every type is JSON-serializable; no circular references.
 */

// ---------------------------------------------------------------------------
// Caller identity
// ---------------------------------------------------------------------------

export type CallerRole = 'platform-engineer' | 'operator' | 'agent-service' | 'ai-model';

export interface CallerIdentity {
  sub: string;
  role: CallerRole;
  groups: string[];
  orgId: string;
  iat: number;
  exp: number;
}

export interface Hs256JwtVerificationConfig {
  algorithm: 'HS256';
  secret: string;
}

export interface Rs256JwtVerificationConfig {
  algorithm: 'RS256';
  publicKey: string;
  issuer: string;
  audience: string;
  orgId: string;
}

export type JwtVerificationConfig = Hs256JwtVerificationConfig | Rs256JwtVerificationConfig;

export interface EvidenceLedgerConfig {
  endpoint: string;
  token: string;
}

export interface ApprovalWorkflowProbeConfig {
  namespace: string;
  taskQueue: string;
  proofEndpoint: string;
  proofToken: string;
}

// ---------------------------------------------------------------------------
// Agent capabilities — allowed and forbidden
// ---------------------------------------------------------------------------

/**
 * Allowed read-only / advisory capabilities.
 * Agents may request these; each is enforced as a code-level allow-list.
 */
export type AllowedCapability =
  | 'inspect_code'
  | 'inspect_manifests'
  | 'analyze_telemetry'
  | 'summarize_incidents'
  | 'draft_runbooks'
  | 'draft_prs'
  | 'propose_policy_fixes'
  | 'generate_documentation'
  | 'generate_test_plans'
  | 'propose_architecture_diffs';

/**
 * Capabilities that are categorically forbidden.
 * Enforced in code — an agent that requests any of these gets a hard reject
 * before auth or OPA evaluation even runs.
 */
export type ForbiddenCapability =
  | 'direct_prod_change'
  | 'policy_bypass'
  | 'pr_flow_bypass'
  | 'approval_bypass'
  | 'plaintext_secret_access';

export const ALLOWED_CAPABILITIES: ReadonlySet<AllowedCapability> = new Set([
  'inspect_code',
  'inspect_manifests',
  'analyze_telemetry',
  'summarize_incidents',
  'draft_runbooks',
  'draft_prs',
  'propose_policy_fixes',
  'generate_documentation',
  'generate_test_plans',
  'propose_architecture_diffs',
] satisfies AllowedCapability[]);

export const FORBIDDEN_CAPABILITIES: ReadonlySet<ForbiddenCapability> = new Set([
  'direct_prod_change',
  'policy_bypass',
  'pr_flow_bypass',
  'approval_bypass',
  'plaintext_secret_access',
] satisfies ForbiddenCapability[]);

export type TargetEnvironment = 'development' | 'staging' | 'production';

// ---------------------------------------------------------------------------
// Agent action request / response
// ---------------------------------------------------------------------------

export interface AgentActionRequest {
  correlationId: string;
  capability: string;
  model: string;
  promptHash: string;
  target: string;
  targetEnvironment: TargetEnvironment;
  domain: string;
  parameters: Record<string, unknown>;
  requestedAt: string;
}

export interface SimulationResult {
  safe: boolean;
  impactSummary: string;
  affectedResources: string[];
  estimatedScopeLines?: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  warnings: string[];
}

export interface ActionPlan {
  summary: string;
  steps: PlanStep[];
  estimatedDurationMs: number;
  requiresApproval: boolean;
  approvalGroups: string[];
}

export interface PlanStep {
  order: number;
  action: string;
  target: string;
  rationale: string;
  reversible: boolean;
}

export interface ManifestDiff {
  additions: DiffEntry[];
  modifications: DiffEntry[];
  deletions: DiffEntry[];
  patchSummary: string;
}

export interface DiffEntry {
  path: string;
  before?: string;
  after?: string;
  reason: string;
}

export interface EvidenceRecord {
  evidenceId: string;
  correlationId: string;
  capability: AllowedCapability;
  model: string;
  promptHash: string;
  actor: string;
  target: string;
  domain: string;
  simulationResult: SimulationResult;
  plan: ActionPlan;
  diff: ManifestDiff;
  rollbackPath: string;
  policyDecision: OpaDecision;
  createdAt: string;
}

export interface OpaDecision {
  allowed: boolean;
  requiredApprovals: number;
  requiredGroups: string[];
  policyId: string;
  evaluatedAt: string;
  reasons: string[];
}

export interface ApprovalRequest {
  approvalId: string;
  correlationId: string;
  evidenceId: string;
  requiredApprovals: number;
  requiredGroups: string[];
  timeoutMs: number;
}

export interface ApprovalOutcome {
  approvalId: string;
  outcome: 'approved' | 'rejected' | 'expired' | 'not_required';
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedReason?: string;
}

export interface AuditEntry {
  auditId: string;
  correlationId: string;
  actor: string;
  role: CallerRole;
  model: string;
  promptHash: string;
  capability: string;
  target: string;
  targetEnvironment: string;
  domain: string;
  diff: ManifestDiff | null;
  simulationResult: SimulationResult | null;
  policyDecision: OpaDecision | null;
  approvalOutcome: ApprovalOutcome | null;
  agentResult: AgentExecutionResult | null;
  status:
    | 'forbidden'
    | 'auth_failed'
    | 'authz_denied'
    | 'approval_pending'
    | 'approval_denied'
    | 'execution_authorized'
    | 'completed'
    | 'error';
  statusReason?: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
}

export interface AgentExecutionResult {
  output: string;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason: string;
  evidenceId: string;
}

export interface GatewayResponse {
  correlationId: string;
  status:
    | 'success'
    | 'forbidden'
    | 'auth_failed'
    | 'authz_denied'
    | 'approval_pending'
    | 'approval_denied'
    | 'error';
  message: string;
  auditId: string;
  evidenceId?: string;
  approvalId?: string;
  plan?: ActionPlan;
  diff?: ManifestDiff;
  result?: AgentExecutionResult;
  simulationResult?: SimulationResult;
}

export interface GatewayConfig {
  jwt: JwtVerificationConfig;
  opaEndpoint: string;
  temporalEndpoint: string;
  openAiApiKey: string;
  /** Null only for the explicit development/test auto-approval stub. */
  approvalWorkflow: ApprovalWorkflowProbeConfig | null;
  /** Null only for the explicitly labelled development/test file sink. */
  evidenceLedger: EvidenceLedgerConfig | null;
  auditLogPath: string;
  approvalTimeoutMs: number;
}
