/// <reference lib="webworker" />
import { runScenarioSimulation, type MonteCarloResult } from "./scenario-simulation.js";
import { getScenarioById } from "./scenarios.js";

export interface ScenarioSimulationRequest {
  requestId: number;
  scenarioId: string;
  iterations: number;
}

export type ScenarioSimulationResponse =
  | {
      requestId: number;
      type: "progress";
      completed: number;
      total: number;
      validIterations: number;
    }
  | { requestId: number; type: "result"; ok: true; result: MonteCarloResult }
  | { requestId: number; type: "error"; ok: false; error: string };

const PROGRESS_THRESHOLD = 10000;

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.addEventListener("message", (event: MessageEvent<ScenarioSimulationRequest>) => {
  const { requestId, scenarioId, iterations } = event.data;
  try {
    const scenario = getScenarioById(scenarioId);
    if (!scenario) {
      const response: ScenarioSimulationResponse = {
        requestId,
        type: "error",
        ok: false,
        error: `Unknown scenario: ${scenarioId}`,
      };
      ctx.postMessage(response);
      return;
    }
    const emitProgress = iterations >= PROGRESS_THRESHOLD;
    const result = runScenarioSimulation(scenario, iterations, {
      onProgress: emitProgress
        ? (p) => {
            const msg: ScenarioSimulationResponse = {
              requestId,
              type: "progress",
              completed: p.completed,
              total: p.total,
              validIterations: p.validIterations,
            };
            ctx.postMessage(msg);
          }
        : undefined,
    });
    const response: ScenarioSimulationResponse = {
      requestId,
      type: "result",
      ok: true,
      result,
    };
    ctx.postMessage(response);
  } catch (err) {
    const response: ScenarioSimulationResponse = {
      requestId,
      type: "error",
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
    ctx.postMessage(response);
  }
});
