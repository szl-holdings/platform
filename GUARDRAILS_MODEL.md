# Guardrails Model — SZL Holdings Platform

**Version:** 1.0 · **Date:** April 2026
**Audience:** Platform engineers, AI safety reviewers, enterprise evaluators, compliance

**Related:** [AI_RUNTIME_OBSERVABILITY.md](AI_RUNTIME_OBSERVABILITY.md) · [AI_EVALUATION_STRATEGY.md](AI_EVALUATION_STRATEGY.md) · [AGENT_GATEWAY_STRATEGY.md](AGENT_GATEWAY_STRATEGY.md) · [MCP_GATEWAY_STRATEGY.md](MCP_GATEWAY_STRATEGY.md) · [ACCESS-CONTROL-MATRIX.md](ACCESS-CONTROL-MATRIX.md) · [SECURITY-CHECKLIST.md](SECURITY-CHECKLIST.md)

---

## Overview

A **guardrail** on this platform is any automated rule that, when matched, halts or diverts an AI-assisted action from a fast-path (auto-execute / auto-accept) into a slower, human-mediated path (review queue, approval workflow, outright denial). Guardrails are the governance layer that makes AI output **proposable, not unilateral**.

Guardrails apply at four points in the 9-step decision loop:

```
Signal → Context → Recommendation ─┬→ [1. Quality guardrails]
                                    ▼
                           Simulation ─┬→ [2. Risk guardrails]
                                       ▼
                                Policy ─┬→ [3. Policy guardrails]
                                        ▼
                              Execution ─┬→ [4. Tool-gateway guardrails]
                                         ▼
                                      Proof → Outcome → Learning
```

Every guardrail trigger is **logged structurally** (`event: guardrail.triggered`) and **analytics-observable** via the existing AI eval events (see [ANALYTICS-EVENTS.md](ANALYTICS-EVENTS.md#ai-evaluation--operations-events)).

---

## 1. Quality guardrails (recommendation layer)

Applied at `captureTrace` time in `lib/ai-engine/src/evals/trace-capture.ts`.

| Rule | Threshold | Action |
|------|-----------|--------|
| Low confidence | `confidence < 0.55` | Auto-enqueue for human review |
| High cost | `costEstimateUsd > $0.50` | Auto-enqueue for human review |
| Evaluator-hook failure | Any registered online hook returns `passed=false` | Mark trace `flagged`; enqueue with reason `eval_failed` |
| Human thumbs-down | `POST /ai/ops/traces/:id/feedback { sentiment: "down" }` | Mark trace `flagged` |

Thresholds are configured via constants in `trace-capture.ts`:

```ts
export const REVIEW_CONFIDENCE_THRESHOLD = 0.55;
export const REVIEW_HIGH_RISK_LEVELS = ["high", "critical"];
export const REVIEW_COST_THRESHOLD_USD = 0.50;
```

Any future domain-specific override must go through a `registerEvaluatorHook` with its own threshold — do not mutate the global constants without review.

---

## 2. Risk guardrails (simulation & recommendation layer)

Applied when the trace carries a `riskLevel`.

| Rule | Match | Action |
|------|-------|--------|
| High risk | `riskLevel === "high"` | Auto-enqueue (priority `high`) |
| Critical risk | `riskLevel === "critical"` | Auto-enqueue (priority `critical`); may also trigger approval workflow |

`riskLevel` is assigned by the recommending service (Aegis threat triage, Terra deal risk, Vessels voyage P&L risk, etc.). Domains are responsible for setting `riskLevel` honestly — the platform trusts the declared value.

---

## 3. Policy guardrails (covenant policy layer)

Enforced by the Covenant Policy engine (`lib/covenant-policy/src/engine.ts`) at decision time. If a policy matches with effect `deny`, the action is **not executed** — the caller receives `policy_denied` and the denial is recorded in the Proof Chain.

If a policy has effect `require_approval`, the decision is held in `pending_approval` until a qualified approver decides it. Approver role resolution is handled per domain (see `APPROVAL_MATRIX` in `lib/ai-engine`).

Policy denials emit analytics event `approval_policy_denied` with `{ policy_name, domain, denied_action, org_id (hashed) }`.

### Policy appeal path

Any user with access to the Proof Chain entry can appeal a policy denial via `POST /api/audit-log/policy-appeal`. Appeals go into the review queue for an admin verdict. See the Aegis trust-provenance surface for the UX binding.

---

## 4. Tool-gateway guardrails (MCP / Agent Gateway)

Applied at the Agent Gateway (`artifacts/api-server/src/routes/mcp.ts`). Every tool call is subjected to:

| Rule | Source | Action |
|------|--------|--------|
| Role check | `ACCESS-CONTROL-MATRIX.md` per-tool role requirement | Deny with `mcp_tool_denied`, reason `insufficient_role` |
| Tenant check | Caller's `orgs[0].orgId` vs. tool's declared tenant scope | Deny, reason `tenant_scope_mismatch` |
| Approval-gated tool | Tool is annotated `requires_approval: true` | Return `pending_approval`; emit `mcp_approval_queued` |
| Read-only mode | Caller does not hold `executor` or higher role | Return `propose_only` decision |
| Rate limit | Per-org rate limiter | HTTP 429 |

The full tool inventory and governance flags live in [MCP_GATEWAY_STRATEGY.md § Tool Inventory](MCP_GATEWAY_STRATEGY.md#tool-inventory) and [ACCESS-CONTROL-MATRIX.md](ACCESS-CONTROL-MATRIX.md).

---

## Guardrail trigger visibility

Whenever any guardrail fires, the API server emits a structured log via pino:

```jsonc
{
  "level": "info",
  "event": "guardrail.triggered",
  "traceId": "tr-1713301205123-xr84jk3p",
  "orgId": 42,
  "domain": "aegis",
  "model": "gpt-4-turbo",
  "modelProvider": "openai",
  "recommendationType": "threat_triage",
  "confidence": 0.48,
  "riskLevel": "high",
  "costEstimateUsd": 0.022,
  "latencyMs": 512,
  "rule": "auto_capture" | "eval_failed" | "override",
  "reason": "Low confidence: 0.48 < 0.55",
  "action": "enqueue_for_review",
  "msg": "AI guardrail triggered"
}
```

This log is ingested by the observability pipeline and surfaces in the AI Ops dashboard. Operators can filter by `rule`, `domain`, `model`, or `orgId` to understand which guardrails are firing most often and why.

Policy-layer and tool-gateway denials emit their own analytics events (`approval_policy_denied`, `mcp_tool_denied`, `mcp_approval_queued`) in addition to the Proof Chain entry.

---

## Analytics coverage

Every guardrail event in this document is covered by the analytics taxonomy:

| Guardrail layer | Analytics events |
|-----------------|------------------|
| Quality | `ai_trace_flagged`, `ai_eval_run`, `ai_cost_spike`, `ai_latency_exceeded` |
| Risk | `ai_trace_flagged` (with `risk_level`) |
| Policy | `approval_policy_denied`, `approval_requested`, `approval_cycle_completed` |
| Tool gateway | `mcp_tool_invoked`, `mcp_tool_denied`, `mcp_approval_queued` |

See [ANALYTICS-EVENTS.md](ANALYTICS-EVENTS.md) for the full contract.

---

## Tuning guardrails

Thresholds are deliberately conservative. To tune:

1. Propose a threshold change in a task spec with target domain and measured impact (expected false-positive / false-negative rate).
2. Add or adjust a `registerEvaluatorHook` — prefer domain-scoped hooks to global constant changes.
3. Run `lib/ai-engine/src/evals/run-evals.ts` against the golden set before/after.
4. Roll out behind a feature gate; monitor `ai_trace_flagged` rate for the domain.
5. If review-queue depth grows unboundedly, the threshold is too loose — revert.

---

## Out of scope for this document

- The Covenant Policy DSL itself — see `lib/covenant-policy/README.md`.
- Domain-specific policy catalogs — see each domain pack's `policies/` directory.
- Human-in-the-loop review workflow UX — see the Aegis trust-provenance surface.

---

*Last verified against source code: 2026-04-16.*
