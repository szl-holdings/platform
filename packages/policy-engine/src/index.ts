export * from "./types.js";
export * from "./evaluator.js";
export * from "./guardrails.js";

export const POLICY_ENGINE_VERSION = "1.0.0" as const;

import type { Policy } from "./types.js";
import { evaluatePolicies } from "./evaluator.js";
import { BUILT_IN_GUARDRAILS } from "./guardrails.js";
import type { EvaluationRequest, PolicyEvaluationResult } from "./types.js";

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
