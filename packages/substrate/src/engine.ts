/**
 * @szl/substrate — Execution Engine
 *
 * Walks the compiled graph, invokes stages, fires the full hook set,
 * enforces timeouts and retries, and routes through the confidence-budget
 * router. Resumes cleanly after restart by reading the journal.
 *
 * Modes:
 *   live          — real execution against real adapters
 *   dry-run       — executes the compiled graph but skips side effects
 *   replay        — re-runs a past run from journal; skips completed stages
 *   counterfactual — replay with model/policy substitution; produces diff
 */

import { submitApprovalAction } from '@workspace/approvals-inbox';
import { randomUUID } from 'node:crypto';
import { modelAdapterRegistry, policyAdapterRegistry, toolAdapterRegistry } from './adapters.js';
import {
  aggregatePipelineConfidence,
  routeByBudget,
  validateFinalConfidence,
} from './budget-router.js';
import { compile } from './compiler.js';
import {
  defaultJournal,
  defaultRunStore,
  emitStageStart,
  type RunStore,
  type SubstrateJournal,
} from './journal.js';
import { defaultPythonWorkerChannel } from './python-worker.js';
import { SubstrateTelemetry } from './telemetry.js';
import type {
  AnyStage,
  CompiledGraph,
  EvidenceBundle,
  PipelineRun,
  RuntimeStartOptions,
  StageExecutorFn,
  StageResult,
  SubstrateHooks,
  WorkflowDefinition,
} from './types.js';

// ─── Workflow Registry ────────────────────────────────────────────────────────
//
// Workflows are registered here when start() is called so that resume() can
// look up the definition to continue execution after an approval gate.
// In production this would be backed by a persistent store.

const workflowRegistry = new Map<string, WorkflowDefinition>();

export function registerWorkflow(workflow: WorkflowDefinition): void {
  workflowRegistry.set(workflow.id, workflow);
}

export function lookupWorkflow(workflowId: string): WorkflowDefinition | undefined {
  return workflowRegistry.get(workflowId);
}

export function listWorkflows(): WorkflowDefinition[] {
  return [...workflowRegistry.values()];
}

/**
 * Test-only: remove every workflow definition from the in-memory registry.
 * Used by gateway/runtime tests that need to exercise the "no workflows
 * registered" failure path. Production code should never call this.
 */
export function clearWorkflowRegistry(): void {
  workflowRegistry.clear();
}

// ─── Default Stage Executor ───────────────────────────────────────────────────
//
// The default executor routes to the registered adapters based on stage type.
// Callers can override with a custom StageExecutorFn for testing or specialised
// routing.

/**
 * Non-live modes (dry-run, replay, counterfactual) must never execute real
 * side-effecting operations. This constant is used to gate all mutating stage types.
 */
function isNonLiveMode(mode: string): boolean {
  return mode !== 'live';
}

const defaultStageExecutor: StageExecutorFn = async (stage, input, ctx) => {
  const mode = ctx.mode;
  const _isDryRun = mode === 'dry-run';

  switch (stage.type) {
    case 'Reason': {
      // Counterfactual substitution: use overridden adapter when provided
      const adapterId = ctx.counterfactualModelAdapterId ?? stage.modelAdapterId;
      const adapter =
        modelAdapterRegistry.get(adapterId) ?? modelAdapterRegistry.getOrThrow('default');
      const result = await adapter.infer({
        prompt: typeof input === 'string' ? input : JSON.stringify(input),
        context: {
          stageId: stage.id,
          workflowId: ctx.workflowId,
          mode,
          counterfactual: !!ctx.counterfactualModelAdapterId,
        },
      });
      return { output: result.content, confidence: result.confidence };
    }

    case 'Retrieve': {
      // Python-runtime stages are dispatched to the Python worker channel.
      // In live mode, dispatch fails closed (throws) if the worker is unreachable —
      // a simulated fallback must never be used for governed live decisions.
      if (stage.runtime === 'python') {
        const result = await defaultPythonWorkerChannel.dispatch(
          {
            runId: ctx.runId,
            workflowId: ctx.workflowId,
            stageId: stage.id,
            stageType: stage.type,
            stageConfig: {
              retrieverAdapterId: stage.retrieverAdapterId,
              topK: stage.topK,
              minRelevanceScore: stage.minRelevanceScore,
            },
            input,
            budgetConfig: {
              escalateAt: ctx.budget.escalateAt,
              requireHumanBelow: ctx.budget.requireHumanBelow,
            },
            traceId: ctx.runId,
            mode: ctx.mode,
          },
          stage.timeoutMs > 0 ? stage.timeoutMs : 60_000,
        );
        return { output: result.output, confidence: result.confidence };
      }
      // TypeScript-runtime: use registered retriever adapter
      const { retrieverAdapterRegistry } = await import('./adapters.js');
      const adapter =
        retrieverAdapterRegistry.get(stage.retrieverAdapterId) ??
        retrieverAdapterRegistry.getOrThrow('default');
      const docs = await adapter.retrieve({
        query: typeof input === 'string' ? input : JSON.stringify(input),
        topK: stage.topK,
        minRelevanceScore: stage.minRelevanceScore,
      });
      const confidence =
        docs.length > 0 ? docs.reduce((sum, d) => sum + d.relevanceScore, 0) / docs.length : 0;
      return { output: docs, confidence };
    }

    case 'ToolCall': {
      // GOVERNANCE: Side-effecting tool calls are suppressed in all non-live modes.
      // replay/counterfactual runs must never mutate production state.
      if (isNonLiveMode(mode)) {
        return {
          output: {
            suppressed: true,
            toolId: stage.toolId,
            args: input,
            mode,
            reason: 'non-live mode',
          },
          confidence: 0.9,
        };
      }
      const adapter =
        toolAdapterRegistry.get('tool-mesh') ?? toolAdapterRegistry.getOrThrow('default');
      const result = await adapter.execute({ toolId: stage.toolId, args: input }, ctx);
      return { output: result.result, confidence: 0.85 };
    }

    case 'Verify': {
      // Counterfactual substitution: use overridden adapter when provided
      const adapterId = ctx.counterfactualModelAdapterId ?? stage.modelAdapterId;
      const adapter =
        modelAdapterRegistry.get(adapterId) ??
        modelAdapterRegistry.get('verifier') ??
        modelAdapterRegistry.getOrThrow('default');
      const result = await adapter.infer({
        prompt: `Verify the following output meets quality and accuracy requirements:\n${JSON.stringify(input)}`,
        systemPrompt:
          'You are a verification agent. Assess whether the provided output is accurate, complete, and meets policy requirements. Respond with confidence score 0-1 and reasoning.',
        context: {
          stageId: stage.id,
          workflowId: ctx.workflowId,
          mode,
          counterfactual: !!ctx.counterfactualModelAdapterId,
        },
      });
      const confidence = result.confidence;
      const passed = confidence >= stage.minConfidence;
      return {
        output: {
          passed,
          confidence,
          reasoning: result.content,
          verifiedAt: new Date().toISOString(),
        },
        confidence,
      };
    }

    case 'Decide': {
      // Counterfactual substitution: use overridden adapter when provided
      const adapterId = ctx.counterfactualModelAdapterId ?? stage.modelAdapterId;
      const adapter =
        modelAdapterRegistry.get(adapterId) ?? modelAdapterRegistry.getOrThrow('default');
      const result = await adapter.infer({
        prompt: `Based on the following evidence, make a decision:\n${JSON.stringify(input)}`,
        systemPrompt:
          'You are a decision agent. Analyze the evidence and produce a clear, actionable decision with confidence score 0-1.',
        context: {
          stageId: stage.id,
          workflowId: ctx.workflowId,
          mode,
          counterfactual: !!ctx.counterfactualModelAdapterId,
        },
      });
      return {
        output: {
          decision: result.content,
          confidence: result.confidence,
          decidedAt: new Date().toISOString(),
        },
        confidence: result.confidence,
      };
    }

    case 'ApprovalGate': {
      // ApprovalGate is handled separately by the engine; the executor is not called
      return { output: { approved: true, gatePassed: true }, confidence: 1 };
    }

    case 'Sandbox': {
      // Sandbox stages are routed to the sandbox runtime for governed execution.
      // In non-live modes, side effects are suppressed to prevent mutation of
      // production state — the result carries a suppressed marker for replay/counterfactual.
      if (isNonLiveMode(mode)) {
        return {
          output: {
            suppressed: true,
            objective: stage.objective,
            sessionId: stage.sessionId,
            mode,
            reason: 'non-live mode',
          },
          confidence: 0.9,
        };
      }

      // Dynamic import to avoid hard-coupling the substrate to the sandbox runtime
      // unless a Sandbox stage actually appears in the workflow. This preserves
      // tree-shaking for workflows that never use sandbox stages.
      const { defaultSandboxClient, ManifestSchema } = await import('@workspace/sandbox-runtime');
      const manifest = ManifestSchema.parse(stage.manifest ?? { entries: [] });

      const tenantId = stage.tenantId ?? 'system';

      let sessionId = stage.sessionId;
      // Pass tenantId to getSession — prevents cross-tenant session reuse
      // if stage.sessionId originated from a different workflow or tenant.
      let session = sessionId ? defaultSandboxClient.getSession(sessionId, tenantId) : undefined;

      if (!session) {
        session = await defaultSandboxClient.createSession(manifest, tenantId);
        sessionId = session.sessionId;
      }

      const result = await defaultSandboxClient.runAgent(sessionId!, stage.objective, {
        shellTimeoutMs: stage.shellTimeoutMs,
        domain: 'substrate',
      }, tenantId);

      return {
        output: result,
        confidence: result.status === 'completed' ? 0.9 : 0.3,
      };
    }

    default: {
      // Exhaustiveness check — never typechecks if all cases are handled
      const _exhaustive: never = stage;
      throw new Error(`Unknown stage type: ${(_exhaustive as AnyStage).type}`);
    }
  }
};

// ─── Engine ───────────────────────────────────────────────────────────────────

export interface SubstrateRuntimeOptions {
  hooks?: SubstrateHooks;
  stageExecutor?: StageExecutorFn;
  journal?: SubstrateJournal;
  runStore?: RunStore;
}

export class SubstrateRuntime {
  private readonly hooks: SubstrateHooks;
  private readonly stageExecutor: StageExecutorFn;
  private readonly journal: SubstrateJournal;
  private readonly runStore: RunStore;

  constructor(opts: SubstrateRuntimeOptions = {}) {
    this.hooks = opts.hooks ?? {};
    this.stageExecutor = opts.stageExecutor ?? defaultStageExecutor;
    this.journal = opts.journal ?? defaultJournal;
    this.runStore = opts.runStore ?? defaultRunStore;
  }

  // ─── Main Entry Point ───────────────────────────────────────────────────────

  async start(
    workflow: WorkflowDefinition,
    input: unknown,
    options: Partial<RuntimeStartOptions> = {},
  ): Promise<PipelineRun> {
    const opts = {
      mode: 'live' as const,
      replayDiffOnly: false,
      metadata: {},
      ...options,
    } satisfies Partial<RuntimeStartOptions>;

    // Register workflow so resume() can look it up by workflowId
    workflowRegistry.set(workflow.id, workflow);

    // Resolve effective policy before compilation so counterfactual policy
    // substitution is enforced at topology-check time, not just at runtime.
    const effectivePolicy = opts.counterfactualPolicy ?? workflow.policy;

    // Compile the graph using the effective policy — for counterfactual runs this
    // validates that the substituted policy's approval requirements are also met
    // in the workflow topology (gate tier, high-risk categories).
    const effectiveWorkflow =
      effectivePolicy === workflow.policy ? workflow : { ...workflow, policy: effectivePolicy };
    const graph = compile(effectiveWorkflow);

    const runId = randomUUID();
    const traceId = opts.traceId ?? randomUUID();
    const startedAt = new Date().toISOString();

    const run: PipelineRun = {
      runId,
      workflowId: workflow.id,
      workflowName: workflow.name,
      mode: opts.mode,
      status: 'running',
      stageResults: [],
      input,
      startedAt,
      traceId,
      metadata: {
        ...opts.metadata,
        ...(opts.sourceRunId ? { sourceRunId: opts.sourceRunId } : {}),
        ...(opts.counterfactualModel ? { counterfactualModel: opts.counterfactualModel } : {}),
        ...(opts.counterfactualPolicy
          ? { counterfactualPolicyId: opts.counterfactualPolicy.id }
          : {}),
        // Persist the workflow definition so replay can locate it by runId without
        // depending on the in-memory workflowRegistry surviving across restarts.
        __workflowSnapshot: workflow as unknown as Record<string, unknown>,
      },
      ...(opts.sourceRunId ? { replaySourceRunId: opts.sourceRunId } : {}),
      ...(opts.counterfactualModel ? { counterfactualModelAdapter: opts.counterfactualModel } : {}),
      ...(opts.counterfactualPolicy
        ? { counterfactualPolicyProfile: opts.counterfactualPolicy.id }
        : {}),
    };

    await this.runStore.save(run);

    const telemetry = new SubstrateTelemetry(run);
    telemetry.pipelineStarted(run);
    await this.journal.writePipelineTransition({ run, event: 'started' });

    await this.fireHook('before_pipeline', run);

    return this._walkGraph(
      run,
      workflow,
      graph,
      effectivePolicy,
      opts.mode,
      opts.sourceRunId,
      opts.replayDiffOnly ?? false,
      telemetry,
    );
  }

  // ─── Graph Walk (shared by start() and resume()) ────────────────────────────

  private async _walkGraph(
    run: PipelineRun,
    workflow: WorkflowDefinition,
    graph: CompiledGraph,
    effectivePolicy: WorkflowDefinition['policy'],
    mode: string,
    sourceRunId: string | undefined,
    replayDiffOnly: boolean,
    telemetry: SubstrateTelemetry,
  ): Promise<PipelineRun> {
    const effectiveBudget = workflow.budget;
    const startMs = Date.now();

    // Load source run bundles + stage results for replay modes
    let sourceRunBundles: EvidenceBundle[] = [];
    const sourceStageOutputs = new Map<string, unknown>();
    if ((mode === 'replay' || mode === 'counterfactual') && sourceRunId) {
      sourceRunBundles = await this.journal.getRunBundles(sourceRunId);
      // Also load stage results so carry-forward stages use the actual source output
      // (not a placeholder) — preserving outputHash stability for verifyReplayStability()
      const sourceRun = await this.runStore.get(sourceRunId);
      if (sourceRun) {
        for (const r of sourceRun.stageResults) {
          sourceStageOutputs.set(r.stageId, r.output);
        }
      }
    }

    const priorEvidence: EvidenceBundle[] = [];

    // ── DAG-aware stage output tracking ────────────────────────────────────
    // Track every completed stage's output keyed by stageId. When a stage has
    // multiple dependsOn, its input is a structured merge of all upstream
    // outputs rather than just the immediately-preceding stage's output.
    const completedOutputs = new Map<string, unknown>();
    const lastCompleted = run.stageResults.filter((r) => r.status === 'completed').at(-1);
    // Seed the map from already-completed stages (for resume continuations)
    for (const r of run.stageResults) {
      if (r.status === 'completed') {
        completedOutputs.set(r.stageId, r.output);
      }
    }
    // lastOutput is still maintained for run.output and single-parent compat
    let lastOutput: unknown = lastCompleted?.output ?? run.input;
    const stageConfidences: Array<{ stageId: string; stageType: string; confidence: number }> = [];

    // Pre-populate stageConfidences from already-completed stages (for resume)
    for (const r of run.stageResults) {
      if (r.status === 'completed' && r.confidence !== undefined) {
        stageConfidences.push({
          stageId: r.stageId,
          stageType: r.stageType,
          confidence: r.confidence,
        });
      }
    }

    try {
      for (const stageId of graph.executionOrder) {
        const stageNode = graph.nodes.get(stageId)!;
        const stage = stageNode.stage;

        // Skip stages not yet ready (wait for deps)
        const depsReady = stage.dependsOn.every((depId) =>
          run.stageResults.some((r) => r.stageId === depId && r.status === 'completed'),
        );
        if (stage.dependsOn.length > 0 && !depsReady) continue;

        // Resume/continuation: skip stages already completed in this run
        const existingCompleted = run.stageResults.find(
          (r) => r.stageId === stageId && r.status === 'completed',
        );
        if (existingCompleted) {
          lastOutput = existingCompleted.output;
          completedOutputs.set(stageId, existingCompleted.output);
          continue; // confidence already pre-populated above
        }

        // Replay: carry-forward unchanged stages from source run.
        // We use the actual source stage output so outputHash matches exactly and
        // verifyReplayStability() reports stable (same input → same output hash).
        if (mode === 'replay' && replayDiffOnly) {
          const sourceBundle = sourceRunBundles.find((b) => b.stageId === stageId);
          if (sourceBundle) {
            // Capture stage input BEFORE updating lastOutput (for correct inputHash in journal)
            // DAG-aware carry-forward input (same logic as live execution path)
            const carryStageInput: unknown = (() => {
              const deps = stage.dependsOn;
              if (deps.length === 0) return run.input;
              if (deps.length === 1) return completedOutputs.get(deps[0]!) ?? lastOutput;
              const merged: Record<string, unknown> = {};
              for (const depId of deps) merged[depId] = completedOutputs.get(depId);
              return merged;
            })();
            // Use actual source output to preserve outputHash stability
            const carryOutput = sourceStageOutputs.has(stageId)
              ? sourceStageOutputs.get(stageId)
              : undefined;
            const replayedResult: StageResult = {
              stageId,
              stageType: stage.type,
              status: 'completed',
              confidence: sourceBundle.confidence,
              output: carryOutput,
              durationMs: 0,
              attempt: 1,
              routingDecision: 'accepted',
              createdAt: new Date().toISOString(),
            };
            run.stageResults.push(replayedResult);
            // Write a matching bundle so stability check has like-for-like entries
            const carryBundle = await this.journal.writeStageTransition({
              run,
              stage,
              result: replayedResult,
              input: carryStageInput,
              policyOutcome: 'allowed',
              metadata: { mode, replayedUnchanged: true, sourceRunId: sourceBundle.runId },
            });
            priorEvidence.push(carryBundle);
            lastOutput = carryOutput; // advance AFTER writing bundle
            completedOutputs.set(stageId, carryOutput);
            continue;
          }
        }

        run.currentStageId = stageId;
        await this.runStore.save(run);

        await this.fireHook('before_stage', run, stage);
        emitStageStart(run, stage);

        // ApprovalGate handling — pause in live mode, auto-approve in all others
        if (stage.type === 'ApprovalGate') {
          const gateInput = lastOutput;
          const gateResult = await this.handleApprovalGate(stage, run, telemetry, mode);
          run.stageResults.push(gateResult);
          // Write an evidence bundle for every ApprovalGate transition —
          // approval transitions are state transitions and must appear in the chain.
          const gateBundle = await this.journal.writeStageTransition({
            run,
            stage,
            result: gateResult,
            input: gateInput,
            policyOutcome:
              gateResult.status === 'pending-approval' ? 'pending-approval' : 'allowed',
            metadata: { mode, approvalGate: true, gateStatus: gateResult.status },
          });
          priorEvidence.push(gateBundle);
          if (gateResult.status === 'pending-approval') {
            run.status = 'pending-approval';
            await this.runStore.save(run);
            await this.journal.writePipelineTransition({ run, event: 'pending-approval' });
            telemetry.pipelineCompleted(run, Date.now() - startMs);
            await this.fireHook('after_pipeline', run);
            return run;
          }
          continue;
        }

        // ── DAG-aware stage input resolution ─────────────────────────────
        // Route inputs by the stage's declared dependency graph:
        //   • no dependencies     → initial workflow input (root stage)
        //   • single dependency   → pass that stage's output directly (linear compat)
        //   • multiple dep'ndcies → structured merge: { [depStageId]: depOutput }
        const stageInput: unknown = (() => {
          const deps = stage.dependsOn;
          if (deps.length === 0) return run.input;
          if (deps.length === 1) return completedOutputs.get(deps[0]!) ?? lastOutput;
          const merged: Record<string, unknown> = {};
          for (const depId of deps) {
            merged[depId] = completedOutputs.get(depId);
          }
          return merged;
        })();

        // Fire tool-call / side-effect hooks before execution
        if (stage.type === 'ToolCall') {
          await this.fireHook('before_tool_call', run, stage, stageInput);
          for (const effect of stage.sideEffects) {
            await this.fireHook('before_side_effect', run, stage, effect);
          }
        }

        const result = await this.executeStageWithRetries(
          stage,
          stageInput,
          run,
          graph,
          priorEvidence,
          effectivePolicy,
          effectiveBudget,
          telemetry,
          mode,
        );

        // Fire tool-call / side-effect hooks after execution
        if (stage.type === 'ToolCall') {
          await this.fireHook('after_tool_call', run, stage, result.output);
          for (const effect of stage.sideEffects) {
            await this.fireHook('after_side_effect', run, stage, effect);
          }
        }

        run.stageResults.push(result);
        await this.runStore.save(run);
        await this.fireHook('after_stage', run, stage, result);

        if (result.status === 'failed' || result.status === 'timed-out') {
          run.status = 'failed';
          run.error = result.error ?? `Stage '${stageId}' failed`;
          break;
        }

        if (result.status === 'pending-approval') {
          run.status = 'pending-approval';
          await this.runStore.save(run);
          await this.journal.writePipelineTransition({ run, event: 'pending-approval' });
          telemetry.pipelineCompleted(run, Date.now() - startMs);
          await this.fireHook('after_pipeline', run);
          return run;
        }

        // Write evidence bundle — pass the actual stage input for correct inputHash
        const bundle = await this.journal.writeStageTransition({
          run,
          stage,
          result,
          input: stageInput,
          policyOutcome: 'allowed',
          metadata: { mode, stageType: stage.type },
        });

        priorEvidence.push(bundle);

        if (result.confidence !== undefined) {
          stageConfidences.push({ stageId, stageType: stage.type, confidence: result.confidence });
        }

        lastOutput = result.output;
        completedOutputs.set(stageId, result.output);
      }

      // Compute final confidence
      const finalConfidence = aggregatePipelineConfidence(stageConfidences);
      run.finalConfidence = finalConfidence;
      run.output = lastOutput;

      // Validate final confidence against budget
      const confidenceFailure = validateFinalConfidence(finalConfidence, effectiveBudget);
      if (confidenceFailure && run.status === 'running') {
        run.status = 'failed';
        run.error = confidenceFailure;
        const lastResult = run.stageResults.at(-1);
        const lastStage = lastResult
          ? graph.nodes.get(lastResult.stageId)?.stage
          : workflow.stages[0];
        if (lastStage) {
          await this.fireHook('on_low_confidence', run, lastStage, finalConfidence);
        }
      }

      if (run.status === 'running') {
        run.status = mode === 'dry-run' ? 'dry-run-complete' : 'completed';
      }

      const durationMs = Date.now() - startMs;
      run.completedAt = new Date().toISOString();
      run.durationMs = (run.durationMs ?? 0) + durationMs;

      await this.runStore.save(run);
      await this.journal.writePipelineTransition({
        run,
        event: run.status === 'failed' ? 'failed' : 'completed',
      });

      await this.fireHook('before_finalize', run);
      telemetry.pipelineCompleted(run, durationMs);
      await this.fireHook('after_finalize', run);
      await this.fireHook('after_pipeline', run);
    } catch (err) {
      run.status = 'failed';
      run.error = err instanceof Error ? err.message : String(err);
      run.completedAt = new Date().toISOString();
      const durationMs = Date.now() - startMs;
      run.durationMs = (run.durationMs ?? 0) + durationMs;

      await this.runStore.save(run);
      await this.journal.writePipelineTransition({ run, event: 'failed' });
      telemetry.pipelineCompleted(run, durationMs);
      await this.fireHook('after_pipeline', run);
    }

    return run;
  }

  // ─── Stage Execution with Retries ──────────────────────────────────────────

  private async executeStageWithRetries(
    stage: AnyStage,
    input: unknown,
    run: PipelineRun,
    graph: CompiledGraph,
    priorEvidence: EvidenceBundle[],
    policy: WorkflowDefinition['policy'],
    budget: WorkflowDefinition['budget'],
    telemetry: SubstrateTelemetry,
    mode: string,
  ): Promise<StageResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= stage.maxRetries + 1; attempt++) {
      const spanId = telemetry.stageStarted(stage, attempt).spanId;
      const stageStartMs = Date.now();

      try {
        // Policy pre-flight check.
        // Pass the effective policy profile so adapters can filter by active
        // policy IDs and enforce the substituted profile's minimum approval tier.
        // This makes counterfactual policy substitution visible to policy adapters.
        const policyAdapter =
          policyAdapterRegistry.get('policy-engine') ?? policyAdapterRegistry.getOrThrow('default');
        const policyCheck = await policyAdapter.evaluate({
          action: `stage:${stage.type}:${stage.id}`,
          agentId: 'substrate-engine',
          riskLevel: this.stageRiskLevel(stage),
          context: {
            workflowId: run.workflowId,
            runId: run.runId,
            mode,
            // Effective (possibly counterfactual-substituted) policy profile
            effectivePolicyId: policy.id,
            effectivePolicyIds: policy.policyIds,
            minimumApprovalTier: policy.minimumApprovalTier,
            highRiskCategories: policy.highRiskCategories,
          },
        });

        if (!policyCheck.allowed && !policyCheck.requiresApproval) {
          const reason = policyCheck.blockedReason ?? 'Policy violation';
          await this.fireHook('on_policy_violation', run, stage, reason);
          telemetry.recordPolicyOutcome(stage, 'blocked', spanId);
          const durationMs = Date.now() - stageStartMs;
          const result: StageResult = {
            stageId: stage.id,
            stageType: stage.type,
            status: 'failed',
            error: `Policy blocked: ${reason}`,
            durationMs,
            attempt,
            createdAt: new Date().toISOString(),
          };
          telemetry.stageCompleted(stage, result, spanId);
          return result;
        }

        // Execute with timeout
        let output: unknown;
        let confidence: number;

        const executionCtx: import('./types.js').StageExecutorContext = {
          runId: run.runId,
          workflowId: run.workflowId,
          mode: mode as 'live' | 'dry-run' | 'replay' | 'counterfactual',
          stageId: stage.id,
          budget,
          policy,
          priorEvidence,
          graph,
          // Propagate counterfactual model substitution for Reason/Verify/Decide stages.
          // Omit the field entirely when undefined (exactOptionalPropertyTypes).
          ...(run.counterfactualModelAdapter !== undefined
            ? { counterfactualModelAdapterId: run.counterfactualModelAdapter }
            : {}),
        };

        if (stage.timeoutMs > 0) {
          const result = await Promise.race([
            this.stageExecutor(stage, input, executionCtx),
            new Promise<never>((_, reject) =>
              setTimeout(
                () => reject(new Error(`Stage '${stage.id}' timed out after ${stage.timeoutMs}ms`)),
                stage.timeoutMs,
              ),
            ),
          ]);
          output = result.output;
          confidence = result.confidence;
        } else {
          const result = await this.stageExecutor(stage, input, executionCtx);
          output = result.output;
          confidence = result.confidence;
        }

        // Confidence-budget routing
        const routingDecision = routeByBudget(confidence, stage, budget, run);
        telemetry.recordRoutingDecision(stage, routingDecision, spanId);

        if (routingDecision.action === 'escalate-human') {
          await this.fireHook('on_low_confidence', run, stage, confidence);
          const approvalId = `sub-approval-${randomUUID().slice(0, 8)}`;
          const result: StageResult = {
            stageId: stage.id,
            stageType: stage.type,
            status: 'pending-approval',
            confidence,
            output,
            durationMs: Date.now() - stageStartMs,
            attempt,
            routingDecision: 'escalated-human',
            approvalId,
            createdAt: new Date().toISOString(),
          };
          telemetry.stageCompleted(stage, result, spanId);
          return result;
        }

        if (routingDecision.action === 'escalate-model') {
          const strongAdapter =
            modelAdapterRegistry.get(routingDecision.targetAdapterId) ??
            modelAdapterRegistry.getOrThrow('default');
          const escalatedResult = await strongAdapter.infer({
            prompt: typeof input === 'string' ? input : JSON.stringify(input),
            context: { stageId: stage.id, escalated: true },
          });
          output = escalatedResult.content;
          confidence = escalatedResult.confidence;
        }

        const durationMs = Date.now() - stageStartMs;
        const result: StageResult = {
          stageId: stage.id,
          stageType: stage.type,
          status: 'completed',
          confidence,
          output,
          durationMs,
          attempt,
          routingDecision:
            routingDecision.action === 'escalate-model' ? 'escalated-model' : 'accepted',
          createdAt: new Date().toISOString(),
        };

        telemetry.stageCompleted(stage, result, spanId);
        return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const durationMs = Date.now() - stageStartMs;

        if (attempt <= stage.maxRetries) {
          // Exponential backoff
          const backoffMs = Math.min(500 * 2 ** (attempt - 1), 10_000);
          await new Promise<void>((r) => setTimeout(r, backoffMs));
          continue;
        }

        const result: StageResult = {
          stageId: stage.id,
          stageType: stage.type,
          status: durationMs >= stage.timeoutMs ? 'timed-out' : 'failed',
          error: lastError.message,
          durationMs,
          attempt,
          createdAt: new Date().toISOString(),
        };

        await this.fireHook('on_validation_error', run, stage, lastError);
        telemetry.stageCompleted(stage, result, spanId);
        return result;
      }
    }

    // Unreachable (loop always returns), but TS needs this
    return {
      stageId: stage.id,
      stageType: stage.type,
      status: 'failed',
      error: lastError?.message ?? 'Unknown error',
      durationMs: 0,
      attempt: stage.maxRetries + 1,
      createdAt: new Date().toISOString(),
    };
  }

  // ─── Approval Gate ─────────────────────────────────────────────────────────

  private async handleApprovalGate(
    stage: AnyStage,
    run: PipelineRun,
    telemetry: SubstrateTelemetry,
    mode: string,
  ): Promise<StageResult> {
    if (stage.type !== 'ApprovalGate') {
      throw new Error('handleApprovalGate called on non-ApprovalGate stage');
    }

    const spanId = telemetry.stageStarted(stage, 1).spanId;
    const startMs = Date.now();

    // Non-live modes: auto-approve so replay/counterfactual produce complete deterministic diffs
    if (mode === 'dry-run' || mode === 'replay' || mode === 'counterfactual') {
      const result: StageResult = {
        stageId: stage.id,
        stageType: 'ApprovalGate',
        status: 'completed',
        confidence: 1,
        output: { approved: true, autoApproved: true, mode },
        durationMs: 1,
        attempt: 1,
        routingDecision: 'accepted',
        createdAt: new Date().toISOString(),
      };
      telemetry.stageCompleted(stage, result, spanId);
      return result;
    }

    // In live mode: submit to approvals-inbox and mark pending
    const approvalId = `sub-gate-${randomUUID().slice(0, 8)}`;
    submitApprovalAction(approvalId, 'escalated', {
      domain: run.workflowId,
      surface: 'substrate-engine',
      note: `Approval gate '${stage.id}' in workflow '${run.workflowName}' awaiting human review`,
    });

    telemetry.recordApprovalRequest(stage, approvalId, spanId);

    const result: StageResult = {
      stageId: stage.id,
      stageType: 'ApprovalGate',
      status: 'pending-approval',
      confidence: 0,
      durationMs: Date.now() - startMs,
      attempt: 1,
      approvalId,
      createdAt: new Date().toISOString(),
    };

    telemetry.stageCompleted(stage, result, spanId);
    return result;
  }

  // ─── Resume from Journal ────────────────────────────────────────────────────

  async resume(runId: string, approvedBy?: string): Promise<PipelineRun | null> {
    const run = await this.runStore.get(runId);
    if (!run) return null;

    if (run.status !== 'pending-approval') return run;

    // Look up the workflow definition: first try the persisted snapshot embedded
    // in run metadata (written by start() for restart-safe durability), then fall
    // back to the in-memory registry for same-session resumes.
    const snapshotDef = run.metadata?.__workflowSnapshot as WorkflowDefinition | undefined;
    const workflow = snapshotDef ?? workflowRegistry.get(run.workflowId);

    // Mark the pending approval gate as approved in-place on the existing run
    const pendingGate = run.stageResults.find((r) => r.status === 'pending-approval');
    if (pendingGate) {
      const approvedAt = new Date().toISOString();
      pendingGate.status = 'completed';
      pendingGate.output = {
        approved: true,
        approvedBy: approvedBy ?? 'operator',
        approvedAt,
      };
      pendingGate.confidence = 1;

      // Write an evidence bundle for the pending→approved transition.
      // This is the most governance-critical transition: it must be journaled
      // with approver identity, timestamp, and HMAC signature.
      if (workflow) {
        const gateStage = workflow.stages.find((s) => s.id === pendingGate.stageId);
        if (gateStage) {
          await this.journal.writeStageTransition({
            run,
            stage: gateStage,
            result: pendingGate,
            input: null, // input was recorded at pending-approval time
            policyOutcome: 'allowed',
            metadata: {
              event: 'approval-gate-approved',
              approvedBy: approvedBy ?? 'operator',
              approvedAt,
              runId,
            },
          });
        }
      }
    }

    run.status = 'running';
    run.metadata = { ...run.metadata, resumedFrom: runId, approvedBy: approvedBy ?? 'operator' };
    await this.runStore.save(run);

    if (!workflow) {
      // No workflow could be resolved from either the persisted snapshot or the
      // in-memory registry. This should not happen for runs created by start()
      // (snapshot is always written), but we fail gracefully rather than crash.
      return run;
    }

    // Compile the graph and continue walking from where execution left off.
    // _walkGraph() skips any stageResult already in run.stageResults with status "completed".
    const graph = compile(workflow);
    const telemetry = new SubstrateTelemetry(run);
    await this.journal.writePipelineTransition({ run, event: 'started' });
    await this.fireHook('before_pipeline', run);

    return this._walkGraph(
      run,
      workflow,
      graph,
      workflow.policy,
      run.mode,
      run.replaySourceRunId,
      false,
      telemetry,
    );
  }

  /**
   * reject() — terminate a run that is paused at an approval gate as "rejected/failed".
   *
   * Mirrors resume(): loads the run from the store, marks the pending approval
   * gate as failed with the rejector identity, writes a signed evidence bundle,
   * and persists the run with status "failed". Returns null when the run does not
   * exist or is not in pending-approval state.
   */
  async reject(runId: string, rejectedBy?: string, reason?: string): Promise<PipelineRun | null> {
    const run = await this.runStore.get(runId);
    if (!run) return null;
    if (run.status !== 'pending-approval') return run;

    const snapshotDef = run.metadata?.__workflowSnapshot as WorkflowDefinition | undefined;
    const workflow = snapshotDef ?? workflowRegistry.get(run.workflowId);

    const rejector = rejectedBy ?? 'operator';
    const rejectedAt = new Date().toISOString();

    const pendingGate = run.stageResults.find((r) => r.status === 'pending-approval');
    if (pendingGate) {
      pendingGate.status = 'failed';
      pendingGate.output = {
        approved: false,
        rejectedBy: rejector,
        rejectedAt,
        ...(reason ? { reason } : {}),
      };

      if (workflow) {
        const gateStage = workflow.stages.find((s) => s.id === pendingGate.stageId);
        if (gateStage) {
          await this.journal.writeStageTransition({
            run,
            stage: gateStage,
            result: pendingGate,
            input: null,
            policyOutcome: 'blocked',
            metadata: {
              event: 'approval-gate-rejected',
              rejectedBy: rejector,
              rejectedAt,
              runId,
              ...(reason ? { reason } : {}),
            },
          });
        }
      }
    }

    run.status = 'failed';
    run.error = reason ? `Rejected by ${rejector}: ${reason}` : `Rejected by ${rejector}`;
    run.metadata = { ...run.metadata, rejectedBy: rejector, rejectedAt };
    await this.runStore.save(run);
    return run;
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private stageRiskLevel(stage: AnyStage): 'low' | 'medium' | 'high' | 'critical' {
    if (stage.type === 'Decide') {
      const highRisk = stage.highRiskSideEffects;
      if (highRisk.includes('financial') || highRisk.includes('infrastructure')) return 'critical';
      if (highRisk.includes('deletion') || highRisk.includes('write-external')) return 'high';
      if (highRisk.length > 0) return 'medium';
    }
    if (stage.type === 'ToolCall') {
      const effects = stage.sideEffects;
      if (effects.includes('financial') || effects.includes('infrastructure')) return 'high';
      if (effects.includes('deletion') || effects.includes('write-external')) return 'medium';
    }
    return 'low';
  }

  private async fireHook<K extends keyof SubstrateHooks>(
    hookName: K,
    ...args: Parameters<NonNullable<SubstrateHooks[K]>>
  ): Promise<void> {
    const hook = this.hooks[hookName];
    if (!hook) return;
    try {
      // Invoke the variadic hook without `any`: cast through unknown[] as the
      // intermediate step, then narrow to never[] for the call-site. The concrete
      // parameter types are enforced by the K-bounded generic above.
      await (hook as (...hookArgs: never[]) => Promise<void>)(...(args as unknown[] as never[]));
    } catch {
      // Hooks must not crash the pipeline
    }
  }
}

export const defaultRuntime = new SubstrateRuntime();
