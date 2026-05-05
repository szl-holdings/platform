export type OperatorId =
  | 'planner'
  | 'analyst'
  | 'risk'
  | 'proof'
  | 'action'
  | 'verification'
  | 'board-packet'
  | 'connector'
  | 'evaluator'
  | 'code'
  | 'carlota-diagnostic'
  | 'carlota-radar'
  | 'carlota-concierge';

export type ModelProvider = 'substrate' | 'openai' | 'deepseek' | 'nvidia' | 'huggingface' | 'local' | 'mock';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type ApprovalTier = 'auto' | 'operator' | 'executive' | 'board';

export type MirrorEvalDisposition =
  | 'pass'
  | 'pass_with_warning'
  | 'needs_more_evidence'
  | 'requires_human_review'
  | 'blocked';

export type WorkcellPhase =
  | 'intake'
  | 'planning'
  | 'context_building'
  | 'risk_review'
  | 'action_brief_created'
  | 'pce_contract_created'
  | 'approval_required'
  | 'approved'
  | 'executing'
  | 'verifying'
  | 'proven'
  | 'blocked'
  | 'rejected'
  | 'archived';

export type ErrorType =
  | 'auth'
  | 'validation'
  | 'policy'
  | 'approval_required'
  | 'rate_limit'
  | 'network'
  | 'config'
  | 'not_found'
  | 'conflict'
  | 'execution'
  | 'safety'
  | 'parse'
  | 'unknown';

export type ToolRiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';

export interface TraceEntry {
  traceId: string;
  runId: string;
  entityId: string;
  entityType: 'operator' | 'tool' | 'handoff' | 'approval' | 'model' | 'eval' | 'pce';
  name: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  status: 'ok' | 'error' | 'skipped' | 'blocked';
  errorMessage?: string;
  durationMs: number;
  tokensUsed?: number;
  costEstimateUsd?: number;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface ContextPack {
  packId: string;
  signalIds: string[];
  citations: Citation[];
  sources: ContextSource[];
  evidenceBudget: number;
  evidenceUsed: number;
  staleFields: string[];
  redactedFields: string[];
  builtAt: string;
}

export interface Citation {
  citationId: string;
  sourceId: string;
  excerpt: string;
  confidence: number;
  freshness: number;
}

export interface ContextSource {
  sourceId: string;
  kind: 'signal' | 'memory' | 'policy' | 'outcome' | 'proof';
  content: Record<string, unknown>;
  rank: number;
  freshness: number;
  isSensitive: boolean;
}

export interface MemoryEntry {
  memoryId: string;
  vertical: string;
  entityId: string;
  content: Record<string, unknown>;
  tags: string[];
  isSensitive: boolean;
  freshnessScore: number;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface MirrorEvalScore {
  dimension: string;
  score: number;
  rationale: string;
  flag?: string;
}

export interface MirrorEvalResult {
  evalId: string;
  targetId: string;
  targetType: 'action' | 'workcell' | 'signal' | 'pce';
  disposition: MirrorEvalDisposition;
  overallScore: number;
  scores: MirrorEvalScore[];
  flags: string[];
  evaluatedAt: string;
  evaluatorVersion: string;
}

export interface ApprovalRecord {
  approvalId: string;
  actionId: string;
  tier: ApprovalTier;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
  createdAt: string;
}

export interface PCEContract {
  contractId: string;
  actionId: string;
  workcellId?: string;
  originSignalIds: string[];
  causalChainIds: string[];
  policyEvaluationId: string;
  approvalRecordId?: string;
  mirrorEvalId: string;
  executionTraceId?: string;
  proofPacketId?: string;
  mode: 'demo' | 'governed' | 'autonomous' | 'supervised';
  isVerified: boolean;
  verifiedAt?: string;
  evidenceCoverage: number;
  blockedReason?: string;
  createdAt: string;
}

export interface ProofPacketRecord {
  packetId: string;
  contractId: string;
  actionId: string;
  entityId: string;
  hash: string;
  previousHash?: string;
  payload: Record<string, unknown>;
  witnessedBy: string[];
  issuedAt: string;
}

export interface OperatorOutput {
  operatorId: OperatorId;
  runId: string;
  actionId?: string;
  result: Record<string, unknown>;
  recommendation?: string;
  requiresHandoff?: boolean;
  handoffTo?: OperatorId;
  traceEntries: TraceEntry[];
  completedAt: string;
}

export interface PolicyEvaluation {
  evalId: string;
  policyIds: string[];
  actionId?: string;
  riskClass: string;
  passed: boolean;
  requiresApproval: boolean;
  approvalTier?: ApprovalTier;
  violations: string[];
  evaluatedAt: string;
}
