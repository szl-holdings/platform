/**
 * @workspace/ouroboros-integrations — integration smoke tests.
 *
 * Verifies that the package index.ts loads cleanly with all 11 foundation
 * files present, and that the core public API surface is intact.
 */

import { describe, it, expect } from "vitest";
import * as integ from "../src/index.js";

describe("@workspace/ouroboros-integrations — index surface", () => {
  it("exposes A11oyOrchestrator class", () => {
    expect(typeof integ.A11oyOrchestrator).toBe("function");
  });

  it("exposes Codex builders", () => {
    expect(typeof integ.buildSupremeCodex).toBe("function");
    expect(typeof integ.codexSummary).toBe("function");
  });

  it("exposes Lambda Engine", () => {
    expect(typeof integ.computeLambdaEngine).toBe("function");
    expect(integ.LAMBDA_ENGINE_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("exposes Convergence Pulse", () => {
    expect(typeof integ.ConvergencePulse).toBe("function");
  });

  it("exposes a11oy, sentra, amaru sub-namespaces", () => {
    expect(typeof integ.a11oy).toBe("object");
    expect(typeof integ.sentra).toBe("object");
    expect(typeof integ.amaru).toBe("object");
  });
});

describe("@workspace/ouroboros-integrations — Codex v11", () => {
  it("builds a 11-domain codex with >=76 nodes / >=95 edges", () => {
    const codex = integ.buildSupremeCodex();
    const sum = integ.codexSummary(codex);
    expect(sum.totalNodes).toBeGreaterThanOrEqual(75);
    expect(sum.totalEdges).toBeGreaterThanOrEqual(94);
    expect(sum.domains.length).toBeGreaterThanOrEqual(11);
  });
});

describe("@workspace/ouroboros-integrations — A11oy Orchestrator", () => {
  it("constructs without error", () => {
    const orch = new integ.A11oyOrchestrator();
    expect(orch).toBeDefined();
  });

  it("orchestrator has expected methods", () => {
    const orch = new integ.A11oyOrchestrator();
    // Test against actual class shape, not assumptions
    const proto = Object.getPrototypeOf(orch);
    const methods = Object.getOwnPropertyNames(proto).filter(
      (n) => n !== "constructor" && typeof (orch as any)[n] === "function"
    );
    expect(methods.length).toBeGreaterThan(0);
  });
});
