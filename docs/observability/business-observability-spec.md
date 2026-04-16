# Business Observability Specification

**Package:** `@szl-holdings/business-events`, `@szl-holdings/observability-core`
**Status:** Implemented
**As of:** April 2026

---

## Overview

SZL's competitive differentiation depends on treating business execution with the same rigor applied to technical systems. The Business Observability Fabric combines:

- **Technical telemetry** — HTTP spans, database latency, error rates, throughput
- **Business telemetry** — domain transactions, risk signals, policy violations, agent actions, and outcomes

Every domain transaction, risk detection, recommendation, and action execution becomes a first-class observable event with full business context attached. Events flow through the ATLAS event bus and are queryable by class, domain, tenant, actor, and time window.

---

## Architecture

```
                         ┌───────────────────────────────────┐
                         │        Domain Packs                │
                         │  (Maritime, Real Estate, Defense)  │
                         └──────────────┬────────────────────┘
                                        │ emit ATLAS events
                                        ▼
                         ┌───────────────────────────────────┐
                         │     @szl-holdings/business-events  │
                         │        ATLAS Event Bus             │
                         │  - Typed emitters (atlas.*)        │
                         │  - Handler registry                │
                         │  - In-memory ring buffer           │
                         └──────────────┬────────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
           API Ingestion         KPI Adapters         GenAI Spans
           /business-events/     domain → ATLAS       genai-telemetry
           (REST ingest)         event conversion     (agent actions)
```

---

## ATLAS Event Classes

All events implement `ATLASBaseEvent` which carries full business context:

| Event Class | Trigger |
|---|---|
| `business.transaction.started` | Domain workflow or process begins |
| `business.transaction.completed` | Domain workflow or process succeeds |
| `business.transaction.failed` | Domain workflow or process fails |
| `business.risk.detected` | Risk engine detects elevated risk signal |
| `business.opportunity.created` | System or agent identifies actionable opportunity |
| `policy.violation.detected` | Policy engine detects a constraint violation |
| `recommendation.generated` | AI/ML engine produces an actionable recommendation |
| `action.approved` | Human or auto-approval is granted for an action |
| `action.executed` | Approved action is run by agent or automation |
| `action.failed` | Action execution fails or is rejected |
| `outcome.realized` | A measurable business outcome is attributed |

---

## Event Metadata Contract

Every ATLAS event carries:

```typescript
interface ATLASBaseEvent {
  eventId: string;              // UUID
  eventClass: ATLASEventClass;  // One of 11 classes above
  domain: ATLASDomain;          // maritime | real-estate | defense | finance | ...
  tenantId?: string;            // Tenant isolation
  actor?: ATLASActor;           // Who triggered the event
  workflowId?: string;          // Alloy workflow correlation
  correlationId?: string;       // HTTP/trace correlation ID
  entityIds?: Record<string, string>; // Domain entity IDs
  businessValue?: ATLASBusinessValue; // Value at risk/protected/created
  sloImpact?: ATLASSLOImpact;   // SLA/SLO impact assessment
  severity?: ATLASSeverity;     // info | low | medium | high | critical
  tags?: string[];              // Free-form classification
  metadata?: Record<string, unknown>; // Event-specific data
  timestamp: number;            // Unix milliseconds
  schemaVersion: "1.0";
}
```

---

## Correlation ID Propagation

`@szl-holdings/observability-core` provides the `AsyncLocalStorage`-based context carrier. Every incoming HTTP request gets a `correlationId` extracted from the `x-correlation-id` header (or generated if absent) and stored in the async context.

**Headers propagated:**
- `x-correlation-id` — carry across service boundaries
- `x-request-id` — unique per request
- `x-workflow-id` — workflow execution ID
- `x-tenant-id` — tenant scope
- `x-session-id` — browser/mobile session

**Express middleware stack order:**
1. `correlationMiddleware` — extract/generate correlation ID, run context
2. `apiVersionMiddleware`
3. `telemetryMiddleware` — record APM spans with correlation ID attached

---

## Business KPI Ingestion Adapters

The `packages/business-events/src/adapters` module converts raw domain KPI records into typed ATLAS events:

### KPI Record → ATLAS Event Mapping

| KPI Name Pattern | ATLAS Event Class |
|---|---|
| Contains "risk", "threat", "violation" | `business.risk.detected` |
| Contains "opportunity", "lead", "pipeline" | `business.opportunity.created` |
| All others | `outcome.realized` |

### Domain Transaction → ATLAS Event Mapping

| Transaction Outcome | ATLAS Event Class |
|---|---|
| `success: true` | `business.transaction.completed` |
| `success: false` | `business.transaction.failed` |

---

## API Endpoints

The API server exposes ingestion and query endpoints under `/api/business-events/`:

| Method | Path | Description |
|---|---|---|
| POST | `/business-events/kpi` | Ingest batch KPI records |
| POST | `/business-events/transactions` | Ingest batch domain transactions |
| POST | `/business-events/emit` | Emit typed ATLAS event directly |
| GET | `/business-events/summary` | Aggregated event counts by class/domain |
| GET | `/business-events/events` | Recent raw events (ops/admin) |

---

## Packages

### `@szl-holdings/observability-core`

| Export path | Contents |
|---|---|
| `.` | All re-exports |
| `./context` | `AsyncLocalStorage` request context, `getCorrelationId()`, `runWithContext()` |
| `./correlation` | Header name constants, `extractCorrelationId()`, `buildPropagationHeaders()` |
| `./middleware` | `createCorrelationMiddleware()`, `createOtelSpanMiddleware()`, `createInstrumentationMiddleware()` |

### `@szl-holdings/business-events`

| Export path | Contents |
|---|---|
| `.` | All re-exports |
| `./emitter` | `atlasEventBus`, `atlas.*` typed emitter functions |
| `./adapters` | `kpiRecordToAtlasEvent()`, `domainTransactionToAtlasEvent()`, `ingestKPIBatch()` |

---

## SLA / SLO Impact Fields

Events can carry `sloImpact` to track service level effects:

```typescript
interface ATLASSLOImpact {
  slaId?: string;
  sloId?: string;
  impact: "none" | "at-risk" | "breached" | "recovered";
  breachThresholdMs?: number;
  actualDurationMs?: number;
}
```

---

## Business Value Fields

Events can carry a `businessValue` object to quantify financial impact:

```typescript
interface ATLASBusinessValue {
  amount?: number;
  currency?: string;
  type: "at-risk" | "protected" | "created" | "lost" | "estimated";
  description?: string;
}
```

---

## Retention and Storage

- In-memory ring buffer: 5,000 events per server process (24h window)
- Events are queryable via `/business-events/events` and `/business-events/summary`
- Domain packs may persist events to the analytics engine (`/analytics-engine/events`) for long-term retention

---

## Schema Evolution

Events carry `schemaVersion: "1.0"`. Future versions increment the minor or major version. Consumers should handle unknown fields gracefully. Breaking changes require a new major version and a migration path.
