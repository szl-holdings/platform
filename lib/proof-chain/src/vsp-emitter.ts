/**
 * VSP (Verifiable Span Protocol) emitter hook for proof-chain.
 *
 * The proof-chain library stays dependency-free of `@szl-holdings/vsp-otel`
 * — callers wire a concrete emitter at boot via `setVspProofEmitter()`.
 * If no emitter is set, proof-chain writes are emitted exactly as before
 * with zero added latency.
 *
 * The emitter contract is a structural subset of `LambdaSpanEmitter.emit`
 * so a `LambdaSpanEmitter` instance can be passed directly:
 *
 *   import { LambdaSpanEmitter } from '@szl-holdings/vsp-otel';
 *   import { setVspProofEmitter } from '@szl-holdings/proof-chain';
 *
 *   setVspProofEmitter(new LambdaSpanEmitter({ vendor: 'honeycomb' }));
 */

export interface VspProofEmitterInput {
  hash: string;
  license: 'Apache-2.0' | 'MIT' | 'BSD-3-Clause' | 'CC-BY-4.0';
  name?: string;
  endpoint?: string;
  replayCount?: number;
  ingestionPolicy?: string;
  ts?: string;
  /**
   * Per-axis Λ scores in [0, 1]. Structural match for the 9-axis
   * Lutar invariant (cleanliness, horizon, resonance, frustum,
   * gaussClosure, invariance, moralGrounding, ontologicalGrounding,
   * measurabilityHonesty). Missing axes are simply not stamped.
   */
  lambdaAxes?: Record<string, number | undefined>;
  /**
   * ρ-closure witness pair. When present, the emitter records a
   * `rho.closure` span event before ending the span, per VSP spec §3.
   */
  rhoClosure?: {
    byteIdentical: boolean;
    chainRoot: string;
  };
}

/**
 * Span handle returned by the emitter. Structural subset of OTel `Span`
 * with the bits proof-chain calls.
 */
export interface VspProofSpanHandle {
  end?: () => void;
  addEvent?: (name: string, attrs?: Record<string, unknown>) => void;
}

export interface VspProofEmitter {
  /**
   * Emit a VSP span for a proof-chain entry.
   *
   * Implementations are expected to return a value with `end()` /
   * optional `addEvent()` methods (the OTel Span). proof-chain calls
   * `addEvent('rho.closure', ...)` when `rhoClosure` is supplied and
   * `end()` synchronously after.
   */
  emit(receipt: VspProofEmitterInput, opts?: { endImmediately?: boolean }): VspProofSpanHandle | undefined;
}

let _emitter: VspProofEmitter | null = null;

/** Install the global VSP emitter for proof-chain. Pass `null` to disable. */
export function setVspProofEmitter(emitter: VspProofEmitter | null): void {
  _emitter = emitter;
}

/** Read the currently installed emitter (mainly for tests). */
export function getVspProofEmitter(): VspProofEmitter | null {
  return _emitter;
}

/**
 * Best-effort fire-and-forget VSP emission. Always swallows errors so
 * the receipt-build budget (p50 11.5 µs) is never regressed by a
 * misbehaving exporter or vendor adapter. Returns `true` if a span was
 * emitted, `false` otherwise (no emitter installed, bad hash, etc.).
 */
export function emitVspProofSpan(receipt: VspProofEmitterInput): boolean {
  const e = _emitter;
  if (!e) return false;
  try {
    // When ρ-closure is supplied, defer span.end() so the event is recorded
    // BEFORE the span closes (OTel discards events added to ended spans).
    const hasRho = !!receipt.rhoClosure;
    const span = e.emit(receipt, { endImmediately: !hasRho });
    if (hasRho && span) {
      span.addEvent?.('rho.closure', {
        byte_identical: receipt.rhoClosure!.byteIdentical,
        chain_root: receipt.rhoClosure!.chainRoot,
      });
      span.end?.();
    }
    return true;
  } catch {
    return false;
  }
}
