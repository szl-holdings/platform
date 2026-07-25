// SPDX-License-Identifier: Apache-2.0
// © 2026 Lutar, Stephen P. — SZL Holdings
//
// schemas.ts — JSON-Schema-subset definitions for every mesh wire contract.
// These objects are the single source of truth; ./schema/*.json files are
// generated from them by scripts/emit-schemas.ts so non-TS apps (amaru/Python)
// validate against byte-identical schemas.

export const spanHeadersSchema = {
  $id: "https://schemas.szlholdings.com/anatomy/span-headers.v1.json",
  title: "SpanHeaders",
  type: "object",
  required: ["traceparent"],
  properties: {
    traceparent: {
      type: "string",
      pattern: "^00-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$",
    },
    tracestate: { type: "string" },
  },
} as const;

export const actionProposalSchema = {
  $id: "https://schemas.szlholdings.com/anatomy/action-proposal.v1.json",
  title: "ActionProposal",
  type: "object",
  required: [
    "actionId",
    "summary",
    "severity",
    "decisionClass",
    "confidence",
    "witnesses",
    "principal",
  ],
  properties: {
    actionId: { type: "string" },
    summary: { type: "string" },
    severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
    decisionClass: {
      type: "string",
      enum: ["autonomous", "advisory", "human-required"],
    },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    witnesses: { type: "array", items: { type: "string" } },
    principal: { type: "string" },
    payload: { type: "object" },
  },
} as const;

export const policyDecisionSchema = {
  $id: "https://schemas.szlholdings.com/anatomy/policy-decision.v1.json",
  title: "PolicyDecision",
  type: "object",
  required: [
    "actionId",
    "decision",
    "gate",
    "decidedBy",
    "rationale",
    "lambdaScore",
    "receiptHash",
    "traceparent",
  ],
  properties: {
    actionId: { type: "string" },
    decision: { type: "string", enum: ["allow", "deny"] },
    gate: { type: "string" },
    decidedBy: {
      type: "string",
      enum: ["a11oy.gate", "sentra.immune", "a11oy.gate+sentra.immune"],
    },
    rationale: { type: "string" },
    lambdaScore: { type: "number" },
    receiptHash: { type: "string" },
    traceparent: {
      type: "string",
      pattern: "^00-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$",
    },
  },
} as const;

export const reasonRequestSchema = {
  $id: "https://schemas.szlholdings.com/anatomy/reason-request.v1.json",
  title: "ReasonRequest",
  type: "object",
  required: ["actionId", "chakra", "envelope"],
  properties: {
    actionId: { type: "string" },
    chakra: { type: "string" },
    envelope: { type: "object" },
  },
} as const;

export const reasonResponseSchema = {
  $id: "https://schemas.szlholdings.com/anatomy/reason-response.v1.json",
  title: "ReasonResponse",
  type: "object",
  required: ["actionId", "chakra", "rationale", "provenance", "evaluation", "traceparent"],
  properties: {
    actionId: { type: "string" },
    chakra: { type: "string" },
    rationale: { type: "string" },
    provenance: {
      type: "object",
      required: ["source", "chakra"],
      properties: {
        source: { type: "string" },
        chakra: { type: "string" },
        amaruVersion: { type: "string" },
      },
    },
    evaluation: { type: "object" },
    traceparent: {
      type: "string",
      pattern: "^00-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$",
    },
  },
} as const;

export const meshReceiptSchema = {
  $id: "https://schemas.szlholdings.com/anatomy/mesh-receipt.v1.json",
  title: "MeshReceipt",
  type: "object",
  required: [
    "receiptId",
    "eventType",
    "actorId",
    "toolName",
    "payloadHash",
    "prevReceiptHash",
    "timestampIso8601",
    "traceId",
  ],
  properties: {
    receiptId: { type: "string" },
    eventType: { type: "string" },
    actorId: { type: "string" },
    toolName: { type: "string" },
    payloadHash: { type: "string" },
    prevReceiptHash: { type: ["string", "null"] as unknown as string },
    timestampIso8601: { type: "string" },
    traceId: { type: ["string", "null"] as unknown as string },
  },
} as const;

export const regulatoryMappingSchema = {
  $id: "https://schemas.szlholdings.com/anatomy/regulatory-mapping.v1.json",
  title: "RegulatoryMapping",
  type: "object",
  required: ["eu_ai_act", "nist_ai_rmf", "owasp_asi", "iso_42001"],
  additionalProperties: false,
  properties: {
    eu_ai_act: {
      type: "object",
      required: [
        "article",
        "obligation",
        "annex_iii_category",
        "high_risk",
        "log_retention_class",
      ],
      additionalProperties: false,
      properties: {
        article: { type: "string", pattern: "^[0-9]+[a-z]?$" },
        obligation: { type: "string" },
        annex_iii_category: { type: ["string", "null"] },
        high_risk: { type: "boolean" },
        log_retention_class: {
          type: "string",
          enum: ["lifetime", "6mo", "session"],
        },
      },
    },
    nist_ai_rmf: {
      type: "object",
      required: ["function", "subcategory"],
      additionalProperties: false,
      properties: {
        function: {
          type: "string",
          enum: ["GOVERN", "MAP", "MEASURE", "MANAGE"],
        },
        subcategory: { type: "string" },
      },
    },
    owasp_asi: {
      type: "array",
      items: { type: "string", pattern: "^ASI[0-9]{2}$" },
    },
    iso_42001: {
      type: "object",
      required: ["control"],
      additionalProperties: false,
      properties: {
        control: { type: "string" },
      },
    },
  },
} as const;

/**
 * Additive v2 receipt schema. The original eight mesh fields remain unchanged.
 * `schemaVersion` and `regulatory` are optional so v1 receipts remain valid
 * inputs; new emitters should set both.
 */
export const meshReceiptV2Schema = {
  $id: "https://schemas.szlholdings.com/anatomy/mesh-receipt.v2.json",
  title: "MeshReceiptV2",
  type: "object",
  required: [
    "receiptId",
    "eventType",
    "actorId",
    "toolName",
    "payloadHash",
    "prevReceiptHash",
    "timestampIso8601",
    "traceId",
  ],
  properties: {
    ...meshReceiptSchema.properties,
    schemaVersion: { type: "string", enum: ["2.0"] },
    regulatory: regulatoryMappingSchema,
  },
} as const;

export const ALL_SCHEMAS = {
  "span-headers": spanHeadersSchema,
  "action-proposal": actionProposalSchema,
  "policy-decision": policyDecisionSchema,
  "reason-request": reasonRequestSchema,
  "reason-response": reasonResponseSchema,
  "mesh-receipt": meshReceiptSchema,
} as const;

/** Exact output filename -> schema map used by the cross-language emitter. */
export const EMITTED_SCHEMAS = {
  "span-headers.v1.json": spanHeadersSchema,
  "action-proposal.v1.json": actionProposalSchema,
  "policy-decision.v1.json": policyDecisionSchema,
  "reason-request.v1.json": reasonRequestSchema,
  "reason-response.v1.json": reasonResponseSchema,
  "mesh-receipt.v1.json": meshReceiptSchema,
  "regulatory-mapping.v1.json": regulatoryMappingSchema,
  "mesh-receipt.v2.json": meshReceiptV2Schema,
} as const;
