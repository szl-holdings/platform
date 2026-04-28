/**
 * @workspace/alloy — Alloy Coordinator
 *
 * The coordinator is the single entry-point for a governed agent run.
 * It:
 *   1. Validates and stamps the incoming AgentRequest.
 *   2. Runs the PolicyEvaluator first — blocks or routes to approval if needed.
 *   3. Dispatches the PlannerSpecialist (and any additional specialists).
 *   4. Records every tool call into the run-ledger via RunLedgerBuilder.
 *   5. Passes consequential recommendations through the domain-jury evaluator.
 *   6. Returns a fully-typed AgentResponse envelope.
 *
 * Alloy is NOT a monolithic mega-agent. It coordinates small specialists and
 * never performs business logic itself.
 */
import { randomUUID } from 'node:crypto';
import {
  AgentRequestSchema,
  type AgentRequest,
  type AgentResponse,
  type EnvelopeToolCall,
  type EnvelopePolicyGate,
} from './envelope.js';
import { getSpecialist } from './specialists.js';

// ─── Coordinator options ──────────────────────────────────────────────────────

export interface CoordinatorOptions {
  /**
   * Which specialists to invoke (in order). Defaults to
   * ['policy-evaluator', 'planner'].
   */
  specialists?: string[];
  /**
   * Whether to run the domain-jury evaluator on the final recommendation.
   * Default: true when eval-os is available, false otherwise.
   */
  runJury?: boolean;
  /**
   * Callback called after every specialist completes.
   */
  onSpecialistComplete?: (specialistId: string, success: boolean) => void;
}

// ─── Main coordinator ─────────────────────────────────────────────────────────

export async function coordinate(
  rawRequest: unknown,
  options: CoordinatorOptions = {},
): Promise<AgentResponse> {
  const t0 = Date.now();
  const request: AgentRequest = AgentRequestSchema.parse(rawRequest);
  const requestId = request.requestId ?? randomUUID();
  const runId = randomUUID();
  const traceId = request.traceId ?? randomUUID();
  const completedAt = () => new Date().toISOString();

  const specialistIds = options.specialists ?? ['policy-evaluator', 'planner'];
  const allToolCalls: EnvelopeToolCall[] = [];
  const warnings: string[] = [];

  // ── 1. Policy evaluation (always first) ──────────────────────────────────
  const policySpecialist = getSpecialist('policy-evaluator');
  let policyGate: EnvelopePolicyGate | undefined;

  if (policySpecialist) {
    const policyResult = await policySpecialist.handle(request);
    allToolCalls.push(...policyResult.toolCalls);
    warnings.push(...policyResult.warnings);
    options.onSpecialistComplete?.('policy-evaluator', policyResult.success);

    const verdict = (policyResult.output.verdict as string | undefined) ?? 'requires-approval';
    policyGate = {
      verdict: verdict as EnvelopePolicyGate['verdict'],
      reason: (policyResult.output.reason as string | undefined) ?? 'Policy evaluated.',
      evaluatedAt: new Date().toISOString(),
      matchedRules: [],
    };

    if (verdict === 'blocked') {
      return {
        requestId,
        runId,
        traceId,
        status: 'blocked',
        toolCalls: allToolCalls,
        policyGate,
        warnings,
        error: `Request blocked by policy: ${policyGate.reason}`,
        durationMs: Date.now() - t0,
        completedAt: completedAt(),
      };
    }

    if (verdict === 'requires-approval') {
      const approvalSpecialist = getSpecialist('approval-router');
      let approvalId: string = randomUUID();
      let approverRole = 'operator';
      let approvalReason = policyGate.reason;

      if (approvalSpecialist) {
        const approvalResult = await approvalSpecialist.handle(request);
        allToolCalls.push(...approvalResult.toolCalls);
        warnings.push(...approvalResult.warnings);
        approvalId = (approvalResult.output.approvalId as string | undefined) ?? approvalId;
        approverRole = (approvalResult.output.approverRole as string | undefined) ?? approverRole;
        approvalReason = (approvalResult.output.reason as string | undefined) ?? approvalReason;
      }

      const ledgerId = await persistLedger(runId, traceId, request, allToolCalls, 'pending_approval');

      return {
        requestId,
        runId,
        traceId,
        ledgerId,
        status: 'pending_approval',
        toolCalls: allToolCalls,
        policyGate,
        approvalRequest: { approvalId, approverRole, reason: approvalReason },
        warnings,
        durationMs: Date.now() - t0,
        completedAt: completedAt(),
      };
    }
  }

  // ── 2. Remaining specialists (excluding policy-evaluator) ─────────────────
  for (const id of specialistIds) {
    if (id === 'policy-evaluator') continue;
    const specialist = getSpecialist(id);
    if (!specialist) {
      warnings.push(`Specialist "${id}" not found in registry — skipped.`);
      continue;
    }
    const result = await specialist.handle(request);
    allToolCalls.push(...result.toolCalls);
    warnings.push(...result.warnings);
    options.onSpecialistComplete?.(id, result.success);

    if (!result.success) {
      warnings.push(`Specialist "${id}" failed: ${result.error ?? 'unknown error'}`);
    }
  }

  // ── 3. Build recommendation from planner output ───────────────────────────
  const plannerCalls = allToolCalls.filter((c) => c.specialistRole === 'planner');
  const plannerOutput = plannerCalls[0]?.output as Record<string, unknown> | undefined;

  const recommendationId = randomUUID();
  let recommendation: AgentResponse['recommendation'] = {
    id: recommendationId,
    title: `Agent Plan: ${request.objective.slice(0, 80)}`,
    summary: `Planner decomposed objective into ${(plannerOutput?.stepCount as number | undefined) ?? 0} steps.`,
    reasoning: `Domain: ${request.domain} | Surface: ${request.surface} | Autonomy: ${request.autonomyMode}`,
    value: plannerOutput,
    confidence: (plannerOutput?.confidence as number | undefined) ?? 0.7,
    urgency: 'routine',
  };

  // ── 4. Domain-jury evaluation ─────────────────────────────────────────────
  const runJury = options.runJury ?? true;
  if (runJury) {
    try {
      const { scoreRecommendation } = await import('@workspace/eval-os');
      const juryScores = await scoreRecommendation({
        recommendationId,
        title: recommendation.title,
        summary: recommendation.summary,
        reasoning: recommendation.reasoning,
        domain: request.domain,
        toolCalls: allToolCalls,
        policyVerdict: policyGate?.verdict as 'allowed' | 'requires-approval' | 'blocked' | undefined,
        confidence: recommendation.confidence,
        autonomyMode: request.autonomyMode,
      });
      recommendation = { ...recommendation, juryScores };
    } catch (_juryErr) {
      warnings.push('Domain-jury evaluator unavailable — jury scores omitted.');
    }
  }

  // ── 5. Persist ledger entry ───────────────────────────────────────────────
  const ledgerId = await persistLedger(runId, traceId, request, allToolCalls, 'completed', recommendation);

  return {
    requestId,
    runId,
    traceId,
    ledgerId,
    status: 'completed',
    recommendation,
    toolCalls: allToolCalls,
    policyGate,
    warnings,
    durationMs: Date.now() - t0,
    completedAt: completedAt(),
  };
}

// ─── Ledger persistence helper ────────────────────────────────────────────────

async function persistLedger(
  runId: string,
  traceId: string,
  request: AgentRequest,
  toolCalls: EnvelopeToolCall[],
  _status: 'completed' | 'pending_approval' | 'failed',
  recommendation?: AgentResponse['recommendation'],
): Promise<string | undefined> {
  try {
    const { RunLedgerBuilder, defaultRunLedgerStore } = await import('@workspace/run-ledger');
    const initOpts: { runId: string; objective: string; traceId?: string; tenantId?: string } = {
      runId,
      objective: request.objective,
    };
    if (traceId) initOpts.traceId = traceId;
    if (request.tenantId) initOpts.tenantId = request.tenantId;
    const builder = new RunLedgerBuilder(initOpts);

    for (const tc of toolCalls) {
      builder.addToolCall({
        toolId: tc.toolId,
        stepId: tc.toolId,
        outcome: tc.success ? 'success' : 'failure',
        latencyMs: Math.round(tc.latencyMs),
        ...(tc.error ? { error: tc.error } : {}),
      });
    }

    if (recommendation?.juryScores) {
      // Iterate only the known numeric rubric dimensions — JuryVerdict also
      // carries non-numeric fields (juryId, recommendationId, passed,
      // evaluatedAt) that must not be cast to number and fed into the ledger.
      const numericDimensions = [
        'grounding',
        'actionability',
        'policyCompliance',
        'reversibility',
        'confidence',
      ] as const;
      for (const metric of numericDimensions) {
        const score = recommendation.juryScores[metric as keyof typeof recommendation.juryScores];
        if (typeof score === 'number') {
          builder.addEvalScore({ metric, score, threshold: 0.5, passed: score >= 0.5 });
        }
      }
      builder.addEvalScore({
        metric: 'domain-jury-composite',
        score: recommendation.juryScores.composite,
        threshold: 0.5,
        passed: recommendation.juryScores.composite >= 0.5,
      });
    }

    const entry = builder.build();
    defaultRunLedgerStore.save(entry);
    return entry.ledgerId;
  } catch (_ledgerErr) {
    return undefined;
  }
}
