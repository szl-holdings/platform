# SZL Holdings — Architecture Summary

**Version:** 1.0  
**Date:** April 2026  
**For:** Technical buyers, capital partners, and enterprise evaluation teams

---

## The One-Sentence Architecture

SZL Holdings is a governed decision layer that connects operational signal detection to human-confirmed action execution, with full attribution and an immutable audit trail.

---

## The Governed Decision Pipeline

Every action in the SZL ecosystem follows one pipeline:

```
Signal → Context → Recommendation → Simulation → Policy → Approval → Execution → Proof → Outcome
```

This is not a metaphor. It is the literal data and control flow path that every consequential operation traverses. Each step is instrumented. Each step produces an event. Each event is attributable to an actor, a role, a time, and a source.

---

## The Six Platform Primitives

The six platform primitives are the structural differentiators — what makes this different from dashboards, copilots, and workflow tools.

| Primitive | What It Does | Why It Matters |
|-----------|-------------|----------------|
| **Outcome Graph** | Tracks the full decision lifecycle: recommendation → action → outcome → learning | Closed-loop feedback. The platform knows which recommendations led to which results. |
| **Proof Chain** | Immutable append-only audit trail for every significant action | AI outputs carry provenance. Compliance teams can reconstruct any decision chain. |
| **Covenant Policy** | Defines what agents and users can do, with what approval requirements | Human-in-the-loop enforced at the policy layer, not the UI layer. AI cannot bypass it. |
| **Decision Simulation** | Probabilistic simulation before action — confidence intervals, sensitivity analysis | Operators see not just what should be done but what could happen. |
| **Workflow Engine** | Durable multi-step process orchestration with agent coordination and recovery | Complex decisions are tracked, governed, and recoverable. |
| **Event Fabric** | Cross-domain signal backbone: normalize, route, and correlate events | A sanctions hit in Vessels surfaces as a legal risk flag in Counsel automatically. |

---

## The Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite (TypeScript 5.x strict) |
| Design system | `@szl-holdings/design-system` — dark-first enterprise token set; shared across all artifacts |
| Mobile | Expo / React Native (iOS + Android) |
| API | Express.js with comprehensive middleware stack |
| Validation | Zod schema-first validation on all 347 route files (12 top-level route groups) |
| ORM / Database | Drizzle ORM 0.45.x on PostgreSQL 16 |
| Schema | 915 database table definitions across 165 schema files |
| Authentication | OpenID Connect (PKCE); `__Host-sid` session cookie |
| Authorization | 11-role RBAC; deny-by-default global auth enforcer; org-scoped tenant isolation |
| Audit | Proof Chain — immutable append-only event log |
| Observability | Pino structured logging, OpenTelemetry (OTLP), Sentry |
| Payments | Stripe (Checkout, Subscriptions, Invoicing) |
| CI/CD | GitHub Actions — CodeQL SAST, dependency review, secret scanning, build gates |
| Infrastructure | Azure Bicep IaC for enterprise deployments |
| Monorepo | pnpm workspaces; Turborepo task graph; 152 packages (101 domain packages + 51 lib packages; `generated/platform-metrics.json` 2026-04-27T03:50:50Z) |

---

## The Monorepo Structure

```
szl-holdings-platform/
├── artifacts/       # 14 deployable web, mobile, and video artifacts
├── lib/             # 41 shared libraries: db, auth, AI, event bus, UI
├── packages/        # 82 domain packages: design system, agent core, evidence ledger
├── apps/            # Background applications: embedding, ingestion, runtime
├── services/        # Platform services: Alloy fabric, metrics, gateway
├── workers/         # Background workers: embedding, ranking, vector
├── scripts/         # Seed, QA, deployment utilities
├── docs/            # Architecture, trust, investor, operations documentation
└── ops/             # Infrastructure configuration, runbooks
```

---

## The Artifact Layer

| Artifact | Kind | Domain | Status |
|----------|------|--------|--------|
| SZL Holdings Dashboard | web | Public marketing + investor surface | Active |
| API Server | web | Backend API for all platforms | Active |
| Unified Command | web | Cross-domain executive command | Active |
| Sentra | web | Cyber resilience | Active |
| Counsel | web | Legal matter management | Active |
| Terra | web | Real estate intelligence | Active |
| Vessels | web | Maritime fleet intelligence | Active |
| Carlota Jo | web | Premium advisory | Active |
| Pulse | web | AI executive briefing | Active |
| Aegis | web | Investor pitch deck + ATLAS runtime | Active |
| SZL Demo Video | video | Demo video | Active |
| CORTEX Mobile | mobile | Unified mobile command (iOS + Android) | Beta |
| NEXUS | design | UI prototyping sandbox | Internal |

---

## The API Surface

- **12 top-level route groups** across all domains (`api.route_groups_top_level: 12` per audit/source-of-truth.json)
- **347 route files** total (`api.route_files: 347` per audit/source-of-truth.json)
- **100% Zod schema validation** via `@szl-holdings/contracts` and domain validation packages
- **Middleware stack:** OTel spans, correlation IDs, structured logging, Helmet CSP/HSTS, session policy, CSRF, rate limiting, tenant scope, ETag optimistic concurrency
- **Error envelopes:** Consistent `sendError`/`sendNotFound`/`sendUnauthorized`/`sendForbidden` across all routes
- **Graceful degradation:** API server starts in degraded mode when `DATABASE_URL` is absent

---

## The Data Layer

- **915 database table definitions** (direct `pgTable()` calls in `lib/db/src/schema/`)
- **165 schema files** across all domains
- **139 tracked migrations** (115 Drizzle + 24 hand-authored)
- **Drizzle ORM v0.45.x** with parameterized queries throughout; no SQL string concatenation
- **Tenant isolation** enforced at the query layer; every query is org-scoped

---

## The Agent Network

Advisory agents in the SZL ecosystem are coordinated under the Alloy execution fabric:

| Agent | Domain | Function |
|-------|--------|---------|
| Helmsman | Maritime (Vessels) | Voyage anomaly detection, route intelligence, dark vessel flagging |
| Sentinel | Cyber (Sentra) | Threat signal classification, incident triage, MITRE ATT&CK mapping |
| Compass | Business (Lyte/PRISM) | KPI anomaly detection, operational risk synthesis |

**Advisory, not autonomous.** No agent executes consequential actions without explicit human confirmation via the Alloy approval gate. This is enforced at the workflow level, not just the UI level.

---

## Key Architectural Decisions

**1. Shared entity model.** All domains share a common entity graph. A vessel is a vessel whether it appears in a voyage record, a sanctions screening, or a commercial contract. Cross-domain signal correlation is a design-time constraint, not a post-hoc integration project.

**2. Shared event schema.** All events conform to a common schema. This is the prerequisite for Event Fabric routing. It cannot be replicated quickly by a point-solution stack.

**3. Human-in-the-loop at the policy layer.** Covenant Policy governs what agents and users can do. Approval gates are not UI components that can be bypassed — they are workflow-layer enforcement points.

**4. Proof Chain as first-class infrastructure.** Audit evidence is created during normal operations, not assembled retroactively. Every Proof Chain event is attributable, timestamped, and queryable.

**5. Schema-first validation.** Zod contracts define the shape of every API request and response. Validation runs before business logic. The schema is the documentation.

---

## What Is Not Yet Production-Ready

The following architectural gaps are documented honestly and are not required for investor demo readiness:

| Gap | Severity | Remediation |
|-----|----------|-------------|
| Redis session store not activated | MEDIUM | Activate Redis adapter in API server config |
| In-memory session (sessions lost on restart) | MEDIUM | Redis activation resolves this |
| Sentry DSN not configured | MEDIUM | Add `SENTRY_DSN` to secrets |
| OTel OTLP endpoint not configured | LOW | Add `OTEL_ENDPOINT` to secrets |
| Dual RBAC role system (12-value enum + rolesTable) | HIGH | Consolidation required; canonical mapping layer exists |
| AIS telemetry simulated | MEDIUM | MarineTraffic or equivalent subscription needed for live AIS |
| Mapbox token absent | HIGH (demo-blocking) | Add `MAPBOX_TOKEN` to secrets; free tier covers demos |

---

## Architecture Documentation

Full architecture documentation is at:

- `docs/architecture/architecture.md` — System topology, stack, design principles (canonical, v4.0)
- `docs/architecture/platform-primitives.md` — Full specification of the six primitives
- `docs/architecture/data-model.md` — Entity-relationship overview of the core database schema
- `docs/architecture/api-spec.md` — API surface: route inventory, auth model, rate limiting
- `docs/trust-center.md` — Trust and data governance
- `docs/security-posture.md` — Security controls and open findings
- `SECURITY.md` — Vulnerability disclosure policy

---

*Architecture summary as of April 2026. All claims verified from source code and filesystem unless noted. Technical due diligence packet available on request.*
