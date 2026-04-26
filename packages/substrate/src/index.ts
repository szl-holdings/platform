/**
 * @szl/substrate — Sovereign Execution Substrate
 *
 * The single, opinionated execution runtime that every SZL product surface
 * (Lyte, Aegis, Vessels, Terra, Counsel, Carlota Jo) calls the same way.
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

// ─── Stage Primitive Factories ────────────────────────────────────────────────
// ApprovalGate is both a builder function and a stage type (aliased ApprovalGateStage above)
export {
  ApprovalGate,
  Decide,
  defineBudget,
  definePolicy,
  Reason,
  Retrieve,
  ToolCall,
  Verify,
} from './stage-primitives.js';
// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  AnyStage,
  // Re-exported as ApprovalGateStage to avoid conflict with the ApprovalGate builder function
  ApprovalGate as ApprovalGateStage,
  CompiledGraph,
  CompiledStageNode,
  ConfidenceBudget,
  CounterfactualDiff,
  DecideStage,
  EvidenceBundle,
  ExecutionMode,
  PipelineRun,
  PipelineRunStatus,
  PolicyProfile,
  ReasonStage,
  RetrieveStage,
  RuntimeStartOptions,
  SideEffectCategory,
  StageDiff,
  StageExecutorContext,
  StageExecutorFn,
  StagePriority,
  StageResult,
  StageResultStatus,
  StageRuntime,
  StageType,
  SubstrateHooks,
  ToolCallStage,
  VerifyStage,
  WorkflowDefinition,
} from './types.js';

// ─── Workflow Definition ──────────────────────────────────────────────────────

import type { WorkflowDefinition } from './types.js';

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
    throw new Error('[SubstrateWorkflow] Workflow must have id and name');
  }
  if (!def.stages || def.stages.length === 0) {
    throw new Error('[SubstrateWorkflow] Workflow must have at least one stage');
  }
  return def;
}

export type {
  McpCapabilitySpec,
  McpToolCall,
  McpToolDefinition,
  McpToolResult,
  ModelAdapter,
  ModelAdapterInput,
  ModelAdapterOutput,
  PolicyAdapter,
  PolicyAdapterInput,
  PolicyAdapterOutput,
  ResourceAdapter,
  ResourceAdapterInput,
  ResourceAdapterOutput,
  RetrievedDocument,
  RetrieverAdapter,
  RetrieverAdapterInput,
  ToolAdapter,
  ToolAdapterInput,
  ToolAdapterOutput,
} from './adapters.js';
// ─── Adapters ─────────────────────────────────────────────────────────────────
export {
  modelAdapterRegistry,
  policyAdapterRegistry,
  resourceAdapterRegistry,
  retrieverAdapterRegistry,
  toolAdapterRegistry,
  wirePolicyEngineAdapter,
  wireToolMeshAdapter,
} from './adapters.js';
export type { RoutingDecision } from './budget-router.js';
// ─── Budget Router ────────────────────────────────────────────────────────────
export {
  aggregatePipelineConfidence,
  routeByBudget,
  validateFinalConfidence,
} from './budget-router.js';
export type {
  ReplayEndpointRequest,
  ReplayEndpointResponse,
  ReplayOptions,
  ReplayResult,
} from './cli/replay.js';
// ─── Replay ───────────────────────────────────────────────────────────────────
export {
  formatDiff,
  handleReplayRequest,
  PolicyNotFoundError,
  replay,
  resolvePolicyProfileById,
} from './cli/replay.js';
// ─── Compiler ─────────────────────────────────────────────────────────────────
export { compile, SubstrateCompilerError } from './compiler.js';
export type { SubstrateRuntimeOptions } from './engine.js';
// ─── Runtime ──────────────────────────────────────────────────────────────────
export {
  clearWorkflowRegistry,
  defaultRuntime,
  listWorkflows,
  lookupWorkflow,
  registerWorkflow,
  SubstrateRuntime,
} from './engine.js';
export type {
  JournalStore,
  RunStore,
  SubstrateRuntimeEvent,
  SubstrateRuntimeEventType,
} from './journal.js';
// ─── Journal ──────────────────────────────────────────────────────────────────
export {
  computeBundleHash,
  defaultJournal,
  defaultRunStore,
  hashValue,
  modeLabel,
  runtimeEventBus,
  SubstrateJournal,
  signBundleHash,
  verifyBundleSignature,
} from './journal.js';
export type {
  PythonWorkerChannel,
  PythonWorkerMessage,
  PythonWorkerMessageType,
  RegisteredWorker,
  StageClaimMessage,
  StageErrorMessage,
  StageHeartbeatMessage,
  StageResultMessage,
  WorkerRegisterMessage,
} from './python-worker.js';
// ─── Python Worker Channel ────────────────────────────────────────────────────
export {
  defaultPythonWorkerChannel,
  makeClaimMessage,
  makeErrorMessage,
  makeHeartbeatMessage,
  makeResultMessage,
  PYTHON_WORKER_PROTOCOL_VERSION,
} from './python-worker.js';
export type { SubstrateSpan } from './telemetry.js';
// ─── Telemetry ────────────────────────────────────────────────────────────────
export { getMetrics, getRecentSpans, getRunSpans, SubstrateTelemetry } from './telemetry.js';
export type {
  AnomalyFinding,
  OpportunityAuditInput,
  OpportunityAuditResult,
  RemediationDecision,
} from './workflows/opportunity-audit.js';
// ─── Reference Workflows — Phase 1 ───────────────────────────────────────────
export {
  isLyteRetrieverRegistered,
  opportunityAuditWorkflow,
  registerLyteRetrieverAdapter,
  runOpportunityAudit,
} from './workflows/opportunity-audit.js';

// ─── Reference Workflows — Phase 2 ───────────────────────────────────────────

export type {
  CrossSystemReconciliationInput,
  CrossSystemReconciliationResult,
  ReconciliationDecision,
  ReconciliationDiscrepancy,
} from './workflows/cross-system-reconciliation.js';
export {
  crossSystemReconciliationWorkflow,
  runCrossSystemReconciliation,
} from './workflows/cross-system-reconciliation.js';
export type {
  EvidenceBasedRecommendationInput,
  EvidenceBasedRecommendationResult,
  EvidenceCitation,
  RecommendationDecisionPacket,
} from './workflows/evidence-based-recommendation.js';
export {
  evidenceBasedRecommendationWorkflow,
  runEvidenceBasedRecommendation,
} from './workflows/evidence-based-recommendation.js';
export type {
  BriefSection,
  ExecutiveBriefInput,
  ExecutiveBriefOutput,
  ExecutiveBriefResult,
} from './workflows/executive-brief.js';
export {
  executiveBriefWorkflow,
  runExecutiveBrief,
} from './workflows/executive-brief.js';
export type {
  RiskEscalationDecision,
  RiskEscalationInput,
  RiskEscalationResult,
  RiskSignalSummary,
} from './workflows/risk-escalation.js';
export {
  riskEscalationWorkflow,
  runRiskEscalation,
} from './workflows/risk-escalation.js';

// ─── Vertical Workflow Packs — Phase 2 ───────────────────────────────────────

export type {
  AegisThreatTriageInput,
  AegisThreatTriageResult,
  ThreatTriageDecision,
  TriagedThreat,
} from './workflows/aegis-threat-triage.js';
export {
  aegisThreatTriageWorkflow,
  runAegisThreatTriage,
} from './workflows/aegis-threat-triage.js';
export type {
  AdvisorMatch,
  CarlotaJoTaskRoutingInput,
  CarlotaJoTaskRoutingResult,
  TaskRoutingDecision,
} from './workflows/carlota-jo-task-routing.js';
export {
  carlotaJoTaskRoutingWorkflow,
  runCarlotaJoTaskRouting,
} from './workflows/carlota-jo-task-routing.js';
export type {
  DriftItem,
  LyteOperationalDriftInput,
  LyteOperationalDriftResult,
  OperationalDriftDecision,
} from './workflows/lyte-operational-drift.js';
export {
  lyteOperationalDriftWorkflow,
  runLyteOperationalDrift,
} from './workflows/lyte-operational-drift.js';
export type {
  EvidencePackage,
  MatterDeadline,
  PrismCounselDecision,
  PrismCounselEvidencePackagingInput,
  PrismCounselEvidencePackagingResult,
} from './workflows/prism-counsel-evidence-packaging.js';
export {
  prismCounselEvidencePackagingWorkflow,
  runPrismCounselEvidencePackaging,
} from './workflows/prism-counsel-evidence-packaging.js';
export type {
  PortfolioAnomaly,
  PortfolioAnomalyDecision,
  TerraPortfolioAnomalyInput,
  TerraPortfolioAnomalyResult,
} from './workflows/terra-portfolio-anomaly.js';
export {
  runTerraPortfolioAnomaly,
  terraPortfolioAnomalyWorkflow,
} from './workflows/terra-portfolio-anomaly.js';
export type {
  VesselsVoyageAnomalyInput,
  VesselsVoyageAnomalyResult,
  VoyageAnomaly,
  VoyageAnomalyDecision,
} from './workflows/vessels-voyage-anomaly.js';
export {
  runVesselsVoyageAnomaly,
  vesselsVoyageAnomalyWorkflow,
} from './workflows/vessels-voyage-anomaly.js';

// ─── Version ──────────────────────────────────────────────────────────────────
export const SUBSTRATE_VERSION = '0.2.0' as const;
export const SUBSTRATE_PHASE = 2 as const;
