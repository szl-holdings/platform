/**
 * paper-to-receipt.test.ts — ONE end-to-end integration test of the full
 * canonical Paper-to-Receipt path, running real components (the single unwired
 * piece — Cardano on-chain submit — is exercised as an honest NotYetError).
 */
import { describe, it, expect } from "vitest";
import { paperToReceipt, type Paper } from "./paper-to-receipt.ts";
import { DOCTRINE_V11_AXIOMS, type Receipt } from "./invariants/index.ts";

const AX = DOCTRINE_V11_AXIOMS;

function makePaper(): Paper {
  const bus: Receipt[] = [
    { id: "r1", bits: 4096, axisValues: AX.map(() => 0.92), crossesUnder: "r2" },
    { id: "r2", bits: 4096, axisValues: AX.map(() => 0.88), crossesUnder: "r3" },
    { id: "r3", bits: 4096, axisValues: AX.map(() => 0.95) },
  ];
  return {
    thesisDoi: "10.5281/zenodo.0000000",
    thesisVersion: "v18",
    receiptBus: bus,
    payloadByte: 0xa5,
  };
}

describe("paperToReceipt — canonical end-to-end flow", () => {
  it("runs cite → Lean Λ-gate → runtime → rosie → amaru → sentra → mesh", async () => {
    const out = await paperToReceipt(makePaper());

    // Λ closure produced with all four named bounds.
    expect(out.closure.compositeLambda).toBeGreaterThan(0);
    expect(out.closure.compositeLambda).toBeLessThanOrEqual(1);
    expect(out.closure.uniqueAxiomCount).toBe(14);
    expect(out.closure.reidemeisterClass).toBe("R3"); // 3-strand receipt-knot chain

    // Lean Λ-gate named + live canonical numbers (c7c0ba17).
    expect(out.leanGate).toBe("lambda_satisfiesAxioms");
    expect(out.canonicalNumbers.declarations).toBe(749);
    expect(out.canonicalNumbers.uniqueAxioms).toBe(14);
    expect(out.canonicalNumbers.buildingSha).toBe("c7c0ba17");

    // Ouroboros runtime really ran and halted.
    expect(out.runtimeHalted).toBe(true);
    expect(out.runtimeSteps).toBeGreaterThan(0);

    // rosie CSS-ingress: a consistent stabilizer pair + canonical byte-string.
    expect((out.cssXParity ^ out.cssZParity) & 0xff).toBe(0xff);
    expect(out.ledgerEntryHash).toMatch(/^[0-9a-f]{64}$/);
    expect(out.byteStringHash).toMatch(/^[0-9a-f]{64}$/);

    // amaru: Shor majority decode recovers the payload byte; anchor is pending.
    expect(out.shorRecoveredByte).toBe(0xa5);
    expect(out.cardanoAnchor.anchored).toBe(false);
    expect(out.cardanoAnchor.pending).toMatch(/amaru Cardano/);

    // sentra: Kitaev vertex parity reports no drift.
    expect(out.sentraNoDrift).toBe(true);

    // uds-mesh + vsp-otel: a valid W3C traceparent span was exported.
    expect(out.otelTraceparent).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-0[01]$/);
  });

  it("honestly throws NotYetError when asked to submit on-chain (no fake green)", async () => {
    await expect(paperToReceipt(makePaper(), { submitToCardano: true })).rejects.toThrow(
      /not yet wired.*amaru Cardano/,
    );
  });
});
