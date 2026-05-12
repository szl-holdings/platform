import { describe, it, expect } from "vitest";
import { checkAuthority, promote, type AgentState } from "../src/autonomy-authority-ladder.js";

const agent = (level: 0 | 1 | 2 | 3 | 4 | 5 = 2): AgentState => ({
  agentId: "a1",
  currentLevel: level,
  promotionLedger: [],
});

describe("autonomy authority ladder", () => {
  it("permits when level sufficient and reversible", () => {
    const v = checkAuthority({ id: "a", description: "move", requiredLevel: 2, reversible: true }, agent(3));
    expect(v.permitted).toBe(true);
  });

  it("refuses when below required level", () => {
    const v = checkAuthority({ id: "a", description: "move", requiredLevel: 4, reversible: true }, agent(2));
    expect(v.permitted).toBe(false);
    expect(v.reason).toMatch(/level 2 < required 4/);
  });

  it("refuses irreversible high-level action without confirm", () => {
    const v = checkAuthority({ id: "a", description: "fire", requiredLevel: 4, reversible: false }, agent(5));
    expect(v.permitted).toBe(false);
    expect(v.reason).toMatch(/irreversible/);
  });

  it("permits reversible high-level action", () => {
    const v = checkAuthority({ id: "a", description: "scan", requiredLevel: 5, reversible: true }, agent(5));
    expect(v.permitted).toBe(true);
  });

  it("permits irreversible low-level action", () => {
    const v = checkAuthority({ id: "a", description: "blink", requiredLevel: 1, reversible: false }, agent(1));
    expect(v.permitted).toBe(true);
  });

  it("promote raises level", () => {
    const a = agent(1);
    const next = promote(a, 3, "commander", "t1", "tactical need");
    expect(next.currentLevel).toBe(3);
  });

  it("promote ledgers the change", () => {
    const a = agent(1);
    const next = promote(a, 3, "commander", "t1", "tactical need");
    expect(next.promotionLedger).toHaveLength(1);
    expect(next.promotionLedger[0].fromLevel).toBe(1);
    expect(next.promotionLedger[0].toLevel).toBe(3);
    expect(next.promotionLedger[0].authorizedBy).toBe("commander");
  });

  it("promote without named authority throws", () => {
    expect(() => promote(agent(1), 2, "", "t", "r")).toThrow(/named authority/);
  });

  it("ledger preserves history across promotions", () => {
    let a = agent(1);
    a = promote(a, 2, "x", "t1", "step1");
    a = promote(a, 4, "y", "t2", "step2");
    expect(a.promotionLedger).toHaveLength(2);
    expect(a.currentLevel).toBe(4);
  });

  it("agent at level 0 refuses level 1 action", () => {
    const v = checkAuthority({ id: "a", description: "x", requiredLevel: 1, reversible: true }, agent(0));
    expect(v.permitted).toBe(false);
  });

  it("equal-level action permitted", () => {
    const v = checkAuthority({ id: "a", description: "x", requiredLevel: 3, reversible: true }, agent(3));
    expect(v.permitted).toBe(true);
  });
});
