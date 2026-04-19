/// <reference lib="webworker" />
import { runScenarioSimulation, type MonteCarloResult } from "./scenario-simulation.js";
import { getScenarioById } from "./scenarios.js";

export interface ScenarioSimulationRequest {
  requestId: number;
  scenarioId: string;
  iterations: number;
}

export type ScenarioSimulationResponse =
  | { requestId: number; ok: true; result: MonteCarloResult }
  | { requestId: number; ok: false; error: string };

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.addEventListener("message", (event: MessageEvent<ScenarioSimulationRequest>) => {
  const { requestId, scenarioId, iterations } = event.data;
  try {
    const scenario = getScenarioById(scenarioId);
    if (!scenario) {
      const response: ScenarioSimulationResponse = {
        requestId,
        ok: false,
        error: `Unknown scenario: ${scenarioId}`,
      };
      ctx.postMessage(response);
      return;
    }
    const result = runScenarioSimulation(scenario, iterations);
    const response: ScenarioSimulationResponse = { requestId, ok: true, result };
    ctx.postMessage(response);
  } catch (err) {
    const response: ScenarioSimulationResponse = {
      requestId,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
    ctx.postMessage(response);
  }
});
