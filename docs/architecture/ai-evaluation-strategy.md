# AI Evaluation Strategy — SZL Holdings Platform

**Version:** 1.0 · **Date:** April 2026
**Audience:** Engineers, data scientists, AI safety reviewers, domain pack authors, enterprise evaluators

**Related:** [MCP_GATEWAY_STRATEGY.md](mcp-gateway-strategy.md) · [architecture.md](architecture.md) · [API-SPEC.md](api-spec.md) · [ANALYTICS-EVENTS.md](analytics-events.md)

---

## Overview

Every AI recommendation the SZL Holdings platform generates must be measurable, reviewable, and improvable. This document defines the evaluation operating model: how recommendations are traced, how quality is scored, how feedback loops close, and how domain packs can extend the evaluation layer with custom metrics.

The evaluation system runs in two modes:
- **Offline evaluation** — Golden-set regression against a curated test suite (`lib/ai-engine/src/evals/golden-set.ts` + `run-evals.ts`)
- **Online evaluation** — Capture and score every live recommendation as it flows through the system (`lib/ai-engine/src/evals/trace-capture.ts` + `evaluator-hooks.ts`)

---

## Trace Capture

### What is captured

Every AI-assisted operation records an `AITrace` to the in-memory trace store (with optional external sink for persistence). The trace schema captures:

| Field | Description |
|-------|-------------|
| `traceId` | Unique trace identifier (`tr-{timestamp}-{random}`) |
| `model` | Model identifier used for the call |
| `modelProvider` | Provider (e.g., `openai`, `anthropic`, `huggingface`) |
| `modelVersion` | Specific model version tag |
| `routeClass` | Routing class (e.g., `critical`, `standard`, `economy`) |
| `domain` | Platform domain pack (`aegis`, `terra`, `vessels`, `alloy`, etc.) |
| `recommendationType` | Semantic type of recommendation |
| `promptHash` | SHA-256 (16-char prefix) of the prompt — for regression detection |
| `promptTokens` | Input token count |
| `completionTokens` | Output token count |
| `latencyMs` | End-to-end latency in milliseconds |
| `costEstimateUsd` | Estimated USD cost of the model call |
| `confidence` | Model confidence score `[0, 1]` |
| `riskLevel` | Risk classification of the recommendation |
| `requiresReview` | Whether the trace was auto-escalated to the review queue |
| `reviewReason` | Human-readable explanation for why review is required |
| `proofChainId` | Foreign key to the Proof Chain entry |
| `outcomeGraphId` | Foreign key to the Outcome Graph entry |
| `evalScore` | Score assigned by the evaluator hooks (filled post-evaluation) |
| `evalPassed` | Whether the trace passed the eval gate |

### When traces are captured

Traces are captured at the AI engine call boundary. The `captureTrace()` function in `lib/ai-engine/src/evals/trace-capture.ts` is called by:
- `ai-engine.ts` route handler after each recommendation generation
- Domain agent runners after structured completions
- The NuroMesh orchestrator after agent steps

### External sink

By default traces are held in an in-memory ring buffer (5,000 entries, FIFO eviction). Production deployments should call `registerTraceSink(fn)` to forward traces to a persistent store (PostgreSQL `ai_traces` table, recommended for full lifecycle tracking).

---

## Review Thresholds

Traces are automatically escalated to the human review queue when any of these conditions are met:

| Condition | Threshold | Priority |
|-----------|-----------|---------|
| Low confidence | `confidence < 0.55` | Medium |
| Very low confidence | `confidence < 0.40` | High |
| High-risk recommendation | `riskLevel in ["high", "critical"]` | High / Critical |
| High cost | `costEstimateUsd > $0.50` | Medium |

Review priority is computed from the combination of conditions above. `critical` risk level always maps to `critical` priority regardless of confidence.

---

## Evaluator Hook System

Domain packs register evaluation functions via `registerEvaluatorHook()`. Each hook:
- Receives the captured trace and optional domain context
- Returns a score `[0, 1]` and a set of assertions
- Can be scope to a specific domain or run globally

### Built-in global hooks

| Hook ID | Name | Description |
|---------|------|-------------|
| `global:confidence-threshold` | Global Confidence Threshold | Fails any recommendation with confidence < 0.40 |
| `global:latency-budget` | Global Latency Budget | Warns at > 10s latency |
| `global:cost-budget` | Global Cost Budget | Fails calls exceeding $1.00 estimated cost |

### Registering a domain-specific hook

```typescript
import { registerEvaluatorHook } from "@szl-holdings/ai-engine";

registerEvaluatorHook({
  id: "aegis:high-confidence-on-critical",
  name: "Aegis: High Confidence Required for Critical Incidents",
  domain: "aegis",
  description: "Critical incident recommendations must have confidence >= 0.8",
  version: "1.0.0",
  fn: async (trace, _ctx) => {
    if (trace.riskLevel !== "critical") {
      return { hookId, domain: trace.domain, traceId: trace.traceId, score: 1, passed: true, assertions: [], evaluatedAt: new Date().toISOString() };
    }
    const threshold = 0.8;
    const passed = trace.confidence >= threshold;
    return {
      hookId: "aegis:high-confidence-on-critical",
      domain: trace.domain,
      traceId: trace.traceId,
      score: trace.confidence / threshold,
      passed,
      assertions: [{ field: "confidence", operator: "gte", expected: threshold, actual: trace.confidence, passed, weight: 1.0 }],
      feedback: passed ? "Confidence sufficient for critical recommendation" : `Confidence ${trace.confidence} too low for critical`,
      evaluatedAt: new Date().toISOString(),
    };
  },
});
```

---

## Offline Evaluation

Golden-set regression (`runEvals()`) is used to verify that model changes do not degrade recommendation quality against a curated test suite.

### Golden set categories

| Category | Description |
|----------|-------------|
| `risk_extraction` | Correct risk level and score extraction |
| `owner_assignment` | Correct routing and owner suggestion |
| `escalation_proposal` | Correct escalation threshold decisions |
| `approval_gating` | Correct approval requirement identification |
| `evidence_citation` | Evidence references present when required |
| `retrieval_relevance` | RAG retrieval returns relevant chunks |
| `schema_validity` | Output matches expected JSON schema |
| `hallucination_rejection` | Fabricated facts are not included |
| `safe_fallback` | Safe fallback returned on ambiguous input |

### Running offline evals

```bash
# Via API
GET /api/ai/evals/run?categories=risk_extraction,owner_assignment

# Via library
import { runEvals } from "@szl-holdings/ai-engine";
const report = await runEvals(myExecutor, { categories: ["risk_extraction"] });
```

### Pass rate targets

| Category | Minimum Pass Rate |
|----------|--------------------|
| `risk_extraction` | 95% |
| `hallucination_rejection` | 100% |
| `safe_fallback` | 100% |
| `approval_gating` | 90% |
| All others | 85% |

---

## Online Evaluation

After capture, `runEvaluatorHooksForTrace()` scores the trace against all applicable domain hooks. The result updates `trace.evalScore` and `trace.evalPassed`.

Traces that fail the evaluator gate (`evalPassed = false`) are:
1. Flagged in the trace store (`status = "flagged"`)
2. Added to the review queue if not already present
3. Included in the AI Ops dashboard failure metrics

---

## Review Queue

Low-confidence and high-risk traces flow into the review queue (`/api/ai/ops/review-queue`). Human reviewers can:

| Verdict | Meaning |
|---------|---------|
| `approved` | Recommendation is acceptable; no corrective action |
| `rejected` | Recommendation is wrong or harmful; triggers Outcome Graph feedback |
| `flagged` | Suspicious quality; model or prompt investigation warranted |
| `escalated` | Requires escalation to a named team or individual |
| `deferred` | Insufficient context to decide; defer for more information |

Verdicts `rejected` and `flagged` feed into the Outcome Graph as `overridden` or `rejected` decisions, which in turn inform the `runLearningCalibration()` job.

---

## Human Feedback Loop

The feedback loop runs through three systems:

```
AI Recommendation
       │
       ▼
   Proof Chain  ──────────────────────── provenance tagging
       │
       ▼
  Outcome Graph  ─────────────────────── recommendation record
       │
       ▼
  User Decision (accepted / rejected / overridden)
       │
       ▼
  Review Queue verdict (if in queue)
       │
       ▼
  Learning Calibration Job (runLearningCalibration)
       │
       ▼
  Updated confidence calibration / escalation thresholds
```

The `runLearningCalibration()` function (`lib/outcome-graph/src/index.ts`) analyzes the last 30 days of outcomes and outputs calibration suggestions. These feed into manual model configuration adjustments.

---

## Escalation Thresholds

| Signal | Auto-Escalation |
|--------|----------------|
| Confidence < 0.40 on critical risk | Immediate escalation |
| 3+ consecutive rejections on a domain | Domain lead notification |
| Cost spike > 3× 7-day rolling average | Finance alert |
| Eval pass rate drops below 75% | Engineering alert |
| Review queue pending critical > 10 items | Ops center alert |

---

## Recommended Metrics by Domain Pack

### Aegis (Security & Defense)
- Threat confidence accuracy (predicted vs confirmed threat)
- False positive rate on critical incidents
- Mean time from recommendation to confirmed outcome
- CVE mapping accuracy

### Terra (Real Estate)
- Distress signal precision / recall
- Deal win rate for AI-recommended properties
- Owner identification accuracy
- Valuation error rate

### Vessels (Maritime Intelligence)
- Sanctions alert false positive rate
- Dark activity prediction accuracy (vs confirmed AIS gaps)
- P&L forecast error margin
- Cargo classification accuracy

### PRISM Counsel (Legal)
- Recovery outcome prediction accuracy
- Filing deadline risk precision
- Entity extraction recall

### Alloy (Workflow Engine)
- Action decision accuracy (accepted vs corrected)
- Approval routing correctness
- Escalation appropriateness rate

---

## AI Ops Dashboard

The AI Ops dashboard at `GET /api/ai/ops/summary` provides a 24-hour rolling view of:
- Total traces, review rate, avg confidence, avg latency, total cost
- Per-domain breakdowns
- Review queue status with priority buckets
- Evaluator hook pass rates

Full dashboard endpoints documented in [API-SPEC.md](api-spec.md).

---

## Cost & Latency Targets

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| P50 latency | < 2s | — |
| P95 latency | < 8s | > 10s |
| P99 latency | < 15s | > 20s |
| Cost per recommendation | < $0.05 | > $0.50 |
| Monthly AI cost per org | < $500 | > $1,000 |
| Eval pass rate | > 90% | < 75% |
| Review queue pending | < 50 items | > 200 items |

---

*Last updated: 2026-04-16. Re-verify against `lib/ai-engine/src/evals/`, `lib/outcome-graph/`, and `artifacts/api-server/src/routes/ai-ops-dashboard.ts` after evaluation system changes.*
