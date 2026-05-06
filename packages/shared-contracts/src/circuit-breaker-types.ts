import { z } from 'zod';

/**
 * Shared zod schemas + TypeScript types for the `circuitBreakers` block
 * returned by the API server's `/ai/health` and `/ai/gateway/status`
 * endpoints. Both server and clients must read from this single source so
 * the payload contract cannot drift.
 */

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
