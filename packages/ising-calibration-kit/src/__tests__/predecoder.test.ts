import { describe, expect, it } from "vitest";
import { composePredecoderResult } from "../predecoder.js";
import { makeRef, parseRef, verifyRef } from "../receipts.js";

describe("composePredecoderResult", () => {
  const input = { batchId: "b-1", itemCount: 100, tag: "test" };

  it("seals cleanly when residual rate is under threshold", () => {
    const r = composePredecoderResult({
      input,
      local: { resolvedCount: 98, residualCount: 2, localLatencyMicros: 1 },
      policy: { escalateAboveResidualRate: 0.1 },
    });
    expect(r.escalated).toBe(false);
    expect(r.escalationRef).toBeNull();
    expect(r.globalRef).toBeNull();
    expect(r.residualRate).toBe(0.02);
    expect(r.inputRef.startsWith("ising.predecode.input.v1:")).toBe(true);
    expect(r.localRef.startsWith("ising.predecode.local.v1:")).toBe(true);
    expect(r.residualRef.startsWith("ising.predecode.residual.v1:")).toBe(true);
  });

  it("throws when residual exceeds threshold and no globalDecoderRef supplied", () => {
    expect(() =>
      composePredecoderResult({
        input,
        local: {
          resolvedCount: 50,
          residualCount: 50,
          localLatencyMicros: 1,
        },
        policy: { escalateAboveResidualRate: 0.1 },
      }),
    ).toThrow(/escalation is mandatory/);
  });

  it("throws when supplied globalDecoderRef is the wrong class", () => {
    const wrongClassBody = { x: 1 };
    const wrongClassRef = makeRef(
      "ising.predecode.local.v1",
      wrongClassBody,
    );
    expect(() =>
      composePredecoderResult({
        input,
        local: {
          resolvedCount: 50,
          residualCount: 50,
          localLatencyMicros: 1,
        },
        policy: { escalateAboveResidualRate: 0.1 },
        globalDecoderRef: wrongClassRef,
        globalDecoderBody: {
          consumesResidualDigest: "deadbeefdeadbeef",
          metrics: {},
        },
      }),
    ).toThrow(/must be ising\.global\.decoded\.v1/);
  });

  it("rejects a fabricated globalDecoderRef (right prefix, fake digest)", () => {
    expect(() =>
      composePredecoderResult({
        input,
        local: {
          resolvedCount: 50,
          residualCount: 50,
          localLatencyMicros: 1,
        },
        policy: { escalateAboveResidualRate: 0.1 },
        // syntactically well-formed ref with correct class prefix, but
        // its digest is invented — does NOT match any real body.
        globalDecoderRef:
          "ising.global.decoded.v1:0123456789abcdef" as const,
        globalDecoderBody: {
          consumesResidualDigest:
            "0000000000000000000000000000000000000000000000000000000000000000",
          metrics: { fabricated: true },
        },
      }),
    ).toThrow();
  });

  it("rejects a globalDecoderBody bound to a different cascade's residual", () => {
    const otherResidualDigest =
      "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
    const body = {
      consumesResidualDigest: otherResidualDigest,
      metrics: { corrections: 47 },
    };
    const realRef = makeRef("ising.global.decoded.v1", body);
    expect(() =>
      composePredecoderResult({
        input,
        local: {
          resolvedCount: 50,
          residualCount: 50,
          localLatencyMicros: 1,
        },
        policy: { escalateAboveResidualRate: 0.1 },
        globalDecoderRef: realRef,
        globalDecoderBody: body,
      }),
    ).toThrow(/does not match this cascade's residual digest/);
  });

  it("requires globalDecoderBody when escalation is mandatory", () => {
    const realRef = makeRef("ising.global.decoded.v1", {
      consumesResidualDigest: "x",
      metrics: {},
    });
    expect(() =>
      composePredecoderResult({
        input,
        local: {
          resolvedCount: 50,
          residualCount: 50,
          localLatencyMicros: 1,
        },
        policy: { escalateAboveResidualRate: 0.1 },
        globalDecoderRef: realRef,
        // body omitted on purpose
      }),
    ).toThrow(/globalDecoderBody is required/);
  });

  it("seals with escalation when a verified global ref+body is supplied", () => {
    // To produce a *real* global ref, we must first know the cascade's
    // residual digest, so we re-derive it the same way the kit does:
    // pre-compute the cascade with a NON-escalating local to extract
    // the residual digest, then construct the real global body.
    // Equivalently: compute it inline.
    const localOut = {
      resolvedCount: 50,
      residualCount: 50,
      localLatencyMicros: 1,
    };
    const policyArg = { escalateAboveResidualRate: 0.1 };

    // Re-derive the residual digest the kit will compute.
    // We use a helper: run with a very lax policy first to extract the
    // residualRef, parse its digest.
    const dryRun = composePredecoderResult({
      input,
      local: localOut,
      policy: { escalateAboveResidualRate: 1 }, // never escalates
    });
    const residualDigest = dryRun.residualRef.split(":")[1];

    const globalBody = {
      consumesResidualDigest: residualDigest,
      metrics: { corrections: 47 },
    };
    const realGlobalRef = makeRef("ising.global.decoded.v1", globalBody);

    const r = composePredecoderResult({
      input,
      local: localOut,
      policy: policyArg,
      globalDecoderRef: realGlobalRef,
      globalDecoderBody: globalBody,
    });
    expect(r.escalated).toBe(true);
    expect(r.globalRef).toBe(realGlobalRef);
    expect(r.escalationRef?.startsWith("ising.escalation.required.v1:")).toBe(
      true,
    );
  });

  it("rejects internally inconsistent local output", () => {
    expect(() =>
      composePredecoderResult({
        input,
        local: { resolvedCount: 60, residualCount: 50, localLatencyMicros: 1 },
        policy: { escalateAboveResidualRate: 0.9 },
      }),
    ).toThrow(/resolved.*residual.*itemCount/);
  });

  it("rejects out-of-range escalation policy", () => {
    expect(() =>
      composePredecoderResult({
        input,
        local: { resolvedCount: 100, residualCount: 0, localLatencyMicros: 1 },
        policy: { escalateAboveResidualRate: 1.5 },
      }),
    ).toThrow(/must be in \[0, 1\]/);
  });

  it("emits identical refs for identical inputs (content-addressed)", () => {
    const a = composePredecoderResult({
      input,
      local: { resolvedCount: 98, residualCount: 2, localLatencyMicros: 1 },
      policy: { escalateAboveResidualRate: 0.1 },
    });
    const b = composePredecoderResult({
      input,
      local: { resolvedCount: 98, residualCount: 2, localLatencyMicros: 1 },
      policy: { escalateAboveResidualRate: 0.1 },
    });
    expect(a.inputRef).toBe(b.inputRef);
    expect(a.localRef).toBe(b.localRef);
    expect(a.residualRef).toBe(b.residualRef);
  });

  it("refs parse and verify cleanly", () => {
    const r = composePredecoderResult({
      input,
      local: { resolvedCount: 100, residualCount: 0, localLatencyMicros: 1 },
      policy: { escalateAboveResidualRate: 0.1 },
    });
    const parsed = parseRef(r.inputRef);
    expect(parsed.cls).toBe("ising.predecode.input.v1");
    expect(parsed.digest).toMatch(/^[0-9a-f]{16}$/);
    // verify against the same body we know was used
    expect(
      verifyRef(r.inputRef, { batchId: "b-1", itemCount: 100, tag: "test" }),
    ).toBe(true);
  });
});
