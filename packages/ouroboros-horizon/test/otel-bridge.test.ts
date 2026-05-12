/**
 * Lightweight tests for the OTel bridge using a stub Span. We do not boot
 * the full OTel SDK in unit tests; that is exercised in examples and
 * integration tests inside the embedding application.
 */

import { describe, expect, it } from "vitest";
import { HorizonOtelBridge, attachAllHorizon } from "../src/otel-bridge.js";
import type { Span } from "@opentelemetry/api";
import { asLoopId } from "../src/types.js";

class StubSpan {
  attributes: Record<string, unknown> = {};
  events: Array<{ name: string; attrs: Record<string, unknown> }> = [];
  status: { code: number; message?: string } | null = null;
  setAttribute(k: string, v: unknown): this {
    this.attributes[k] = v;
    return this;
  }
  addEvent(name: string, attrs: Record<string, unknown> = {}): this {
    this.events.push({ name, attrs });
    return this;
  }
  setStatus(s: { code: number; message?: string }): this {
    this.status = s;
    return this;
  }
  end(): void {}
}

describe("HorizonOtelBridge", () => {
  const bridge = new HorizonOtelBridge();

  it("attachPageCurve sets all expected attributes", () => {
    const span = new StubSpan() as unknown as Span;
    bridge.attachPageCurve(span, {
      clean: true,
      residualEntropy: 0.01,
      epsilon: 0.05,
      series: [],
      pageTick: 42,
      pageEntropy: 1.7,
      monotonicRise: true,
      monotonicFall: true,
    });
    const attrs = (span as unknown as StubSpan).attributes;
    expect(attrs["ouroboros.horizon.page_curve.clean"]).toBe(true);
    expect(attrs["ouroboros.horizon.page_curve.residual_bits"]).toBeCloseTo(
      0.01,
      10,
    );
    expect(attrs["ouroboros.horizon.page_curve.peak_tick"]).toBe(42);
  });

  it("attachPageCurve sets ERROR status on dirty close", () => {
    const span = new StubSpan() as unknown as Span;
    bridge.attachPageCurve(span, {
      clean: false,
      residualEntropy: 0.5,
      epsilon: 0.05,
      series: [],
      pageTick: null,
      pageEntropy: 0,
      monotonicRise: false,
      monotonicFall: false,
    });
    expect((span as unknown as StubSpan).status?.code).toBe(2); // ERROR
  });

  it("attachNoHair sets the canonical 5-scalar state plus serialization", () => {
    const span = new StubSpan() as unknown as Span;
    bridge.attachNoHair(span, {
      mass: 12.5,
      charge: -3,
      spin: 2.31,
      tier: 2,
      hash: "a".repeat(64),
    });
    const a = (span as unknown as StubSpan).attributes;
    expect(a["ouroboros.horizon.no_hair.mass"]).toBe(12.5);
    expect(a["ouroboros.horizon.no_hair.tier"]).toBe(2);
    expect(a["ouroboros.horizon.no_hair.serialized"]).toMatch(
      /^nohair\/v1\|/,
    );
  });

  it("attachDualWitness sets ERROR status on inconsistency", () => {
    const span = new StubSpan() as unknown as Span;
    bridge.attachDualWitness(span, {
      consistent: false,
      orphanedClaims: [
        {
          tick: 1,
          level: "internal",
          kind: "tool_call",
          payload: {},
          externallyObservable: true,
          prevHash: "0".repeat(64),
          hash: "0".repeat(64),
        },
      ],
      range: { from: 1, to: 2 },
    });
    const stub = span as unknown as StubSpan;
    expect(stub.attributes["ouroboros.horizon.dual_witness.consistent"]).toBe(
      false,
    );
    expect(stub.status?.code).toBe(2);
  });

  it("recordEntanglementEdge emits a span event", () => {
    const span = new StubSpan() as unknown as Span;
    bridge.recordEntanglementEdge(span, {
      from: asLoopId("a"),
      to: asLoopId("b"),
      bits: 0.7,
      distance: 0.3,
    });
    const stub = span as unknown as StubSpan;
    expect(stub.events).toHaveLength(1);
    expect(stub.events[0]!.name).toBe("ouroboros.horizon.entanglement_edge");
  });

  it("attachAllHorizon delegates to all sub-attach methods", () => {
    const span = new StubSpan() as unknown as Span;
    attachAllHorizon(bridge, span, {
      pageCurve: {
        clean: true,
        residualEntropy: 0,
        epsilon: 0.05,
        series: [],
        pageTick: 1,
        pageEntropy: 0,
        monotonicRise: true,
        monotonicFall: true,
      },
      noHair: {
        mass: 0,
        charge: 0,
        spin: 0,
        tier: 4,
        hash: "f".repeat(64),
      },
    });
    const a = (span as unknown as StubSpan).attributes;
    expect(a["ouroboros.horizon.page_curve.clean"]).toBe(true);
    expect(a["ouroboros.horizon.no_hair.tier"]).toBe(4);
  });
});
