/**
 * SZL Holdings — Agent Gateway: Orchestrator
 * Phase 11 — Agent Gateway
 *
 * The Gateway class is the single entry point for all agent action requests.
 * It enforces the full policy stack in order:
 *
 *   1. Capability enforcement (forbidden/unknown → immediate reject)
 *   2. Authentication (missing/invalid token → reject)
 *   3. Authorization via OPA (policy deny → reject)
 *   4. Impact simulation (dry-run)
 *   5. Plan generation (human-readable steps)
 *   6. Diff generation (advisory manifest/PR diff)
 *   7. Required evidence persistence
 *   8. Approval routing (Temporal workflow if required)
 *   9. Required pre-execution audit persistence
 *  10. Agent execution (OpenAI Agents SDK)
 *  11. Required final audit persistence
 */

import { randomUUID } from 'node:crypto';
import { hashPrompt, runAgent } from './agent-runner.js';
import { routeApproval } from './approval.js';
import { buildAuditEntry, writeAuditEntry } from './audit.js';
import { AuthError, authenticateCaller } from './auth.js';
import { AuthzError, evaluatePolicy } from './authz.js';
import { buildDiff } from './differ.js';
import { enforceCapability } from './enforce.js';
import { attachEvidence } from './evidence.js';
import { persistEvidenceRecord } from './persistence.js';
import { buildPlan } from './planner.js';
import { simulateImpact } from './simulation.js';
import type {
  AgentActionRequest,
  AgentExecutionResult,
  ApprovalOutcome,
  AuditEntry,
  CallerIdentity,
  GatewayConfig,
  GatewayResponse,
  OpaDecision,
  TargetEnvironment,
} from './types.js';

const TARGET_ENVIRONMENTS: ReadonlySet<string> = new Set(['development', 'staging', 'production']);

export class RequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RequestValidationError';
  }
}

export function requireTargetEnvironment(value: unknown): TargetEnvironment {
  if (typeof value !== 'string' || !TARGET_ENVIRONMENTS.has(value)) {
    throw new RequestValidationError(
      'targetEnvironment is required and must be development, staging, or production',
    );
  }
  return value as TargetEnvironment;
}

export class AgentGateway {
  constructor(private readonly config: GatewayConfig) {}

  // -------------------------------------------------------------------------
  // Main entry point
  // -------------------------------------------------------------------------

  async handleRequest(
    rawCapability: string,
    authorizationHeader: string | undefined,
    params: Record<string, unknown>,
    meta: {
      model?: string;
      target: string;
      domain: string;
      targetEnvironment: unknown;
      correlationId?: string;
    },
  ): Promise<GatewayResponse> {
    const startedAt = new Date().toISOString();
    const correlationId = meta.correlationId ?? randomUUID();
    const targetEnvironment = requireTargetEnvironment(meta.targetEnvironment);

    // Placeholder caller for audit entries built before auth completes
    let caller: CallerIdentity | null = null;

    // -----------------------------------------------------------------------
    // Step 1 — Capability enforcement (synchronous; no I/O)
    // -----------------------------------------------------------------------
    let validCapability: string;
    try {
      validCapability = enforceCapability(rawCapability);
    } catch (err) {
      const auditEntry = buildAuditEntry(
        this.makeStubRequest(rawCapability, correlationId, { ...meta, targetEnvironment }),
        this.makeAnonymousCaller(),
        {
          status: 'forbidden',
          statusReason: err instanceof Error ? err.message : String(err),
          startedAt,
        },
      );
      const persistenceFailure = await this.persistRequiredAudit(auditEntry);
      if (persistenceFailure) return persistenceFailure;
      return {
        correlationId,
        status: 'forbidden',
        message: err instanceof Error ? err.message : 'Forbidden capability',
        auditId: auditEntry.auditId,
      };
    }

    // -----------------------------------------------------------------------
    // Step 2 — Authentication
    // -----------------------------------------------------------------------
    try {
      caller = authenticateCaller(authorizationHeader, this.config.jwt);
    } catch (err) {
      const auditEntry = buildAuditEntry(
        this.makeStubRequest(validCapability, correlationId, { ...meta, targetEnvironment }),
        this.makeAnonymousCaller(),
        {
          status: 'auth_failed',
          statusReason: err instanceof AuthError ? err.message : 'Authentication failed',
          startedAt,
        },
      );
      const persistenceFailure = await this.persistRequiredAudit(auditEntry);
      if (persistenceFailure) return persistenceFailure;
      return {
        correlationId,
        status: 'auth_failed',
        message: err instanceof AuthError ? err.message : 'Authentication failed',
        auditId: auditEntry.auditId,
      };
    }

    // -----------------------------------------------------------------------
    // Build concrete request object
    // -----------------------------------------------------------------------
    const promptText = typeof params.prompt === 'string' ? params.prompt : validCapability;
    const request: AgentActionRequest = {
      correlationId,
      capability: validCapability,
      model: typeof meta.model === 'string' ? meta.model : 'gpt-4o',
      promptHash: hashPrompt(promptText),
      target: meta.target,
      targetEnvironment,
      domain: meta.domain,
      parameters: params,
      requestedAt: startedAt,
    };

    // -----------------------------------------------------------------------
    // Step 3 — OPA authorization
    // -----------------------------------------------------------------------
    let policyDecision: OpaDecision;
    try {
      policyDecision = await evaluatePolicy(request, caller, this.config.opaEndpoint);
    } catch (err) {
      const auditEntry = buildAuditEntry(request, caller, {
        status: 'authz_denied',
        statusReason: err instanceof AuthzError ? err.message : 'Authorization failed',
        startedAt,
      });
      const persistenceFailure = await this.persistRequiredAudit(auditEntry);
      if (persistenceFailure) return persistenceFailure;
      return {
        correlationId,
        status: 'authz_denied',
        message: err instanceof AuthzError ? err.message : 'Authorization failed',
        auditId: auditEntry.auditId,
      };
    }

    // -----------------------------------------------------------------------
    // Steps 4–7 — Simulation, plan, diff, evidence (all synchronous)
    // -----------------------------------------------------------------------
    const simulation = simulateImpact(request);
    const plan = buildPlan(request, policyDecision);
    const diff = buildDiff(request);
    const evidence = attachEvidence(request, caller, policyDecision, simulation, plan, diff);
    try {
      await persistEvidenceRecord(this.config, evidence);
    } catch (error) {
      this.logPersistenceFailure(correlationId, 'evidence', error);
      return {
        correlationId,
        status: 'error',
        message:
          'Required evidence persistence failed; request blocked before approval or execution.',
        auditId: 'unpersisted',
        plan,
        diff,
        simulationResult: simulation,
      };
    }

    // -----------------------------------------------------------------------
    // Step 8 — Approval routing
    // -----------------------------------------------------------------------
    let approvalOutcome: ApprovalOutcome;
    try {
      approvalOutcome = await routeApproval(
        policyDecision,
        evidence,
        request,
        caller,
        this.config.temporalEndpoint,
        this.config.approvalWorkflow,
        this.config.approvalTimeoutMs,
      );
    } catch (err) {
      const auditEntry = buildAuditEntry(request, caller, {
        policyDecision,
        simulationResult: simulation,
        diff,
        status: 'error',
        statusReason: `Approval routing error: ${err instanceof Error ? err.message : String(err)}`,
        startedAt,
      });
      const persistenceFailure = await this.persistRequiredAudit(auditEntry);
      if (persistenceFailure) return persistenceFailure;
      return {
        correlationId,
        status: 'error',
        message: `Approval routing failed: ${err instanceof Error ? err.message : String(err)}`,
        auditId: auditEntry.auditId,
        evidenceId: evidence.evidenceId,
        plan,
        diff,
        simulationResult: simulation,
      };
    }

    if (approvalOutcome.outcome === 'rejected' || approvalOutcome.outcome === 'expired') {
      const status = approvalOutcome.outcome === 'rejected' ? 'approval_denied' : 'approval_denied';
      const auditEntry = buildAuditEntry(request, caller, {
        policyDecision,
        simulationResult: simulation,
        diff,
        approvalOutcome,
        status,
        statusReason: approvalOutcome.rejectedReason ?? `Approval ${approvalOutcome.outcome}`,
        startedAt,
      });
      const persistenceFailure = await this.persistRequiredAudit(auditEntry);
      if (persistenceFailure) return persistenceFailure;
      return {
        correlationId,
        status: 'approval_denied',
        message: `Approval was ${approvalOutcome.outcome}: ${approvalOutcome.rejectedReason ?? ''}`,
        auditId: auditEntry.auditId,
        evidenceId: evidence.evidenceId,
        approvalId: approvalOutcome.approvalId,
        plan,
        diff,
        simulationResult: simulation,
      };
    }

    // -----------------------------------------------------------------------
    // Step 9 — Persist authorization before any provider execution
    // -----------------------------------------------------------------------
    const authorizationAuditEntry = buildAuditEntry(request, caller, {
      policyDecision,
      simulationResult: simulation,
      diff,
      approvalOutcome,
      status: 'execution_authorized',
      statusReason: 'Policy evaluation, evidence persistence, and approval routing completed.',
      startedAt,
    });
    const authorizationPersistenceFailure =
      await this.persistRequiredAudit(authorizationAuditEntry);
    if (authorizationPersistenceFailure) return authorizationPersistenceFailure;

    // -----------------------------------------------------------------------
    // Step 10 — Agent execution
    // -----------------------------------------------------------------------
    let agentResult: AgentExecutionResult;
    try {
      agentResult = await runAgent(request, evidence, this.config.openAiApiKey);
    } catch (err) {
      const auditEntry = buildAuditEntry(request, caller, {
        policyDecision,
        simulationResult: simulation,
        diff,
        approvalOutcome,
        status: 'error',
        statusReason: `Agent execution error: ${err instanceof Error ? err.message : String(err)}`,
        startedAt,
      });
      const persistenceFailure = await this.persistRequiredAudit(auditEntry);
      if (persistenceFailure) return persistenceFailure;
      return {
        correlationId,
        status: 'error',
        message: `Agent execution failed: ${err instanceof Error ? err.message : String(err)}`,
        auditId: auditEntry.auditId,
        evidenceId: evidence.evidenceId,
        plan,
        diff,
        simulationResult: simulation,
      };
    }

    // -----------------------------------------------------------------------
    // Step 11 — Final audit entry
    // -----------------------------------------------------------------------
    const finalAuditEntry = buildAuditEntry(request, caller, {
      policyDecision,
      simulationResult: simulation,
      diff,
      approvalOutcome,
      agentResult,
      status: 'completed',
      startedAt,
    });
    const finalPersistenceFailure = await this.persistRequiredAudit(finalAuditEntry);
    if (finalPersistenceFailure) return finalPersistenceFailure;

    return {
      correlationId,
      status: 'success',
      message: 'Agent action completed successfully.',
      auditId: finalAuditEntry.auditId,
      evidenceId: evidence.evidenceId,
      approvalId: approvalOutcome.approvalId,
      plan,
      diff,
      result: agentResult,
      simulationResult: simulation,
    };
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private logPersistenceFailure(
    correlationId: string,
    recordType: 'audit' | 'evidence',
    error: unknown,
  ): void {
    process.stderr.write(
      `${JSON.stringify({
        level: 'ERROR',
        timestamp: new Date().toISOString(),
        correlationId,
        message: `Required ${recordType} persistence failed; request failed closed`,
        error: error instanceof Error ? error.message : String(error),
      })}\n`,
    );
  }

  private async persistRequiredAudit(entry: AuditEntry): Promise<GatewayResponse | null> {
    try {
      await writeAuditEntry(entry, this.config);
      return null;
    } catch (error) {
      this.logPersistenceFailure(entry.correlationId, 'audit', error);
      return {
        correlationId: entry.correlationId,
        status: 'error',
        message: 'Required audit persistence failed; request blocked.',
        auditId: 'unpersisted',
      };
    }
  }

  private makeStubRequest(
    capability: string,
    correlationId: string,
    meta: { target: string; domain: string; targetEnvironment: TargetEnvironment },
  ): AgentActionRequest {
    return {
      correlationId,
      capability,
      model: 'unknown',
      promptHash: '0000000000000000',
      target: meta.target,
      targetEnvironment: meta.targetEnvironment,
      domain: meta.domain,
      parameters: {},
      requestedAt: new Date().toISOString(),
    };
  }

  private makeAnonymousCaller(): CallerIdentity {
    return {
      sub: 'anonymous',
      role: 'agent-service',
      groups: [],
      orgId: 'unknown',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60,
    };
  }
}
