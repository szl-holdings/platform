import { GuardianDecisionEngine } from '@workspace/guardian/decision-engine';
import { InMemoryTraceStore } from '@workspace/trace-graph/store';
import { TraceWriter } from '@workspace/trace-graph/writer';
import type { CheckpointStore } from './checkpoint.js';
import { createCheckpoint, InMemoryCheckpointStore } from './checkpoint.js';
import { InMemoryActionLedger, makeLedgerEntry } from './ledger.js';
import type {
  ActionLedgerWriter,
  ApprovalGate,
  RunConfig,
  RunState,
  StepContext,
  StepResult,
  WorkflowStep,
} from './types.js';
import { RunConfigSchema, RunStateSchema } from './types.js';

export interface RunManagerOptions {
  checkpointStore?: CheckpointStore;
  ledger?: ActionLedgerWriter;
  guardian?: GuardianDecisionEngine;
  traceWriter?: TraceWriter;
  approvalGate?: ApprovalGate;
}

interface ParkedRun {
  steps: WorkflowStep[];
  config: RunConfig;
  resumeIndex: number;
  previousResults: StepResult[];
  traceId: string;
  approvedSteps: Set<string>;
}

export class RunManager {
  private readonly runs = new Map<string, RunState>();
  private readonly checkpointStore: CheckpointStore;
  private readonly ledger: ActionLedgerWriter;
  private readonly guardian: GuardianDecisionEngine;
  private readonly traceWriter: TraceWriter;
  private readonly approvalGate: ApprovalGate | undefined;
  private readonly pendingApprovals = new Map<
    string,
    { runId: string; approvalId: number | string; stepId: string }
  >();
  private readonly parked = new Map<string, ParkedRun>();

  constructor(opts: RunManagerOptions = {}) {
    this.checkpointStore = opts.checkpointStore ?? new InMemoryCheckpointStore();
    this.ledger = opts.ledger ?? new InMemoryActionLedger();
    this.guardian = opts.guardian ?? new GuardianDecisionEngine();
    this.traceWriter = opts.traceWriter ?? new TraceWriter(new InMemoryTraceStore());
    this.approvalGate = opts.approvalGate;
  }

  async recordApprovalDecision(params: {
    runId?: string;
    approvalId: number | string;
    decision: 'approved' | 'rejected' | 'revised' | 'escalated';
    actorId?: number | string | null;
    actorRole?: string;
    note?: string;
    stepId?: string;
  }): Promise<
    | { runId: string; approvalId: number | string; resumed: boolean; finalState?: RunState }
    | undefined
  > {
    const key = String(params.approvalId);
    const tracked = this.pendingApprovals.get(key);
    const runId = params.runId ?? tracked?.runId;
    if (!runId) return undefined;
    // Prefer in-memory tracking, fall back to caller-supplied stepId (e.g. read
    // from the persisted approval payload). This keeps resume working even if
    // the in-memory map was lost (process restart) so long as the parked run
    // is still hydrated.
    const stepId = tracked?.stepId ?? params.stepId;
    this.ledger.record(
      makeLedgerEntry(
        runId,
        'approval',
        `Operator ${params.decision} approval ${params.approvalId}${params.note ? `: ${params.note}` : ''}`,
        {
          ...(stepId !== undefined ? { stepId } : {}),
          metadata: {
            approvalId: params.approvalId,
            decision: params.decision,
            actorId: params.actorId ?? null,
            actorRole: params.actorRole ?? null,
            note: params.note ?? null,
          },
        },
      ),
    );

    let resumed = false;
    let finalState: RunState | undefined;
    const state = this.runs.get(runId);
    const parkedRun = this.parked.get(runId);

    if (params.decision === 'approved') {
      if (state) {
        const updated: RunState = {
          ...state,
          status: 'running',
          error: undefined,
          updatedAt: new Date().toISOString(),
        };
        this.runs.set(runId, updated);
      }
      if (parkedRun) {
        if (stepId) parkedRun.approvedSteps.add(stepId);
        this.pendingApprovals.delete(key);
        try {
          finalState = await this.runStepsFrom(runId, parkedRun);
          resumed = true;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          const failedState = this.runs.get(runId);
          if (failedState) {
            const f: RunState = {
              ...failedState,
              status: 'failed',
              error: message,
              updatedAt: new Date().toISOString(),
            };
            this.runs.set(runId, f);
            finalState = f;
          }
        }
      }
    } else if (params.decision === 'rejected') {
      if (state) {
        const updated: RunState = {
          ...state,
          status: 'failed',
          error: `Operator rejected approval ${params.approvalId}${params.note ? `: ${params.note}` : ''}`,
          updatedAt: new Date().toISOString(),
        };
        this.runs.set(runId, updated);
        finalState = updated;
      }
      if (parkedRun) {
        this.traceWriter.completeTrace(parkedRun.traceId, { status: 'failed' });
        this.parked.delete(runId);
      }
      this.pendingApprovals.delete(key);
    }
    return { runId, approvalId: params.approvalId, resumed, ...(finalState !== undefined ? { finalState } : {}) };
  }

  createRun(config: RunConfig): RunState {
    const parsed = RunConfigSchema.parse(config);
    const now = new Date().toISOString();
    const state = RunStateSchema.parse({
      runId: parsed.runId,
      workflowId: parsed.workflowId,
      status: 'pending',
      currentStep: 0,
      startedAt: now,
      updatedAt: now,
      ledgerEntries: [],
    });
    this.runs.set(state.runId, state);
    this.ledger.record(
      makeLedgerEntry(
        state.runId,
        'workflow-start',
        `Run ${state.runId} created for workflow ${state.workflowId}`,
      ),
    );
    return state;
  }

  getState(runId: string): RunState | undefined {
    return this.runs.get(runId);
  }

  async executeSteps(runId: string, steps: WorkflowStep[], config: RunConfig): Promise<RunState> {
    let state = this.runs.get(runId);
    if (!state) throw new Error(`Run not found: ${runId}`);

    state = { ...state, status: 'running', updatedAt: new Date().toISOString() };
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

    return this.runStepsFrom(runId, {
      steps,
      config,
      resumeIndex: 0,
      previousResults: [],
      traceId,
      approvedSteps: new Set<string>(),
    });
  }

  private async runStepsFrom(runId: string, parked: ParkedRun): Promise<RunState> {
    const { steps, config, previousResults, traceId, approvedSteps } = parked;
    let state = this.runs.get(runId);
    if (!state) throw new Error(`Run not found: ${runId}`);

    for (let i = parked.resumeIndex; i < steps.length; i++) {
      const step = steps[i];
      if (!step) continue;

      if (config.policyTier && !approvedSteps.has(step.id)) {
        const decision = this.guardian.decide({
          requestId: `${runId}-step-${i}`,
          agentId: config.agentId,
          workflowId: config.workflowId,
          action: `step:${step.id}`,
          tier: config.policyTier as Parameters<GuardianDecisionEngine['decide']>[0]['tier'],
          context: { stepId: step.id, stepIndex: i },
        });

        if (decision.outcome === 'deny') {
          state = {
            ...state,
            status: 'failed',
            error: `Guardian denied step ${step.id}: ${decision.reason}`,
            updatedAt: new Date().toISOString(),
          };
          this.runs.set(runId, state);
          this.traceWriter.completeTrace(traceId, { status: 'failed' });
          this.parked.delete(runId);
          return state;
        }

        if (decision.outcome === 'require-approval') {
          let approvalId: number | string | undefined;
          let gateError: string | undefined;
          if (this.approvalGate) {
            try {
              const meta = (config.metadata ?? {}) as Record<string, unknown>;
              const gateResult = await this.approvalGate.requestApproval({
                runId,
                workflowId: config.workflowId,
                ...(config.agentId !== undefined ? { agentId: config.agentId } : {}),
                stepId: step.id,
                stepIndex: i,
                reason: decision.reason,
                requiredApprovers: decision.requiredApprovers ?? [],
                ...(decision.matchedRuleId !== undefined
                  ? { matchedRuleId: decision.matchedRuleId }
                  : {}),
                ...(config.policyTier !== undefined ? { tier: config.policyTier } : {}),
                orgId: (meta['orgId'] as number | string | null | undefined) ?? null,
                requestedById: (meta['requestedById'] as number | string | null | undefined) ?? null,
                ...(typeof meta['requestedByRole'] === 'string'
                  ? { requestedByRole: meta['requestedByRole'] as string }
                  : {}),
                context: { stepId: step.id, stepIndex: i, ...meta },
              });
              approvalId = gateResult?.approvalId;
              if (approvalId !== undefined) {
                this.pendingApprovals.set(String(approvalId), {
                  runId,
                  approvalId,
                  stepId: step.id,
                });
              } else {
                gateError = 'approval gate returned no approvalId';
              }
            } catch (err) {
              gateError = err instanceof Error ? err.message : String(err);
            }
          }

          // If a gate is configured but persistence failed, fail the run
          // immediately rather than parking it invisibly to operators.
          if (this.approvalGate && (approvalId === undefined || gateError)) {
            const errMsg = `Guardian required approval for step ${step.id} but persistence failed: ${gateError ?? 'no approvalId returned'}`;
            this.ledger.record(
              makeLedgerEntry(runId, 'approval', errMsg, {
                stepId: step.id,
                metadata: {
                  matchedRuleId: decision.matchedRuleId ?? null,
                  tier: config.policyTier ?? null,
                },
              }),
            );
            state = {
              ...state,
              status: 'failed',
              error: errMsg,
              updatedAt: new Date().toISOString(),
            };
            this.runs.set(runId, state);
            this.traceWriter.completeTrace(traceId, { status: 'failed' });
            this.parked.delete(runId);
            return state;
          }

          // Park the run so it can be resumed when an operator approves.
          this.parked.set(runId, {
            steps,
            config,
            resumeIndex: i,
            previousResults,
            traceId,
            approvedSteps,
          });
          state = {
            ...state,
            status: 'awaiting-approval',
            error: `Guardian requires approval for step ${step.id}: ${decision.reason}`,
            updatedAt: new Date().toISOString(),
          };
          this.runs.set(runId, state);
          this.ledger.record(
            makeLedgerEntry(
              runId,
              'approval',
              `Approval required for step ${step.id}: ${decision.reason}`,
              {
                stepId: step.id,
                metadata: {
                  approvalId: approvalId ?? null,
                  matchedRuleId: decision.matchedRuleId ?? null,
                  tier: config.policyTier ?? null,
                },
              },
            ),
          );
          return state;
        }
      } else if (approvedSteps.has(step.id)) {
        this.ledger.record(
          makeLedgerEntry(runId, 'approval', `Resuming step ${step.id} under operator approval`, {
            stepId: step.id,
          }),
        );
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
          status: result.success ? 'ok' : 'error',
          attributes: { stepId: step.id, stepIndex: i },
        });

        state = { ...state, currentStep: i + 1, updatedAt: new Date().toISOString() };
        this.runs.set(runId, state);

        if (config.checkpointEnabled) {
          const checkpoint = createCheckpoint(state, i + 1);
          this.checkpointStore.save(checkpoint);
          state = { ...state, checkpointId: checkpoint.checkpointId };
          this.runs.set(runId, state);
          this.ledger.record(
            makeLedgerEntry(runId, 'checkpoint', `Checkpoint saved at step ${i + 1}`, {
              stepId: step.id,
            }),
          );
        }

        if (!result.success) {
          state = {
            ...state,
            status: 'failed',
            error: result.error,
            updatedAt: new Date().toISOString(),
          };
          this.runs.set(runId, state);
          this.traceWriter.completeTrace(traceId, { status: 'failed' });
          this.parked.delete(runId);
          return state;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.traceWriter.recordError(traceId, 'STEP_ERROR', message);
        state = { ...state, status: 'failed', error: message, updatedAt: new Date().toISOString() };
        this.runs.set(runId, state);
        this.traceWriter.completeTrace(traceId, { status: 'failed' });
        this.parked.delete(runId);
        return state;
      }
    }

    const lastResult = previousResults[previousResults.length - 1];
    state = {
      ...state,
      status: 'completed',
      output: lastResult?.output,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.runs.set(runId, state);
    this.traceWriter.completeTrace(traceId, { status: 'completed' });
    this.ledger.record(
      makeLedgerEntry(runId, 'workflow-end', `Run ${runId} completed successfully`),
    );
    this.parked.delete(runId);

    return state;
  }

  getLedgerEntries(runId: string) {
    return this.ledger.getEntries(runId);
  }
}

export const defaultRunManager = new RunManager();
