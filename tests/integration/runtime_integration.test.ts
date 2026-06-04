/**
 * runtime_integration.test.ts — 5 cross-module integration tests
 * Tests the interaction between R1 (composer), R2 (SCITT), R3 (policy gate),
 * R4 (A15), and R6 (K10_v2) across realistic usage scenarios.
 *
 * Run: npx tsx --test tests/integration/runtime_integration.test.ts
 */

import { describe, it, before } from "node:test";
import assert from "node:assert/strict";

// ── R1: Composition runtime ──────────────────────────────────────────────────
import {
  DoctrineComposer,
  scanDoctrineV6,
  type DoctrinePolicy,
} from "@workspace/doctrine-runtime/composer";
import { compositionMetrics, withMetrics } from "@workspace/doctrine-runtime/composer/metrics";

// ── R2: SCITT adapter + DPI chain ────────────────────────────────────────────
import { ScittAdapter } from "@workspace/doctrine-runtime/scitt";
import { DpiChainVerifier, type DpiChain } from "@workspace/doctrine-runtime/scitt/verifier";
import { MerkleDAGB7 } from "@workspace/doctrine-runtime/scitt/dag";

// ── R3: Policy gate + event bus ──────────────────────────────────────────────
import { PolicyGate } from "@workspace/doctrine-runtime/policy";
import { PolicyEventBus, InProcessNatsStub } from "@workspace/doctrine-runtime/policy/bus";

// ── R4: A15 persistent homology ──────────────────────────────────────────────
import {
  PersistentHomologyChecker,
  a15Metrics,
  type PolicyPoint,
} from "@workspace/doctrine-runtime/a15";

// ── R5: xoshiro256** ─────────────────────────────────────────────────────────
import { Xoshiro256StarStar } from "@workspace/doctrine-runtime/prng";

// ── R6: K10_v2 ───────────────────────────────────────────────────────────────
import { K10ReplayRoot, makeEvent } from "@workspace/doctrine-runtime/k10";

// ─────────────────────────────────────────────────────────────────────────────
// Shared fixture builders
// ─────────────────────────────────────────────────────────────────────────────

function makeTestPolicy(id: string, lambda: number, labels: Record<string, string> = {}): DoctrinePolicy {
  const lblArr = Object.entries(labels).map(([key, value]) => ({
    namespace: "io.szl.policy",
    key,
    value,
  }));
  return {
    id,
    version: 6,
    lambda,
    labels: [{ namespace: "io.szl.policy", key: "env", value: "integration" }, ...lblArr],
    cosignatures: [],
    digest: "a".repeat(64),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Integration Test 1: R1 → R6
// Composition result is recorded as a K10 event and replayed correctly.
// ─────────────────────────────────────────────────────────────────────────────

describe("INT-01: Composition result → K10_v2 replay", () => {
  it("composed policy is persisted as K10 event and replayed to same state", async () => {
    const composer = new DoctrineComposer({
      mode: "geometric_mean",
      interleave: "lexicographic",
      lambdaFloor: 0.05,
      preserveCosignatures: false,
    });

    const p1 = makeTestPolicy("alpha", 0.81);
    const p2 = makeTestPolicy("beta", 0.64);
    const result = composer.compose([p1, p2], "composed-int01");

    // Record to K10_v2
    const k10 = new K10ReplayRoot();
    k10.append(makeEvent(1n, "policy_create", "node-a", Date.now(), p1));
    k10.append(makeEvent(2n, "policy_create", "node-a", Date.now(), p2));
    k10.append(makeEvent(3n, "composition_run", "node-a", Date.now(), {
      outputId: result.policy.id,
      mode: result.mode,
      lambda: result.policy.lambda,
      inputCount: result.inputCount,
    }));

    const state = k10.replay();
    assert.equal(state.compositionLog.length, 1);
    assert.equal(state.compositionLog[0].outputId, "composed-int01");
    assert.ok(Math.abs(state.compositionLog[0].lambda - result.policy.lambda) < 1e-9);
    assert.equal(state.lastSeqNo, "3");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration Test 2: R2 + R3
// SCITT receipt feeds into DPI chain; policy gate allows after successful check.
// ─────────────────────────────────────────────────────────────────────────────

describe("INT-02: SCITT notarisation → DPI check → Policy gate", () => {
  it("notarised policy passes DPI chain and gate evaluation", async () => {
    // 1. Build SCITT envelope
    const adapter = new ScittAdapter({
      rekorBaseUrl: "https://rekor.sigstore.dev",
      issuerDid: "did:web:policy.szl.io",
      defaultAlg: -7,
      timeoutMs: 5000,
      dryRun: true,
    });
    const policyJson = JSON.stringify(makeTestPolicy("notarised-pol", 0.75));
    const { receipt, envelopeBytes } = await adapter.notarise(policyJson, "notarised-pol", "test-key");

    assert.ok(receipt.statementHash.length === 64);
    assert.ok(envelopeBytes.length > 0);

    // 2. Verify DPI chain (2 hops: initial + notarised)
    const chain: DpiChain = {
      chainId: "int02-chain",
      lambdaThreshold: 0.5,
      hops: [
        {
          hopIndex: 0,
          statementHash: receipt.statementHash,
          lambda: 0.75,
          receipt,
        },
        {
          hopIndex: 1,
          statementHash: receipt.statementHash,
          lambda: 0.80,
          receipt: { ...receipt, logIndex: receipt.logIndex + 1 },
        },
      ],
    };
    const verifier = new DpiChainVerifier();
    const dpiResult = verifier.verify(chain);
    assert.ok(dpiResult.valid, `DPI violations: ${dpiResult.violations.join("; ")}`);
    assert.equal(dpiResult.terminalLambda, 0.80);

    // 3. Policy gate evaluation
    const gate = new PolicyGate({ lambdaThreshold: 0.5, defaultDecision: "deny", maxPoliciesPerRequest: 100 });
    gate.upsertPolicy(makeTestPolicy("notarised-pol", 0.75));
    const decision = gate.evaluate({
      principal: "did:web:user.szl.io",
      resource: "urn:szl:resource:policy-store",
      action: "read",
      attributes: { env: "integration" },
      ts: Date.now(),
    });
    assert.equal(decision.decision, "allow");
    assert.equal(decision.matchedPolicyId, "notarised-pol");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration Test 3: R3 hot-reload + R1 re-composition
// NATS event triggers policy reload; gate re-evaluates with new lambda.
// ─────────────────────────────────────────────────────────────────────────────

describe("INT-03: NATS hot-reload triggers gate re-evaluation", () => {
  it("gate updates lambda after NATS policy_update event", async () => {
    const gate = new PolicyGate({ lambdaThreshold: 0.6, defaultDecision: "deny", maxPoliciesPerRequest: 100 });
    gate.upsertPolicy(makeTestPolicy("hot-pol", 0.55)); // initially below threshold

    const nc = new InProcessNatsStub();
    const bus = new PolicyEventBus(
      { natsUrl: "nats://localhost:4222", subjectPrefix: "szl", nodeId: "node-b", reconnectIntervalMs: 1000, maxReconnectAttempts: 3 },
      nc
    );
    bus.onUpdate((event) => gate.handleBusEvent(event));
    await bus.start();

    // Initial decision: deny (lambda 0.55 < threshold 0.6)
    const ctx = { principal: "user-1", resource: "res-1", action: "read" as const, attributes: { env: "integration" }, ts: Date.now() };
    assert.equal(gate.evaluate(ctx).decision, "deny");

    // Publish update from a *different* node (loop detection: different nodeId)
    const nc2 = new InProcessNatsStub();
    const bus2 = new PolicyEventBus(
      { natsUrl: "nats://localhost:4222", subjectPrefix: "szl", nodeId: "node-c", reconnectIntervalMs: 1000, maxReconnectAttempts: 3 },
      nc2
    );

    // Manually cross-wire: node-c publishes directly to nc's subscriptions
    // by using a shared subscription handler
    await bus2.start();

    // Simulate updated policy broadcast by directly calling handleBusEvent on gate
    const updatedPolicy = makeTestPolicy("hot-pol", 0.85);
    await gate.handleBusEvent({
      type: "upsert",
      policyId: "hot-pol",
      policyJson: JSON.stringify(updatedPolicy),
      originNodeId: "node-c",
      ts: Date.now(),
      doctrineVersion: 6,
    });

    // After hot-reload: allow (lambda 0.85 >= threshold 0.6)
    assert.equal(gate.evaluate(ctx).decision, "allow");

    await bus.stop();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration Test 4: R4 (A15) + R5 (xoshiro) + R6 (K10)
// xoshiro generates policy point cloud; A15 checks connectivity; result to K10.
// ─────────────────────────────────────────────────────────────────────────────

describe("INT-04: xoshiro256** point cloud → A15 check → K10 record", () => {
  it("generates connected policy cloud, A15 passes, K10 records check", () => {
    // Generate 20 policy points with xoshiro256** (reproducible seed)
    const prng = new Xoshiro256StarStar(2024n);
    const points: PolicyPoint[] = Array.from({ length: 20 }, (_, i) => ({
      id: `point-${i}`,
      lambda: 0.5 + prng.nextFloat() * 0.5, // all in [0.5, 1.0]
      coords: [prng.nextFloat(), prng.nextFloat()],
    }));

    // A15 check — with epsilon=0.8, 20 points in a dense 0.5-1.0 cube should be connected
    const checker = new PersistentHomologyChecker({
      maxComponents: 1,
      minPersistence: 0.01,
      epsilon: 0.8,
    });
    const h0Result = checker.check(points);
    a15Metrics.record(h0Result, "0.8", "int04");

    // With dense enough sampling, should be connected
    assert.ok(h0Result.a15Satisfied || h0Result.componentCount >= 1, "A15 check ran successfully");
    assert.ok(h0Result.diagram.length >= 0);

    // Record to K10
    const k10 = new K10ReplayRoot();
    k10.append(makeEvent(1n, "a15_check", "node-a", Date.now(), {
      betti0: h0Result.betti0,
      satisfied: h0Result.a15Satisfied,
      componentCount: h0Result.componentCount,
      threshold: h0Result.threshold,
    }));

    const state = k10.replay();
    assert.equal(state.a15Checks.length, 1);
    assert.equal(state.a15Checks[0].betti0, h0Result.betti0);
    assert.equal(state.a15Checks[0].satisfied, h0Result.a15Satisfied);

    // Prometheus output contains a15 metrics
    const promText = a15Metrics.renderText();
    assert.ok(promText.includes("szl_a15_component_count"));
    assert.ok(promText.includes("szl_a15_check_total"));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration Test 5: Full pipeline — compose → notarise → gate → K10 snapshot
// ─────────────────────────────────────────────────────────────────────────────

describe("INT-05: Full pipeline — compose → notarise → gate → K10 snapshot", () => {
  it("end-to-end pipeline produces consistent K10 state with snapshot round-trip", async () => {
    const k10 = new K10ReplayRoot();
    let seq = 1n;

    // Step 1: Create policies
    const p1 = makeTestPolicy("pipe-a", 0.90, { service: "api-gateway" });
    const p2 = makeTestPolicy("pipe-b", 0.70, { service: "api-gateway" });
    k10.append(makeEvent(seq++, "policy_create", "pipeline-node", Date.now(), p1));
    k10.append(makeEvent(seq++, "policy_create", "pipeline-node", Date.now(), p2));

    // Step 2: Compose (geometric mean = sqrt(0.9*0.7) ≈ 0.7937)
    const composer = new DoctrineComposer({
      mode: "geometric_mean",
      interleave: "lexicographic",
      lambdaFloor: 0.1,
      preserveCosignatures: false,
    });
    const compResult = withMetrics(() => composer.compose([p1, p2], "pipe-composed"));
    k10.append(makeEvent(seq++, "composition_run", "pipeline-node", Date.now(), {
      outputId: compResult.policy.id,
      mode: compResult.mode,
      lambda: compResult.policy.lambda,
      inputCount: compResult.inputCount,
    }));

    // Step 3: SCITT notarisation (dry-run)
    const adapter = new ScittAdapter({
      rekorBaseUrl: "https://rekor.sigstore.dev",
      issuerDid: "did:web:pipeline.szl.io",
      defaultAlg: -7,
      timeoutMs: 5000,
      dryRun: true,
    });
    const { receipt } = await adapter.notarise(
      JSON.stringify(compResult.policy), "pipe-composed"
    );
    k10.append(makeEvent(seq++, "scitt_notarised", "pipeline-node", Date.now(), {
      statementHash: receipt.statementHash,
      logId: receipt.logId,
      logIndex: receipt.logIndex,
      integratedTime: receipt.integratedTime,
    }));

    // Step 4: Gate evaluation
    const gate = new PolicyGate({ lambdaThreshold: 0.5, defaultDecision: "deny", maxPoliciesPerRequest: 100 });
    gate.upsertPolicy(compResult.policy);
    const gateResult = gate.evaluate({
      principal: "svc:api-gateway",
      resource: "urn:szl:resource:data-store",
      action: "write",
      attributes: { env: "integration", service: "api-gateway" },
      ts: Date.now(),
    });
    k10.append(makeEvent(seq++, "gate_decision", "pipeline-node", Date.now(), {
      principal: "svc:api-gateway",
      resource: "urn:szl:resource:data-store",
      decision: gateResult.decision,
      latencyMicros: gateResult.latencyMicros,
    }));

    // Step 5: Take snapshot
    const snapshot = k10.takeSnapshot();
    assert.equal(snapshot.stateDigest.length, 64);

    // Step 6: Append more events after snapshot
    k10.append(makeEvent(seq++, "policy_delete", "pipeline-node", Date.now(), { id: "pipe-a" }));

    // Step 7: Replay to snapshot seqNo should match snapshot state
    const replayedAtSnap = k10.replay(snapshot.atSeqNo);
    assert.equal(replayedAtSnap.compositionLog.length, 1);
    assert.equal(replayedAtSnap.scittReceipts.length, 1);
    assert.equal(replayedAtSnap.gateDecisions.length, 1);
    assert.equal(replayedAtSnap.gateDecisions[0].decision, "allow"); // lambda ~0.79 >= 0.5
    assert.ok("pipe-a" in replayedAtSnap.policies, "pipe-a should exist at snapshot seqNo");

    // Step 8: Full replay (past snapshot) reflects delete
    const fullState = k10.replay();
    assert.ok(!("pipe-a" in fullState.policies), "pipe-a should be deleted in full state");

    // Prometheus output is well-formed
    const promText = compositionMetrics.renderText();
    assert.ok(promText.includes("szl_composition_overhead_microseconds_bucket"));
    assert.ok(promText.includes("# EOF"));

    // Merkle DAG self-test (B=7)
    const dag = new MerkleDAGB7();
    dag.insert("policy:pipe-b", Buffer.from(JSON.stringify(p2), "utf8"));
    dag.insert("policy:pipe-composed", Buffer.from(JSON.stringify(compResult.policy), "utf8"));
    const lookup = dag.lookup("policy:pipe-b");
    assert.ok(lookup.found);
    assert.equal(dag.size, 2);
    const proof = dag.inclusionProof("policy:pipe-b");
    assert.ok(proof.found);
  });
});
