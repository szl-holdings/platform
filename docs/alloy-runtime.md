# Alloy Runtime — Architecture & Integration Guide

> Version: 1.0.0 · Package: `@szl/alloy`

## Overview

The Alloy Runtime is the unified cognitive operating layer every SZL product builds on. It collects ontology signals, evidence, policy decisions, run traces, and memory scopes into one surface, so that every recommendation that leaves the system carries a **full proof envelope** — not just a number, but the chain of evidence behind it.

---

## Core Contract

Every `alloy.recommend()` call returns a `RecommendationResult`:

```ts
interface RecommendationResult {
  id: string;
  runId: string;           // the run session that produced this
  traceId: string;         // the deterministic trace for replay

  value: unknown;          // the raw recommendation payload
  title: string;
  summary: string;
  reasoning: string;
  domain: string;

  confidence: number;               // 0–1 composite confidence score
  supportingEvidenceIds: string[];  // evidence that raises confidence
  contradictingEvidenceIds: string[]; // evidence that lowers confidence
  evidence: Evidence[];             // full evidence objects

  freshness: {
    generatedAt: string;     // ISO-8601
    isStale: boolean;
    validUntil?: string;     // ISO-8601
  };

  policyState: PolicyState;        // "unchecked" | "allowed" | "requires_approval" | "blocked"
  policyDecision?: PolicyDecision; // full policy evaluation result
  approvalMode: ApprovalMode;      // "none" | "pending" | "approved" | "rejected" | "escalated"
  autonomyMode: AutonomyMode;      // one of five autonomy modes

  urgency: "routine" | "moderate" | "urgent" | "critical";
  suggestedAction?: string;
  metadata: Record<string, unknown>;
}
```

---

## Five Autonomy Modes

The `autonomyMode` field controls how the system interacts with humans:

| Mode | Behaviour |
|---|---|
| `observe` | Alloy watches and records only. No recommendations surfaced. |
| `recommend` | Alloy surfaces recommendations; humans decide whether to act. |
| `draft` | Alloy drafts content, plans, or code for human review before use. |
| `ask-to-act` | Alloy proposes a specific action and waits for explicit approval. |
| `approved-act` | Alloy executes autonomously within pre-approved bounds. |

All modes are first-class in the API. Any recommendation can be inspected, replayed, and audited regardless of mode.

---

## Evidence Types

Evidence is the primary currency of confidence. Each `Evidence` record has:

- **id** — globally unique identifier
- **kind** — one of: `signal`, `memory`, `document`, `metric`, `observation`, `attestation`, `policy`, `trace`
- **label / value** — human-readable label and the evidence payload
- **source / sourceId** — where the evidence came from
- **freshness** — `capturedAt`, `isStale`, optional `maxAgeMs`
- **confidence** — 0–1 score for this individual piece of evidence
- **weight** — how much this evidence counts toward composite confidence

---

## Confidence Scoring

Confidence is computed as:

```
composite = base + evidenceAdjustment + freshnessAdjustment + policyAdjustment
```

- `evidenceAdjustment` — positive when supporting evidence outweighs contradicting evidence; negative otherwise. Stale evidence contributes at 50% weight.
- `freshnessAdjustment` — penalises recommendations backed by mostly stale evidence.
- `policyAdjustment` — lowers confidence when the action is blocked or requires approval (signals elevated risk).

The full breakdown is available in `metadata.confidenceBreakdown`.

---

## Run Sessions

Every call to `alloy.recommend()` opens a **run session**, records the outcome, and closes it. Sessions can also be managed manually for multi-step agent runs:

```ts
import { openSession, recordToolCall, recordHandoff, recordApproval, closeSession } from "@szl/alloy/session";

const session = openSession({ autonomyMode: "ask-to-act", objective: "Rebalance portfolio" });

recordToolCall(session.runId, "tool-bloomberg", "bloomberg.fetch", true, 240);
recordHandoff(session.runId, "research-agent", "execution-agent", "Research complete");
recordApproval(session.runId, "step-buy-equities", "pending");

const closed = closeSession(session.runId, { result: "executed" });
```

Sessions carry:
- Tool call records (tool id, name, success, latency)
- Agent handoffs (from/to agent, reason, timestamp)
- Approval events (approval id, step, decision)
- Evidence id references

---

## HTTP API Endpoints

All endpoints are mounted under `/api/alloy/` and require authentication.

### `POST /api/alloy/recommend`

Generate a recommendation through the unified Alloy runtime and receive back the full proof envelope.

**Body:**
```json
{
  "title": "string",
  "summary": "string",
  "reasoning": "string",
  "domain": "string",
  "autonomyMode": "recommend",
  "urgency": "urgent",
  "baseConfidence": 0.78,
  "inlineEvidence": [
    { "kind": "metric", "label": "...", "value": "...", "source": "..." }
  ],
  "suggestedAction": "string",
  "validForMs": 172800000
}
```

### `GET /api/alloy/evidence`

List all evidence records in the current session. Supports `limit` query param.

### `POST /api/alloy/evidence`

Create an evidence record.

**Body:**
```json
{
  "kind": "signal",
  "label": "Supplier lead-time alert",
  "value": "+18 days above baseline",
  "source": "vessels.supplier-monitor",
  "confidence": 0.88,
  "weight": 1.0,
  "maxAgeMs": 86400000
}
```

### `GET /api/alloy/evidence/:id`

Fetch a specific evidence record. Freshness is re-evaluated on read.

### `POST /api/alloy/policy/simulate`

Simulate a policy evaluation against the current registered policy set. Returns `policyState`, matched policies, violations, and reasoning without executing anything.

**Body:**
```json
{
  "action": "procurement.create_po",
  "domain": "vessels",
  "subject": { "roles": ["ops-manager"] },
  "resource": { "type": "purchase_order" },
  "estimatedCostUsd": 1200000,
  "confidence": 0.78,
  "urgency": "urgent"
}
```

### Existing run endpoints

- `GET /api/alloy/runs` — list all workflow runs
- `GET /api/alloy/runs/:id` — get a specific run
- `GET /api/alloy/runs/:id/steps` — step-by-step trace
- `POST /api/alloy/runs/:id/retry` — retry a failed run
- `POST /api/alloy/runs/:id/cancel` — cancel a run
- `GET /api/alloy/approvals` — list pending approvals
- `POST /api/alloy/approvals/:id/decide` — approve or reject

---

## Integrating from a Product App

```ts
import { recommend, type RecommendationResult } from "@szl/alloy";

const result: RecommendationResult = await recommend({
  title: "Increase buffer inventory Q3",
  summary: "Supply chain signals indicate risk",
  reasoning: "Lead times have degraded 18 days; Q3 historical pattern shows 14% stockout rate",
  domain: "vessels",
  autonomyMode: "ask-to-act",
  urgency: "urgent",
  baseConfidence: 0.78,
  inlineEvidence: [
    { kind: "metric", label: "Stockout rate", value: "14.2%", source: "vessels.analytics" },
    { kind: "signal", label: "Lead-time alert", value: "+18 days", source: "vessels.supplier-monitor" },
  ],
  suggestedAction: "Pre-approve $1.2M buffer PO for three depots",
});

console.log(result.confidence);      // 0.–1 composite
console.log(result.policyState);     // "allowed" | "requires_approval" | "blocked"
console.log(result.autonomyMode);    // "ask-to-act"
console.log(result.evidence);        // full evidence array
```

---

## Package Map

| Package | Role |
|---|---|
| `@szl/alloy` | **Unified facade** — this package. All products import from here. |
| `@workspace/alloy` | Run manager, checkpoint/replay, model router, action ledger |
| `@szl-holdings/decision-engine` | Signal scoring, ranking, recommendation generation |
| `@szl-holdings/policy-engine` | Policy evaluation, guardrail enforcement |
| `@workspace/trace-graph` | Full-fidelity run trace capture and replay |
| `@workspace/memory-fabric` | Multi-tier memory (working, episodic, semantic, etc.) |
| `@workspace/cognitive-runtime` | OODA loop orchestration (perceive → orient → plan → execute → verify → reflect) |
| `@workspace/guardian` | Safety gateway, guardrail decisions |
| `@workspace/replay-core` | Deterministic replay infrastructure |

---

## Deprecation Path

All previous direct imports from `@workspace/alloy`, `@szl-holdings/decision-engine`, `@szl-holdings/policy-engine`, or `@workspace/trace-graph` remain valid. The `@szl/alloy` facade re-exports them with the canonical names. Migrate at your own pace — there are no breaking changes.
