# Model Backbone Blueprint
## SZL Holdings — Governed Multi-Agent Runtime (Moonshot Phase 2)

> **Status:** Phases 2–7 complete — backbone implemented, KORA lane wired as reference integration; specialist stubs promoted per-phase schedule through Cloud/Ops (Phase 7).
> **Phase 8 (GitHub Push Prep)** is the current milestone.

---

## 1. What Is the Agent Backbone?

The backbone is a shared, governed multi-agent runtime that every SZL lane
(KORA, A11oy, PARAGON, SEXTANT, DOMAINE, Counsel, Carlota Jo, Unified Command)
inherits from. It replaces ad-hoc agent code with small specialist modules
coordinated by the **Alloy coordinator** (`@workspace/alloy`) — a stateless coordinator that:

1. Validates the incoming **AgentRequest envelope**.
2. Runs the **Policy Evaluator** specialist first (deny → return; requires-approval → route; allowed → proceed).
3. Dispatches the **Planner** specialist (and any additional specialists).
4. Records every tool call in the **Run Ledger**.
5. Scores consequential recommendations through the **Domain-Jury Evaluator**.
6. Returns a fully typed **AgentResponse envelope** with a `ledgerId` for downstream audit.

---

## 2. Package Map

| Package | Path | Role |
|---|---|---|
| `@workspace/alloy` | `packages/alloy` | Coordinator — composes specialists, persists ledger, returns envelope |
| `@workspace/eval-os` | `packages/eval-os` | Domain-jury evaluator pipeline |
| `@workspace/tool-registry` | `packages/tool-registry` | Typed catalog of all tools available to specialists |
| `@workspace/agent-core` | `packages/agent-core` | Run context factory, capability resolver, agent role contracts |
| `@workspace/agents-core` | `packages/agents-core` | AgentRun lifecycle, approval gates, dead-letter, step logging |
| `@workspace/planner` | `packages/planner` | Mission Planner specialist — decomposes objectives into plan graphs |
| `@workspace/policy-guard` | `packages/policy-guard` | Policy Evaluator specialist — evaluates actions against policy rules |
| `@workspace/approvals-inbox` | `packages/approvals-inbox` | Approval Router specialist — routes pending actions to human approvers |
| `@workspace/run-ledger` | `packages/run-ledger` | Tool-call ledger builder + quality gate |
| `@workspace/szl-alloy` | `packages/szl-alloy` | Domain-specific Alloy session, recommendation, evidence, confidence |
| `@workspace/guardian` | `packages/guardian` | Guardian decision engine — tier-based policy tiers |
| `@workspace/cognitive-runtime` | `packages/cognitive-runtime` | Full OODA loop orchestrator (perceive→orient→plan→execute→reflect) |
| `@workspace/aef-policy-guard` | `packages/aef-policy-guard` | AEF policy guard (tenant isolation, redaction, retention) |
| `@workspace/aef-evidence-ledger` | `packages/aef-evidence-ledger` | AEF evidence ledger (FS-backed, queryable) |
| `@workspace/aef-workflow-runtime` | `packages/aef-workflow-runtime` | AEF workflow runtime (actors, approval, state machine) |
| `@workspace/aef-sdk` | `packages/aef-sdk` | AEF client SDK (env config, hooks, error types) |
| `@workspace/aef-evals` | `packages/aef-evals` | AEF eval harness (runner, metrics, reporters) |
| `@workspace/agents-tools` | `packages/agents-tools` | Tool bridge, gateway, typed registry |
| `@workspace/agents-prompts` | `packages/agents-prompts` | Prompt registry, reference, seed |
| `@workspace/agents-evals` | `packages/agents-evals` | Agent eval runner, replay-eval, suite builders |

---

## 3. The Open-Responses Envelope

Every request/response through the Alloy coordinator uses a typed envelope.

### `AgentRequest`
```typescript
{
  requestId?: string          // generated if omitted
  tenantId?: string
  surface: string             // "lyte" | "vessels" | "terra" | ...
  domain: string              // stable domain label for routing + policy
  objective: string           // human-readable goal
  autonomyMode:               // "observe" | "recommend" | "draft" | "ask-to-act" | "approved-act"
  context: Record<string, unknown>
  traceId?: string            // propagated into ledger
  metadata: Record<string, unknown>
}
```

### `AgentResponse`
```typescript
{
  requestId: string
  runId: string
  traceId: string
  ledgerId?: string           // run-ledger entry for audit
  status: "completed" | "pending_approval" | "blocked" | "failed"
  recommendation?: {
    id: string
    title: string
    summary: string
    reasoning: string
    confidence: number        // 0–1
    juryScores?: JuryScores   // populated when eval-os runs
  }
  toolCalls: EnvelopeToolCall[]
  policyGate?: { verdict, reason, evaluatedAt, matchedRules }
  approvalRequest?: { approvalId, approverRole, reason }
  warnings: string[]
  error?: string
  durationMs: number
  completedAt: string         // ISO-8601
}
```

---

## 4. Specialist Roster

| ID | Class | Status | Phase |
|---|---|---|---|
| `planner` | `PlannerSpecialist` | Live — uses `@workspace/planner` | Phase 2 |
| `policy-evaluator` | `PolicyEvaluatorSpecialist` | Live — uses `@workspace/policy-guard` | Phase 2 |
| `approval-router` | `ApprovalRouterSpecialist` | Live — uses `@workspace/approvals-inbox` | Phase 2 |
| `retrieval` | `RetrievalSpecialist` | Stub | Phase 4 |
| `document` | `DocumentSpecialist` | Stub | Phase 3 |
| `speech` | `SpeechSpecialist` | Stub | Phase 3 |
| `forecasting` | `ForecastingSpecialist` | Stub | Phase 5 |
| `anomaly` | `AnomalySpecialist` | Stub | Phase 5 |

Specialists implement the simple `Specialist` interface:

```typescript
interface Specialist {
  readonly id: string;
  readonly displayName: string;
  handle(request: AgentRequest): Promise<SpecialistResult>;
}
```

Replace a built-in stub with a production specialist by calling:
```typescript
import { replaceSpecialist } from "@workspace/alloy/specialists";
replaceSpecialist(new MyProductionForecastingSpecialist());
```

---

## 5. Tool-Call Ledger

Every specialist tool call is written to the **Run Ledger** via `@workspace/run-ledger`.
The ledger captures:

- `toolId`, `stepId`, `latencyMs`, `outcome` (success/failure/skipped), `error?`
- Jury eval scores keyed by metric name
- Timing stages, approval events, policy outcomes

The in-memory `InMemoryRunLedgerStore` is the default. Install a DB-backed adapter
at startup:

```typescript
import { setHistoryAdapter } from "@workspace/run-ledger";
setHistoryAdapter(new DrizzleRunLedgerStore(db));
```

---

## 6. Domain-Jury Evaluator (`@workspace/eval-os`)

The jury runs after the coordinator has assembled its recommendation and scores
it on five dimensions before returning the response.

### Dimensions & Weights

| Dimension | Weight | What it measures |
|---|---|---|
| Grounding | 0.25 | Tool-call success rate + specialist diversity |
| Actionability | 0.20 | Presence of title/summary/reasoning + planner involvement |
| Policy Compliance | 0.25 | Policy gate verdict (allowed=1.0, requires-approval=0.6, blocked=0.0) |
| Reversibility | 0.15 | Autonomy mode + absence of destructive tool IDs |
| Confidence | 0.15 | Raw confidence adjusted by tool success rate |

**Composite = weighted sum.** Score ≥ 0.5 → `passed: true`.

### Usage

```typescript
import { scoreRecommendation } from "@workspace/eval-os";

const scores = await scoreRecommendation({
  recommendationId: "rec-abc",
  title: "Reduce fleet idle time",
  toolCalls,
  policyVerdict: "allowed",
  confidence: 0.82,
  domain: "vessels",
});
// scores.composite, scores.grounding, ..., scores.passed
```

Scores are persisted to `defaultJuryStore` (in-memory). Replace with a DB adapter:

```typescript
import { setJuryStoreAdapter } from "@workspace/eval-os";
setJuryStoreAdapter(new DrizzleJuryStore(db));
```

---

## 7. Lane Integration Pattern

To wire any SZL lane through the backbone, follow the KORA reference integration
at `artifacts/api-server/src/routes/lyte-backbone.ts`:

```typescript
import { coordinate } from "@workspace/alloy";

const response = await coordinate({
  objective: body.objective,
  surface: "my-lane",   // e.g. "vessels", "terra", "sentra"
  domain: "my-domain",
  autonomyMode: body.autonomyMode,
  tenantId: user.tenantId,
  context: body.context,
});

// response.status       — "completed" | "pending_approval" | "blocked" | "failed"
// response.ledgerId     — run-ledger entry for audit
// response.juryScores   — domain-jury verdict
// response.toolCalls    — full tool-call ledger for this run
```

**Endpoints registered for KORA (lyte-backbone route prefix):**
- `POST /api/lyte/backbone/analyze` — Submit objective → governed response
- `GET  /api/lyte/backbone/health`  — Backbone readiness
- `GET  /api/lyte/backbone/tools`   — Specialist tool catalog

---

## 8. Policy Flow

```
Request
  │
  ▼
PolicyEvaluatorSpecialist (always first)
  │
  ├─ verdict = "blocked"           → return { status: "blocked" }
  ├─ verdict = "requires-approval" → ApprovalRouterSpecialist → return { status: "pending_approval" }
  └─ verdict = "allowed"           → continue to remaining specialists
```

The policy evaluator uses `@workspace/policy-guard` (`PolicyGuardEngine`) which
evaluates rules against `{ agentRole, actionType, toolId, domain, context }`.
Rules are loaded from the policy registry (or supplied inline).

---

## 9. How Lanes Inherit the Backbone (Phased Migration)

| Phase | Lanes | Notes |
|---|---|---|
| Phase 2 (complete) | KORA (reference) | All specialist stubs in place; planner + policy live |
| Phase 3 (complete) | Document + Speech | Document and Speech specialists promoted to production stubs |
| Phase 4 (complete) | All lanes (retrieval) | RetrievalSpecialist upgraded with vector search hooks |
| Phase 5 (complete) | All lanes (forecasting + anomaly) | ForecastingSpecialist and AnomalySpecialist wired to fabric |
| Phase 6 (complete) | Frontend | UI surfaces consume backbone recommendations directly |
| Phase 7 (complete) | Cloud/Ops | Secrets separation, tenant isolation, cost controls, audit retention |

---

## 10. Local Development

```bash
# Run the api-server locally (backbone is lazy-loaded — no extra setup)
pnpm --filter @szl-holdings/api-server dev

# Test the KORA backbone endpoint
curl -X POST http://localhost:3000/api/lyte/backbone/analyze \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -d '{"objective":"Identify the top 3 cost reduction opportunities in the fleet","domain":"lyte"}'

# Health check
curl http://localhost:3000/api/lyte/backbone/health \
  -H 'Authorization: Bearer <token>'
```

---

*Last updated: 2026-04-25 — Moonshot Phase 8 (Push Prep). Brand names reconciled from Phase 1 audit. Phase migration table updated through Phase 7.*
