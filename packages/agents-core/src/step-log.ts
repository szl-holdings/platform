import { z } from "zod";

export const StepLogLevelSchema = z.enum(["debug", "info", "warn", "error"]);
export type StepLogLevel = z.infer<typeof StepLogLevelSchema>;

export const StepLogEntrySchema = z.object({
  runId: z.string(),
  stepId: z.string(),
  stepName: z.string(),
  level: StepLogLevelSchema,
  message: z.string(),
  data: z.record(z.unknown()).optional(),
  durationMs: z.number().optional(),
  tokenCount: z.number().optional(),
  toolId: z.string().optional(),
  promptId: z.string().optional(),
  promptVersionId: z.string().optional(),
  approvalId: z.string().optional(),
  retryAttempt: z.number().int().nonnegative().optional(),
  error: z.string().optional(),
  timestamp: z.number(),
  otelSpanId: z.string().optional(),
  otelTraceId: z.string().optional(),
});

export type StepLogEntry = z.infer<typeof StepLogEntrySchema>;

export type StepLogSink = (entry: StepLogEntry) => void | Promise<void>;
export type StepLogSinkError = (sink: StepLogSink, entry: StepLogEntry, error: unknown) => void;

const sinks: StepLogSink[] = [];
const inMemoryLog: StepLogEntry[] = [];

let onSinkError: StepLogSinkError = (sink, entry, err) => {
  console.error("[agents-core:step-log] Sink threw an error — entry will still be in-memory log", {
    stepId: entry.stepId,
    runId: entry.runId,
    error: err instanceof Error ? err.message : String(err),
  });
};

export function registerStepLogSink(sink: StepLogSink): void {
  sinks.push(sink);
}

export function setStepLogSinkErrorHandler(handler: StepLogSinkError): void {
  onSinkError = handler;
}

export function clearStepLogSinks(): void {
  sinks.length = 0;
}

export async function emitStepLog(entry: Omit<StepLogEntry, "timestamp">): Promise<void> {
  const full: StepLogEntry = { ...entry, timestamp: Date.now() };
  inMemoryLog.push(full);
  for (const sink of sinks) {
    try {
      await sink(full);
    } catch (err) {
      onSinkError(sink, full, err);
    }
  }
}

export function getStepLog(runId?: string): readonly StepLogEntry[] {
  if (!runId) return inMemoryLog;
  return inMemoryLog.filter((e) => e.runId === runId);
}

export function clearStepLog(): void {
  inMemoryLog.length = 0;
}

export function makeStepLogger(runId: string, stepId: string, stepName: string) {
  return {
    info: (message: string, data?: Record<string, unknown>) =>
      emitStepLog({ runId, stepId, stepName, level: "info", message, data }),
    warn: (message: string, data?: Record<string, unknown>) =>
      emitStepLog({ runId, stepId, stepName, level: "warn", message, data }),
    error: (message: string, data?: Record<string, unknown>) =>
      emitStepLog({ runId, stepId, stepName, level: "error", message, data }),
    debug: (message: string, data?: Record<string, unknown>) =>
      emitStepLog({ runId, stepId, stepName, level: "debug", message, data }),
  };
}
