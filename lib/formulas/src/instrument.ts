/**
 * Proof-ledger instrumentation.
 *
 * `instrument(spec, fn)` returns a wrapped function that:
 *   1. Computes `fn(input)` synchronously.
 *   2. Computes a stable hash over the input and output.
 *   3. Emits a `FormulaInvocation` to a registered sink (defaults to no-op).
 *
 * The sink is injected by the api-server at boot so it can persist to the
 * `formula_invocations` table and forward to the proof-ledger. The bare
 * pure functions in `registry.ts` are always exported untouched so hot
 * paths can opt out of instrumentation when they need to.
 */

import type { FormulaSpec } from './registry.js';

export interface FormulaInvocation {
  formulaId: string;
  version: string;
  ts: string;
  inputHash: string;
  outputHash: string;
  caller?: string;
  durationMs: number;
  /**
   * Free-form bag for callers to attach domain context (observed vs
   * baseline performance, parameter under test, etc). Consumed by
   * downstream sinks such as the ROSIE drift detector.
   */
  meta?: Record<string, unknown>;
}

export type InvocationSink = (inv: FormulaInvocation) => void;

let activeSink: InvocationSink = () => {};

/** Replace the global sink (api-server registers a DB-backed sink at boot). */
export function setInvocationSink(sink: InvocationSink): void {
  activeSink = sink;
}

export function getInvocationSink(): InvocationSink {
  return activeSink;
}

/**
 * Stable, dependency-free hash. Not cryptographically strong — the
 * proof-ledger uses this only to identify identical (input, output) pairs
 * cheaply. Crypto-grade hashes are computed by the api-server when it
 * persists.
 */
export function stableHash(value: unknown): string {
  const json = stringifyStable(value);
  let h = 0x811c9dc5;
  for (let i = 0; i < json.length; i++) {
    h ^= json.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

function stringifyStable(value: unknown): string {
  if (value === null || value === undefined) return String(value);
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(stringifyStable).join(',') + ']';
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + stringifyStable(obj[k])).join(',') + '}';
}

/**
 * Per-invocation meta extractor. Called after the impl runs; the returned
 * record is forwarded on the `FormulaInvocation.meta` field. Callers use
 * this to attach observed-vs-baseline performance metadata so downstream
 * sinks (notably the ROSIE drift detector / evolution loop in api-server)
 * can record drift observations without the formula impl itself having to
 * know about the proof-ledger contract.
 *
 * The detector's required keys are documented in
 * `docs/audits/formulas.md` §"Observed-vs-baseline meta contract":
 *   { observed: number, baseline: number, parameter: string,
 *     oldValue: number, candidateValue: number, thesisCitation: string,
 *     irreversibility?: number }
 * Extra keys are allowed and are passed through to the sink unchanged.
 */
export type MetaExtractor<I, O> = (
  input: I,
  output: O,
) => Record<string, unknown> | undefined;

/**
 * Wrap a pure formula in a proof-emitting variant.
 *
 * If `metaFn` is provided, it is invoked after `spec.impl(input)` and its
 * return value is attached to the emitted `FormulaInvocation.meta`. The
 * extractor runs inside a try/catch so a faulty extractor cannot break the
 * hot path.
 */
export function instrument<I, O>(
  spec: Pick<FormulaSpec<I, O>, 'id' | 'version' | 'impl'>,
  caller?: string,
  metaFn?: MetaExtractor<I, O>,
): (input: I) => O {
  return (input: I): O => {
    const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const output = spec.impl(input);
    const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
    let meta: Record<string, unknown> | undefined;
    if (metaFn) {
      try {
        meta = metaFn(input, output);
      } catch {
        meta = undefined;
      }
    }
    try {
      activeSink({
        formulaId: spec.id,
        version: spec.version,
        ts: new Date().toISOString(),
        inputHash: stableHash(input),
        outputHash: stableHash(output),
        caller,
        durationMs: Math.max(0, end - start),
        ...(meta ? { meta } : {}),
      });
    } catch {
      // Never let proof-ledger failures break the hot path.
    }
    return output;
  };
}
