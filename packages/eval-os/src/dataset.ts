import type { GoldExample, EvalScenario } from "./types.js";
import { EvalScenarioSchema } from "./types.js";

export interface EvalPack {
  id: string;
  name: string;
  version: string;
  scenarios: EvalScenario[];
  description?: string;
  tags: string[];
}

export function createPack(params: Omit<EvalPack, "scenarios"> & { scenarios?: EvalScenario[] }): EvalPack {
  return { scenarios: [], ...params };
}

export function addScenario(pack: EvalPack, scenario: EvalScenario): EvalPack {
  const parsed = EvalScenarioSchema.parse(scenario);
  return { ...pack, scenarios: [...pack.scenarios, parsed] };
}

export function getExamplesForCategory(pack: EvalPack, category: EvalScenario["category"]): GoldExample[] {
  return pack.scenarios
    .filter((s) => s.category === category)
    .flatMap((s) => s.examples);
}

export const SAMPLE_EVAL_PACK: EvalPack = createPack({
  id: "sample-pack-v1",
  name: "Sample Platform Eval Pack",
  version: "1.0.0",
  description: "Baseline evaluation pack for platform core primitives",
  tags: ["baseline", "platform-core"],
});
