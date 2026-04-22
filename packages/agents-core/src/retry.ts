import { z } from 'zod';
import { type RunErrorCategory, AgentRunError, categorizeError, isRetryable } from './errors.js';

export const RetryPolicySchema = z.object({
  maxAttempts: z.number().int().min(1).max(10).default(3),
  initialDelayMs: z.number().int().min(0).default(200),
  maxDelayMs: z.number().int().min(0).default(10_000),
  backoffMultiplier: z.number().min(1).max(10).default(2),
  retryableCategories: z
    .array(
      z.enum([
        'timeout',
        'validation',
        'provider',
        'policy',
        'approval_rejected',
        'approval_timeout',
        'unknown',
      ]),
    )
    .optional(),
});

export type RetryPolicy = z.infer<typeof RetryPolicySchema>;

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  initialDelayMs: 200,
  maxDelayMs: 10_000,
  backoffMultiplier: 2,
};

export const NO_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 1,
  initialDelayMs: 0,
  maxDelayMs: 0,
  backoffMultiplier: 1,
};

function delayMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface RetryAttempt {
  attempt: number;
  errorCategory: RunErrorCategory;
  errorMessage: string;
  delayedMs: number;
}

export interface RetryResult<T> {
  value: T;
  attempts: number;
  retryLog: RetryAttempt[];
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY,
  runId: string,
  stepId?: string,
): Promise<RetryResult<T>> {
  const retryLog: RetryAttempt[] = [];
  let delay = policy.initialDelayMs;

  for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
    try {
      const value = await fn();
      return { value, attempts: attempt, retryLog };
    } catch (err) {
      const category = categorizeError(err);
      const message = err instanceof Error ? err.message : String(err);

      const allowedCategories = policy.retryableCategories;
      const shouldRetry =
        attempt < policy.maxAttempts &&
        (allowedCategories ? allowedCategories.includes(category) : isRetryable(category));

      if (!shouldRetry) {
        throw new AgentRunError({
          message: `Step failed after ${attempt} attempt(s): ${message}`,
          category,
          runId,
          stepId,
          retryable: false,
          cause: err,
        });
      }

      retryLog.push({ attempt, errorCategory: category, errorMessage: message, delayedMs: delay });
      await delayMs(delay);
      delay = Math.min(delay * policy.backoffMultiplier, policy.maxDelayMs);
    }
  }

  throw new AgentRunError({
    message: `Step exhausted all ${policy.maxAttempts} retry attempt(s)`,
    category: 'unknown',
    runId,
    stepId,
    retryable: false,
  });
}
