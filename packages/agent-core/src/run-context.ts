/**
 * AEEP Agent Run Context
 *
 * Every agent run carries a typed context that scopes all operations
 * to a trace ID, session, workflow run, domain profile, and agent role.
 * This is the single source of truth for run identity and evidence tagging.
 */
import type { AgentRoleId } from '@szl-holdings/shared-contracts';

export interface AgentRunContext {
  traceId: string;
  sessionId: string;
  workflowRunId?: string;
  stepId?: string;
  agentRole: AgentRoleId;
  profileId?: string;
  profileVersion?: string;
  tenantId?: string;
  metadata?: Record<string, unknown>;
  startedAt: string;
}

let _traceCounter = 0;

/**
 * Generate a new trace ID with a predictable prefix for debuggability.
 * Format: aeep_<role-prefix>_<timestamp>_<counter>
 */
export function generateTraceId(roleId: AgentRoleId): string {
  const prefix = roleId.slice(0, 4).toLowerCase();
  const ts = Date.now();
  const counter = (++_traceCounter).toString().padStart(4, '0');
  return `aeep_${prefix}_${ts}_${counter}`;
}

export function createRunContext(
  partial: Omit<AgentRunContext, 'startedAt' | 'traceId'> & { traceId?: string },
): AgentRunContext {
  return {
    ...partial,
    traceId: partial.traceId ?? generateTraceId(partial.agentRole),
    startedAt: new Date().toISOString(),
  };
}
