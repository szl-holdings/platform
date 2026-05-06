import { z } from 'zod';
import { getCircuitBreakerMetrics } from './ai-model-observability.js';

export const circuitBreakerStateSchema = z.enum(['open', 'closed', 'half-open']);

export const circuitBreakerProviderSchema = z.object({
  provider: z.string(),
  state: circuitBreakerStateSchema,
  consecutiveFailures: z.number(),
  openedAt: z.string().datetime().nullable(),
  lastTestedAt: z.string().datetime().nullable(),
  totalTripped: z.number(),
});

export const circuitBreakerSummarySchema = z.object({
  openCount: z.number(),
  halfOpenCount: z.number(),
  closedCount: z.number(),
});

export const circuitBreakerResponseSchema = z.object({
  summary: circuitBreakerSummarySchema,
  providers: z.array(circuitBreakerProviderSchema),
});

export type CircuitBreakerState = z.infer<typeof circuitBreakerStateSchema>;
export type CircuitBreakerProvider = z.infer<typeof circuitBreakerProviderSchema>;
export type CircuitBreakerSummary = z.infer<typeof circuitBreakerSummarySchema>;
export type CircuitBreakerResponse = z.infer<typeof circuitBreakerResponseSchema>;

/**
 * Build the shared `circuitBreakers` response block consumed by both
 * `/ai/health` and `/ai/gateway/status`. Centralizing this prevents the two
 * endpoints from drifting out of sync.
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
