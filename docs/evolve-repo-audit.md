# AEEP Repo Audit — Phase 1

**Version:** 1.0 | **Date:** April 2026 | **Scope:** Full monorepo structural discovery

---

## 1. Monorepo Overview

The SZL Holdings platform is a pnpm workspace monorepo organized into six top-level directories:

| Directory | Count | Role |
|-----------|-------|------|
| `artifacts/` | 20 | Deployable web, mobile, and video applications |
| `lib/` | 41 | Shared TypeScript libraries (database, auth, UI, AI, workflow) |
| `packages/` | 67 | Domain packages, runtime modules, design system, contracts |
| `apps/` | 2 | Standalone server applications (embedding API, ingestion orchestrator) |
| `workers/` | 3 | Background processing workers |
| `services/` | 3 | Python/hybrid services |

**Toolchain:** Node.js 24, pnpm 10, TypeScript 5.9, Turbo, Biome (lint/format), Vitest, Playwright.

**Build pipeline:** Turbo task graph — `build → typecheck → test → lint`. TypeScript project references enforced via `tsconfig.json` composites. Custom boundary checker at `scripts/check-package-boundaries.ts`.

---

## 2. Artifact Inventory

### Active (registered workflows, serving traffic)

| Artifact | Path | Kind | Notes |
|----------|------|------|-------|
| `api-server` | `/api/` | web/API | Single Express 5 backend for all surfaces |
| `szl-holdings` | `/` | web | Corporate dashboard + investor portal |
| `command` | `/command/` | web | Unified operations command center |
| `lyte-command-center` | `/lyte/` | web | Decision intelligence platform |
| `vessels` | `/vessels/` | web | Maritime intelligence |
| `terra` | `/terra/` | web | Real estate intelligence |
| `carlota-jo` | `/carlota-jo/` | web | Premium advisory portal |
| `pulse` | `/pulse/` | web | AI executive briefing |
| `aegis` | `/aegis/` | web | Investor pitch deck + ATLAS runtime |
| `szl-holdings-mobile` | `/szl-holdings-mobile/` | mobile | Expo / React Native |
| `sentra` | `/sentra/` | web | Cyber resilience command |
| `counsel` | `/counsel/` | web | Legal matter command |
| `prism-counsel` | `/prism-counsel/` | web | PRISM legal command |
| `szl-demo-video` | `/szl-demo-video/` | video | Governed autonomy demo video |
| `mockup-sandbox` | `/nexus/` | design | NEXUS UI prototype |

### Archived (source on disk, no running workflow)

| Artifact | Disposition |
|----------|-------------|
| `firestorm` | Archived Task #920; Aegis defense UI; API routes retained |
| `imperium` | Archived Task #920; merged into Command |
| `cortex-mobile` | WIP; deferred pending CORTEX shipping |
| `internal-audit` | Internal doc surface |
| `audit` | Internal audit artifact |

---

## 3. Shared Library Packages (`lib/`)

| Package | AEEP Role |
|---------|-----------|
| `lib/db` | Database schema (Drizzle ORM, 800+ tables, 10 schema domains) |
| `lib/auth` | OIDC/PKCE, session management, 11-role RBAC |
| `lib/shared-ui` | Cross-app React component library |
| `lib/ai-engine` | Multi-provider AI inference (Nuro Mesh) |
| `lib/audit` | Immutable compliance audit trail |
| `lib/workflow-engine` | Alloy: workflow CRUD, execution, approval gates |
| `lib/forge-runtime` | Durable job queue, worker scheduling |
| `lib/prism-bus` | Cross-domain event bus |
| `lib/covenant-policy` | Policy enforcement engine |
| `lib/proof-chain` | Cryptographic audit trail |
| `lib/intelligence-feeds` | AIS, STIX/TAXII, legal data adapters |
| `lib/observability` | APM, structured logging (Pino), metrics |
| `lib/api-spec` | OpenAPI 3.1 specification |
| `lib/api-client-react` | Generated React Query hooks |
| `lib/api-zod` | Zod validation schemas |
| `lib/services` | Business logic adapters |
| `lib/config` | Runtime configuration |
| `lib/replit-auth-web` | Replit auth web integration |
| `lib/data-connectors` | External data connector adapters |
| `lib/analytics` | Event tracking |
| `lib/monte-carlo` | Probabilistic risk simulation |
| `lib/outcome-graph` | Decision lifecycle tracking |
| `lib/receipt-graph` | Structured receipt/evidence tracking |
| `lib/worldline` | Timeline and event sequencing |
| `lib/pulse-evals` | Pulse evaluation harness |
| `lib/atlas-spatial-runtime` | Spatial/geospatial runtime |
| `lib/crdt-sync` | CRDT sync primitives |
| `lib/decision-engine` | Decision routing |
| `lib/decision-fabric` | Decision fabric primitives |
| `lib/domain-claims` | Verified claims layer |
| `lib/graphql-client` | Apollo GraphQL client |
| `lib/i18n` | Internationalization |
| `lib/mcp-client` | Model Context Protocol client |
| `lib/mobile-shared` | React Native shared components |
| `lib/object-storage-web` | Web object storage |
| `lib/offline-engine` | Offline sync for mobile |
| `lib/policy-engine` | Policy enforcement |
| `lib/scene-export` | 3D scene export |

---

## 4. Domain Packages (`packages/`)

### Runtime / AI / Cognitive

| Package | Current State | AEEP Target |
|---------|--------------|-------------|
| `cognitive-runtime` | Active, 8-phase loop (perceive/orient/plan/execute/verify/reflect/update_self_model/update_memory) | Refactor → `packages/agent-core` adapter |
| `alloy` | Active, checkpoint store, model router, plan orchestrator, run manager | Refactor → `packages/workflow-runtime` adapter |
| `szl-alloy` | Thin wrapper over alloy | Deprecate, consume `alloy` directly |
| `action-engine` | Active | Fold into agent-core |
| `decision-engine` | Active | Keep |
| `planner` | Active | Fold into agent-core planning phase |
| `reflection-engine` | Active | Keep as eval adapter |
| `replay-core` | Active | Fold into workflow-runtime |
| `memory-fabric` | Active, 4-tier memory (working/episodic/semantic/governance) | Refactor → `packages/memory-core` adapter |
| `tool-registry` | Active | Keep, enhance |
| `tool-mesh` | Active, thin routing layer | Fold into tool-registry |
| `skill-library` | Active | Keep |
| `cognitive-observability` | Active | Keep |
| `self-model` | Active | Keep |
| `verifier` | Active | Keep |
| `guardian` | Active | Fold into policy-guard |
| `approvals-inbox` | Active | Fold into workflow-runtime approval layer |
| `signal-mesh` | Active | Keep, wire to evidence layer |
| `eval-forge` | Active | Fold into evals package |
| `eval-os` | Active | Fold into evals package |
| `evals-core` | Active | Refactor → `packages/evals` |

### AEF Runtime (Phase 3 — existing)

| Package | Current State | AEEP Target |
|---------|--------------|-------------|
| `aef-contracts` | Active, v0.1.0 | Refactor → `packages/shared-contracts` (AEEP namespace) |
| `aef-retrieval-core` | Active, RRF fusion, citations, boost, filter, adapters | Refactor → `packages/retrieval-core` adapter |
| `aef-evidence-ledger` | Active, fs-store, query, types | Refactor → `packages/evidence-ledger` adapter |
| `aef-policy-guard` | Active, engine, redaction, retention, tenant | Refactor → `packages/policy-guard` adapter |

### Evidence / Policy / Governance

| Package | Current State | AEEP Target |
|---------|--------------|-------------|
| `evidence-graph` | Active | Fold into evidence-ledger |
| `policy-engine` | Active | Fold into policy-guard |
| `domain-claims` | Active | Keep, wire to domain-profiles |
| `contracts` | Active, Zod schemas (auth/alloy/ai/admin/webhooks) | Keep, extend for AEEP v1 API |
| `schemas` | Active | Keep alongside contracts |
| `ontology` | Active | Keep |

### Infrastructure / Data

| Package | Current State | AEEP Target |
|---------|--------------|-------------|
| `db` | PostgreSQL schema stubs | Keep, referenced by lib/db canonical |
| `db-migrations` | Migration scripts | Keep |
| `db-repository` | Repository layer | Keep |
| `db-schema` | Schema definitions | Keep |
| `config` | Platform config registry | Keep as canonical platform-facts source alongside new metrics-registry |
| `env` | Env schema validation | Keep |
| `otel` | OTel setup | Keep |
| `observability-core` | Metrics/telemetry | Keep |
| `telemetry-standards` | Semantic conventions | Keep |
| `trace-graph` | Trace linking | Keep |
| `connectors` | External connectors | Keep |
| `storage-adapters` (new) | — | Create: local-fs, postgres-backed, object-storage adapters |

### UI / Design

| Package | Current State | AEEP Target |
|---------|--------------|-------------|
| `design-system` | Active: tokens, proof primitives, cockpit components | Expand to full AEEP component set |
| `ui-command` | Deprecated (migration underway) | Complete deprecation |
| `brand-registry` | Active | Keep |
| `marketing` | Active | Keep |

### Other

| Package | Current State | AEEP Target |
|---------|--------------|-------------|
| `atlas-core` / `atlas-events` / `atlas-types` | Active | Keep |
| `business-events` | Active | Keep |
| `constellation` | Active | Keep |
| `demo-seed` | Active | Keep |
| `executive-briefing` | Active | Keep |
| `nvidia-adapters` | Active | Keep |
| `openusd-export` | Active | Keep |
| `prompt-registry` | Active | Keep |
| `run-ledger` | Active | Keep |
| `simulation` | Active | Keep |
| `substrate` / `substrate-client` | Active | Keep |
| `agents-core` / `agents-evals` / `agents-prompts` / `agents-tools` | Active | Fold into agent-core + evals |
| `ai-control-plane` | Active | Keep |
| `atlassian-connect` | Active | Keep |
| `proxy-routes.ts` | Active | Keep |
| `approvals-inbox` | Active | Fold into workflow-runtime |

---

## 5. Apps

| App | Current State | AEEP Target |
|-----|--------------|-------------|
| `apps/alloy-embedding-api` | Active — embedding/rerank/hybrid-search gateway | Refactor → `apps/alloy-runtime-api` (supersedes; embedding gateway becomes v1 sub-router) |
| `apps/alloy-ingestion-orchestrator` | Active — ingestion pipeline | Refactor → `apps/alloy-ingest-control` |

New apps to create:
- `apps/alloy-ops-console` — Operator management console

---

## 6. Workers

| Worker | Current State | AEEP Target |
|--------|--------------|-------------|
| `workers/alloy-embed-worker` | Active, MicroBatchQueue, 5 backends | Keep, rename scope to AEEP |
| `workers/alloy-rerank-worker` | Active, cross-encoder + TF fallback | Keep |
| `workers/substrate-python` | Active, Python substrate | Keep |

New workers to scaffold:
- `workers/alloy-tool-executor`
- `workers/alloy-retrieval-worker`
- `workers/alloy-memory-worker`
- `workers/alloy-eval-worker`
- `workers/alloy-vector-worker`
- `workers/alloy-rank-worker`

---

## 7. Scripts

| Script | Purpose |
|--------|---------|
| `scripts/aef-smoke.ts` | End-to-end AEF smoke test |
| `scripts/brand-check.ts` | Brand compliance |
| `scripts/check-package-boundaries.ts` | Package boundary enforcement |
| `scripts/generate-platform-metrics.ts` | (New) Platform metrics generation |
| `scripts/validate-platform-facts.ts` | (New) Drift validation |
| `scripts/qa/smoke-routes.js` | Route smoke tests |
| `scripts/seed-demo-canonical.sh` | Demo seed |

---

## 8. Documentation Surface

Root-level docs: 40+ markdown files covering architecture, API specs, data models, access control, security, deployment, governance, audit findings, investor readiness.

`docs/` directory: 80+ files across audit, architecture, operations, platform, doctrine, design, investor, mobile, and observability subdirectories.

**Key observation:** Platform facts (app counts, package counts, table counts, endpoint counts) are hard-coded in at least 12 different documents with varying and inconsistent numbers. The `packages/config` registry is the closest existing single source of truth but is not consumed by all documentation.

---

## 9. CI / QA Surface

`.github/workflows/` includes: CI, CodeQL, security scan, deploy-staging, deploy-production, README QA pipelines.

Root `package.json` exposes 60+ scripts covering typecheck, test, integration test, E2E, QA, audit, brand check, seed, smoke, readiness gate, and release prep.

**Validation framework:** `vitest.config.ts` (unit), `vitest.integration.config.ts` (integration), `vitest.components.config.ts` (component), `playwright.config.ts` (E2E).

---

## 10. Key Structural Findings

1. **Naming fragmentation:** AEF packages use `aef-` prefix; cognitive packages use `cognitive-`; governance uses `guardian`/`verifier`/`approvals-inbox`. AEEP introduces a consistent namespace.
2. **Duplicate retrieval paths:** `aef-retrieval-core`, `lib/intelligence-feeds`, `signal-mesh` all handle aspects of retrieval. AEEP consolidates under `retrieval-core`.
3. **Memory duplication:** `memory-fabric` (packages) and `lib/offline-engine` both manage memory layers. AEEP consolidates under `memory-core`.
4. **Policy fragmentation:** `aef-policy-guard`, `lib/covenant-policy`, `lib/policy-engine`, `packages/policy-engine`, `guardian` all touch policy. AEEP consolidates under `policy-guard`.
5. **Evidence fragmentation:** `aef-evidence-ledger`, `evidence-graph`, `packages/run-ledger`, `lib/receipt-graph` all handle evidence. AEEP consolidates under `evidence-ledger`.
6. **Workflow duplication:** `packages/alloy`, `lib/workflow-engine`, `lib/forge-runtime` overlap in workflow execution. AEEP consolidates under `workflow-runtime`.
7. **Shell inconsistency:** `lib/shared-ui` holds `DashboardShell`/`EcosystemNav`/`CommandPalette`; no uniform executive/operator mode contract exists.
8. **Platform facts drift:** 12+ documents contain hard-coded platform statistics with inconsistencies of 30–40% between sources.
