import { randomUUID } from "crypto";
import {
  RunLedgerEntrySchema,
  type RunLedgerEntry,
  type LedgerToolCall,
  type LedgerSource,
  type LedgerApprovalEvent,
  type LedgerPolicyOutcome,
  type LedgerEvalScore,
  type LedgerStageTiming,
  type QualityGateResult,
} from "@szl-holdings/contracts/governance";

// ─── Store ───────────────────────────────────────────────────────────────────

export interface RunLedgerStore {
  save(entry: RunLedgerEntry): void;
  get(ledgerId: string): RunLedgerEntry | undefined;
  getByRunId(runId: string): RunLedgerEntry | undefined;
  getByTraceId(traceId: string): RunLedgerEntry[];
  list(filter?: {
    tenantId?: string;
    gateStatus?: RunLedgerEntry["gateStatus"];
    limit?: number;
    offset?: number;
  }): RunLedgerEntry[];
  count(): number;
}

export class InMemoryRunLedgerStore implements RunLedgerStore {
  private readonly entries = new Map<string, RunLedgerEntry>();
  private readonly byRunId = new Map<string, string>();
  private readonly byTraceId = new Map<string, Set<string>>();

  save(entry: RunLedgerEntry): void {
    this.entries.set(entry.ledgerId, entry);
    this.byRunId.set(entry.runId, entry.ledgerId);
    if (entry.traceId) {
      const set = this.byTraceId.get(entry.traceId) ?? new Set();
      set.add(entry.ledgerId);
      this.byTraceId.set(entry.traceId, set);
    }
  }

  get(ledgerId: string): RunLedgerEntry | undefined {
    return this.entries.get(ledgerId);
  }

  getByRunId(runId: string): RunLedgerEntry | undefined {
    const id = this.byRunId.get(runId);
    return id ? this.entries.get(id) : undefined;
  }

  getByTraceId(traceId: string): RunLedgerEntry[] {
    const ids = this.byTraceId.get(traceId) ?? new Set();
    return Array.from(ids).flatMap((id) => {
      const e = this.entries.get(id);
      return e ? [e] : [];
    });
  }

  list(filter?: {
    tenantId?: string;
    gateStatus?: RunLedgerEntry["gateStatus"];
    limit?: number;
    offset?: number;
  }): RunLedgerEntry[] {
    let all = Array.from(this.entries.values()).sort(
      (a, b) => b.createdAt - a.createdAt,
    );
    if (filter?.tenantId) all = all.filter((e) => e.tenantId === filter.tenantId);
    if (filter?.gateStatus) all = all.filter((e) => e.gateStatus === filter.gateStatus);
    const offset = filter?.offset ?? 0;
    const limit = filter?.limit ?? 50;
    return all.slice(offset, offset + limit);
  }

  count(): number {
    return this.entries.size;
  }
}

export class MutableRunLedgerStore implements RunLedgerStore {
  private backend: RunLedgerStore;

  constructor(initial: RunLedgerStore = new InMemoryRunLedgerStore()) {
    this.backend = initial;
  }

  setBackend(store: RunLedgerStore): void {
    this.backend = store;
  }

  getBackend(): RunLedgerStore {
    return this.backend;
  }

  save(entry: RunLedgerEntry): void { this.backend.save(entry); }
  get(ledgerId: string): RunLedgerEntry | undefined { return this.backend.get(ledgerId); }
  getByRunId(runId: string): RunLedgerEntry | undefined { return this.backend.getByRunId(runId); }
  getByTraceId(traceId: string): RunLedgerEntry[] { return this.backend.getByTraceId(traceId); }
  list(filter?: Parameters<RunLedgerStore["list"]>[0]): RunLedgerEntry[] { return this.backend.list(filter); }
  count(): number { return this.backend.count(); }
}

export const defaultRunLedgerStore = new MutableRunLedgerStore();

// ─── Builder ─────────────────────────────────────────────────────────────────

export interface RunLedgerInitOptions {
  runId: string;
  requestId?: string;
  traceId?: string;
  tenantId?: string;
  actor?: string;
  profileId?: string;
  objective: string;
}

export class RunLedgerBuilder {
  private readonly ledgerId: string;
  private readonly runId: string;
  private readonly requestId: string;
  private readonly traceId?: string;
  private readonly tenantId?: string;
  private readonly actor?: string;
  private readonly profileId?: string;
  private readonly objective: string;
  private readonly startedAt: number;
  private readonly createdAt: number;

  private planSummary?: string;
  private planStepCount = 0;
  private readonly sources: LedgerSource[] = [];
  private readonly toolCalls: LedgerToolCall[] = [];
  private readonly approvalEvents: LedgerApprovalEvent[] = [];
  private readonly policyOutcomes: LedgerPolicyOutcome[] = [];
  private readonly finalArtifacts: string[] = [];
  private readonly evalScores: LedgerEvalScore[] = [];
  private readonly stageTimings: LedgerStageTiming[] = [];

  constructor(opts: RunLedgerInitOptions) {
    this.ledgerId = randomUUID();
    this.runId = opts.runId;
    this.requestId = opts.requestId ?? opts.runId;
    if (opts.traceId !== undefined) this.traceId = opts.traceId;
    if (opts.tenantId !== undefined) this.tenantId = opts.tenantId;
    if (opts.actor !== undefined) this.actor = opts.actor;
    if (opts.profileId !== undefined) this.profileId = opts.profileId;
    this.objective = opts.objective;
    this.startedAt = Date.now();
    this.createdAt = this.startedAt;
  }

  setPlan(summary: string, stepCount: number): this {
    this.planSummary = summary;
    this.planStepCount = stepCount;
    return this;
  }

  addSource(source: LedgerSource): this {
    this.sources.push(source);
    return this;
  }

  addToolCall(call: LedgerToolCall): this {
    this.toolCalls.push(call);
    return this;
  }

  addApprovalEvent(event: LedgerApprovalEvent): this {
    this.approvalEvents.push(event);
    return this;
  }

  addPolicyOutcome(outcome: LedgerPolicyOutcome): this {
    this.policyOutcomes.push(outcome);
    return this;
  }

  addFinalArtifact(artifact: string): this {
    this.finalArtifacts.push(artifact);
    return this;
  }

  addEvalScore(score: LedgerEvalScore): this {
    this.evalScores.push(score);
    return this;
  }

  addStageTiming(timing: LedgerStageTiming): this {
    this.stageTimings.push(timing);
    return this;
  }

  build(gateResult?: QualityGateResult): RunLedgerEntry {
    const completedAt = Date.now();
    return RunLedgerEntrySchema.parse({
      ledgerId: this.ledgerId,
      requestId: this.requestId,
      runId: this.runId,
      traceId: this.traceId,
      tenantId: this.tenantId,
      actor: this.actor,
      profileId: this.profileId,
      objective: this.objective,
      planSummary: this.planSummary,
      planStepCount: this.planStepCount,
      sourcesConsulted: this.sources,
      toolCalls: this.toolCalls,
      approvalEvents: this.approvalEvents,
      policyOutcomes: this.policyOutcomes,
      finalArtifacts: this.finalArtifacts,
      evalScores: this.evalScores,
      stageTimings: this.stageTimings,
      startedAt: this.startedAt,
      completedAt,
      totalDurationMs: completedAt - this.startedAt,
      gateStatus: gateResult?.status ?? "pending",
      gateResult,
      createdAt: this.createdAt,
    });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Build a RunLedgerEntry from a completed cognitive loop run. Callers that
 * want finer-grained control should use RunLedgerBuilder directly.
 */
export function buildLedgerFromRun(opts: {
  runId: string;
  traceId?: string;
  tenantId?: string;
  actor?: string;
  objective: string;
  planStepCount?: number;
  phases?: Array<{ phase: string; startedAt: number; durationMs?: number }>;
  stepResults?: Array<{
    stepId: string;
    toolId?: string;
    durationMs?: number;
    status: string;
    error?: string;
  }>;
  approvalEvents?: LedgerApprovalEvent[];
  policyOutcomes?: LedgerPolicyOutcome[];
  evalScores?: LedgerEvalScore[];
  gateResult?: QualityGateResult;
}): RunLedgerEntry {
  const initOpts: RunLedgerInitOptions = { runId: opts.runId, objective: opts.objective };
  if (opts.traceId !== undefined) initOpts.traceId = opts.traceId;
  if (opts.tenantId !== undefined) initOpts.tenantId = opts.tenantId;
  if (opts.actor !== undefined) initOpts.actor = opts.actor;
  const builder = new RunLedgerBuilder(initOpts);

  builder.setPlan(opts.objective.slice(0, 200), opts.planStepCount ?? 0);

  for (const phase of opts.phases ?? []) {
    builder.addStageTiming({
      phase: phase.phase,
      startedAt: phase.startedAt,
      durationMs: phase.durationMs ?? 0,
    });
  }

  for (const step of opts.stepResults ?? []) {
    builder.addToolCall({
      toolId: step.toolId ?? "default",
      stepId: step.stepId,
      latencyMs: step.durationMs ?? 0,
      outcome:
        step.status === "completed"
          ? "success"
          : step.status === "skipped"
          ? "skipped"
          : "failure",
      error: step.error,
    });
  }

  for (const event of opts.approvalEvents ?? []) {
    builder.addApprovalEvent(event);
  }

  for (const outcome of opts.policyOutcomes ?? []) {
    builder.addPolicyOutcome(outcome);
  }

  for (const score of opts.evalScores ?? []) {
    builder.addEvalScore(score);
  }

  return builder.build(opts.gateResult);
}
