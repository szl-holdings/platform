export {
  NuroMeshOrchestrator,
  nuroMeshOrchestrator,
  AGENT_REGISTRY,
  DOMAIN_ROUTING_RULES,
  routeToAgents,
  callAgent,
  runMakerChecker,
  getSharedContext,
} from "./nuro-mesh.js";

export type { AgentDefinition, DomainRoutingRule, ValidationResult, AgentCallResult, RAGChunk, ToolDefinition, DomainAgentConfig } from "./types.js";

export { RAGPipeline, chunkText } from "./rag-pipeline.js";

export { DomainAgentRunner, getOrCreateConversation, MAX_TOOL_ROUNDS, type ConversationMessage, type ChatInterface } from "./domain-agent-runner.js";

export { routeModel, getModelSlots, getRouteConfig, type RouteClass, type ModelSlot, type RouteResult } from "./providers/hf-router.js";
export {
  routerCall,
  checkTenantPolicy,
  getRouterConfig,
  registerTelemetryHandler,
  type RouterCallOptions,
  type RouterCallResult,
  type ModelRouterTelemetry,
  type TenantFeatureToggles,
  type RouterConfig,
} from "./model-router.js";
export { chatCompletion, chatCompletionWithFallback, structuredCompletion, type HFChatMessage, type HFToolDef, type HFCompletionResult } from "./providers/hf-client.js";

export { type ActionDecision, type EvidenceItem, type DecisionMetadata, type AuditRecord, ACTION_DECISION_SCHEMA, validateActionDecision, safeFallbackDecision } from "./schemas/action-decision.js";
export { type RiskDecision, RISK_DECISION_SCHEMA, validateRiskDecision } from "./schemas/risk-decision.js";
export { type TriageDecision, TRIAGE_DECISION_SCHEMA, validateTriageDecision } from "./schemas/triage-decision.js";
export { type ExtractedEntities, type ExtractedEntity, EXTRACT_ENTITY_SCHEMA, validateExtractedEntities } from "./schemas/extract-entity.js";
export { type OwnershipAssignment, validateOwnershipAssignment } from "./schemas/ownership-assignment.js";
export { type EscalationRecommendation, validateEscalationRecommendation } from "./schemas/escalation-recommendation.js";
export { type ApprovalRecommendation, validateApprovalRecommendation } from "./schemas/approval-recommendation.js";
export { type ExecutiveSummary, validateExecutiveSummary } from "./schemas/executive-summary.js";
export { type ResolutionSummary, validateResolutionSummary } from "./schemas/resolution-summary.js";

export { ALLOY_TOOL_DEFINITIONS, executeToolCall, checkToolPolicy, isHighRiskTool, getExecutionMode, type ToolExecutionResult, type ToolAuditEntry, type ExecutionMode } from "./tools/alloy-tools.js";

export { AlloyRetrievalEngine, alloyRetrieval, type RetrievalChunk, type RetrievalResult, type ScoredChunk, type RerankResult } from "./retrieval/alloy-retrieval.js";

export { GOLDEN_SET } from "./evals/golden-set.js";
export { runEvals, type EvalResult, type EvalReport } from "./evals/run-evals.js";

export { startScheduledEvals, stopScheduledEvals, persistEvalReport, getLatestEvalReport, getEvalHistory, computeAgentCalibrations } from "./learning/eval-pipeline.js";
export { recordOutcome, getRelevantOutcomes, getConfidenceCalibration, buildCalibrationInstruction, type OutcomeRecord, type OutcomeType, type ConfidenceCalibration } from "./learning/outcome-learning.js";
export { storeCorrection, getRelevantCorrections, type CorrectionRecord } from "./learning/agent-corrections.js";
export { detectCrossPatterns, runPatternDetectionAndStore } from "./learning/pattern-detector.js";

export async function startCognitiveLearning(): Promise<void> {
  const { evidencePipeline } = await import("./tradecraft/evidence-pipeline.js");
  const { caseMemory } = await import("./tradecraft/case-memory.js");
  const { startScheduledEvals: _startScheduledEvals } = await import("./learning/eval-pipeline.js");
  await evidencePipeline.hydrateFromDb();
  await caseMemory.hydrateFromDb();
  await _startScheduledEvals();
}

export {
  createAlloyDecision,
  validateAlloyDecision,
  getApprovalPolicy,
  mapConfidenceToRisk,
  APPROVAL_MATRIX,
  type AlloyDecision,
  type AlloyDecisionEvidenceRef,
  type RiskLevel,
  type DecisionStatus,
} from "./schemas/alloy-decision.js";

export {
  TRADECRAFT_PROMPT_LIBRARY,
  buildTradecraftPrompt,
  CONFIDENCE_RUBRIC,
  ANALYTIC_NOTE_TEMPLATES,
  validateAndBuildTriageDecision,
  validateAndBuildIncidentAssessment,
  validateAndBuildRiskDecision,
  validateAndBuildEscalationDecision,
  validateAndBuildApprovalRecommendation,
  validateAndBuildResponsePlan,
  validateAndBuildExecutiveBrief,
  validateAndBuildControlGapFinding,
  EvidencePipeline,
  evidencePipeline,
  CaseMemoryStore,
  caseMemory,
  validateAndBuildDecision,
  type AnalyticMode,
  type TradecraftPromptTemplate,
  type DecisionObjectType,
  type ImpactLevel,
  type UrgencyLevel,
  type ConfidenceLabel,
  type EvidenceRef,
  type AnalyticAssumption,
  type AlternativeHypothesis,
  type BaseDecisionObject,
  type TriageDecisionObject,
  type IncidentAssessmentObject,
  type RiskDecisionObject,
  type EscalationDecisionObject,
  type ApprovalRecommendationObject,
  type ResponsePlanObject,
  type ExecutiveBriefObject,
  type ControlGapFindingObject,
  type AnyDecisionObject,
  type EvidenceSourceType,
  type EvidenceIndexEntry,
  type EvidenceQuery,
  type EvidenceQueryResult,
  type CaseMemoryEntry,
  type DecisionDiff,
} from "./tradecraft/index.js";
