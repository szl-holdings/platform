import type { RunConfig, RunState, WorkflowStep, StepContext } from "./types.js";
import { RunConfigSchema, RunStateSchema } from "./types.js";
import type { CheckpointStore } from "./checkpoint.js";
import { InMemoryCheckpointStore, createCheckpoint } from "./checkpoint.js";
import type { ActionLedgerWriter } from "./types.js";
import { InMemoryActionLedger, makeLedgerEntry } from "./ledger.js";
import { GuardianDecisionEngine } from "@workspace/guardian/decision-engine";
import { InMemoryTraceStore } from "@workspace/trace-graph/store";
import { TraceWriter } from "@workspace/trace-graph/writer";

export interface RunManagerOptions {
  checkpointStore?: CheckpointStore;
  ledger?: ActionLedgerWriter;
  guardian?: GuardianDecisionEngine;
  traceWriter?: TraceWriter;
}

export class RunManager {
  private readonly runs = new Map<string, RunState>();
  private readonly checkpointStore: CheckpointStore;
  private readonly ledger: ActionLedgerWriter;
  private readonly guardian: GuardianDecisionEngine;
  private readonly traceWriter: TraceWriter;

  constructor(opts: RunManagerOptions = {}) {
    this.checkpointStore = opts.checkpointStore ?? new InMemoryCheckpointStore();
    this.ledger = opts.ledger ?? new InMemoryActionLedger();
    this.guardian = opts.guardian ?? new GuardianDecisionEngine();
    this.traceWriter = opts.traceWriter ?? new TraceWriter(new InMemoryTraceStore());
  }

  createRun(config: RunConfig): RunState {
    const parsed = RunConfigSchema.parse(config);
    const now = new Date().toISOString();
    const state = RunStateSchema.parse({
      runId: parsed.runId,
      workflowId: parsed.workflowId,
      status: "pending",
      currentStep: 0,
      startedAt: now,
      updatedAt: now,
      ledgerEntries: [],
    });
    this.runs.set(state.runId, state);
    this.ledger.record(makeLedgerEntry(state.runId, "workflow-start", `Run ${state.runId} created for workflow ${state.workflowId}`));
    return state;
  }

  getState(runId: string): RunState | undefined {
    return this.runs.get(runId);
  }

  async executeSteps(runId: string, steps: WorkflowStep[], config: RunConfig): Promise<RunState> {
    let state = this.runs.get(runId);
    if (!state) throw new Error(`Run not found: ${runId}`);

    state = { ...state, status: "running", updatedAt: new Date().toISOString() };
    this.runs.set(runId, state);

    const traceId = `run-${runId}-${Date.now()}`;
    this.traceWriter.startTrace({
      traceId,
      workflowId: config.workflowId,
      agentId: config.agentId,
      sessionId: config.sessionId,
      model: config.model,
    });

    state = { ...state, traceId };
    this.runs.set(runId, state);

    const previousResults: Array<{ stepId: string; success: boolean; output?: unknown; error?: string; latencyMs?: number }> = [];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (!step) continue;

      if (config.policyTier) {
        const decision = this.guardian.decide({
          requestId: `${runId}-step-${i}`,
          agentId: config.agentId,
          workflowId: config.workflowId,
          action: `step:${step.id}`,
          tier: config.policyTier as Parameters<GuardianDecisionEngine["decide"]>[0]["tier"],
          context: { stepId: step.id, stepIndex: i },
        });

        if (decision.outcome === "deny") {
          state = { ...state, status: "failed", error: `Guardian denied step ${step.id}: ${decision.reason}`, updatedAt: new Date().toISOString() };
          this.runs.set(runId, state);
          this.traceWriter.completeTrace(traceId, { status: "failed" });
          return state;
        }
      }

      const ctx: StepContext = {
        runId,
        workflowId: config.workflowId,
        stepIndex: i,
        previousResults,
        metadata: config.metadata,
      };

      const t0 = Date.now();
      try {
        const result = await step.execute(ctx);
        previousResults.push(result);
        const latencyMs = Date.now() - t0;

        this.traceWriter.appendSpan(traceId, {
          spanId: `span-${step.id}-${i}`,
          name: step.name,
          startedAt: new Date(Date.now() - latencyMs).toISOString(),
          endedAt: new Date().toISOString(),
          latencyMs,
          status: result.success ? "ok" : "error",
          attributes: { stepId: step.id, stepIndex: i },
        });

        state = { ...state, currentStep: i + 1, updatedAt: new Date().toISOString() };
        this.runs.set(runId, state);

        if (config.checkpointEnabled) {
          const checkpoint = createCheckpoint(state, i + 1);
          this.checkpointStore.save(checkpoint);
          state = { ...state, checkpointId: checkpoint.checkpointId };
          this.runs.set(runId, state);
          this.ledger.record(makeLedgerEntry(runId, "checkpoint", `Checkpoint saved at step ${i + 1}`, { stepId: step.id }));
        }

        if (!result.success) {
          state = { ...state, status: "failed", error: result.error, updatedAt: new Date().toISOString() };
          this.runs.set(runId, state);
          this.traceWriter.completeTrace(traceId, { status: "failed" });
          return state;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.traceWriter.recordError(traceId, "STEP_ERROR", message);
        state = { ...state, status: "failed", error: message, updatedAt: new Date().toISOString() };
        this.runs.set(runId, state);
        this.traceWriter.completeTrace(traceId, { status: "failed" });
        return state;
      }
    }

    const lastResult = previousResults[previousResults.length - 1];
    state = {
      ...state,
      status: "completed",
      output: lastResult?.output,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.runs.set(runId, state);
    this.traceWriter.completeTrace(traceId, { status: "completed" });
    this.ledger.record(makeLedgerEntry(runId, "workflow-end", `Run ${runId} completed successfully`));

    return state;
  }

  getLedgerEntries(runId: string) {
    return this.ledger.getEntries(runId);
  }
}

export const defaultRunManager = new RunManager();
