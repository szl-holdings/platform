# SZL Holdings — Core Platform Primitives (Implementation Register)

**Date:** April 22, 2026
**Cross-reference:** [Architecture Primitives](architecture/platform-primitives.md) for conceptual overview | [Policy Registry Spec](POLICY_REGISTRY_SPEC.md) | [Prompt and Policy Registry](PROMPT_AND_POLICY_REGISTRY.md) | [Model Policy Registry](MODEL_POLICY_REGISTRY.md)

---

## Primitive Implementation Status

| Primitive | Library/Package | Schema Tables | API Routes | Tests | Status |
|-----------|----------------|---------------|------------|-------|--------|
| **Outcome Graph** | `lib/outcome-graph` | `outcome_*` (5 tables) | `/api/outcomes/` | E2E coverage | Implemented |
| **Proof Chain** | `lib/proof-chain` | `audit_*`, `proof_*` (8 tables) | `/api/audit/` | Unit + E2E | Implemented |
| **Decision Replay** | `packages/replay-core` + `packages/trace-graph` | `trace_*`, `decision_*` (12 tables) | `/api/decision-replay/` | Unit tests | Implemented |
| **Human Approval Gates** | `lib/approvals` + `lib/covenant-policy` | `alloy_approvals`, `approval_*` (6 tables) | `/api/approvals/` | E2E (governed-decision-loop) | Implemented |
| **Policy Engine** | `lib/policy-engine` + `packages/guardian` | `guardian_*`, `policy_*` (10 tables) | `/api/alloy-governance/` | Unit + integration | Implemented |
| **Event Fabric** | `packages/signal-mesh` + `lib/prism-bus` | `signal_*`, `domain_events` (8 tables) | `/api/signal-*` | E2E | Implemented |
| **GenAI/Agent Observability** | `packages/cognitive-observability` + `lib/observability` | `ai_traces`, `ai_safety_events` (6 tables) | `/api/ai-ops-dashboard/` | Partial | Implemented |
| **Cross-domain Identity** | `lib/auth` + `packages/auth-shared` | `users`, `sessions`, `orgs` (5 tables) | `/api/auth/` | E2E (auth, RBAC) | Implemented |

---

## 1. Outcome Graph

**Package:** `@szl-holdings/outcome-graph` (`lib/outcome-graph/src/index.ts`)

**Schema chain:**
```
Signal → Context → Recommendation → Simulation → Policy Check
    → Execution → Proof → Outcome → Learning
```

**Key types:** `OutcomeNode`, `OutcomeEdge`, `OutcomeGraph`, `RecommendationOutcome`

**API surface:** Acceptance rates, achievement tracking, confidence calibration, agent performance benchmarking

**Domain integration:** All domain packs feed recommendations through the Outcome Graph. Lyte surfaces the live action queue with historical acceptance rates.

---

## 2. Proof Chain

**Package:** `@szl-holdings/proof-chain` (`lib/proof-chain/src/index.ts`)

**Capabilities:**
- Immutable evidence objects for every consequential action
- Source references with confidence scores
- Policy references and execution trace
- Verification result and spatial lineage (`spatial-lineage.ts`)

**Schema:** `audit_*` tables, `proof_chain_entries` with hash-linked chain integrity

**Integration:** Every API write operation generates an audit event via the global audit middleware. The Proof Chain library creates the structured evidence record with actor, timestamp, and input classification.

---

## 3. Decision Replay

**Package:** `@szl-holdings/replay-core` + `@szl-holdings/trace-graph`

**Capabilities:**
- Structured event history for end-to-end decision replay
- Actor, model/tool, input class, approval state, result, timestamp
- Postgres-backed persistent store with query API
- SDK for trace emission from any service

**Files:** `packages/trace-graph/src/` — store, writer, query, replay, sdk, schema (8 source files + 3 test files)

**Integration:** Agent execution traces are recorded via `packages/trace-graph`. The Decision Theater UI in Command renders the replay timeline.

---

## 4. Human Approval Gates

**Package:** `@szl-holdings/approvals` + `@szl-holdings/covenant-policy`

**Approval states:** `draft` → `recommended` → `pending_approval` → `approved` → `executed` | `rejected` | `rolled_back`

**Policy-driven gates:**
- Configurable by risk tier (low/medium/high/critical)
- Guardian engine evaluates policy rules at runtime
- AI cannot execute consequential actions without human confirmation

**E2E verified:** `governed-decision-loop.spec.ts` tests the full approval cycle

---

## 5. Event Fabric

**Package:** `@szl-holdings/signal-mesh` + `@szl-holdings/prism-bus`

**Schema:**
- Shared event schema with `eventType`, `domain`, `correlationId`, `tenantId`
- Lifecycle status tracking: `created` → `processing` → `completed` | `failed`
- Audit hooks for every state transition

**SSE feeds:** Real-time event streaming to Command Portal, Pulse, and domain UIs

**Signal chains:** Configurable cross-domain trigger chains (e.g., maritime anomaly triggers legal review)

---

## 6. GenAI/Agent Observability

**Package:** `@szl-holdings/cognitive-observability` + `@szl-holdings/observability`

**Traces captured:**
- Model calls (provider, model, latency, tokens)
- Tool calls (name, input/output, duration)
- Token/cost estimation
- Error classification
- Approval boundary crossings
- Agent action results

**Dashboard:** AI Ops Dashboard at `/api/ai-ops-dashboard/` with trace viewer, cost tracking, safety event log

**OpenTelemetry:** `packages/otel` + `packages/telemetry-standards` define span naming, attribute conventions, and export configuration. `VITE_OTEL_ENDPOINT` configures the export target.

---

## Platform Fabric Integration

All primitives are wired through the same PostgreSQL instance and share:
- **Correlation IDs** — every request gets a UUID correlation ID that threads through audit, trace, and event records
- **Tenant scoping** — all queries enforce `org_id` isolation; cross-org access returns 404
- **Actor attribution** — every write records the authenticated user or service identity
- **Timestamp chain** — all records include `created_at`, `updated_at` with database-generated timestamps

This is not an aspirational architecture — it is the implemented reality as of this audit.
