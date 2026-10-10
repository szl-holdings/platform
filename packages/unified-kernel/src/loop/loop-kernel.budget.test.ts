/**
 * Step-budget contract for the vendored Ouroboros kernel.
 *
 * Donor semantics: szl-holdings/ouroboros src/loop-kernel.ts at
 * 0f030741f567bdf397d33c4d607790af6ed39688, exercised through the parent
 * loop export. The donor fire-and-forget receipt sink is not part of this
 * contract. These cases are the contract:
 *
 * - An omitted budget, null, undefined, a non-finite number, or a non-number
 *   fails closed to 8 iterations. Numeric strings are not coerced.
 * - A finite number is floored and then clamped to at least 0.
 * - Zero, a negative number, a negative fraction, and signed zero run no
 *   steps and report maxSteps 0.
 * - An ordinary finite integer is unchanged and is also the exact iteration
 *   limit when the step does not converge.
 * - The parent step() helper uses the same ceiling.
 * - runLoop does not call fetch.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { runLoop as exportedRunLoop, step } from "./index.ts";
import { runLoop as vendoredRunLoop } from "./vendor_ouroboros/loop-kernel.ts";

const neverConverges = {
  step: (state: number) => ({ state: state + 1, output: state + 1 }),
  delta: (left: number, right: number) => Math.abs(left - right),
};

async function exhaust(maxSteps: unknown) {
  return exportedRunLoop<number, number>({
    initialState: 0,
    ...neverConverges,
    config: { maxSteps: maxSteps as number, label: "budget-contract" },
  });
}

describe("vendored ouroboros step budget", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("exports the vendored runLoop from the parent loop package", () => {
    expect(exportedRunLoop).toBe(vendoredRunLoop);
  });

  it("fails closed to 8 when the budget is omitted", async () => {
    const trace = await exportedRunLoop<number, number>({
      initialState: 0,
      ...neverConverges,
    });
    expect(trace.maxSteps).toBe(8);
    expect(trace.stepsRun).toBe(8);
    expect(trace.exitReason).toBe("budgetExhausted");
    expect(trace.finalState).toBe(8);
  });

  it.each([
    ["undefined", undefined],
    ["null", null],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
    ["-Infinity", Number.NEGATIVE_INFINITY],
    ["numeric string", "5"],
    ["boolean", true],
    ["object", { maxSteps: 1 }],
    ["bigint", 4n],
  ])("fails closed to 8 for %s", async (_label, value) => {
    const trace = await exhaust(value);
    expect(trace.maxSteps).toBe(8);
    expect(trace.stepsRun).toBe(8);
    expect(trace.exitReason).toBe("budgetExhausted");
  });

  it("floors a positive fraction and stops on that exact ceiling", async () => {
    const trace = await exhaust(3.9);
    expect(trace.maxSteps).toBe(3);
    expect(trace.stepsRun).toBe(3);
    expect(trace.steps.map((item) => item.index)).toEqual([0, 1, 2]);
    expect(trace.finalState).toBe(3);
    expect(trace.exitReason).toBe("budgetExhausted");
  });

  it.each([
    ["negative", -5],
    ["negative fraction", -1.2],
    ["zero", 0],
    ["signed zero", -0],
    ["positive fraction below 1", 0.9],
  ])("reports 0 and runs nothing for %s", async (_label, value) => {
    const trace = await exhaust(value);
    expect(trace.maxSteps).toBe(0);
    expect(Object.is(trace.maxSteps, -0)).toBe(false);
    expect(trace.stepsRun).toBe(0);
    expect(trace.steps).toEqual([]);
    expect(trace.finalState).toBe(0);
    expect(trace.exitReason).toBe("budgetExhausted");
  });

  it.each([1, 5])("keeps ordinary budget %s as an exact iteration limit", async (budget) => {
    const trace = await exhaust(budget);
    expect(trace.maxSteps).toBe(budget);
    expect(trace.stepsRun).toBe(budget);
    expect(trace.finalState).toBe(budget);
    expect(trace.exitReason).toBe("budgetExhausted");
  });

  it("still converges inside an ordinary finite budget", async () => {
    const trace = await exportedRunLoop<{ x: number }, number>({
      initialState: { x: 1 },
      step: (state) => ({ state: { x: state.x / 2 }, output: state.x / 2 }),
      delta: (left, right) => Math.abs(left.x - right.x),
      config: { maxSteps: 12, convergenceThreshold: 1e-3 },
    });
    expect(trace.maxSteps).toBe(12);
    expect(trace.exitReason).toBe("converged");
    expect(trace.stepsRun).toBeGreaterThan(0);
    expect(trace.stepsRun).toBeLessThan(12);
  });

  it("applies the same ceiling through the parent step helper", async () => {
    const trace = await step<number>(
      0,
      (state) => ({ state: state + 1, output: state + 1 }),
      (left, right) => Math.abs(left - right),
      3.9,
    );
    expect(trace.maxSteps).toBe(3);
    expect(trace.stepsRun).toBe(3);
    expect(trace.exitReason).toBe("budgetExhausted");
  });

  it("does not call fetch", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const trace = await exhaust(2);
    expect(trace.stepsRun).toBe(2);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
