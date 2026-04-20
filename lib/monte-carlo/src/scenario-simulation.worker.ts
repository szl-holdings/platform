/// <reference lib="webworker" />
import {
  type MonteCarloResult,
  runScenarioSimulation,
  type ScenarioShardSamples,
  type SimulationProgress,
  simulateScenarioShard,
} from './scenario-simulation.js';
import { getScenarioById } from './scenarios.js';

export interface ScenarioSimulationRequest {
  requestId: number;
  scenarioId: string;
  iterations: number;
  /**
   * If "shard", the worker returns raw {@link ScenarioShardSamples} so the
   * caller can merge multiple shards from a worker pool. Defaults to "full"
   * which returns a complete {@link MonteCarloResult}.
   */
  mode?: 'full' | 'shard';
}

export type ScenarioSimulationResponse =
  | {
      requestId: number;
      type: 'progress';
      completed: number;
      total: number;
      validIterations: number;
    }
  | {
      requestId: number;
      type: 'result';
      ok: true;
      mode: 'full';
      result: MonteCarloResult;
    }
  | {
      requestId: number;
      type: 'result';
      ok: true;
      mode: 'shard';
      shard: ScenarioShardSamples;
      durationMs: number;
    }
  | {
      requestId: number;
      type: 'error';
      ok: false;
      error: string;
    };

const PROGRESS_THRESHOLD = 10_000;

const ctx = self as unknown as DedicatedWorkerGlobalScope;

function nowMs(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

ctx.addEventListener('message', (event: MessageEvent<ScenarioSimulationRequest>) => {
  const { requestId, scenarioId, iterations, mode } = event.data;
  try {
    const scenario = getScenarioById(scenarioId);
    if (!scenario) {
      const response: ScenarioSimulationResponse = {
        requestId,
        type: 'error',
        ok: false,
        error: `Unknown scenario: ${scenarioId}`,
      };
      ctx.postMessage(response);
      return;
    }
    const emitProgress = iterations >= PROGRESS_THRESHOLD;
    const onProgress = emitProgress
      ? (p: SimulationProgress) => {
          const msg: ScenarioSimulationResponse = {
            requestId,
            type: 'progress',
            completed: p.completed,
            total: p.total,
            validIterations: p.validIterations,
          };
          ctx.postMessage(msg);
        }
      : undefined;

    if (mode === 'shard') {
      const start = nowMs();
      const shard = simulateScenarioShard(scenario, iterations, { onProgress });
      const durationMs = nowMs() - start;
      const response: ScenarioSimulationResponse = {
        requestId,
        type: 'result',
        ok: true,
        mode: 'shard',
        shard,
        durationMs,
      };
      ctx.postMessage(response);
      return;
    }
    const result = runScenarioSimulation(scenario, iterations, { onProgress });
    const response: ScenarioSimulationResponse = {
      requestId,
      type: 'result',
      ok: true,
      mode: 'full',
      result,
    };
    ctx.postMessage(response);
  } catch (err) {
    const response: ScenarioSimulationResponse = {
      requestId,
      type: 'error',
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
    ctx.postMessage(response);
  }
});
