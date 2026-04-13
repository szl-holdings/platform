import type { AgentExecutionContext, TraceSpan, KnowledgeEntity, MemoryRecallResult, DelegationResult } from "./mastra/types";
import { logger } from "./logger";

/**
 * Constructs a minimal valid AgentExecutionContext for programmatic/batch tool
 * invocations from within Alloy modules (PTC, batch tools, etc.).
 *
 * - emitTrace: writes spans to the structured logger instead of an external trace store
 * - delegateTo: returns a stub delegation result (full A2A delegation is not needed here)
 * - recall: returns an empty result set (no live memory access needed for batch calls)
 * - storeEntity: no-ops with a warn log (entity storage is handled separately by KG module)
 */
export function makeProgrammaticContext(params: {
  agentId: string;
  runId: string;
  domain?: string;
  threadId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}): AgentExecutionContext {
  const traceId = `trace_${params.runId}`;

  return {
    runId: params.runId,
    traceId,
    agentId: params.agentId,
    domain: params.domain ?? "alloy",
    threadId: params.threadId ?? params.runId,
    userId: params.userId,
    metadata: params.metadata ?? {},

    emitTrace: async (span: TraceSpan): Promise<void> => {
      logger.debug(
        {
          traceId: span.traceId,
          parentTraceId: span.parentTraceId,
          spanType: span.spanType,
          name: span.name,
          status: span.status,
          latencyMs: span.latencyMs,
          error: span.error,
        },
        "alloy-context: trace span",
      );
    },

    delegateTo: async (_agentId: string, _task: string): Promise<DelegationResult> => {
      logger.warn({ callerRunId: params.runId }, "alloy-context: delegateTo called from programmatic context — not supported");
      return { agentId: _agentId, response: "", toolsUsed: [], latencyMs: 0, traceId };
    },

    recall: async (_query: string, _topK?: number): Promise<MemoryRecallResult[]> => {
      return [];
    },

    storeEntity: async (_entity: KnowledgeEntity): Promise<void> => {
      logger.warn({ callerRunId: params.runId }, "alloy-context: storeEntity called from programmatic context — use KG module directly");
    },
  };
}
