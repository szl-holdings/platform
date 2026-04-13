export { initializeMastra, runAgent, listAgents, getAgent } from "./agent-engine";
export type { MastraAgentConfig, AgentExecutionContext, OrchestratorResult } from "./agent-engine";
export { registerTool, getTool, listTools, executeTool, registerCrossPlatformTools, registerGitHubTools } from "./tool-registry";
export type { MastraTool } from "./types";
export { createThread, storeMessage, getShortTermMemory, semanticRecall, storeKnowledgeEntity, getKnowledgeGraph, getThreads } from "./memory";
export { emitTrace, recordEval, autoEvaluate, getAgentMetrics, getAllAgentMetrics, getTraces, initDefaultSlos } from "./agentops";
export { registerAgentCard, getAgentCard, listAgentCards, createTask, updateTaskStatus, getTask, listTasks, initializeA2ACards } from "./a2a";
export { createWorkflow, executeWorkflow, getWorkflow, listWorkflows, pauseWorkflow, cancelWorkflow } from "./durable-workflows";
export { runEvalSuite, runRedTeam, detectHallucinations, getRedTeamCatalog, getRedTeamCategories } from "./eval-engine";
export type { EvalSuite, EvalTestCase, EvalSuiteResult, EvalResult, RedTeamAttack, HallucinationScore } from "./eval-engine";
export { executeCompoundPipeline, buildAnalysisPipeline } from "./compound-ai";
export type { CompoundPipeline, CompoundStep, CompoundResult } from "./compound-ai";
export {
  registerExternalIntegration, getExternalIntegration, listExternalIntegrations,
  callExternalIntegration, registerGitHubIntegration,
} from "./external-integrations";
export type { ExternalIntegrationConfig } from "./external-integrations";
export {
  ingestDocument, batchIngestDocuments, listDocuments, getDocument,
  ensureDocumentIntelligenceTables,
} from "./document-intelligence";
export type { DocumentIngestRequest, DocumentIntelligenceResult, DocumentDomain } from "./document-intelligence";
export {
  parseNLACommand, createNLAExecutionPlan, approveNLAPlan, executeNLAPlan,
  routeAndExecuteNLA, getPendingPlans, getPlan,
} from "./nla-router";
export type { NLAParseResult, NLAExecutionPlan, NLAExecutionResult } from "./nla-router";
export {
  registerTrigger, getTrigger, listTriggers, removeTrigger,
  fireTrigger, approveTrigger, emitDomainEvent, getPendingApprovals,
  ensureTriggerTables, registerDefaultTriggers,
} from "./event-triggers";
export type { WorkflowTrigger, TriggerFireResult, TriggerEventType } from "./event-triggers";
export {
  logAction, updateActionStatus, listActionAudit, getActionAuditEntry,
  ensureActionAuditTable, generateActionId,
} from "./action-audit";
export type { ActionAuditEntry } from "./action-audit";

export {
  ensureSkillsRegistryTable,
  listSkills, getSkill, updateSkillStatus,
  setSkillOrgConfig, getSkillOrgConfigs, isSkillEnabledForOrg,
  getUserAutonomyLevel, setUserAutonomyLevel, getUserAutonomyPrefs,
  recordSkillInvocation, getSkillMetrics, getSkillsStats,
  saveSkillComposition, listCompositions, getComposition,
} from "./skills-registry";
export type { AutonomyLevel, SkillDomain, SkillStatus, SkillRegistryEntry, SkillRegistryRow, SkillOrgConfig } from "./skills-registry";

export {
  ensureSkillRuntimeTables,
  executeSkill,
  getPendingApprovals as getPendingSkillApprovals,
  approveSkillExecution, rejectSkillExecution,
} from "./skill-runtime";
export type { SkillExecutionRequest, SkillExecutionResult, PendingApproval } from "./skill-runtime";

export {
  runComposition, buildCompositionFromTemplate,
} from "./skill-composition";
export type { CompositionStep, SkillComposition, CompositionRunResult } from "./skill-composition";

export {
  ensureAgentActivityTable, emitActivityEvent, getActivityFeed,
  getRecentActivityFromMemory, getA2ADelegationChain, getAgentActivityStats,
} from "./agent-activity";
export type { AgentActivityEvent, ActivityEventType } from "./agent-activity";

export {
  registerMcpModule, getMcpModule, listMcpModules, getAllMcpTools,
  getAllMcpResources, getAllMcpPrompts, findModuleForTool, mcpGatewayHealth,
  buildMcpGatewayRouter,
} from "./mcp-gateway/index";
export type { McpTool, McpResource, McpPrompt, McpServerModule } from "./mcp-gateway/index";

export { classifyRequest, classifyWithLLM } from "./cognitive-router";
export type { CognitiveClassification, CognitiveMode } from "./cognitive-router";

export { runTreeOfThought, runPlanCritique, runMonteCarlo, buildPlanningTrace } from "./advanced-planner";
export type { TreeOfThoughtResult, PlanCritiqueResult, MonteCarloResult, PlanningTrace } from "./advanced-planner";

export { runMetacognitiveAssessment, runSelfReflection, generateClarifyingQuestion } from "./metacognition";
export type { MetacognitiveState, SelfReflectionResult } from "./metacognition";

export {
  ensureSelfEvolutionTables, recordOutcome, getActiveStrategyProfile,
  listStrategyProfiles, proposePromptRefinement, saveProposedProfile,
  approveStrategyProfile, updateProfileMetrics, getRecentOutcomes,
} from "./self-evolution";
export type { StrategyProfile, EvolutionOutcome, PromptRefinement } from "./self-evolution";

export {
  ensureFailureRecoveryTables, diagnoseFailure, generateRecoveryPlan,
  recordRecoveryAttempt, updateRecoveryOutcome, getRecoveryHistory,
} from "./failure-recovery";
export type { FailureDiagnosis, RecoveryAttempt, RecoveryPattern } from "./failure-recovery";

export {
  ensureDynamicToolTables, recordToolChain, identifyRepeatedChains,
  proposeCompoundTool, activateCompoundTool, listCompoundTools,
  runPeriodicToolAnalysis,
} from "./dynamic-tools";
export type { ToolChainUsage, CompoundToolDefinition } from "./dynamic-tools";

export {
  ensureIntentTables, getOrCreateIntentStack, updateIntentStack,
  extractIntent, buildIntentContext, markIntentResolved, getIntentStack,
} from "./intent-graph";
export type { IntentStack, IntentNode, IntentExtraction } from "./intent-graph";

export {
  requiresConsensus, runConsensusVerification, quickFactCheck,
} from "./consensus-verification";
export type { ConsensusResult, ConsensusAnalysis } from "./consensus-verification";

export {
  ensurePersonalizationTables, getOrCreateUserProfile, getUserProfile,
  buildPersonalizationContext, buildPersonalizedSystemPrompt,
  recordInteraction, recordFeedback, updateProfileFromInference,
  inferProfileFromHistory,
} from "./personalization";
export type { UserProfile, PersonalizationContext, FeedbackSignal } from "./personalization";

export {
  ensureProactiveTables, generateCrossDomainInsight, saveInsight,
  getActiveInsights, dismissInsight, proposeMonitoringObjective, listMonitoringObjectives,
} from "./proactive-intelligence";
export type { ProactiveInsight, MonitoringObjective } from "./proactive-intelligence";
