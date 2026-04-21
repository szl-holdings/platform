/**
 * Inference Log Bridge — Writes a row to inference_log on every model-router
 * telemetry event so the AI Governance Log endpoint has real, queryable data.
 */

import { type ModelRouterTelemetry, registerTelemetryHandler } from '@szl-holdings/ai-engine';
import { db, inferenceLogTable } from '@szl-holdings/db';
import { logger } from './logger.js';

let registered = false;

export function registerInferenceLogBridge(): void {
  if (registered) return;
  registered = true;

  registerTelemetryHandler(async (t: ModelRouterTelemetry) => {
    try {
      const actor = t.tenantId != null ? `tenant:${t.tenantId}` : 'system';
      const platform = t.packSlug ?? 'Internal';
      const agentId = t.correlationId ?? null;
      const entityId = t.taskId ?? null;

      await db.insert(inferenceLogTable).values({
        model: t.model,
        agentId,
        action: t.routeClass,
        entityType: 'llm-call',
        entityId,
        actor,
        platform,
        confidence: null,
        latencyMs: Math.round(t.latencyMs),
      });
    } catch (err) {
      logger.warn({ err }, '[inference-log-bridge] Failed to persist inference log row');
    }
  });

  logger.info('[inference-log-bridge] Registered — model calls will be written to inference_log');
}
