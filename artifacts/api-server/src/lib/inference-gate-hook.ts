/**
 * Shared installer for the inference-gate → Lexicon review hook.
 *
 * This is the single source of truth for "what happens when an inference
 * gate fails": it registers a checker on `@szl-holdings/ai-engine` that
 *
 *   (a) runs the registry-aware 5-gate evaluator (`checkInferenceGates`),
 *   (b) on a `license_approved` / `registry_exists` miss, fire-and-forget
 *       enqueues a Lexicon review request via
 *       `ensureLexiconEntryAndEnqueueReview` so an operator can
 *       approve/deny the unknown target, and
 *   (c) returns the same `InferenceGateResult` shape every HF entry point
 *       in `lib/ai-engine` (hf-client, connector adapter, in-process
 *       router) consumes.
 *
 * `app.ts` calls this at boot. The integration test at
 * `__tests__/lexicon-gate-reviewer-alerts.integration.test.ts` calls the
 * same installer so the test cannot drift from the boot wiring: any
 * change to the gate-miss behavior is observed in both places at once.
 */
import {
  setInferenceGateChecker,
  type InferenceGateResult,
} from '@szl-holdings/ai-engine/providers/inference-gates';
import { checkInferenceGates } from '../a11oy/runtime/router/model-router.js';
import { ensureLexiconEntryAndEnqueueReview } from '../routes/a11oy-lexicon-api.js';

export function installInferenceGateHook(): void {
  setInferenceGateChecker((modelId: string): InferenceGateResult => {
    const r = checkInferenceGates(modelId);
    if (!r.gates.license_approved || !r.gates.registry_exists) {
      void ensureLexiconEntryAndEnqueueReview({
        targetId: modelId,
        context: { source: 'inference_gate_checker', failedGates: r.failedGates },
      }).catch(() => {});
    }
    return { allowed: r.allowed, model: r.model, failedGates: r.failedGates, gates: r.gates };
  });
}
