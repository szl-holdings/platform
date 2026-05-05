/**
 * Eval Harness HTTP client.
 *
 * Wraps the eval runner REST API with typed methods.
 * Polls for completion automatically so callers get a resolved EvalRunReport.
 */

import type {
  EvalRunReport,
  EvalRunSummary,
  EvalSubmitResponse,
  EvalReproduceResult,
  EvalSuiteManifest,
  HarnessRunOptions,
  HarnessConfig,
  RegressionAnalysis,
} from './types.js';

const DEFAULT_RUNNER_URL = 'http://localhost:8001';
const DEFAULT_POLL_TIMEOUT_MS = 120_000;
const POLL_INTERVAL_MS = 1_500;

export class EvalHarnessClient {
  private readonly baseUrl: string;

  constructor(config: HarnessConfig = {}) {
    this.baseUrl = (
      config.runnerUrl ??
      process.env['EVAL_RUNNER_URL'] ??
      DEFAULT_RUNNER_URL
    ).replace(/\/$/, '');
  }

  // ── Healthcheck ─────────────────────────────────────────────────────────────

  async health(): Promise<{ status: string; version: string; suites_loaded: number }> {
    const resp = await this._fetch('/health');
    return resp as { status: string; version: string; suites_loaded: number };
  }

  // ── Suites ───────────────────────────────────────────────────────────────────

  async listSuites(): Promise<{ suites: EvalSuiteManifest[]; total: number }> {
    const resp = await this._fetch('/suites');
    return resp as { suites: EvalSuiteManifest[]; total: number };
  }

  // ── Submit + poll ────────────────────────────────────────────────────────────

  async submitRun(options: HarnessRunOptions): Promise<EvalSubmitResponse> {
    const resp = await this._fetch('/runs', {
      method: 'POST',
      body: JSON.stringify({
        suite_id: options.suiteId,
        model_id: options.modelId,
        provider: options.provider,
        triggered_by: options.triggeredBy ?? 'ts-facade',
        baseline_run_id: options.baselineRunId ?? null,
        seed: options.seed ?? null,
      }),
    });
    return resp as EvalSubmitResponse;
  }

  async getRun(runId: string): Promise<EvalRunReport | null> {
    try {
      const resp = await this._fetch(`/runs/${runId}`);
      return resp as EvalRunReport;
    } catch (err: unknown) {
      if (err instanceof EvalHarnessError && err.statusCode === 404) return null;
      throw err;
    }
  }

  async listRuns(limit = 50): Promise<{ runs: EvalRunSummary[]; total: number }> {
    const resp = await this._fetch(`/runs?limit=${limit}`);
    return resp as { runs: EvalRunSummary[]; total: number };
  }

  /**
   * Submit a run and poll until it completes or the timeout is reached.
   * Returns the completed EvalRunReport.
   */
  async run(options: HarnessRunOptions): Promise<EvalRunReport> {
    const submitted = await this.submitRun(options);
    const timeoutMs = options.pollTimeoutMs ?? DEFAULT_POLL_TIMEOUT_MS;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      await _sleep(POLL_INTERVAL_MS);
      const report = await this.getRun(submitted.run_id);
      if (report && report.status !== 'pending') {
        return report;
      }
    }

    throw new Error(
      `Eval run ${submitted.run_id} did not complete within ${timeoutMs}ms`,
    );
  }

  // ── Reproduce ────────────────────────────────────────────────────────────────

  /**
   * Reproduce a previous eval run and verify suite manifest determinism.
   *
   * Reproducibility covers the pinned dataset inputs (suite_content_hash) — the
   * same benchmark rows produce the same hash every time, regardless of model
   * responses which are stochastic.
   */
  async reproduce(runId: string): Promise<EvalReproduceResult> {
    const resp = await this._fetch(`/runs/${runId}/reproduce`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    return resp as EvalReproduceResult;
  }

  // ── Verify ───────────────────────────────────────────────────────────────────

  async verify(runId: string): Promise<{ run_id: string; signature_valid: boolean; content_hash: string }> {
    const resp = await this._fetch(`/runs/${runId}/verify`, { method: 'POST', body: '{}' });
    return resp as { run_id: string; signature_valid: boolean; content_hash: string };
  }

  // ── Regression analysis ──────────────────────────────────────────────────────

  async compareRuns(runId: string, baselineRunId: string): Promise<RegressionAnalysis> {
    const [run, baseline] = await Promise.all([
      this.getRun(runId),
      this.getRun(baselineRunId),
    ]);

    if (!run) throw new Error(`Run not found: ${runId}`);
    if (!baseline) throw new Error(`Baseline run not found: ${baselineRunId}`);

    const regressionThreshold = 0.05;
    const regressionCategories: string[] = [];

    for (const [cat, data] of Object.entries(run.categories)) {
      const baselineData = baseline.categories[cat];
      if (!baselineData) continue;
      if (data.pass_rate < baselineData.pass_rate - regressionThreshold) {
        regressionCategories.push(cat);
      }
    }

    const passRateDelta = run.pass_rate - baseline.pass_rate;
    const scoreDelta = run.aggregate_score - baseline.aggregate_score;
    const regressed =
      passRateDelta < -regressionThreshold || regressionCategories.length > 0;

    return {
      run_id: runId,
      baseline_run_id: baselineRunId,
      suite_id: run.suite_id,
      model_id: run.model_id,
      regressed,
      regression_categories: regressionCategories,
      pass_rate_delta: passRateDelta,
      aggregate_score_delta: scoreDelta,
      baseline_pass_rate: baseline.pass_rate,
      current_pass_rate: run.pass_rate,
      baseline_aggregate_score: baseline.aggregate_score,
      current_aggregate_score: run.aggregate_score,
      analysed_at: Date.now(),
    };
  }

  // ── Internal ─────────────────────────────────────────────────────────────────

  private async _fetch(path: string, init: RequestInit = {}): Promise<unknown> {
    const url = `${this.baseUrl}${path}`;
    const resp = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    });

    if (!resp.ok) {
      let detail = '';
      try {
        const body = await resp.json() as { detail?: string };
        detail = body?.detail ?? '';
      } catch {
        // ignore parse errors
      }
      throw new EvalHarnessError(
        `Eval runner request failed: ${resp.status} ${resp.statusText}${detail ? ` — ${detail}` : ''}`,
        resp.status,
        url,
      );
    }

    return resp.json();
  }
}

export class EvalHarnessError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly url: string,
  ) {
    super(message);
    this.name = 'EvalHarnessError';
  }
}

function _sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Default singleton client — reads config from environment. */
export const evalHarness = new EvalHarnessClient();
