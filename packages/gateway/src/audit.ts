/**
 * SZL Holdings — Agent Gateway: Audit Logger
 * Phase 11 — Agent Gateway
 *
 * Writes a structured audit entry for every gateway action — successful or
 * failed. Every entry carries a correlation ID, actor,
 * model, prompt hash, target, diff, and final result.
 *
 * Live mode requires an acknowledged durable, append-only, tamper-evident
 * ledger. The local/test NDJSON file is explicitly development evidence: it
 * is mutable and is not a production immutability claim.
 */

import { randomUUID } from 'node:crypto';
import { persistAuditRecord } from './persistence.js';
import type {
  AgentActionRequest,
  AgentExecutionResult,
  ApprovalOutcome,
  AuditEntry,
  CallerIdentity,
  GatewayConfig,
  ManifestDiff,
  OpaDecision,
  SimulationResult,
} from './types.js';

// ---------------------------------------------------------------------------
// Audit entry builder
// ---------------------------------------------------------------------------

export function buildAuditEntry(
  request: AgentActionRequest,
  caller: CallerIdentity,
  opts: {
    policyDecision?: OpaDecision;
    simulationResult?: SimulationResult;
    diff?: ManifestDiff;
    approvalOutcome?: ApprovalOutcome;
    agentResult?: AgentExecutionResult;
    status: AuditEntry['status'];
    statusReason?: string;
    startedAt: string;
  },
): AuditEntry {
  const now = new Date();
  const completedAt = now.toISOString();
  const durationMs = now.getTime() - new Date(opts.startedAt).getTime();

  return {
    auditId: randomUUID(),
    correlationId: request.correlationId,
    actor: caller.sub,
    role: caller.role,
    model: request.model,
    promptHash: request.promptHash,
    capability: request.capability,
    target: request.target,
    targetEnvironment: request.targetEnvironment,
    domain: request.domain,
    diff: opts.diff ?? null,
    simulationResult: opts.simulationResult ?? null,
    policyDecision: opts.policyDecision ?? null,
    approvalOutcome: opts.approvalOutcome ?? null,
    agentResult: opts.agentResult ?? null,
    status: opts.status,
    statusReason: opts.statusReason,
    startedAt: opts.startedAt,
    completedAt,
    durationMs,
  };
}

// ---------------------------------------------------------------------------
// Structured log emitter — OTel-compatible fields
// ---------------------------------------------------------------------------

interface StructuredLog {
  level: 'INFO' | 'WARN' | 'ERROR';
  timestamp: string;
  correlationId: string;
  auditId: string;
  actor: string;
  role: string;
  capability: string;
  target: string;
  targetEnvironment: string;
  model: string;
  status: AuditEntry['status'];
  durationMs: number;
  riskLevel?: string;
  requiresApproval?: boolean;
  approvalOutcome?: string;
  statusReason?: string;
}

function toStructuredLog(entry: AuditEntry): StructuredLog {
  const level: StructuredLog['level'] =
    entry.status === 'completed' || entry.status === 'execution_authorized'
      ? 'INFO'
      : entry.status === 'approval_pending'
        ? 'WARN'
        : 'ERROR';

  return {
    level,
    timestamp: entry.completedAt,
    correlationId: entry.correlationId,
    auditId: entry.auditId,
    actor: entry.actor,
    role: entry.role,
    capability: entry.capability,
    target: entry.target,
    targetEnvironment: entry.targetEnvironment,
    model: entry.model,
    status: entry.status,
    durationMs: entry.durationMs,
    riskLevel: entry.simulationResult?.riskLevel,
    requiresApproval: entry.policyDecision ? entry.policyDecision.requiredApprovals > 0 : undefined,
    approvalOutcome: entry.approvalOutcome?.outcome,
    statusReason: entry.statusReason,
  };
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

export async function writeAuditEntry(entry: AuditEntry, config: GatewayConfig): Promise<void> {
  const structured = toStructuredLog(entry);
  await persistAuditRecord(config, entry);
  // Emit only after required persistence has acknowledged the exact record.
  process.stdout.write(`${JSON.stringify(structured)}\n`);
}
