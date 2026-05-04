/**
 * GenAI Telemetry Bridge — Connects model-router telemetry events to
 * the GenAI telemetry collector for Langfuse-compatible tracing, and
 * feeds the passport drift detector with per-call cost/latency samples.
 */

import { type ModelRouterTelemetry, registerTelemetryHandler } from '@szl-holdings/ai-engine';
import { driftDetector } from '@szl-holdings/model-passport';
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
        ...(telemetry.passportId !== undefined ? { passportId: telemetry.passportId } : {}),
        ...(telemetry.passportSignatureDigest !== undefined ? { passportSignatureDigest: telemetry.passportSignatureDigest } : {}),
        ...(telemetry.passportQuantTier !== undefined ? { passportQuantTier: telemetry.passportQuantTier } : {}),
        ...(telemetry.passportAutonomyTier !== undefined ? { passportAutonomyTier: telemetry.passportAutonomyTier } : {}),
        metadata: {
          packSlug: telemetry.packSlug,
          taskId: telemetry.taskId,
        },
      });
    } catch (err) {
      logger.warn({ err }, '[genai-telemetry-bridge] Failed to record model call span');
    }

    // Feed drift detector with live telemetry samples whenever a passport governed the call.
    // costEstimateUsd and latencyMs are the primary SLO signals; accuracy is not available
    // at span time (it's an offline eval metric), so we omit it here.
    if (telemetry.passportId) {
      try {
        driftDetector.record({
          passportId: telemetry.passportId,
          costEstimateUsd: telemetry.costEstimateUsd ?? 0,
          latencyMs: telemetry.latencyMs ?? 0,
          recordedAt: Date.now(),
        });
      } catch (err) {
        logger.warn(
          { err, passportId: telemetry.passportId },
          '[genai-telemetry-bridge] Failed to record drift sample',
        );
      }
    }
  });

  logger.info(
    '[genai-telemetry-bridge] GenAI telemetry bridge registered — model calls will be traced',
  );
}
