export type Vertical =
  | 'firestorm'
  | 'vessels'
  | 'terra'
  | 'lyte'
  | 'prism'
  | 'alloy'
  | 'carlota-jo';
export type RunStatus = 'running' | 'paused' | 'completed' | 'failed' | 'awaiting-approval';
export type PolicyStatus = 'compliant' | 'violated' | 'pending' | 'escalated';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type Perspective = 'executive' | 'operator' | 'analyst' | 'approver';
export type ApprovalVerdict = 'approved' | 'rejected' | 'escalated';
export type StageStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export type RetrieverSource = 'adapter' | 'synthetic' | 'inline' | 'dry-run';

export interface RetrieverSourceMeta {
  source: RetrieverSource;
  adapterId: string | null;
}

export interface RunStage {
  id: string;
  name: string;
  kind:
    | 'signal'
    | 'context'
    | 'recommendation'
    | 'simulation'
    | 'policy'
    | 'execution'
    | 'proof'
    | 'outcome'
    | 'learning';
  status: StageStatus;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  confidence: number | null;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  redacted: boolean;
  policyResult: PolicyEvalResult | null;
  evidenceRefs: EvidenceRef[];
  traceSpanId: string | null;
}

export interface PolicyEvalResult {
  policyId: string;
  policyName: string;
  result: 'pass' | 'fail' | 'warn';
  blockedReason: string | null;
  requiresApproval: boolean;
  violatedPolicies: string[];
}

export interface EvidenceRef {
  refId: string;
  source: string;
  sourceType: 'document' | 'signal' | 'api' | 'agent' | 'human' | 'sensor';
  content: string;
  relevanceScore: number;
  timestamp: string;
  citations: Citation[];
}

export interface Citation {
  id: string;
  text: string;
  confidence: number;
  sourceUrl?: string;
}

export interface TraceSpan {
  spanId: string;
  parentSpanId: string | null;
  operationName: string;
  service: string;
  startTime: string;
  durationMs: number;
  tags: Record<string, string>;
  status: 'ok' | 'error' | 'unset';
}

export interface ApprovalEvent {
  id: string;
  runId: string;
  stageId: string;
  actor: string;
  verdict: ApprovalVerdict;
  justification: string;
  timestamp: string;
  proofRef: string;
  riskLevel: RiskLevel;
  policyId: string;
}

export interface RollbackCheckpoint {
  id: string;
  runId: string;
  stageId: string;
  capturedAt: string;
  worldStateHash: string;
  description: string;
  restorable: boolean;
}

export interface SubstrateRun {
  id: string;
  workflow: string;
  vertical: Vertical;
  tenant: string;
  status: RunStatus;
  currentStage: string;
  confidence: number;
  policyStatus: PolicyStatus;
  riskLevel: RiskLevel;
  approver: string | null;
  startedAt: string;
  ageMs: number;
  stages: RunStage[];
  approvalHistory: ApprovalEvent[];
  checkpoints: RollbackCheckpoint[];
  traceSpans: TraceSpan[];
  modelAdapter: string;
  policyProfile: string;
  agentId: string;
  objectiveText: string;
  retriever: RetrieverSourceMeta | null;
}

export interface CounterfactualInput {
  originalRunId: string;
  modelAdapter: string;
  policyProfile: string;
}

export interface CounterfactualDiff {
  runId: string;
  originalRunId: string;
  modelAdapter: string;
  policyProfile: string;
  replayedAt: string;
  stages: Array<{
    stageName: string;
    original: {
      recommendation: string;
      confidence: number;
      keyEvidence: string[];
      policyResult: 'pass' | 'fail' | 'warn';
      requiresApproval: boolean;
    };
    counterfactual: {
      recommendation: string;
      confidence: number;
      keyEvidence: string[];
      policyResult: 'pass' | 'fail' | 'warn';
      requiresApproval: boolean;
    };
    changed: boolean;
  }>;
}

export interface PendingApproval {
  id: string;
  runId: string;
  workflow: string;
  vertical: Vertical;
  tenant: string;
  riskLevel: RiskLevel;
  policyId: string;
  policyName: string;
  action: string;
  requestedAt: string;
  requestedBy: string;
  ageMs: number;
  objectiveText: string;
  evidenceSummary: string;
}
