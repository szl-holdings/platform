/**
 * Metrics bridge — standalone helpers for pushing Cognitive Observability
 * metrics from SDK span data.
 *
 * Extracted from SzlTracingProcessor so they can also be used independently
 * (e.g. in tests or when building custom processors).
 */

import { globalCollector } from '@workspace/cognitive-observability';
import type { KnownMetricName } from '@workspace/cognitive-observability/metrics';

export interface GenerationMetrics {
  model: string;
  traceId: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

export interface ToolMetrics {
  toolName: string;
  traceId: string;
  latencyMs: number;
  success: boolean;
}

export interface ApprovalBottleneckMetrics {
  traceId: string;
  waitMs: number;
}

/**
 * Record metrics for a completed generation (LLM call).
 */
export function recordGenerationMetrics(metrics: GenerationMetrics): void {
  const totalTokens = metrics.inputTokens + metrics.outputTokens;

  if (totalTokens > 0) {
    globalCollector.recordKnown('token_count' as KnownMetricName, totalTokens, {
      model: metrics.model,
      traceId: metrics.traceId,
      source: 'openai-agents-sdk',
    });
  }

  globalCollector.recordKnown('latency_ms' as KnownMetricName, metrics.latencyMs, {
    model: metrics.model,
    traceId: metrics.traceId,
    spanType: 'generation',
    source: 'openai-agents-sdk',
  });
}

/**
 * Record metrics for a completed tool call.
 */
export function recordToolMetrics(metrics: ToolMetrics): void {
  globalCollector.recordKnown('latency_ms' as KnownMetricName, metrics.latencyMs, {
    toolName: metrics.toolName,
    traceId: metrics.traceId,
    spanType: 'function',
    source: 'openai-agents-sdk',
  });

  if (!metrics.success) {
    globalCollector.recordKnown('tool_error_rate' as KnownMetricName, 1, {
      toolName: metrics.toolName,
      traceId: metrics.traceId,
      source: 'openai-agents-sdk',
    });
  }
}

/**
 * Record how long an approval gate blocked an agent run.
 */
export function recordApprovalBottleneck(metrics: ApprovalBottleneckMetrics): void {
  globalCollector.recordKnown('approval_bottleneck_ms' as KnownMetricName, metrics.waitMs, {
    traceId: metrics.traceId,
    source: 'openai-agents-sdk',
  });
}

/**
 * Record an agent run start event.
 */
export function recordRunStart(traceId: string, agentName: string): void {
  globalCollector.recordKnown('run_started', 1, {
    traceId,
    agentName,
    source: 'openai-agents-sdk',
  });
}

/**
 * Record an agent run completion event.
 */
export function recordRunComplete(traceId: string, agentName: string, latencyMs: number): void {
  globalCollector.recordKnown('run_completed', latencyMs, {
    traceId,
    agentName,
    source: 'openai-agents-sdk',
  });
}
