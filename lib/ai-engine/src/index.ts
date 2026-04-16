export {
  computeRiskAssessment,
  buildBaseline,
  batchRiskAssessment,
} from "./sentinel/behavioral-analytics.js";
export type {
  AccessEvent,
  BehavioralBaseline,
  DetectedAnomaly,
  RiskAssessment,
} from "./sentinel/behavioral-analytics.js";

export {
  NuroMeshOrchestrator,
  nuroMeshOrchestrator,
  AGENT_REGISTRY,
  DOMAIN_ROUTING_RULES,
  routeToAgents,
  routeToAgentsWithA2A,
  computeRoutingScores,
  callAgent,
  consultAgent,
  storeInsight,
  runMakerChecker,
  getSharedContext,
  CAUSAL_PATTERNS,
  CausalReasoningEngine,
  SignalCorrelator,
  ConfidenceCalibrator,
  ConflictResolver,
  AgentTelemetryTracker,
  causalEngine,
  signalCorrelator,
  confidenceCalibrator,
  conflictResolver,
  agentTelemetry,
} from "./nuro-mesh.js";

export type {
  AgentDefinition,
  DomainRoutingRule,
  ValidationResult,
  AgentCallResult,
  RAGChunk,
  ToolDefinition,
  DomainAgentConfig,
  AgentConsultationRequest,
  AgentConsultationResult,
  CrossAgentInsight,
  StructuredToolCall,
  StructuredToolResult,
  SemanticRoutingScore,
  CausalLink,
  CausalChain,
  ProactiveActivation,
  SignalCorrelation,
  AgentPerformanceProfile,
  ConflictResolution,
  ConfidenceCalibrationEntry,
  OrchestrationTelemetry,
  SensitivityLevel,
  RagSourceType,
} from "./types.js";

export { RAGPipeline, chunkText } from "./rag-pipeline.js";

export {
  EmbeddingPipeline,
  embeddingPipeline,
  getEmbedding,
  type EmbeddingResult,
  type BatchEmbeddingResult,
  type EmbedOptions,
  type BatchEmbedOptions,
  type ProviderHealth,
  type EmbeddingProviderType,
} from "./embedding/provider.js";

export {
  getDomainModelConfig,
  inferDomain,
  getAllDomainConfigs,
  RAG_DB_DIMENSIONS,
  type EmbeddingDomain,
  type DomainEmbeddingConfig,
} from "./embedding/domain-config.js";

export {
  embeddingAnalytics,
  type EmbeddingAnalyticsReport,
} from "./embedding/analytics.js";

export {
  createEmbeddingAnalyticsRouter,
  getEmbeddingAnalytics,
} from "./embedding/analytics-endpoint.js";

export { DomainAgentRunner, getOrCreateConversation, MAX_TOOL_ROUNDS, type ConversationMessage, type ChatInterface, type NativeToolCall, type StructuredCompletionResult } from "./domain-agent-runner.js";

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

export {
  upsertChunk,
  upsertChunksBatch,
  semanticSearch,
  keywordSearch,
  hybridSearch,
  getChunkCount,
  getKnowledgeBaseStats,
  deleteChunksByObjectId,
  type RagChunk,
  type RagSearchResult,
  type SemanticSearchOptions,
  type KeywordSearchOptions,
  type HybridSearchOptions,
} from "./rag-vector-store.js";

export {
  createChunks,
  chunkWithOverlap,
  chunkByParagraphs,
  generateEmbedding,
  ingestToVectorStore,
  ingestAiDecision,
  ingestCaseMemory,
  ingestIncidentReport,
  ingestAgentKnowledge,
  ingestDocument,
  runFullReindex,
  type RawChunk,
  type ChunkMetadata,
} from "./rag-ingestion.js";

export { GOLDEN_SET } from "./evals/golden-set.js";
export { runEvals, type EvalResult, type EvalReport } from "./evals/run-evals.js";
export {
  captureTrace,
  getTrace,
  listTraces,
  updateTraceStatus,
  aggregateTraces,
  registerTraceSink,
  REVIEW_CONFIDENCE_THRESHOLD,
  REVIEW_HIGH_RISK_LEVELS,
  REVIEW_COST_THRESHOLD_USD,
  type AITrace,
  type TraceCaptureInput,
  type TraceStatus,
  type TraceDomain,
  type RecommendationType,
  type TraceAggregate,
} from "./evals/trace-capture.js";
export {
  registerEvaluatorHook,
  unregisterEvaluatorHook,
  listEvaluatorHooks,
  getEvaluatorHook,
  runEvaluatorHooksForTrace,
  getHookResults,
  aggregateHookStats,
  type RegisteredEvalHook,
  type EvalHookResult,
  type EvalHookFn,
  type DomainEvalContext,
  type EvalAssertion,
} from "./evals/evaluator-hooks.js";
export {
  enqueueForReview,
  autoEnqueueTrace,
  getReviewItem,
  listReviewQueue,
  recordReviewDecision,
  markInReview,
  getReviewQueueStats,
  type ReviewQueueItem,
  type ReviewVerdict,
  type ReviewPriority,
  type ReviewDecisionInput,
  type ReviewQueueStats,
} from "./evals/review-queue.js";

export {
  exportTrainingData,
  serializeToJSONL,
  serializeToHuggingFaceJSON,
  type ExportFormat,
  type DatasetExportResult,
  type OpenAITrainingSample,
  type HuggingFaceSample,
} from "./fine-tuning/dataset-exporter.js";

export {
  curateDatasetForAgent,
  curateAllDomainDatasets,
  getDomainCuratorConfig,
  getAllSupportedAgents,
  DOMAIN_CURATOR_CONFIGS,
  type DomainCuratorConfig,
  type CuratedDatasetResult,
} from "./fine-tuning/domain-curators.js";

export {
  submitFineTuningJob,
  pollJobStatus,
  listFineTuningJobs,
  cancelFineTuningJob,
  type FineTuningProvider,
  type FineTuningJobRequest,
  type FineTuningJobStatus,
} from "./fine-tuning/job-manager.js";

export {
  runValidationGate,
  promoteFineTunedModel,
  type ModelEvalScores,
  type ValidationGateResult,
} from "./fine-tuning/validation-gate.js";

export {
  getActiveFineTunedModel,
  resolveModelForAgent,
  getAllFineTunedModels,
  deprecateFineTunedModel,
  invalidateModelCache,
  getModelLineage,
  type FineTunedModelInfo,
} from "./fine-tuning/model-registry-extension.js";

export { startScheduledEvals, stopScheduledEvals, persistEvalReport, getLatestEvalReport, getEvalHistory, computeAgentCalibrations } from "./learning/eval-pipeline.js";
export { recordOutcome, getRelevantOutcomes, getConfidenceCalibration, buildCalibrationInstruction, type OutcomeRecord, type OutcomeType, type ConfidenceCalibration } from "./learning/outcome-learning.js";
export { storeCorrection, getRelevantCorrections, type CorrectionRecord } from "./learning/agent-corrections.js";
export { detectCrossPatterns, runPatternDetectionAndStore } from "./learning/pattern-detector.js";

export {
  A2ARegistryService,
  a2aRegistry,
  type AgentCard,
  type DiscoveryQuery,
  type DiscoveryResult,
} from "./a2a-registry.js";

export {
  delegateTask,
  getDelegationTask,
  getDelegationHistory,
  type DelegationRequest,
  type DelegationResult,
  type DelegationStatus,
  type DelegationTaskRecord,
} from "./a2a-delegation.js";

export async function startCognitiveLearning(): Promise<void> {
  const { evidencePipeline } = await import("./tradecraft/evidence-pipeline.js");
  const { caseMemory } = await import("./tradecraft/case-memory.js");
  const { startScheduledEvals: _startScheduledEvals } = await import("./learning/eval-pipeline.js");
  await Promise.all([
    evidencePipeline.hydrateFromDb(),
    caseMemory.hydrateFromDb(),
  ]);
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
  SkillRegistry,
  skillRegistry,
  SkillManager,
  skillManager,
  ScoringEngine,
  scoringEngine,
  buildSelfReflectionContext,
  applyConfidenceAdjustment,
  injectReflectionIntoPrompt,
  persistReflectionSnapshot,
  ConfidenceMonitor,
  confidenceMonitor,
  type SkillManifest,
  type SkillCapability,
  type SkillDomain,
  type SkillInputField,
  type SkillOutputField,
  type SkillTriggerCondition,
  type SkillChainMetadata,
  type SkillChain,
  type SkillSelectionResult,
  type ChainCompositionResult,
  type ChainExecutionPlan,
  type DecisionOutcomeRecord,
  type AgentAccuracyScore,
  type ConfidenceCalibrationScore,
  type SkillEffectivenessScore,
  type ScoringWindowConfig,
  type SelfReflectionContext,
  type ReasoningAdjustment,
  type SelfReflectionConfig,
  type ConfidenceAlert,
  type AlertSeverity,
  type AlertType,
  type MonitorConfig,
} from "./tradecraft/index.js";

export {
  executeWithKernel,
  issueScopeCertificate,
  getKernelAuditTrail,
  verifyAuditChainIntegrity,
  kernelAuditChain,
  type ScopeCertificate,
  type KernelAuditEntry,
  type KernelExecutionOptions,
  type KernelExecutionResult,
} from "./kernel/agent-kernel.js";

export {
  rlMemoryManager,
  type MemoryEntry,
  type MemoryTier,
  type MemoryOperation,
  type MemoryOperationResult,
  type MemoryRewardSignal,
} from "./memory/rl-memory.js";

export {
  trajectoryStore,
  type OrchestrateTrajectory,
  type AgentRoutingStep,
  type ToolCallRecord,
  type QualityDimensions,
  type TrajectoryStatus,
} from "./flywheel/trajectory-store.js";

export {
  behavioralTracer,
  type ExecutionTrace,
  type DecisionFork,
  type JudgeEvaluation,
  type DecisionTreeNode,
  type DecisionForkType,
} from "./observability/behavioral-tracer.js";

export {
  budgetManager,
  MODEL_PRICING,
  type ModelPricing,
  type BudgetConfig,
  type BudgetUsage,
  type CostEstimate,
  type SpendRecord,
} from "./cost/budget-manager.js";

export {
  buildAgentCard,
  buildMeshAgentIndex,
  a2aTaskManager,
  type A2AAgentCard,
  type A2ASkill,
  type A2ATask,
  type A2AJsonRpcRequest,
  type A2AJsonRpcResponse,
} from "./a2a/agent-cards.js";

export {
  buildDataTableComponent,
  buildChartComponent,
  buildApprovalFormComponent,
  buildMetricCardComponent,
  buildTimelineComponent,
  isUIComponentResponse,
  MCP_APP_TOOLS,
  type UIComponentResponse,
  type UIComponentType,
  type DataTableConfig,
  type ChartConfig,
  type ApprovalFormConfig,
  type MetricCardConfig,
  type TimelineConfig,
} from "./mcp-apps/ui-tools.js";

export {
  metacognitiveMonitor,
  selfModelEngine,
  cognitiveWorkspace,
  innerMonologue,
  goalEngine,
  emotionalSignals,
  temporalAwareness,
  captureConsciousnessSnapshot,
  buildConsciousnessContext,
  type ConsciousnessSnapshot,
  type MetacognitiveAssessment,
  type MetacognitiveState,
  type CertaintyLevel,
  type ReasoningQuality,
  type CognitiveLoad,
  type AgentCapabilityProfile,
  type SystemSelfModel,
  type SystemIdentity,
  type WorkingMemoryItem,
  type AttentionFocus,
  type CognitiveWorkspaceState,
  type MonologueEntry,
  type MonologueType,
  type InnerMonologueState,
  type CognitiveGoal,
  type CuriositySignal,
  type GoalPriority,
  type GoalStatus,
  type GoalEngineState,
  type EmotionalSignal,
  type EmotionalValence,
  type EmotionalState,
  type EmotionType,
  type TemporalMarker,
  type TemporalPattern,
  type TemporalAwarenessState,
  type PredictiveUncertainty,
  type HallucinationRisk,
  type MultiHypothesisBranch,
  type GWTBroadcast,
  type AttentionSchemaReport,
  type DialecticalTriple,
  type SocraticChain,
  type PerspectiveSimulation,
  type IntrinsicMotivation,
  type GoalInterference,
  type MetaGoal,
  type SchererAppraisal,
  type EmotionRegulationStrategy,
  type AffectiveForecast,
  type ProspectiveMemoryItem,
  type TemporalDiscount,
  type EpisodicFutureSimulation,
  type AgentBeliefModel,
  type CounterfactualScenario,
  type AdversarialProbe,
  predictiveProcessing,
  type PredictionModel,
  type Prediction,
  type PredictionError,
  type FreeEnergyState,
  type PredictiveProcessingState,
  dreamConsolidation,
  type DreamReplay,
  type DiscoveredPattern,
  type ConsolidationReport,
  type DreamConsolidationState,
} from "./consciousness/index.js";

export {
  OntologyEngine,
  ontologyEngine,
  type OntologyEntityType,
  type RelationshipType,
  type OntologyEntity,
  type OntologyRelationship,
  type GraphNode,
  type GraphTraversalResult,
  type EvidenceLink,
  type CrossDomainConnection,
  type GraphQueryResult,
} from "./ontology/ontology-engine.js";

export {
  GraphRAGEngine,
  graphRAGEngine,
  type GraphRAGQuery,
  type GraphRAGResult,
  type GraphScoredChunk,
  type CrossDomainInsight,
  type ReasoningStep,
} from "./ontology/graph-rag.js";

export {
  twinRegistry,
  vesselTwin,
  propertyTwin,
  postureTwin,
  type TwinType,
  type TwinStatus,
  type TwinState,
  type PredictedState,
  type TwinAlert,
  type SimulationScenario,
  type SimulationResult,
  type VesselTwinState,
  type PropertyTwinState,
  type PostureTwinState,
} from "./digital-twins/twin-engine.js";

export {
  FusionCortex,
  fusionCortex,
  type FusionAlert,
  type FusionAlertSeverity,
  type FusionAlertCategory,
  type FusionEvidenceItem,
  type FusionPattern,
  type FusionScanResult,
  type FusionCortexStats,
} from "./fusion/fusion-cortex.js";

export {
  PatternLibrary,
  patternLibrary,
  type CorrelationPattern,
  type PatternFeedback,
  type PatternEvidence,
  type PatternCategory,
  type PatternStatus,
} from "./fusion/pattern-library.js";

export {
  PredictiveCascadeEngine,
  predictiveCascadeEngine,
  type CascadeTree,
  type CascadeNode,
  type CascadeHorizon,
  type CascadeImpactLevel,
  type PredictiveAlert,
  type DomainKey,
} from "./fusion/predictive-cascade.js";

// ML Pipeline Infrastructure
export * from "./ml-pipeline/index.js";
