# Architecture — SZL Holdings Platform

**Version:** 4.0 | **Date:** April 2026 | **Audience:** Technical advisors, enterprise architects, investors

> **Canonical summary.** For the full architecture reference, see [`docs/architecture/architecture.md`](docs/architecture/architecture.md).

---

## Thesis

SZL Holdings is a **governed decision infrastructure platform**. Every signal that arrives in any domain surfaces through a shared nine-step loop:

```
Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome → Learning
```

Nothing is opaque. Nothing executes without attribution.

---

## Platform Layer Model

```
┌──────────────────────────────────────────────────────────────────┐
│  PLATFORM — SZL Holdings                                         │
│  Governed decision infrastructure for consequential operations   │
├──────────────────────────────────────────────────────────────────┤
│  COMMAND SURFACES                                                │
│  Lyte (flagship)   Command Portal (hub)   CORTEX (mobile)        │
│  Pulse (briefing)  SZL Holdings (corporate)                      │
├──────────────────────────────────────────────────────────────────┤
│  EXECUTION FABRIC                                                │
│  Alloy — Workflow orchestration · Approval gates · Audit trail   │
├──────────────────────────────────────────────────────────────────┤
│  DOMAIN PACKS                                                    │
│  Aegis (security)   Vessels (maritime)   Terra (real estate)     │
│  PRISM Counsel (legal)   IMPERIUM (cloud)   Carlota Jo (advisory)│
│  Sentra (cyber resilience)                                       │
├──────────────────────────────────────────────────────────────────┤
│  GOVERNANCE INFRASTRUCTURE (shared by all surfaces)             │
│  Outcome Graph · Proof Chain · Covenant Policy                   │
│  Decision Simulation · Workflow Engine · Event Fabric            │
│  AI Engine · RBAC + Auth                                         │
├──────────────────────────────────────────────────────────────────┤
│  DATA LAYER                                                      │
│  PostgreSQL 16 (Drizzle) · 917 tables · External feeds           │
└──────────────────────────────────────────────────────────────────┘
```

---

## Monorepo Structure

| Layer | Path | Contents |
|-------|------|----------|
| Artifacts (surfaces) | `artifacts/` | 17 web, mobile, video, and design apps |
| API Server | `artifacts/api-server/` | Express 5, 256 route files |
| Lib packages | `lib/` | Shared runtime libraries (db, ai-engine, proof-chain, etc.) |
| Workspace packages | `packages/` | Policy engine, reflection engine, shared-ui, etc. |
| Scripts | `scripts/` | Seed, smoke, metrics, and CI utilities |
| Database | `lib/db/src/schema/` | 166 schema files, 917 tables |

---

## Key Statistics

| Metric | Value |
|--------|-------|
| Artifacts | 17 |
| API route files | 256 |
| Database tables | 917 across 166 schema files |
| Governance primitives | 6 (shared by all surfaces) |
| Platform surfaces | 10 web + 2 mobile + 1 video + 1 design + 1 API |

---

## Six Governance Primitives

All surfaces share these primitives — none can be disabled per-tenant:

| Primitive | Library | Purpose |
|-----------|---------|---------|
| Outcome Graph | `lib/outcome-graph` | Tracks causal chains from action to result |
| Proof Chain | `lib/proof-chain` | Immutable, cryptographically-linked audit trail |
| Covenant Policy | `packages/policy-engine` | Permission + approval gate before execution |
| Decision Simulation | `lib/monte-carlo` | Monte Carlo probabilistic risk modeling |
| Workflow Engine | `lib/workflow-engine` | Orchestrates multi-step execution |
| Event Fabric | `@szl-holdings/prism-bus` | Cross-domain real-time event bus |

---

## Canonical Nine-Step Loop

```
1. Signal          — domain-specific ingestion and normalization (Prism Bus)
2. Context         — cross-domain enrichment (Atlas Core, Memory Fabric)
3. Recommendation  — AI-generated advisory with evidence (Decision Engine)
4. Simulation      — Monte Carlo probabilistic risk model (lib/monte-carlo)
5. Policy          — Covenant Policy permission + approval gate
6. Execution       — Workflow Engine routes the action (lib/workflow-engine, Alloy)
7. Proof           — Proof Chain records immutable audit trail (lib/proof-chain)
8. Outcome         — Outcome Graph tracks result (lib/outcome-graph)
9. Learning        — Calibration job updates agent priors (packages/reflection-engine)
```

---

*For the full architecture reference see [`docs/architecture/architecture.md`](docs/architecture/architecture.md).*
*For platform primitives specification see [`docs/platform/platform-primitives.md`](docs/platform/platform-primitives.md).*
