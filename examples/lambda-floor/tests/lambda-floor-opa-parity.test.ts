/**
 * Rego-truth-table parity for the `lambda-floor` Pepr capability.
 *
 * This file is the cross-implementation proof that the TypeScript evaluator
 * used by the Pepr capability returns the same admit/deny verdicts as SZL's
 * in-production OPA Rego pack
 * (platform/agent-gateway/tests/gateway-opa-live.test.ts and
 *  platform/policy/lambda/lambda-floor.rego).
 *
 * Scope (what this file IS):
 *   - A row-by-row port of the Rego truth-table that exercises the same
 *     pure function `decideAdmission` the webhook handler calls. If a row
 *     here disagrees with the Rego pack, one of the two implementations
 *     has drifted and the PR is not mergeable.
 *
 * Scope (what this file is NOT):
 *   - An end-to-end cluster admission test. Bringing up kube-apiserver +
 *     Pepr controller is the job of the `pepr test` runner driven by
 *     `package.json#scripts.test:cluster` and the upstream CI; that run
 *     also captures the t3.medium webhook round-trip latency numbers
 *     called out in `05_two_fixes.md` Fix B (5114 follow-up). This file
 *     deliberately avoids fabricating a latency number that isn't a real
 *     measurement of the admission webhook.
 */

import { describe, it, expect } from "vitest";
import { decideAdmission } from "../capabilities/lambda-floor.js";

interface Row {
  id: string;
  lambda: Record<string, number>;
  expect: "admit" | "deny";
  failingAxis?: string;
}

const PASS_VECTOR: Record<string, number> = {
  moralGrounding: 0.97,
  measurabilityHonesty: 0.97,
  temporalConsistency: 0.93,
  informationIntegrity: 0.93,
  actionReversibility: 0.93,
  scopeContainment: 0.93,
  stakeholderAlignment: 0.93,
  evidenceAdequacy: 0.93,
  consentBoundary: 0.93,
};

const TRUTH_TABLE: Row[] = [
  { id: "all-pass", lambda: PASS_VECTOR, expect: "admit" },
  {
    id: "moral-below-floor",
    lambda: { ...PASS_VECTOR, moralGrounding: 0.92 },
    expect: "deny",
    failingAxis: "moralGrounding",
  },
  {
    id: "measurability-below-floor",
    lambda: { ...PASS_VECTOR, measurabilityHonesty: 0.94 },
    expect: "deny",
    failingAxis: "measurabilityHonesty",
  },
  {
    id: "temporal-below-floor",
    lambda: { ...PASS_VECTOR, temporalConsistency: 0.89 },
    expect: "deny",
    failingAxis: "temporalConsistency",
  },
  {
    id: "consent-below-floor",
    lambda: { ...PASS_VECTOR, consentBoundary: 0.5 },
    expect: "deny",
    failingAxis: "consentBoundary",
  },
  {
    id: "exact-floors-admit",
    lambda: {
      moralGrounding: 0.95,
      measurabilityHonesty: 0.95,
      temporalConsistency: 0.9,
      informationIntegrity: 0.9,
      actionReversibility: 0.9,
      scopeContainment: 0.9,
      stakeholderAlignment: 0.9,
      evidenceAdequacy: 0.9,
      consentBoundary: 0.9,
    },
    expect: "admit",
  },
];

describe("lambda-floor — Rego truth-table parity (decideAdmission)", () => {
  it.each(TRUTH_TABLE)(
    "row $id: same verdict as the SZL OPA pack",
    (row) => {
      const decision = decideAdmission(
        { agent: "test", invocationId: row.id, lambda: row.lambda },
        { namespace: "default", name: row.id, uid: `uid-${row.id}` },
      );
      if (row.expect === "admit") {
        expect(decision.admit).toBe(true);
        expect(decision.message).toBe("");
        expect(decision.audit.reason).toBe("MATURITY_GATE_OK");
      } else {
        expect(decision.admit).toBe(false);
        expect(decision.status).toBe(422);
        expect(decision.message.startsWith("MATURITY_GATE_BLOCKED:")).toBe(
          true,
        );
        expect(decision.message).toContain(row.failingAxis!);
        expect(decision.audit.reason).toBe("MATURITY_GATE_BLOCKED");
        expect(
          decision.audit.failures.some((f) => f.axis === row.failingAxis),
        ).toBe(true);
      }
    },
  );
});
