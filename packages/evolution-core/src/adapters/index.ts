/**
 * Runtime Adapter Layer — Layer: Runtime Adapters (Phase 3)
 *
 * Vendor-neutral interfaces for inference, training, and evaluation backends.
 * Ships with:
 *   - local_mock: pure in-process mock for tests
 *   - local_safe: simulation-labelled adapter for Replit demo mode
 *
 * The nvidia-adapters NIM endpoint manager is plugged in behind InferenceBackendAdapter
 * via the NvidiaInferenceAdapter below — it is one option, not the default.
 */

import type {
  BackendHealthCheck,
  EvaluationBackendAdapter,
  EvaluationRunSummary,
  InferenceBackendAdapter,
  InferenceRequest,
  InferenceResponse,
  TrainingBackendAdapter,
} from '../types.js';
import { randomUUID } from 'node:crypto';

// ─── Local Mock Adapter (tests) ────────────────────────────────────────────

export class LocalMockInferenceAdapter implements InferenceBackendAdapter {
  readonly backendId = 'local_mock';
  readonly simulated = true;

  async infer(req: InferenceRequest): Promise<InferenceResponse> {
    const latencyMs = 12 + Math.floor(Math.random() * 50);
    await new Promise((r) => setTimeout(r, latencyMs));
    return {
      output: `[MOCK] Response to: ${req.prompt.slice(0, 60)}`,
      tokensIn: Math.ceil(req.prompt.length / 4),
      tokensOut: 40,
      latencyMs,
      costUsd: 0,
      modelId: 'mock-model-v1',
      backend: this.backendId,
      simulated: true,
    };
  }

  async healthCheck(): Promise<BackendHealthCheck> {
    return { healthy: true, latencyMs: 1, backend: this.backendId };
  }
}

export class LocalMockTrainingAdapter implements TrainingBackendAdapter {
  readonly backendId = 'local_mock';
  readonly simulated = true;

  async launch(_jobSpec: Record<string, unknown>): Promise<{ jobId: string }> {
    return { jobId: `mock-job-${randomUUID()}` };
  }

  async getStatus(_jobId: string): Promise<{ status: string; progress: number }> {
    return { status: 'completed', progress: 1.0 };
  }

  async healthCheck(): Promise<BackendHealthCheck> {
    return { healthy: true, latencyMs: 1, backend: this.backendId };
  }
}

export class LocalMockEvaluationAdapter implements EvaluationBackendAdapter {
  readonly backendId = 'local_mock';
  readonly simulated = true;

  async runSuite(suiteId: string, candidateId: string): Promise<EvaluationRunSummary> {
    const total = 20;
    const passed = Math.floor(total * (0.7 + Math.random() * 0.25));
    return {
      runId: `mock-run-${randomUUID()}`,
      candidateId,
      status: 'completed',
      passRate: passed / total,
      avgScoreTotal: 0.72 + Math.random() * 0.2,
      avgLatencyMs: 80 + Math.random() * 120,
      totalCases: total,
      passed,
      failed: total - passed,
      hasRegression: false,
      regressionSeverity: 'none',
      coverageThresholdMet: true,
      simulated: true,
    };
  }

  async healthCheck(): Promise<BackendHealthCheck> {
    return { healthy: true, latencyMs: 1, backend: this.backendId };
  }
}

// ─── Local Safe Adapter (Replit demo mode) ─────────────────────────────────

/**
 * Produces simulation-labelled outputs with realistic synthetic telemetry.
 * Every response carries simulated=true and is labelled in the UI.
 * Never presented as real GPU-accelerated execution.
 */
export class LocalSafeInferenceAdapter implements InferenceBackendAdapter {
  readonly backendId = 'local_safe';
  readonly simulated = true;

  async infer(req: InferenceRequest): Promise<InferenceResponse> {
    const latencyMs = 45 + Math.floor(Math.random() * 200);
    await new Promise((r) => setTimeout(r, Math.min(latencyMs, 300)));
    const tokensIn = Math.ceil((req.prompt.length + (req.systemPrompt?.length ?? 0)) / 4);
    const tokensOut = 60 + Math.floor(Math.random() * 100);
    return {
      output: generateSimulatedOutput(req.prompt),
      tokensIn,
      tokensOut,
      latencyMs,
      costUsd: 0,
      modelId: 'local-safe-sim-v1',
      backend: this.backendId,
      simulated: true,
    };
  }

  async healthCheck(): Promise<BackendHealthCheck> {
    return { healthy: true, latencyMs: 2, backend: this.backendId, message: 'Simulation mode — local safe adapter' };
  }
}

export class LocalSafeTrainingAdapter implements TrainingBackendAdapter {
  readonly backendId = 'local_safe';
  readonly simulated = true;

  async launch(_jobSpec: Record<string, unknown>): Promise<{ jobId: string }> {
    return { jobId: `sim-job-${randomUUID()}` };
  }

  async getStatus(_jobId: string): Promise<{ status: string; progress: number }> {
    return { status: 'simulated_complete', progress: 1.0 };
  }

  async healthCheck(): Promise<BackendHealthCheck> {
    return { healthy: true, latencyMs: 2, backend: this.backendId, message: 'Simulation mode' };
  }
}

export class LocalSafeEvaluationAdapter implements EvaluationBackendAdapter {
  readonly backendId = 'local_safe';
  readonly simulated = true;

  async runSuite(_suiteId: string, candidateId: string): Promise<EvaluationRunSummary> {
    const total = 30 + Math.floor(Math.random() * 20);
    const passRate = 0.74 + Math.random() * 0.22;
    const passed = Math.floor(total * passRate);
    return {
      runId: `sim-run-${randomUUID()}`,
      candidateId,
      status: 'completed',
      passRate,
      avgScoreTotal: passRate * 0.95,
      avgLatencyMs: 120 + Math.random() * 180,
      totalCases: total,
      passed,
      failed: total - passed,
      hasRegression: Math.random() < 0.15,
      regressionSeverity: Math.random() < 0.08 ? 'minor' : 'none',
      coverageThresholdMet: passRate > 0.70,
      simulated: true,
    };
  }

  async healthCheck(): Promise<BackendHealthCheck> {
    return { healthy: true, latencyMs: 2, backend: this.backendId, message: 'Simulation mode' };
  }
}

// ─── NVIDIA NIM Adapter (wraps packages/nvidia-adapters) ──────────────────

/**
 * Wraps the existing NimEndpointManager behind the InferenceBackendAdapter interface.
 * nvidia-adapters is one option; it does not define the contract.
 */
export class NvidiaInferenceAdapter implements InferenceBackendAdapter {
  readonly backendId = 'nvidia_nim';
  readonly simulated = false;

  async infer(req: InferenceRequest): Promise<InferenceResponse> {
    try {
      const { nimEndpointManager } = await import('@szl-holdings/nvidia-adapters');
      const endpoints = nimEndpointManager.getAvailableEndpoints();
      if (endpoints.length === 0) throw new Error('No NIM endpoints configured');
      const endpoint = endpoints[0]!;
      const start = Date.now();
      const result = await nimEndpointManager.complete(endpoint.id, {
        model: endpoint.modelId,
        messages: [
          ...(req.systemPrompt ? [{ role: 'system' as const, content: req.systemPrompt }] : []),
          { role: 'user' as const, content: req.prompt },
        ],
        max_tokens: req.maxTokens ?? 512,
        temperature: req.temperature ?? 0.1,
      });
      const latencyMs = Date.now() - start;
      return {
        output: result.choices[0]?.message.content ?? '',
        tokensIn: result.usage?.prompt_tokens ?? 0,
        tokensOut: result.usage?.completion_tokens ?? 0,
        latencyMs,
        costUsd: 0,
        modelId: endpoint.modelId,
        backend: this.backendId,
        simulated: false,
      };
    } catch {
      throw new Error('NIM inference failed — check REMOTE_INFERENCE_HEALTH_URL and NIM endpoint config');
    }
  }

  async healthCheck(): Promise<BackendHealthCheck> {
    const healthUrl = process.env.REMOTE_INFERENCE_HEALTH_URL;
    if (!healthUrl) return { healthy: false, latencyMs: 0, backend: this.backendId, message: 'REMOTE_INFERENCE_HEALTH_URL not set' };
    try {
      const start = Date.now();
      const resp = await fetch(healthUrl, { signal: AbortSignal.timeout(3000) });
      return { healthy: resp.ok, latencyMs: Date.now() - start, backend: this.backendId };
    } catch (e) {
      return { healthy: false, latencyMs: 0, backend: this.backendId, message: String(e) };
    }
  }
}

// ─── Adapter Registry ─────────────────────────────────────────────────────

export function createInferenceAdapter(backendId: string): InferenceBackendAdapter {
  switch (backendId) {
    case 'local_mock': return new LocalMockInferenceAdapter();
    case 'nvidia_nim': return new NvidiaInferenceAdapter();
    case 'local_safe':
    default:
      return new LocalSafeInferenceAdapter();
  }
}

export function createTrainingAdapter(backendId: string): TrainingBackendAdapter {
  switch (backendId) {
    case 'local_mock': return new LocalMockTrainingAdapter();
    case 'local_safe':
    default:
      return new LocalSafeTrainingAdapter();
  }
}

export function createEvaluationAdapter(backendId: string): EvaluationBackendAdapter {
  switch (backendId) {
    case 'local_mock': return new LocalMockEvaluationAdapter();
    case 'local_safe':
    default:
      return new LocalSafeEvaluationAdapter();
  }
}

function generateSimulatedOutput(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes('risk') || lower.includes('threat')) {
    return JSON.stringify({
      riskLevel: 'medium',
      riskScore: 62,
      escalationRequired: false,
      confidence: 0.81,
      reasoning: 'Simulated assessment — local_safe adapter',
      simulated: true,
    });
  }
  return JSON.stringify({
    actionType: 'review',
    confidence: 0.77,
    reasoning: 'Simulated response — local_safe adapter',
    simulated: true,
  });
}
