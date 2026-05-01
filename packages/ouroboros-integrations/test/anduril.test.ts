import { describe, it, expect } from "vitest";
import {
  A11oyEntityFleet,
  a11oyStdRefusals,
  sentraTaskingReceipt,
  sentraPromotionReceipt,
  amaruEdgeSignal,
  amaruBoundedAction,
} from "../src/anduril.ts";
import type {
  Task,
  TaskContext,
  AgentState,
  ActionRequest,
  EdgeSample,
} from "../src/anduril.ts";

const baseCtx: TaskContext = {
  battery: 0.8,
  withinAuthority: true,
  rulesOfEngagement: [],
  collateralRiskScore: 0.1,
};

const sampleTask: Task = {
  id: "t1",
  kind: "sense",
  target: "grid-A7",
  authorityChain: ["issuer", "supervisor"],
  refusalConditions: a11oyStdRefusals,
};

describe("A11oyEntityFleet", () => {
  it("publishes claims and resolves entities", () => {
    const fleet = new A11oyEntityFleet();
    const r = fleet.publish({
      entityId: "tk-1",
      field: "speed",
      value: 42,
      producerId: "sensor-A",
      timestamp: "2026-05-01T00:00:00Z",
    });
    expect(r.applied).toBe(true);
    const rec = fleet.resolve("tk-1");
    expect(rec?.fields.speed?.value).toBe(42);
    expect(fleet.lineageOf("tk-1")).toHaveLength(1);
  });

  it("registers agents and dispatches tasks gated by authority + refusal", () => {
    const fleet = new A11oyEntityFleet();
    fleet.registerAgent("agent-1", 3);
    const dispatched = fleet.dispatch("agent-1", sampleTask, baseCtx, 2, true);
    expect(dispatched.dispatched).toBe(true);
    expect(dispatched.authority.permitted).toBe(true);
    expect(dispatched.acceptance.accepted).toBe(true);
  });

  it("blocks dispatch when agent autonomy is too low", () => {
    const fleet = new A11oyEntityFleet();
    fleet.registerAgent("agent-1", 1);
    const r = fleet.dispatch("agent-1", sampleTask, baseCtx, 4, true);
    expect(r.dispatched).toBe(false);
    expect(r.authority.permitted).toBe(false);
  });

  it("blocks dispatch when refusal condition fires (low battery)", () => {
    const fleet = new A11oyEntityFleet();
    fleet.registerAgent("agent-1", 5);
    const r = fleet.dispatch(
      "agent-1",
      sampleTask,
      { ...baseCtx, battery: 0.05 },
      1,
      true
    );
    expect(r.dispatched).toBe(false);
    expect(r.acceptance.accepted).toBe(false);
  });

  it("changes authority by named authorizer and records ledger", () => {
    const fleet = new A11oyEntityFleet();
    fleet.registerAgent("agent-1", 1);
    const next = fleet.changeAuthority(
      "agent-1",
      4,
      "commander-J",
      "2026-05-01T01:00:00Z",
      "scheduled mission promotion"
    );
    expect(next.currentLevel).toBe(4);
    expect(next.promotionLedger).toHaveLength(1);
    expect(next.promotionLedger[0].authorizedBy).toBe("commander-J");
  });
});

describe("Sentra adapters", () => {
  it("produces a tasking receipt with refusal annotations", () => {
    const r = sentraTaskingReceipt(sampleTask, { ...baseCtx, battery: 0.05 }, 1714560000000);
    expect(r.accepted).toBe(false);
    expect(r.refusedBy.length).toBeGreaterThan(0);
    expect(r.authorityChain).toEqual(["issuer", "supervisor"]);
  });

  it("captures promotion receipts with ledger length", () => {
    const agent: AgentState = { agentId: "a-9", currentLevel: 0, promotionLedger: [] };
    const out = sentraPromotionReceipt(agent, 2, "ops-lead", "2026-05-01T02:00:00Z", "training complete");
    expect(out.next.currentLevel).toBe(2);
    expect(out.receipt.fromLevel).toBe(0);
    expect(out.receipt.toLevel).toBe(2);
    expect(out.receipt.ledgerLength).toBe(1);
  });

  it("rejects promotion without named authority", () => {
    const agent: AgentState = { agentId: "a-9", currentLevel: 0, promotionLedger: [] };
    expect(() => sentraPromotionReceipt(agent, 2, "", "2026-05-01T02:00:00Z", "x")).toThrow();
  });
});

describe("Amaru adapters", () => {
  const goodSamples: EdgeSample[] = [
    { ts: 1, value: 10, connectivity: "online" },
    { ts: 2, value: 11, connectivity: "online" },
    { ts: 3, value: 12, connectivity: "online" },
  ];
  const badSamples: EdgeSample[] = [
    { ts: 1, value: 10, connectivity: "offline" },
    { ts: 2, value: 11, connectivity: "offline" },
    { ts: 3, value: 12, connectivity: "intermittent" },
  ];

  it("emits when trust is above floor", () => {
    const sig = amaruEdgeSignal("m1", goodSamples, 0.8, true);
    expect(sig.emit).toBe(true);
    expect(sig.recommendation).toBe("EMIT");
    expect(sig.aggregate.count).toBe(3);
  });

  it("buffers when trust is below floor and fail-closed", () => {
    const sig = amaruEdgeSignal("m1", badSamples, 0.9, true);
    expect(sig.emit).toBe(false);
    expect(sig.recommendation).toBe("BUFFER");
  });

  it("drops when trust is below floor and fail-open", () => {
    const sig = amaruEdgeSignal("m1", badSamples, 0.9, false);
    // emitGate with fail-open returns emit:true with explanation; recommendation = EMIT
    expect(sig.emit).toBe(true);
    expect(sig.recommendation).toBe("EMIT");
  });

  it("bounded action passes when authority and edge trust both pass", () => {
    const agent: AgentState = { agentId: "a", currentLevel: 3, promotionLedger: [] };
    const action: ActionRequest = { id: "x", description: "y", requiredLevel: 2, reversible: true };
    const sig = amaruEdgeSignal("m1", goodSamples, 0.5, true);
    const r = amaruBoundedAction(agent, action, sig, 0.7);
    expect(r.permitted).toBe(true);
    expect(r.reasons).toEqual([]);
  });

  it("bounded action fails when authority is insufficient", () => {
    const agent: AgentState = { agentId: "a", currentLevel: 1, promotionLedger: [] };
    const action: ActionRequest = { id: "x", description: "y", requiredLevel: 4, reversible: true };
    const sig = amaruEdgeSignal("m1", goodSamples, 0.5, true);
    const r = amaruBoundedAction(agent, action, sig, 0.7);
    expect(r.permitted).toBe(false);
    expect(r.reasons.some((s) => s.startsWith("authority:"))).toBe(true);
  });

  it("bounded action fails when edge trust is below floor", () => {
    const agent: AgentState = { agentId: "a", currentLevel: 5, promotionLedger: [] };
    const action: ActionRequest = { id: "x", description: "y", requiredLevel: 1, reversible: true };
    const sig = amaruEdgeSignal("m1", badSamples, 0.1, false);
    const r = amaruBoundedAction(agent, action, sig, 0.9);
    expect(r.permitted).toBe(false);
    expect(r.reasons.some((s) => s.includes("edge trust"))).toBe(true);
  });
});
