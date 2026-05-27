import { describe, expect, it, beforeEach } from 'vitest';
import {
  clearOrchestrationTracesForTest,
  getRecentOrchestrationTraces,
  runOrchestration,
} from './orchestration-trace.js';
import { setYawarPublisher } from './evaluate.js';

const allowSignals = {
  cleanliness: 0.99,
  horizon: 0.98,
  resonance: 0.97,
  frustum: 0.96,
  moralGrounding: 0.98,
  measurabilityHonesty: 0.97,
} as const;

const denySignals = {
  cleanliness: 0.1,
  horizon: 0.1,
  resonance: 0.1,
  frustum: 0.1,
  moralGrounding: 0.1,
  measurabilityHonesty: 0.1,
} as const;

describe('runOrchestration — drift → evaluate → approve → publish', () => {
  beforeEach(() => {
    clearOrchestrationTracesForTest();
    setYawarPublisher(() => undefined);
  });

  it('emits four hashed stage artefacts joined to the Λ receipt', async () => {
    const trace = await runOrchestration({
      drift: () => ({ signal: 'brand-color-shift', delta: 0.04 }),
      evaluate: () => ({
        action: 'publish_palette_update',
        vertical: 'platform' as const,
        context: { signals: allowSignals },
      }),
      approve: (v) => (v.allow ? ('allow' as const) : ('deny' as const)),
      publish: () => ({ publishedAt: 'mock-iso', target: 'brand-cdn' }),
    });

    expect(trace.stages).toHaveLength(4);
    expect(trace.stages.map((s) => s.stageName)).toEqual([
      'drift',
      'evaluate',
      'approve',
      'publish',
    ]);
    for (const stage of trace.stages) {
      expect(stage.receiptClass).toBe('pipeline.stage.v1');
      expect(stage.inputsHash).toMatch(/^[a-f0-9]{64}$/);
      expect(stage.paramsHash).toMatch(/^[a-f0-9]{64}$/);
      expect(stage.outputsHash).toMatch(/^[a-f0-9]{64}$/);
      expect(stage.parentPipelineId).toBe(trace.pipelineId);
    }
    expect(trace.decision).toBe('allow');
    expect(trace.published).not.toBeNull();
    expect(trace.lambdaReceiptId).toBe(trace.verdict.receipt.receiptId);
  });

  it('still emits a publish-stage artefact when the verdict is denied (no published payload)', async () => {
    const trace = await runOrchestration({
      drift: () => ({ signal: 'recommender-anomaly', score: 0.91 }),
      evaluate: () => ({
        action: 'publish_palette_update',
        vertical: 'platform' as const,
        context: { signals: denySignals },
      }),
      approve: () => 'deny' as const,
      publish: () => ({ publishedAt: 'mock-iso', target: 'brand-cdn' }),
    });

    expect(trace.stages).toHaveLength(4);
    expect(trace.decision).toBe('deny');
    expect(trace.published).toBeNull();
    // Absence-of-publish is itself observable: the stage artefact exists,
    // its outputsHash hashes `null`.
    const publishStage = trace.stages[3]!;
    expect(publishStage.stageName).toBe('publish');
    expect(publishStage.outputsHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('appends traces to the in-memory ring (newest first, capped)', async () => {
    for (let i = 0; i < 3; i++) {
      await runOrchestration({
        drift: () => ({ i }),
        evaluate: () => ({
          action: 'x',
          vertical: 'platform' as const,
          context: { signals: allowSignals },
        }),
        approve: () => 'allow' as const,
        publish: () => ({ i }),
      });
    }
    const recent = getRecentOrchestrationTraces(10);
    expect(recent).toHaveLength(3);
    // Newest first.
    expect(recent[0]!.pipelineId).not.toBe(recent[1]!.pipelineId);
  });
});
