/**
 * Unified policy evaluation facade — evaluateFull()
 *
 * Chains three independent guardrail layers in sequence, ensuring every action
 * that reaches the execution layer has passed ALL checks and not just one:
 *
 *   1. PII / injection scan  (optional external scanner via dependency injection)
 *   2. Policy-engine evaluation (allow/require_approval/escalate/block/audit_only)
 *   3. Optional secondary guardian check (via injected callback)
 *
 * Dependency injection is used so that policy-engine does not import from
 * ai-control-plane or guardian directly — callers wire in the scanners they
 * have available. In production, the api-server wires in all three layers; in
 * unit tests, scanners can be omitted or mocked.
 */
import { randomUUID } from 'crypto';
import { evaluatePolicies } from './evaluator.js';
import { BUILT_IN_GUARDRAILS } from './guardrails.js';
import { PRISM_COUNSEL_POLICIES } from './prism-counsel-policies.js';
import type {
  EvaluationRequest,
  Policy,
  PolicyEffect,
  PolicyEvaluationResult,
} from './types.js';

const _registeredPolicies: Policy[] = [...BUILT_IN_GUARDRAILS, ...PRISM_COUNSEL_POLICIES];

export interface PiiScanResult {
  hasPii: boolean;
  hasInjection: boolean;
  patterns: string[];
  redacted: string;
}

export interface GuardianCheckResult {
  outcome: 'allow' | 'deny' | 'require-approval' | 'require-dual-approval';
  reason?: string;
}

export interface FullEvaluationRequest extends EvaluationRequest {
  /** Raw prompt text to scan for PII and injection. Omit if no text is involved. */
  promptText?: string;
}

export interface FullEvaluationResult {
  evaluationId: string;
  allowed: boolean;
  requiresApproval: boolean;
  requiresDualApproval: boolean;
  blockedReason?: string;
  piiScan?: PiiScanResult;
  policyResult: PolicyEvaluationResult;
  guardianResult?: GuardianCheckResult;
  evaluatedAt: number;
  /** Ordered list of layers that ran. Any layer that short-circuited will have
   *  a non-allow outcome and subsequent layers may not have run. */
  layersRun: Array<{ layer: string; outcome: PolicyEffect | GuardianCheckResult['outcome'] | 'clean' | 'pii_detected' | 'injection_detected' }>;
}

export interface FullEvaluationOptions {
  /**
   * Optional PII scanner. When provided, promptText is scanned before policy
   * evaluation. If PII or injection is detected, the result is flagged but
   * evaluation continues — callers use the redacted text for any subsequent
   * model call.
   */
  piiScanner?: (text: string) => PiiScanResult;
  /**
   * Optional secondary guardian check. When provided, it runs after policy
   * evaluation. A deny outcome from the guardian overrides an allow from
   * policy-engine.
   */
  guardianCheck?: (request: EvaluationRequest) => GuardianCheckResult;
  /**
   * Additional policies to evaluate beyond the global registry.
   */
  extraPolicies?: Policy[];
}

/**
 * Run all available guardrail layers for an action in a single call.
 *
 * This is the recommended evaluation path for all production code. Calling
 * individual layers directly bypasses the chain and should only be done in
 * tests or specialized tooling.
 *
 * @example
 * ```typescript
 * import { evaluateFull } from '@szl-holdings/policy-engine';
 * import { piiRedactor, scanForInjection } from '@szl-holdings/ai-control-plane';
 *
 * const result = await evaluateFull(request, {
 *   piiScanner: (text) => piiRedactor.scanAndRedact(text),
 *   guardianCheck: (req) => guardianEngine.decide(req),
 * });
 *
 * if (!result.allowed) {
 *   throw new PolicyBlockError(result.blockedReason ?? 'Policy denied action');
 * }
 * if (result.requiresApproval) {
 *   await requestApproval({ ... });
 * }
 * ```
 */
export function evaluateFull(
  request: FullEvaluationRequest,
  options: FullEvaluationOptions = {},
): FullEvaluationResult {
  const evaluationId = randomUUID();
  const evaluatedAt = Date.now();
  const layersRun: FullEvaluationResult['layersRun'] = [];
  const allPolicies = [..._registeredPolicies, ...(options.extraPolicies ?? [])];

  // ── Layer 1: PII / injection scan ────────────────────────────────────────
  let piiScan: PiiScanResult | undefined;
  if (options.piiScanner && request.promptText) {
    piiScan = options.piiScanner(request.promptText);
    const piiOutcome = piiScan.hasPii ? 'pii_detected' : piiScan.hasInjection ? 'injection_detected' : 'clean';
    layersRun.push({ layer: 'pii_scan', outcome: piiOutcome });
    // Injection in prompts is treated as a hard block — an attacker-controlled
    // prompt must not proceed to policy evaluation or execution.
    if (piiScan.hasInjection) {
      return {
        evaluationId,
        allowed: false,
        requiresApproval: false,
        requiresDualApproval: false,
        blockedReason: 'Prompt injection detected — action blocked at PII scan layer.',
        piiScan,
        policyResult: {
          effect: 'block' as const,
          allowed: false,
          requiresApproval: false,
          matchedPolicies: [],
          violations: [{ policyId: 'pii-scan', policyName: 'PII / injection scan', reason: 'Injection pattern detected in prompt text.' }],
          reasoning: 'Blocked at PII scan layer before policy evaluation.',
          evaluatedAt,
        },
        layersRun,
        evaluatedAt,
      };
    }
  }

  // ── Layer 2: Policy-engine evaluation ────────────────────────────────────
  const policyResult = evaluatePolicies(allPolicies, request);
  layersRun.push({ layer: 'policy_engine', outcome: policyResult.effect });

  const policyBlocked = policyResult.effect === 'block';
  const policyRequiresApproval =
    policyResult.effect === 'require_approval' || policyResult.effect === 'escalate';

  if (policyBlocked) {
    return {
      evaluationId,
      allowed: false,
      requiresApproval: false,
      requiresDualApproval: false,
      blockedReason: policyResult.violations[0]?.reason ?? 'Blocked by policy engine.',
      ...(piiScan !== undefined ? { piiScan } : {}),
      policyResult,
      layersRun,
      evaluatedAt,
    };
  }

  // ── Layer 3: Guardian secondary check ────────────────────────────────────
  let guardianResult: GuardianCheckResult | undefined;
  if (options.guardianCheck) {
    guardianResult = options.guardianCheck(request);
    layersRun.push({ layer: 'guardian', outcome: guardianResult.outcome });

    if (guardianResult.outcome === 'deny') {
      return {
        evaluationId,
        allowed: false,
        requiresApproval: false,
        requiresDualApproval: false,
        blockedReason: guardianResult.reason ?? 'Guardian denied action.',
        ...(piiScan !== undefined ? { piiScan } : {}),
        policyResult,
        guardianResult,
        layersRun,
        evaluatedAt,
      };
    }
  }

  const requiresDualApproval = guardianResult?.outcome === 'require-dual-approval';
  const requiresApproval =
    policyRequiresApproval ||
    guardianResult?.outcome === 'require-approval' ||
    requiresDualApproval;

  return {
    evaluationId,
    allowed: true,
    requiresApproval,
    requiresDualApproval,
    ...(piiScan !== undefined ? { piiScan } : {}),
    policyResult,
    ...(guardianResult !== undefined ? { guardianResult } : {}),
    layersRun,
    evaluatedAt,
  };
}
