/**
 * GenAI Telemetry Bridge — Connects model-router telemetry events to
 * the GenAI telemetry collector for Langfuse-compatible tracing.
 */

import { type ModelRouterTelemetry, registerTelemetryHandler } from '@szl-holdings/ai-engine';
import { genAITelemetry } from '@szl-holdings/observability';
import { logger } from './logger.js';

let registered = false;

export function registerGenAITelemetryBridge(): void {
  if (registered) return;
  registered = true;

  registerTelemetryHandler(async (telemetry: ModelRouterTelemetry) => {
    try {
      const traceId =
        telemetry.correlationId ?? `trace_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      genAITelemetry.recordModelCall({
        traceId,
        model: telemetry.model,
        modelProvider: telemetry.provider,
        routeClass: telemetry.routeClass,
        promptTokens: telemetry.promptTokens,
        completionTokens: telemetry.completionTokens,
        totalTokens: telemetry.totalTokens,
        latencyMs: telemetry.latencyMs,
        costEstimateUsd: telemetry.costEstimateUsd,
        usedFallback: telemetry.usedFallback,
        status: 'ok',
        correlationId: telemetry.correlationId,
        tenantId: telemetry.tenantId,
        orgId: null,
        timestamp: Date.now(),
        metadata: {
          packSlug: telemetry.packSlug,
          taskId: telemetry.taskId,
        },
      });
    } catch (err) {
      logger.warn({ err }, '[genai-telemetry-bridge] Failed to record model call span');
    }
  });

  logger.info(
    '[genai-telemetry-bridge] GenAI telemetry bridge registered — model calls will be traced',
  );
}
