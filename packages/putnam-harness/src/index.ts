// @szl-holdings/putnam-harness — public surface.
//
// Receipt-attested orchestration layer that turns the SZL primitive set
// (sparse-attention-kit, sequence-pipeline, perception-loop, lean-formulas)
// into a working Putnam-2025 evaluation. No bandaids, no hallucinated wins:
// the attestable artefact is the receipt chain, the score is just one
// element of it.

export * from "./loader.js";
export * from "./receipts.js";
export * from "./orchestrator.js";
export { checkLeanStub, checkClosedFormStub } from "./lean-check.js";
export type { LeanCheckResult, ClosedFormCheckOptions } from "./lean-check.js";
export { judge as judgeProof } from "./judge.js";
export { CANDIDATE_MODEL, JUDGE_MODEL } from "./anthropic.js";
