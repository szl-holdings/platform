// SPDX-License-Identifier: Apache-2.0
// © 2026 Lutar, Stephen P. — SZL Holdings
//
// Wire E — in-memory span propagation verification (the nervous system).
//
// The mesh servers forward a W3C `traceparent` on every cross-app call, deriving
// a child span (same trace-id, fresh span-id) at each hop. This test verifies
// that contract end-to-end *in memory*: it replays the mesh's exact propagation
// (childTraceparent) through a SpanRecorder for the real call shape —
//
//   rosie:propose
//     └─ a11oy:policy.evaluate          (Wire D: rosie → a11oy)
//         └─ sentra:immune.inspect      (Wire B: a11oy → sentra)
//     └─ a11oy:reason                   (Wire C: rosie → a11oy)
//         └─ amaru:chakra.evaluate      (Wire C: a11oy → amaru)
//
// and asserts the spans form ONE trace whose parent→child tree is correct.
//
// Run: node --experimental-strip-types --test src/__tests__/spans.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import { newTraceparent, childTraceparent, isValidTraceparent, traceIdOf } from "../index.ts";
import { SpanRecorder, parseTraceparent } from "../spans.ts";

test("a cross-app request fans out into one trace with a correct span tree", () => {
  const r = new SpanRecorder();

  // The operator console mints the root span.
  const root = r.startRoot("rosie:propose", newTraceparent());

  // Wire D: rosie → a11oy policy evaluation.
  const policy = r.startChild("a11oy:policy.evaluate", root);
  // Wire B: a11oy → sentra immune inspection (child of the policy span).
  const immune = r.startChild("sentra:immune.inspect", policy);

  // Wire C: rosie → a11oy reason, then a11oy → amaru.
  const reason = r.startChild("a11oy:reason", root);
  const brain = r.startChild("amaru:chakra.evaluate", reason);

  // One trace, no problems.
  assert.deepEqual(r.validate(), [], "the span tree is well-formed");
  assert.equal(r.traceIds().length, 1, "every span shares the same trace-id");

  // Parent→child relationships hold across the wires.
  assert.equal(policy.parentSpanId, root.spanId, "policy span is a child of the root");
  assert.equal(immune.parentSpanId, policy.spanId, "immune span is a child of the policy span");
  assert.equal(reason.parentSpanId, root.spanId, "reason span is a child of the root");
  assert.equal(brain.parentSpanId, reason.spanId, "amaru span is a child of the reason span");

  // Span-ids are all distinct.
  const spanIds = r.spans().map((s) => s.spanId);
  assert.equal(new Set(spanIds).size, spanIds.length, "span-ids are unique");

  // The root has exactly two direct children (the two a11oy entry points).
  assert.equal(r.childrenOf(root).length, 2);
});

test("childTraceparent keeps the trace-id and changes the span-id", () => {
  const parent = newTraceparent();
  const child = childTraceparent(parent);
  assert.ok(isValidTraceparent(child), "child traceparent is valid");
  assert.equal(traceIdOf(child), traceIdOf(parent), "trace-id propagates unchanged");
  const p = parseTraceparent(parent)!;
  const c = parseTraceparent(child)!;
  assert.notEqual(c.spanId, p.spanId, "child gets a fresh span-id");
});

test("a malformed inbound traceparent starts a fresh trace (honest fallback)", () => {
  const r = new SpanRecorder();
  const root = r.startRoot("rosie:propose", newTraceparent());
  // Simulate a hop whose advertised traceparent got corrupted: childTraceparent
  // refuses to propagate a bad header and mints a fresh root instead.
  const corrupted = { ...root, traceparent: "00-not-a-valid-traceparent-00" };
  const child = childTraceparent(corrupted.traceparent);
  assert.ok(isValidTraceparent(child), "a fresh, valid traceparent is minted");
  assert.notEqual(traceIdOf(child), root.traceId, "it is a NEW trace, not the corrupted one");
});

test("the recorder rejects an invalid root traceparent", () => {
  const r = new SpanRecorder();
  assert.throws(() => r.startRoot("bad", "00-zzzz-zzzz-zz"), /invalid root traceparent/);
});
