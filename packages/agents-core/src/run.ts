import { globalCollector } from '@workspace/cognitive-observability';
import { defaultTraceStore, TraceWriter } from '@workspace/trace-graph';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { type ApprovalGateRequest, requestApproval } from './approval-gate.js';
import { sendToDeadLetter } from './dead-letter.js';
import { type RunErrorCategory, AgentRunError, categorizeError } from './errors.js';
import { DEFAULT_RETRY_POLICY, type RetryPolicy, withRetry } from './retry.js';
import { saveStepIO } from './step-io-store.js';
import { emitStepLog, makeStepLogger } from './step-log.js';

export const RunStatusSchema = z.enum([
  'idle',
  'running',
  'pending_approval',
  'completed',
  'failed',
  'dead_lettered',
]);
export type RunStatus = z.infer<typeof RunStatusSchema>;

export const StepStatusSchema = z.enum([
  'pending',
  'running',
  'completed',
  'failed',
  'skipped',
  'pending_approval',
  'approval_rejected',
]);
export type StepStatus = z.infer<typeof StepStatusSchema>;

export interface StepDefinition<TInput = unknown, TOutput = unknown> {
  id: string;
  name: string;
  requiresApproval?: boolean;
  approvalJustification?: string;
  projectedImpact?: string;
  projectedRisk?: string;
  retryPolicy?: RetryPolicy;
  timeoutMs?: number;
  toolId?: string;
  promptId?: string;
  handler: (input: TInput, ctx: StepContext) => Promise<TOutput>;
}

export interface StepContext {
  runId: string;
  stepId: string;
  stepName: string;
  attemptNumber: number;
  logger: ReturnType<typeof makeStepLogger>;
  requestApproval: (
    req: Omit<ApprovalGateRequest, 'runId' | 'stepId' | 'stepName'>,
  ) => Promise<void>;
}

export interface StepResult<TOutput = unknown> {
  stepId: string;
  stepName: string;
  toolId?: string;
  promptId?: string;
  status: StepStatus;
  output?: TOutput;
  error?: string;
  errorCategory?: RunErrorCategory;
  startedAt: number;
  completedAt: number;
  durationMs: number;
  retryCount: number;
  approvalId?: string;
  traceId?: string;
}

export interface AgentRunSummary {
  runId: string;
  objective: string;
  status: RunStatus;
  startedAt: number;
  completedAt?: number;
  durationMs?: number;
  stepResults: StepResult[];
  errorMessage?: string;
  errorCategory?: RunErrorCategory;
  traceId: string;
}

export interface AgentRunOptions {
  runId?: string;
  retryPolicy?: RetryPolicy;
  timeoutMs?: number;
  domain?: string;
  surface?: string;
  agentId?: string;
  metadata?: Record<string, unknown>;
  onStepComplete?: (result: StepResult) => void | Promise<void>;
  onStatusChange?: (status: RunStatus) => void | Promise<void>;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  if (ms <= 0) return promise;
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout: '${label}' exceeded ${ms}ms`));
    }, ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

export class AgentRun {
  readonly runId: string;
  readonly traceId: string;
  readonly objective: string;
  private _status: RunStatus = 'idle';
  private readonly stepResults: StepResult[] = [];
  private readonly options: AgentRunOptions;
  private readonly startedAt: number;
  private readonly traceWriter: TraceWriter;

  constructor(objective: string, options: AgentRunOptions = {}) {
    this.runId = options.runId ?? randomUUID();
    this.traceId = this.runId;
    this.objective = objective;
    this.options = {
      retryPolicy: options.retryPolicy ?? DEFAULT_RETRY_POLICY,
      ...options,
    };
    this.startedAt = Date.now();
    this.traceWriter = new TraceWriter(defaultTraceStore);
  }

  get status(): RunStatus {
    return this._status;
  }

  private async setStatus(status: RunStatus): Promise<void> {
    this._status = status;
    globalCollector.recordKnown('run_status_transition' as any, 1, {
      runId: this.runId,
      status,
    });
    if (this.options.onStatusChange) {
      await this.options.onStatusChange(status);
    }
  }

  async start(): Promise<void> {
    await this.setStatus('running');

    this.traceWriter.startTrace({
      traceId: this.traceId,
      runId: this.runId,
      agentId: this.options.agentId ?? 'agents-core',
      objective: this.objective,
    });

    await emitStepLog({
      runId: this.runId,
      stepId: 'run:start',
      stepName: 'run.start',
      level: 'info',
      message: `Agent run started: ${this.objective}`,
      data: { objective: this.objective, metadata: this.options.metadata },
    });
    globalCollector.recordKnown('run_started' as any, 1, { runId: this.runId });
  }

  async step<TInput, TOutput>(
    definition: StepDefinition<TInput, TOutput>,
    input: TInput,
  ): Promise<TOutput> {
    if (this._status !== 'running') {
      throw new AgentRunError({
        message: `Cannot execute step '${definition.name}' — run is in status '${this._status}'`,
        category: 'validation',
        runId: this.runId,
        stepId: definition.id,
        retryable: false,
      });
    }

    const stepStart = Date.now();
    const logger = makeStepLogger(this.runId, definition.id, definition.name);
    const spanId = randomUUID();

    await logger.info('Step starting', { stepId: definition.id });

    globalCollector.recordKnown('step_started' as any, 1, {
      runId: this.runId,
      stepId: definition.id,
      stepName: definition.name,
      spanId,
    });

    const stepCtx: StepContext = {
      runId: this.runId,
      stepId: definition.id,
      stepName: definition.name,
      attemptNumber: 1,
      logger,
      requestApproval: async (req) => {
        await this.setStatus('pending_approval');
        await requestApproval({
          runId: this.runId,
          stepId: definition.id,
          stepName: definition.name,
          ...req,
        });
        await this.setStatus('running');
      },
    };

    const policy = definition.retryPolicy ?? this.options.retryPolicy ?? DEFAULT_RETRY_POLICY;
    const stepTimeoutMs = definition.timeoutMs ?? this.options.timeoutMs ?? 0;

    try {
      if (definition.requiresApproval) {
        await this.setStatus('pending_approval');
        await requestApproval({
          runId: this.runId,
          stepId: definition.id,
          stepName: definition.name,
          toolId: definition.toolId,
          action: definition.name,
          justification:
            definition.approvalJustification ??
            `Step '${definition.name}' requires approval before execution`,
          projectedImpact: definition.projectedImpact ?? 'medium',
          projectedRisk: definition.projectedRisk ?? 'medium',
          domain: this.options.domain,
          surface: this.options.surface,
        });
        await this.setStatus('running');
      }

      const retryResult = await withRetry(
        () => {
          stepCtx.attemptNumber++;
          const handlerPromise = definition.handler(input, stepCtx);
          return stepTimeoutMs > 0
            ? withTimeout(handlerPromise, stepTimeoutMs, definition.name)
            : handlerPromise;
        },
        policy,
        this.runId,
        definition.id,
      );

      const completedAt = Date.now();
      const durationMs = completedAt - stepStart;

      saveStepIO({
        runId: this.runId,
        stepId: definition.id,
        stepName: definition.name,
        toolId: definition.toolId,
        promptId: definition.promptId,
        input,
        output: retryResult.value,
        startedAt: stepStart,
        completedAt,
        durationMs,
        retryCount: retryResult.attempts - 1,
        traceId: this.traceId,
      });

      this.traceWriter.appendToolCall(this.traceId, {
        toolId: definition.toolId ?? definition.id,
        toolName: definition.name,
        latencyMs: durationMs,
        success: true,
        retries: retryResult.attempts - 1,
        approvalRequired: definition.requiresApproval ?? false,
      });

      this.traceWriter.appendSpan(this.traceId, {
        spanId,
        parentSpanId: this.traceId,
        name: definition.name,
        startedAt: new Date(stepStart).toISOString(),
        endedAt: new Date(completedAt).toISOString(),
        latencyMs: durationMs,
        status: 'ok',
        attributes: {
          toolId: definition.toolId,
          promptId: definition.promptId,
          retryCount: retryResult.attempts - 1,
        },
      });

      const stepResult: StepResult<TOutput> = {
        stepId: definition.id,
        stepName: definition.name,
        toolId: definition.toolId,
        promptId: definition.promptId,
        status: 'completed',
        output: retryResult.value,
        startedAt: stepStart,
        completedAt,
        durationMs,
        retryCount: retryResult.attempts - 1,
        traceId: this.traceId,
      };

      this.stepResults.push(stepResult);
      globalCollector.recordKnown('step_completed' as any, durationMs, {
        runId: this.runId,
        stepId: definition.id,
        retries: String(retryResult.attempts - 1),
        spanId,
      });

      await logger.info('Step completed', {
        durationMs,
        retries: stepResult.retryCount,
        otelSpanId: spanId,
      });

      if (this.options.onStepComplete) {
        await this.options.onStepComplete(stepResult);
      }

      return retryResult.value;
    } catch (err) {
      const completedAt = Date.now();
      const durationMs = completedAt - stepStart;
      const category = categorizeError(err);
      const message = err instanceof Error ? err.message : String(err);

      this.traceWriter.appendToolCall(this.traceId, {
        toolId: definition.toolId ?? definition.id,
        toolName: definition.name,
        latencyMs: durationMs,
        success: false,
        errorCode: category,
        retries: policy.maxAttempts - 1,
        approvalRequired: definition.requiresApproval ?? false,
      });

      this.traceWriter.appendSpan(this.traceId, {
        spanId,
        parentSpanId: this.traceId,
        name: definition.name,
        startedAt: new Date(stepStart).toISOString(),
        endedAt: new Date(completedAt).toISOString(),
        latencyMs: durationMs,
        status: 'error',
        errorMessage: message,
        attributes: { errorCategory: category },
      });

      const stepResult: StepResult = {
        stepId: definition.id,
        stepName: definition.name,
        toolId: definition.toolId,
        promptId: definition.promptId,
        status: 'failed',
        error: message,
        errorCategory: category,
        startedAt: stepStart,
        completedAt,
        durationMs,
        retryCount: policy.maxAttempts - 1,
        traceId: this.traceId,
      };

      this.stepResults.push(stepResult);
      globalCollector.recordKnown('step_failed' as any, durationMs, {
        runId: this.runId,
        stepId: definition.id,
        errorCategory: category,
        spanId,
      });

      await logger.error('Step failed', { error: message, category, otelSpanId: spanId });

      if (this.options.onStepComplete) {
        await this.options.onStepComplete(stepResult);
      }

      throw err;
    }
  }

  async complete(summary?: string): Promise<AgentRunSummary> {
    await this.setStatus('completed');
    const completedAt = Date.now();
    const durationMs = completedAt - this.startedAt;

    try {
      this.traceWriter.completeTrace(this.traceId, {
        status: 'completed',
        latencyMs: durationMs,
      });
    } catch (_traceErr) {
    }

    await emitStepLog({
      runId: this.runId,
      stepId: 'run:complete',
      stepName: 'run.complete',
      level: 'info',
      message: summary ?? 'Agent run completed successfully',
      data: { stepCount: this.stepResults.length },
    });

    globalCollector.recordKnown('run_completed' as any, durationMs, {
      runId: this.runId,
      stepCount: String(this.stepResults.length),
    });

    return this.toSummary(completedAt);
  }

  async fail(error: unknown): Promise<AgentRunSummary> {
    const category = categorizeError(error);
    const message = error instanceof Error ? error.message : String(error);

    await this.setStatus('failed');
    const completedAt = Date.now();
    const durationMs = completedAt - this.startedAt;

    try {
      this.traceWriter.recordError(this.traceId, category, message);
      this.traceWriter.completeTrace(this.traceId, {
        status: 'failed',
        latencyMs: durationMs,
      });
    } catch (_traceErr) {
    }

    await emitStepLog({
      runId: this.runId,
      stepId: 'run:fail',
      stepName: 'run.fail',
      level: 'error',
      message: `Agent run failed: ${message}`,
      data: { errorCategory: category },
    });

    globalCollector.recordKnown('run_failed' as any, completedAt - this.startedAt, {
      runId: this.runId,
      errorCategory: category,
    });

    const failedSteps = this.stepResults.filter((s) => s.status === 'failed');
    const totalAttempts = failedSteps.reduce((sum, s) => sum + s.retryCount + 1, 0);
    const maxAttempts = (this.options.retryPolicy ?? DEFAULT_RETRY_POLICY).maxAttempts;

    if (failedSteps.length > 0 && totalAttempts >= maxAttempts) {
      await this.setStatus('dead_lettered');
      sendToDeadLetter({
        runId: this.runId,
        objective: this.objective,
        errorCategory: category,
        errorMessage: message,
        attemptCount: totalAttempts,
        context: this.options.metadata,
      });
    }

    return this.toSummary(completedAt, message, category);
  }

  toSummary(
    completedAt?: number,
    errorMessage?: string,
    errorCategory?: RunErrorCategory,
  ): AgentRunSummary {
    const now = completedAt ?? Date.now();
    return {
      runId: this.runId,
      objective: this.objective,
      status: this._status,
      startedAt: this.startedAt,
      completedAt: now,
      durationMs: now - this.startedAt,
      stepResults: [...this.stepResults],
      errorMessage,
      errorCategory,
      traceId: this.traceId,
    };
  }
}

export function createAgentRun(objective: string, options?: AgentRunOptions): AgentRun {
  return new AgentRun(objective, options);
}
