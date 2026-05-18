/**
 * Bridge: vsp-otel Λ-receipts → SDK `LambdaAxisStream`.
 *
 * The SDK's `telemetryPolicyProvider` consumes a generic publish/subscribe
 * stream of Λ-axis samples. This module is the concrete adapter that
 * derives those samples from the same VspReceipt objects fed to
 * `LambdaSpanEmitter`, so a single ingestion path drives both the OTel
 * exporter and the Λ-gate provider.
 *
 * Usage:
 *   const stream = createLambdaAxisStream();
 *   const emitter = new LambdaSpanEmitter({ tap: stream.tap });
 *   // ... or call stream.publishFromReceipt(receipt) directly from your
 *   // OTLP-receive callback. Wire `stream` into telemetryPolicyProvider.
 */

import type { LambdaAxes, VspReceipt } from './lambda-span-emitter.js';

export type LambdaAxisListener = (
  axes: LambdaAxes,
  observedAt: number,
) => void;

export interface LambdaAxisStreamHandle {
  subscribe(listener: LambdaAxisListener): () => void;
  publish(axes: LambdaAxes, observedAt?: number): void;
  publishFromReceipt(receipt: VspReceipt): void;
  latest(): { axes: LambdaAxes; observedAt: number } | null;
  /** Tap function suitable for handing to consumers that emit receipts. */
  tap(receipt: VspReceipt): void;
}

/**
 * In-process pub/sub for Λ-axis samples. The stream is intentionally
 * transport-agnostic — production wirings call `publishFromReceipt(...)`
 * from the OTLP-receive path (HTTP/gRPC), while tests call `publish(...)`
 * with synthetic axes.
 */
export function createLambdaAxisStream(): LambdaAxisStreamHandle {
  const listeners = new Set<LambdaAxisListener>();
  let last: { axes: LambdaAxes; observedAt: number } | null = null;

  function publish(axes: LambdaAxes, observedAt?: number): void {
    const ts = observedAt ?? Date.now();
    last = { axes, observedAt: ts };
    for (const l of listeners) l(axes, ts);
  }

  function publishFromReceipt(receipt: VspReceipt): void {
    if (!receipt.lambdaAxes) return;
    const ts = receipt.ts ? Date.parse(receipt.ts) : Date.now();
    publish(receipt.lambdaAxes, Number.isFinite(ts) ? ts : Date.now());
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    publish,
    publishFromReceipt,
    latest() {
      return last;
    },
    tap: publishFromReceipt,
  };
}
