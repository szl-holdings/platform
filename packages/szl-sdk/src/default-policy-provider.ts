/**
 * Default Λ-gate provider for the SZL SDK.
 *
 * Wires the gate into the existing governance engines:
 *
 *   1. `@szl-holdings/policy-engine`'s `checkAction(...)` is consulted first.
 *      A `block` effect short-circuits the invariant to 0 (axiom A2 of the
 *      Lutar invariant: zero-pinning).
 *   2. Otherwise the invariant is computed by `lutarInvariant(...)` from
 *      `@workspace/ouroboros-invariant` against the operator-supplied trust
 *      axes (Cleanliness, Horizon, Resonance, Frustum).
 *
 * The SDK ships zero new policy logic — this module is purely an adapter
 * between the gate and the two shared engines, exactly as the SDK memo
 * §4.2 requires.
 */

import { checkAction, type EvaluationRequest, type PolicyEffect } from '@szl-holdings/policy-engine';
import { lutarInvariant, type LutarAxes } from '@workspace/ouroboros-invariant';

import type { LambdaInvariantProvider } from './lambda-gate.js';

/**
 * Policy effects that count as "admit" for the Λ-gate. Every other effect
 * — `block`, `require_approval`, `escalate` — drives the invariant to 0 so
 * the gate refuses unless the caller supplies an `approvalToken`.
 *
 * This mirrors the SDK memo §4.2 contract: "until the policy + invariant
 * axes admit, or the caller passes an explicit approval token." If policy
 * says approval is required, the SDK must enforce that — high trust axes
 * cannot bypass an approval requirement.
 */
const ADMIT_EFFECTS: ReadonlySet<PolicyEffect> = new Set<PolicyEffect>(['allow', 'audit_only']);

export function isPolicyAdmit(effect: PolicyEffect): boolean {
  return ADMIT_EFFECTS.has(effect);
}

export interface DefaultPolicyProviderOptions {
  /**
   * Returns the live runtime trust axes used by the Lutar invariant.
   * Re-invoked on every gated call so providers can stream fresh values
   * from their telemetry pipeline.
   */
  getAxes: () => LutarAxes | Promise<LutarAxes>;
  /**
   * Builds the policy-engine `EvaluationRequest` for a given gated action
   * (e.g. `'webhooks.delete'`). Implementations typically inject subject
   * roles, tenant, and resource attributes from the calling session.
   */
  buildEvaluationRequest: (action: string) => EvaluationRequest | Promise<EvaluationRequest>;
}

/**
 * Build a provider whose Λ comes from `lutarInvariant`, pinned to 0 if
 * `policy-engine` returns `block` for the action.
 */
export function defaultPolicyProvider(
  options: DefaultPolicyProviderOptions,
): LambdaInvariantProvider {
  return {
    async evaluate(action: string): Promise<number> {
      const request = await options.buildEvaluationRequest(action);
      const result = checkAction(request);
      if (!isPolicyAdmit(result.effect)) {
        // Axiom A2 zero-pinning: any non-admit policy effect (block,
        // require_approval, escalate) drives Λ to 0 so the gate refuses
        // even if the trust axes would otherwise admit. Approval-required
        // outcomes cannot be bypassed by high invariant axes — the caller
        // must supply an `approvalToken` to proceed.
        return 0;
      }
      const axes = await options.getAxes();
      const report = lutarInvariant(axes);
      return report.invariant;
    },
  };
}

/**
 * Conservative axes used by the SDK's built-in default provider when no
 * caller-specific axes are wired. Picks the bottom of the [0,1] band for
 * Frustum (three-witness reconciliation) and Resonance (Landauer-normalized
 * handoff Q) — those are the two axes that cannot be assumed without
 * concrete witnesses, so a fresh SDK install refuses by default until
 * either a real provider or an `approvalToken` is supplied.
 */
export const DEFAULT_SDK_AXES: LutarAxes = {
  cleanliness: 1,
  horizon: 1,
  resonance: 0,
  frustum: 0,
};

/**
 * The provider the SDK installs when the caller does not pass `lambdaGate`.
 * Yields Λ = 0 (because two axes are 0 → zero-pinned) which causes every
 * gated call to refuse unless `{ approvalToken }` is supplied. Callers
 * upgrade to a richer provider by passing `lambdaGate: { provider, ... }`
 * built from `defaultPolicyProvider({...})` with their own axis stream.
 */
export function builtInDefaultProvider(): LambdaInvariantProvider {
  return defaultPolicyProvider({
    getAxes: () => DEFAULT_SDK_AXES,
    buildEvaluationRequest: (action) => ({
      action,
      subject: { roles: [] },
      resource: { type: action },
    }),
  });
}
