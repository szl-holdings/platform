import { z } from 'zod';

export const RunErrorCategorySchema = z.enum([
  'timeout',
  'validation',
  'provider',
  'policy',
  'approval_rejected',
  'approval_timeout',
  'unknown',
]);

export type RunErrorCategory = z.infer<typeof RunErrorCategorySchema>;

export class AgentRunError extends Error {
  readonly category: RunErrorCategory;
  readonly runId: string;
  readonly stepId: string | undefined;
  readonly retryable: boolean;
  readonly originalError: unknown;

  constructor(params: {
    message: string;
    category: RunErrorCategory;
    runId: string;
    stepId?: string;
    retryable?: boolean;
    cause?: unknown;
  }) {
    super(params.message, { cause: params.cause });
    this.name = 'AgentRunError';
    this.category = params.category;
    this.runId = params.runId;
    this.stepId = params.stepId;
    this.retryable = params.retryable ?? false;
    this.originalError = params.cause;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      runId: this.runId,
      stepId: this.stepId,
      retryable: this.retryable,
    };
  }
}

export function categorizeError(err: unknown): RunErrorCategory {
  if (err instanceof AgentRunError) return err.category;
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes('timeout') || msg.includes('timed out')) return 'timeout';
    if (msg.includes('zod') || msg.includes('validation') || msg.includes('parse'))
      return 'validation';
    if (msg.includes('policy') || msg.includes('block') || msg.includes('guardrail'))
      return 'policy';
    if (msg.includes('model') || msg.includes('provider') || msg.includes('llm')) return 'provider';
  }
  return 'unknown';
}

export const RETRYABLE_CATEGORIES: ReadonlySet<RunErrorCategory> = new Set<RunErrorCategory>([
  'timeout',
  'provider',
  'unknown',
]);

export function isRetryable(category: RunErrorCategory): boolean {
  return RETRYABLE_CATEGORIES.has(category);
}
