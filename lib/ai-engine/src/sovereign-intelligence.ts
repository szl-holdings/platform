/**
 * Sovereign Intelligence Integration Layer
 *
 * Central export surface for the next-generation AI engine capabilities.
 * Import from this module to access the full Sovereign Intelligence stack.
 *
 * Architecture:
 *  ┌─────────────────────────────────────────────┐
 *  │           Sovereign Intelligence             │
 *  │                                             │
 *  │  Model Registry ──► Cost-Performance Router │
 *  │       │                    │                │
 *  │  Extended Thinking   Speculative Exec       │
 *  │       │                    │                │
 *  │  Coalition Formation ◄─────┘                │
 *  │       │                                     │
 *  │  Shadow Council (Contrarian)                │
 *  │       │                                     │
 *  │  Cross-Domain Causal Graph                  │
 *  │       │                                     │
 *  │  Meta-Learning Fabric                       │
 *  │       │                                     │
 *  │  Prompt Cache + Structured Output           │
 *  └─────────────────────────────────────────────┘
 */

// ── Model Registry ────────────────────────────────────────────────────────────
export {
  estimateCostUsd,
  FAILOVER_CHAINS,
  getCostPerformanceScore,
  getFailoverChain,
  getModelsByCapability,
  getModelSpec,
  MODEL_REGISTRY,
  type ModelCapability,
  type ModelSpec,
  type ProviderName,
  type RoutingLane,
} from './model-registry.js';

// ── Cost-Performance Router ───────────────────────────────────────────────────
export {
  analyzeQueryComplexity,
  buildFailoverSequence,
  getRoutingDecisionLog,
  getRoutingStats,
  routeQuery,
  type CostPerformanceRouterOptions,
  type QueryComplexityScore,
  type RoutingDecision,
} from './cost-performance-router.js';

// ── Extended Thinking ─────────────────────────────────────────────────────────
export {
  getBudgetForStakes,
  LANE_TOKEN_BUDGETS,
  runExtendedThinking,
  setExtendedThinkingLlmCaller,
  type ExtendedThinkingOptions,
  type ExtendedThinkingResult,
  type ThinkingBudget,
  type ThinkingPass,
} from './extended-thinking.js';

// ── Speculative Execution ─────────────────────────────────────────────────────
export {
  getBestModelForDomain,
  getDomainWinnerStats,
  runSpeculativeExecution,
  setSpeculativeModelCaller,
  shouldUseSpeculativeExecution,
  type SpeculativeExecutionResult,
  type ScoredCandidate,
} from './speculative-execution.js';

// ── Agent Coalition Formation ─────────────────────────────────────────────────
export {
  computeCoalitionMembers,
  formAndRunCoalition,
  setCoalitionAgentCaller,
  shouldFormCoalition,
  type CoalitionMember,
  type CoalitionResult,
} from './coalition/coalition-manager.js';

// ── Adversarial Shadow Council ────────────────────────────────────────────────
export {
  getContrarianLog,
  getContrarianStats,
  runShadowCouncil,
  setShadowCouncilCaller,
  shouldRunShadowCouncil,
  type ContrarianChallenge,
  type ShadowCouncilResult,
} from './shadow-council.js';

// ── Cross-Domain Causal Graph ─────────────────────────────────────────────────
export {
  buildCausalContext,
  CAUSAL_GRAPH,
  createCausalSignal,
  getAffectedDomains,
  getEdgesBetween,
  propagateCausalSignal,
  type CausalEdge,
  type CausalImpact,
  type CausalPropagationResult,
  type CausalSignal,
  type Domain,
} from './causal-graph.js';

// ── Meta-Learning Fabric ──────────────────────────────────────────────────────
export {
  applyMetaLearningToRouting,
  getAllPriorAdjustments,
  getMetaLearningStats,
  getPriorAdjustment,
  recordStrategyOutcome,
  runMetaReview,
  type MetaReviewReport,
  type ReasoningDepth,
  type RoutingPriorAdjustment,
  type StrategyRecord,
} from './meta-learning.js';

// ── Prompt Cache + Structured Output ─────────────────────────────────────────
export {
  clearCache,
  createSimpleJsonValidator,
  extractCachePrefix,
  getCachedResponse,
  getCacheStats,
  setCachedResponse,
  setStructuredOutputCaller,
  structuredOutputWithRetry,
  type CacheEntry,
  type CacheStats,
  type JsonSchemaValidator,
  type StructuredOutputOptions,
  type StructuredOutputResult,
} from './prompt-cache.js';
