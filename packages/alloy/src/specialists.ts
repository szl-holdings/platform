/**
 * @workspace/alloy — Specialist Interfaces & Stub Registry
 *
 * Each specialist is a small, swappable module behind a common interface.
 * The coordinator calls `handle()` and the specialist returns a typed result.
 * Stubs are safe defaults that require no live ML dependency.
 *
 * Specialist roster (aligned with Moonshot Phase 2):
 *   - PlannerSpecialist         → @workspace/planner
 *   - RetrievalSpecialist       → stub (Phase 4)
 *   - DocumentSpecialist        → stub (Phase 3)
 *   - SpeechSpecialist          → stub (Phase 3)
 *   - ForecastingSpecialist     → stub (Phase 5)
 *   - AnomalySpecialist         → stub (Phase 5)
 *   - PolicyEvaluatorSpecialist → @workspace/policy-guard
 *   - ApprovalRouterSpecialist  → @workspace/approvals-inbox
 */
import { randomUUID } from 'node:crypto';
import type { PolicyRule } from '@szl-holdings/shared-contracts';
import type { AgentRequest, EnvelopeToolCall } from './envelope.js';

// ─── Core interface ───────────────────────────────────────────────────────────

export interface SpecialistResult {
  /** Specialist that produced this result. */
  specialistId: string;
  /** Whether the specialist completed without error. */
  success: boolean;
  /** Structured output — shape is specialist-specific. */
  output: Record<string, unknown>;
  /** Tool calls recorded by this specialist. */
  toolCalls: EnvelopeToolCall[];
  /** Non-fatal warnings. */
  warnings: string[];
  /** Error message if success is false. */
  error?: string;
  /** Wall-clock time for this specialist. */
  durationMs: number;
}

export interface Specialist {
  readonly id: string;
  readonly displayName: string;
  handle(request: AgentRequest): Promise<SpecialistResult>;
}

// ─── Helper to build a tool-call record ──────────────────────────────────────

function makeToolCall(
  toolId: string,
  toolName: string,
  specialistRole: string,
  success: boolean,
  latencyMs: number,
  input?: Record<string, unknown>,
  output?: unknown,
  error?: string,
): EnvelopeToolCall {
  return {
    toolId,
    toolName,
    specialistRole,
    success,
    latencyMs,
    input: input ?? {},
    output,
    error,
    calledAt: new Date().toISOString(),
  };
}

// ─── 1. Planner Specialist ────────────────────────────────────────────────────

export class PlannerSpecialist implements Specialist {
  readonly id = 'planner';
  readonly displayName = 'Mission Planner';

  async handle(request: AgentRequest): Promise<SpecialistResult> {
    const t0 = Date.now();
    try {
      const { createPlan } = await import('@workspace/planner');
      const plan = await createPlan(request.objective, {
        agentId: 'alloy-coordinator',
        sessionId: request.traceId,
        orgId: request.tenantId,
        metadata: { surface: request.surface, domain: request.domain, ...request.metadata },
      });

      const latencyMs = Date.now() - t0;
      return {
        specialistId: this.id,
        success: true,
        output: {
          planId: plan.planId,
          stepCount: plan.steps.length,
          executionOrder: plan.executionOrder,
          estimatedRisk: plan.estimatedRisk,
          riskLevel: plan.riskLevel,
          confidence: plan.confidence,
          estimatedCostUsd: plan.estimatedCostUsd,
        },
        toolCalls: [
          makeToolCall(
            'planner.createPlan',
            'createPlan',
            this.id,
            true,
            latencyMs,
            { objective: request.objective },
            { planId: plan.planId, stepCount: plan.steps.length },
          ),
        ],
        warnings: [],
        durationMs: latencyMs,
      };
    } catch (err) {
      const latencyMs = Date.now() - t0;
      const message = err instanceof Error ? err.message : String(err);
      return {
        specialistId: this.id,
        success: false,
        output: {},
        toolCalls: [
          makeToolCall(
            'planner.createPlan',
            'createPlan',
            this.id,
            false,
            latencyMs,
            { objective: request.objective },
            undefined,
            message,
          ),
        ],
        warnings: [],
        error: message,
        durationMs: latencyMs,
      };
    }
  }
}

// ─── Baseline policy rules ────────────────────────────────────────────────────
//
// Rules gate the Alloy coordinator by autonomy mode.
// Conditions encode the mode as "action:recommendation.<mode>" so each tier
// maps to exactly one rule.  Strict-mode ensures unrecognised modes fall back
// to "requires-approval" rather than silently passing.
//
// Tier semantics:
//   observe / recommend / draft → low-risk, no side-effects → allowed
//   ask-to-act                  → requests action on behalf of user → approval required
//   approved-act                → executes autonomously → approval required

const BASELINE_POLICY_RULES: PolicyRule[] = [
  {
    policyId: 'alloy-observe',
    description: 'Observe mode: read-only signal gathering. Allowed.',
    tier: 'low',
    conditions: ['action:recommendation.observe'],
    verdict: 'allowed',
    auditRequired: false,
  },
  {
    policyId: 'alloy-recommend',
    description: 'Recommend mode: surfaces advisory output with no side-effects. Allowed.',
    tier: 'low',
    conditions: ['action:recommendation.recommend'],
    verdict: 'allowed',
    auditRequired: false,
  },
  {
    policyId: 'alloy-draft',
    description: 'Draft mode: produces a draft for operator review. Allowed.',
    tier: 'low',
    conditions: ['action:recommendation.draft'],
    verdict: 'allowed',
    auditRequired: false,
  },
  {
    policyId: 'alloy-ask-to-act',
    description: 'Ask-to-act mode: requests action on behalf of the operator. Approval required.',
    tier: 'medium',
    conditions: ['action:recommendation.ask-to-act'],
    verdict: 'requires-approval',
    requiresApprovalFrom: ['operator'],
    auditRequired: true,
  },
  {
    policyId: 'alloy-approved-act',
    description: 'Approved-act mode: autonomous execution path. Approval required.',
    tier: 'high',
    conditions: ['action:recommendation.approved-act'],
    verdict: 'requires-approval',
    requiresApprovalFrom: ['operator', 'compliance'],
    auditRequired: true,
  },
];

// ─── 2. Policy Evaluator Specialist ──────────────────────────────────────────

export class PolicyEvaluatorSpecialist implements Specialist {
  readonly id = 'policy-evaluator';
  readonly displayName = 'Policy Evaluator';

  async handle(request: AgentRequest): Promise<SpecialistResult> {
    const t0 = Date.now();
    try {
      const { PolicyGuardEngine } = await import('@szl-holdings/policy-guard');
      // strictMode defaults to true: unrecognised modes → requires-approval.
      const engine = new PolicyGuardEngine(BASELINE_POLICY_RULES);
      // Encode autonomy mode into actionType so baseline rules can discriminate.
      const actionType = `recommendation.${request.autonomyMode ?? 'recommend'}`;
      const result = engine.evaluate({
        traceId: request.traceId ?? randomUUID(),
        agentRole: 'MissionPlanner',
        actionType,
        toolId: 'alloy.recommend',
        metadata: {
          domain: request.domain,
          surface: request.surface,
          tenantId: request.tenantId,
          autonomyMode: request.autonomyMode,
          ...request.context,
        },
      });
      const latencyMs = Date.now() - t0;
      return {
        specialistId: this.id,
        success: true,
        output: {
          verdict: result.verdict,
          reason: result.reason,
          requestId: result.requestId,
        },
        toolCalls: [
          makeToolCall(
            'policy-guard.evaluate',
            'PolicyGuardEngine.evaluate',
            this.id,
            true,
            latencyMs,
            { domain: request.domain, autonomyMode: request.autonomyMode },
            { verdict: result.verdict },
          ),
        ],
        warnings: [],
        durationMs: latencyMs,
      };
    } catch (err) {
      const latencyMs = Date.now() - t0;
      const message = err instanceof Error ? err.message : String(err);
      return {
        specialistId: this.id,
        success: false,
        output: { verdict: 'requires-approval', reason: `Policy check failed: ${message}` },
        toolCalls: [
          makeToolCall(
            'policy-guard.evaluate',
            'PolicyGuardEngine.evaluate',
            this.id,
            false,
            latencyMs,
            {},
            undefined,
            message,
          ),
        ],
        warnings: [],
        error: message,
        durationMs: latencyMs,
      };
    }
  }
}

// ─── 3. Approval Router Specialist ───────────────────────────────────────────

export class ApprovalRouterSpecialist implements Specialist {
  readonly id = 'approval-router';
  readonly displayName = 'Approval Router';

  async handle(request: AgentRequest): Promise<SpecialistResult> {
    const t0 = Date.now();
    const latencyMs = Date.now() - t0;
    return {
      specialistId: this.id,
      success: true,
      output: {
        approvalId: randomUUID(),
        approverRole: 'operator',
        reason: `Approval required for "${request.objective}" in ${request.autonomyMode} mode`,
        surface: request.surface,
        domain: request.domain,
      },
      toolCalls: [
        makeToolCall(
          'approvals-inbox.route',
          'approvalRouter.route',
          this.id,
          true,
          latencyMs,
          { objective: request.objective },
        ),
      ],
      warnings: [],
      durationMs: latencyMs,
    };
  }
}

// ─── 4. Retrieval Specialist (Phase 4 stub) ───────────────────────────────────

export class RetrievalSpecialist implements Specialist {
  readonly id = 'retrieval';
  readonly displayName = 'Retrieval Strategist';

  async handle(_request: AgentRequest): Promise<SpecialistResult> {
    return {
      specialistId: this.id,
      success: true,
      output: { sources: [], note: 'Retrieval upgrade lands in Phase 4.' },
      toolCalls: [],
      warnings: ['RetrievalSpecialist is a Phase 4 stub — no retrieval performed.'],
      durationMs: 0,
    };
  }
}

// ─── 5. Document Specialist (Phase 3 stub) ────────────────────────────────────

export class DocumentSpecialist implements Specialist {
  readonly id = 'document';
  readonly displayName = 'Document Intelligence';

  async handle(_request: AgentRequest): Promise<SpecialistResult> {
    return {
      specialistId: this.id,
      success: true,
      output: { documents: [], note: 'Document intelligence lands in Phase 3.' },
      toolCalls: [],
      warnings: ['DocumentSpecialist is a Phase 3 stub — no document processing performed.'],
      durationMs: 0,
    };
  }
}

// ─── 6. Speech Specialist (Phase 3 stub) ─────────────────────────────────────

export class SpeechSpecialist implements Specialist {
  readonly id = 'speech';
  readonly displayName = 'Voice & Speech';

  async handle(_request: AgentRequest): Promise<SpecialistResult> {
    return {
      specialistId: this.id,
      success: true,
      output: { transcript: null, note: 'Voice intelligence lands in Phase 3.' },
      toolCalls: [],
      warnings: ['SpeechSpecialist is a Phase 3 stub — no audio processed.'],
      durationMs: 0,
    };
  }
}

// ─── 7. Forecasting Specialist (Phase 5 stub) ────────────────────────────────

export class ForecastingSpecialist implements Specialist {
  readonly id = 'forecasting';
  readonly displayName = 'Forecasting Engine';

  async handle(_request: AgentRequest): Promise<SpecialistResult> {
    return {
      specialistId: this.id,
      success: true,
      output: { forecast: null, note: 'Forecast fabric lands in Phase 5.' },
      toolCalls: [],
      warnings: ['ForecastingSpecialist is a Phase 5 stub — no forecast produced.'],
      durationMs: 0,
    };
  }
}

// ─── 8. Anomaly Specialist (Phase 5 stub) ────────────────────────────────────

export class AnomalySpecialist implements Specialist {
  readonly id = 'anomaly';
  readonly displayName = 'Anomaly Detection';

  async handle(_request: AgentRequest): Promise<SpecialistResult> {
    return {
      specialistId: this.id,
      success: true,
      output: { anomalies: [], note: 'Anomaly fabric lands in Phase 5.' },
      toolCalls: [],
      warnings: ['AnomalySpecialist is a Phase 5 stub — no anomaly detection performed.'],
      durationMs: 0,
    };
  }
}

// ─── Specialist Registry ──────────────────────────────────────────────────────

const _registry = new Map<string, Specialist>();

function registerDefaults(): void {
  for (const s of [
    new PlannerSpecialist(),
    new PolicyEvaluatorSpecialist(),
    new ApprovalRouterSpecialist(),
    new RetrievalSpecialist(),
    new DocumentSpecialist(),
    new SpeechSpecialist(),
    new ForecastingSpecialist(),
    new AnomalySpecialist(),
  ]) {
    _registry.set(s.id, s);
  }
}

registerDefaults();

export function registerSpecialist(specialist: Specialist): void {
  _registry.set(specialist.id, specialist);
}

export function getSpecialist(id: string): Specialist | undefined {
  return _registry.get(id);
}

export function listSpecialists(): Specialist[] {
  return Array.from(_registry.values());
}

export function replaceSpecialist(specialist: Specialist): void {
  _registry.set(specialist.id, specialist);
}
