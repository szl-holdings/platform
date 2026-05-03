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
 *   7. Evidence attachment (immutable record)
 *   8. Approval routing (Temporal workflow if required)
 *   9. Agent execution (OpenAI Agents SDK)
 *  10. Audit logging (structured NDJSON + OTel)
 */

import { randomUUID } from 'crypto';
import { enforceCapability, CapabilityViolation } from './capabilities/enforce.js';
import { authenticateCaller, AuthError } from './auth.js';
import { evaluatePolicy, AuthzError } from './authz.js';
import { simulateImpact } from './simulation.js';
import { buildPlan } from './planner.js';
import { buildDiff } from './differ.js';
import { attachEvidence } from './evidence.js';
import { routeApproval } from './approval.js';
import { runAgent, hashPrompt } from './agent-runner.js';
import { buildAuditEntry, writeAuditEntry } from './audit.js';
import type {
  AgentActionRequest,
  GatewayConfig,
  GatewayResponse,
  CallerIdentity,
  AuditEntry,
} from './types.js';

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
      targetEnvironment?: AgentActionRequest['targetEnvironment'];
      correlationId?: string;
    },
  ): Promise<GatewayResponse> {
    const startedAt = new Date().toISOString();
    const correlationId = meta.correlationId ?? randomUUID();

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
        this.makeStubRequest(rawCapability, correlationId, meta),
        this.makeAnonymousCaller(),
        {
          status: 'forbidden',
          statusReason: err instanceof Error ? err.message : String(err),
          startedAt,
        },
      );
      writeAuditEntry(auditEntry, this.config.auditLogPath);
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
      caller = authenticateCaller(authorizationHeader, this.config.jwtSecret);
    } catch (err) {
      const auditEntry = buildAuditEntry(
        this.makeStubRequest(validCapability, correlationId, meta),
        this.makeAnonymousCaller(),
        {
          status: 'auth_failed',
          statusReason: err instanceof AuthError ? err.message : 'Authentication failed',
          startedAt,
        },
      );
      writeAuditEntry(auditEntry, this.config.auditLogPath);
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
      targetEnvironment: meta.targetEnvironment ?? 'development',
      domain: meta.domain,
      parameters: params,
      requestedAt: startedAt,
    };

    // -----------------------------------------------------------------------
    // Step 3 — OPA authorization
    // -----------------------------------------------------------------------
    let policyDecision;
    try {
      policyDecision = await evaluatePolicy(request, caller, this.config.opaEndpoint);
    } catch (err) {
      const auditEntry = buildAuditEntry(request, caller, {
        status: 'authz_denied',
        statusReason: err instanceof AuthzError ? err.message : 'Authorization failed',
        startedAt,
      });
      writeAuditEntry(auditEntry, this.config.auditLogPath);
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

    // -----------------------------------------------------------------------
    // Step 8 — Approval routing
    // -----------------------------------------------------------------------
    let approvalOutcome;
    try {
      approvalOutcome = await routeApproval(
        policyDecision,
        evidence,
        this.config.temporalEndpoint,
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
      writeAuditEntry(auditEntry, this.config.auditLogPath);
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
      writeAuditEntry(auditEntry, this.config.auditLogPath);
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
    // Step 9 — Agent execution
    // -----------------------------------------------------------------------
    let agentResult;
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
      writeAuditEntry(auditEntry, this.config.auditLogPath);
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
    // Step 10 — Final audit entry
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
    writeAuditEntry(finalAuditEntry, this.config.auditLogPath);

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

  private makeStubRequest(
    capability: string,
    correlationId: string,
    meta: { target: string; domain: string; targetEnvironment?: AgentActionRequest['targetEnvironment'] },
  ): AgentActionRequest {
    return {
      correlationId,
      capability,
      model: 'unknown',
      promptHash: '0000000000000000',
      target: meta.target,
      targetEnvironment: meta.targetEnvironment ?? 'development',
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
