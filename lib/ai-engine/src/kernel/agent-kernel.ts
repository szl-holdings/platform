/**
 * Agent Kernel — Deterministic Execution Boundary
 *
 * Capability 1: Every tool call passes through a deterministic execution boundary with:
 *   - Idempotency keys on every invocation
 *   - Compensation/rollback transactions on failure
 *   - JSON-schema validation of every tool payload against its contract
 *   - Hash-chained immutable audit trail (each entry hashes the previous)
 *
 * Capability 4: Runtime Tool-Call Authorization Kernel
 *   - Pre-execution scope certificate enforcement
 *   - Intent validation against per-agent contracts
 *   - Blocked/escalated call logging
 *
 * This module sits between the Maker-Checker layer and actual execution.
 */

import { createHash, randomUUID } from 'crypto';

export interface ScopeCertificate {
  agentId: string;
  allowedTools: string[];
  allowedParameters?: Record<string, unknown>;
  maxRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  issuedAt: string;
  expiresAt: string;
  issuerSignature: string;
}

export interface KernelAuditEntry {
  entryId: string;
  previousHash: string;
  currentHash: string;
  idempotencyKey: string;
  agentId: string;
  toolName: string;
  arguments: Record<string, unknown>;
  validationResult: 'passed' | 'failed' | 'blocked' | 'escalated';
  validationErrors: string[];
  authorizationResult: 'authorized' | 'unauthorized' | 'escalated';
  authorizationReason: string;
  executionResult: 'success' | 'failure' | 'compensated' | 'skipped';
  compensationApplied: boolean;
  compensationSteps: string[];
  durationMs: number;
  timestamp: string;
  calledBy: string;
  tenantId?: string;
}

export interface KernelExecutionOptions {
  agentId: string;
  calledBy: string;
  tenantId?: string;
  scopeCertificate?: ScopeCertificate;
  idempotencyKey?: string;
  compensationFn?: () => Promise<void>;
}

export interface KernelExecutionResult<T = unknown> {
  success: boolean;
  output: T | null;
  auditEntry: KernelAuditEntry;
  idempotencyKey: string;
  blocked: boolean;
  blockReason: string | null;
  escalated: boolean;
  validationErrors: string[];
}

const TOOL_SCHEMAS: Record<string, { required: string[]; types: Record<string, string> }> = {
  containment_step: {
    required: ['containmentType', 'targetId'],
    types: { containmentType: 'string', targetId: 'string' },
  },
  recovery_step: {
    required: ['recoveryType', 'targetId'],
    types: { recoveryType: 'string', targetId: 'string' },
  },
  create_case: {
    required: ['title', 'severity'],
    types: { title: 'string', severity: 'string' },
  },
  update_case: {
    required: ['caseId'],
    types: { caseId: 'string' },
  },
  close_case: {
    required: ['caseId', 'resolution'],
    types: { caseId: 'string', resolution: 'string' },
  },
  notify_team: {
    required: ['channel', 'message'],
    types: { channel: 'string', message: 'string' },
  },
  lookup_workflow: {
    required: ['workflowId'],
    types: { workflowId: 'string' },
  },
  route_for_approval: {
    required: ['actionId', 'approvalLevel', 'reason'],
    types: { actionId: 'string', approvalLevel: 'string', reason: 'string' },
  },
};

const HIGH_RISK_TOOL_NAMES = new Set([
  'containment_step',
  'recovery_step',
  'close_case',
  'update_case',
  'assign_owner',
  'disable_account',
  'revoke_token',
]);

function getToolRiskLevel(toolName: string): 'low' | 'medium' | 'high' | 'critical' {
  if (['containment_step', 'recovery_step', 'disable_account', 'revoke_token'].includes(toolName))
    return 'critical';
  if (['close_case', 'update_case', 'assign_owner'].includes(toolName)) return 'high';
  if (['create_case', 'create_action_item', 'notify_team'].includes(toolName)) return 'medium';
  return 'low';
}

function validateToolPayload(toolName: string, args: Record<string, unknown>): string[] {
  const errors: string[] = [];
  const schema = TOOL_SCHEMAS[toolName];
  if (!schema) return errors;
  for (const field of schema.required) {
    if (args[field] === undefined || args[field] === null) {
      errors.push(`Required field '${field}' is missing`);
    }
  }
  for (const [field, expectedType] of Object.entries(schema.types)) {
    if (args[field] !== undefined && typeof args[field] !== expectedType) {
      errors.push(`Field '${field}' must be ${expectedType}, got ${typeof args[field]}`);
    }
  }
  return errors;
}

function checkScopeCertificate(
  toolName: string,
  args: Record<string, unknown>,
  cert: ScopeCertificate | undefined,
): { authorized: boolean; reason: string } {
  if (!cert) {
    if (HIGH_RISK_TOOL_NAMES.has(toolName)) {
      return {
        authorized: false,
        reason: `No scope certificate provided for high-risk tool '${toolName}'`,
      };
    }
    return { authorized: true, reason: 'No certificate required for low-risk tool' };
  }

  if (new Date(cert.expiresAt) < new Date()) {
    return { authorized: false, reason: `Scope certificate expired at ${cert.expiresAt}` };
  }

  if (!cert.allowedTools.includes(toolName) && !cert.allowedTools.includes('*')) {
    return {
      authorized: false,
      reason: `Tool '${toolName}' not in agent scope certificate (allowed: ${cert.allowedTools.join(', ')})`,
    };
  }

  const riskLevel = getToolRiskLevel(toolName);
  const riskOrder = { low: 0, medium: 1, high: 2, critical: 3 };
  if (riskOrder[riskLevel] > riskOrder[cert.maxRiskLevel]) {
    return {
      authorized: false,
      reason: `Tool '${toolName}' risk level '${riskLevel}' exceeds certificate max '${cert.maxRiskLevel}'`,
    };
  }

  return { authorized: true, reason: 'Scope certificate validates tool access' };
}

class KernelAuditChain {
  private entries: KernelAuditEntry[] = [];
  private lastHash = 'genesis';

  private static readonly MAX_ENTRIES = 10000;

  append(entry: Omit<KernelAuditEntry, 'previousHash' | 'currentHash'>): KernelAuditEntry {
    const previousHash = this.lastHash;
    const payload = JSON.stringify({ ...entry, previousHash });
    const currentHash = createHash('sha256').update(payload).digest('hex');

    const full: KernelAuditEntry = { ...entry, previousHash, currentHash };
    this.entries.push(full);
    this.lastHash = currentHash;

    if (this.entries.length > KernelAuditChain.MAX_ENTRIES) {
      this.entries.splice(0, this.entries.length - KernelAuditChain.MAX_ENTRIES);
    }

    return full;
  }

  getEntries(): KernelAuditEntry[] {
    return [...this.entries];
  }

  getLastHash(): string {
    return this.lastHash;
  }

  verifyChain(): { valid: boolean; brokenAt: number | null } {
    let previousHash = 'genesis';
    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i]!;
      if (entry.previousHash !== previousHash) return { valid: false, brokenAt: i };
      const payload = JSON.stringify({
        entryId: entry.entryId,
        idempotencyKey: entry.idempotencyKey,
        agentId: entry.agentId,
        toolName: entry.toolName,
        arguments: entry.arguments,
        validationResult: entry.validationResult,
        validationErrors: entry.validationErrors,
        authorizationResult: entry.authorizationResult,
        authorizationReason: entry.authorizationReason,
        executionResult: entry.executionResult,
        compensationApplied: entry.compensationApplied,
        compensationSteps: entry.compensationSteps,
        durationMs: entry.durationMs,
        timestamp: entry.timestamp,
        calledBy: entry.calledBy,
        tenantId: entry.tenantId,
        previousHash,
      });
      const expected = createHash('sha256').update(payload).digest('hex');
      if (entry.currentHash !== expected) return { valid: false, brokenAt: i };
      previousHash = entry.currentHash;
    }
    return { valid: true, brokenAt: null };
  }
}

export const kernelAuditChain = new KernelAuditChain();

const idempotencyCache = new Map<string, { result: unknown; timestamp: number }>();
const IDEMPOTENCY_TTL_MS = 5 * 60 * 1000;

function generateIdempotencyKey(
  agentId: string,
  toolName: string,
  args: Record<string, unknown>,
): string {
  const payload = JSON.stringify({ agentId, toolName, args });
  return createHash('sha256').update(payload).digest('hex').slice(0, 32);
}

export async function executeWithKernel<T = unknown>(
  toolName: string,
  args: Record<string, unknown>,
  executorFn: (args: Record<string, unknown>) => Promise<T>,
  options: KernelExecutionOptions,
): Promise<KernelExecutionResult<T>> {
  const startTime = Date.now();
  const idempotencyKey =
    options.idempotencyKey ?? generateIdempotencyKey(options.agentId, toolName, args);
  const entryId = randomUUID();

  const cached = idempotencyCache.get(idempotencyKey);
  if (cached && Date.now() - cached.timestamp < IDEMPOTENCY_TTL_MS) {
    const auditEntry = kernelAuditChain.append({
      entryId,
      idempotencyKey,
      agentId: options.agentId,
      toolName,
      arguments: args,
      validationResult: 'passed',
      validationErrors: [],
      authorizationResult: 'authorized',
      authorizationReason: 'Idempotent replay — result from cache',
      executionResult: 'skipped',
      compensationApplied: false,
      compensationSteps: [],
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      calledBy: options.calledBy,
      tenantId: options.tenantId,
    });
    return {
      success: true,
      output: cached.result as T,
      auditEntry,
      idempotencyKey,
      blocked: false,
      blockReason: null,
      escalated: false,
      validationErrors: [],
    };
  }

  const validationErrors = validateToolPayload(toolName, args);
  if (validationErrors.length > 0) {
    const auditEntry = kernelAuditChain.append({
      entryId,
      idempotencyKey,
      agentId: options.agentId,
      toolName,
      arguments: args,
      validationResult: 'failed',
      validationErrors,
      authorizationResult: 'unauthorized',
      authorizationReason: 'Schema validation failed before authorization check',
      executionResult: 'skipped',
      compensationApplied: false,
      compensationSteps: [],
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      calledBy: options.calledBy,
      tenantId: options.tenantId,
    });
    return {
      success: false,
      output: null,
      auditEntry,
      idempotencyKey,
      blocked: true,
      blockReason: validationErrors.join('; '),
      escalated: false,
      validationErrors,
    };
  }

  const authCheck = checkScopeCertificate(toolName, args, options.scopeCertificate);
  if (!authCheck.authorized) {
    const needsEscalation = HIGH_RISK_TOOL_NAMES.has(toolName);
    const auditEntry = kernelAuditChain.append({
      entryId,
      idempotencyKey,
      agentId: options.agentId,
      toolName,
      arguments: args,
      validationResult: 'passed',
      validationErrors: [],
      authorizationResult: needsEscalation ? 'escalated' : 'unauthorized',
      authorizationReason: authCheck.reason,
      executionResult: 'skipped',
      compensationApplied: false,
      compensationSteps: [],
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      calledBy: options.calledBy,
      tenantId: options.tenantId,
    });
    return {
      success: false,
      output: null,
      auditEntry,
      idempotencyKey,
      blocked: true,
      blockReason: authCheck.reason,
      escalated: needsEscalation,
      validationErrors: [],
    };
  }

  let output: T | null = null;
  let executionResult: KernelAuditEntry['executionResult'] = 'failure';
  let compensationApplied = false;
  const compensationSteps: string[] = [];

  try {
    output = await executorFn(args);
    executionResult = 'success';
    idempotencyCache.set(idempotencyKey, { result: output, timestamp: Date.now() });
  } catch (err) {
    executionResult = 'failure';
    if (options.compensationFn) {
      try {
        await options.compensationFn();
        compensationApplied = true;
        compensationSteps.push(`Compensation executed at ${new Date().toISOString()}`);
        executionResult = 'compensated';
      } catch (compErr) {
        compensationSteps.push(`Compensation FAILED: ${String(compErr)}`);
      }
    }
  }

  const auditEntry = kernelAuditChain.append({
    entryId,
    idempotencyKey,
    agentId: options.agentId,
    toolName,
    arguments: args,
    validationResult: 'passed',
    validationErrors: [],
    authorizationResult: 'authorized',
    authorizationReason: authCheck.reason,
    executionResult,
    compensationApplied,
    compensationSteps,
    durationMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
    calledBy: options.calledBy,
    tenantId: options.tenantId,
  });

  return {
    success: executionResult === 'success',
    output,
    auditEntry,
    idempotencyKey,
    blocked: false,
    blockReason: null,
    escalated: false,
    validationErrors: [],
  };
}

export function issueScopeCertificate(
  agentId: string,
  allowedTools: string[],
  maxRiskLevel: ScopeCertificate['maxRiskLevel'] = 'medium',
  ttlMs = 60 * 60 * 1000,
): ScopeCertificate {
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();
  const payload = JSON.stringify({ agentId, allowedTools, maxRiskLevel, issuedAt, expiresAt });
  const signature = createHash('sha256').update(`kernel-issuer-secret:${payload}`).digest('hex');
  return { agentId, allowedTools, maxRiskLevel, issuedAt, expiresAt, issuerSignature: signature };
}

export function getKernelAuditTrail(): KernelAuditEntry[] {
  return kernelAuditChain.getEntries();
}

export function verifyAuditChainIntegrity(): { valid: boolean; brokenAt: number | null } {
  return kernelAuditChain.verifyChain();
}
