import { describe, it, expect } from "vitest";
import { ArchetypeMap } from "../src/archetype-mapping.js";

describe("Primitive 47 — Archetype mapping", () => {
  it("binds and looks up an agent", () => {
    const m = new ArchetypeMap();
    m.bind({ agentId: "a1", archetype: "sage", rationale: "research role" });
    expect(m.lookup("a1")?.archetype).toBe("sage");
  });

  it("rejects double-binding the same agent", () => {
    const m = new ArchetypeMap();
    m.bind({ agentId: "a1", archetype: "sage", rationale: "r" });
    expect(() =>
      m.bind({ agentId: "a1", archetype: "hero", rationale: "r" }),
    ).toThrow();
  });

  it("agentsFor returns all agents in an archetype", () => {
    const m = new ArchetypeMap();
    m.bind({ agentId: "a1", archetype: "sage", rationale: "r" });
    m.bind({ agentId: "a2", archetype: "sage", rationale: "r" });
    m.bind({ agentId: "a3", archetype: "hero", rationale: "r" });
    expect(m.agentsFor("sage").sort()).toEqual(["a1", "a2"]);
  });

  it("isLegible requires non-empty rationale on every binding", () => {
    const m = new ArchetypeMap();
    m.bind({ agentId: "a1", archetype: "sage", rationale: "ok" });
    expect(m.isLegible()).toBe(true);
  });

  it("size reports count", () => {
    const m = new ArchetypeMap();
    m.bind({ agentId: "a1", archetype: "sage", rationale: "r" });
    m.bind({ agentId: "a2", archetype: "hero", rationale: "r" });
    expect(m.size()).toBe(2);
  });

  it("lookup returns undefined for unknown", () => {
    const m = new ArchetypeMap();
    expect(m.lookup("missing")).toBeUndefined();
  });
});
