// SPDX-License-Identifier: Apache-2.0
// © 2026 Lutar, Stephen P. — SZL Holdings
//
// Real tests for the anatomy-contracts package. Run:
//   node --experimental-strip-types --test src/__tests__/contracts.test.ts
//
// These exercise the validator against the *emitted* schema files and the
// trace-context helpers. No mocks — the validator, the schemas, and the
// trace functions are the real production code.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  validate,
  isValidTraceparent,
  newTraceparent,
  childTraceparent,
  traceIdOf,
  type ActionProposal,
  type PolicyDecision,
  type ReasonResponse,
} from "../index.ts";
import {
  actionProposalSchema,
  policyDecisionSchema,
  reasonResponseSchema,
  spanHeadersSchema,
} from "../schemas.ts";

test("a valid ActionProposal passes its schema", () => {
  const proposal: ActionProposal = {
    actionId: "act-001",
    summary: "promote model v3 to production",
    severity: "high",
    decisionClass: "human-required",
    confidence: 0.82,
    witnesses: ["evidence://eval-run-7"],
    principal: "operator:stephen",
  };
  const r = validate(proposal, actionProposalSchema);
  assert.equal(r.valid, true, JSON.stringify(r.errors));
});

test("an ActionProposal with bad severity is rejected", () => {
  const bad = {
    actionId: "act-002",
    summary: "x",
    severity: "catastrophic", // not in enum
    decisionClass: "advisory",
    confidence: 0.5,
    witnesses: [],
    principal: "operator:x",
  };
  const r = validate(bad, actionProposalSchema);
  assert.equal(r.valid, false);
  assert.ok(r.errors.some((e) => e.path === "$.severity"));
});

test("confidence out of [0,1] is rejected", () => {
  const bad = {
    actionId: "act-003",
    summary: "x",
    severity: "low",
    decisionClass: "advisory",
    confidence: 1.7,
    witnesses: [],
    principal: "operator:x",
  };
  const r = validate(bad, actionProposalSchema);
  assert.equal(r.valid, false);
  assert.ok(r.errors.some((e) => e.path === "$.confidence"));
});

test("missing required fields are reported with paths", () => {
  const r = validate({ actionId: "a" }, actionProposalSchema);
  assert.equal(r.valid, false);
  assert.ok(r.errors.some((e) => e.path === "$.summary"));
  assert.ok(r.errors.some((e) => e.path === "$.principal"));
});

test("a valid PolicyDecision passes its schema", () => {
  const decision: PolicyDecision = {
    actionId: "act-001",
    decision: "deny",
    gate: "thresholdPolicySeverity",
    decidedBy: "sentra.immune",
    rationale: "threat signature matched",
    lambdaScore: 0.0,
    receiptHash: "",
    traceparent: newTraceparent(),
  };
  const r = validate(decision, policyDecisionSchema);
  assert.equal(r.valid, true, JSON.stringify(r.errors));
});

test("a PolicyDecision with a bad decidedBy is rejected", () => {
  const bad = {
    actionId: "a",
    decision: "allow",
    gate: "g",
    decidedBy: "skynet",
    rationale: "r",
    lambdaScore: 1,
    receiptHash: "h",
    traceparent: newTraceparent(),
  };
  const r = validate(bad, policyDecisionSchema);
  assert.equal(r.valid, false);
  assert.ok(r.errors.some((e) => e.path === "$.decidedBy"));
});

test("a ReasonResponse with nested provenance validates", () => {
  const resp: ReasonResponse = {
    actionId: "act-9",
    chakra: "crown",
    rationale: "leader region produced rationale",
    provenance: { source: "amaru:crown", chakra: "crown", amaruVersion: "0.1.0" },
    evaluation: { ok: true },
    traceparent: newTraceparent(),
  };
  const r = validate(resp, reasonResponseSchema);
  assert.equal(r.valid, true, JSON.stringify(r.errors));
});

test("traceparent: minted ones are valid, child shares trace-id with new span-id", () => {
  const root = newTraceparent();
  assert.equal(isValidTraceparent(root), true);
  const child = childTraceparent(root);
  assert.equal(isValidTraceparent(child), true);
  assert.equal(traceIdOf(child), traceIdOf(root), "child keeps trace-id");
  assert.notEqual(
    root.slice(36, 52),
    child.slice(36, 52),
    "child gets a new span-id",
  );
});

test("traceparent: malformed strings are rejected by isValidTraceparent", () => {
  assert.equal(isValidTraceparent("garbage"), false);
  assert.equal(isValidTraceparent("00-" + "0".repeat(32) + "-" + "1".repeat(16) + "-01"), false, "all-zero trace-id invalid");
  assert.equal(isValidTraceparent("00-" + "a".repeat(32) + "-" + "0".repeat(16) + "-01"), false, "all-zero span-id invalid");
});

test("childTraceparent of a malformed parent starts a fresh valid trace", () => {
  const child = childTraceparent("not-a-traceparent");
  assert.equal(isValidTraceparent(child), true);
});

test("SpanHeaders schema rejects a malformed traceparent", () => {
  const r = validate({ traceparent: "00-bad" }, spanHeadersSchema);
  assert.equal(r.valid, false);
});
