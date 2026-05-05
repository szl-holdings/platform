/**
 * Active Response Engine
 *
 * Typed action library for defensive responses. Every action must pass through
 * the Scope Boundary Enforcer before execution. Actions are either auto-executed
 * (when the HITL toggle allows) or queued for operator approval.
 *
 * Actions are implemented against api-server primitives only — no outbound
 * connections to external infrastructure.
 */

import { randomUUID } from 'node:crypto';
import { logger } from '../logger.js';
import { checkScope, ScopeViolationError } from './scope-enforcer.js';
import { isActionAllowed, type ActionCategory } from './hitl-controls.js';
import { appendLedgerEntry } from './evidence-ledger.js';

// ── In-memory state for immediate enforcement ────────────────────────────────

const _blockedIps = new Set<string>();
const _tarpittedIps = new Set<string>();
const _revokedSessions = new Set<string>();
const _quarantinedUsers = new Set<string>();
const _escalatedRateLimitIps = new Set<string>();

export function isIpBlocked(ip: string): boolean {
  return _blockedIps.has(ip);
}

export function isIpTarpitted(ip: string): boolean {
  return _tarpittedIps.has(ip);
}

export function isSessionRevoked(sessionId: string): boolean {
  return _revokedSessions.has(sessionId);
}

export function isUserQuarantined(userId: string): boolean {
  return _quarantinedUsers.has(userId);
}

export function isIpRateLimitEscalated(ip: string): boolean {
  return _escalatedRateLimitIps.has(ip);
}

// ── Action type definitions ──────────────────────────────────────────────────

export type ActionType =
  | 'BlockIp'
  | 'RevokeSession'
  | 'RotateTokenScope'
  | 'EscalateRateLimit'
  | 'QuarantineAccount'
  | 'IsolateResource'
  | 'TarpitClient'
  | 'PoisonedResponse';

export interface ActionInput {
  actionType: ActionType;
  target: string;
  targetType: string;
  reason: string;
  requestedBy?: string;
  linkedEventId?: string;
  linkedIncidentId?: string;
  context?: Record<string, unknown>;
}

export interface ActionResult {
  ok: boolean;
  actionId: string;
  actionType: ActionType;
  target: string;
  outcome: 'executed' | 'queued_for_approval' | 'blocked_by_scope' | 'blocked_by_hitl' | 'error';
  queueId?: string;
  message: string;
  executedAt?: string;
}

function categoryForAction(actionType: ActionType): ActionCategory {
  const map: Record<ActionType, ActionCategory> = {
    BlockIp: 'block',
    RevokeSession: 'revoke',
    RotateTokenScope: 'rotate',
    EscalateRateLimit: 'block',
    QuarantineAccount: 'quarantine',
    IsolateResource: 'quarantine',
    TarpitClient: 'tarpit',
    PoisonedResponse: 'poison_response',
  };
  return map[actionType] ?? 'block';
}

let _queueWriter: ((entry: {
  id: string;
  actionType: string;
  category: ActionCategory;
  target: string;
  targetType: string;
  reason: string;
  riskLevel: string;
  linkedEventId?: string;
  linkedIncidentId?: string;
  details: Record<string, unknown>;
}) => Promise<void>) | null = null;

export function registerQueueWriter(fn: typeof _queueWriter): void {
  _queueWriter = fn;
}

async function enqueueForApproval(
  input: ActionInput,
  queueId: string,
  riskLevel: string,
): Promise<void> {
  if (!_queueWriter) {
    logger.warn({ queueId }, '[ActiveResponse] no queue writer registered — action will be lost');
    return;
  }
  await _queueWriter({
    id: queueId,
    actionType: input.actionType,
    category: categoryForAction(input.actionType),
    target: input.target,
    targetType: input.targetType,
    reason: input.reason,
    riskLevel,
    linkedEventId: input.linkedEventId,
    linkedIncidentId: input.linkedIncidentId,
    details: input.context ?? {},
  });
}

// ── Core execution ───────────────────────────────────────────────────────────

export async function executeAction(input: ActionInput): Promise<ActionResult> {
  const actionId = randomUUID();
  const category = categoryForAction(input.actionType);

  const scopeCheck = checkScope({
    action: input.actionType,
    targetType: input.targetType,
    targetValue: input.target,
    requestedBy: input.requestedBy,
    context: input.context,
  });

  if (!scopeCheck.allowed) {
    appendLedgerEntry({
      entryType: 'scope_violation',
      actorType: 'system',
      actorId: input.requestedBy ?? 'system',
      targetType: input.targetType,
      targetId: input.target,
      action: input.actionType,
      outcome: 'blocked',
      details: {
        reason: scopeCheck.reason,
        violationType: scopeCheck.violationType,
        context: input.context,
      },
      linkedEventId: input.linkedEventId,
      linkedIncidentId: input.linkedIncidentId,
    });

    return {
      ok: false,
      actionId,
      actionType: input.actionType,
      target: input.target,
      outcome: 'blocked_by_scope',
      message: scopeCheck.reason,
    };
  }

  const hitl = isActionAllowed(category);
  if (!hitl.allowed) {
    return {
      ok: false,
      actionId,
      actionType: input.actionType,
      target: input.target,
      outcome: 'blocked_by_hitl',
      message: hitl.reason,
    };
  }

  if (hitl.requiresApproval) {
    const queueId = randomUUID();
    const riskLevel = 'high';
    await enqueueForApproval(input, queueId, riskLevel);

    appendLedgerEntry({
      entryType: 'response',
      actorType: 'system',
      actorId: input.requestedBy ?? 'system',
      targetType: input.targetType,
      targetId: input.target,
      action: input.actionType,
      outcome: 'pending',
      details: { queueId, reason: input.reason, context: input.context },
      linkedEventId: input.linkedEventId,
      linkedIncidentId: input.linkedIncidentId,
    });

    return {
      ok: true,
      actionId,
      actionType: input.actionType,
      target: input.target,
      outcome: 'queued_for_approval',
      queueId,
      message: 'Action queued for operator approval',
    };
  }

  const result = applyAction(input);

  appendLedgerEntry({
    entryType: 'response',
    actorType: 'system',
    actorId: input.requestedBy ?? 'system',
    targetType: input.targetType,
    targetId: input.target,
    action: input.actionType,
    outcome: 'executed',
    details: { reason: input.reason, context: input.context, result },
    linkedEventId: input.linkedEventId,
    linkedIncidentId: input.linkedIncidentId,
  });

  logger.info(
    { actionType: input.actionType, target: input.target, actionId },
    '[ActiveResponse] action auto-executed',
  );

  return {
    ok: true,
    actionId,
    actionType: input.actionType,
    target: input.target,
    outcome: 'executed',
    message: `Action ${input.actionType} executed on ${input.target}`,
    executedAt: new Date().toISOString(),
  };
}

function applyAction(input: ActionInput): Record<string, unknown> {
  switch (input.actionType) {
    case 'BlockIp':
      _blockedIps.add(input.target);
      return { blockedIp: input.target, total: _blockedIps.size };

    case 'TarpitClient':
      _tarpittedIps.add(input.target);
      return { tarpittedIp: input.target, total: _tarpittedIps.size };

    case 'RevokeSession':
      _revokedSessions.add(input.target);
      return { revokedSession: input.target, total: _revokedSessions.size };

    case 'QuarantineAccount':
    case 'IsolateResource':
      _quarantinedUsers.add(input.target);
      return { quarantinedUser: input.target, total: _quarantinedUsers.size };

    case 'EscalateRateLimit':
      _escalatedRateLimitIps.add(input.target);
      return { escalatedIp: input.target };

    case 'RotateTokenScope':
      return { tokenRotated: input.target, newScope: 'read-only' };

    case 'PoisonedResponse':
      return { poisonedTarget: input.target, poisonType: 'bait_data' };

    default:
      return { applied: true };
  }
}

export function executeApprovedQueuedAction(
  queueId: string,
  actionType: ActionType,
  target: string,
  targetType: string,
  approvedBy: string,
  linkedEventId?: string,
  linkedIncidentId?: string,
): void {
  const input: ActionInput = {
    actionType,
    target,
    targetType,
    reason: 'Operator approved from queue',
    requestedBy: approvedBy,
    linkedEventId,
    linkedIncidentId,
  };

  const scopeCheck = checkScope({
    action: actionType,
    targetType,
    targetValue: target,
    requestedBy: approvedBy,
  });

  if (!scopeCheck.allowed) {
    logger.warn({ queueId, action: actionType, target }, '[ActiveResponse] scope violation on approved action');
    appendLedgerEntry({
      entryType: 'scope_violation',
      actorType: 'operator',
      actorId: approvedBy,
      targetType,
      targetId: target,
      action: actionType,
      outcome: 'blocked',
      details: {
        reason: scopeCheck.reason,
        violationType: scopeCheck.violationType,
        queueId,
      },
      linkedEventId,
      linkedIncidentId,
    });
    return;
  }

  applyAction(input);

  appendLedgerEntry({
    entryType: 'approval',
    actorType: 'operator',
    actorId: approvedBy,
    targetType,
    targetId: target,
    action: actionType,
    outcome: 'executed',
    details: { queueId },
    linkedEventId,
    linkedIncidentId,
  });

  logger.info({ queueId, action: actionType, target, approvedBy }, '[ActiveResponse] queued action executed after approval');
}

export function getDefenseState() {
  return {
    blockedIps: Array.from(_blockedIps),
    tarpittedIps: Array.from(_tarpittedIps),
    revokedSessions: Array.from(_revokedSessions),
    quarantinedUsers: Array.from(_quarantinedUsers),
    escalatedRateLimitIps: Array.from(_escalatedRateLimitIps),
  };
}
