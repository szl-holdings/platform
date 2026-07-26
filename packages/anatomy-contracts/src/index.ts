// SPDX-License-Identifier: Apache-2.0
// © 2026 Lutar, Stephen P. — SZL Holdings
// ORCID: 0009-0001-0110-4173
//
// @szl-holdings/anatomy-contracts — the shared wire contracts for the SZL
// anatomy mesh. These types + JSON Schemas are the single source of truth for
// the cross-app calls described in the mesh design:
//
//   rosie ──ActionProposal──▶ a11oy  /v1/policy/evaluate ──▶ PolicyDecision
//   a11oy ──ReasonRequest──▶ amaru   /v1/reason          ──▶ ReasonResponse
//   a11oy ──(immune)───────▶ sentra  inspect             ──▶ PolicyDecision(deny)
//   every cross-app call carries a W3C traceparent (SpanHeaders) and produces
//   a Receipt in a11oy's hash-chained ledger.
//
// This package has zero runtime dependencies. Validation is implemented with a
// small hand-written JSON-Schema-subset validator so the package runs under
// `node --experimental-strip-types --test` with no install step, and the
// emitted JSON Schemas (./schema/*.json) are consumable by non-TS apps
// (amaru is Python; it validates against the same schema files).

import { randomBytes } from "node:crypto";

// ---------------------------------------------------------------------------
// Wire 1 — ActionProposal (rosie → a11oy)
// ---------------------------------------------------------------------------

/** Severity ladder shared with a11oy's thresholdPolicySeverity gate. */
export type ActionSeverity = "low" | "medium" | "high" | "critical";

/** Decision class an operator can request for an action. */
export type DecisionClass = "autonomous" | "advisory" | "human-required";

/**
 * An action a principal (operator via rosie, or a domain app via the
 * substrate) proposes for evaluation. This is the request body of
 * a11oy `POST /v1/policy/evaluate`.
 */
export interface ActionProposal {
  /** Stable id for this action; echoed back in the decision + receipt. */
  readonly actionId: string;
  /** Human-readable description of what the action would do. */
  readonly summary: string;
  /** Severity the proposer assigns; the gate may treat it as a floor. */
  readonly severity: ActionSeverity;
  /** Whether the proposer wants autonomous/advisory/human-required handling. */
  readonly decisionClass: DecisionClass;
  /** Proposer confidence in [0,1]. */
  readonly confidence: number;
  /** Supporting witnesses (evidence ids / citations) for the action. */
  readonly witnesses: readonly string[];
  /** The principal issuing the action (operator id or domain-app id). */
  readonly principal: string;
  /** Free-form, app-specific action body the immune system inspects. */
  readonly payload?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Wire 2 — PolicyDecision (a11oy → caller)
// ---------------------------------------------------------------------------

export type Verdict = "allow" | "deny";

/** Which organ produced the verdict, for honest provenance. */
export type DecidedBy = "a11oy.gate" | "sentra.immune" | "a11oy.gate+sentra.immune";

/**
 * The result of evaluating an ActionProposal. Returned by
 * a11oy `POST /v1/policy/evaluate`. When the immune organ (sentra) rejects an
 * action, `decision` is "deny" and `decidedBy` names sentra.
 */
export interface PolicyDecision {
  readonly actionId: string;
  readonly decision: Verdict;
  /** Formula / gate name that produced the verdict (not a Lean axiom index). */
  readonly gate: string;
  /** Who decided — gate, immune, or both. */
  readonly decidedBy: DecidedBy;
  /** Human-readable reason for the verdict. */
  readonly rationale: string;
  /** Λ score from the gate when applicable; null when not computed. */
  readonly lambdaScore: number | null;
  /** Receipt hash for the minted receipt (empty string when none minted). */
  readonly receiptHash: string;
  /** The traceparent that correlates this decision across systems. */
  readonly traceparent: string;
}

// ---------------------------------------------------------------------------
// Wire 3 — ReasonRequest / ReasonResponse (a11oy → amaru)
// ---------------------------------------------------------------------------

/** Request a11oy POSTs to amaru when a decision needs brain context. */
export interface ReasonRequest {
  /** The action being reasoned about (correlates to a proposal). */
  readonly actionId: string;
  /** The chakra/region whose evaluation a11oy wants. */
  readonly chakra: string;
  /** The envelope a11oy forwards to amaru's /chakra/{name}/evaluate. */
  readonly envelope: Record<string, unknown>;
}

/** Structured rationale amaru returns, with provenance. */
export interface ReasonResponse {
  readonly actionId: string;
  readonly chakra: string;
  /** The structured rationale amaru produced. */
  readonly rationale: string;
  /** Leader/region that produced it (provenance). */
  readonly provenance: {
    readonly source: string;
    readonly chakra: string;
    readonly amaruVersion?: string;
  };
  /** Raw evaluation amaru returned, for the receipt payload. */
  readonly evaluation: Record<string, unknown>;
  /** Trace correlation. */
  readonly traceparent: string;
}

// ---------------------------------------------------------------------------
// Wire 5 — SpanHeaders (W3C Trace Context, the nervous system)
// ---------------------------------------------------------------------------

/**
 * The subset of W3C Trace Context headers every cross-app call must carry.
 * `traceparent` is mandatory; `tracestate` is optional vendor state.
 * See https://www.w3.org/TR/trace-context/.
 */
export interface SpanHeaders {
  readonly traceparent: string;
  readonly tracestate?: string;
}

const TRACEPARENT_RE = /^00-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$/;

/** True iff the string is a well-formed W3C `traceparent` (version 00). */
export function isValidTraceparent(value: string): boolean {
  if (!TRACEPARENT_RE.test(value)) return false;
  const traceId = value.slice(3, 35);
  const parentId = value.slice(36, 52);
  // All-zero trace-id / parent-id are invalid per the spec.
  if (/^0{32}$/.test(traceId)) return false;
  if (/^0{16}$/.test(parentId)) return false;
  return true;
}

function randHex(bytes: number): string {
  // Node built-in crypto; no dependency.
  return randomBytes(bytes).toString("hex");
}

/** Mint a fresh root traceparent (sampled flag set). */
export function newTraceparent(): string {
  return `00-${randHex(16)}-${randHex(8)}-01`;
}

/**
 * Derive a child traceparent from a parent: same trace-id, new span-id.
 * This is how a parent→child relationship is established across processes.
 */
export function childTraceparent(parent: string): string {
  if (!isValidTraceparent(parent)) {
    // Honest fallback: if the inbound header is malformed, start a fresh trace
    // rather than propagate a bad one.
    return newTraceparent();
  }
  const traceId = parent.slice(3, 35);
  const flags = parent.slice(53, 55);
  return `00-${traceId}-${randHex(8)}-${flags}`;
}

/** Extract the 32-char trace-id from a traceparent, or null if malformed. */
export function traceIdOf(traceparent: string): string | null {
  if (!isValidTraceparent(traceparent)) return null;
  return traceparent.slice(3, 35);
}

// ---------------------------------------------------------------------------
// Wire 6 — Receipt (a11oy ledger, the bloodstream)
// ---------------------------------------------------------------------------

/**
 * A mesh receipt as surfaced across apps. This is a *contract view* of
 * a11oy's OperationalReceipt: the fields any app needs to correlate and
 * verify a cross-app call. a11oy's receipt-substrate produces the full
 * hash-chained record; this is the cross-system projection that includes the
 * trace id so receipts and spans can be joined.
 */
export interface MeshReceipt {
  readonly receiptId: string;
  readonly eventType: string;
  readonly actorId: string;
  readonly toolName: string;
  readonly payloadHash: string;
  readonly prevReceiptHash: string | null;
  readonly timestampIso8601: string;
  /** The trace id that ties this receipt to its OTel span. */
  readonly traceId: string | null;
}

export type LogRetentionClass = "lifetime" | "6mo" | "session";
export type NistAiRmfFunction = "GOVERN" | "MAP" | "MEASURE" | "MANAGE";

export interface RegulatoryMapping {
  readonly eu_ai_act: {
    readonly article: string;
    readonly obligation: string;
    readonly annex_iii_category: string | null;
    readonly high_risk: boolean;
    readonly log_retention_class: LogRetentionClass;
  };
  readonly nist_ai_rmf: {
    readonly function: NistAiRmfFunction;
    readonly subcategory: string;
  };
  readonly owasp_asi: readonly string[];
  readonly iso_42001: {
    readonly control: string;
  };
}

/**
 * Receipt schema v2 is additive. A v1 receipt remains valid because both new
 * fields are optional; new emitters identify v2 and attach runtime mappings.
 */
export interface MeshReceiptV2 extends MeshReceipt {
  readonly schemaVersion?: "2.0";
  readonly regulatory?: RegulatoryMapping;
}

// ---------------------------------------------------------------------------
// Minimal JSON-Schema-subset validator (zero-dependency)
// ---------------------------------------------------------------------------

export interface ValidationError {
  readonly path: string;
  readonly message: string;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly ValidationError[];
}

type JsonSchema = {
  type?: string | readonly string[];
  required?: readonly string[];
  properties?: Readonly<Record<string, JsonSchema>>;
  items?: JsonSchema;
  enum?: readonly unknown[];
  minimum?: number;
  maximum?: number;
  pattern?: string;
  additionalProperties?: boolean;
};

/**
 * Validate a value against a JSON-Schema subset (type/required/properties/
 * items/enum/minimum/maximum/pattern). Deliberately small — it is exercised by
 * the test suite and is the same logic a non-TS consumer can re-implement
 * against the emitted schema files.
 */
export function validate(
  value: unknown,
  schema: JsonSchema,
  path = "$",
): ValidationResult {
  const errors: ValidationError[] = [];
  walk(value, schema, path, errors);
  return { valid: errors.length === 0, errors };
}

function typeOf(v: unknown): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v;
}

function walk(
  value: unknown,
  schema: JsonSchema,
  path: string,
  errors: ValidationError[],
): void {
  if (schema.enum && !schema.enum.includes(value as never)) {
    errors.push({ path, message: `value not in enum ${JSON.stringify(schema.enum)}` });
  }
  if (schema.type) {
    const actual = typeOf(value);
    const declared = Array.isArray(schema.type) ? schema.type : [schema.type];
    const expected = declared.map((t) => (t === "integer" ? "number" : t));
    if (!expected.includes(actual)) {
      errors.push({ path, message: `expected ${declared.join("|")}, got ${actual}` });
      return; // type mismatch makes deeper checks meaningless
    }
    if (declared.includes("integer") && actual === "number" && !Number.isInteger(value)) {
      errors.push({ path, message: "expected integer" });
    }
  }
  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push({ path, message: `must be >= ${schema.minimum}` });
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push({ path, message: `must be <= ${schema.maximum}` });
    }
  }
  if (typeof value === "string" && schema.pattern) {
    if (!new RegExp(schema.pattern).test(value)) {
      errors.push({ path, message: `does not match pattern ${schema.pattern}` });
    }
  }
  if (schema.type === "object" && value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const req of schema.required ?? []) {
      if (!(req in obj)) {
        errors.push({ path: `${path}.${req}`, message: "required property missing" });
      }
    }
    for (const [key, child] of Object.entries(obj)) {
      const sub = schema.properties?.[key];
      if (sub) {
        walk(child, sub, `${path}.${key}`, errors);
      } else if (schema.additionalProperties === false) {
        errors.push({ path: `${path}.${key}`, message: "additional property not allowed" });
      }
    }
  }
  if (schema.type === "array" && Array.isArray(value) && schema.items) {
    value.forEach((item, i) => walk(item, schema.items as JsonSchema, `${path}[${i}]`, errors));
  }
}

// ---------------------------------------------------------------------------
// Schema accessors
// ---------------------------------------------------------------------------

export const SCHEMA_VERSION = "anatomy-contracts/v1" as const;

export {
  actionProposalSchema,
  policyDecisionSchema,
  reasonRequestSchema,
  reasonResponseSchema,
  spanHeadersSchema,
  meshReceiptSchema,
  meshReceiptV2Schema,
  regulatoryMappingSchema,
} from "./schemas.ts";
