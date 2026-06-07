# Architecture — SZL Holdings Platform

**Version:** 4.1 | **Date:** April 2026 | **Audience:** Technical advisors, enterprise architects, investors

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
│  KORA (flagship)   Command Portal (hub)   APEX (mobile)          │
│  LUMINA (briefing)  SZL Holdings (corporate)                     │
├──────────────────────────────────────────────────────────────────┤
│  EXECUTION FABRIC                                                │
│  FORGE — Workflow orchestration · Approval gates · Audit trail   │
├──────────────────────────────────────────────────────────────────┤
│  DOMAIN PACKS                                                    │
│  PARAGON (security)   SEXTANT (maritime)   DOMAINE (real estate) │
│  Counsel (legal)   Carlota Jo (advisory)   TENAX (cyber)         │
├──────────────────────────────────────────────────────────────────┤
│  GOVERNANCE INFRASTRUCTURE (shared by all surfaces)             │
│  Outcome Graph · Proof Chain · Covenant Policy                   │
│  Decision Simulation · Workflow Engine · Event Fabric            │
│  AI Engine · RBAC + Auth                                         │
├──────────────────────────────────────────────────────────────────┤
│  DATA LAYER                                                      │
│  PostgreSQL 16 (Drizzle) · 730 provisioned tables · External feeds│
└──────────────────────────────────────────────────────────────────┘
```

---

## Monorepo Structure

| Layer | Path | Contents |
|-------|------|----------|
| Artifacts (surfaces) | `artifacts/` | 7 artifact directories; 6 have registered `artifact.toml` (a11oy, carlota-jo, counsel, sentra, terra, vessels) + api-server |
| API Server | `apps/`, `services/`, `artifacts/api-server/` | Express 5, 30 route files across `apps/alloy-*`, `services/alloy-fabric-api`, and `artifacts/api-server` |
| Lib packages | `lib/` | Shared runtime libraries (db, ai-engine, proof-chain, etc.) |
| Workspace packages | `packages/` | Policy engine, reflection engine, shared-ui, etc. |
| Scripts | `scripts/` | Seed, smoke, metrics, and CI utilities |
| Database | `lib/db/src/schema/` | 197 schema files, 1,066 pgTable definitions |

---

## Key Statistics

| Metric | Value |
|--------|-------|
| Registered artifacts (artifact.toml) | 6 |
| API route files | 30 |
| Database schema files | 197 across lib/db/src/schema/ |
| Provisioned DB tables (live) | 730 |
| Governance primitives | 6 (shared by all surfaces) |
| Platform surfaces | 10 web + 1 mobile + 1 video + 1 design + 1 API |

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
6. Execution       — Workflow Engine routes the action (lib/workflow-engine, FORGE)
7. Proof           — Proof Chain records immutable audit trail (lib/proof-chain)
8. Outcome         — Outcome Graph tracks result (lib/outcome-graph)
9. Learning        — Calibration job updates agent priors (packages/reflection-engine)
```

---

*For the full architecture reference see [`docs/architecture/architecture.md`](docs/architecture/architecture.md).*
*For platform primitives specification see [`docs/platform/platform-primitives.md`](docs/platform/platform-primitives.md).*
*Counts verified 2026-04-25 by Moonshot Phase 1 audit. Source: `audit/source-of-truth.json` v1.3.0.*
*Route-file count corrected 2026-05-30: the prior figure of "357 route files" did not match the repository. The true count is 30 files under `*/routes/` directories — `git ls-tree -r --name-only HEAD | grep -E '/routes?/.*\.(ts|js)$' | grep -v node_modules | wc -l` returns 30 (8 in `apps/alloy-embedding-api`, 2 in `apps/alloy-ingestion-orchestrator`, 9 in `apps/alloy-runtime-api`, 10 in `services/alloy-fabric-api`, 1 in `artifacts/api-server`). The `artifacts/api-server/src/routes/` directory contains a single file (`ouroboros.ts`).*
