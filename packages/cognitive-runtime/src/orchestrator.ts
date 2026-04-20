import { randomUUID } from "crypto";
import { TraceWriter, defaultTraceStore } from "@workspace/trace-graph";
import type { TraceStore } from "@workspace/trace-graph";
import { defaultMemoryStore } from "@workspace/memory-fabric";
import type { MemoryStore } from "@workspace/memory-fabric";
import { defaultSelfModelStore } from "@workspace/self-model";
import type { SelfModelStore } from "@workspace/self-model";
import { globalCollector } from "@workspace/cognitive-observability";
import { AgentRun, type RunStatus as AgentRunStatus } from "@workspace/agents-core/run";
import { emitStepLog } from "@workspace/agents-core/step-log";
import { extractApprovalInterrupt, raiseApprovalInterrupt } from "./approval-interrupt.js";
import { RunLedgerBuilder, defaultRunLedgerStore } from "@workspace/run-ledger";
import { evaluateQualityGate, type QualityGateProfile } from "@workspace/run-ledger/quality-gate";

import {
  CognitiveContextSchema,
  type CognitiveContext,
  type CognitiveLoopRun,
  type PhaseResult,
  CognitiveLoopError,
} from "./types.js";
import {
  defaultCheckpointStore,
  loadCheckpoint,
  saveCheckpoint,
  type CheckpointStore,
} from "./checkpoint.js";

import { perceivePhase } from "./phases/perceive.js";
import type { PerceiveInput } from "./types.js";
import { orientPhase } from "./phases/orient.js";
import type { OrientOutput } from "./phases/orient.js";
import { planPhase, type PlanRevisionContext } from "./phases/plan.js";
import { executePhase, GuardianDecisionEngine, type StepExecutorFn } from "./phases/execute.js";
import type { ExecutePhaseOutput } from "./phases/execute.js";
import { verifyPhase } from "./phases/verify.js";
import type { VerifyPhaseOutput } from "./phases/verify.js";
import { reflectPhase } from "./phases/reflect.js";
import type { ReflectPhaseOutput } from "./phases/reflect.js";
import { updateSelfModelPhase, updateMemoryPhase } from "./phases/update.js";
import type { UpdatePhaseOptions } from "./phases/update.js";
import type { PlanGraph } from "@workspace/planner";

export interface CognitiveRuntimeOptions {
  traceStore?: TraceStore;
  memoryStore?: MemoryStore;
  selfModelStore?: SelfModelStore;
  checkpointStore?: CheckpointStore;
  guardian?: GuardianDecisionEngine;
  stepExecutor?: StepExecutorFn;
  onPhaseComplete?: (phase: string, result: PhaseResult) => void | Promise<void>;
}

export interface RunResult {
  run: CognitiveLoopRun;
  success: boolean;
  summary: string;
}

export async function run(
  objective: string,
  context: CognitiveContext = {},
  options: CognitiveRuntimeOptions = {},
): Promise<RunResult> {
  const ctx = CognitiveContextSchema.parse(context);
  const runId = randomUUID();
  const traceId = ctx.traceId ?? randomUUID();
  const traceStore = options.traceStore ?? defaultTraceStore;
  const memoryStore: MemoryStore = (options.memoryStore ?? defaultMemoryStore) as MemoryStore;
  const selfModelStore = options.selfModelStore ?? defaultSelfModelStore;
  const checkpointStore = options.checkpointStore ?? defaultCheckpointStore;
  const guardian = options.guardian ?? new GuardianDecisionEngine();

  const traceWriter = new TraceWriter(traceStore);
  const globalStartedAt = Date.now();

  // ─── AgentRun (agents-core) ─────────────────────────────────────────────────
  // Use the agents-core AgentRun primitive to drive the run-level lifecycle
  // (status transitions, structured step-log emission, observability counters)
  // instead of managing those concerns ad-hoc in this orchestrator.
  const agentRunOptions: ConstructorParameters<typeof AgentRun>[1] = {
    runId,
    agentId: ctx.agentId,
    surface: "cognitive-runtime",
    metadata: { sessionId: ctx.sessionId, traceId, ...ctx.metadata },
  };
  if (ctx.domain !== undefined) {
    agentRunOptions.domain = ctx.domain;
  }
  const agentRun = new AgentRun(objective, agentRunOptions);

  function mapToAgentRunStatus(status: CognitiveLoopRun["status"]): AgentRunStatus {
    switch (status) {
      case "running": return "running";
      case "pending_approval": return "pending_approval";
      case "completed": return "completed";
      case "failed": return "failed";
      case "guardian_blocked": return "failed";
      default: return "idle";
    }
  }

  const loopRun: CognitiveLoopRun = {
    runId,
    objective,
    context: ctx,
    status: "running",
    currentPhase: "perceive",
    phases: [],
    startedAt: globalStartedAt,
    traceId,
    stepResults: [],
    verifyRevisions: 0,
    planRevisions: 0,
    memoryIds: [],
    metadata: ctx.metadata,
  };

  traceWriter.startTrace({
    traceId,
    runId,
    sessionId: ctx.sessionId,
    agentId: ctx.agentId,
    objective,
  });

  // Drive AgentRun lifecycle (status -> running, emits run.start step-log entry)
  void agentRun.start();

  globalCollector.recordKnown("token_count", 0, { agentId: ctx.agentId, phase: "start" });

  function recordPhase(result: PhaseResult): void {
    loopRun.phases.push(result);
    traceWriter.appendSpan(traceId, {
      spanId: randomUUID(),
      name: result.phase,
      startedAt: new Date(result.startedAt).toISOString(),
      endedAt: result.completedAt
        ? new Date(result.completedAt).toISOString()
        : new Date().toISOString(),
      status: result.status === "ok" || result.status === "skipped" ? "ok" : "error",
      attributes: { ...result.metadata, phase: result.phase, durationMs: result.durationMs },
    });

    // Emit a structured StepLogEntry into agents-core/step-log for every phase.
    // The Lyte Run Console reads these records via the agents API to render
    // the live step log instead of raw trace spans.
    void emitStepLog({
      runId,
      stepId: `phase:${result.phase}`,
      stepName: result.phase,
      level: result.status === "error" ? "error" : "info",
      message:
        result.status === "error"
          ? `Phase '${result.phase}' failed: ${result.error ?? "unknown error"}`
          : `Phase '${result.phase}' ${result.status} in ${result.durationMs}ms`,
      durationMs: result.durationMs,
      data: {
        phase: result.phase,
        status: result.status,
        ...(result.metadata ?? {}),
      },
      otelTraceId: traceId,
    });

    if (options.onPhaseComplete) {
      void Promise.resolve(options.onPhaseComplete(result.phase, result));
    }
  }

  function syncRunStatus(): void {
    // Mirror loopRun.status -> AgentRun via lifecycle calls. start() was already
    // invoked above; only complete/fail need to be relayed.
    const target = mapToAgentRunStatus(loopRun.status);
    if (target === "completed" && agentRun.status !== "completed") {
      void agentRun.complete(`Cognitive loop ${loopRun.status} (phases: ${loopRun.phases.length})`);
    } else if ((target === "failed") && agentRun.status !== "failed") {
      void agentRun.fail(loopRun.error ?? new Error(`Cognitive loop status: ${loopRun.status}`));
    }
  }

  function makeUpdateOpts(durationMs: number): UpdatePhaseOptions {
    return {
      agentId: ctx.agentId,
      runId,
      traceId,
      domain: ctx.domain,
      selfModelStore,
      memoryStore,
      durationMs,
      objective,
    };
  }

  // Guaranteed finalization — always runs update_self_model + update_memory
  async function finalize(
    execOut: ExecutePhaseOutput | null,
    verifyOut: VerifyPhaseOutput | undefined,
    reflectOut: ReflectPhaseOutput | undefined,
  ): Promise<void> {
    const emptyExec = execOut ?? {
      stepResults: [],
      completedSteps: 0,
      failedSteps: 0,
      blockedSteps: 0,
      totalDurationMs: 0,
      summary: "No execution output",
      output: undefined,
    };
    const durationMs = Date.now() - globalStartedAt;
    const opts = makeUpdateOpts(durationMs);

    try {
      // Phase 7: UPDATE SELF MODEL
      loopRun.currentPhase = "update_self_model";
      const selfModelResult = await updateSelfModelPhase(emptyExec, verifyOut, reflectOut, opts);
      recordPhase(selfModelResult);
      loopRun.selfModelVersion = selfModelResult.output.selfModelVersion;

      // Phase 8: UPDATE MEMORY
      loopRun.currentPhase = "update_memory";
      const memoryResult = await updateMemoryPhase(emptyExec, verifyOut, reflectOut, opts);
      recordPhase(memoryResult);
      loopRun.memoryIds.push(...memoryResult.output.memoryIdsWritten);
    } catch {
      // finalization must not throw — swallow silently
    }
  }

  let resumedPlan: PlanGraph | undefined;
  let resumeFromStepIndex = 0;

  if (ctx.resumeFromCheckpoint) {
    try {
      const ckpt = loadCheckpoint(ctx.resumeFromCheckpoint, checkpointStore);
      loopRun.phases = [...ckpt.snapshot.phases];
      loopRun.stepResults = [...ckpt.snapshot.stepResults];
      loopRun.planId = ckpt.snapshot.planId;
      loopRun.worldModelUpdate = ckpt.snapshot.worldModelUpdate;
      loopRun.memoryIds = [...ckpt.snapshot.memoryIds];
      resumeFromStepIndex = ckpt.stepIndex + 1;

      const planPhaseResult = ckpt.snapshot.phases.find((p) => p.phase === "plan");
      if (planPhaseResult?.output) {
        resumedPlan = (planPhaseResult.output as { plan?: PlanGraph }).plan;
      }
    } catch {
      // start fresh if checkpoint not found
    }
  }

  let lastExecuteOutput: ExecutePhaseOutput | null = null;
  let lastVerifyOutput: VerifyPhaseOutput | undefined;
  let lastReflectOutput: ReflectPhaseOutput | undefined;
  let orientOutput: OrientOutput | undefined;

  try {
    let plan: PlanGraph | undefined = resumedPlan;

    if (!resumedPlan) {
      // ─── PHASE 1: PERCEIVE ─────────────────────────────────────────────────
      loopRun.currentPhase = "perceive";
      const perceptInput: PerceiveInput = ctx.perceiveInput ?? {
        rawSignals: [],
        priority: "normal",
      };

      const perceptResult = await perceivePhase(perceptInput, {
        memoryStore,
        traceId,
        agentId: ctx.agentId,
        sessionId: ctx.sessionId,
        scopeId: ctx.tenantId,
      });
      recordPhase(perceptResult);
      loopRun.memoryIds.push(...perceptResult.output.storedMemoryIds);

      // ─── PHASE 2: ORIENT ───────────────────────────────────────────────────
      loopRun.currentPhase = "orient";
      const orientResult = await orientPhase(perceptResult.output, {
        memoryStore,
        traceId,
        agentId: ctx.agentId,
        objective,
        domain: ctx.domain,
      });
      recordPhase(orientResult);
      loopRun.worldModelUpdate = orientResult.output.worldModelUpdate;
      orientOutput = orientResult.output;

      // ─── PHASE 3: PLAN (initial) ───────────────────────────────────────────
      loopRun.currentPhase = "plan";
      const planResult = await planPhase(objective, orientResult.output, {
        agentId: ctx.agentId,
        sessionId: ctx.sessionId,
        traceId,
        agentTier: ctx.agentTier,
        domain: ctx.domain,
        maxRetries: ctx.maxRetries,
        maxBudgetUsd: ctx.maxBudgetUsd,
        preferredProvider: ctx.preferredProvider,
        preferredModel: ctx.preferredModel,
        promptVersionId: ctx.promptVersionId,
      });
      recordPhase(planResult);

      if (planResult.status === "error") {
        throw new CognitiveLoopError(
          planResult.error ?? "Plan creation failed",
          "plan",
          runId,
        );
      }

      loopRun.planId = planResult.output!.planId;
      plan = planResult.output!.plan;

      traceWriter.setPlanGraph(traceId, {
        nodes: plan.steps.map((s) => ({
          nodeId: s.stepId,
          label: s.title,
          nodeType: "task" as const,
          status: "pending" as const,
          dependsOn: s.dependsOn,
          metadata: { riskLevel: s.riskLevel, routeClass: s.route.routeClass },
        })),
        edges: plan.steps.flatMap((s) =>
          s.dependsOn.map((dep) => ({ from: dep, to: s.stepId })),
        ),
        version: "1.0",
        createdAt: new Date().toISOString(),
      });
    }

    if (!plan) {
      throw new CognitiveLoopError("No plan available — cannot execute", "plan", runId);
    }

    // ─── Enforce incoming approval decision BEFORE any execution ─────────────
    // If this run was resumed after an operator decision and the verdict is
    // deny or escalate, terminate immediately — no further steps may execute.
    // This check MUST occur before the execute-phase loop to prevent side
    // effects leaking past a governed denial.
    const incomingDecision = ctx.metadata?.approvalDecision as
      | { verdict: string; actor?: string; reason?: string; decisionId?: string }
      | undefined;
    if (incomingDecision && (incomingDecision.verdict === "deny" || incomingDecision.verdict === "escalate")) {
      loopRun.status = "failed";
      loopRun.currentPhase = "failed";
      loopRun.error =
        `Approval ${incomingDecision.verdict}ed by ${incomingDecision.actor ?? "operator"}: ` +
        (incomingDecision.reason ?? "no reason given");
      tryCompleteTrace(traceWriter, traceId, "error", loopRun.error);
      syncRunStatus();
      await finalize(lastExecuteOutput, undefined, undefined);
      return terminalResult(loopRun, globalStartedAt, false, loopRun.error);
    }

    // ─── PHASES 4→6 LOOP: EXECUTE → VERIFY → REFLECT → REPLAN ───────────────
    // Bounded by maxVerifyRevisions + 1 total attempts (spec requirement).
    const maxIterations = ctx.maxVerifyRevisions + 1;

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const isFirstIteration = iteration === 0;

      // ─── PHASE 4: EXECUTE ──────────────────────────────────────────────────
      loopRun.currentPhase = "execute";
      const executeResult = await executePhase(plan, {
        ctx,
        guardian,
        stepExecutor: options.stepExecutor,
        checkpointStore,
        run: loopRun,
        resumeFromStepIndex: isFirstIteration ? resumeFromStepIndex : 0,
      });
      recordPhase(executeResult);
      lastExecuteOutput = executeResult.output;
      loopRun.stepResults = [...loopRun.stepResults, ...executeResult.output.stepResults];

      // ─── GOVERNED APPROVAL INTERRUPT detection ────────────────────────────
      // Scan newly completed step outputs for an __approvalInterrupt spec.
      // First interrupt found takes precedence — persist a real checkpoint
      // via saveCheckpoint() (not a fabricated ref) so resume is deterministic.
      for (const stepResult of executeResult.output.stepResults) {
        const interruptSpec = extractApprovalInterrupt(stepResult.output);
        if (interruptSpec) {
          // stepResults already updated above — the interrupted step is last
          const interruptedStepIndex = loopRun.stepResults.length - 1;
          const checkpointRef = saveCheckpoint(loopRun, interruptedStepIndex, checkpointStore);
          const approvalRequest = raiseApprovalInterrupt({
            runId,
            traceId,
            stepId: stepResult.stepId,
            stepName: stepResult.stepId,
            checkpointRef,
            interrupt: interruptSpec,
          });
          loopRun.metadata = {
            ...(loopRun.metadata ?? {}),
            pendingApproval: true,
            approvalRequestId: approvalRequest.id,
            checkpointRef,
          };
          break;
        }
      }

      // Pending approval — hard gate, must not progress (security requirement)
      // (deny/escalate decisions are enforced before the loop; this path handles
      //  newly detected interrupts and the existing guardian pending_approval.)
      const isPendingApproval =
        loopRun.metadata?.pendingApproval === true ||
        executeResult.metadata?.pendingApproval === true;
      if (isPendingApproval) {
        loopRun.status = "pending_approval";
        loopRun.currentPhase = "guardian_blocked";
        loopRun.error = executeResult.error;
        tryCompleteTrace(traceWriter, traceId, "error", loopRun.error);
        syncRunStatus();
        await finalize(lastExecuteOutput, undefined, undefined);
        return terminalResult(loopRun, globalStartedAt, false,
          `Run halted — step requires human approval: ${loopRun.error}`);
      }

      // Guardian block (hard deny) — terminal
      if (executeResult.status === "blocked") {
        loopRun.status = "guardian_blocked";
        loopRun.currentPhase = "guardian_blocked";
        loopRun.error = executeResult.error;
        tryCompleteTrace(traceWriter, traceId, "error", loopRun.error);
        syncRunStatus();
        await finalize(lastExecuteOutput, undefined, undefined);
        return terminalResult(loopRun, globalStartedAt, false,
          `Run blocked by guardian: ${loopRun.error}`);
      }

      loopRun.output = executeResult.output.output;

      // ─── PHASE 5: VERIFY ───────────────────────────────────────────────────
      if (!ctx.verifierEnabled || executeResult.output.stepResults.length === 0) {
        // No steps attempted or verification disabled — exit loop
        break;
      }

      loopRun.currentPhase = "verify";
      const verifyResult = await verifyPhase(executeResult.output, {
        traceId,
        planId: loopRun.planId,
        domain: ctx.domain,
        maxRevisions: ctx.maxVerifyRevisions,
        currentRevision: iteration,
      });
      recordPhase(verifyResult);
      lastVerifyOutput = verifyResult.output;
      loopRun.verifyRevisions = iteration;

      // Hard verifier block — terminal failure
      if (verifyResult.status === "blocked") {
        loopRun.status = "failed";
        loopRun.currentPhase = "failed";
        loopRun.error = verifyResult.error;
        tryCompleteTrace(traceWriter, traceId, "error", loopRun.error);
        syncRunStatus();

        if (ctx.reflectionEnabled) {
          // ─── PHASE 6: REFLECT (on failure) ───────────────────────────────
          loopRun.currentPhase = "reflect";
          const reflectResult = await reflectPhase({ traceId, traceStore, memoryStore });
          recordPhase(reflectResult);
          loopRun.reflectionId = reflectResult.output.reflectionId;
          lastReflectOutput = reflectResult.output;
        }

        await finalize(lastExecuteOutput, lastVerifyOutput, lastReflectOutput);
        return terminalResult(loopRun, globalStartedAt, false,
          `Run failed — verifier block: ${loopRun.error}`);
      }

      // Passed → exit loop
      if (verifyResult.output.passed) {
        break;
      }

      // Revision requested — reflect and replan if budget allows
      if (verifyResult.output.needsRevision && iteration < maxIterations - 1 && orientOutput) {
        // ─── PHASE 6: REFLECT (mid-loop revision) ─────────────────────────
        loopRun.currentPhase = "reflect";
        const reflectResult = await reflectPhase({ traceId, traceStore, memoryStore });
        recordPhase(reflectResult);
        loopRun.reflectionId = reflectResult.output.reflectionId;
        lastReflectOutput = reflectResult.output;

        // ─── PHASE 3 (REVISION): REPLAN with feedback ─────────────────────
        loopRun.currentPhase = "plan";
        const revisionCtx: PlanRevisionContext = {
          revision: iteration + 1,
          verifierFindings: verifyResult.output.reasoning.slice(0, 300),
          reflectionLesson: reflectResult.output.lesson.slice(0, 300),
        };
        const replanResult = await planPhase(objective, orientOutput, {
          agentId: ctx.agentId,
          sessionId: ctx.sessionId,
          traceId,
          agentTier: ctx.agentTier,
          domain: ctx.domain,
          maxRetries: ctx.maxRetries,
          maxBudgetUsd: ctx.maxBudgetUsd,
          preferredProvider: ctx.preferredProvider,
          preferredModel: ctx.preferredModel,
          promptVersionId: ctx.promptVersionId,
          revisionContext: revisionCtx,
        });
        recordPhase(replanResult);
        loopRun.planRevisions = (loopRun.planRevisions ?? 0) + 1;

        if (replanResult.status === "error" || !replanResult.output) {
          break; // Can't replan — stop and exit with current output
        }

        loopRun.planId = replanResult.output.planId;
        plan = replanResult.output.plan;
        loopRun.stepResults = []; // Clear accumulated steps for fresh re-execution
        continue;
      }

      // No revision budget or no revision needed — exit loop
      break;
    }

    // ─── VERIFIER GATE: fail run if budget exhausted without approval ────────
    // If the last verify result was not approved and we've run out of revision
    // budget, the run must not complete successfully.
    if (
      lastVerifyOutput &&
      !lastVerifyOutput.passed &&
      lastVerifyOutput.action !== "approve"
    ) {
      loopRun.status = "failed";
      loopRun.currentPhase = "failed";
      loopRun.error =
        `Verifier did not approve after ${loopRun.verifyRevisions + 1} attempt(s): ` +
        `${lastVerifyOutput.reasoning.slice(0, 200)}`;
      tryCompleteTrace(traceWriter, traceId, "error", loopRun.error);
      syncRunStatus();

      if (ctx.reflectionEnabled && !lastReflectOutput) {
        loopRun.currentPhase = "reflect";
        const reflectResult = await reflectPhase({ traceId, traceStore, memoryStore });
        recordPhase(reflectResult);
        loopRun.reflectionId = reflectResult.output.reflectionId;
        lastReflectOutput = reflectResult.output;
      }

      await finalize(lastExecuteOutput, lastVerifyOutput, lastReflectOutput);
      return terminalResult(loopRun, globalStartedAt, false,
        `Run failed — verifier budget exhausted: ${loopRun.error}`);
    }

    // ─── PHASE 6: REFLECT (final, if not already done mid-loop) ──────────────
    const traceStatus: "ok" | "error" =
      (lastExecuteOutput?.failedSteps ?? 0) > 0 ? "error" : "ok";
    tryCompleteTrace(
      traceWriter,
      traceId,
      traceStatus,
      lastExecuteOutput && lastExecuteOutput.failedSteps > 0
        ? `${lastExecuteOutput.failedSteps} step(s) failed`
        : undefined,
    );

    if (ctx.reflectionEnabled && !lastReflectOutput) {
      loopRun.currentPhase = "reflect";
      const reflectResult = await reflectPhase({ traceId, traceStore, memoryStore });
      recordPhase(reflectResult);
      loopRun.reflectionId = reflectResult.output.reflectionId;
      lastReflectOutput = reflectResult.output;
    }

    // ─── PHASES 7 + 8: UPDATE SELF MODEL → UPDATE MEMORY ─────────────────────
    await finalize(lastExecuteOutput, lastVerifyOutput, lastReflectOutput);

    // ─── COMPLETE ─────────────────────────────────────────────────────────────
    loopRun.currentPhase = "complete";
    loopRun.status = "completed";
    const completedAt = Date.now();
    loopRun.completedAt = completedAt;
    loopRun.durationMs = completedAt - globalStartedAt;

    // ─── QUALITY GATE + RUN LEDGER ────────────────────────────────────────────
    // Build a ledger entry from the completed run data and evaluate quality gates.
    // If the gate is "blocked" the run is demoted to "failed" so downstream
    // consumers know not to act on the output. The ledger entry is written to
    // the process-local store (swappable to Postgres via setBackend).
    //
    // Gate profile is derived from agentTier + domain to ensure autonomous
    // agents are held to stricter completion/latency standards.
    const gateProfileOverride: Partial<QualityGateProfile> = (() => {
      switch (ctx.agentTier) {
        case "autonomous":
          return { completionThreshold: 0.8, toolFailureRateThreshold: 0.2 };
        case "operator":
          return { completionThreshold: 0.7, toolFailureRateThreshold: 0.3 };
        case "analyst":
          return { completionThreshold: 0.6, toolFailureRateThreshold: 0.4 };
        default:
          return {};
      }
    })();
    try {
      const ledgerBuilder = new RunLedgerBuilder({
        runId,
        traceId,
        ...(ctx.tenantId !== undefined && { tenantId: ctx.tenantId }),
        ...(ctx.agentId !== undefined && { actor: ctx.agentId }),
        objective,
      });

      ledgerBuilder.setPlan(objective.slice(0, 200), lastExecuteOutput?.stepResults.length ?? 0);

      for (const phase of loopRun.phases) {
        ledgerBuilder.addStageTiming({
          phase: phase.phase,
          startedAt: phase.startedAt,
          durationMs: phase.durationMs ?? 0,
        });
      }

      for (const stepResult of (lastExecuteOutput?.stepResults ?? [])) {
        ledgerBuilder.addToolCall({
          toolId: stepResult.toolId ?? "default",
          stepId: stepResult.stepId,
          latencyMs: stepResult.durationMs ?? 0,
          outcome:
            stepResult.status === "completed" ? "success" :
            stepResult.status === "skipped" ? "skipped" : "failure",
          ...(stepResult.error !== undefined && { error: stepResult.error }),
        });
      }

      // Evaluate quality gate against partial ledger using the tier/domain profile
      const partialEntry = ledgerBuilder.build();
      const gateResult = evaluateQualityGate(partialEntry, gateProfileOverride);

      // Persist the final ledger entry with gate result
      const finalEntry = ledgerBuilder.build(gateResult);
      defaultRunLedgerStore.save(finalEntry);

      // Surface gate status in run metadata
      loopRun.metadata = {
        ...(loopRun.metadata ?? {}),
        gateStatus: gateResult.status,
        ledgerId: finalEntry.ledgerId,
      };

      // A run is only marked "completed" when ALL quality gates pass.
      // Both "blocked" and "degraded" outcomes are terminal failures — the
      // caller must not treat the output as consumable in either case.
      if (gateResult.status === "blocked") {
        loopRun.status = "failed";
        loopRun.error =
          `Quality gate blocked: ${gateResult.failingGates.map((g) => g.gate).join(", ")}. ` +
          gateResult.recommendedNextAction;
      } else if (gateResult.status === "degraded") {
        loopRun.status = "failed";
        loopRun.error =
          `Quality gate degraded — run did not meet completion criteria: ` +
          `${gateResult.failingGates.map((g) => g.gate).join(", ")}. ` +
          gateResult.recommendedNextAction;
      }
    } catch {
      // Quality gate + ledger must not fail the run — swallow errors
    }

    syncRunStatus();

    globalCollector.recordKnown(
      "agent_reliability_score",
      (lastExecuteOutput?.failedSteps ?? 0) === 0 ? 1 : 0,
      { agentId: ctx.agentId, runId },
    );

    const gateStatus = (loopRun.metadata?.gateStatus as string | undefined) ?? "pending";
    return {
      run: loopRun,
      success: loopRun.status === "completed",
      summary:
        `Cognitive loop ${loopRun.status} in ${loopRun.durationMs}ms. ` +
        `Phases: ${loopRun.phases.map((p) => p.phase).join(" → ")}. ` +
        `Plan revisions: ${loopRun.planRevisions}. Verify revisions: ${loopRun.verifyRevisions}. ` +
        `Gate: ${gateStatus}.`,
    };
  } catch (err) {
    const completedAt = Date.now();
    loopRun.status = "failed";
    loopRun.currentPhase = "failed";
    loopRun.completedAt = completedAt;
    loopRun.durationMs = completedAt - globalStartedAt;
    loopRun.error = err instanceof Error ? err.message : String(err);

    tryCompleteTrace(traceWriter, traceId, "error", loopRun.error);
    syncRunStatus();

    // Guaranteed finalization even on unexpected errors
    await finalize(lastExecuteOutput, lastVerifyOutput, lastReflectOutput);

    globalCollector.recordKnown("agent_reliability_score", 0, { agentId: ctx.agentId, runId });

    return {
      run: loopRun,
      success: false,
      summary: `Cognitive loop failed at phase '${loopRun.currentPhase}': ${loopRun.error}`,
    };
  }
}

function terminalResult(
  loopRun: CognitiveLoopRun,
  globalStartedAt: number,
  success: boolean,
  summary: string,
): RunResult {
  const completedAt = Date.now();
  loopRun.completedAt = completedAt;
  loopRun.durationMs = completedAt - globalStartedAt;
  return { run: loopRun, success, summary };
}

function tryCompleteTrace(
  writer: TraceWriter,
  traceId: string,
  status: "ok" | "error",
  error?: string,
): void {
  try {
    writer.completeTrace(traceId, {
      status: status === "ok" ? "completed" : "failed",
    });
    if (error) {
      writer.recordError(traceId, "cognitive_runtime_error", error);
    }
  } catch {
    // ignore — trace may not have been persisted
  }
}

