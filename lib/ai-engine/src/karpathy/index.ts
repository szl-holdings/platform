export {
  type ResidualContribution,
  type ResidualState,
  type ResidualStreamResult,
  type ResidualAuditEntry,
  residualStream,
} from './residual-stream.js';

export {
  type AutonomyLevel,
  type AutonomyDepthProfile,
  resolveAutonomyDepth,
  inferDepthFromQuery,
  getAllDepthProfiles,
  getDepthLabel,
} from './autonomy-depth.js';

export {
  type GateVerdict,
  type GateResult,
  type GateAuditEntry,
  runThinkGate,
  runSimplicityGate,
  runSurgicalScopeGate,
  runGoalVerificationGate,
  runAllGates,
  getGateAuditLog,
  getGateStats,
} from './gates.js';

export {
  type ChainExecutionRecord,
  type DistilledAgent,
  type DistillationCandidate,
  type DistillationStats,
  distillationEngine,
} from './distillation-engine.js';

export {
  type EphemeralTrace,
  type EphemeralStep,
  type EphemeralReasoningResult,
  type EphemeralReasoningOptions,
  setEphemeralReasoningCaller,
  runEphemeralReasoning,
  getEphemeralTrace,
  getEphemeralTraceBySessionId,
  garbageCollectTraces,
  getEphemeralStats,
} from './ephemeral-reasoning.js';

export {
  type KnowledgeEntry,
  type ConsolidationResult,
  type KnowledgeDensityMetric,
  selfDistillingKB,
} from './self-distilling-kb.js';
