import { randomUUID } from "crypto";
import { TraceWriter } from "@workspace/trace-graph/writer";
import { defaultTraceStore } from "@workspace/trace-graph/store";
import type { AutonomyMode, AlloyRunSession } from "./types.js";

const _sessions = new Map<string, AlloyRunSession>();

const _traceWriter = new TraceWriter(defaultTraceStore);

export interface OpenSessionParams {
  runId?: string;
  autonomyMode: AutonomyMode;
  workflowId?: string;
  agentId?: string;
  sessionId?: string;
  objective?: string;
  tenantOrgId?: number | null;
}

export function openSession(params: OpenSessionParams): AlloyRunSession {
  const runId = params.runId ?? randomUUID();
  const traceId = randomUUID();
  const openedAt = new Date().toISOString();

  const session: AlloyRunSession = {
    runId,
    traceId,
    tenantOrgId: params.tenantOrgId ?? null,
    autonomyMode: params.autonomyMode,
    status: "open",
    openedAt,
    handoffs: [],
    approvals: [],
    toolCalls: [],
    evidenceIds: [],
  };
  _sessions.set(runId, session);

  try {
    _traceWriter.startTrace({
      traceId,
      runId,
      workflowId: params.workflowId,
      agentId: params.agentId,
      sessionId: params.sessionId,
      objective: params.objective,
    });
  } catch (traceErr) {
    console.warn("[alloy/session] startTrace failed (non-fatal):", traceErr);
  }

  return session;
}

export function recordToolCall(
  runId: string,
  toolId: string,
  toolName: string,
  success: boolean,
  latencyMs?: number,
): AlloyRunSession | undefined {
  const session = _sessions.get(runId);
  if (!session || session.status !== "open") return undefined;
  const updated: AlloyRunSession = {
    ...session,
    toolCalls: [...session.toolCalls, { toolId, toolName, success, latencyMs }],
  };
  _sessions.set(runId, updated);

  try {
    _traceWriter.appendToolCall(session.traceId, {
      toolId,
      toolName,
      success,
      latencyMs,
      approvalRequired: false,
    });
  } catch (traceErr) {
    console.warn("[alloy/session] appendToolCall failed (non-fatal):", traceErr);
  }

  return updated;
}

export function recordHandoff(
  runId: string,
  fromAgent: string,
  toAgent: string,
  reason: string,
): AlloyRunSession | undefined {
  const session = _sessions.get(runId);
  if (!session || session.status !== "open") return undefined;
  const at = new Date().toISOString();
  const updated: AlloyRunSession = {
    ...session,
    handoffs: [
      ...session.handoffs,
      { fromAgent, toAgent, reason, at },
    ],
  };
  _sessions.set(runId, updated);

  try {
    _traceWriter.appendSpan(session.traceId, {
      spanId: randomUUID(),
      name: `handoff:${fromAgent}→${toAgent}`,
      startedAt: at,
      endedAt: at,
      status: "ok",
      attributes: { kind: "handoff", fromAgent, toAgent, reason },
    });
  } catch (traceErr) {
    console.warn("[alloy/session] appendSpan(handoff) failed (non-fatal):", traceErr);
  }

  return updated;
}

export function recordApproval(
  runId: string,
  stepId: string,
  decision: "pending" | "approved" | "rejected" | "escalated",
): AlloyRunSession | undefined {
  const session = _sessions.get(runId);
  if (!session || session.status !== "open") return undefined;
  const existing = session.approvals.findIndex(a => a.stepId === stepId);
  const decidedAt = decision !== "pending" ? new Date().toISOString() : undefined;
  const entry = {
    approvalId: randomUUID(),
    stepId,
    decision,
    decidedAt,
  };
  const approvals =
    existing >= 0
      ? session.approvals.map((a, i) => (i === existing ? entry : a))
      : [...session.approvals, entry];
  const updated: AlloyRunSession = { ...session, approvals };
  _sessions.set(runId, updated);

  try {
    const now = new Date().toISOString();
    _traceWriter.appendSpan(session.traceId, {
      spanId: randomUUID(),
      name: `approval:${stepId}`,
      startedAt: now,
      endedAt: decision !== "pending" ? decidedAt ?? now : undefined,
      status: decision === "rejected" ? "error" : "ok",
      attributes: { kind: "approval", stepId, decision },
    });
  } catch (traceErr) {
    console.warn("[alloy/session] appendSpan(approval) failed (non-fatal):", traceErr);
  }

  return updated;
}

export function attachEvidence(runId: string, evidenceId: string): boolean {
  const session = _sessions.get(runId);
  if (!session) return false;
  if (session.evidenceIds.includes(evidenceId)) return true;
  _sessions.set(runId, { ...session, evidenceIds: [...session.evidenceIds, evidenceId] });
  return true;
}

export function closeSession(
  runId: string,
  outcome?: unknown,
  failed = false,
): AlloyRunSession | undefined {
  const session = _sessions.get(runId);
  if (!session) return undefined;
  const closedAt = new Date().toISOString();
  const updated: AlloyRunSession = {
    ...session,
    status: failed ? "failed" : "closed",
    closedAt,
    outcome,
  };
  _sessions.set(runId, updated);

  try {
    _traceWriter.completeTrace(session.traceId, {
      status: failed ? "failed" : "completed",
      output: outcome as Record<string, unknown> | undefined,
    });
  } catch (traceErr) {
    console.warn("[alloy/session] completeTrace failed (non-fatal):", traceErr);
  }

  return updated;
}

export function getSession(runId: string): AlloyRunSession | undefined {
  return _sessions.get(runId);
}

export function listSessions(tenantOrgId?: number | null): AlloyRunSession[] {
  const all = Array.from(_sessions.values());
  if (tenantOrgId === undefined) return all;
  return all.filter(s => s.tenantOrgId === tenantOrgId);
}
