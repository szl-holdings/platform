import {
  circuitBreakerProviderSchema,
  circuitBreakerResponseSchema,
  circuitBreakerStateSchema,
  circuitBreakerSummarySchema,
  type CircuitBreakerProvider,
  type CircuitBreakerResponse,
  type CircuitBreakerState,
  type CircuitBreakerSummary,
} from '@szl-holdings/shared-contracts/circuit-breaker';
import { getCircuitBreakerMetrics } from './ai-model-observability.js';

export {
  circuitBreakerProviderSchema,
  circuitBreakerResponseSchema,
  circuitBreakerStateSchema,
  circuitBreakerSummarySchema,
};
export type {
  CircuitBreakerProvider,
  CircuitBreakerResponse,
  CircuitBreakerState,
  CircuitBreakerSummary,
};

/**
 * Build the shared `circuitBreakers` response block consumed by both
 * `/ai/health` and `/ai/gateway/status`. Centralizing this prevents the two
 * endpoints from drifting out of sync.
 *
 * The schema/types are exported from `@szl-holdings/shared-contracts/circuit-breaker`
 * so frontend clients can validate and consume the same shape.
 */
export function buildCircuitBreakerResponse(
  metrics: ReturnType<typeof getCircuitBreakerMetrics> = getCircuitBreakerMetrics(),
): CircuitBreakerResponse {
  return {
    summary: {
      openCount: metrics.openCount,
      halfOpenCount: metrics.halfOpenCount,
      closedCount: metrics.closedCount,
    },
    providers: metrics.circuits.map((c) => ({
      provider: c.provider,
      state: c.state,
      consecutiveFailures: c.consecutiveFailures,
      openedAt: c.openedAt != null ? new Date(c.openedAt).toISOString() : null,
      lastTestedAt: c.lastTestedAt != null ? new Date(c.lastTestedAt).toISOString() : null,
      totalTripped: c.totalTripped,
    })),
  };
}
