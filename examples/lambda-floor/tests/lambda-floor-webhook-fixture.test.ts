/**
 * Webhook-fixture test for the `lambda-floor` Pepr capability.
 *
 * Drives the *same* pure admission function the registered Pepr Validate
 * handler invokes (`decideAdmission`) with AdmissionRequest-shaped payloads
 * that match what kube-apiserver would POST at the webhook. The point is
 * to prove that the request shape coming off the wire round-trips through
 * the handler logic to the same `request.Approve()` / `request.Deny(...)`
 * outcomes the webhook would emit — without standing up a kube-apiserver.
 *
 * The companion in-cluster harness (`pnpm run test:cluster`, see
 * `package.json`) covers the actual webhook round trip and is where the
 * t3.medium p95 latency budget from `05_two_fixes.md` Fix B is measured.
 */

import { describe, it, expect } from "vitest";
import {
  decideAdmission,
  type AgentInvocationSpec,
} from "../capabilities/lambda-floor.js";

interface AdmissionReviewRequest {
  apiVersion: "admission.k8s.io/v1";
  kind: "AdmissionReview";
  request: {
    uid: string;
    kind: { group: string; version: string; kind: "AgentInvocation" };
    resource: { group: string; version: string; resource: "agentinvocations" };
    namespace: string;
    name: string;
    operation: "CREATE" | "UPDATE";
    object: {
      apiVersion: "doctrine.szl.io/v1alpha1";
      kind: "AgentInvocation";
      metadata: { namespace: string; name: string; uid: string };
      spec: AgentInvocationSpec;
    };
  };
}

function admissionReview(
  spec: AgentInvocationSpec,
  meta: { namespace?: string; name?: string; uid?: string } = {},
): AdmissionReviewRequest {
  const namespace = meta.namespace ?? "a11oy";
  const name = meta.name ?? "fixture-inv";
  const uid = meta.uid ?? "11111111-2222-3333-4444-555555555555";
  return {
    apiVersion: "admission.k8s.io/v1",
    kind: "AdmissionReview",
    request: {
      uid,
      kind: {
        group: "doctrine.szl.io",
        version: "v1alpha1",
        kind: "AgentInvocation",
      },
      resource: {
        group: "doctrine.szl.io",
        version: "v1alpha1",
        resource: "agentinvocations",
      },
      namespace,
      name,
      operation: "CREATE",
      object: {
        apiVersion: "doctrine.szl.io/v1alpha1",
        kind: "AgentInvocation",
        metadata: { namespace, name, uid },
        spec,
      },
    },
  };
}

describe("lambda-floor webhook fixture — AdmissionReview round trip", () => {
  it("admits the worked-pass example with no deny message", () => {
    const review = admissionReview({
      agent: "a11oy.research-summary",
      invocationId: "inv-pass",
      lambda: {
        moralGrounding: 0.97,
        measurabilityHonesty: 0.97,
        temporalConsistency: 0.93,
        informationIntegrity: 0.93,
        actionReversibility: 0.93,
        scopeContainment: 0.93,
        stakeholderAlignment: 0.93,
        evidenceAdequacy: 0.93,
        consentBoundary: 0.93,
      },
    });

    const decision = decideAdmission(review.request.object.spec, {
      namespace: review.request.namespace,
      name: review.request.name,
      uid: review.request.uid,
    });

    expect(decision.admit).toBe(true);
    expect(decision.message).toBe("");
    expect(decision.audit.reason).toBe("MATURITY_GATE_OK");
    expect(decision.audit.resource).toEqual({
      namespace: review.request.namespace,
      name: review.request.name,
      uid: review.request.uid,
    });
  });

  it("denies the worked-fail example with the exact MATURITY_GATE_BLOCKED message shape", () => {
    // Matches the README "worked example" verbatim: moralGrounding=0.92.
    const review = admissionReview(
      {
        agent: "a11oy.marketing-copy",
        invocationId: "inv-7f3c2e",
        lambda: {
          moralGrounding: 0.92,
          measurabilityHonesty: 0.97,
          temporalConsistency: 0.93,
          informationIntegrity: 0.93,
          actionReversibility: 0.93,
          scopeContainment: 0.93,
          stakeholderAlignment: 0.93,
          evidenceAdequacy: 0.93,
          consentBoundary: 0.93,
        },
      },
      {
        namespace: "a11oy",
        name: "marketing-summary-2026-05-17",
        uid: "abcd-1234",
      },
    );

    const decision = decideAdmission(review.request.object.spec, {
      namespace: review.request.namespace,
      name: review.request.name,
      uid: review.request.uid,
    });

    expect(decision.admit).toBe(false);
    expect(decision.status).toBe(422);
    expect(decision.message).toBe(
      "MATURITY_GATE_BLOCKED: moralGrounding=0.920 below floor 0.950 " +
        "[moralGrounding=0.920<0.950]",
    );
    expect(decision.audit.reason).toBe("MATURITY_GATE_BLOCKED");
    expect(decision.audit.failures).toEqual([
      { axis: "moralGrounding", value: 0.92, floor: 0.95 },
    ]);
  });

  it("denies a missing-spec.lambda admission request with a structured message", () => {
    // Simulate a malformed CR (would normally be rejected by CRD OpenAPI
    // validation, but the webhook must still fail closed if it slips through).
    const decision = decideAdmission(
      { agent: "x", invocationId: "y" } as unknown as AgentInvocationSpec,
      { namespace: "default", name: "bad", uid: "u-bad" },
    );
    expect(decision.admit).toBe(false);
    expect(decision.status).toBe(422);
    expect(decision.message).toBe(
      "MATURITY_GATE_BLOCKED: missing spec.lambda",
    );
  });

  it("produces an audit event tagged with the bundled Doctrine V6 replay root", () => {
    const review = admissionReview({
      agent: "a11oy.research-summary",
      invocationId: "inv-audit",
      lambda: {
        moralGrounding: 0.96,
        measurabilityHonesty: 0.96,
        temporalConsistency: 0.92,
        informationIntegrity: 0.92,
        actionReversibility: 0.92,
        scopeContainment: 0.92,
        stakeholderAlignment: 0.92,
        evidenceAdequacy: 0.92,
        consentBoundary: 0.92,
      },
    });
    const decision = decideAdmission(review.request.object.spec, {
      namespace: review.request.namespace,
      name: review.request.name,
      uid: review.request.uid,
    });
    expect(decision.audit.doctrineVersion).toBe("V6");
    expect(decision.audit.replayRoot).toMatch(/^[0-9a-f]{64}$/);
    expect(new Date(decision.audit.ts).toString()).not.toBe("Invalid Date");
  });
});
