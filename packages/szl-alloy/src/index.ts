export * from "./types.js";
export * from "./evidence.js";
export * from "./confidence.js";
export * from "./session.js";
export { recommend, type RecommendParams } from "./recommend.js";
export { run, type RunOptions, type AlloyRunHandle } from "./run.js";

export {
  RunManager,
  type RunManagerOptions,
} from "@workspace/alloy/run-manager";
export type {
  RunConfig,
  RunState,
  RunStatus,
  WorkflowStep,
  StepContext,
  StepResult,
  ApprovalGate,
} from "@workspace/alloy/types";
export { InMemoryCheckpointStore, createCheckpoint } from "@workspace/alloy/checkpoint";
export { InMemoryActionLedger, makeLedgerEntry, defaultLedger } from "@workspace/alloy/ledger";

export {
  type Policy,
  type PolicyRule,
  type EvaluationRequest,
  type PolicyEvaluationResult,
  evaluatePolicies,
  checkAction,
  registerPolicy,
  unregisterPolicy,
  getRegisteredPolicies,
} from "@szl-holdings/policy-engine";

export {
  type Recommendation,
  type Signal,
  type BusinessImpact,
  type DecisionEngineResult,
  scoreConfidence,
  scoreBusinessImpact,
  scoreUrgency,
  rankSignalGroups,
  evaluateSignalBatch,
} from "@szl-holdings/decision-engine";

export {
  TraceWriter,
  type TraceRecord,
  InMemoryTraceStore,
} from "@workspace/trace-graph";

export {
  type MemoryEntry,
  type MemoryType,
  InMemoryStore as InMemoryMemoryStore,
} from "@workspace/memory-fabric";

export const ALLOY_VERSION = "1.0.0" as const;
