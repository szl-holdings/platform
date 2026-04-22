import { createLogger } from './logger.js';
import { type PromptEvalMetadata, promptRegistry } from './registry.js';

const logger = createLogger('prompt-registry:evaluator');

export interface EvalCase {
  id: string;
  promptId: string;
  input: Record<string, unknown>;
  expectedOutput?: string;
  expectedKeywords?: string[];
  expectJson?: boolean;
  expectedJsonSchema?: Record<string, unknown>;
  weight?: number;
}

export interface EvalRunResult {
  caseId: string;
  passed: boolean;
  score: number;
  latencyMs: number;
  actualOutput?: string;
  failureReason?: string;
}

export interface EvalReport {
  promptId: string;
  versionId: string;
  suiteId?: string;
  runAt: string;
  passRate: number;
  avgScore: number;
  avgLatencyMs: number;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  results: EvalRunResult[];
  comparedToVersionId?: string;
  improvement?: number;
}

export interface EvalSuite {
  id: string;
  promptId: string;
  description: string;
  cases: EvalCase[];
  createdAt: string;
}

export interface VersionComparison {
  promptId: string;
  baseVersionId: string;
  candidateVersionId: string;
  baseEval?: PromptEvalMetadata;
  candidateEval?: PromptEvalMetadata;
  scoreImprovement?: number;
  passRateImprovement?: number;
  latencyDeltaMs?: number;
  recommendation: 'promote' | 'hold' | 'reject';
  reason: string;
}

class PromptEvaluator {
  private suites: Map<string, EvalSuite> = new Map();
  private reports: EvalReport[] = [];

  createSuite(params: Omit<EvalSuite, 'id' | 'createdAt'> & { id?: string }): EvalSuite {
    const suite: EvalSuite = {
      ...params,
      id: params.id ?? `suite-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.suites.set(suite.id, suite);
    logger.info(
      { suiteId: suite.id, promptId: suite.promptId, caseCount: suite.cases.length },
      'Eval suite created',
    );
    return suite;
  }

  getSuite(id: string): EvalSuite | undefined {
    return this.suites.get(id);
  }

  listSuites(promptId?: string): EvalSuite[] {
    const all = Array.from(this.suites.values());
    return promptId ? all.filter((s) => s.promptId === promptId) : all;
  }

  async run(
    promptId: string,
    versionId: string,
    suiteId: string,
    executor: (
      prompt: string,
      input: Record<string, unknown>,
    ) => Promise<{ output: string; latencyMs: number }>,
  ): Promise<EvalReport> {
    const suite = this.suites.get(suiteId);
    if (!suite) throw new Error(`Eval suite '${suiteId}' not found`);

    const version = promptRegistry.getVersion(promptId, versionId);
    if (!version) throw new Error(`Prompt version '${versionId}' not found`);

    const results: EvalRunResult[] = [];

    for (const evalCase of suite.cases) {
      const rendered = this.renderTemplate(version.template, evalCase.input);
      const start = Date.now();
      try {
        const { output, latencyMs } = await executor(rendered, evalCase.input);
        const { passed, score, failureReason } = this.scoreOutput(output, evalCase);
        results.push({
          caseId: evalCase.id,
          passed,
          score,
          latencyMs,
          actualOutput: output.slice(0, 500),
          failureReason,
        });
      } catch (err) {
        const latencyMs = Date.now() - start;
        results.push({
          caseId: evalCase.id,
          passed: false,
          score: 0,
          latencyMs,
          failureReason: err instanceof Error ? err.message : 'Execution error',
        });
      }
    }

    const passedCases = results.filter((r) => r.passed).length;
    const passRate = suite.cases.length > 0 ? passedCases / suite.cases.length : 0;
    const avgScore =
      results.length > 0 ? results.reduce((s, r) => s + r.score, 0) / results.length : 0;
    const avgLatencyMs =
      results.length > 0 ? results.reduce((s, r) => s + r.latencyMs, 0) / results.length : 0;

    const report: EvalReport = {
      promptId,
      versionId,
      suiteId,
      runAt: new Date().toISOString(),
      passRate,
      avgScore,
      avgLatencyMs,
      totalCases: suite.cases.length,
      passedCases,
      failedCases: suite.cases.length - passedCases,
      results,
    };

    this.reports.unshift(report);
    if (this.reports.length > 1000) this.reports.length = 1000;

    promptRegistry.updateEvalMetadata(promptId, versionId, {
      lastEvalAt: report.runAt,
      score: avgScore,
      passRate,
      avgLatencyMs,
      sampleCount: suite.cases.length,
      evalSuite: suiteId,
      passedCases,
      failedCases: suite.cases.length - passedCases,
    });

    logger.info({ promptId, versionId, passRate, avgScore }, 'Eval run complete');
    return report;
  }

  compare(promptId: string, baseVersionId: string, candidateVersionId: string): VersionComparison {
    const baseVersion = promptRegistry.getVersion(promptId, baseVersionId);
    const candidateVersion = promptRegistry.getVersion(promptId, candidateVersionId);

    if (!baseVersion || !candidateVersion) {
      throw new Error('One or both versions not found');
    }

    const base = baseVersion.evalMetadata;
    const candidate = candidateVersion.evalMetadata;

    let recommendation: VersionComparison['recommendation'] = 'hold';
    let reason = 'Insufficient eval data for comparison';

    if (base && candidate) {
      const scoreImprovement = (candidate.score ?? 0) - (base.score ?? 0);
      const passRateImprovement = (candidate.passRate ?? 0) - (base.passRate ?? 0);
      const latencyDelta = (candidate.avgLatencyMs ?? 0) - (base.avgLatencyMs ?? 0);

      if (scoreImprovement > 0.05 && passRateImprovement >= 0) {
        recommendation = 'promote';
        reason = `Score improved by ${(scoreImprovement * 100).toFixed(1)}% with no pass rate regression`;
      } else if (scoreImprovement < -0.05 || passRateImprovement < -0.05) {
        recommendation = 'reject';
        reason = `Score or pass rate regressed vs baseline`;
      } else {
        recommendation = 'hold';
        reason = 'Improvement below promotion threshold (5%)';
      }

      return {
        promptId,
        baseVersionId,
        candidateVersionId,
        baseEval: base,
        candidateEval: candidate,
        scoreImprovement,
        passRateImprovement,
        latencyDeltaMs: latencyDelta,
        recommendation,
        reason,
      };
    }

    return {
      promptId,
      baseVersionId,
      candidateVersionId,
      baseEval: base,
      candidateEval: candidate,
      recommendation,
      reason,
    };
  }

  getReports(promptId?: string, limit = 50): EvalReport[] {
    const filtered = promptId ? this.reports.filter((r) => r.promptId === promptId) : this.reports;
    return filtered.slice(0, limit);
  }

  private renderTemplate(template: string, variables: Record<string, unknown>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(variables[key] ?? ''));
  }

  private scoreOutput(
    output: string,
    evalCase: EvalCase,
  ): { passed: boolean; score: number; failureReason?: string } {
    let score = 1.0;
    const failures: string[] = [];

    if (evalCase.expectedKeywords?.length) {
      const missing = evalCase.expectedKeywords.filter(
        (k) => !output.toLowerCase().includes(k.toLowerCase()),
      );
      if (missing.length > 0) {
        score -= (missing.length / evalCase.expectedKeywords.length) * 0.5;
        failures.push(`Missing keywords: ${missing.join(', ')}`);
      }
    }

    if (evalCase.expectJson) {
      try {
        const parsed = JSON.parse(output.match(/\{[\s\S]*\}|\[[\s\S]*\]/)?.[0] ?? output);
        if (evalCase.expectedJsonSchema) {
          const missingFields = Object.keys(evalCase.expectedJsonSchema).filter(
            (k) => !(k in parsed),
          );
          if (missingFields.length > 0) {
            score -= 0.3;
            failures.push(`Missing JSON fields: ${missingFields.join(', ')}`);
          }
        }
      } catch {
        score -= 0.5;
        failures.push('Output is not valid JSON');
      }
    }

    if (evalCase.expectedOutput) {
      const similarity = this.roughSimilarity(output, evalCase.expectedOutput);
      score = score * 0.5 + similarity * 0.5;
      if (similarity < 0.3) failures.push('Low similarity to expected output');
    }

    score = Math.max(0, Math.min(1, score));
    const passed = score >= 0.6;
    return { passed, score, failureReason: failures.length > 0 ? failures.join('; ') : undefined };
  }

  private roughSimilarity(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().split(/\s+/));
    const wordsB = new Set(b.toLowerCase().split(/\s+/));
    const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
    const union = new Set([...wordsA, ...wordsB]);
    return union.size > 0 ? intersection.size / union.size : 0;
  }
}

export const promptEvaluator = new PromptEvaluator();
export { PromptEvaluator };
