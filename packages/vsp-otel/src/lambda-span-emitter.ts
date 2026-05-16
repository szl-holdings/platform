/**
 * LambdaSpanEmitter — Λ-receipt → OpenTelemetry span (MVP slice).
 *
 * Maps one Λ-receipt onto exactly one OTel span:
 *   - The span's actual `spanContext().traceId` is the first 16 bytes
 *     (32 hex chars) of the receipt hash. This is achieved by starting
 *     the span as a child of a non-recording parent span whose context
 *     carries the derived traceId — the SDK inherits the parent traceId.
 *   - per-axis Λ scores → attributes under `gen_ai.lambda.<axis>`.
 *   - license / replay-count / ingestion-policy → `gen_ai.szl.*` namespace.
 *
 * The license attribute is allowlist-enforced (Doctrine V6 license hygiene):
 * any value outside {Apache-2.0, MIT, BSD-3-Clause, CC-BY-4.0} throws.
 *
 * Lifecycle: `emit()` returns the span WITHOUT calling `end()` so callers
 * can add further events (e.g. `recordRhoClosure`) and end it themselves.
 * If no further events are needed, pass `endImmediately: true` or call
 * `span.end()` directly.
 *
 * Depends only on `@opentelemetry/api` — no SDK / exporter at this layer.
 */

import {
  type Context,
  context as contextApi,
  type Span,
  type SpanContext,
  SpanKind,
  type SpanOptions,
  TraceFlags,
  type Tracer,
  trace,
} from '@opentelemetry/api';

/**
 * License allowlist enforced on every emitted span. Sourced from Doctrine V6
 * license hygiene: only permissive / public-license values are allowed to
 * cross the VSP boundary.
 */
export const VSP_LICENSE_ALLOWLIST = [
  'Apache-2.0',
  'MIT',
  'BSD-3-Clause',
  'CC-BY-4.0',
] as const;

export type VspLicense = (typeof VSP_LICENSE_ALLOWLIST)[number];

/**
 * Nine Λ-axes per the Lutar Invariant (see
 * `@workspace/ouroboros-invariant` and `ouroboros-guardrails/lambda.ts`).
 * Each value is a number in [0, 1]. All fields are optional — only those
 * present on the receipt are emitted as attributes.
 */
export interface LambdaAxes {
  cleanliness?: number;
  horizon?: number;
  resonance?: number;
  frustum?: number;
  gaussClosure?: number;
  invariance?: number;
  moralGrounding?: number;
  ontologicalGrounding?: number;
  measurabilityHonesty?: number;
}

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
] as const;

/**
 * The VSP receipt input. Intentionally a structural superset of both
 * `@szl-holdings/szl-receipts`'s `LambdaReceipt` (which carries `selfHash`)
 * and api-server's `ProofLedgerEntry` (the proof shape emitted by
 * `appendProof` / orchestration-store). Callers pass through whichever
 * fields they have; the emitter only requires the hash and license.
 */
export interface VspReceipt {
  /**
   * SHA-256 hex of the receipt body. May be supplied as `hash` directly or
   * via `selfHash` (the field name used by `@szl-holdings/szl-receipts`).
   * Must be at least 32 hex characters (16 bytes → OTel traceId).
   */
  hash?: string;
  selfHash?: string;
  /** Span name. Defaults to the receipt's endpoint, then `lambda.span`. */
  name?: string;
  endpoint?: string;
  /** Per-axis Λ scores, [0, 1]. */
  lambdaAxes?: LambdaAxes;
  /** Allowlisted license string. Required. */
  license: VspLicense;
  /** How many times this receipt has been replayed (default 0). */
  replayCount?: number;
  /** Ingestion-policy identifier (free-form). */
  ingestionPolicy?: string;
  /** ISO-8601 timestamp; used as the span start time when present. */
  ts?: string;
}

export interface RhoWitnessPair {
  byteIdentical: boolean;
  chainRoot: string;
}

export interface LambdaSpanEmitterOptions {
  /** Override the OTel tracer. Defaults to `trace.getTracer('vsp-otel')`. */
  tracer?: Tracer;
  /** Override the tracer name when constructing the default tracer. */
  tracerName?: string;
}

export interface EmitOptions {
  /**
   * If true, the span is ended synchronously before `emit` returns. Use
   * when no further events (e.g. `rho.closure`) will be attached. Default
   * is `false` so callers can call `recordRhoClosure` and then `span.end()`.
   */
  endImmediately?: boolean;
}

const HEX_RE = /^[0-9a-f]+$/i;
const ZERO_SPAN_ID = '0'.repeat(16);
const NON_ZERO_FALLBACK_SPAN_ID = '0'.repeat(15) + '1';

/**
 * Derive an OTel traceId from a receipt hash: first 16 bytes (32 hex chars),
 * lowercased. Throws if the hash is too short or non-hex.
 */
export function deriveTraceIdFromReceiptHash(hash: string): string {
  if (typeof hash !== 'string' || hash.length < 32) {
    throw new Error(
      `[vsp-otel] receipt hash must be >=32 hex chars; got ${hash?.length ?? 0}`,
    );
  }
  const head = hash.slice(0, 32);
  if (!HEX_RE.test(head)) {
    throw new Error('[vsp-otel] receipt hash must be hexadecimal');
  }
  return head.toLowerCase();
}

function assertLicense(license: unknown): asserts license is VspLicense {
  if (
    typeof license !== 'string' ||
    !(VSP_LICENSE_ALLOWLIST as readonly string[]).includes(license)
  ) {
    throw new Error(
      `[vsp-otel] license "${String(license)}" is not on the VSP allowlist ` +
        `(${VSP_LICENSE_ALLOWLIST.join(', ')})`,
    );
  }
}

/**
 * Build a parent context whose SpanContext carries the derived traceId.
 * OTel SDKs (sdk-trace-base, NodeTracerProvider) inherit the parent's
 * traceId when starting a child span, which is how we force the emitted
 * span's traceId to equal the receipt-derived value.
 */
function buildParentContextWithTraceId(traceId: string): Context {
  const parentSpanContext: SpanContext = {
    traceId,
    // The W3C trace-context spec forbids the all-zero spanId. Use a
    // single-bit non-zero spanId so the parent context is treated as valid
    // by the SDK's `isSpanContextValid` check.
    spanId: NON_ZERO_FALLBACK_SPAN_ID,
    traceFlags: TraceFlags.SAMPLED,
    isRemote: true,
  };
  return trace.setSpanContext(contextApi.active(), parentSpanContext);
}

export class LambdaSpanEmitter {
  private readonly tracer: Tracer;
  /** Last derived traceId, exposed for tests / verification harnesses. */
  public lastTraceId: string | null = null;

  constructor(options: LambdaSpanEmitterOptions = {}) {
    this.tracer =
      options.tracer ?? trace.getTracer(options.tracerName ?? 'vsp-otel');
  }

  /**
   * Emit one OTel span from a Λ-receipt. The span is started with a
   * parent context whose traceId is the receipt-derived value, so the
   * SDK assigns `span.spanContext().traceId === derivedTraceId`.
   *
   * The span is NOT ended by default — callers should attach any further
   * events (e.g. `recordRhoClosure`) and then call `span.end()`. Pass
   * `{ endImmediately: true }` if no further events are expected.
   */
  emit(receipt: VspReceipt, opts: EmitOptions = {}): Span {
    assertLicense(receipt.license);

    const hash = receipt.hash ?? receipt.selfHash;
    if (!hash) {
      throw new Error('[vsp-otel] receipt is missing `hash` / `selfHash`');
    }
    const traceId = deriveTraceIdFromReceiptHash(hash);
    if (traceId === ZERO_SPAN_ID + ZERO_SPAN_ID.slice(0, 16)) {
      // Defensive: the all-zero traceId is invalid per W3C trace-context and
      // would be rejected by the SDK's `isSpanContextValid` check.
      throw new Error('[vsp-otel] derived traceId is all zeros (invalid)');
    }
    this.lastTraceId = traceId;

    const startTime = receipt.ts ? new Date(receipt.ts) : undefined;
    const spanOptions: SpanOptions = {
      kind: SpanKind.INTERNAL,
      ...(startTime ? { startTime } : {}),
    };

    const parentCtx = buildParentContextWithTraceId(traceId);
    const span = this.tracer.startSpan(
      receipt.name ?? receipt.endpoint ?? 'lambda.span',
      spanOptions,
      parentCtx,
    );

    // Stamp the receipt hash + derived traceId as attributes for
    // downstream verification (auditors can independently re-derive and
    // compare without needing the OTel SDK).
    span.setAttribute('gen_ai.szl.receipt_hash', hash);
    span.setAttribute('gen_ai.szl.trace_id', traceId);
    span.setAttribute('gen_ai.szl.license', receipt.license);
    span.setAttribute('gen_ai.szl.replay_count', receipt.replayCount ?? 0);
    if (receipt.ingestionPolicy) {
      span.setAttribute('gen_ai.szl.ingestion_policy', receipt.ingestionPolicy);
    }

    const axes = receipt.lambdaAxes;
    if (axes) {
      for (const axis of LAMBDA_AXIS_KEYS) {
        const value = axes[axis];
        if (typeof value === 'number' && Number.isFinite(value)) {
          span.setAttribute(`gen_ai.lambda.${axis}`, value);
        }
      }
    }

    if (opts.endImmediately) {
      span.end();
    }
    return span;
  }
}

/**
 * Record a `rho.closure` span event carrying the ρ-witness pair
 * (byte-identical replay flag + chain root). Per VSP spec §3. Must be
 * called BEFORE `span.end()` — the OTel SDK discards events added after
 * the span has ended.
 */
export function recordRhoClosure(span: Span, witnessPair: RhoWitnessPair): void {
  span.addEvent('rho.closure', {
    byte_identical: witnessPair.byteIdentical,
    chain_root: witnessPair.chainRoot,
  });
}
