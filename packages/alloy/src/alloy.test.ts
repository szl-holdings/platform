import { describe, it, expect, beforeEach } from "vitest";
import { RunConfigSchema, RunStateSchema } from "./types.js";
import { InMemoryCheckpointStore, createCheckpoint } from "./checkpoint.js";
import { DefaultModelRouter } from "./model-router.js";
import { InMemoryActionLedger, makeLedgerEntry } from "./ledger.js";
import { RunManager } from "./run-manager.js";
import { ECHO_STEP, VALIDATE_STEP, runReferenceWorkflow } from "./workflow.js";
import type { WorkflowStep, StepContext } from "./types.js";

function makeConfig(overrides: Partial<Parameters<typeof RunConfigSchema.parse>[0]> = {}) {
  return RunConfigSchema.parse({
    runId: `run-${Date.now()}`,
    workflowId: "test-wf",
    checkpointEnabled: false,
    ...overrides,
  });
}

describe("RunConfigSchema", () => {
  it("parses config with defaults", () => {
    const config = makeConfig();
    expect(config.maxSteps).toBe(50);
    expect(config.checkpointEnabled).toBe(false);
  });
});

describe("RunStateSchema", () => {
  it("parses state with defaults", () => {
    const now = new Date().toISOString();
    const state = RunStateSchema.parse({ runId: "r1", workflowId: "wf1", startedAt: now, updatedAt: now });
    expect(state.status).toBe("pending");
    expect(state.currentStep).toBe(0);
  });
});

describe("InMemoryCheckpointStore", () => {
  it("saves and retrieves checkpoints", () => {
    const store = new InMemoryCheckpointStore();
    const now = new Date().toISOString();
    const state = RunStateSchema.parse({ runId: "r1", workflowId: "wf1", startedAt: now, updatedAt: now });
    const cp = createCheckpoint(state, 1);
    store.save(cp);
    expect(store.get(cp.checkpointId)).toBeDefined();
    expect(store.latest("r1")).toBeDefined();
  });

  it("lists and returns latest checkpoint", () => {
    const store = new InMemoryCheckpointStore();
    const now = new Date().toISOString();
    const state = RunStateSchema.parse({ runId: "r1", workflowId: "wf1", startedAt: now, updatedAt: now });
    store.save(createCheckpoint(state, 1));
    store.save(createCheckpoint(state, 2));
    expect(store.listByRun("r1")).toHaveLength(2);
    expect(store.latest("r1")?.stepIndex).toBe(2);
  });
});

describe("DefaultModelRouter", () => {
  const router = new DefaultModelRouter();

  it("returns preferred model when specified", () => {
    expect(router.selectModel({ preferredModel: "claude-3-haiku" })).toBe("claude-3-haiku");
  });

  it("selects a model within latency budget", () => {
    const model = router.selectModel({ latencyBudgetMs: 400 });
    expect(["gpt-4o-mini", "claude-3-haiku"]).toContain(model);
  });

  it("always returns a model even with impossible constraints", () => {
    const model = router.selectModel({ latencyBudgetMs: 1, maxCostUsd: 0.000000001 });
    expect(typeof model).toBe("string");
  });
});

describe("InMemoryActionLedger", () => {
  it("records and retrieves entries by runId", () => {
    const ledger = new InMemoryActionLedger();
    ledger.record(makeLedgerEntry("r1", "workflow-start", "Started"));
    ledger.record(makeLedgerEntry("r1", "checkpoint", "Checkpoint saved"));
    ledger.record(makeLedgerEntry("r2", "workflow-start", "Other run"));
    expect(ledger.getEntries("r1")).toHaveLength(2);
    expect(ledger.getEntries("r2")).toHaveLength(1);
  });
});

describe("RunManager", () => {
  let manager: RunManager;

  beforeEach(() => {
    manager = new RunManager();
  });

  it("creates a run in pending status", () => {
    const config = makeConfig();
    const state = manager.createRun(config);
    expect(state.status).toBe("pending");
    expect(manager.getState(config.runId)).toBeDefined();
  });

  it("executes steps and returns completed state", async () => {
    const config = makeConfig({ metadata: { input: "hello" } });
    manager.createRun(config);
    const state = await manager.executeSteps(config.runId, [ECHO_STEP], config);
    expect(state.status).toBe("completed");
    expect(state.currentStep).toBe(1);
  });

  it("records ledger entries for workflow lifecycle", async () => {
    const config = makeConfig();
    manager.createRun(config);
    await manager.executeSteps(config.runId, [ECHO_STEP], config);
    const entries = manager.getLedgerEntries(config.runId);
    expect(entries.some((e) => e.type === "workflow-start")).toBe(true);
    expect(entries.some((e) => e.type === "workflow-end")).toBe(true);
  });

  it("handles step failures gracefully", async () => {
    const failingStep: WorkflowStep = {
      id: "fail",
      name: "Failing Step",
      async execute(_ctx: StepContext): Promise<{ stepId: string; success: boolean; error: string; latencyMs: number }> {
        return { stepId: "fail", success: false, error: "Intentional failure", latencyMs: 0 };
      },
    };
    const config = makeConfig();
    manager.createRun(config);
    const state = await manager.executeSteps(config.runId, [failingStep], config);
    expect(state.status).toBe("failed");
    expect(state.error).toContain("Intentional failure");
  });

  it("saves checkpoints when enabled", async () => {
    const config = makeConfig({ checkpointEnabled: true });
    manager.createRun(config);
    const state = await manager.executeSteps(config.runId, [ECHO_STEP], config);
    expect(state.checkpointId).toBeDefined();
  });
});

describe("Reference workflow (ECHO + VALIDATE)", () => {
  it("runs end-to-end and completes successfully", async () => {
    const result = await runReferenceWorkflow("test input");
    expect(result.status).toBe("completed");
    expect(result.output).toBeDefined();
    expect(result.ledgerEntries.length).toBeGreaterThan(0);
  });
});
