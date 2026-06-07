/**
 * policy_gate.ts — Vertical Policy Runtime Gate (R3)
 * Evaluates Doctrine v6 policies against request contexts and renders
 * allow/deny decisions with audit trail.
 *
 * References
 * ----------
 * [1] Doctrine v6 §4 "Policy Evaluation Semantics"
 * [2] Zanzibar: Google's Consistent, Global Authorization System,
 *     USENIX ATC 2019, https://research.google/pubs/pub48190/
 * [3] OWASP Authorization Cheat Sheet,
 *     https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
 */

import { createHash } from "node:crypto";
import type { DoctrinePolicy, Lambda } from "../composer/doctrine_composer.js";
import type { PolicyUpdateEvent } from "./policy_event_bus.js";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface RequestContext {
  /** Principal identifier (user DID, service account) */
  principal: string;
  /** Resource being accessed (URI or URN) */
  resource: string;
  /** Action being requested (read | write | admin | delete) */
  action: "read" | "write" | "admin" | "delete";
  /** Additional key-value metadata for label matching */
  attributes: Record<string, string>;
  /** Unix ms */
  ts: number;
}

export type PolicyDecision = "allow" | "deny";

export interface GateDecisionRecord {
  decision: PolicyDecision;
  matchedPolicyId: string | null;
  effectiveLambda: Lambda | null;
  reason: string;
  /** SHA-256 of the RequestContext + PolicyId for audit trail */
  auditHash: string;
  latencyMicros: number;
}

export interface PolicyGateConfig {
  /** Minimum Λ required to grant access */
  lambdaThreshold: Lambda;
  /** Default decision when no policy matches */
  defaultDecision: PolicyDecision;
  /** Maximum policies to evaluate per request (cap for DoS protection [3]) */
  maxPoliciesPerRequest: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Label matching
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Checks whether a policy's labels match the request context.
 * Matching rule (Doctrine v6 §4.2 [1]):
 *   For each label in the policy, the request context attributes must
 *   contain the same key with an equal value.  Extra attributes in the
 *   request are ignored (open-world assumption [2]).
 */
function labelsMatch(policy: DoctrinePolicy, ctx: RequestContext): boolean {
  for (const lbl of policy.labels) {
    if (lbl.namespace !== "io.szl.policy") continue; // only binding namespace
    const attrVal = ctx.attributes[lbl.key];
    if (attrVal === undefined) return false;
    if (lbl.value !== "*" && attrVal !== lbl.value) return false;
  }
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit hash
// ─────────────────────────────────────────────────────────────────────────────

function computeAuditHash(ctx: RequestContext, policyId: string | null): string {
  const canonical = JSON.stringify({
    principal: ctx.principal,
    resource: ctx.resource,
    action: ctx.action,
    ts: ctx.ts,
    policyId,
  });
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

// ─────────────────────────────────────────────────────────────────────────────
// PolicyGate
// ─────────────────────────────────────────────────────────────────────────────

export class PolicyGate {
  private policies = new Map<string, DoctrinePolicy>();

  constructor(private readonly cfg: PolicyGateConfig) {}

  /** Load or replace a policy in the gate's registry */
  upsertPolicy(policy: DoctrinePolicy): void {
    this.policies.set(policy.id, policy);
  }

  /** Remove a policy from the registry */
  deletePolicy(id: string): boolean {
    return this.policies.delete(id);
  }

  /** Hot-reload handler compatible with PolicyEventBus.onUpdate() */
  async handleBusEvent(event: PolicyUpdateEvent): Promise<void> {
    if (event.type === "delete") {
      this.deletePolicy(event.policyId);
      return;
    }
    if (event.type === "reload_all") {
      this.policies.clear();
      return;
    }
    if (event.policyJson) {
      try {
        const parsed = JSON.parse(event.policyJson) as DoctrinePolicy;
        this.upsertPolicy(parsed);
      } catch (e) {
        console.error(`[PolicyGate] Failed to parse policy ${event.policyId}:`, e);
      }
    }
  }

  /**
   * Evaluates the request context against all registered policies.
   *
   * Algorithm (Doctrine v6 §4.3 "best-match" [1]):
   * 1. Filter policies whose labels match the context.
   * 2. Among matching policies, select the one with the highest Λ
   *    (most permissive applicable policy).
   * 3. If that Λ ≥ lambdaThreshold → allow; otherwise → deny.
   * 4. If no policy matches → apply defaultDecision.
   */
  evaluate(ctx: RequestContext): GateDecisionRecord {
    const t0 = performance.now();

    const allPolicies = [...this.policies.values()];
    const capped = allPolicies.slice(0, this.cfg.maxPoliciesPerRequest);

    // Step 1: filter matching
    const matching = capped.filter((p) => labelsMatch(p, ctx));

    if (matching.length === 0) {
      const t1 = performance.now();
      return {
        decision: this.cfg.defaultDecision,
        matchedPolicyId: null,
        effectiveLambda: null,
        reason: "no_matching_policy",
        auditHash: computeAuditHash(ctx, null),
        latencyMicros: (t1 - t0) * 1000,
      };
    }

    // Step 2: best match = highest lambda
    matching.sort((a, b) => b.lambda - a.lambda);
    const best = matching[0];

    // Step 3: threshold check
    const decision: PolicyDecision =
      best.lambda >= this.cfg.lambdaThreshold ? "allow" : "deny";

    const t1 = performance.now();
    return {
      decision,
      matchedPolicyId: best.id,
      effectiveLambda: best.lambda,
      reason: decision === "allow"
        ? `lambda=${best.lambda.toFixed(4)} >= threshold=${this.cfg.lambdaThreshold}`
        : `lambda=${best.lambda.toFixed(4)} < threshold=${this.cfg.lambdaThreshold}`,
      auditHash: computeAuditHash(ctx, best.id),
      latencyMicros: (t1 - t0) * 1000,
    };
  }

  get policyCount(): number { return this.policies.size; }
}
