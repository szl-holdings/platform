import { z } from 'zod';
import type {
  ActionStatus,
  ExecutionMode,
  FabricLayer,
  MirrorEvalVerdict,
  PolicyEnforcement,
  ProofPacketKind,
  SignalSeverity,
  SignalStatus,
  OutcomeStatus,
  OperationalEvidenceState,
  Vertical,
  WorkcellStatus,
} from './types.js';

export type {
  Vertical,
  SignalSeverity,
  SignalStatus,
  OutcomeStatus,
  ActionStatus,
  PolicyEnforcement,
  WorkcellStatus,
  OperationalEvidenceState,
  ProofPacketKind,
  FabricLayer,
  MirrorEvalVerdict,
  ExecutionMode,
};

export interface BusinessSignal {
  id: string;
  vertical: Vertical;
  entity: string;
  title: string;
  description: string;
  severity: SignalSeverity;
  status: SignalStatus;
  businessImpact: string;
  evidenceRefs: string[];
  owner: string;
  detectedAt: string;
  updatedAt: string;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface Outcome {
  id: string;
  title: string;
  description: string;
  vertical: Vertical;
  status: OutcomeStatus;
  owner: string;
  targetDate: string;
  successMetric: string;
  currentValue?: number;
  targetValue?: number;
  unit?: string;
  linkedSignalIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ActionBrief {
  id: string;
  title: string;
  description: string;
  vertical: Vertical;
  status: ActionStatus;
  recommendedBy: string;
  assignedTo?: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  estimatedImpact: string;
  requiresApproval: boolean;
  approvalTier: 'auto' | 'operator' | 'executive' | 'board';
  linkedSignalIds: string[];
  linkedOutcomeIds: string[];
  proofPacketId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CovenantPolicy {
  id: string;
  name: string;
  description: string;
  vertical: Vertical | 'global';
  enforcement: PolicyEnforcement;
  conditions: Array<{
    field: string;
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
    value: unknown;
  }>;
  approvalRequirements?: {
    tier: 'operator' | 'executive' | 'board';
    quorum?: number;
  };
  active: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProofPacket {
  id: string;
  kind: ProofPacketKind;
  entityId: string;
  entityType: 'signal' | 'action' | 'outcome' | 'workcell' | 'policy';
  hash: string;
  previousHash?: string;
  payload: Record<string, unknown>;
  policyEvaluationId?: string;
  approvalRecordId?: string;
  witnessedBy: string[];
  issuedAt: string;
  vertical: Vertical | 'global';
}

export interface Workcell {
  id: string;
  name: string;
  vertical: Vertical;
  status: WorkcellStatus;
  evidenceState: OperationalEvidenceState;
  evidenceReason: string;
  objective: string;
  signals: string[];
  contextPack: Record<string, unknown>;
  agentSequence: Array<{
    agentId: string;
    role: string;
    action: string;
  }>;
  actionBrief: ActionBrief;
  mirrorEvalResult: MirrorEvalResult;
  pceContractId: string;
  requiresApproval: boolean;
  mockExecutionResult: Record<string, unknown>;
  verificationResult: {
    status: 'passed' | 'failed';
    checksum: string;
  };
  proofPacketId: string;
  executionTraceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionTrace {
  id: string;
  workcellId: string;
  runId: string;
  steps: Array<{
    stepId: string;
    name: string;
    tool: string;
    input: Record<string, unknown>;
    output: Record<string, unknown>;
    durationMs: number;
    status: 'ok' | 'error' | 'skipped';
    timestamp: string;
  }>;
  finalStatus: 'completed' | 'failed' | 'cancelled';
  durationMs: number;
  proofPacketId: string;
  startedAt: string;
  completedAt: string;
}

export interface MirrorEvalResult {
  id: string;
  targetId: string;
  targetType: 'action' | 'workcell' | 'signal';
  verdict: MirrorEvalVerdict;
  score: number;
  dimensions: Array<{
    name: string;
    score: number;
    rationale: string;
  }>;
  flags: string[];
  evaluatorModel: string;
  evaluatedAt: string;
}

export interface ProofCarryingExecutionContract {
  id: string;
  actionId: string;
  originSignalId: string;
  causalChainIds: string[];
  policyEvaluationId: string;
  approvalRecordId?: string;
  executionTraceId: string;
  proofPacketId: string;
  mode: ExecutionMode;
  isVerified: boolean;
  verifiedAt?: string;
  createdAt: string;
}

export interface BusinessTwin {
  id: string;
  vertical: Vertical;
  entity: string;
  entityType: string;
  currentState: Record<string, unknown>;
  lastSignalId: string;
  signalCount: number;
  activeOutcomes: number;
  pendingActions: number;
  coverageScore: number;
  updatedAt: string;
}

export interface Tool {
  id: string;
  name: string;
  category: string;
  description: string;
  vertical: Vertical | 'global';
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  governanceFlags: string[];
}

export interface Workcell {
  id: string;
  name: string;
  vertical: Vertical;
  status: WorkcellStatus;
  evidenceState: OperationalEvidenceState;
  evidenceReason: string;
  objective: string;
  signals: string[];
  contextPack: Record<string, unknown>;
  agentSequence: Array<{
    agentId: string;
    role: string;
    action: string;
  }>;
  actionBrief: ActionBrief;
  mirrorEvalResult: MirrorEvalResult;
  pceContractId: string;
  requiresApproval: boolean;
  mockExecutionResult: Record<string, unknown>;
  verificationResult: {
    status: 'passed' | 'failed';
    checksum: string;
  };
  proofPacketId: string;
  executionTraceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FabricStatus {
  layer: FabricLayer;
  status: 'healthy' | 'degraded' | 'offline';
  signalCount?: number;
  processingRateHz?: number;
  latencyMs?: number;
  lastHeartbeat: string;
}

export const VERTICAL_IDS = [
  'lyte-revenue',
  'vessels-maritime',
  'terra-real-estate',
  'aegis-defense',
  'prism-counsel',
  'carlota-jo',
  'alloy-core',
] as const;

export const businessSignalSchema = z.object({
  id: z.string(),
  vertical: z.enum(VERTICAL_IDS),
  entity: z.string(),
  title: z.string(),
  description: z.string(),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'info']),
  status: z.enum(['active', 'acknowledged', 'resolved', 'escalated', 'suppressed']),
  businessImpact: z.string(),
  evidenceRefs: z.array(z.string()),
  owner: z.string(),
  detectedAt: z.string(),
  updatedAt: z.string(),
  tags: z.array(z.string()),
  metadata: z.record(z.unknown()),
});

export const covenantPolicySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  vertical: z.enum([...VERTICAL_IDS, 'global']),
  enforcement: z.enum(['block', 'warn', 'log', 'require_approval']),
  active: z.boolean(),
  version: z.number(),
});
