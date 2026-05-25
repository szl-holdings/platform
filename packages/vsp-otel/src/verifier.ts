/**
 * VSP Verifier — takes an OTel span (or a span-shaped record) and
 * validates the embedded VSP receipt without any access to SZL
 * internal systems beyond an optional public verification API.
 *
 * Verdict shape mirrors the public `/api/proof/verify` endpoint so
 * downstream tooling (Langfuse panels, Phoenix dashboards, etc.) can
 * surface a single structured result regardless of where the span
 * originated.
 *
 * The verifier is intentionally dependency-light: it accepts any
 * object that exposes `spanContext()` + `attributes` (the @opentelemetry/api
 * `Span` shape) OR a plain JSON record with `traceId` / `attributes`
 * (the OTLP/JSON wire shape). This lets adopters verify spans pulled
 * from Langfuse, Phoenix, or Datadog APIs without an OTel SDK.
 */

import {
  VSP_LICENSE_ALLOWLIST,
  deriveTraceIdFromReceiptHash,
  type VspLicense,
} from './lambda-span-emitter.js';

/** Verdict status codes — stable wire contract for downstream tooling. */
export type VspVerdictStatus =
  | 'verified'
  | 'unverified'
  | 'trace_id_mismatch'
  | 'missing_receipt_hash'
  | 'missing_license'
  | 'license_not_allowlisted'
  | 'invalid_hash_format'
  | 'remote_verification_failed';

export interface VspVerdict {
  /** Top-level pass/fail for the entire verification. */
  ok: boolean;
  /** Specific failure code or `verified`. */
  status: VspVerdictStatus;
  /** Receipt hash recovered from the span (if any). */
  receiptHash?: string;
  /** OTel traceId recovered from the span. */
  traceId?: string;
  /** Derived traceId from the receipt hash for comparison. */
  expectedTraceId?: string;
  /** License recovered from the span. */
  license?: string;
  /** Remote verification result (when `verifyApi` is supplied). */
  remote?: { ok: boolean; details?: Record<string, unknown> };
  /** Human-readable reason for failures. */
  reason?: string;
}

/**
 * Shape accepted from the OTel SDK directly (`@opentelemetry/api` Span).
 * Only the bits VSP needs are listed — keeps this loose enough to also
 * accept ReadableSpan from `sdk-trace-base`.
 */
export interface VspSpanLike {
  spanContext(): { traceId: string };
  attributes?: Record<string, unknown>;
}

/**
 * Shape accepted from raw OTLP/JSON, vendor APIs (Langfuse REST,
 * Phoenix REST, Datadog Spans API), or hand-built records.
 */
export interface VspSpanRecord {
  traceId?: string;
  trace_id?: string;
  attributes?: Record<string, unknown> | Array<{ key: string; value: unknown }>;
}

export interface VerifyVspSpanOptions {
  /**
   * Optional public verification API endpoint (e.g.
   * `https://api.szl.dev/v1/proof/verify`). When set, the verifier
   * POSTs `{ receiptHash, traceId }` and merges the structured verdict
   * under `remote`. Network failures are reported, never thrown.
   */
  verifyApi?: string;
  /** Override the fetch implementation (Node 18+ has global fetch). */
  fetchImpl?: typeof fetch;
  /** Additional request headers for the verifyApi POST. */
  headers?: Record<string, string>;
}

const HEX_RE = /^[0-9a-f]+$/i;

/**
 * Pull the canonical VSP attributes off either an SDK Span (object map)
 * or an OTLP/JSON span (array of KeyValue records).
 */
function readAttr(
  span: VspSpanLike | VspSpanRecord,
  key: string,
): string | number | undefined {
  const attrs = (span as VspSpanRecord).attributes;
  if (!attrs) return undefined;
  if (Array.isArray(attrs)) {
    for (const kv of attrs) {
      if (kv?.key === key) {
        const v = kv.value;
        if (typeof v === 'string' || typeof v === 'number') return v;
        if (v && typeof v === 'object') {
          const o = v as Record<string, unknown>;
          if (typeof o['stringValue'] === 'string') return o['stringValue'] as string;
          if (typeof o['intValue'] === 'string') return Number(o['intValue']);
          if (typeof o['intValue'] === 'number') return o['intValue'] as number;
          if (typeof o['doubleValue'] === 'number') return o['doubleValue'] as number;
        }
        return undefined;
      }
    }
    return undefined;
  }
  const v = (attrs as Record<string, unknown>)[key];
  if (typeof v === 'string' || typeof v === 'number') return v;
  return undefined;
}

function readTraceId(span: VspSpanLike | VspSpanRecord): string | undefined {
  const ctxFn = (span as VspSpanLike).spanContext;
  if (typeof ctxFn === 'function') {
    try {
      const c = ctxFn.call(span);
      if (c && typeof c.traceId === 'string') return c.traceId.toLowerCase();
    } catch {
      // fall through to record-shaped lookup
    }
  }
  const rec = span as VspSpanRecord;
  if (typeof rec.traceId === 'string') return rec.traceId.toLowerCase();
  if (typeof rec.trace_id === 'string') return rec.trace_id.toLowerCase();
  return undefined;
}

/**
 * Validate a VSP span and return a structured verdict. Never throws —
 * all failures are reported as a non-ok verdict so verifier callers
 * (UI buttons, batch validators) can render a result for every span.
 */
export async function verifyVspSpan(
  span: VspSpanLike | VspSpanRecord,
  options: VerifyVspSpanOptions = {},
): Promise<VspVerdict> {
  const traceId = readTraceId(span);
  const receiptHashAttr = readAttr(span, 'gen_ai.szl.receipt_hash');
  const licenseAttr = readAttr(span, 'gen_ai.szl.license');

  const receiptHash =
    typeof receiptHashAttr === 'string' ? receiptHashAttr : undefined;
  const license = typeof licenseAttr === 'string' ? licenseAttr : undefined;

  if (!receiptHash) {
    return {
      ok: false,
      status: 'missing_receipt_hash',
      ...(traceId !== undefined ? { traceId } : {}),
      reason: 'Span is missing `gen_ai.szl.receipt_hash` attribute',
    };
  }

  if (!license) {
    return {
      ok: false,
      status: 'missing_license',
      receiptHash,
      ...(traceId !== undefined ? { traceId } : {}),
      reason: 'Span is missing `gen_ai.szl.license` attribute',
    };
  }

  if (!(VSP_LICENSE_ALLOWLIST as readonly string[]).includes(license)) {
    return {
      ok: false,
      status: 'license_not_allowlisted',
      receiptHash,
      ...(traceId !== undefined ? { traceId } : {}),
      license,
      reason: `License "${license}" is not on the VSP allowlist`,
    };
  }

  if (receiptHash.length < 32 || !HEX_RE.test(receiptHash.slice(0, 32))) {
    return {
      ok: false,
      status: 'invalid_hash_format',
      receiptHash,
      ...(traceId !== undefined ? { traceId } : {}),
      license,
      reason: 'Receipt hash must be >=32 lowercase hex chars',
    };
  }

  const expectedTraceId = deriveTraceIdFromReceiptHash(receiptHash);

  if (!traceId || traceId !== expectedTraceId) {
    return {
      ok: false,
      status: 'trace_id_mismatch',
      receiptHash,
      ...(traceId !== undefined ? { traceId } : {}),
      expectedTraceId,
      license,
      reason: `Span traceId ${traceId ?? '<none>'} does not match receipt-derived ${expectedTraceId}`,
    };
  }

  const base: VspVerdict = {
    ok: true,
    status: 'verified',
    receiptHash,
    traceId,
    expectedTraceId,
    license: license as VspLicense,
  };

  if (!options.verifyApi) return base;

  const fetchFn = options.fetchImpl ?? (globalThis.fetch as typeof fetch | undefined);
  if (!fetchFn) {
    return {
      ...base,
      ok: false,
      status: 'remote_verification_failed',
      reason: 'No fetch implementation available for remote verification',
    };
  }

  try {
    const res = await fetchFn(options.verifyApi, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(options.headers ?? {}),
      },
      body: JSON.stringify({ receiptHash, traceId }),
    });
    if (!res.ok) {
      return {
        ...base,
        ok: false,
        status: 'remote_verification_failed',
        remote: { ok: false, details: { httpStatus: res.status } },
        reason: `Remote verification returned HTTP ${res.status}`,
      };
    }
    const body = (await res.json()) as { valid?: boolean; ok?: boolean; details?: Record<string, unknown> };
    const remoteOk = body.ok ?? body.valid ?? false;
    return {
      ...base,
      ok: remoteOk,
      status: remoteOk ? 'verified' : 'unverified',
      remote: { ok: remoteOk, ...(body.details ? { details: body.details } : {}) },
      ...(remoteOk ? {} : { reason: 'Remote verifier rejected the receipt' }),
    };
  } catch (err) {
    return {
      ...base,
      ok: false,
      status: 'remote_verification_failed',
      remote: { ok: false, details: { error: err instanceof Error ? err.message : String(err) } },
      reason: 'Remote verification request failed',
    };
  }
}
