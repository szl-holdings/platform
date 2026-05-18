/**
 * @szl-holdings/vsp-otel — Verifiable Span Protocol, OTel bridge.
 *
 * Author: Lutar, Stephen P. (ORCID 0009-0001-0110-4173)
 * License: Apache-2.0
 *
 * Public surface:
 *   - LambdaSpanEmitter       — emits one OTel span per Λ-receipt. Set
 *     `vendor` to mirror VSP attrs into Honeycomb/Datadog/Phoenix shapes.
 *   - recordRhoClosure        — records a `rho.closure` span event.
 *   - startVspNodeSdk         — NodeSDK bootstrap with OTLP gRPC/HTTP wiring.
 *   - applyVendorAttributes   — pure mirror function (used by the emitter,
 *     exported for callers that create spans themselves).
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

export { applyVendorAttributes } from './vendor-adapters.js';

export type { VspVendor, VendorMirrorInfo } from './vendor-adapters.js';

export { startVspNodeSdk } from './node-sdk-bootstrap.js';

export {
  createLambdaAxisStream,
  type LambdaAxisListener,
  type LambdaAxisStreamHandle,
} from './lambda-axis-stream.js';

export type {
  VspNodeSdk,
  VspNodeSdkOptions,
  OtlpProtocol,
} from './node-sdk-bootstrap.js';
