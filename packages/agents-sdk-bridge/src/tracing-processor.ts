/**
 * SzlTracingProcessor — custom @openai/agents TracingProcessor
 *
 * Dual-exports every SDK trace/span into:
 *   1. OpenAI's Traces dashboard (via default SDK exporter already registered)
 *   2. SZL's Trace Graph (Postgres store)
 *   3. Cognitive Observability metrics
 *   4. Behavioral Tracer (routing DecisionForks)
 */

import { globalCollector } from '@workspace/cognitive-observability';
import { defaultTraceStore, TraceWriter } from '@workspace/trace-graph';
import type { TraceStore } from '@workspace/trace-graph/store';
import type { Span, Trace, TracingProcessor } from '@openai/agents';
import type { BehavioralTracerBridge } from './behavioral-tracer-bridge.js';
import { redactSensitiveData } from './pii-filter.js';

const log = {
  warn: (msg: string, meta?: unknown) => console.warn(`[SzlTracingProcessor] ${msg}`, meta ?? ''),
  debug: (msg: string, meta?: unknown) => console.debug(`[SzlTracingProcessor] ${msg}`, meta ?? ''),
};

type SpanDataBase = { type: string };
type AgentSpanData = SpanDataBase & { type: 'agent'; name: string; handoffs?: string[]; tools?: string[]; output_type?: string };
type FunctionSpanData = SpanDataBase & { type: 'function'; name: string; input: string; output: string };
type GenerationSpanData = SpanDataBase & { type: 'generation'; input?: Array<Record<string, unknown>>; output?: Array<Record<string, unknown>>; model?: string; usage?: Record<string, unknown> };
type HandoffSpanData = SpanDataBase & { type: 'handoff'; from_agent?: string; to_agent?: string };
type GuardrailSpanData = SpanDataBase & { type: 'guardrail'; name: string; triggered: boolean };
type SpanData = SpanDataBase & Record<string, unknown>;

export interface SzlTracingProcessorOptions {
  /**
   * When true, include raw inputs/outputs in traces (mirrors SDK trace_include_sensitive_data).
   * Defaults to false — all potentially-sensitive fields are PII-redacted.
   */
  includeSensitiveData?: boolean;

  /**
   * Optional behavioral tracer bridge for recording routing DecisionForks.
   */
  behavioralTracer?: BehavioralTracerBridge;

  /**
   * Override the trace store. Defaults to defaultTraceStore.
   */
  traceStore?: TraceStore;
}

export class SzlTracingProcessor implements TracingProcessor {
  private readonly writer: TraceWriter;
  private readonly includeSensitiveData: boolean;
  private readonly behavioralTracer?: BehavioralTracerBridge;

  constructor(options: SzlTracingProcessorOptions = {}) {
    this.writer = new TraceWriter(options.traceStore ?? defaultTraceStore);
    this.includeSensitiveData = options.includeSensitiveData ?? false;
    this.behavioralTracer = options.behavioralTracer;
  }

  async onTraceStart(trace: Trace): Promise<void> {
    try {
      this.writer.startTrace({
        traceId: trace.traceId,
        runId: trace.traceId,
        agentId: trace.name ?? 'sdk-agent',
        objective: trace.name ?? 'OpenAI Agents SDK run',
        metadata: {
          source: 'openai-agents-sdk',
          groupId: trace.groupId ?? null,
          sdkMetadata: trace.metadata ?? {},
        },
      });

      globalCollector.recordKnown('run_started', 1, {
        traceId: trace.traceId,
        source: 'openai-agents-sdk',
      });
    } catch (err) {
      log.warn(`onTraceStart failed for traceId=${trace.traceId}`, err);
    }
  }

  async onTraceEnd(trace: Trace): Promise<void> {
    try {
      this.writer.completeTrace(trace.traceId, {
        status: 'completed',
      });

      globalCollector.recordKnown('run_completed', 0, {
        traceId: trace.traceId,
        source: 'openai-agents-sdk',
      });
    } catch (err) {
      log.warn(`onTraceEnd failed for traceId=${trace.traceId}`, err);
    }
  }

  async onSpanStart(span: Span<any>): Promise<void> {
    try {
      const trace = this.writer['store']?.get(span.traceId);
      if (!trace) return;

      this.writer.appendSpan(span.traceId, {
        spanId: span.spanId,
        parentSpanId: span.parentId ?? span.traceId,
        name: this.spanName(span),
        startedAt: span.startedAt ?? new Date().toISOString(),
        endedAt: undefined,
        status: 'pending',
        attributes: {
          spanType: span.spanData.type,
          source: 'openai-agents-sdk',
        },
      });
    } catch (err) {
      log.debug(`onSpanStart write failed for spanId=${span.spanId}`, err);
    }
  }

  async onSpanEnd(span: Span<any>): Promise<void> {
    try {
      const endedAt = span.endedAt ?? new Date().toISOString();
      const startedAt = span.startedAt ?? endedAt;
      const latencyMs = new Date(endedAt).getTime() - new Date(startedAt).getTime();
      const hasError = !!span.error;

      await this.routeSpan(span, latencyMs, startedAt, endedAt, hasError);
    } catch (err) {
      log.warn(`onSpanEnd failed for spanId=${span.spanId}`, err);
    }
  }

  private async routeSpan(
    span: Span<any>,
    latencyMs: number,
    startedAt: string,
    endedAt: string,
    hasError: boolean,
  ): Promise<void> {
    const data = span.spanData;

    switch (data.type) {
      case 'agent':
        await this.handleAgentSpan(span as Span<any>, latencyMs, startedAt, endedAt, hasError);
        break;
      case 'generation':
        await this.handleGenerationSpan(span as Span<any>, latencyMs, startedAt, endedAt, hasError);
        break;
      case 'function':
        await this.handleFunctionSpan(span as Span<any>, latencyMs, startedAt, endedAt, hasError);
        break;
      case 'guardrail':
        await this.handleGuardrailSpan(span as Span<any>, latencyMs, startedAt, endedAt);
        break;
      case 'handoff':
        await this.handleHandoffSpan(span as Span<any>, latencyMs, startedAt, endedAt, hasError);
        break;
      default:
        await this.handleGenericSpan(span, latencyMs, startedAt, endedAt, hasError);
        break;
    }
  }

  private async handleAgentSpan(
    span: Span<any>,
    latencyMs: number,
    startedAt: string,
    endedAt: string,
    hasError: boolean,
  ): Promise<void> {
    const data = span.spanData;

    this.updateSpan(span.traceId, span.spanId, {
      name: `agent:${data.name}`,
      startedAt,
      endedAt,
      latencyMs,
      status: hasError ? 'error' : 'ok',
      errorMessage: span.error?.message,
      attributes: {
        spanType: 'agent',
        agentName: data.name,
        tools: (data.tools ?? []).join(','),
        handoffs: (data.handoffs ?? []).join(','),
        outputType: data.output_type ?? '',
        source: 'openai-agents-sdk',
      },
    });

    globalCollector.recordKnown('latency_ms', latencyMs, {
      spanType: 'agent',
      agentName: data.name,
      traceId: span.traceId,
    });
  }

  private async handleGenerationSpan(
    span: Span<any>,
    latencyMs: number,
    startedAt: string,
    endedAt: string,
    hasError: boolean,
  ): Promise<void> {
    const data = span.spanData;
    const usage: Record<string, unknown> = (data.usage as Record<string, unknown>) ?? {};
    const inputTokens = typeof usage['input_tokens'] === 'number'
      ? usage['input_tokens']
      : typeof usage['prompt_tokens'] === 'number' ? usage['prompt_tokens'] : 0;
    const outputTokens = typeof usage['output_tokens'] === 'number'
      ? usage['output_tokens']
      : typeof usage['completion_tokens'] === 'number' ? usage['completion_tokens'] : 0;
    const totalTokens = inputTokens + outputTokens;

    const attrs: Record<string, unknown> = {
      spanType: 'generation',
      model: data.model ?? '',
      source: 'openai-agents-sdk',
      inputTokens,
      outputTokens,
      totalTokens,
    };

    if (this.includeSensitiveData) {
      attrs['input'] = JSON.stringify(data.input ?? []);
      attrs['output'] = JSON.stringify(data.output ?? []);
    }

    this.updateSpan(span.traceId, span.spanId, {
      name: `generation:${data.model ?? 'unknown'}`,
      startedAt,
      endedAt,
      latencyMs,
      status: hasError ? 'error' : 'ok',
      errorMessage: span.error?.message,
      attributes: attrs,
    });

    if (totalTokens > 0) {
      globalCollector.recordKnown('token_count', totalTokens, {
        model: data.model ?? 'unknown',
        traceId: span.traceId,
        spanType: 'generation',
      });
    }

    globalCollector.recordKnown('latency_ms', latencyMs, {
      spanType: 'generation',
      model: data.model ?? 'unknown',
      traceId: span.traceId,
    });

    try {
      this.writer.appendToolCall(span.traceId, {
        toolId: `generation:${data.model ?? 'unknown'}`,
        toolName: `LLM Generation (${data.model ?? 'unknown'})`,
        latencyMs,
        tokens: totalTokens,
        success: !hasError,
        ...(hasError ? { errorCode: span.error?.message ?? 'generation_error' } : {}),
        retries: 0,
        approvalRequired: false,
      });
    } catch {
    }
  }

  private async handleFunctionSpan(
    span: Span<any>,
    latencyMs: number,
    startedAt: string,
    endedAt: string,
    hasError: boolean,
  ): Promise<void> {
    const data = span.spanData;

    const safeInput = this.includeSensitiveData
      ? data.input
      : redactSensitiveData(data.input);

    const safeOutput = this.includeSensitiveData
      ? data.output
      : redactSensitiveData(data.output);

    this.updateSpan(span.traceId, span.spanId, {
      name: `function:${data.name}`,
      startedAt,
      endedAt,
      latencyMs,
      status: hasError ? 'error' : 'ok',
      errorMessage: span.error?.message,
      attributes: {
        spanType: 'function',
        toolName: data.name,
        input: safeInput,
        output: safeOutput,
        source: 'openai-agents-sdk',
      },
    });

    try {
      this.writer.appendToolCall(span.traceId, {
        toolId: `function:${data.name}`,
        toolName: data.name,
        latencyMs,
        success: !hasError,
        ...(hasError ? { errorCode: span.error?.message ?? 'function_error' } : {}),
        retries: 0,
        approvalRequired: false,
      });
    } catch {
    }

    globalCollector.recordKnown('latency_ms', latencyMs, {
      spanType: 'function',
      toolName: data.name,
      traceId: span.traceId,
    });

    if (hasError) {
      globalCollector.recordKnown('tool_error_rate', 1, {
        toolName: data.name,
        traceId: span.traceId,
      });
    }
  }

  private async handleGuardrailSpan(
    span: Span<any>,
    _latencyMs: number,
    startedAt: string,
    endedAt: string,
  ): Promise<void> {
    const data = span.spanData;
    const outcome = data.triggered ? 'block' : 'pass';

    this.updateSpan(span.traceId, span.spanId, {
      name: `guardrail:${data.name}`,
      startedAt,
      endedAt,
      status: 'ok',
      attributes: {
        spanType: 'guardrail',
        guardrailName: data.name,
        triggered: String(data.triggered),
        outcome,
        source: 'openai-agents-sdk',
      },
    });

    try {
      this.writer.appendGuardrailResult(span.traceId, {
        guardId: `sdk:${data.name}`,
        tier: 'internal-workflow',
        outcome,
        reason: data.triggered ? `SDK guardrail '${data.name}' triggered` : undefined,
      });
    } catch {
    }
  }

  private async handleHandoffSpan(
    span: Span<any>,
    latencyMs: number,
    startedAt: string,
    endedAt: string,
    hasError: boolean,
  ): Promise<void> {
    const data = span.spanData;

    this.updateSpan(span.traceId, span.spanId, {
      name: `handoff:${data.from_agent ?? 'unknown'}->${data.to_agent ?? 'unknown'}`,
      startedAt,
      endedAt,
      latencyMs,
      status: hasError ? 'error' : 'ok',
      errorMessage: span.error?.message,
      attributes: {
        spanType: 'handoff',
        fromAgent: data.from_agent ?? '',
        toAgent: data.to_agent ?? '',
        source: 'openai-agents-sdk',
      },
    });

    if (this.behavioralTracer) {
      try {
        await this.behavioralTracer.recordRoutingFork({
          forkId: span.spanId,
          parentForkId: span.parentId ?? null,
          traceId: span.traceId,
          agentId: data.from_agent ?? 'unknown',
          agentName: data.from_agent ?? 'unknown',
          domain: 'orchestration',
          decision: `Handoff to ${data.to_agent ?? 'unknown'}`,
          output: `Agent ${data.from_agent ?? 'unknown'} handed off to ${data.to_agent ?? 'unknown'}`,
          latencyMs,
          timestamp: endedAt,
          metadata: {
            fromAgent: data.from_agent,
            toAgent: data.to_agent,
            source: 'openai-agents-sdk',
          },
        });
      } catch {
      }
    }
  }

  private async handleGenericSpan(
    span: Span<any>,
    latencyMs: number,
    startedAt: string,
    endedAt: string,
    hasError: boolean,
  ): Promise<void> {
    this.updateSpan(span.traceId, span.spanId, {
      name: `${span.spanData.type}:${this.spanName(span)}`,
      startedAt,
      endedAt,
      latencyMs,
      status: hasError ? 'error' : 'ok',
      errorMessage: span.error?.message,
      attributes: {
        spanType: span.spanData.type,
        source: 'openai-agents-sdk',
      },
    });
  }

  private updateSpan(
    traceId: string,
    spanId: string,
    updates: {
      name: string;
      startedAt: string;
      endedAt?: string;
      latencyMs?: number;
      status?: 'ok' | 'error' | 'pending';
      errorMessage?: string;
      attributes?: Record<string, unknown>;
    },
  ): void {
    try {
      const trace = this.writer['store']?.get(traceId);
      if (!trace) return;

      const existingIdx = trace.spans.findIndex((s) => s.spanId === spanId);
      // Preserve parentSpanId from the existing span record (set during onSpanStart)
      // so that updating on span-end never loses the parent-child relationship.
      const existingParentSpanId = existingIdx >= 0
        ? trace.spans[existingIdx].parentSpanId
        : undefined;

      const span = {
        spanId,
        parentSpanId: existingParentSpanId
          ?? (updates.attributes?.['parentSpanId'] as string | undefined),
        name: updates.name,
        startedAt: updates.startedAt,
        endedAt: updates.endedAt,
        latencyMs: updates.latencyMs,
        status: updates.status ?? 'ok',
        errorMessage: updates.errorMessage,
        attributes: updates.attributes ?? {},
      };

      if (existingIdx >= 0) {
        trace.spans[existingIdx] = span;
      } else {
        trace.spans.push(span);
      }
      this.writer.store.save(trace);
    } catch (err) {
      log.debug(`updateSpan failed for spanId=${spanId}`, err);
    }
  }

  private spanName(span: Span<any>): string {
    const data = span.spanData as Record<string, unknown>;
    return (data['name'] as string) ?? span.spanData.type;
  }

  async shutdown(_timeout?: number): Promise<void> {
  }

  async forceFlush(): Promise<void> {
  }
}

/**
 * Register the SzlTracingProcessor with the global @openai/agents provider.
 * This must be called at application startup, before any agent runs.
 */
export async function registerSzlTracingProcessor(
  options: SzlTracingProcessorOptions = {},
): Promise<SzlTracingProcessor> {
  const { getGlobalTraceProvider } = await import('@openai/agents');
  const processor = new SzlTracingProcessor(options);
  getGlobalTraceProvider().registerProcessor(processor);
  return processor;
}
