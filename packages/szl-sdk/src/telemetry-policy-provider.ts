/**
 * Telemetry-driven Λ-gate policy provider.
 *
 * Bridges the `vsp-otel` telemetry stream into the Λ-gate so the SDK can
 * refuse based on live runtime signals instead of a hand-seeded axis vector.
 *
 * Wiring model
 * ────────────
 *   vsp-otel Λ-receipt span  ─►  publishLambdaAxes(stream, axes)
 *                                          │
 *                                          ▼
 *                              LambdaAxisStream.subscribe(...)
 *                                          │
 *                                          ▼
 *                       telemetryPolicyProvider({...}).evaluate(action)
 *                                          │
 *                                          ▼
 *                            policy-engine.checkAction  → block ⇒ Λ=0
 *                            lutarInvariant(latestAxes) → Λ ∈ [0,1]
 *
 * Fail-closed semantics
 * ─────────────────────
 * If no telemetry has arrived, or the most recent sample is older than
 * `staleAfterMs`, the provider returns Λ = 0 (refuse-by-default) AND moves
 * `state().kind` to `'no-telemetry'` or `'stale'`. This is the difference
 * from `builtInDefaultProvider()`, which silently returned 0 from a static
 * axis vector with no observable reason. Callers can render the provider
 * state to explain to operators *why* the gate is refusing.
 */

import { checkAction, type EvaluationRequest } from '@szl-holdings/policy-engine';
import { lutarInvariant, type LutarAxes } from '@workspace/ouroboros-invariant';

import { isPolicyAdmit } from './default-policy-provider.js';
import type { LambdaInvariantProvider } from './lambda-gate.js';

export type LambdaAxisListener = (axes: LutarAxes, observedAt: number) => void;

/**
 * Minimal publish/subscribe surface used to decouple the SDK from the
 * concrete OTel transport. `vsp-otel` (or any other source — a websocket,
 * a polling endpoint, a unit test) implements this by calling `publish(...)`
 * whenever a new Λ-axis sample is observed.
 */
export interface LambdaAxisStream {
  subscribe(listener: LambdaAxisListener): () => void;
}

export interface PublishableLambdaAxisStream extends LambdaAxisStream {
  publish(axes: LutarAxes, observedAt?: number): void;
  /** Latest sample seen, or null if nothing has been published yet. */
  latest(): { axes: LutarAxes; observedAt: number } | null;
}

/**
 * In-memory pub/sub used by the default provider and tests. Production
 * adapters (vsp-otel HTTP/gRPC subscriber) call `publish(...)` from inside
 * their span-receive callback; the SDK never has to know the transport.
 */
export function createInMemoryLambdaAxisStream(): PublishableLambdaAxisStream {
  const listeners = new Set<LambdaAxisListener>();
  let last: { axes: LutarAxes; observedAt: number } | null = null;
  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    publish(axes, observedAt) {
      const ts = observedAt ?? Date.now();
      last = { axes, observedAt: ts };
      for (const l of listeners) l(axes, ts);
    },
    latest() {
      return last;
    },
  };
}

export type TelemetryProviderStateKind =
  | 'live'
  | 'stale'
  | 'no-telemetry';

export interface TelemetryProviderState {
  kind: TelemetryProviderStateKind;
  axes: LutarAxes | null;
  /** ms since epoch of the most recent sample. `null` if none received. */
  lastUpdatedAt: number | null;
  /**
   * Human-readable reason the gate is in this state. Surfaced by callers
   * (a11oy / sentra) so operators see *why* a refusal happened.
   */
  reason: string;
}

export interface TelemetryPolicyProviderOptions {
  stream: LambdaAxisStream;
  buildEvaluationRequest: (action: string) => EvaluationRequest | Promise<EvaluationRequest>;
  /**
   * Samples older than this are treated as `stale` and the provider fails
   * closed. Defaults to 30s, matching typical OTel batch export windows.
   */
  staleAfterMs?: number;
  /**
   * Optional callback fired whenever the provider's state changes. Useful
   * for surfacing the live Λ value and refusal reason in the UI without
   * polling.
   */
  onState?: (state: TelemetryProviderState) => void;
  /** Injectable clock for deterministic tests. */
  now?: () => number;
}

export interface TelemetryPolicyProvider extends LambdaInvariantProvider {
  state(): TelemetryProviderState;
  /** Tear down the stream subscription. */
  dispose(): void;
}

const DEFAULT_STALE_AFTER_MS = 30_000;

/**
 * Build a policy provider whose Λ comes from the live telemetry stream.
 * Fails closed (Λ = 0) when telemetry is missing or stale, and exposes
 * `state()` so the refusal reason is observable.
 */
export function telemetryPolicyProvider(
  options: TelemetryPolicyProviderOptions,
): TelemetryPolicyProvider {
  const now = options.now ?? (() => Date.now());
  const staleAfterMs = options.staleAfterMs ?? DEFAULT_STALE_AFTER_MS;

  let latest: { axes: LutarAxes; observedAt: number } | null = null;
  let currentState: TelemetryProviderState = {
    kind: 'no-telemetry',
    axes: null,
    lastUpdatedAt: null,
    reason: 'no Λ-axis samples received from vsp-otel yet — gate refuses by default',
  };

  function setState(next: TelemetryProviderState): void {
    const changed =
      next.kind !== currentState.kind ||
      next.lastUpdatedAt !== currentState.lastUpdatedAt;
    currentState = next;
    if (changed && options.onState) {
      options.onState(next);
    }
  }

  const unsubscribe = options.stream.subscribe((axes, observedAt) => {
    latest = { axes, observedAt };
    setState({
      kind: 'live',
      axes,
      lastUpdatedAt: observedAt,
      reason: 'live vsp-otel telemetry',
    });
  });

  function refreshFreshness(): void {
    if (!latest) return;
    const age = now() - latest.observedAt;
    if (age > staleAfterMs && currentState.kind !== 'stale') {
      setState({
        kind: 'stale',
        axes: latest.axes,
        lastUpdatedAt: latest.observedAt,
        reason: `last vsp-otel sample is ${age}ms old (>${staleAfterMs}ms) — gate fails closed`,
      });
    } else if (age <= staleAfterMs && currentState.kind !== 'live') {
      setState({
        kind: 'live',
        axes: latest.axes,
        lastUpdatedAt: latest.observedAt,
        reason: 'live vsp-otel telemetry',
      });
    }
  }

  return {
    async evaluate(action: string): Promise<number> {
      const request = await options.buildEvaluationRequest(action);
      const result = checkAction(request);
      if (!isPolicyAdmit(result.effect)) {
        // Policy-side zero-pinning (block / require_approval / escalate)
        // wins regardless of telemetry — high axes cannot bypass approval.
        return 0;
      }
      refreshFreshness();
      if (!latest || currentState.kind !== 'live') {
        // Fail closed: no telemetry or stale telemetry → refuse-by-default.
        // The caller observes the *reason* via `state()`; this is the
        // explicit-refusal contract that replaces the silent Λ=0 of
        // `builtInDefaultProvider()`.
        return 0;
      }
      const report = lutarInvariant(latest.axes);
      return report.invariant;
    },
    state() {
      refreshFreshness();
      return currentState;
    },
    dispose() {
      unsubscribe();
    },
  };
}
