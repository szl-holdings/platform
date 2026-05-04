import type { OperatorId, OperatorOutput, TraceEntry } from '../types.js';
import { createTrace, appendEntry, completeTrace, buildTraceEntry } from '../tracing/store.js';
import { routeModelCall } from '../router/model-router.js';
import { routeModelViaPython, isWorkerConfigured, isWorkerReady } from '../substrate-worker-bridge.js';
import { randomUUID } from 'node:crypto';

export interface OperatorContext {
  actionId?: string;
  signalIds?: string[];
  vertical?: string;
  input: Record<string, unknown>;
  approvalRecordId?: string;
}

export abstract class BaseOperator {
  abstract readonly operatorId: OperatorId;
  abstract readonly displayName: string;
  abstract readonly description: string;

  protected traceId: string | null = null;
  protected runId: string | null = null;

  protected async callModel(prompt: string, systemPrompt?: string): Promise<{ content: string; tokensUsed: number; costEstimateUsd: number; latencyMs: number }> {
    const t = Date.now();
    // When the Python worker bridge is configured and ready, ask Python to select
    // the model/provider (model_router.py is source-of-truth for selection logic).
    // The result overrides the local resolveProvider() chain in model-router.ts.
    // Falls back to local TS routing if the bridge is unavailable or returns an error.
    let overrideModel: string | undefined;
    if (isWorkerConfigured() && isWorkerReady() && this.runId) {
      const routeResult = await routeModelViaPython({
        runId: this.runId,
        traceId: this.traceId ?? `trace-${this.runId}`,
        role: 'reasoning',
        mode: 'dry-run',
      });
      if (routeResult.ok && !routeResult.result.isDemo) {
        overrideModel = routeResult.result.model;
      }
    }
    const resp = await routeModelCall({ prompt, systemPrompt, maxTokens: 512, temperature: 0.2, model: overrideModel });
    const latencyMs = Date.now() - t;
    const costEstimateUsd = resp.tokensUsed * 0.000002;

    if (this.traceId && this.runId) {
      appendEntry(this.traceId, buildTraceEntry(
        this.runId,
        this.operatorId,
        'model',
        `model:${resp.model}`,
        { prompt: prompt.slice(0, 100) },
        { content: resp.content.slice(0, 100), isDemo: resp.isDemo },
        'ok',
        latencyMs,
        { tokensUsed: resp.tokensUsed, costEstimateUsd },
      ));
    }

    return { content: resp.content, tokensUsed: resp.tokensUsed, costEstimateUsd, latencyMs };
  }

  protected logEntry(
    entityType: TraceEntry['entityType'],
    name: string,
    input: Record<string, unknown>,
    output: Record<string, unknown>,
    status: TraceEntry['status'],
    durationMs: number,
    opts?: { tokensUsed?: number; costEstimateUsd?: number; errorMessage?: string },
  ): void {
    if (!this.traceId || !this.runId) return;
    appendEntry(this.traceId, buildTraceEntry(
      this.runId,
      this.operatorId,
      entityType,
      name,
      input,
      output,
      status,
      durationMs,
      opts,
    ));
  }

  async run(ctx: OperatorContext): Promise<OperatorOutput> {
    this.runId = `run-${randomUUID().slice(0, 8)}`;
    this.traceId = createTrace({
      runId: this.runId,
      entityId: ctx.actionId ?? this.operatorId,
      entityType: 'operator',
    });

    const t = Date.now();

    this.logEntry('operator', `operator:${this.operatorId}:start`, ctx.input, {}, 'ok', 0);

    try {
      const result = await this.execute(ctx);
      const durationMs = Date.now() - t;

      this.logEntry('operator', `operator:${this.operatorId}:complete`, ctx.input, result.result, 'ok', durationMs);
      completeTrace(this.traceId, 'completed');

      return {
        ...result,
        operatorId: this.operatorId,
        runId: this.runId,
        actionId: ctx.actionId,
        traceEntries: [],
        completedAt: new Date().toISOString(),
      };
    } catch (err) {
      const durationMs = Date.now() - t;
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logEntry('operator', `operator:${this.operatorId}:error`, ctx.input, {}, 'error', durationMs, { errorMessage });
      completeTrace(this.traceId, 'failed');

      return {
        operatorId: this.operatorId,
        runId: this.runId,
        actionId: ctx.actionId,
        result: { error: errorMessage },
        traceEntries: [],
        completedAt: new Date().toISOString(),
      };
    }
  }

  protected abstract execute(ctx: OperatorContext): Promise<Omit<OperatorOutput, 'operatorId' | 'runId' | 'actionId' | 'traceEntries' | 'completedAt'>>;

  getTraceId(): string | null { return this.traceId; }
}
