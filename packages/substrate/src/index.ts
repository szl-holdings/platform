/**
 * @szl/substrate — Sovereign Execution Substrate
 *
 * The single, opinionated execution runtime that every SZL product surface
 * (Lyte, Aegis, Vessels, Terra, PRISM Counsel, Carlota Jo) calls the same way.
 *
 * Primary entry points:
 *   defineWorkflow({ stages, policy, budget }) → WorkflowDefinition
 *   runtime.start(workflow, input, { mode })   → PipelineRun
 *
 * Modes: "live" | "dry-run" | "replay" | "counterfactual"
 *
 * Five stage primitives:
 *   Reason() | Retrieve() | ToolCall() | Verify() | Decide()
 *   + ApprovalGate() for policy-shaped graph topology
 *
 * @see docs/substrate/architecture.md for design rationale
 */

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  ExecutionMode,
  SideEffectCategory,
  StageType,
  StageRuntime,
  StagePriority,
  ReasonStage,
  RetrieveStage,
  ToolCallStage,
  VerifyStage,
  DecideStage,
  // Re-exported as ApprovalGateStage to avoid conflict with the ApprovalGate builder function
  ApprovalGate as ApprovalGateStage,
  AnyStage,
  ConfidenceBudget,
  PolicyProfile,
  WorkflowDefinition,
  CompiledGraph,
  CompiledStageNode,
  EvidenceBundle,
  StageResult,
  StageResultStatus,
  PipelineRun,
  PipelineRunStatus,
  RuntimeStartOptions,
  SubstrateHooks,
  StageExecutorFn,
  StageExecutorContext,
  CounterfactualDiff,
  StageDiff,
} from "./types.js";

// ─── Stage Primitive Factories ────────────────────────────────────────────────
// ApprovalGate is both a builder function and a stage type (aliased ApprovalGateStage above)
export {
  Reason,
  Retrieve,
  ToolCall,
  Verify,
  Decide,
  ApprovalGate,
  definePolicy,
  defineBudget,
} from "./stage-primitives.js";

// ─── Workflow Definition ──────────────────────────────────────────────────────

import type { WorkflowDefinition } from "./types.js";

/**
 * Define a workflow for execution on the Sovereign Execution Substrate.
 *
 * The compiler validates policy compliance at the call site — a Decide stage
 * with high-risk side effects without a reachable ApprovalGate will throw
 * SubstrateCompilerError immediately (not at runtime).
 *
 * @example
 * const workflow = defineWorkflow({
 *   id: "my-workflow",
 *   name: "My Workflow",
 *   stages: [
 *     Retrieve({ id: "fetch", name: "Fetch Data" }),
 *     Reason({ id: "analyze", name: "Analyze", dependsOn: ["fetch"] }),
 *     Verify({ id: "verify", name: "Verify", dependsOn: ["analyze"] }),
 *     ApprovalGate({ id: "gate", name: "Approval Gate", dependsOn: ["verify"] }),
 *     Decide({ id: "decide", name: "Decide", dependsOn: ["gate"],
 *              sideEffects: ["write-internal"], highRiskSideEffects: ["write-internal"] }),
 *   ],
 *   policy: definePolicy({ id: "my-policy", name: "My Policy" }),
 *   budget: defineBudget({ escalateAt: 0.5 }),
 * });
 */
export function defineWorkflow(def: WorkflowDefinition): WorkflowDefinition {
  // Eager validation — parse the definition to catch schema errors at call time
  // Full policy compliance is checked by compile() inside runtime.start()
  if (!def.id || !def.name) {
    throw new Error("[SubstrateWorkflow] Workflow must have id and name");
  }
  if (!def.stages || def.stages.length === 0) {
    throw new Error("[SubstrateWorkflow] Workflow must have at least one stage");
  }
  return def;
}

// ─── Runtime ──────────────────────────────────────────────────────────────────
export { SubstrateRuntime, defaultRuntime, registerWorkflow, lookupWorkflow, listWorkflows, clearWorkflowRegistry } from "./engine.js";
export type { SubstrateRuntimeOptions } from "./engine.js";

// ─── Compiler ─────────────────────────────────────────────────────────────────
export { compile, SubstrateCompilerError } from "./compiler.js";

// ─── Journal ──────────────────────────────────────────────────────────────────
export {
  SubstrateJournal,
  defaultJournal,
  defaultRunStore,
  hashValue,
  computeBundleHash,
  signBundleHash,
  verifyBundleSignature,
  modeLabel,
  runtimeEventBus,
} from "./journal.js";
export type {
  JournalStore,
  RunStore,
  SubstrateRuntimeEvent,
  SubstrateRuntimeEventType,
} from "./journal.js";

// ─── Budget Router ────────────────────────────────────────────────────────────
export {
  routeByBudget,
  validateFinalConfidence,
  aggregatePipelineConfidence,
} from "./budget-router.js";
export type { RoutingDecision } from "./budget-router.js";

// ─── Adapters ─────────────────────────────────────────────────────────────────
export {
  modelAdapterRegistry,
  retrieverAdapterRegistry,
  toolAdapterRegistry,
  resourceAdapterRegistry,
  policyAdapterRegistry,
  wireToolMeshAdapter,
  wirePolicyEngineAdapter,
} from "./adapters.js";
export type {
  ModelAdapter,
  ModelAdapterInput,
  ModelAdapterOutput,
  RetrieverAdapter,
  RetrieverAdapterInput,
  RetrievedDocument,
  ToolAdapter,
  ToolAdapterInput,
  ToolAdapterOutput,
  ResourceAdapter,
  ResourceAdapterInput,
  ResourceAdapterOutput,
  PolicyAdapter,
  PolicyAdapterInput,
  PolicyAdapterOutput,
  McpCapabilitySpec,
  McpToolDefinition,
  McpToolCall,
  McpToolResult,
} from "./adapters.js";

// ─── Telemetry ────────────────────────────────────────────────────────────────
export { SubstrateTelemetry, getRecentSpans, getRunSpans, getMetrics } from "./telemetry.js";
export type { SubstrateSpan } from "./telemetry.js";

// ─── Python Worker Channel ────────────────────────────────────────────────────
export {
  defaultPythonWorkerChannel,
  PYTHON_WORKER_PROTOCOL_VERSION,
  makeClaimMessage,
  makeHeartbeatMessage,
  makeResultMessage,
  makeErrorMessage,
} from "./python-worker.js";
export type {
  PythonWorkerMessage,
  PythonWorkerMessageType,
  PythonWorkerChannel,
  RegisteredWorker,
  StageClaimMessage,
  StageHeartbeatMessage,
  StageResultMessage,
  StageErrorMessage,
  WorkerRegisterMessage,
} from "./python-worker.js";

// ─── Replay ───────────────────────────────────────────────────────────────────
export {
  replay,
  formatDiff,
  handleReplayRequest,
  resolvePolicyProfileById,
  PolicyNotFoundError,
} from "./cli/replay.js";
export type { ReplayOptions, ReplayResult, ReplayEndpointRequest, ReplayEndpointResponse } from "./cli/replay.js";

// ─── Reference Workflows — Phase 1 ───────────────────────────────────────────
export {
  opportunityAuditWorkflow,
  runOpportunityAudit,
  registerLyteRetrieverAdapter,
  isLyteRetrieverRegistered,
} from "./workflows/opportunity-audit.js";
export type {
  OpportunityAuditInput,
  OpportunityAuditResult,
  AnomalyFinding,
  RemediationDecision,
} from "./workflows/opportunity-audit.js";

// ─── Reference Workflows — Phase 2 ───────────────────────────────────────────

export {
  crossSystemReconciliationWorkflow,
  runCrossSystemReconciliation,
} from "./workflows/cross-system-reconciliation.js";
export type {
  CrossSystemReconciliationInput,
  CrossSystemReconciliationResult,
  ReconciliationDiscrepancy,
  ReconciliationDecision,
} from "./workflows/cross-system-reconciliation.js";

export {
  executiveBriefWorkflow,
  runExecutiveBrief,
} from "./workflows/executive-brief.js";
export type {
  ExecutiveBriefInput,
  ExecutiveBriefOutput,
  BriefSection,
  ExecutiveBriefResult,
} from "./workflows/executive-brief.js";

export {
  riskEscalationWorkflow,
  runRiskEscalation,
} from "./workflows/risk-escalation.js";
export type {
  RiskEscalationInput,
  RiskEscalationResult,
  RiskSignalSummary,
  RiskEscalationDecision,
} from "./workflows/risk-escalation.js";

export {
  evidenceBasedRecommendationWorkflow,
  runEvidenceBasedRecommendation,
} from "./workflows/evidence-based-recommendation.js";
export type {
  EvidenceBasedRecommendationInput,
  EvidenceBasedRecommendationResult,
  EvidenceCitation,
  RecommendationDecisionPacket,
} from "./workflows/evidence-based-recommendation.js";

// ─── Vertical Workflow Packs — Phase 2 ───────────────────────────────────────

export {
  lyteOperationalDriftWorkflow,
  runLyteOperationalDrift,
} from "./workflows/lyte-operational-drift.js";
export type {
  LyteOperationalDriftInput,
  LyteOperationalDriftResult,
  DriftItem,
  OperationalDriftDecision,
} from "./workflows/lyte-operational-drift.js";

export {
  aegisThreatTriageWorkflow,
  runAegisThreatTriage,
} from "./workflows/aegis-threat-triage.js";
export type {
  AegisThreatTriageInput,
  AegisThreatTriageResult,
  TriagedThreat,
  ThreatTriageDecision,
} from "./workflows/aegis-threat-triage.js";

export {
  vesselsVoyageAnomalyWorkflow,
  runVesselsVoyageAnomaly,
} from "./workflows/vessels-voyage-anomaly.js";
export type {
  VesselsVoyageAnomalyInput,
  VesselsVoyageAnomalyResult,
  VoyageAnomaly,
  VoyageAnomalyDecision,
} from "./workflows/vessels-voyage-anomaly.js";

export {
  terraPortfolioAnomalyWorkflow,
  runTerraPortfolioAnomaly,
} from "./workflows/terra-portfolio-anomaly.js";
export type {
  TerraPortfolioAnomalyInput,
  TerraPortfolioAnomalyResult,
  PortfolioAnomaly,
  PortfolioAnomalyDecision,
} from "./workflows/terra-portfolio-anomaly.js";

export {
  prismCounselEvidencePackagingWorkflow,
  runPrismCounselEvidencePackaging,
} from "./workflows/prism-counsel-evidence-packaging.js";
export type {
  PrismCounselEvidencePackagingInput,
  PrismCounselEvidencePackagingResult,
  MatterDeadline,
  EvidencePackage,
  PrismCounselDecision,
} from "./workflows/prism-counsel-evidence-packaging.js";

export {
  carlotaJoTaskRoutingWorkflow,
  runCarlotaJoTaskRouting,
} from "./workflows/carlota-jo-task-routing.js";
export type {
  CarlotaJoTaskRoutingInput,
  CarlotaJoTaskRoutingResult,
  AdvisorMatch,
  TaskRoutingDecision,
} from "./workflows/carlota-jo-task-routing.js";

// ─── Version ──────────────────────────────────────────────────────────────────
export const SUBSTRATE_VERSION = "0.2.0" as const;
export const SUBSTRATE_PHASE = 2 as const;
