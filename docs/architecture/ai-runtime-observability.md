# AI Runtime Observability — SZL Holdings Platform

**Version:** 1.0 · **Date:** April 2026
**Audience:** Platform engineers, AI operations, on-call responders, enterprise evaluators

**Related:** [AI_EVALUATION_STRATEGY.md](ai-evaluation-strategy.md) · [GUARDRAILS_MODEL.md](guardrails-model.md) · [AGENT_GATEWAY_STRATEGY.md](agent-gateway-strategy.md) · [MCP_GATEWAY_STRATEGY.md](mcp-gateway-strategy.md) · [ANALYTICS-EVENTS.md](analytics-events.md) · [OPERATIONS-RUNBOOK.md](../operations/operations-runbook.md)

---

## Overview

Every AI-assisted flow on the SZL Holdings platform emits a structured trace. The trace is the single source of truth for what the model saw, what it answered, how long it took, what it cost, how confident it was, and whether guardrails fired. Traces feed four consumers:

| Consumer | Purpose |
|----------|---------|
| **AI Ops dashboard** | Live cost, latency, quality, drift, review-queue depth |
| **Review queue** | Low-confidence, high-risk, high-cost, or eval-failed traces routed to humans |
| **Outcome Graph** | Recommendation → acceptance → realised outcome lifecycle |
| **Offline eval pipeline** | Golden-set regression, domain-specific quality scoring |

Observability is tenant-scoped: an org only sees its own traces unless the caller is a global admin.

---

## Trace capture

### What is captured

Every AI call records an `AITrace` via `captureTrace()` (`lib/ai-engine/src/evals/trace-capture.ts`). Fields:

| Field | Meaning |
|-------|---------|
| `traceId` | Unique ID (`tr-{timestamp}-{random}`) — opaque, not linkable to PII |
| `correlationId` | Workflow/request correlation ID — joins across surfaces |
| `orgId` | Tenant scope (required for non-admin read) |
| `model`, `modelProvider`, `modelVersion` | Model lineage |
| `routeClass` | Routing class (`critical`, `standard`, `economy`) |
| `domain` | Domain pack (`aegis`, `terra`, `vessels`, `prism_counsel`, `alloy`, `lyte`, `cortex`, `global`) |
| `recommendationType` | Semantic recommendation type |
| `promptHash` | SHA-256 (16-char) of the prompt — enables regression detection without retaining prompt content |
| `promptTokens`, `completionTokens` | Token usage |
| `latencyMs`, `costEstimateUsd` | Performance + cost |
| `confidence` | Model confidence `[0, 1]` |
| `riskLevel` | `low` / `medium` / `high` / `critical` |
| `toolsUsed` | Tool chain used during generation (MCP gateway tools, retrievers, etc.) |
| `requiresReview`, `reviewReason` | Guardrail outcome |
| `proofChainId`, `outcomeGraphId` | Cross-references to Proof Chain + Outcome Graph |
| `evalScore`, `evalPassed`, `status` | Evaluator verdict |
| `capturedAt` | Timestamp |

### Where capture happens

`captureTrace()` is invoked at the boundary of every AI-assisted route. Current sites:

| Site | File |
|------|------|
| Alloy chat completion | `artifacts/api-server/src/routes/ai-engine.ts` (respond) |
| Alloy action decisioning | `artifacts/api-server/src/routes/ai-engine.ts` (decision) |
| Alloy plan | `artifacts/api-server/src/routes/ai-engine.ts` (plan) |
| Domain agent runs | `artifacts/api-server/src/routes/domain-agents/*` |
| MCP tool invocations | `artifacts/api-server/src/routes/mcp.ts` |

Traces are stored in an in-memory ring buffer (`MAX_IN_MEMORY_TRACES = 5000`) with an optional external sink (`registerTraceSink()`) for durable persistence.

### Model + tool lineage

Any trace can be inspected end-to-end via:

```
GET /api/ai/ops/traces/:id
```

The response includes `model`, `modelProvider`, `modelVersion`, `routeClass`, `toolsUsed`, `promptHash`, token counts, latency, cost, confidence, and any attached `proofChainId`. Operators can follow `proofChainId` into the Proof Chain for the full decision record, and `outcomeGraphId` into the Outcome Graph for realised outcomes.

---

## Evaluator hooks

Evaluator hooks are registered at runtime (`registerEvaluatorHook`) and can be scoped to a domain, a recommendation type, or global. Two modes:

- **Online evaluator** — Runs synchronously after `captureTrace` via `runEvaluatorHooksForTrace`. Writes `evalScore` and `evalPassed` onto the trace. Failed traces are auto-enqueued for review with reason `eval_failed`.
- **Offline regression** — `run-evals.ts` executes all hooks against the golden set (`golden-set.ts`) in batch. Used for CI regression gates and model upgrade validation.

`GET /api/ai/ops/evaluators` lists registered hooks. `GET /api/ai/ops/evaluators/stats` returns pass rates per hook (admin-only).

---

## Human feedback capture

Operators and reviewers can attach thumbs-up/down feedback with optional correction text to any trace they have tenant access to:

```
POST /api/ai/ops/traces/:id/feedback
  body: { sentiment: "up" | "down", correction?: string, comment?: string }

GET  /api/ai/ops/traces/:id/feedback
```

A `down` sentiment marks the trace `flagged` so it surfaces in the review queue. Feedback rows carry `{ feedbackId, traceId, orgId, userId, sentiment, correction?, comment?, recordedAt }` and are consumed by the eval pipeline as ground-truth signal for continuous improvement.

No free-text content is emitted to third-party analytics tools (see [ANALYTICS-EVENTS.md](analytics-events.md#privacy-rules-for-ai-evaluation-events)).

---

## Review queue

Traces are auto-routed to the review queue when any of the following fires:

| Condition | Source |
|-----------|--------|
| `confidence < 0.55` | `REVIEW_CONFIDENCE_THRESHOLD` in `trace-capture.ts` |
| `riskLevel in {high, critical}` | `REVIEW_HIGH_RISK_LEVELS` |
| `costEstimateUsd > $0.50` | `REVIEW_COST_THRESHOLD_USD` |
| Online evaluator returns `passed=false` | `runAndPersistEval` |
| Human feedback `sentiment = down` | Feedback endpoint |

Items are prioritised (`critical > high > medium > low`) by `computePriority()` in `review-queue.ts`.

Operator APIs:

| Route | Purpose |
|-------|---------|
| `GET /api/ai/ops/review-queue` | List items, tenant-scoped, filterable |
| `GET /api/ai/ops/review-queue/stats` | Depth by priority / domain |
| `PATCH /api/ai/ops/review-queue/:id/claim` | Claim item |
| `PATCH /api/ai/ops/review-queue/:id/decision` | Record `approved / rejected / flagged / escalated / deferred` |

Verdicts feed `ai_review_decided` and `ai_review_escalated` analytics events (see [ANALYTICS-EVENTS.md](analytics-events.md#ai-evaluation--operations-events)).

---

## Cost / latency / quality dashboard

`GET /api/ai/ops/summary` returns a tenant-scoped 24-hour snapshot:

```jsonc
{
  "period": "last_24h",
  "traces": {
    "total": 1284,
    "reviewRequired": 42,
    "reviewRate": 0.033,
    "avgLatencyMs": 612,
    "avgConfidence": 0.83,
    "totalCostUsd": 4.7821,
    "evalPassRate": 0.96
  },
  "byDomain": [ ... per-domain breakdown ... ],
  "reviewQueue": { "pending": 12, "inReview": 3, "critical": 1 },
  "evaluators": { "registered": 9, "avgPassRate": 0.94 }
}
```

### Recommendation drift view

Drift is computed from `aggregateTraces()` windows. A sustained drop in `evalPassRate` for a domain (week-over-week) triggers `ai_eval_pass_rate_drop`. The AI Ops dashboard surfaces:

- Confidence distribution shift per domain
- `promptHash` coverage (new prompts entering production)
- Model mix (routing-class distribution) vs. the prior window
- Acceptance-rate trend from the Outcome Graph per `recommendationType`

---

## Analytics events

All AI runtime signals emitted to the analytics pipeline are documented in [ANALYTICS-EVENTS.md § AI Evaluation & Operations Events](analytics-events.md#ai-evaluation--operations-events):

`ai_trace_captured`, `ai_trace_flagged`, `ai_eval_run`, `ai_eval_pass_rate_drop`, `ai_review_claimed`, `ai_review_decided`, `ai_review_escalated`, `ai_cost_spike`, `ai_latency_exceeded`, `mcp_tool_invoked`, `mcp_tool_denied`, `mcp_approval_queued`, `ai_learning_job_completed`.

Server-side structured log `guardrail.triggered` (emitted via the pino logger in `routes/ai-engine.ts`) carries the full context of any guardrail firing — see [GUARDRAILS_MODEL.md](guardrails-model.md).

---

## Tenancy & access

| Surface | Who can read |
|---------|-------------|
| Their own org's traces, review queue, summary | `analyst`, `operator`, `admin`, `super_admin` within the org |
| Cross-tenant aggregates | `admin`, `super_admin` (global) only |
| Evaluator registry / stats | `admin`, `super_admin` only |
| Feedback on own-org traces | Any authenticated user with org membership |

Tenant isolation is enforced at every endpoint via `canAccessOrgResource()` in `routes/ai-ops-dashboard.ts`. See [TENANCY-MODEL.md](tenancy-model.md) for the full isolation model.

---

## Runbook pointers

- [OPERATIONS-RUNBOOK.md § Health & Monitoring](../operations/operations-runbook.md#5-health--monitoring) — Self-monitor thresholds
- Cost spike triage: filter `ai_cost_spike` events by `domain` and `model`; inspect the offending trace via `GET /api/ai/ops/traces/:id`
- Pass-rate drop triage: `GET /api/ai/ops/evaluators/stats` → identify failing hook → pull sample flagged traces → queue for human review

---

*Last verified against source code: 2026-04-16.*
