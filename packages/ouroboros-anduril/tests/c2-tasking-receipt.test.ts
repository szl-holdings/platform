import { describe, it, expect } from "vitest";
import { evaluateTask, stdRefusals, type Task, type TaskContext } from "../src/c2-tasking-receipt.js";

const ctx = (over: Partial<TaskContext> = {}): TaskContext => ({
  battery: 0.9,
  withinAuthority: true,
  rulesOfEngagement: ["roe-1"],
  collateralRiskScore: 0.1,
  ...over,
});

const task = (over: Partial<Task> = {}): Task => ({
  id: "t1",
  kind: "move",
  target: "alpha",
  authorityChain: ["issuer", "supervisor"],
  refusalConditions: [...stdRefusals],
  ...over,
});

describe("C2 tasking receipt", () => {
  it("accepts when all conditions pass", () => {
    expect(evaluateTask(task(), ctx()).accepted).toBe(true);
  });

  it("refuses on low battery", () => {
    const r = evaluateTask(task(), ctx({ battery: 0.05 }));
    expect(r.accepted).toBe(false);
    expect(r.refusedBy).toContain("low-battery");
  });

  it("refuses on out-of-authority", () => {
    const r = evaluateTask(task(), ctx({ withinAuthority: false }));
    expect(r.accepted).toBe(false);
    expect(r.refusedBy).toContain("out-of-authority");
  });

  it("refuses on high collateral risk", () => {
    const r = evaluateTask(task(), ctx({ collateralRiskScore: 0.95 }));
    expect(r.accepted).toBe(false);
    expect(r.refusedBy).toContain("high-collateral-risk");
  });

  it("refuses with empty authority chain", () => {
    const r = evaluateTask(task({ authorityChain: [] }), ctx());
    expect(r.accepted).toBe(false);
    expect(r.reason).toMatch(/authority chain/);
  });

  it("reports all firing refusal conditions", () => {
    const r = evaluateTask(task(), ctx({ battery: 0.05, withinAuthority: false }));
    expect(r.refusedBy.length).toBeGreaterThanOrEqual(2);
  });

  it("custom refusal condition fires", () => {
    const t = task({
      refusalConditions: [
        {
          id: "test-condition",
          describe: "always refuse",
          predicate: () => true,
        },
      ],
    });
    expect(evaluateTask(t, ctx()).refusedBy).toContain("test-condition");
  });

  it("reason text describes refusal cause", () => {
    const r = evaluateTask(task(), ctx({ battery: 0.05 }));
    expect(r.reason).toContain("battery");
  });

  it("reason text on accept names success", () => {
    expect(evaluateTask(task(), ctx()).reason).toMatch(/all refusal/);
  });
});
