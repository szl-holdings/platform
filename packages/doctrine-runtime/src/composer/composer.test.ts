/**
 * composer.test.ts — Integration tests for doctrine_composer.ts
 * 15 tests covering: scan, geometric-mean, min-lambda, interleave,
 * cosign preservation, floor rejection, label merge, Prometheus export.
 *
 * Run with: npx tsx --test composer.test.ts
 * (Node.js built-in test runner, no additional framework required)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DoctrineComposer,
  scanDoctrineV6,
  type DoctrinePolicy,
  type CompositionConfig,
} from "./doctrine_composer.js";
import { compositionMetrics, withMetrics } from "./prometheus-exporter.js";

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

function makePolicy(overrides: Partial<DoctrinePolicy> & { lambda: number }): DoctrinePolicy {
  return {
    id: overrides.id ?? `policy-${Math.random().toString(36).slice(2)}`,
    version: 6,
    lambda: overrides.lambda,
    labels: overrides.labels ?? [{ namespace: "io.szl.policy", key: "env", value: "test" }],
    cosignatures: overrides.cosignatures ?? [],
    digest: overrides.digest ?? "a".repeat(64),
  };
}

const DEFAULT_CFG: CompositionConfig = {
  mode: "geometric_mean",
  interleave: "lexicographic",
  lambdaFloor: 0.01,
  preserveCosignatures: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("Doctrine v6 Scanner", () => {
  it("T01 — accepts valid Doctrine v6 policy", () => {
    const p = makePolicy({ lambda: 0.8 });
    const result = scanDoctrineV6(p);
    assert.equal(result.version, 6);
    assert.equal(result.lambda, 0.8);
  });

  it("T02 — rejects policy with version != 6", () => {
    const p = { ...makePolicy({ lambda: 0.5 }), version: 5 };
    assert.throws(() => scanDoctrineV6(p), /Expected Doctrine version 6/);
  });

  it("T03 — rejects lambda outside [0,1]", () => {
    const p = { ...makePolicy({ lambda: 0.5 }), lambda: 1.5 };
    assert.throws(() => scanDoctrineV6(p), /Lambda must be in \[0,1\]/);
  });

  it("T04 — rejects malformed digest (too short)", () => {
    const p = { ...makePolicy({ lambda: 0.5 }), digest: "abc123" };
    assert.throws(() => scanDoctrineV6(p), /64-hex SHA-256/);
  });

  it("T05 — rejects missing cosignatures array", () => {
    const p = { ...makePolicy({ lambda: 0.5 }), cosignatures: "bad" };
    assert.throws(() => scanDoctrineV6(p), /cosignatures must be an array/);
  });
});

describe("Geometric-mean composition", () => {
  it("T06 — two policies produce correct geometric mean", () => {
    const composer = new DoctrineComposer(DEFAULT_CFG);
    const p1 = makePolicy({ id: "aaa", lambda: 0.64 });
    const p2 = makePolicy({ id: "bbb", lambda: 0.25 });
    const result = composer.compose([p1, p2], "composed-01");
    // geo mean = sqrt(0.64 * 0.25) = sqrt(0.16) = 0.4
    assert.ok(Math.abs(result.policy.lambda - 0.4) < 1e-9, `Expected ~0.4 got ${result.policy.lambda}`);
    assert.equal(result.mode, "geometric_mean");
    assert.equal(result.inputCount, 2);
  });

  it("T07 — zero lambda in any input yields 0 (strict gate)", () => {
    const composer = new DoctrineComposer({ ...DEFAULT_CFG, lambdaFloor: 0 });
    const p1 = makePolicy({ id: "aaa", lambda: 0 });
    const p2 = makePolicy({ id: "bbb", lambda: 0.9 });
    const result = composer.compose([p1, p2], "composed-02");
    assert.equal(result.policy.lambda, 0);
  });

  it("T08 — single policy passes through unchanged lambda", () => {
    const composer = new DoctrineComposer(DEFAULT_CFG);
    const p = makePolicy({ lambda: 0.77 });
    const result = composer.compose([p], "composed-03");
    assert.ok(Math.abs(result.policy.lambda - 0.77) < 1e-9);
  });
});

describe("Min-Λ composition", () => {
  it("T09 — min-lambda returns minimum of all inputs", () => {
    const composer = new DoctrineComposer({ ...DEFAULT_CFG, mode: "min_lambda" });
    const policies = [
      makePolicy({ id: "a", lambda: 0.9 }),
      makePolicy({ id: "b", lambda: 0.3 }),
      makePolicy({ id: "c", lambda: 0.7 }),
    ];
    const result = composer.compose(policies, "composed-04");
    assert.equal(result.policy.lambda, 0.3);
    assert.equal(result.mode, "min_lambda");
  });
});

describe("Lambda floor rejection", () => {
  it("T10 — composition below floor throws RangeError", () => {
    const composer = new DoctrineComposer({ ...DEFAULT_CFG, lambdaFloor: 0.5 });
    const p1 = makePolicy({ id: "aaa", lambda: 0.1 });
    const p2 = makePolicy({ id: "bbb", lambda: 0.2 });
    assert.throws(
      () => composer.compose([p1, p2], "rejected"),
      /below floor/
    );
  });
});

describe("Deterministic interleave", () => {
  it("T11 — lexicographic interleave is order-independent on compose", () => {
    const composer = new DoctrineComposer(DEFAULT_CFG);
    const p1 = makePolicy({ id: "beta", lambda: 0.81 });
    const p2 = makePolicy({ id: "alpha", lambda: 0.64 });
    const r1 = composer.compose([p1, p2], "out-a");
    const r2 = composer.compose([p2, p1], "out-a");
    // Geo mean is commutative; output digest should match (same labels, same Λ)
    assert.ok(Math.abs(r1.policy.lambda - r2.policy.lambda) < 1e-12);
  });

  it("T12 — priority_weighted interleave preserves most-restrictive labels", () => {
    const composer = new DoctrineComposer({
      ...DEFAULT_CFG,
      interleave: "priority_weighted",
    });
    const p1 = makePolicy({
      id: "high",
      lambda: 0.9,
      labels: [{ namespace: "io.szl", key: "tier", value: "gold" }],
    });
    const p2 = makePolicy({
      id: "low",
      lambda: 0.2,
      labels: [{ namespace: "io.szl", key: "tier", value: "bronze" }],
    });
    const result = composer.compose([p1, p2], "out-b");
    const tier = result.policy.labels.find((l) => l.key === "tier");
    // lower-lambda policy (p2) wins per Doctrine v6 §3.2.4
    assert.equal(tier?.value, "bronze");
  });
});

describe("Cosignature preservation", () => {
  it("T13 — cosignatures from all inputs appear in output", () => {
    const composer = new DoctrineComposer(DEFAULT_CFG);
    const p1 = makePolicy({
      id: "aaa",
      lambda: 0.8,
      cosignatures: [{ issuer: "signer-a", alg: "ES256", sig: Buffer.from("aa", "hex"), ts: 1000 }],
    });
    const p2 = makePolicy({
      id: "bbb",
      lambda: 0.6,
      cosignatures: [{ issuer: "signer-b", alg: "EdDSA", sig: Buffer.from("bb", "hex"), ts: 2000 }],
    });
    const result = composer.compose([p1, p2], "cosig-out");
    const issuers = result.policy.cosignatures.map((c) => c.issuer);
    assert.ok(issuers.includes("signer-a"));
    assert.ok(issuers.includes("signer-b"));
  });

  it("T14 — preserveCosignatures=false yields empty cosignatures", () => {
    const composer = new DoctrineComposer({ ...DEFAULT_CFG, preserveCosignatures: false });
    const p1 = makePolicy({
      id: "aaa",
      lambda: 0.8,
      cosignatures: [{ issuer: "signer-a", alg: "ES256", sig: Buffer.from("aa", "hex"), ts: 1000 }],
    });
    const result = composer.compose([p1], "no-cosig");
    assert.equal(result.policy.cosignatures.length, 0);
  });
});

describe("Prometheus exporter", () => {
  it("T15 — withMetrics records histogram and renders valid Prometheus text", () => {
    const composer = new DoctrineComposer(DEFAULT_CFG);
    const p1 = makePolicy({ id: "aaa", lambda: 0.81 });
    const p2 = makePolicy({ id: "bbb", lambda: 0.64 });

    withMetrics(() => composer.compose([p1, p2], "prom-test"));

    const text = compositionMetrics.renderText();
    assert.ok(text.includes("szl_composition_overhead_microseconds_bucket"));
    assert.ok(text.includes("szl_composition_overhead_microseconds_sum"));
    assert.ok(text.includes("szl_composition_total"));
    assert.ok(text.includes("szl_composition_lambda_value"));
    assert.ok(text.endsWith("# EOF\n"));
  });
});
