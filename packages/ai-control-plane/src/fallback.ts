import { createLogger } from "./logger.js";
import type { ModelEndpoint, ProviderType, RouteClass } from "./router.js";

const logger = createLogger("ai-control-plane:fallback");

export interface FallbackRule {
  id: string;
  triggerCondition: "circuit_open" | "timeout" | "error_rate" | "budget_exceeded" | "eval_below_threshold";
  routeClass?: RouteClass;
  fromProvider?: ProviderType;
  toProvider: ProviderType;
  toModel: string;
  toBaseUrl?: string;
  priority: number;
  enabled: boolean;
}

export interface FallbackContext {
  routeClass: RouteClass;
  failedProvider?: string;
  failedModel?: string;
  errorType?: string;
  budgetUsedUsd?: number;
  budgetLimitUsd?: number;
  evalScore?: number;
  evalThreshold?: number;
}

export interface FallbackDecision {
  shouldFallback: boolean;
  reason?: string;
  rule?: FallbackRule;
  fallbackEndpoint?: Omit<ModelEndpoint, "tags" | "evalScore" | "costPerInputToken" | "costPerOutputToken" | "maxTokens">;
}

const DEFAULT_FALLBACK_RULES: FallbackRule[] = [
  {
    id: "openai-to-anthropic",
    triggerCondition: "circuit_open",
    fromProvider: "openai",
    toProvider: "anthropic",
    toModel: "claude-haiku-3-5",
    priority: 10,
    enabled: true,
  },
  {
    id: "anthropic-to-openai",
    triggerCondition: "circuit_open",
    fromProvider: "anthropic",
    toProvider: "openai",
    toModel: "gpt-4o-mini",
    priority: 10,
    enabled: true,
  },
  {
    id: "cloud-to-local",
    triggerCondition: "circuit_open",
    toProvider: "local",
    toModel: "llama-3.3-70b-instruct",
    toBaseUrl: "http://localhost:11434/v1",
    priority: 50,
    enabled: true,
  },
  {
    id: "budget-exceeded-to-mini",
    triggerCondition: "budget_exceeded",
    toProvider: "openai",
    toModel: "gpt-4o-mini",
    priority: 5,
    enabled: true,
  },
  {
    id: "eval-fail-to-opus",
    triggerCondition: "eval_below_threshold",
    toProvider: "anthropic",
    toModel: "claude-opus-4-5",
    priority: 8,
    enabled: true,
  },
];

function buildFallbackEndpoint(rule: FallbackRule): FallbackDecision["fallbackEndpoint"] {
  return {
    provider: rule.toProvider,
    model: rule.toModel,
    baseUrl: rule.toBaseUrl,
    priority: 99,
    enabled: true,
  };
}

class FallbackEngine {
  private rules: FallbackRule[];

  constructor(rules: FallbackRule[] = DEFAULT_FALLBACK_RULES) {
    this.rules = rules;
  }

  addRule(rule: FallbackRule): void {
    this.rules.push(rule);
    logger.info({ ruleId: rule.id, trigger: rule.triggerCondition }, "Fallback rule added");
  }

  removeRule(id: string): void {
    this.rules = this.rules.filter(r => r.id !== id);
  }

  listRules(): FallbackRule[] {
    return [...this.rules];
  }

  evaluate(ctx: FallbackContext): FallbackDecision {
    if (
      ctx.budgetUsedUsd !== undefined &&
      ctx.budgetLimitUsd !== undefined &&
      ctx.budgetUsedUsd >= ctx.budgetLimitUsd
    ) {
      const rule = this.findRule("budget_exceeded", ctx);
      if (rule) {
        logger.warn({ usedUsd: ctx.budgetUsedUsd, limitUsd: ctx.budgetLimitUsd }, "Budget exceeded — applying fallback");
        return {
          shouldFallback: true,
          reason: "budget_exceeded",
          rule,
          fallbackEndpoint: buildFallbackEndpoint(rule),
        };
      }
    }

    if (ctx.evalScore !== undefined && ctx.evalThreshold !== undefined && ctx.evalScore < ctx.evalThreshold) {
      const rule = this.findRule("eval_below_threshold", ctx);
      if (rule) {
        logger.warn({ evalScore: ctx.evalScore, threshold: ctx.evalThreshold }, "Eval below threshold — applying fallback");
        return {
          shouldFallback: true,
          reason: "eval_below_threshold",
          rule,
          fallbackEndpoint: buildFallbackEndpoint(rule),
        };
      }
    }

    if (ctx.failedProvider) {
      const rule = this.findRule("circuit_open", ctx);
      if (rule) {
        logger.info({ failed: ctx.failedProvider, fallback: rule.toProvider }, "Circuit open — applying fallback");
        return {
          shouldFallback: true,
          reason: "circuit_open",
          rule,
          fallbackEndpoint: buildFallbackEndpoint(rule),
        };
      }
    }

    return { shouldFallback: false };
  }

  private findRule(condition: FallbackRule["triggerCondition"], ctx: FallbackContext): FallbackRule | undefined {
    return this.rules
      .filter(r => {
        if (!r.enabled) return false;
        if (r.triggerCondition !== condition) return false;
        if (r.routeClass && r.routeClass !== ctx.routeClass) return false;
        if (r.fromProvider && r.fromProvider !== ctx.failedProvider) return false;
        return true;
      })
      .sort((a, b) => a.priority - b.priority)[0];
  }
}

export const fallbackEngine = new FallbackEngine();

export function evaluateFallback(ctx: FallbackContext): FallbackDecision {
  return fallbackEngine.evaluate(ctx);
}

export { FallbackEngine };
