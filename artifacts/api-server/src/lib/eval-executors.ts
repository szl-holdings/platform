import { gatewayInfer } from "./ai-gateway";
import { logger } from "./logger";
import {
  buildSuiteExecutor,
  type EvalExecutor,
  type EvalInferFn,
  type EvalSuiteDef,
} from "@workspace/eval-forge";

/**
 * Eval-Forge inference adapter.
 *
 * Bridges the eval-forge `EvalInferFn` contract to the api-server's real
 * model gateway (`gatewayInfer`). All eval-forge executors call into this
 * function which routes through the production circuit breakers, telemetry,
 * and provider fallback paths — so eval results reflect the same model
 * behaviour the agent runtime sees in production.
 *
 * The adapter is intentionally light: it forwards the system + user prompts,
 * tags telemetry with the eval case id, and surfaces the gateway's reported
 * model + token + cost figures back to the eval runtime. JSON parsing and
 * heuristic fallback are handled inside eval-forge itself.
 */
export const defaultEvalInfer: EvalInferFn = async (req) => {
  try {
    const response = await gatewayInfer({
      messages: [
        { role: "system", content: req.systemPrompt },
        { role: "user", content: req.userPrompt },
      ],
      strategy: "fastest",
      maxTokens: req.maxTokens ?? 600,
      agentId: `eval-forge:${req.evalType}`,
      domain: req.domain,
    });
    fallbackActivations = 0;
    return {
      content: response.content,
      model: response.model,
      tokensUsed: response.usage.totalTokens,
      costUsd: response.estimatedCostUsd,
    };
  } catch (err) {
    // Surface degraded-quality state so operators can spot eval runs that are
    // silently relying on heuristic fallback rather than real model output.
    noteEvalInferFailure(err);
    throw err;
  }
};

/**
 * Pick the right per-eval-type executor for a suite, backed by the live AI
 * gateway. Falls back to the heuristic executor (no infer fn) when the AI
 * gateway is unavailable so the eval pipeline is never blocked end-to-end.
 */
export function buildDefaultExecutor(suite: Pick<EvalSuiteDef, "evalType" | "suiteId">): EvalExecutor {
  return buildSuiteExecutor(suite, defaultEvalInfer);
}

/**
 * Factory variant for use with `runNightlyEvals({ executorFactory })`.
 */
export function defaultExecutorFactory(suite: EvalSuiteDef): EvalExecutor {
  return buildDefaultExecutor(suite);
}

// Surface gateway failures so operators can spot eval runs that are silently
// relying on the heuristic fallback. We log the first failure immediately,
// then every 25th to keep ops dashboards quiet during sustained outages while
// still recording a heartbeat. The counter resets on the next successful call.
let fallbackActivations = 0;
export function noteEvalInferFailure(err: unknown): void {
  fallbackActivations += 1;
  if (fallbackActivations === 1 || fallbackActivations % 25 === 0) {
    logger.warn(
      { err, fallbackActivations },
      "[eval-forge] gateway inference failed; eval executors falling back to heuristic output",
    );
  }
}

export function getEvalInferFallbackCount(): number {
  return fallbackActivations;
}
