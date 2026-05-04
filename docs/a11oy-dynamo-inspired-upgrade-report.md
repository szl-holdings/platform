# A11oy Cognitive Runtime Backbone — Upgrade Report

## Overview

This report documents the gap analysis and upgrade plan that evolved A11oy from its prior
7-layer "fabric" surface into a governed cognitive runtime that can intelligently route
requests across models, agents, and tools; reuse context safely across tenants; coordinate
execution as observable phases; enforce SLAs and policy; preserve a verifiable proof chain
on every action; and stay safe under rolling worker updates.

The conceptual inspiration for this upgrade is the class of distributed, observable,
durable-execution platforms (dynamo-style) that prioritize per-request traceability,
multi-tenant isolation, and safe rolling updates.

---

## Gap Analysis (Pre-Upgrade State)

| Area | Pre-Upgrade State | Gap |
|---|---|---|
| Model routing | Single `model-router.ts` with provider fallback | No scoring modes, no tenant scoping, no SLA constraints |
| Memory | In-memory store per vertical | No cross-request reuse scoring, no tenant isolation hard-check |
| Phase execution | No phase model | Requests were opaque end-to-end; no intermediate telemetry |
| Worker management | No worker concept | No checksum enforcement, no rollout groups, no drain |
| Output safety | No structured guard | Oversized schemas could reach the model layer unchecked |
| Proof chain | Proof packets on actions only | No per-cognitive-request lineage; missing model/worker/timing metadata |
| Event bus | No internal event plane | No observable events; no replay capability |
| Deployments | No governed rollout | Model/config changes had no checksum gating or approval |

---

## What Changed (Post-Upgrade)

### 1. Cortex Router (`a11oy/cognitive/cortex-router.ts`)

A multi-criteria scoring router replacing the simple provider fallback. Supports three
scoring modes: **latency**, **cost**, and **confidence**. Picks the highest-scoring
healthy worker+model combination for each request, applies SLA constraints (max latency,
max cost, min confidence, sensitivity tier), and produces a `RouteDecision` with a full
metadata bundle. Falls back automatically when the primary candidate is unhealthy or
violates constraints.

### 2. Memory Fabric (`a11oy/cognitive/memory-fabric.ts`)

Tenant-isolated context reuse layer. Every memory lookup hard-checks `tenantId`; a
mismatch throws immediately rather than silently returning empty. Emits typed events
(`hit`, `miss`, `reuse`, `invalidation`) to the Event Plane. Computes a Context Reuse
Score 0–1 combining overlap with fresh context vs. stale context.

### 3. Phase Engine (`a11oy/cognitive/phase-engine.ts`)

Ten independently measurable phases: **INGEST → NORMALIZE → RETRIEVE → PLAN → REASON →
APPROVE → EXECUTE → VERIFY → AUDIT → DELIVER**. Each phase records latency, retry count,
failure class, and telemetry snapshot. A proof chain is created on failure as well as on
success. Phases are designed so `RETRIEVE`, `REASON`, and `VERIFY` can be independently
scaled horizontally in a future distributed deployment without restructuring the engine.

### 4. SLA Planner (`a11oy/cognitive/sla-planner.ts`)

Takes latency/cost/confidence/sensitivity/approval/load inputs and produces a route plan,
fallback strategy, and human-readable explanation. Enforces hard limits (e.g. sensitivity
`restricted` cannot use non-confidential providers) and generates warnings when the plan
is close to SLA thresholds.

### 5. Worker Registry (`a11oy/cognitive/worker-registry.ts`)

Registers workers with a `configChecksum` and `rolloutGroup`. Rejects registration when an
incompatible checksum is detected within the same rollout group. Supports drain mode: a
draining worker stops receiving new requests and is marked `drained` once in-flight
requests complete. Different rollout groups can run different versions simultaneously,
enabling safe blue/green and canary deployments.

### 6. Guided Output Guard (`a11oy/cognitive/guided-output-guard.ts`)

Validates structured output constraints before any model call:

| Limit | Max Allowed |
|---|---|
| JSON schema size | 256 KB |
| Nesting depth | 64 levels |
| Regex pattern size | 32 KB |
| Grammar definition size | 64 KB |
| Whitespace pattern size | 1 KB |

Every rejection is logged to `a11oy_guardrail_rejections` with a redacted snippet. No raw
schema content is stored.

### 7. Proof Chain (`a11oy/cognitive/proof-chain.ts`)

Immutable, append-only lineage record for every cognitive request. Stores `requestId`,
`routeDecisionId`, `model`, `provider`, `workerId`, `createdAt`, `completedAt`,
`latencyMs`, `costEstimate`, `confidenceScore`, `riskScore`, `proofChainId`,
`sourceCount`, `memoryHitCount`, and `approvalStatus`. An `auditHash` is computed from
the full lineage using SHA-256; it cannot be altered after sealing. One proof chain is
created even when execution fails.

### 8. Event Plane (`a11oy/cognitive/event-plane.ts`)

Internal table-backed event bus exposing a minimal interface: `emit`, `subscribe`,
`replay`. All A11oy cognitive events land here. The interface is designed to be swapped
for Azure Service Bus, NATS, Kafka, or Redis Streams without touching callers—only the
`EventPlane` implementation class changes.

---

## New Database Tables

| Table | Purpose |
|---|---|
| `a11oy_workers` | Worker Registry: workers, checksums, rollout groups, drain state |
| `a11oy_route_decisions` | Cortex Router: per-request route decisions with scoring metadata |
| `a11oy_memory_events` | Memory Fabric: hit/miss/reuse/invalidation events |
| `a11oy_phase_runs` | Phase Engine: per-phase execution records with telemetry |
| `a11oy_runtime_events` | Event Plane: typed event stream |
| `a11oy_cognitive_proof_chains` | Proof Chain: per-request cognitive lineage with audit hash |
| `a11oy_cognitive_deployments` | Cognitive Deployment Requests: governed rollout tracking |
| `a11oy_guardrail_rejections` | Guided Output Guard: rejection log with redacted snippets |

All tables are tenant-scoped; every query path passes `tenantId`.

---

## New API Endpoints (`/api/a11oy/*`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/a11oy/health` | Runtime health: workers, phases, guard, memory, event plane |
| `POST` | `/api/a11oy/route` | Request a Cortex Router decision |
| `POST` | `/api/a11oy/execute` | Execute a governed cognitive request through the Phase Engine |
| `GET` | `/api/a11oy/workers` | List workers (tenant-scoped) |
| `POST` | `/api/a11oy/workers/register` | Register a new worker |
| `POST` | `/api/a11oy/workers/drain` | Drain a worker |
| `GET` | `/api/a11oy/events` | List runtime events (tenant-scoped) |
| `GET` | `/api/a11oy/proofchains/:id` | Retrieve a proof chain by ID |
| `GET` | `/api/a11oy/deployments` | List cognitive deployment requests |
| `POST` | `/api/a11oy/deployments` | Create a cognitive deployment request |

---

## Runtime Command Center UI

A new `/a11oy/runtime` page was added to the A11oy frontend with seven sections:

1. **Runtime Health** — live status of all eight cognitive modules
2. **Cortex Router Decisions** — recent route decisions with model/provider/score metadata
3. **Memory Fabric** — hit/miss/reuse events and Context Reuse Score
4. **Phase Engine Timeline** — per-request phase waterfall across all 10 phases
5. **Worker Registry** — active workers, checksums, rollout groups, drain state
6. **Proof Chain Viewer** — recent proof chains with audit hash and lineage
7. **Guardrail Rejections** — guard rule violations with redacted snippets

Demo data is clearly labeled as demo throughout.

---

## What Remains (Out of Scope for This Upgrade)

- Real distributed multi-node inference (Worker Registry lays the groundwork)
- Replacing Event Plane with Azure Service Bus / NATS / Kafka / Redis Streams
- Downstream adoption by Command, Pulse, Sentra, Counsel, Terra, Vessels, Carlota Jo
- Replacing existing 7-layer fabric pages (they remain alongside the new Runtime Command Center)

---

*Report generated: 2026-05-04*
