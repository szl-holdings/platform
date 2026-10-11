import { createLogger } from './logger.js';
import { scoreLocalAdapterCase, type LocalAdapterStrategy } from './token-overlap.js';

const logger = createLogger('nvidia-adapters:nemo');

export interface NemoEvalCase {
  id: string;
  input: string;
  expectedOutput?: string;
  expectedKeywords?: string[];
  domain?: string;
  category?: string;
  weight?: number;
}

export interface NemoEvalConfig {
  suiteId: string;
  description: string;
  modelId: string;
  endpointUrl?: string;
  cases: NemoEvalCase[];
  scoringStrategy: LocalAdapterStrategy;
  passThreshold: number;
  tags: string[];
}

export interface NemoEvalRunResult {
  caseId: string;
  passed: boolean;
  score: number;
  latencyMs: number;
  actualOutput?: string;
  failureReason?: string;
}

export interface NemoEvalReport {
  suiteId: string;
  modelId: string;
  runId: string;
  runAt: string;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  passRate: number;
  avgScore: number;
  avgLatencyMs: number;
  results: NemoEvalRunResult[];
  passedThreshold: boolean;
  recommendation: 'promote' | 'hold' | 'reject';
  evaluator: 'local-token-adapter';
}

export interface NemoObservabilityEvent {
  eventId: string;
  type: 'model_call' | 'eval_run' | 'threshold_breach' | 'model_degradation' | 'latency_spike';
  modelId: string;
  suiteId?: string;
  severity: 'info' | 'warn' | 'critical';
  payload: Record<string, unknown>;
  timestamp: string;
}

class NemoHooks {
  private suites: Map<string, NemoEvalConfig> = new Map();
  private reports: NemoEvalReport[] = [];
  private events: NemoObservabilityEvent[] = [];
  private readonly MAX_EVENTS = 5000;

  registerSuite(config: NemoEvalConfig): void {
    this.suites.set(config.suiteId, config);
    logger.info(
      { suiteId: config.suiteId, caseCount: config.cases.length, model: config.modelId },
      'NeMo eval suite registered',
    );
  }

  getSuite(suiteId: string): NemoEvalConfig | undefined {
    return this.suites.get(suiteId);
  }

  listSuites(): NemoEvalConfig[] {
    return Array.from(this.suites.values());
  }

  async runEval(
    suiteId: string,
    inferenceFn: (input: string) => Promise<{ output: string; latencyMs: number }>,
  ): Promise<NemoEvalReport> {
    const suite = this.suites.get(suiteId);
    if (!suite) throw new Error(`NeMo eval suite '${suiteId}' not found`);

    const runId = `nemo-run-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const results: NemoEvalRunResult[] = [];

    for (const evalCase of suite.cases) {
      const start = Date.now();
      try {
        const { output, latencyMs } = await inferenceFn(evalCase.input);
        const { passed, score, failureReason } = this.scoreCase(
          output,
          evalCase,
          suite.scoringStrategy,
        );
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
          failureReason: String(err),
        });
      }
    }

    const passedCases = results.filter((r) => r.passed).length;
    const passRate = suite.cases.length > 0 ? passedCases / suite.cases.length : 0;
    const avgScore =
      results.length > 0 ? results.reduce((s, r) => s + r.score, 0) / results.length : 0;
    const avgLatencyMs =
      results.length > 0 ? results.reduce((s, r) => s + r.latencyMs, 0) / results.length : 0;
    const passedThreshold = passRate >= suite.passThreshold;

    const recommendation: NemoEvalReport['recommendation'] =
      passRate >= suite.passThreshold + 0.1
        ? 'promote'
        : passRate >= suite.passThreshold
          ? 'hold'
          : 'reject';

    const report: NemoEvalReport = {
      suiteId,
      modelId: suite.modelId,
      runId,
      runAt: new Date().toISOString(),
      totalCases: suite.cases.length,
      passedCases,
      failedCases: suite.cases.length - passedCases,
      passRate,
      avgScore,
      avgLatencyMs,
      results,
      passedThreshold,
      recommendation,
      evaluator: 'local-token-adapter',
    };

    this.reports.unshift(report);
    if (this.reports.length > 200) this.reports.length = 200;

    this.emitEvent({
      type: 'eval_run',
      modelId: suite.modelId,
      suiteId,
      severity: passedThreshold ? 'info' : 'warn',
      payload: { runId, passRate, avgScore, recommendation },
    });

    if (!passedThreshold) {
      this.emitEvent({
        type: 'threshold_breach',
        modelId: suite.modelId,
        suiteId,
        severity: 'critical',
        payload: { passRate, threshold: suite.passThreshold, runId },
      });
    }

    logger.info(
      { suiteId, modelId: suite.modelId, passRate, recommendation },
      'local token-overlap eval complete',
    );
    return report;
  }

  emitEvent(params: Omit<NemoObservabilityEvent, 'eventId' | 'timestamp'>): NemoObservabilityEvent {
    const event: NemoObservabilityEvent = {
      ...params,
      eventId: `nemo-evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.events.unshift(event);
    if (this.events.length > this.MAX_EVENTS) this.events.length = this.MAX_EVENTS;
    logger.debug(
      { type: event.type, severity: event.severity, modelId: event.modelId },
      'NeMo observability event',
    );
    return event;
  }

  getEvents(
    filters: {
      type?: NemoObservabilityEvent['type'];
      severity?: string;
      modelId?: string;
      limit?: number;
    } = {},
  ): NemoObservabilityEvent[] {
    let results = this.events;
    if (filters.type) results = results.filter((e) => e.type === filters.type);
    if (filters.severity) results = results.filter((e) => e.severity === filters.severity);
    if (filters.modelId) results = results.filter((e) => e.modelId === filters.modelId);
    return results.slice(0, filters.limit ?? 100);
  }

  getReports(suiteId?: string, limit = 50): NemoEvalReport[] {
    const filtered = suiteId ? this.reports.filter((r) => r.suiteId === suiteId) : this.reports;
    return filtered.slice(0, limit);
  }

  private scoreCase(
    output: string,
    evalCase: NemoEvalCase,
    strategy: NemoEvalConfig['scoringStrategy'],
  ): { passed: boolean; score: number; failureReason?: string } {
    const scored = scoreLocalAdapterCase(output, evalCase, strategy);
    return {
      passed: scored.passed,
      score: scored.score,
      failureReason: scored.failureReason,
    };
  }
}

export const nemoHooks = new NemoHooks();
export { NemoHooks };
