# SZL Holdings — Foundation Architecture

> Layer 0 of the Agentic OS stack: Constellation graph, trace infrastructure,
> cross-domain API surface, and the governance primitives that every domain app
> builds on.

---

## 1  Overview

The Foundation Layer provides the shared runtime primitives that every domain
application (Terra, Vessels, Prism, Aegis, Lyte) depends on.  It has no
domain-specific logic; its job is to give every agent a common substrate for:

| Concern | Package / Surface |
|---------|-------------------|
| Entity graph (nodes + edges) | `@szl-holdings/constellation` |
| Distributed agent traces | `@workspace/trace-graph` |
| Eval regression | `@szl-holdings/evals-core` |
| Replay & rollback | `@szl-holdings/replay-core` |
| Policy enforcement | `@szl-holdings/policy-engine` |
| Tool catalogue + MCP schema | `@szl-holdings/tool-registry` |
| Cross-domain REST API | `artifacts/api-server` |

---

## 2  Constellation — Cross-Domain Entity Graph

```
cstNodes  ──( edge )──  cstEdges  ──( edge )──  cstNodes
  domain                  relationshipType          domain
  entityType              confidence                entityType
  canonicalId             active                    canonicalId
  extensions (JSONB)
```

Every entity that an agent creates, reads, or acts on can be registered as a
Constellation **node**.  When an agent discovers a relationship between two
entities in different domain apps, it writes a **cross-domain edge**.

### 2.1  Projection by domain

The API exposes a projection endpoint per domain:

```
GET /domains/{domain}/graph?includeCross=true&limit=100
```

Supported domains: `terra`, `prism`, `vessels`, `aegis`, `lyte`, `imperium`,
`carlota-jo`, `platform`.

The response contains:
- `nodes[]` — all nodes for the requested domain (paginated)
- `edges[]` — internal and (optionally) cross-domain edges incident to those nodes
- `stats` — node count, edge count, cross-domain edge breakdown

### 2.2  Demo seed: Constellation cross-domain scenario

`packages/demo-seed/src/seed-constellation.ts` provides five cross-linked nodes
and six edges that span four domains:

| Node | Domain | Entity type |
|------|--------|-------------|
| Terra property TX-2040 | terra | property |
| Vessels charter VES-C-00 | vessels | charter |
| PRISM legal matter PRB-001 | prism | matter |
| Aegis incident AGX-442 | aegis | incident |
| Lyte signal LYT-R-99 | lyte | market_signal |

---

## 3  Trace Graph

Every agent execution emits a `TraceRecord` to `InMemoryTraceStore` (development)
or the Postgres-backed store (production).  Fields of note:

| Field | Purpose |
|-------|---------|
| `traceId` | Unique run identifier |
| `agentId` | The agent that produced the trace |
| `status` | `running \| completed \| failed \| rolled-back` |
| `metadata.domain` | Domain filter index |
| `guardrailResults` | Policy gate decisions |
| `approvals` | Human-in-the-loop gate events |
| `toolCalls` | Per-call latency, cost, retries |

`TraceQueryEngine` supports filtering by `domain` (via `metadata.domain`),
`status`, `agentId`, `workflowId`, `sessionId`, `hasErrors`, `hasPolicyBlock`,
and time range.

---

## 4  API Surface

All routes are served by `artifacts/api-server`.

### 4.1  `/briefings`

```
GET  /briefings              — list executive briefings (paginated, status filter)
GET  /briefings/:id          — single briefing detail
POST /briefings              — create briefing (title, domain, summary required)
PUT  /briefings/:id/approve  — approve a pending briefing
PUT  /briefings/:id/archive  — archive a briefing
```

Briefings are stored in `agentBriefings` (db schema).  They carry a `domain`,
`status` (`draft | pending | approved | archived`), `tags`, and a structured
`keyMetrics` JSONB field.

### 4.2  `/drift`

```
GET  /drift                  — list drift reports (domain, severity, status filters)
GET  /drift/:id              — single drift report
POST /drift                  — create drift report
POST /drift/:id/acknowledge  — acknowledge a drift report
POST /drift/:id/resolve      — resolve with remediation notes
```

Drift reports are stored in `agentDriftReports`.  Severity: `low | medium | high | critical`.

### 4.3  `/deployments`

```
GET  /deployments            — list deployments (domain, status, environment filters)
GET  /deployments/:id        — single deployment detail
POST /deployments            — register a deployment event
PUT  /deployments/:id/status — update lifecycle status
POST /deployments/:id/rollback — trigger rollback
```

Deployments are stored in `agentDeployments`.  `rollbackTargetId` links to the
deployment that should be restored during a rollback operation.

### 4.4  `/domains/:domain/graph`

See §2.1 above.

---

## 5  Eval Regression

`@szl-holdings/evals-core` provides `runEvalSuite(cases, executor, options)`.

```ts
const report = await runEvalSuite(cases, async (input) => executor(input), {
  passThreshold: 0.8,
});
```

Each `EvalCase` carries an `input`, optional `expectedOutput`, and optional
`scorers`.  The suite returns a `passRate` and per-case `scores`.  Regression
guard: if `report.passRate < passThreshold`, the suite throws.

---

## 6  Replay & Rollback

`@szl-holdings/replay-core` provides `ReplaySnapshot` and `ReplayEngine`.

```ts
const snapshot = new ReplaySnapshot({ label, snapshotType, payload });
// snapshotType: "incident" | "flow" | "decision" | "audit"
const engine = new ReplayEngine();
engine.addSnapshot(snapshot);
const result = engine.replay(snapshot.id);
```

Rollback uses the same engine.  The trace system records `rollbackId` when a
rolled-back trace references a prior snapshot.

---

## 7  Policy Engine

`@szl-holdings/policy-engine` evaluates policies against context objects.

```ts
const engine = new PolicyEngine({ policies });
const result = engine.evaluate(context);
// result.decision: "allow" | "deny" | "require-approval"
```

Decisions flow into `TraceRecord.guardrailResults` for auditability.

---

## 8  Tool Registry & MCP Schema

`@szl-holdings/tool-registry` provides:

```ts
const registry = new ToolRegistry();
registry.register(toolDefinition);
const schema = registry.getMcpSchema();
// schema: { tools: [...], version, count }
```

Every tool has a `name`, `description`, input `schema` (JSON Schema), and
optional `domain`, `tags`, and `permissions` metadata.

---

## 9  Governance Integration

```
Policy Engine
    │
    ├─── allow        → execute → TraceRecord.status = "completed"
    ├─── deny         → block   → TraceRecord.status = "failed" + guardrailResult
    └─── require-approval → hold → TraceRecord.approvals[] populated
                                   → on approve → execute
                                   → on deny    → rollback (ReplayEngine)
```

Every decision is captured in the trace and surfaced in executive briefings via
`/briefings`.

---

## 10  Testing

### Unit / integration (vitest)

```
pnpm test
```

Picks up all `packages/*/src/**/*.test.ts` via the root `vitest.config.ts`.

Key test suites:
- `packages/constellation/src/__tests__/smoke.test.ts` — 12-step end-to-end smoke
- `packages/constellation/src/__tests__/hardening.test.ts` — graph integrity, trace, policy, eval, replay

### Integration API tests

```
pnpm test:integration
```

Runs live API tests against a running api-server instance.

---

## 11  Dependency Map

```
Foundation packages (no domain logic)
  ├── @szl-holdings/db           (Postgres, drizzle ORM)
  ├── @workspace/trace-graph     (trace store, query, replay, writer)
  ├── @szl-holdings/constellation (node/edge graph, adapters)
  ├── @szl-holdings/evals-core   (eval suite runner)
  ├── @szl-holdings/replay-core  (snapshot + rollback engine)
  ├── @szl-holdings/policy-engine (policy evaluation)
  └── @szl-holdings/tool-registry (tool catalogue + MCP schema)

Domain apps
  ├── artifacts/terra
  ├── artifacts/vessels
  ├── artifacts/pulse  (briefings + drift)
  ├── artifacts/aegis  (security incident command)
  └── ...

API gateway
  └── artifacts/api-server
        ├── /briefings
        ├── /drift
        ├── /deployments
        └── /domains/:domain/graph
```
