export { promptEvalSuite } from "./prompt-eval.js";
export { modelRoutingSuite } from "./model-routing.js";
export { verifierSuite } from "./verifier.js";
export { toolReliabilitySuite } from "./tool-reliability.js";
export { citationFidelitySuite } from "./citation-fidelity.js";
export { memoryRetrievalSuite } from "./memory-retrieval.js";
export { planningQualitySuite } from "./planning-quality.js";
export { reflectionQualitySuite } from "./reflection-quality.js";
export { autonomySafetySuite } from "./autonomy-safety.js";
export { endToEndScenarioSuite } from "./end-to-end-scenario.js";

import { promptEvalSuite } from "./prompt-eval.js";
import { modelRoutingSuite } from "./model-routing.js";
import { verifierSuite } from "./verifier.js";
import { toolReliabilitySuite } from "./tool-reliability.js";
import { citationFidelitySuite } from "./citation-fidelity.js";
import { memoryRetrievalSuite } from "./memory-retrieval.js";
import { planningQualitySuite } from "./planning-quality.js";
import { reflectionQualitySuite } from "./reflection-quality.js";
import { autonomySafetySuite } from "./autonomy-safety.js";
import { endToEndScenarioSuite } from "./end-to-end-scenario.js";
import type { EvalSuiteDef, EvalType } from "../types.js";

export const FORGE_SUITES: EvalSuiteDef[] = [
  promptEvalSuite,
  modelRoutingSuite,
  verifierSuite,
  toolReliabilitySuite,
  citationFidelitySuite,
  memoryRetrievalSuite,
  planningQualitySuite,
  reflectionQualitySuite,
  autonomySafetySuite,
  endToEndScenarioSuite,
];

export const FORGE_SUITE_BY_ID: Record<string, EvalSuiteDef> = Object.fromEntries(
  FORGE_SUITES.map((s) => [s.suiteId, s]),
);

export const FORGE_SUITE_BY_EVAL_TYPE: Record<EvalType, EvalSuiteDef> = Object.fromEntries(
  FORGE_SUITES.map((s) => [s.evalType, s]),
) as Record<EvalType, EvalSuiteDef>;

export const FORGE_SUITE_BY_DOMAIN: Record<string, EvalSuiteDef[]> = {};
for (const suite of FORGE_SUITES) {
  const arr = FORGE_SUITE_BY_DOMAIN[suite.domain] ?? [];
  arr.push(suite);
  FORGE_SUITE_BY_DOMAIN[suite.domain] = arr;
}
