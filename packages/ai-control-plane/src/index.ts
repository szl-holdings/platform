export {
  modelRouter,
  createRouter,
  ModelRouter,
} from "./router.js";
export type {
  ProviderType,
  RouteClass,
  ModelEndpoint,
  RouteRequest,
  RouteResult,
  AgentTierName,
} from "./router.js";

export {
  evalRegistry,
  recordEvalResult,
  selectEvalAwareEndpoint,
  EvalRegistry,
} from "./eval-selector.js";
export type { EvalResult, EvalCriteria } from "./eval-selector.js";

export {
  fallbackEngine,
  evaluateFallback,
  FallbackEngine,
} from "./fallback.js";
export type { FallbackRule, FallbackContext, FallbackDecision } from "./fallback.js";

export {
  costController,
  recordCost,
  checkBudget,
  CostController,
} from "./cost-controller.js";
export type { CostRecord, BudgetPolicy, BudgetStatus } from "./cost-controller.js";

export {
  piiRedactor,
  redactPii,
  scanForInjection,
  PiiRedactor,
} from "./pii-redactor.js";
export type { PiiPattern, RedactionResult, InjectionScanResult } from "./pii-redactor.js";

export {
  AGENT_TIER_DEFINITIONS,
  getTierDefinition,
  isToolAllowedForTier,
  isRouteClassAllowedForTier,
  requiresApproval,
  getAllTiers,
} from "./agent-tiers.js";
export type { AgentTierDefinition } from "./agent-tiers.js";

export {
  policyEngine,
  evaluatePolicy,
  PolicyEngine,
} from "./policy-engine.js";
export type { PolicyRequest, PolicyDecision, PolicyViolation, PolicyRule } from "./policy-engine.js";
