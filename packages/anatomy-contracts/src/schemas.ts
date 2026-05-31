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

export const ALL_SCHEMAS = {
  "span-headers": spanHeadersSchema,
  "action-proposal": actionProposalSchema,
  "policy-decision": policyDecisionSchema,
  "reason-request": reasonRequestSchema,
  "reason-response": reasonResponseSchema,
  "mesh-receipt": meshReceiptSchema,
} as const;
