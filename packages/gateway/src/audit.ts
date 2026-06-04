/**
 * SZL Holdings — Agent Gateway: Audit Logger
 * Phase 11 — Agent Gateway
 *
 * Writes a structured, immutable audit entry for every gateway action —
 * successful or failed. Every entry carries a correlation ID, actor,
 * model, prompt hash, target, diff, and final result.
 *
 * In production the audit log is shipped to the observability baseline
 * (OTel structured log → Azure Monitor). In local mode it is written to
 * a newline-delimited JSON file and to stdout.
 */

import { randomUUID } from 'crypto';
import { appendFileSync } from 'fs';
import type {
  AuditEntry,
  CallerIdentity,
  AgentActionRequest,
  OpaDecision,
  SimulationResult,
  ApprovalOutcome,
  AgentExecutionResult,
  ManifestDiff,
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
    entry.status === 'completed' ? 'INFO' : entry.status === 'approval_pending' ? 'WARN' : 'ERROR';

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

export function writeAuditEntry(entry: AuditEntry, auditLogPath: string): void {
  const structured = toStructuredLog(entry);

  // Structured stdout — always emit regardless of path (OTel pipeline picks this up)
  process.stdout.write(JSON.stringify(structured) + '\n');

  // Append to NDJSON audit file
  try {
    appendFileSync(auditLogPath, JSON.stringify(entry) + '\n', 'utf8');
  } catch {
    // File write failure must not suppress the gateway response,
    // but we log the failure visibly.
    process.stderr.write(
      JSON.stringify({
        level: 'ERROR',
        timestamp: new Date().toISOString(),
        correlationId: entry.correlationId,
        message: 'Audit log file write failed — in-memory entry still valid',
        auditLogPath,
      }) + '\n',
    );
  }
}
