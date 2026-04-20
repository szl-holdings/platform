export * from "./types.js";
export * from "./checkpoint.js";
export {
  PostgresCheckpointStore,
  type PostgresCheckpointStoreOptions,
  type PostgresCheckpointStoreLogger,
  type OrchestrationCheckpointsTableLike,
} from "./postgres-checkpoint-store.js";
export { run, type CognitiveRuntimeOptions, type RunResult } from "./orchestrator.js";

export { perceivePhase, type PerceiveOutput } from "./phases/perceive.js";
export { orientPhase, type OrientPhaseOptions, type OrientOutput } from "./phases/orient.js";
export { planPhase, type PlanPhaseOptions, type PlanPhaseOutput } from "./phases/plan.js";
export {
  executePhase,
  GuardianDecisionEngine,
  type ExecutePhaseOptions,
  type ExecutePhaseOutput,
  type StepExecutorFn,
} from "./phases/execute.js";
export { verifyPhase, type VerifyPhaseOptions, type VerifyPhaseOutput } from "./phases/verify.js";
export { reflectPhase, type ReflectPhaseOptions, type ReflectPhaseOutput } from "./phases/reflect.js";
export {
  updatePhase,
  updateSelfModelPhase,
  updateMemoryPhase,
  type UpdatePhaseOptions,
  type UpdatePhaseOutput,
  type UpdateSelfModelPhaseOutput,
  type UpdateMemoryPhaseOutput,
} from "./phases/update.js";

export {
  generateExecutiveBrief,
  type ExecutiveBrief,
} from "./brief.js";

export {
  extractApprovalInterrupt,
  raiseApprovalInterrupt,
  resolveApprovalInterrupt,
  buildResumeContext,
  type ApprovalInterruptSpec,
  type ApprovalRequest,
  type ApprovalDecision,
  type RaiseApprovalInterruptOptions,
  type ResolveApprovalInterruptOptions,
} from "./approval-interrupt.js";

export const COGNITIVE_RUNTIME_VERSION = "1.0.0" as const;
