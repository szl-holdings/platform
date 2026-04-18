export * from "./types.js";
export * from "./evaluator.js";
export * from "./guardrails.js";
export * from "./modes.js";

export const POLICY_ENGINE_VERSION = "1.1.0" as const;

import { randomUUID } from "crypto";
import type { Policy, EvaluationRequest, PolicyEvaluationResult, PolicyEvaluation } from "./types.js";
import { evaluatePolicies } from "./evaluator.js";
import { BUILT_IN_GUARDRAILS } from "./guardrails.js";
import { defaultPolicyModeRegistry } from "./modes.js";

const registeredPolicies: Policy[] = [...BUILT_IN_GUARDRAILS];

export function registerPolicy(policy: Policy): void {
  const idx = registeredPolicies.findIndex(p => p.id === policy.id);
  if (idx >= 0) {
    registeredPolicies[idx] = policy;
  } else {
    registeredPolicies.push(policy);
  }
}

export function unregisterPolicy(policyId: string): boolean {
  const idx = registeredPolicies.findIndex(p => p.id === policyId);
  if (idx >= 0) {
    registeredPolicies.splice(idx, 1);
    return true;
  }
  return false;
}

export function getRegisteredPolicies(): Policy[] {
  return [...registeredPolicies];
}

export function checkAction(request: EvaluationRequest): PolicyEvaluationResult {
  return evaluatePolicies(registeredPolicies, request);
}

/**
 * Build a full PolicyEvaluation for an action.
 *
 * Resolves the effective policy mode from the registry, runs the policy check,
 * and assembles the complete evaluation record that must travel with every
 * action-engine draft/execute call.
 */
export function buildPolicyEvaluation(params: {
  action: string;
  actionType?: string;
  product?: string;
  workspace?: string;
  subjectRoles?: string[];
  entitySensitivity?: PolicyEvaluation["entitySensitivity"];
  confidence?: number;
  freshnessScore?: number;
  environment?: PolicyEvaluation["environment"];
  windowValid?: boolean;
  projectedCostUsd?: number;
  projectedImpact?: string;
  projectedRisk?: string;
  evidenceChain?: PolicyEvaluation["evidenceChain"];
  evaluatedBy?: string;
  evaluationRequest?: EvaluationRequest;
}): PolicyEvaluation {
  const {
    action,
    actionType,
    product = "*",
    workspace = "*",
    subjectRoles = [],
    entitySensitivity = "internal",
    confidence = 1.0,
    freshnessScore = 1.0,
    environment = "production",
    windowValid = true,
    projectedCostUsd,
    projectedImpact,
    projectedRisk,
    evidenceChain = [],
    evaluatedBy,
    evaluationRequest,
  } = params;

  const modeConfig = defaultPolicyModeRegistry.resolve({
    product,
    actionType: actionType ?? action,
    workspace,
  });

  const effectiveMode = modeConfig?.mode ?? "approval-required";

  const request: EvaluationRequest = evaluationRequest ?? {
    action,
    actionClass: actionType,
    domain: product,
    subject: { roles: subjectRoles },
    resource: { type: actionType ?? action, domain: product },
    confidence,
    context: {
      workspace,
      environment,
      entitySensitivity,
      freshnessScore,
      windowValid,
      product,
    },
    estimatedCostUsd: projectedCostUsd,
  };

  const policyResult = evaluatePolicies(registeredPolicies, request);

  let blockedReason: string | undefined;
  if (effectiveMode === "observe") {
    blockedReason = "Mode is 'observe': action logged but not executed.";
  } else if (policyResult.effect === "block") {
    blockedReason = policyResult.violations[0]?.reason ?? "Blocked by policy.";
  } else if (!windowValid) {
    blockedReason = "Action is outside the permitted execution window.";
  } else if (
    effectiveMode === "auto-within-guardrails" &&
    modeConfig &&
    confidence < modeConfig.confidenceThreshold
  ) {
    blockedReason = `Confidence ${confidence.toFixed(2)} is below the threshold ${modeConfig.confidenceThreshold.toFixed(2)} for auto-within-guardrails mode.`;
  }

  return {
    evaluationId: randomUUID(),
    mode: effectiveMode,
    action,
    actionType,
    product,
    workspace,
    subjectRoles,
    entitySensitivity,
    confidence,
    freshnessScore,
    environment,
    windowValid,
    projectedCostUsd,
    projectedImpact,
    projectedRisk,
    evidenceChain,
    policyResult,
    blockedReason,
    evaluatedAt: Date.now(),
    evaluatedBy,
  };
}
