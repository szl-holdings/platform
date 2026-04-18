import type { AutonomyMode, AlloyRunSession, RecommendationResult } from "./types.js";
import {
  openSession,
  recordToolCall,
  recordHandoff,
  recordApproval,
  attachEvidence,
  closeSession,
  getSession,
  type OpenSessionParams,
} from "./session.js";
import { recommend, type RecommendParams } from "./recommend.js";

export interface AlloyRunHandle {
  runId: string;
  traceId: string;
  session(): AlloyRunSession | undefined;
  recordToolCall(toolId: string, toolName: string, success: boolean, latencyMs?: number): void;
  recordHandoff(fromAgent: string, toAgent: string, reason: string): void;
  recordApproval(stepId: string, decision: "pending" | "approved" | "rejected" | "escalated"): void;
  attachEvidence(evidenceId: string): void;
  recommend(params: Omit<RecommendParams, "autonomyMode">): Promise<RecommendationResult>;
  close(outcome?: unknown): AlloyRunSession | undefined;
  fail(reason?: string): AlloyRunSession | undefined;
}

export interface RunOptions extends OpenSessionParams {
  autonomyMode: AutonomyMode;
}

export function run(options: RunOptions): AlloyRunHandle {
  const session = openSession(options);
  const { runId, traceId } = session;

  return {
    runId,
    traceId,

    session() {
      return getSession(runId);
    },

    recordToolCall(toolId, toolName, success, latencyMs) {
      recordToolCall(runId, toolId, toolName, success, latencyMs);
    },

    recordHandoff(fromAgent, toAgent, reason) {
      recordHandoff(runId, fromAgent, toAgent, reason);
    },

    recordApproval(stepId, decision) {
      recordApproval(runId, stepId, decision);
    },

    attachEvidence(evidenceId) {
      attachEvidence(runId, evidenceId);
    },

    async recommend(params) {
      return recommend({
        ...params,
        autonomyMode: options.autonomyMode,
        tenantOrgId: params.tenantOrgId,
        runId,
        traceId,
        metadata: { ...(params.metadata ?? {}), runId, traceId },
      });
    },

    close(outcome) {
      return closeSession(runId, outcome, false);
    },

    fail(reason) {
      return closeSession(runId, { error: reason }, true);
    },
  };
}
