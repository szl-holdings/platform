/**
 * @szl-holdings/vsp-otel — Verifiable Span Protocol, OTel bridge MVP.
 *
 * Author: Lutar, Stephen P. (ORCID 0009-0001-0110-4173)
 * License: Apache-2.0
 *
 * Public surface (MVP slice):
 *   - LambdaSpanEmitter — emits one OTel span per Λ-receipt.
 *   - recordRhoClosure  — records a `rho.closure` span event.
 *
 * OTLP exporter wiring is intentionally out of scope; this layer depends on
 * `@opentelemetry/api` only so callers can plug in any SDK / exporter they
 * choose (NodeSDK + OTLP gRPC, BatchSpanProcessor + HTTP, etc.).
 */

export {
  LambdaSpanEmitter,
  recordRhoClosure,
  VSP_LICENSE_ALLOWLIST,
  deriveTraceIdFromReceiptHash,
} from './lambda-span-emitter.js';

export type {
  VspLicense,
  LambdaAxes,
  VspReceipt,
  RhoWitnessPair,
  LambdaSpanEmitterOptions,
} from './lambda-span-emitter.js';
