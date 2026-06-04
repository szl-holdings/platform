export type AutonomyLevel =
  | 'observe_only'
  | 'recommend_only'
  | 'draft_only'
  | 'execute_approved'
  | 'full_demo_autopilot';

export const AUTONOMY_LEVELS: Record<AutonomyLevel, { label: string; description: string; color: string }> = {
  observe_only: {
    label: 'Observe only',
    description: 'A11oy watches, logs signals, and builds context — no output produced',
    color: '#64748b',
  },
  recommend_only: {
    label: 'Recommend only',
    description: 'A11oy surfaces recommendations with full evidence; humans decide and act',
    color: '#8b7ac8',
  },
  draft_only: {
    label: 'Draft only',
    description: 'A11oy drafts Action Briefs and content for human review before any step proceeds',
    color: '#0ea5e9',
  },
  execute_approved: {
    label: 'Execute approved actions',
    description: 'A11oy executes actions that have received explicit human approval',
    color: '#d4a054',
  },
  full_demo_autopilot: {
    label: 'Full demo autopilot',
    description: 'Demo mode only — A11oy runs the complete flow with mock results (no real execution)',
    color: '#22c55e',
  },
};

export type OperatorId =
  | 'planner'
  | 'analyst'
  | 'risk'
  | 'proof'
  | 'action'
  | 'verification'
  | 'board_packet'
  | 'connector'
  | 'evaluator';

export type RiskCategory =
  | 'informational'
  | 'internal_draft'
  | 'workflow_update'
  | 'financial_action'
  | 'customer_facing'
  | 'legal_or_compliance'
  | 'security_action'
  | 'data_destructive'
  | 'executive_escalation';

export type MirrorEvalDisposition =
  | 'pass'
  | 'pass_with_warning'
  | 'needs_more_evidence'
  | 'requires_human_review'
  | 'blocked';

export type WorkcellStatus =
  | 'intake'
  | 'planning'
  | 'context_building'
  | 'risk_review'
  | 'action_brief_created'
  | 'approval_required'
  | 'approved'
  | 'executing'
  | 'verifying'
  | 'proven'
  | 'blocked'
  | 'rejected'
  | 'archived';

export type ToolRisk = 'read_only' | 'low' | 'medium' | 'high' | 'critical';

export interface MirrorEvalScore {
  groundedness: number;
  evidenceCoverage: number;
  policyCompliance: number;
  unsafeAutonomyRisk: number;
  hallucinationRisk: number;
  businessImpactClarity: number;
  actionSpecificity: number;
  verificationReadiness: number;
  staleContextRisk: number;
  approvalCorrectness: number;
  overallScore: number;
  disposition: MirrorEvalDisposition;
  warnings: string[];
  runAt: string;
}

export interface ContextCitation {
  id: string;
  label: string;
  source: string;
  capturedAt: string;
  freshnessScore: number;
  isStale: boolean;
  content: string;
  confidence: number;
  redacted: boolean;
}

export interface ContextPack {
  id: string;
  workcellId: string;
  mode: 'compact' | 'balanced' | 'deep_context';
  citations: ContextCitation[];
  tokenBudget: number;
  tokensUsed: number;
  buildAt: string;
  staleCount: number;
  redactedCount: number;
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  risk: ToolRisk;
  requiresApproval: boolean;
  requiresAudit: boolean;
  allowedVerticals: string[];
  allowedOperators: OperatorId[];
  category: string;
  schema: Record<string, unknown>;
  demoBehavior: string;
  mockResult: unknown;
  errorState: string;
}

export interface AgentCall {
  operatorId: OperatorId;
  operatorName: string;
  startedAt: string;
  completedAt: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  latencyMs: number;
  success: boolean;
  output: string;
}

export interface ToolCall {
  toolId: string;
  toolName: string;
  risk: ToolRisk;
  approvalRequired: boolean;
  approvalStatus: 'not_required' | 'pending' | 'approved' | 'rejected';
  calledAt: string;
  latencyMs: number;
  result: unknown;
  auditRef: string;
}

export interface ExecutionTrace {
  id: string;
  workcellId: string;
  steps: TraceStep[];
  totalTokens: number;
  totalCostUsd: number;
  totalLatencyMs: number;
  startedAt: string;
  completedAt: string | null;
}

export interface TraceStep {
  id: string;
  type: 'agent_call' | 'tool_call' | 'approval_gate' | 'handoff' | 'eval' | 'memory_read' | 'memory_write';
  operatorId?: OperatorId;
  toolId?: string;
  label: string;
  startedAt: string;
  completedAt: string;
  latencyMs: number;
  tokens?: number;
  costUsd?: number;
  status: 'success' | 'warning' | 'failure' | 'blocked' | 'pending';
  detail: string;
  evidenceRefs: string[];
}

export interface ActionBrief {
  id: string;
  workcellId: string;
  title: string;
  objective: string;
  proposedActions: ProposedAction[];
  riskCategory: RiskCategory;
  estimatedImpact: string;
  requiredApproverRole: string;
  mirrorEval: MirrorEvalScore;
  createdAt: string;
  expiresAt: string;
}

export interface ProposedAction {
  id: string;
  tool: string;
  description: string;
  riskLevel: ToolRisk;
  requiresApproval: boolean;
  expectedOutcome: string;
}

export interface ProofPacket {
  id: string;
  workcellId: string;
  title: string;
  executionSummary: string;
  agentTrace: AgentCall[];
  toolCalls: ToolCall[];
  approvalChain: ApprovalRecord[];
  verificationResult: VerificationResult;
  evidenceCoverage: number;
  provenAt: string;
  hashDigest: string;
}

export interface ApprovalRecord {
  id: string;
  requestedAt: string;
  approvedAt: string | null;
  approverRole: string;
  approverName: string;
  decision: 'pending' | 'approved' | 'rejected';
  note: string;
}

export interface VerificationResult {
  passed: boolean;
  checkedAt: string;
  checks: Array<{ name: string; passed: boolean; detail: string }>;
  verifiedBy: OperatorId;
}

export interface A11oyOperator {
  id: OperatorId;
  name: string;
  description: string;
  instructions: string;
  allowedTools: string[];
  blockedTools: string[];
  requiredPolicies: string[];
  maxAutonomyLevel: AutonomyLevel;
  allowedHandoffTargets: OperatorId[];
  inputSchema: Record<string, string>;
  outputSchema: Record<string, string>;
  trustScore: OperatorTrustScore;
}

export interface OperatorTrustScore {
  overall: number;
  groundedness: number;
  evidenceCoverage: number;
  approvalCorrectness: number;
  lowHallucinationScore: number;
  successfulVerification: number;
  lowRollbackRate: number;
  computedAt: string;
}

export interface Workcell {
  id: string;
  title: string;
  domain: string;
  vertical: string;
  status: WorkcellStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  signals: WorkcellSignal[];
  contextPack: ContextPack;
  operatorSequence: OperatorId[];
  actionBrief: ActionBrief | null;
  approvalStatus: 'not_required' | 'pending' | 'approved' | 'rejected';
  executionResult: ExecutionResult | null;
  verificationResult: VerificationResult | null;
  proofPacket: ProofPacket | null;
  executionTrace: ExecutionTrace;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  failureReason: string | null;
  retryRecommendation: string | null;
  totalCostUsd: number;
  totalLatencyMs: number;
}

export interface WorkcellSignal {
  id: string;
  label: string;
  source: string;
  value: string;
  severity: 'info' | 'warning' | 'critical';
  capturedAt: string;
}

export interface ExecutionResult {
  success: boolean;
  summary: string;
  toolResults: Array<{ toolId: string; result: string; success: boolean }>;
  completedAt: string;
}

export interface Skill {
  id: string;
  name: string;
  objective: string;
  requiredInputs: string[];
  allowedTools: string[];
  blockedTools: string[];
  policies: string[];
  expectedOutputs: string[];
  evalCriteria: string[];
  domain: string;
  estimatedDurationMs: number;
}

export interface ModelProvider {
  id: string;
  name: string;
  envKey: string;
  isAvailable: boolean;
  reasoningModel: string;
  fastModel: string;
  costPer1kTokens: number;
  latencyProfile: 'fast' | 'medium' | 'slow';
  isMock: boolean;
}

export interface MemoryHealth {
  tier: string;
  totalEntries: number;
  freshEntries: number;
  staleEntries: number;
  redactedEntries: number;
  compactedEntries: number;
  freshnessScore: number;
  lastCompactionAt: string;
  policyAdherence: number;
}
