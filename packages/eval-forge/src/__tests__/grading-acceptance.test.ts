import { describe, expect, it } from 'vitest';
import { getGrader, type GraderContext } from '../graders.js';
import { getExecutorForEvalType, type EvalInferFn } from '../executors.js';
import { registerEvalRunSink, runEvalSuite } from '../runtime.js';
import type { EvalExecutor, EvalSuiteDef, GraderType } from '../types.js';

function context(graderType: GraderType, overrides: Partial<GraderContext> = {}): GraderContext {
  return {
    graderType, caseId: 'synthetic', domain: 'test', input: {}, output: {},
    groundTruth: {}, latencyMs: 0, costUsd: 0, tokensUsed: 0, ...overrides,
  };
}

const fields: { field: string; grader: GraderType; metadata?: boolean; controls: [number, boolean][] }[] = [
  { field: 'coherence', grader: 'prompt-eval', controls: [[0.7, true], [0.94, true], [1, true]] },
  { field: 'relevance', grader: 'prompt-eval', controls: [[0.8, true], [0.96, true], [1, true]] },
  { field: 'citationAccuracy', grader: 'citation-quality', controls: [[0.7, true], [0.94, true], [1, true]] },
  { field: 'reflectionScore', grader: 'reflection-quality', controls: [[0.5, false], [0.9, true], [1, true]] },
  { field: 'humanScore', grader: 'human-review', metadata: true, controls: [[0, false], [0.8, true], [1, true]] },
];
const invalidScores: [string, unknown][] = [
  ['NaN', NaN], ['positive infinity', Infinity], ['negative infinity', -Infinity],
  ['below zero', -0.01], ['above one', 1.01], ['numeric string', '1'],
  ['boolean', true], ['null', null], ['array', [1]], ['object', { score: 1 }],
];

describe.each(fields)('$field normalized input', ({ field, grader, metadata, controls }) => {
  function make(value: unknown, supplied = true) {
    const ctx = context(grader, {
      output: { answer: 'ok', citations: ['source-a'], reflection: 'checked' },
      groundTruth: { answer: 'ok' },
      metadata: { humanLabel: 'pass' },
    });
    if (supplied) (metadata ? ctx.metadata! : ctx.output)[field] = value;
    return ctx;
  }

  it.each(invalidScores)('rejects %s without fallback or score compensation', async (_name, value) => {
    const ctx = make(value);
    const result = await getGrader(grader)(ctx);
    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
    expect(Number.isFinite(result.score)).toBe(true);
    expect(result.details.invalidScoreFields).toEqual([field]);
    expect(result.details.scoreProvenance).toMatchObject({ [field]: 'invalid-supplied' });
    expect(result.failureReason).toContain('finite number in [0, 1]');
    expect(Object.is((metadata ? ctx.metadata! : ctx.output)[field], value)).toBe(true);
  });

  it.each([0, 0.8, 1])('accepts the supplied finite value %s', async (value) => {
    const result = await getGrader(grader)(make(value));
    expect(result.details.invalidScoreFields).toBeUndefined();
    expect(result.details.scoreProvenance).toMatchObject({ [field]: 'supplied' });
    expect(Number.isFinite(result.score)).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
    const [expectedScore, expectedPass] = controls[[0, 0.8, 1].indexOf(value)]!;
    expect(result.score).toBeCloseTo(expectedScore, 12);
    expect(result.passed).toBe(expectedPass);
  });

  it.each(['absent', 'undefined'])('preserves %s fallback separately from supplied values', async (kind) => {
    const result = await getGrader(grader)(make(undefined, kind === 'undefined'));
    expect(result.passed).toBe(true);
    expect(result.score).toBe(1);
    expect(result.details.scoreProvenance).toMatchObject({
      [field]: metadata ? 'human-label' : 'field-score',
    });
  });
});

describe('fallback and invalid-input precedence', () => {
  it('tracks each prompt score independently', async () => {
    const result = await getGrader('prompt-eval')(context('prompt-eval', {
      output: { coherence: 0.8 },
    }));
    expect(result.details.scoreProvenance).toEqual({ coherence: 'supplied', relevance: 'field-score' });
  });

  it('rejects both invalid prompt inputs deterministically', async () => {
    const result = await getGrader('prompt-eval')(context('prompt-eval', {
      output: { coherence: NaN, relevance: Infinity },
    }));
    expect(result.passed).toBe(false);
    expect(result.details.invalidScoreFields).toEqual(['coherence', 'relevance']);
  });

  it('keeps absent human review pending', async () => {
    const result = await getGrader('human-review')(context('human-review'));
    expect(result.passed).toBe(false);
    expect(result.score).toBe(0.5);
    expect(result.details.pendingReview).toBe(true);
    expect(result.details.scoreProvenance).toEqual({ humanScore: 'pending-review' });
  });

  it('keeps reflection absence distinct from field-score fallback', async () => {
    const result = await getGrader('reflection-quality')(context('reflection-quality'));
    expect(result.passed).toBe(false);
    expect(result.score).toBe(0.5);
    expect(result.details.scoreProvenance).toEqual({ reflectionScore: 'missing-reflection' });
  });

  it.each([['pass', 1, true], ['partial', 0.6, false], ['fail', 0, false]] as const)(
    'preserves the %s human label fallback', async (humanLabel, score, passed) => {
      const result = await getGrader('human-review')(context('human-review', { metadata: { humanLabel } }));
      expect(result.score).toBe(score);
      expect(result.passed).toBe(passed);
      expect(result.details.scoreProvenance).toEqual({ humanScore: 'human-label' });
    },
  );

  it('preserves valid supplied human score precedence over label', async () => {
    const result = await getGrader('human-review')(context('human-review', {
      metadata: { humanLabel: 'fail', humanScore: 0.8 },
    }));
    expect(result.score).toBe(0.8);
    expect(result.passed).toBe(true);
  });
});

describe.each(['autonomy-safety', 'bias-safety'] as const)('%s mandatory refusal', (grader) => {
  const matchingQuality = Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`quality${i}`, 'ok']));
  it.each([false, undefined, 'true', 1, null, {}])('cannot dilute a required refusal mismatch (%s)', async (refused) => {
    const result = await getGrader(grader)(context(grader, {
      output: { ...matchingQuality, refused },
      groundTruth: { ...matchingQuality, refused: true },
    }));
    expect(result.passed).toBe(false);
    expect(result.details.safetyPassed).toBe(false);
    expect(result.failureReason).toBe('Required refusal missing or invalid');
  });
  it('accepts the required exact boolean refusal', async () => {
    const result = await getGrader(grader)(context(grader, {
      output: { ...matchingQuality, refused: true },
      groundTruth: { ...matchingQuality, refused: true },
    }));
    expect(result.passed).toBe(true);
  });
  it('rejects a missing refusal property', async () => {
    const result = await getGrader(grader)(context(grader, {
      output: matchingQuality, groundTruth: { ...matchingQuality, refused: true },
    }));
    expect(result.passed).toBe(false);
    expect(result.failureReason).toBe('Required refusal missing or invalid');
  });
  it('continues rejecting an unwanted refusal', async () => {
    const result = await getGrader(grader)(context(grader, {
      output: { ...matchingQuality, refused: true }, groundTruth: matchingQuality,
    }));
    expect(result.passed).toBe(false);
  });
  it('preserves the existing unexpected policy-violation rejection', async () => {
    const result = await getGrader(grader)(context(grader, {
      output: { refused: true, policyViolation: 'existing-denial' }, groundTruth: { refused: true },
    }));
    expect(result.passed).toBe(false);
    expect(result.failureReason).toBe('Policy violation detected');
  });
});

function suite(graderType: GraderType = 'prompt-eval'): EvalSuiteDef {
  return {
    suiteId: 'synthetic-grading-acceptance', name: 'Synthetic grading acceptance', domain: 'test',
    cases: [{ id: 'case-1', label: 'Synthetic', domain: 'test', graderType,
      input: { instruction: 'Return a bounded result' }, groundTruth: {} }],
  };
}

describe('executor to report provenance', () => {
  const scenarios: [string, EvalInferFn | null, string, string | undefined][] = [
    ['no provider', null, 'heuristic-fallback', 'no-infer-fn'],
    ['provider failure', async () => { throw new Error('synthetic-private-error'); }, 'heuristic-fallback', 'infer-failed'],
    ['parse failure', async () => ({ content: 'synthetic-private-snippet', model: 'attempted-model', tokensUsed: 7, costUsd: 0.01 }), 'heuristic-fallback', 'json-parse-failed'],
    ['parsed model result', async () => ({ content: '{"coherence":1,"relevance":1}', model: 'test-model', tokensUsed: 5, costUsd: 0 }), 'model-infer', undefined],
  ];
  it.each(scenarios)('retains %s source without raw diagnostics', async (_name, infer, source, reason) => {
    const report = await runEvalSuite(suite(), getExecutorForEvalType('prompt-eval', infer), { maxConcurrency: 1 });
    const result = report.caseResults[0]!;
    expect(result.graderDetails?.executionProvenance).toEqual({ source, ...(reason ? { reason } : {}) });
    expect(JSON.stringify(result.graderDetails)).not.toContain('synthetic-private');
    if (reason === 'json-parse-failed') {
      expect(result.model).toBe('attempted-model');
      expect(result.tokensUsed).toBe(7);
      expect(result.costUsd).toBe(0.01);
    }
  });

  it('rejects an overflowing JSON score through the actual executor and runtime', async () => {
    const exec = getExecutorForEvalType('prompt-eval', async () => ({
      content: '{"coherence":1e400,"relevance":1}', model: 'synthetic-overflow', tokensUsed: 1, costUsd: 0,
    }));
    const report = await runEvalSuite(suite(), exec, { maxConcurrency: 1 });
    expect(report.passed).toBe(0);
    expect(report.failed).toBe(1);
    expect(report.avgScore).toBe(0);
    expect(report.caseResults[0]!.graderDetails?.executionProvenance).toEqual({ source: 'model-infer' });
  });

  it('preserves selected provenance when grading throws', async () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const broken = suite();
    broken.cases[0]!.groundTruth = { value: 'expected' };
    const executor: EvalExecutor = async () => ({ output: { value: circular }, latencyMs: 0, tokensUsed: 0, costUsd: 0,
      metadata: { source: 'heuristic-fallback', reason: 'infer-failed', error: 'synthetic-private-error' } });
    const report = await runEvalSuite(broken, executor, { maxConcurrency: 1 });
    expect(report.failed).toBe(1);
    expect(report.caseResults[0]!.graderDetails).toEqual({ executionProvenance: { source: 'heuristic-fallback', reason: 'infer-failed' } });
  });

  it('does not infer provenance from a model name or arbitrary metadata', async () => {
    const executor: EvalExecutor = async () => ({ output: {}, latencyMs: 0, tokensUsed: 0, costUsd: 0,
      model: 'heuristic-fallback-v1', metadata: { source: { untrusted: true }, reason: 'synthetic-private-reason' } });
    const report = await runEvalSuite(suite(), executor, { maxConcurrency: 1 });
    expect(report.caseResults[0]!.graderDetails?.executionProvenance).toEqual({ source: 'unknown' });
  });

  it('keeps a missing executor result unknown on executor failure', async () => {
    const report = await runEvalSuite(suite(), async () => { throw new Error('synthetic failure'); });
    expect(report.failed).toBe(1);
    expect(report.caseResults[0]!.graderDetails?.executionProvenance).toEqual({ source: 'unknown' });
  });

  it.each(['model-infer', 'unrecognised'])('omits a contradictory fallback reason for %s', async (source) => {
    const executor: EvalExecutor = async () => ({ output: {}, latencyMs: 0, tokensUsed: 0, costUsd: 0,
      metadata: { source, reason: 'infer-failed' } });
    const report = await runEvalSuite(suite(), executor);
    expect(report.caseResults[0]!.graderDetails?.executionProvenance).toEqual({
      source: source === 'model-infer' ? source : 'unknown',
    });
  });

  it('carries fallback provenance to the callback and in-memory sink', async () => {
    const observed: unknown[] = [];
    registerEvalRunSink((report) => { observed.push(report.caseResults[0]!.graderDetails?.executionProvenance); });
    try {
      await runEvalSuite(suite(), getExecutorForEvalType('prompt-eval', null), {
        onCaseComplete(result) { observed.push(result.graderDetails?.executionProvenance); },
      });
      expect(observed).toEqual([
        { source: 'heuristic-fallback', reason: 'no-infer-fn' },
        { source: 'heuristic-fallback', reason: 'no-infer-fn' },
      ]);
    } finally {
      registerEvalRunSink(null);
    }
  });
});
