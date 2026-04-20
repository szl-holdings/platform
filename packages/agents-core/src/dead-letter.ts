import { z } from 'zod';
import type { RunErrorCategory } from './errors.js';

export const DeadLetterEntrySchema = z.object({
  runId: z.string(),
  stepId: z.string().optional(),
  objective: z.string(),
  failedAt: z.number(),
  errorCategory: z.enum([
    'timeout',
    'validation',
    'provider',
    'policy',
    'approval_rejected',
    'approval_timeout',
    'unknown',
  ]),
  errorMessage: z.string(),
  attemptCount: z.number().int().nonnegative(),
  context: z.record(z.unknown()).default({}),
  manuallyResolved: z.boolean().default(false),
  resolvedAt: z.number().optional(),
  resolvedBy: z.string().optional(),
  resolutionNote: z.string().optional(),
});

export type DeadLetterEntry = z.infer<typeof DeadLetterEntrySchema>;

const store: DeadLetterEntry[] = [];

export function sendToDeadLetter(params: {
  runId: string;
  stepId?: string;
  objective: string;
  errorCategory: RunErrorCategory;
  errorMessage: string;
  attemptCount: number;
  context?: Record<string, unknown>;
}): DeadLetterEntry {
  const entry: DeadLetterEntry = {
    runId: params.runId,
    stepId: params.stepId,
    objective: params.objective,
    failedAt: Date.now(),
    errorCategory: params.errorCategory,
    errorMessage: params.errorMessage,
    attemptCount: params.attemptCount,
    context: params.context ?? {},
    manuallyResolved: false,
  };
  store.push(entry);
  return entry;
}

export function resolveDeadLetterEntry(
  runId: string,
  options: { resolvedBy?: string; resolutionNote?: string } = {},
): boolean {
  const entry = store.find((e) => e.runId === runId && !e.manuallyResolved);
  if (!entry) return false;
  entry.manuallyResolved = true;
  entry.resolvedAt = Date.now();
  entry.resolvedBy = options.resolvedBy;
  entry.resolutionNote = options.resolutionNote;
  return true;
}

export function getDeadLetterEntries(options?: {
  unresolved?: boolean;
  errorCategory?: RunErrorCategory;
}): readonly DeadLetterEntry[] {
  let results = store as DeadLetterEntry[];
  if (options?.unresolved) results = results.filter((e) => !e.manuallyResolved);
  if (options?.errorCategory)
    results = results.filter((e) => e.errorCategory === options.errorCategory);
  return results;
}

export function getDeadLetterStats() {
  return {
    total: store.length,
    unresolved: store.filter((e) => !e.manuallyResolved).length,
    byCategory: Object.fromEntries(
      [
        'timeout',
        'validation',
        'provider',
        'policy',
        'approval_rejected',
        'approval_timeout',
        'unknown',
      ].map((cat) => [cat, store.filter((e) => e.errorCategory === cat).length]),
    ),
  };
}
