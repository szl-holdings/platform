/**
 * Shared HF inference governance gate.
 *
 * Provides a single 5-condition gate evaluator used by every inference entry
 * point (router, hf-client, connector adapter). The api-server registers a
 * registry-aware checker at startup via `setInferenceGateChecker`. When no
 * checker is registered (libraries used standalone, tests, etc.) we fail
 * closed to env-only checks so silent fallbacks remain impossible.
 *
 * The five gates are:
 *   1. registry_exists       — model is registered with provider=huggingface
 *   2. license_approved      — registry entry has licenseStatus='approved'
 *   3. sensitivity_match     — registry entry sensitivity is public/internal
 *   4. live_inference_enabled — HF_ENABLE_LIVE_INFERENCE=1
 *   5. production_approved   — HF_PRODUCTION_APPROVED=1
 *
 * Errors thrown follow the contract: `governance_gate_blocked:<model>:<gates>`
 * where <gates> is comma-separated failedGates list. Callers MUST surface this
 * error and never substitute mock data.
 */

export interface InferenceGateResult {
  allowed: boolean;
  model: string;
  failedGates: string[];
  gates: Record<string, boolean>;
}

export type InferenceGateChecker = (modelId: string) => InferenceGateResult;

let checker: InferenceGateChecker | null = null;

export function setInferenceGateChecker(fn: InferenceGateChecker): void {
  checker = fn;
}

/**
 * Default env-only gate. Used when no registry-aware checker is registered.
 * Evaluates the three env/credential gates and reports the registry gates as
 * `false` so callers cannot mistake env-only enforcement for full enforcement.
 */
function defaultEnvGate(modelId: string): InferenceGateResult {
  const tokenPresent = !!(process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY);
  const liveEnabled = process.env.HF_ENABLE_LIVE_INFERENCE === '1';
  const prodApproved = process.env.HF_PRODUCTION_APPROVED === '1';

  const gates: Record<string, boolean> = {
    registry_exists: false,
    license_approved: false,
    sensitivity_match: false,
    live_inference_enabled: liveEnabled,
    production_approved: prodApproved,
    credentials_present: tokenPresent,
  };

  const failedGates = Object.entries(gates)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  return { allowed: failedGates.length === 0, model: modelId, failedGates, gates };
}

export function evaluateInferenceGates(modelId: string): InferenceGateResult {
  return (checker ?? defaultEnvGate)(modelId);
}

/**
 * Throws `governance_gate_blocked:<model>:<failedGates>` if any gate fails.
 * Use this at the entry of every HF inference call site.
 */
export function enforceInferenceGates(modelId: string): void {
  const result = evaluateInferenceGates(modelId);
  if (!result.allowed) {
    throw new Error(`governance_gate_blocked:${modelId}:${result.failedGates.join(',')}`);
  }
}
