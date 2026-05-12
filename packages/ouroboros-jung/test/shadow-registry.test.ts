import { describe, it, expect } from "vitest";
import { ShadowRegistry } from "../src/shadow-registry.js";

describe("Primitive 45 — Shadow registry", () => {
  it("declares and lists entries", () => {
    const r = new ShadowRegistry();
    r.declare({ id: "s1", description: "refusal mode A", declaredAt: "2026-05-01" });
    expect(r.size()).toBe(1);
  });

  it("is not integrated until every shadow is acknowledged", () => {
    const r = new ShadowRegistry();
    r.declare({ id: "s1", description: "x", declaredAt: "t" });
    r.declare({ id: "s2", description: "y", declaredAt: "t" });
    expect(r.isIntegrated()).toBe(false);
    r.acknowledge("s1");
    expect(r.isIntegrated()).toBe(false);
    r.acknowledge("s2");
    expect(r.isIntegrated()).toBe(true);
  });

  it("empty registry is not integrated", () => {
    const r = new ShadowRegistry();
    expect(r.isIntegrated()).toBe(false);
  });

  it("acknowledge unknown returns false", () => {
    const r = new ShadowRegistry();
    expect(r.acknowledge("missing")).toBe(false);
  });

  it("unacknowledged() lists only those not acknowledged", () => {
    const r = new ShadowRegistry();
    r.declare({ id: "s1", description: "x", declaredAt: "t" });
    r.declare({ id: "s2", description: "y", declaredAt: "t" });
    r.acknowledge("s1");
    expect(r.unacknowledged().map((e) => e.id)).toEqual(["s2"]);
  });

  it("declaration sets acknowledged=false", () => {
    const r = new ShadowRegistry();
    const e = r.declare({ id: "s1", description: "x", declaredAt: "t" });
    expect(e.acknowledged).toBe(false);
  });
});
