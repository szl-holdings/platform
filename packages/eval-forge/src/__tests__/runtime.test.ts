import { describe, expect, it } from 'vitest';
import { checkRunRegression, runEvalSuite } from '../runtime.js';
import { promptEvalSuite } from '../suites/prompt-eval.js';
import type { EvalExecutor, EvalRunReport } from '../types.js';

const stubExecutor: EvalExecutor = async (input, _caseId, _domain) => {
  const start = Date.now();
  await new Promise((r) => setTimeout(r, 5));
  return {
    output: {
      ...input,
      _stub: true,
      confidence: 0.8,
      coherence: 0.85,
      relevance: 0.9,
    },
    model: 'stub-v1',
    latencyMs: Date.now() - start,
    tokensUsed: 100,
    costUsd: 0.0001,
  };
};

describe('runEvalSuite', () => {
  it('runs all cases and returns a report with all 9 metrics', async () => {
    const report = await runEvalSuite(promptEvalSuite, stubExecutor, {
      triggeredBy: 'test',
    });
    expect(report.runId).toBeDefined();
    expect(report.suiteId).toBe(promptEvalSuite.suiteId);
    expect(report.totalCases).toBe(promptEvalSuite.cases.length);
    expect(report.caseResults).toHaveLength(promptEvalSuite.cases.length);
    expect(report.passRate).toBeGreaterThanOrEqual(0);
    expect(report.passRate).toBeLessThanOrEqual(1);
    expect(report.metrics).toBeDefined();
    expect(report.metrics).toHaveProperty('correctness');
    expect(report.metrics).toHaveProperty('evidenceQuality');
    expect(report.metrics).toHaveProperty('confidenceCalibration');
    expect(report.metrics).toHaveProperty('latency');
    expect(report.metrics).toHaveProperty('cost');
    expect(report.metrics).toHaveProperty('interventionValue');
    expect(report.metrics).toHaveProperty('humanOverrideRate');
    expect(report.metrics).toHaveProperty('rollbackRate');
    expect(report.metrics).toHaveProperty('policyViolations');
  });

  it('captures evalType from suite', async () => {
    const report = await runEvalSuite(promptEvalSuite, stubExecutor);
    expect(report.evalType).toBe('prompt-eval');
  });

  it('handles executor errors gracefully', async () => {
    const errorExecutor: EvalExecutor = async () => {
      throw new Error('Executor failure');
    };
    const report = await runEvalSuite(promptEvalSuite, errorExecutor);
    expect(report.totalCases).toBe(promptEvalSuite.cases.length);
    expect(report.passed).toBe(0);
    expect(report.failed).toBe(promptEvalSuite.cases.length);
    for (const r of report.caseResults) {
      expect(r.passed).toBe(false);
      expect(r.failureReason).toContain('Executor failure');
    }
  });

  it('sets correct triggeredBy', async () => {
    const report = await runEvalSuite(promptEvalSuite, stubExecutor, {
      triggeredBy: 'ci',
    });
    expect(report.triggeredBy).toBe('ci');
  });
});

describe('checkRunRegression', () => {
  function makeReport(overrides: Partial<EvalRunReport> = {}): EvalRunReport {
    return {
      runId: 'run-test',
      suiteId: 'test-suite',
      runAt: new Date().toISOString(),
      triggeredBy: 'test',
      totalCases: 10,
      passed: 8,
      failed: 2,
      passRate: 0.8,
      avgScore: 0.85,
      avgLatencyMs: 200,
      totalCostUsd: 0.01,
      totalTokensUsed: 1000,
      metrics: {} as EvalRunReport['metrics'],
      caseResults: [],
      ...overrides,
    };
  }

  it('detects no regression when values are stable', () => {
    const baseline = makeReport({ passRate: 0.8, avgScore: 0.85 });
    const current = makeReport({ passRate: 0.81, avgScore: 0.86 });
    const result = checkRunRegression(baseline, current);
    expect(result.hasRegression).toBe(false);
    expect(result.severity).toBe('none');
  });

  it('detects regression when pass rate drops significantly', () => {
    const baseline = makeReport({ passRate: 0.9, avgScore: 0.9 });
    const current = makeReport({ passRate: 0.7, avgScore: 0.75 });
    const result = checkRunRegression(baseline, current);
    expect(result.hasRegression).toBe(true);
    expect(result.severity).not.toBe('none');
    expect(result.regressionNotes.length).toBeGreaterThan(0);
  });

  it('reports improvement notes when metrics improve', () => {
    const baseline = makeReport({ passRate: 0.7, avgScore: 0.75 });
    const current = makeReport({ passRate: 0.9, avgScore: 0.9 });
    const result = checkRunRegression(baseline, current, 5);
    expect(result.improvementNotes.length).toBeGreaterThan(0);
    expect(result.hasRegression).toBe(false);
  });

  it('classifies critical regression for large drops', () => {
    const baseline = makeReport({ passRate: 0.95, avgScore: 0.95 });
    const current = makeReport({ passRate: 0.5, avgScore: 0.5 });
    const result = checkRunRegression(baseline, current);
    expect(result.severity).toBe('critical');
  });
});
