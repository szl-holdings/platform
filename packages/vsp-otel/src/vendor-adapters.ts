/**
 * Vendor adapters — translate the `gen_ai.lambda.*` / `gen_ai.szl.*`
 * attribute namespaces into each backend's preferred shape WITHOUT
 * dropping the originals (auditors / replays still need the canonical
 * VSP attributes).
 *
 * Implemented as a pure `applyVendorAttributes(span, vendor, info)`
 * function invoked by `LambdaSpanEmitter` immediately after the
 * canonical attributes are set. This avoids reaching into private
 * SDK fields (e.g. an internal `.name` getter on Span) — the emitter
 * knows the span name, axes, and endpoint and passes them in
 * explicitly via a typed contract.
 *
 *  - Honeycomb: prefers `service.name` + flat attributes; the gen_ai.*
 *    namespace is already first-class. We add a Honeycomb display name
 *    mirror so the spans column in the UI is human-readable.
 *  - Datadog: their OTLP intake supports gen_ai.*, but DD APM surfaces
 *    `operation.name` / `resource.name` / `dd.*` tags more nicely.
 *  - Phoenix (Arize OpenInference): uses the `openinference.*` and
 *    `llm.evaluation.*` namespaces. We mirror Λ axes as evaluation scores
 *    and mark the span kind as LLM so it shows up in the LLM trace view.
 */

import type { Span } from '@opentelemetry/api';

import type { LambdaAxes } from './lambda-span-emitter.js';

export type VspVendor = 'honeycomb' | 'datadog' | 'phoenix' | 'none';

const LAMBDA_AXIS_KEYS: readonly (keyof LambdaAxes)[] = [
  'cleanliness',
  'horizon',
  'resonance',
  'frustum',
  'gaussClosure',
  'invariance',
  'moralGrounding',
  'ontologicalGrounding',
  'measurabilityHonesty',
];

/**
 * Information the emitter passes to a vendor adapter. All fields are
 * the same values the emitter has just stamped on the span via the
 * public OTel API — no private SDK introspection involved.
 */
export interface VendorMirrorInfo {
  /** The span's name (== receipt.name / endpoint / 'lambda.span'). */
  spanName: string;
  /** Per-axis Λ scores, if present on the receipt. */
  lambdaAxes?: LambdaAxes;
}

/**
 * Stamp vendor-shaped mirror attributes on a span. Originals under
 * `gen_ai.lambda.*` / `gen_ai.szl.*` are NOT modified — vendors get
 * a parallel view in their preferred namespace.
 */
export function applyVendorAttributes(
  span: Span,
  vendor: VspVendor,
  info: VendorMirrorInfo,
): void {
  switch (vendor) {
    case 'none':
      return;
    case 'honeycomb':
      applyHoneycomb(span, info);
      return;
    case 'datadog':
      applyDatadog(span, info);
      return;
    case 'phoenix':
      applyPhoenix(span, info);
      return;
  }
}

function applyHoneycomb(span: Span, info: VendorMirrorInfo): void {
  // Honeycomb's "name" column is its primary display field. OTel already
  // ships the span name, but mirroring to `app.span_name` lets derived
  // queries group on the receipt's logical endpoint without parsing.
  if (info.spanName) {
    span.setAttribute('app.span_name', info.spanName);
  }
  // Tag receipts as a distinct kind so they're filterable in Honeycomb's
  // AI / LLM dataset views.
  span.setAttribute('app.kind', 'vsp.lambda_receipt');
}

function applyDatadog(span: Span, info: VendorMirrorInfo): void {
  if (info.spanName) {
    // Datadog APM groups by `operation.name` and lists by `resource.name`.
    span.setAttribute('operation.name', info.spanName);
    span.setAttribute('resource.name', info.spanName);
  }
  span.setAttribute('dd.span_type', 'vsp.lambda_receipt');
  if (info.lambdaAxes) {
    for (const axis of LAMBDA_AXIS_KEYS) {
      const value = info.lambdaAxes[axis];
      if (typeof value === 'number' && Number.isFinite(value)) {
        span.setAttribute(`dd.lambda.${axis}`, value);
      }
    }
  }
}

function applyPhoenix(span: Span, info: VendorMirrorInfo): void {
  // OpenInference span-kind taxonomy: LLM spans render in the Phoenix
  // LLM trace view. VSP receipts wrap AI calls, so LLM is the closest
  // canonical kind.
  span.setAttribute('openinference.span.kind', 'LLM');
  span.setAttribute('openinference.metadata.namespace', 'gen_ai.lambda');
  if (info.lambdaAxes) {
    // Phoenix expects evaluation scores under `llm.evaluation.<label>.score`.
    for (const axis of LAMBDA_AXIS_KEYS) {
      const value = info.lambdaAxes[axis];
      if (typeof value === 'number' && Number.isFinite(value)) {
        span.setAttribute(`llm.evaluation.${axis}.score`, value);
        span.setAttribute(`llm.evaluation.${axis}.label`, axis);
      }
    }
  }
}
