import type { GuardianRule } from '@workspace/guardian';
import { InMemoryStore } from '@workspace/memory-fabric';
import { InMemoryTraceStore, TraceReplayer } from '@workspace/trace-graph';
import { describe, expect, it } from 'vitest';
import { generateExecutiveBrief } from './brief.js';
import { InMemoryCheckpointStore } from './checkpoint.js';
import { run } from './orchestrator.js';
import type { StepExecutorFn } from './phases/execute.js';
import { GuardianDecisionEngine } from './phases/execute.js';

function makeStores() {
  return {
    traceStore: new InMemoryTraceStore(),
    memoryStore: new InMemoryStore(),
    checkpointStore: new InMemoryCheckpointStore(),
  };
}

describe('cognitive-runtime smoke tests', () => {
  it('happy path: perceive → orient → plan → execute → verify → update_self_model', async () => {
    const stores = makeStores();

    const result = await run(
      'Analyse vessel cargo utilisation and flag anomalies for the Q2 fleet',
      {
        agentId: 'test-agent',
        domain: 'vessels',
        perceiveInput: {
          rawSignals: [
            {
              type: 'cargo_event',
              entityId: 'vessel-001',
              entityType: 'vessel',
              payload: 'cargo_utilisation=0.91',
              confidence: 0.95,
            },
            {
              type: 'anomaly_alert',
              entityId: 'vessel-002',
              entityType: 'vessel',
              anomaly: 'cargo_utilisation_below_threshold',
              confidence: 0.87,
              risk: 0.6,
            },
          ],
          sourceDomain: 'vessels',
          priority: 'high',
        },
        agentTier: 'analyst',
        guardianEnabled: false,
        reflectionEnabled: false,
        verifierEnabled: true,
        dryRun: true,
      },
      {
        ...stores,
        onPhaseComplete: (phase, result) => {
          expect(result.phase).toBe(phase);
          expect(result.startedAt).toBeGreaterThan(0);
          expect(result.durationMs).toBeGreaterThanOrEqual(0);
        },
      },
    );

    expect(result.run.status).toBe('completed');
    expect(result.success).toBe(true);

    // All 8 required phases must be present (PERCEIVE → ORIENT → PLAN → EXECUTE → VERIFY → REFLECT-or-UPDATE → UPDATE_SELF_MODEL → UPDATE_MEMORY)
    const phases = result.run.phases.map((p) => p.phase);
    expect(phases).toContain('perceive');
    expect(phases).toContain('orient');
    expect(phases).toContain('plan');
    expect(phases).toContain('execute');
    expect(phases).toContain('update_self_model');
    expect(phases).toContain('update_memory');

    // World model must have updated with entities from the signals
    expect(result.run.worldModelUpdate).toBeDefined();
    expect(result.run.worldModelUpdate!.entities.length).toBeGreaterThan(0);

    // A plan must have been created
    expect(result.run.planId).toBeDefined();
    expect(typeof result.run.planId).toBe('string');

    // Memory must have been written (episodic run entry at minimum)
    expect(result.run.memoryIds.length).toBeGreaterThan(0);

    // Verify phase must have run and produced a decision
    const verifyPhaseResult = result.run.phases.find((p) => p.phase === 'verify');
    expect(verifyPhaseResult).toBeDefined();
    const verifyOutput = verifyPhaseResult!.output as {
      passed: boolean;
      action: string;
      overallScore: number;
      verifierId: string;
    };
    expect(typeof verifyOutput.passed).toBe('boolean');
    expect(typeof verifyOutput.action).toBe('string');
    expect(['approve', 'revise', 'request_more_evidence', 'block']).toContain(verifyOutput.action);
    expect(typeof verifyOutput.overallScore).toBe('number');
    expect(verifyOutput.overallScore).toBeGreaterThanOrEqual(0);
  });

  it('verifier-block-and-revise: failed steps trigger revise→reflect→replan feedback loop', async () => {
    const stores = makeStores();

    // Step executor that succeeds on step 0, fails on all others
    // → completedSteps=1, failedSteps≥1 → low confidence → verifier revises
    let callCount = 0;
    const partialExecutor: StepExecutorFn = async (step) => {
      if (callCount === 0) {
        callCount++;
        return { stepId: step.stepId, result: 'partial' };
      }
      callCount++;
      throw new Error('Simulated step failure for verifier revision');
    };

    const result = await run(
      'Generate a concise risk summary for board review',
      {
        agentId: 'test-agent',
        domain: 'executive',
        guardianEnabled: false,
        reflectionEnabled: true,
        verifierEnabled: true,
        maxVerifyRevisions: 2,
        maxRetries: 0,
        dryRun: false,
      },
      { ...stores, stepExecutor: partialExecutor },
    );

    // Run must reach a terminal status (completed or failed — not guardian_blocked)
    expect(['completed', 'failed']).toContain(result.run.status);

    // Verify must have been attempted at least once
    const verifyPhases = result.run.phases.filter((p) => p.phase === 'verify');
    expect(verifyPhases.length).toBeGreaterThanOrEqual(1);

    // Each verify phase must have proper output
    for (const vp of verifyPhases) {
      const out = vp.output as { passed: boolean; action: string; overallScore: number };
      expect(typeof out.passed).toBe('boolean');
      expect(typeof out.action).toBe('string');
    }

    // Reflect and replan must have been triggered when revision happened
    if (result.run.planRevisions && result.run.planRevisions > 0) {
      // Plan appeared more than once (initial + revisions)
      const planPhaseCount = result.run.phases.filter((p) => p.phase === 'plan').length;
      expect(planPhaseCount).toBe(1 + result.run.planRevisions);

      // Reflect must appear for each revision
      const reflectPhaseCount = result.run.phases.filter((p) => p.phase === 'reflect').length;
      expect(reflectPhaseCount).toBeGreaterThanOrEqual(result.run.planRevisions);
    }

    // Both update phases must ALWAYS run regardless of outcome (centralized finalization)
    const selfModelFinal = result.run.phases.find((p) => p.phase === 'update_self_model');
    expect(selfModelFinal).toBeDefined();

    const updateMemFinal = result.run.phases.find((p) => p.phase === 'update_memory');
    expect(updateMemFinal).toBeDefined();
    const updateOut = updateMemFinal!.output as { memoryIdsWritten: string[] };
    expect(Array.isArray(updateOut.memoryIdsWritten)).toBe(true);
    expect(updateOut.memoryIdsWritten.length).toBeGreaterThan(0);
  });

  it('guardian-blocked action: blocks execution and still runs finalization', async () => {
    const stores = makeStores();

    const blockerGuardian = new GuardianDecisionEngine();
    const blockRule: GuardianRule = {
      id: 'block-all-rule',
      name: 'Block Everything',
      tier: 'internal-workflow',
      conditions: [],
      action: 'block',
      priority: 1,
      enabled: true,
      tags: [],
    };
    blockerGuardian.addRule(blockRule);

    const result = await run(
      'Execute a restricted action',
      {
        agentId: 'test-agent',
        guardianEnabled: true,
        reflectionEnabled: false,
        dryRun: false,
      },
      { ...stores, guardian: blockerGuardian },
    );

    expect(result.run.status).toBe('guardian_blocked');
    expect(result.success).toBe(false);

    // Execute phase must have been attempted
    const executedPhases = result.run.phases.map((p) => p.phase);
    expect(executedPhases).toContain('execute');

    // Execute phase must have status "blocked"
    const execPhase = result.run.phases.find((p) => p.phase === 'execute');
    expect(execPhase!.status).toBe('blocked');
    const execOut = execPhase!.output as {
      blockedSteps: number;
      stepResults: { status: string }[];
    };
    expect(execOut.blockedSteps).toBeGreaterThan(0);
    expect(execOut.stepResults[0]?.status).toBe('blocked');

    // update_self_model + update_memory must ALWAYS run — even after guardian block
    const selfModelPhaseResult = result.run.phases.find((p) => p.phase === 'update_self_model');
    expect(selfModelPhaseResult).toBeDefined();
    expect(selfModelPhaseResult!.status).toBe('ok');

    const updateMemPhaseResult = result.run.phases.find((p) => p.phase === 'update_memory');
    expect(updateMemPhaseResult).toBeDefined();
    expect(updateMemPhaseResult!.status).toBe('ok');
    const updateOut = updateMemPhaseResult!.output as { memoryIdsWritten: string[] };
    expect(updateOut.memoryIdsWritten.length).toBeGreaterThan(0);
  });

  it('checkpoint resume: creates checkpoints and resumes execution from a mid-run snapshot', async () => {
    const checkpointStore = new InMemoryCheckpointStore();
    const traceStore = new InMemoryTraceStore();
    const memoryStore = new InMemoryStore();

    let stepCallCount = 0;
    const countingExecutor: StepExecutorFn = async (step) => {
      stepCallCount++;
      return { stepId: step.stepId, executedAt: new Date().toISOString() };
    };

    const firstResult = await run(
      'Multi-step intelligence gathering',
      {
        agentId: 'checkpoint-agent',
        guardianEnabled: false,
        reflectionEnabled: false,
        dryRun: false,
        checkpointEveryNSteps: 1,
      },
      { traceStore, memoryStore, checkpointStore, stepExecutor: countingExecutor },
    );

    expect(firstResult.run.status).toBe('completed');

    // Checkpoints must be created (checkpointEveryNSteps=1 means every step creates one)
    const checkpoints = checkpointStore.list(firstResult.run.runId);
    expect(checkpoints.length).toBeGreaterThan(0);

    // Checkpoint must record the agentId for ownership enforcement
    expect(checkpoints[0]!.agentId).toBe('checkpoint-agent');
    expect(checkpoints[0]!.runId).toBe(firstResult.run.runId);
    expect(checkpoints[0]!.stepIndex).toBeDefined();
    expect(checkpoints[0]!.snapshot.phases.some((p) => p.phase === 'plan')).toBe(true);

    const firstCkpt = checkpoints[0]!;
    const stepsBeforeResume = stepCallCount;

    // Resume from the first checkpoint (step N+1 onwards)
    const resumeResult = await run(
      'Multi-step intelligence gathering',
      {
        agentId: 'checkpoint-agent',
        guardianEnabled: false,
        reflectionEnabled: false,
        resumeFromCheckpoint: firstCkpt.ref,
      },
      {
        traceStore: new InMemoryTraceStore(),
        memoryStore: new InMemoryStore(),
        checkpointStore,
        stepExecutor: countingExecutor,
      },
    );

    expect(resumeResult.run.status).toBe('completed');

    // Resume must have executed more steps (those after the checkpoint)
    if (firstCkpt.stepIndex < firstResult.run.stepResults.length - 1) {
      // There were steps after the checkpoint — they should re-execute on resume
      expect(stepCallCount).toBeGreaterThan(stepsBeforeResume);
    }

    // Resumed run must have phases inherited from checkpoint
    const resumedPhases = resumeResult.run.phases.map((p) => p.phase);
    expect(resumedPhases).toContain('execute');
    expect(resumedPhases).toContain('update_self_model');
  });

  it('smoke scenario: ingest event → world model → plan → execute → verify → reflect → store lesson → replay', async () => {
    const traceStore = new InMemoryTraceStore();
    const memoryStore = new InMemoryStore();
    const checkpointStore = new InMemoryCheckpointStore();

    const result = await run(
      'Ingest maritime distress event, update world model, create response plan, execute, verify, reflect, store lesson',
      {
        agentId: 'smoke-agent',
        domain: 'vessels',
        perceiveInput: {
          rawSignals: [
            {
              type: 'distress_signal',
              entityId: 'vessel-mayday-001',
              entityType: 'vessel',
              location: { lat: 34.5, lon: -118.2 },
              severity: 'critical',
              risk: 0.9,
              novelty: 0.7,
              confidence: 0.98,
            },
          ],
          sourceDomain: 'vessels',
          priority: 'critical',
        },
        guardianEnabled: false,
        reflectionEnabled: true,
        verifierEnabled: true,
        dryRun: true,
        agentTier: 'operator',
      },
      { traceStore, memoryStore, checkpointStore },
    );

    // ── Run succeeded ────────────────────────────────────────────────────────
    expect(result.run.status).toBe('completed');
    expect(result.success).toBe(true);
    expect(result.run.durationMs).toBeGreaterThan(0);

    // ── World model updated (PERCEIVE + ORIENT) ──────────────────────────────
    expect(result.run.worldModelUpdate).toBeDefined();
    expect(result.run.worldModelUpdate!.riskScore).toBeGreaterThan(0);
    expect(result.run.worldModelUpdate!.entities.length).toBeGreaterThan(0);
    // The vessel entity must appear in the world model
    const entityIds = result.run.worldModelUpdate!.entities.map((e) => e.entityId);
    expect(entityIds).toContain('vessel-mayday-001');

    // ── Plan created (PLAN) ──────────────────────────────────────────────────
    expect(result.run.planId).toBeDefined();
    const planPhase = result.run.phases.find((p) => p.phase === 'plan');
    expect(planPhase).toBeDefined();
    expect(planPhase!.status).toBe('ok');

    // ── Execute ran (EXECUTE) ────────────────────────────────────────────────
    const execPhase = result.run.phases.find((p) => p.phase === 'execute');
    expect(execPhase).toBeDefined();
    expect(execPhase!.status).toBe('ok');
    const execOut = execPhase!.output as { completedSteps: number };
    expect(execOut.completedSteps).toBeGreaterThan(0);

    // ── Verify phase ran and produced a structured decision (VERIFY) ──────────
    const verifyPhase = result.run.phases.find((p) => p.phase === 'verify');
    expect(verifyPhase).toBeDefined();
    const verifyOut = verifyPhase!.output as {
      passed: boolean;
      action: string;
      overallScore: number;
      reasoning: string;
    };
    expect(typeof verifyOut.passed).toBe('boolean');
    expect(typeof verifyOut.reasoning).toBe('string');
    expect(verifyOut.reasoning.length).toBeGreaterThan(0);

    // ── Reflect was called (REFLECT) ─────────────────────────────────────────
    const reflectPhase = result.run.phases.find((p) => p.phase === 'reflect');
    expect(reflectPhase).toBeDefined();
    const reflectOut = reflectPhase!.output as {
      lesson: string;
      reflectionId: string;
      qualityScore: number;
    };
    expect(typeof reflectOut.lesson).toBe('string');
    expect(reflectOut.lesson.length).toBeGreaterThan(0);
    expect(typeof reflectOut.reflectionId).toBe('string');

    // ── Self-model updated (UPDATE_SELF_MODEL — Phase 7) ────────────────────
    const selfModelPhase = result.run.phases.find((p) => p.phase === 'update_self_model');
    expect(selfModelPhase).toBeDefined();
    expect(selfModelPhase!.status).toBe('ok');
    const selfModelOut = selfModelPhase!.output as { selfModelUpdated: boolean };
    expect(typeof selfModelOut.selfModelUpdated).toBe('boolean');

    // ── Memory updated (UPDATE_MEMORY — Phase 8 — discrete from self-model) ─
    const updateMemoryPhaseResult = result.run.phases.find((p) => p.phase === 'update_memory');
    expect(updateMemoryPhaseResult).toBeDefined();
    expect(updateMemoryPhaseResult!.status).toBe('ok');
    const updateMemOut = updateMemoryPhaseResult!.output as {
      memoryIdsWritten: string[];
      episodicId: string;
    };
    expect(updateMemOut.memoryIdsWritten.length).toBeGreaterThan(0);
    expect(typeof updateMemOut.episodicId).toBe('string');

    // ── Lesson stored to semantic memory ────────────────────────────────────
    const allMemoryIds = result.run.memoryIds;
    expect(allMemoryIds.length).toBeGreaterThan(0);

    // Episodic run entry must exist in memory store
    const episodic = memoryStore.list({ tier: 'episodic' });
    expect(episodic.length).toBeGreaterThan(0);
    const runEntry = episodic.find(
      (e) =>
        typeof e.value === 'object' &&
        (e.value as Record<string, unknown>).runId === result.run.runId,
    );
    expect(runEntry).toBeDefined();
    expect((runEntry!.value as Record<string, unknown>).objective).toContain('maritime');

    // ── Phase order matches spec: PERCEIVE → ORIENT → PLAN → EXECUTE → ... → UPDATE_SELF_MODEL → UPDATE_MEMORY
    const orderedPhases = result.run.phases.map((p) => p.phase);
    expect(orderedPhases).toContain('update_memory');

    const perceiveIdx = orderedPhases.indexOf('perceive');
    const orientIdx = orderedPhases.indexOf('orient');
    const planIdx = orderedPhases.indexOf('plan');
    const executeIdx = orderedPhases.indexOf('execute');
    const selfModelIdx = orderedPhases.lastIndexOf('update_self_model');
    const updateMemIdx = orderedPhases.lastIndexOf('update_memory');

    expect(perceiveIdx).toBeLessThan(orientIdx);
    expect(orientIdx).toBeLessThan(planIdx);
    expect(planIdx).toBeLessThan(executeIdx);
    expect(executeIdx).toBeLessThan(selfModelIdx);
    expect(selfModelIdx).toBeLessThan(updateMemIdx);

    // ── REPLAY: trace must be recorded and replayable ────────────────────────
    // The orchestrator writes each phase as a trace span — verify the trace
    // exists in the store and can be replayed via TraceReplayer.
    const traceRecord = traceStore.get(result.run.traceId!);
    expect(traceRecord).toBeDefined();
    expect(traceRecord!.traceId).toBe(result.run.traceId);
    expect(traceRecord!.agentId).toBe('smoke-agent');

    const replayer = new TraceReplayer(traceStore);
    const visitedSpans: string[] = [];
    replayer.replayTrace(result.run.traceId!, {
      onSpan: (span) => {
        visitedSpans.push(span.name);
      },
    });
    // All 8 phases should appear as trace spans
    expect(visitedSpans).toContain('perceive');
    expect(visitedSpans).toContain('orient');
    expect(visitedSpans).toContain('plan');
    expect(visitedSpans).toContain('execute');
    expect(visitedSpans).toContain('update_self_model');
    expect(visitedSpans).toContain('update_memory');

    // ── GENERATE EXECUTIVE BRIEF ─────────────────────────────────────────────
    // Final step of the spec smoke scenario: produce a structured brief that
    // aggregates the completed run into an executive-level summary.
    const brief = generateExecutiveBrief(result.run);
    expect(brief.briefId).toBe(`brief-${result.run.runId}`);
    expect(brief.runId).toBe(result.run.runId);
    expect(brief.objective).toContain('maritime');
    expect(brief.status).toBe('completed');
    expect(typeof brief.executiveSummary).toBe('string');
    expect(brief.executiveSummary.length).toBeGreaterThan(0);
    // World model highlights must reflect ingested entity
    expect(brief.worldModelHighlights.entityCount).toBeGreaterThan(0);
    expect(brief.worldModelHighlights.riskScore).toBeGreaterThan(0);
    // Plan summary must reflect the executed steps
    expect(brief.planSummary.stepCount).toBeGreaterThan(0);
    expect(brief.planSummary.completedSteps).toBeGreaterThan(0);
    // Verify summary must reflect the verify phase outcome
    expect(brief.verifySummary.verifyAttempts).toBeGreaterThanOrEqual(1);
    expect(typeof brief.verifySummary.finalVerdict).toBe('string');
    // Lesson must be present (reflectionEnabled=true)
    expect(typeof brief.lesson).toBe('string');
    expect(brief.lesson!.length).toBeGreaterThan(0);
    // Brief must have a generation timestamp
    expect(typeof brief.generatedAt).toBe('string');
    expect(new Date(brief.generatedAt).getTime()).toBeGreaterThan(0);
  });
});
