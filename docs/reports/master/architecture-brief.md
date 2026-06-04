# Architecture Brief — SZL Holdings Platform
**Version:** 1.0  
**Date:** April 3, 2026  
**Audience:** Technical due diligence, CTOs, engineering partners

---

## What We Built

A modular, domain-agnostic operational intelligence platform built on a shared execution fabric (Alloy), with domain-specific command surfaces (Lyte, Aegis, Terra, Vessels) and a shared trust layer.

The architecture is a deliberate monorepo with clear separation of concerns. Nothing is stitched together. The domains share a common spine and diverge only at the presentation layer.

---

## Repository Structure

```
/
├── artifacts/          # 16 deployed apps (web, mobile, API)
│   ├── lyte-command-center/    # Flagship web app (React + Vite)
│   ├── firestorm/              # Aegis web (React + Vite)
│   ├── terra/                  # Terra web (React + Vite)
│   ├── vessels/                # Vessels web (React + Vite)
│   ├── szl-holdings/           # Corporate site (React + Vite)
│   ├── carlota-jo/             # Advisory site (React + Vite)
│   ├── stephen-site/           # Founder site (React + Vite)
│   ├── api-server/             # Express API (1,166 endpoints)
│   ├── lyte-mobile/            # Expo React Native
│   ├── aegis-mobile/           # Expo React Native
│   ├── terra-mobile/           # Expo React Native
│   ├── vessels-mobile/         # Expo React Native
│   ├── szl-holdings-mobile/    # Expo React Native
│   ├── carlota-jo-mobile/      # Expo React Native
│   └── stephen-mobile/         # Expo React Native
│
├── lib/                # 18 shared packages
│   ├── ai-engine/      # Alloy execution fabric (schemas, retrieval, tools, eval)
│   ├── workflow-engine/ # State machine, step execution, conditions
│   ├── audit/          # Immutable audit log persistence
│   ├── auth/           # JWT, session management, RBAC, SCIM
│   ├── db/             # PostgreSQL schema (50+ tables), Drizzle ORM
│   ├── shared-ui/      # Design system, operational components, trust layer
│   └── ...             # 12 additional shared packages
│
└── docs/               # 55+ architecture, trust, investor, and internal docs
```

---

## Core Technology Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React + Vite + TypeScript | All 8 web apps; pnpm monorepo |
| Mobile | Expo + React Native + TypeScript | 7 apps; shared Expo config |
| API | Express + TypeScript | 1,166 endpoints; structured routing |
| Database | PostgreSQL + Drizzle ORM | 50+ tables; full relational model |
| AI inference | HuggingFace + fallback routing | Hosted inference; model swappable |
| Auth | JWT + RBAC + SCIM | Role-based access across all apps |
| Audit | Append-only log + PostgreSQL | Immutable decision and event trail |
| Design system | React + Tailwind + Radix UI | Premium dark theme; 80+ components |
| CI/CD | GitHub Actions | 6 workflows: CI, CodeQL, dependency review, release |
| Hosting | Replit (dev) → cloud provider (production) | Environment-isolated |

---

## Alloy: The Execution Fabric

Alloy is the AI and orchestration layer that all domain surfaces sit on top of. It is not a product. It is the engine.

### Decision Object Schema
Every AI output is a typed, schema-validated decision object — not free-form text.

```typescript
// Example: WorkflowPrioritizationDecision
{
  entityId: string,
  decisionType: "workflow_prioritization",
  confidence: number,          // 0.0–1.0
  proposedAction: ProposedAction,
  evidence: EvidenceItem[],    // Source, value, confidence per item
  rationale: string,           // Human-readable reasoning
  approvalRequired: boolean,
  proposalOnly: true,          // Default: cannot auto-execute
  auditId: string,             // Links to immutable audit record
}
```

Nine schemas cover: workflow prioritization, risk assessment, escalation, assignment, anomaly detection, compliance, resource allocation, incident classification, and briefing generation.

### Evidence Retrieval
Hybrid retrieval: keyword BM25 + semantic BGE embeddings + cross-encoder reranking. Implemented in `lib/ai-engine/src/retrieval/alloy-retrieval.ts`. Every retrieved document is cited as an evidence item with confidence score and source attribution.

### Policy Enforcement
All tools run through a policy layer that enforces:
- Role check (does this user have permission?)
- Approval gate (has a human approved this action?)
- propose_only default (all actions are proposals until explicitly executed)
- Audit logging (every tool call is persisted regardless of outcome)

### Evaluation Harness
25+ golden test scenarios in `lib/ai-engine/src/evals/`. Eval harness runs on every schema change. Output: precision, recall, schema validity, hallucination rate per scenario type.

---

## Shared UI: The Trust Layer

The `@workspace/shared-ui` package exports 80+ components. The trust layer components are:

| Component | What It Does |
|-----------|-------------|
| `OperationalStatusBadge` | Lifecycle state in semantic color |
| `OperationalOwnerChip` | Owner or "Unassigned" at every level |
| `OperationalEvidencePanel` | Evidence items + rationale display |
| `OperationalAuditTimeline` | Chronological audit history |
| `OperationalEscalationPanel` | Active escalation paths |
| `OperationalDetailPane` | Canonical detail view assembly |
| `OperationalQueueRow` | Canonical queue row assembly |
| `DataStateBadge` | Live / Seeded / Simulated label |
| `AuditTrailDrawer` | Slide-in audit history |
| `EvidencePanel` | Alloy-specific evidence with confidence band |
| `ConfidenceBand` | Visual confidence display |
| `ApprovalBadge` | Approval state at a glance |
| `RoleGate` | Role-based UI conditional rendering |
| `DemoModeProvider` | App-wide demo/live mode management |
| `EnvironmentLabel` | Dev/staging/production indicator |

These components are consumed by Lyte, Aegis, Terra, Vessels, and the mobile apps. The design system, trust layer, and operational primitives are not duplicated — they are shared.

---

## Database Schema

50+ tables across domains:

**Core:** users, tenants, sessions, roles, permissions, audit_log, notifications  
**Workflow:** workflows, workflow_steps, workflow_runs, signals, actions, approvals  
**Lyte:** signals, command_items, escalations, readiness_assessments  
**Alloy:** decisions, evidence, eval_runs, eval_scenarios  
**Aegis:** incidents, alerts, cases, threat_indicators, risk_scores  
**Terra:** properties, deals, market_data, distress_scores, documents  
**Vessels:** vessels, voyages, exceptions, sanctions_checks, positions  
**Carlota Jo:** sessions, clients, bookings, service_agreements

---

## Security Architecture

| Control | Implementation |
|---------|---------------|
| Authentication | JWT + refresh tokens, session management |
| Authorization | RBAC with role hierarchy per tenant |
| Multi-tenancy | Tenant-scoped auth; retrieval partitioning in progress |
| Input validation | Zod schemas on all API input |
| Rate limiting | Express rate-limiter on all public endpoints |
| Vulnerability scanning | CodeQL in CI, dependency-review on every PR |
| Audit logging | Append-only, persisted on every AI call and state change |
| SCIM provisioning | Endpoints exist for enterprise provisioning |

---

## Scale Posture

Current posture: vertical scaling, single-region. Architecture is cloud-provider agnostic — PostgreSQL, Express, React, Expo. Horizontal scaling requires:
- Read replicas for PostgreSQL
- Session store (Redis) for multi-instance Express
- CDN for static assets (Vite build outputs)
- Message queue for async workflow execution (planned)

Retrieval currently synchronous. For scale: async retrieval with streaming response is the next architectural investment.

---

## Known Gaps (Honest Accounting)

| Gap | Priority | Mitigation |
|-----|---------|-----------|
| No E2E test suite | P0 | Playwright suite planned post-pilot |
| Bundle sizes 500KB–1.7MB | P1 | Code splitting, lazy loading (Mapbox is main offender) |
| Retrieval not tenant-partitioned | P0 | tenantId addition to retrieval queries |
| No message queue | P2 | Required for async workflow at scale |
| Single-region deployment | P2 | Multi-region post Series A |
| Load testing not done | P1 | Required before commercial launch |

---

*See also: [docs/architecture.md](../../architecture/architecture.md) · [competitive-positioning-brief.md](competitive-positioning-brief.md) · [platform-trust-summary.md](platform-trust-summary.md)*
