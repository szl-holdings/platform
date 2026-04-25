import { describe, expect, it } from 'vitest';
import {
  buildSuiteExecutor,
  EVAL_EXECUTOR_FACTORIES,
  type EvalInferFn,
  getExecutorForEvalType,
} from '../executors.js';
import { runEvalSuite } from '../runtime.js';
import { FORGE_SUITES } from '../suites/index.js';
import { ALL_EVAL_TYPES, type EvalType } from '../types.js';

const fakeInferOk =
  (payload: Record<string, unknown>): EvalInferFn =>
  async () => ({
    content: JSON.stringify(payload),
    model: 'test-model-x',
    tokensUsed: 42,
    costUsd: 0.0002,
  });

const fakeInferThrows: EvalInferFn = async () => {
  throw new Error('provider down');
};

describe('EVAL_EXECUTOR_FACTORIES', () => {
  it('registers an executor for every eval type', () => {
    for (const t of ALL_EVAL_TYPES) {
      expect(EVAL_EXECUTOR_FACTORIES[t]).toBeTypeOf('function');
    }
  });
});

describe('heuristic fallback', () => {
  it('returns shaped output when no infer fn is provided', async () => {
    for (const t of ALL_EVAL_TYPES) {
      const exec = getExecutorForEvalType(t, null);
      const r = await exec(
        { instruction: 'x', goal: 'g', claim: 'c', tool: 't', steps: ['a', 'b'] },
        'case-1',
        'test',
      );
      expect(r.model).toBe('heuristic-fallback-v1');
      expect(r.output).toBeTypeOf('object');
      expect(r.metadata?.source).toBe('heuristic-fallback');
    }
  });
});

describe('real-infer path', () => {
  it('forwards parsed JSON from the infer fn into output', async () => {
    const exec = getExecutorForEvalType(
      'verifier',
      fakeInferOk({ verified: true, confidence: 0.9, reasoning: 'ok' }),
    );
    const r = await exec({ claim: 'c', context: 'ctx' }, 'case-1', 'test');
    expect(r.output.verified).toBe(true);
    expect(r.output.confidence).toBe(0.9);
    expect(r.model).toBe('test-model-x');
    expect(r.tokensUsed).toBe(42);
    expect(r.costUsd).toBeCloseTo(0.0002);
  });

  it('falls back to heuristic when infer throws', async () => {
    const exec = getExecutorForEvalType('planning-quality', fakeInferThrows);
    const r = await exec({ goal: 'ship release', risks: ['x'] }, 'case-2', 'test');
    expect(r.model).toBe('heuristic-fallback-v1');
    expect(Array.isArray(r.output.steps)).toBe(true);
    expect(r.metadata?.reason).toBe('infer-failed');
  });

  it('falls back when JSON parsing fails', async () => {
    const exec = getExecutorForEvalType('prompt-eval', async () => ({
      content: 'this is not json',
      model: 'm',
      tokensUsed: 10,
      costUsd: 0.0001,
    }));
    const r = await exec({ instruction: 'summarise' }, 'c', 'd');
    expect(r.metadata?.reason).toBe('json-parse-failed');
    expect(r.output.coherence).toBeDefined();
  });

  it('normalises citation-fidelity output by detecting hallucinated sources', async () => {
    const exec = getExecutorForEvalType(
      'citation-fidelity',
      fakeInferOk({
        citations: ['src-a', 'src-fake'],
        citationAccuracy: 0.5,
        sourceVerified: true,
      }),
    );
    const r = await exec({ query: 'q', availableSources: ['src-a', 'src-b'] }, 'c', 'd');
    expect(r.output.citations).toEqual(['src-a', 'src-fake']);
    expect(r.output.hallucinatedCitation).toBe(true);
    expect(r.output.noHallucinatedCitations).toBe(false);
  });
});

describe('buildSuiteExecutor + runEvalSuite integration', () => {
  it('executes every Counsel suite end-to-end with the heuristic fallback', async () => {
    for (const suite of FORGE_SUITES) {
      const exec = buildSuiteExecutor(suite, null);
      const report = await runEvalSuite(suite, exec, { triggeredBy: 'test', maxConcurrency: 4 });
      expect(report.totalCases).toBe(suite.cases.length);
      // At least one case should produce a graded score (>0 or =0 — either is fine,
      // we mainly want the pipeline to not blow up).
      for (const r of report.caseResults) {
        expect(r.score).toBeGreaterThanOrEqual(0);
        expect(r.score).toBeLessThanOrEqual(1);
      }
    }
  });

  it('executes a suite with a real-ish infer fn returning valid JSON', async () => {
    const suite = FORGE_SUITES.find((s) => s.evalType === 'prompt-eval')!;
    const exec = buildSuiteExecutor(
      suite,
      fakeInferOk({
        answer: 'ok',
        coherence: 0.9,
        relevance: 0.9,
        refused: false,
        sentiment: 'neutral',
      }),
    );
    const report = await runEvalSuite(suite, exec, { triggeredBy: 'test', maxConcurrency: 4 });
    expect(report.totalCases).toBe(suite.cases.length);
    expect(report.totalTokensUsed).toBeGreaterThan(0);
  });
});

describe('eval type coverage', () => {
  it('covers every declared eval type with a dedicated executor factory', () => {
    const types: EvalType[] = ALL_EVAL_TYPES;
    for (const t of types) {
      expect(EVAL_EXECUTOR_FACTORIES[t]).toBeDefined();
    }
  });
});
