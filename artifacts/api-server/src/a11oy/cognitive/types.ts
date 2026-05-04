import { randomUUID } from 'node:crypto';

export const COGNITIVE_PHASES = [
  'INGEST',
  'NORMALIZE',
  'RETRIEVE',
  'PLAN',
  'REASON',
  'APPROVE',
  'EXECUTE',
  'VERIFY',
  'AUDIT',
  'DELIVER',
] as const;

export type CognitivePhase = (typeof COGNITIVE_PHASES)[number];

export type ScoringMode = 'latency' | 'cost' | 'confidence' | 'balanced' | 'sla';

export type WorkerStatus = 'active' | 'draining' | 'drained' | 'offline' | 'error';

export type GuardRule =
  | 'json_schema_too_large'
  | 'nesting_too_deep'
  | 'regex_too_large'
  | 'grammar_too_large'
  | 'whitespace_pattern_too_large';

export type RuntimeEventType =
  | 'route.decided'
  | 'phase.started'
  | 'phase.completed'
  | 'phase.failed'
  | 'memory.hit'
  | 'memory.miss'
  | 'memory.reuse'
  | 'memory.invalidated'
  | 'guard.rejected'
  | 'worker.registered'
  | 'worker.drained'
  | 'worker.heartbeat'
  | 'proof.created'
  | 'proof.sealed'
  | 'deployment.created'
  | 'deployment.activated'
  | 'sla.breach'
  | 'sla.warning';

export interface CognitiveWorker {
  workerId: string;
  tenantId: string;
  name: string;
  rolloutGroup: string;
  configChecksum: string;
  capabilities: string[];
  tags?: string[];
  status: WorkerStatus;
  isDraining: boolean;
  drainedAt?: string;
  lastHeartbeatAt?: string;
  uptimeSeconds: number;
  requestsHandled: number;
  errorsCount: number;
  avgLatencyMs?: number;
  registeredAt: string;
}

export interface RouteDecision {
  routeDecisionId: string;
  requestId: string;
  tenantId: string;
  workerId?: string;
  selectedModel: string;
  selectedProvider: string;
  scoringMode: ScoringMode;
  latencyScore?: number;
  costScore?: number;
  confidenceScore?: number;
  compositeScore?: number;
  isFallback: boolean;
  fallbackReason?: string;
  candidatesEvaluated: number;
  estimatedLatencyMs?: number;
  estimatedCostUsd?: number;
  domain?: string;
  sensitivityTier: string;
  decidedAt: string;
}

export interface SlaConstraints {
  maxLatencyMs?: number;
  maxCostUsd?: number;
  minConfidence?: number;
  sensitivityTier?: string;
  requireApproval?: boolean;
  preferredScoringMode?: ScoringMode;
}

export interface SlaRoute {
  model: string;
  provider: string;
  scoringMode: ScoringMode;
  estimatedLatencyMs: number;
  estimatedCostUsd: number;
}

export interface SlaPlan {
  primaryRoute: SlaRoute;
  fallbackRoute?: SlaRoute;
  approvalRequired: boolean;
  explanation: string;
  warnings: string[];
  slaBreachRisk: 'low' | 'medium' | 'high';
}

export type PhaseFailureClass = 'timeout' | 'model_error' | 'policy_block' | 'guard_rejection' | 'upstream_error' | 'none';

export type ProofApprovalStatus = 'not_required' | 'pending' | 'approved' | 'rejected' | 'auto_approved';

export interface PhaseResult {
  phaseRunId: string;
  requestId: string;
  tenantId: string;
  phase: CognitivePhase;
  phaseIndex: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'timeout';
  latencyMs?: number;
  retryCount: number;
  failureClass: PhaseFailureClass;
  failureDetail?: string;
  startedAt?: string;
  completedAt?: string;
  telemetry: Record<string, unknown>;
}

export interface CognitiveRequest {
  requestId: string;
  tenantId: string;
  domain?: string;
  prompt: string;
  slaConstraints?: SlaConstraints;
  outputConstraints?: OutputConstraints;
  metadata?: Record<string, unknown>;
}

export interface CognitiveResponse {
  requestId: string;
  routeDecisionId: string;
  proofChainId: string;
  model: string;
  provider: string;
  workerId?: string;
  createdAt: string;
  completedAt: string;
  latencyMs: number;
  costEstimate?: number;
  confidenceScore: number;
  riskScore: number;
  approvalStatus: string;
  sourceCount: number;
  memoryHitCount: number;
  phases: PhaseResult[];
  output?: unknown;
}

export interface OutputConstraints {
  jsonSchema?: unknown;
  regex?: string;
  grammar?: string;
  whitespacePattern?: string;
}

export interface GuardResult {
  passed: boolean;
  rejections: GuardRejection[];
}

export interface GuardRejection {
  rejectionId: string;
  guardRule: GuardRule;
  violatedLimit: string;
  actualSize?: number;
  maxAllowed?: number;
  redactedSnippet?: string;
}

export interface MemoryLookupResult {
  hit: boolean;
  contextReuseScore: number;
  overlapScore: number;
  freshnessScore: number;
  memoryKey: string;
  tokensSaved?: number;
  data?: unknown;
}

export interface ProofChainRecord {
  proofChainId: string;
  requestId: string;
  tenantId: string;
  routeDecisionId?: string;
  workerId?: string;
  model?: string;
  provider?: string;
  approvalStatus: ProofApprovalStatus;
  confidenceScore?: number;
  riskScore?: number;
  latencyMs?: number;
  costEstimateUsd?: number;
  sourceCount: number;
  memoryHitCount: number;
  phaseCount: number;
  completedPhases: string[];
  auditHash: string;
  lineage: unknown[];
  executionSucceeded: boolean;
  failureReason?: string;
  sealedAt?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface RuntimeEvent {
  eventId: string;
  tenantId: string;
  requestId?: string;
  routeDecisionId?: string;
  workerId?: string;
  proofChainId?: string;
  correlationId?: string;
  causationId?: string;
  eventType: RuntimeEventType;
  payload: Record<string, unknown>;
  occurredAt: string;
  isReplayed?: boolean;
}

export interface CognitiveDeploymentRequest {
  deploymentId: string;
  tenantId: string;
  name: string;
  description?: string;
  deploymentType: 'model' | 'worker' | 'config' | 'policy' | 'guard' | 'phase_engine';
  targetRolloutGroup: string;
  newConfigChecksum: string;
  previousConfigChecksum?: string;
  approvalRequired: boolean;
  metadata?: Record<string, unknown>;
}

export function newId(prefix: string): string {
  return `${prefix}-${randomUUID().replace(/-/g, '').slice(0, 12)}`;
}
