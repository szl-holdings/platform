# Foundation Audit — Monorepo Consolidation Map

**Date:** 2026-04-16  
**Scope:** All 19 packages under `packages/`, all 40 lib packages under `lib/`, 15 artifacts under `artifacts/`, and 118 DB schema files under `lib/db/src/schema/`  
**Purpose:** Pre-foundation audit to establish a clean target architecture before building the shared cognitive layers. No code is deleted or renamed in this task — this document records decisions only.

---

## 1. Executive Summary

The monorepo contains **19 packages** under `packages/`, **40 lib packages** under `lib/`, **15 artifacts** (9 registered, 6 unregistered), and **118 DB schema files**. Several structural problems exist:

- **Three naming collisions** between `lib/` and `packages/` for the same `@szl-holdings/*` scope, creating ambiguous pnpm workspace resolution.
- **Five artifacts** carry `ARCHIVED.md` or `DEPRECATED.md` markers and are not registered — they are dead code.
- **One artifact** (`cortex-mobile`) carries `DEFERRED.md` only — it is paused, not dead.
- **Evaluation and replay logic** is split across at least four separate packages.
- **Policy enforcement** is fragmented across three packages.
- **Observability and telemetry** are implemented in four overlapping packages.
- **`packages/atlas-types`** is a pure passthrough re-export of `packages/atlas-core` — wholly redundant.

---

## 2. Package Inventory — `packages/` (19 entries)

> **Last meaningful change** = most recent git commit touching the directory.

| Package | npm name | Purpose | Consumers (known) | Last Meaningful Change | Decision |
|---|---|---|---|---|---|
| `packages/action-engine` | `@szl-holdings/action-engine` | Executable workflows with approval gates, rollback hooks, execution history | `api-server` routing | 5c0fa441 — feat(atlas): wire all six domain packs | **KEEP → absorb into `@workspace/alloy`** |
| `packages/ai-control-plane` | `@szl-holdings/ai-control-plane` | Provider-agnostic model routing, eval-aware selection, cost controls, PII redaction, agent tier enforcement | Standalone | 69b5331d — feat(platform): Add AI Control Plane | **KEEP → rename to `@workspace/alloy`** |
| `packages/atlas-core` | `@szl-holdings/atlas-core` | Canonical schema, Zod-validated entity primitives (signal, event, risk, voyage, incident, etc.) | `atlas-types`, `atlas-events`, `action-engine`, `decision-engine`, `policy-engine` | 938b1da6 — feat(atlas): ATLAS Enterprise State Model | **KEEP → rename to `@workspace/constellation`** |
| `packages/atlas-events` | `@szl-holdings/atlas-events` | Standardized event taxonomy, domain event routing | Standalone | 938b1da6 — feat(atlas): ATLAS Enterprise State Model | **MERGE into `@workspace/constellation`** |
| `packages/atlas-types` | `@szl-holdings/atlas-types` | Pure re-export wrapper over `atlas-core` — zero new code | `artifacts/command` | 938b1da6 — feat(atlas): ATLAS Enterprise State Model | **DEPRECATE → consumers import `@workspace/constellation` directly** |
| `packages/atlassian-connect` | (no package.json) | Empty directory — Atlassian Connect stub | None | 178e3f7d — Fix three broken services | **DEPRECATE (dead — no package.json, no source, no consumers)** |
| `packages/business-events` | `@szl-holdings/business-events` | Generic business event emitter and adapters | `artifacts/api-server` | 3eaac40c — feat: Business Observability & Telemetry Fabric | **MERGE into `@workspace/trace-graph`** (overlaps with `lib/observability/event-bus.ts`) |
| `packages/decision-engine` | `@szl-holdings/decision-engine` | Signal ranking, business impact scoring, urgency/confidence weighting | `packages/action-engine` | 5e5bd461 — task: resolve post-review type errors | **KEEP → absorb into `@workspace/eval-os`** |
| `packages/demo-seed` | `@workspace/demo-seed` | Demo data seed for 4 domain narratives | Scripts only | a3e63736 — feat: Demo & Go-to-Market Readiness | **KEEP as-is (scripts)** |
| `packages/evals-core` | `@szl-holdings/evals-core` | Agent evaluation framework — benchmarks, regression, compare, metrics | Standalone | 2ae8fec2 — feat: Replay, Eval & Trust Infrastructure | **KEEP → rename to `@workspace/eval-os`** |
| `packages/nvidia-adapters` | `@szl-holdings/nvidia-adapters` | Optional NVIDIA NIM, NeMo, and agent profiling adapters | Standalone | 69b5331d — feat(platform): Add AI Control Plane | **KEEP → specialist plugin within `@workspace/tool-mesh`** |
| `packages/observability-core` | `@szl-holdings/observability-core` | Context propagation, correlation, middleware (thin wrapper over `lib/observability`) | Standalone | 3eaac40c — feat: Business Observability & Telemetry Fabric | **MERGE into `@workspace/trace-graph`** |
| `packages/openusd-export` | `@szl-holdings/openusd-export` | OpenUSD digital twin export (vessels, terra, aegis) | Standalone | 69b5331d — feat(platform): Add AI Control Plane | **KEEP → specialist export; associate with `@workspace/memory-fabric`** |
| `packages/policy-engine` | `@szl-holdings/policy-engine` | Hierarchical policy evaluation, guardrails, governance rules | `packages/action-engine` | 5c0fa441 — feat(atlas): wire all six domain packs | **KEEP → rename to `@workspace/guardian`** |
| `packages/prompt-registry` | `@szl-holdings/prompt-registry` | Versioned prompts, A/B comparison, promotion lifecycle | Standalone | 69b5331d — feat(platform): Add AI Control Plane | **KEEP → absorb into `@workspace/tool-mesh`** |
| `packages/replay-core` | `@szl-holdings/replay-core` | Incident/flow capture → sanitized replayable datasets, replay runner | Standalone | 2ae8fec2 — feat: Replay, Eval & Trust Infrastructure | **KEEP → absorb into `@workspace/memory-fabric`** |
| `packages/telemetry-standards` | `@szl-holdings/telemetry-standards` | Shared telemetry contracts — GenAI, business, HTTP | `artifacts/api-server` | 3eaac40c — feat: Business Observability & Telemetry Fabric | **MERGE into `@workspace/trace-graph`** |
| `packages/tool-registry` | `@szl-holdings/tool-registry` | Unified tool registry, MCP bridging, schema validation, approval policy, execution tracking | `artifacts/api-server` | 69b5331d — feat(platform): Add AI Control Plane | **KEEP → rename to `@workspace/tool-mesh`** |
| ~~`packages/ui-command`~~ | ~~`@szl-holdings/ui-command`~~ | Removed — superseded by `@szl-holdings/design-system` (cockpit + proof primitives) | _none_ | Removed (Task #2888) | **REMOVED** |

---

## 3. Package Inventory — `lib/` (40 entries)

### 3a. Core Platform Libraries

| Package | npm name | Purpose | Key Consumers | Last Meaningful Change | Decision |
|---|---|---|---|---|---|
| `lib/db` | `@szl-holdings/db` | PostgreSQL/Drizzle ORM — 118 schema files, single canonical DB layer | Almost every lib and artifact | 7958b17c — Restore all apps: fix port routing | **KEEP (canonical)** |
| `lib/ai-engine` | `@szl-holdings/ai-engine` | Core AI runtime — RAG, embeddings, model routing, knowledge graph, fine-tuning, consciousness, domain agent runner, NuroMesh, MCP apps | `api-server`, `intelligence-feeds` | e77e9461 — Task #848 ATLAS Spatial Runtime | **KEEP (primary AI runtime)** |
| `lib/shared-ui` | `@szl-holdings/shared-ui` | Massive shared React UI library (~100 components) — copilot, entity graph, analytics, CRDT panels, design system, document engine, simulation cockpit | `aegis`, `szl-holdings`, `carlota-jo` | 6fe12df2 — feat: onboarding experience | **KEEP → consolidate with `packages/ui-command`** |
| `lib/forge-runtime` | `@szl-holdings/forge-runtime` | Agent execution runtime — durable job queue, scheduler, event bus, workflow state machine, knowledge store | `api-server` | 86a67dcd — Update project tasks | **KEEP → absorb into `@workspace/alloy`** |
| `lib/observability` | `@szl-holdings/observability` | OTel, GenAI telemetry, event bus, analytics collector, Sentry | `packages/observability-core`, `aegis`, `vessels`, `szl-holdings` | 39ae18ff — Post-merge cleanup sweep | **KEEP → rename to `@workspace/trace-graph`** |
| `lib/services` | `@szl-holdings/services` | Cloud service adapters (GCS, Azure, integrations, providers, registry) | `api-server`, `aegis`, `vessels`, `data-connectors` | 12cbb1a4 — feat(series-a-wave3-4) | **KEEP (infrastructure)** |
| `lib/auth` | `@szl-holdings/auth` | AuthService, DevAuthProvider, identity verification | `api-server` | 1f4d65f8 — feat: GitHub Packages Registry Operational | **KEEP → expand to full auth layer** |
| `lib/config` | `@szl-holdings/config` | Platform constants, app registry, role definitions, env helpers | `api-server` | 12cbb1a4 — feat(series-a-wave3-4) | **KEEP (platform config)** |
| `lib/api-spec` | `@szl-holdings/api-spec` | OpenAPI YAML + Orval codegen config | Code generation | c7b8bf72 — fix(tests): repair broken test suite | **KEEP** |
| `lib/api-zod` | `@szl-holdings/api-zod` | Generated Zod validators from OpenAPI spec | `api-server`, `szl-holdings` | 5cdaf03d — feat(storage): file upload backend | **KEEP** |
| `lib/api-client-react` | `@szl-holdings/api-client-react` | TanStack React Query client (generated from api-spec) | Web frontends | 5cdaf03d — feat(storage): file upload backend | **KEEP** |
| `lib/graphql-client` | `@szl-holdings/graphql-client` | Apollo GraphQL client, hooks, provider | `aegis`, `carlota-jo`, `terra`, `vessels`, `szl-holdings` | c7b8bf72 — fix(tests): repair broken test suite | **KEEP** |

### 3b. Intelligence & Decision Libraries

| Package | npm name | Purpose | Key Consumers | Last Meaningful Change | Decision |
|---|---|---|---|---|---|
| `lib/decision-fabric` | `@szl-holdings/decision-fabric` | Decision records, bottleneck correlation, traceability, learning loop, workflow-360 | `api-server` | 9fe2f945 — Task #799 Decision Fabric & Decision Memory | **KEEP → absorb into `@workspace/eval-os`** |
| `lib/outcome-graph` | `@szl-holdings/outcome-graph` | Outcome graph schema and queries | `decision-fabric`, `api-server` | c7b8bf72 — fix(tests): repair broken test suite | **KEEP → absorb into `@workspace/constellation`** |
| `lib/intelligence-feeds` | `@szl-holdings/intelligence-feeds` | Feed adapters, scheduler, fusion engine — NOAA, GDELT, CISA, NVD, etc. | `api-server` | 250f2a70 — fix(szl-holdings-mobile): resolve TypeScript errors | **KEEP → part of `@workspace/tool-mesh`** |
| `lib/monte-carlo` | `@szl-holdings/monte-carlo` | Monte Carlo simulation DSL, distributions, parallel engine, scenarios | `api-server`, `szl-holdings` | c465254b — Wire Decision Theater to real platform primitives | **KEEP → specialist analytics** |
| `lib/pulse-evals` | `@szl-holdings/pulse-evals` | Golden datasets, eval runner, comparison | Standalone | aa670430 — feat: SZL Trust & Quality Layer | **MERGE into `@workspace/eval-os`** |

### 3c. Policy & Governance Libraries

| Package | npm name | Purpose | Key Consumers | Last Meaningful Change | Decision |
|---|---|---|---|---|---|
| `lib/covenant-policy` | `@szl-holdings/covenant-policy` | Policy approvals, decision templates, engine (Drizzle-backed) | `api-server`, `szl-holdings` | c7b8bf72 — fix(tests): repair broken test suite | **MERGE into `@workspace/guardian`** |
| `lib/audit` | `@szl-holdings/audit` | Enriched audit trail, Drizzle-backed | `api-server` | 1f4d65f8 — feat: GitHub Packages Registry Operational | **KEEP → part of `@workspace/trace-graph`** |

### 3d. Memory & Sync Libraries

| Package | npm name | Purpose | Key Consumers | Last Meaningful Change | Decision |
|---|---|---|---|---|---|
| `lib/proof-chain` | `@szl-holdings/proof-chain` | Cryptographic proof chain, spatial lineage | `api-server`, `receipt-graph`, `atlas-artifacts`, `scene-export`, `atlas-spatial-runtime` | e77e9461 — Task #848 ATLAS Spatial Runtime | **KEEP → part of `@workspace/memory-fabric`** |
| `lib/receipt-graph` | `@szl-holdings/receipt-graph` | Receipt store, API, types | `api-server` | aa670430 — feat: SZL Trust & Quality Layer | **KEEP → part of `@workspace/memory-fabric`** |
| `lib/crdt-sync` | `@szl-holdings/crdt-sync` | CRDT engine and types | `api-server` | b7de3842 — Task #544: CRDT collaborative editing | **KEEP → part of `@workspace/memory-fabric`** |
| `lib/offline-engine` | `@szl-holdings/offline-engine` | Offline command queue, delta sync, conflict resolution, service worker | `aegis`, `vessels` | 250f2a70 — fix(szl-holdings-mobile): resolve TypeScript errors | **KEEP → part of `@workspace/memory-fabric`** |
| `lib/worldline` | `@szl-holdings/worldline` | Signal overlays, temporal layering | `api-server`, `atlas-spatial-runtime` | e77e9461 — Task #848 ATLAS Spatial Runtime | **KEEP → part of `@workspace/constellation`** |

### 3e. Spatial / Domain Libraries

| Package | npm name | Purpose | Key Consumers | Last Meaningful Change | Decision |
|---|---|---|---|---|---|
| `lib/atlas-artifacts` | `@szl-holdings/atlas-artifacts` | Artifact management linked to proof-chain | `scene-export` | c7b8bf72 — fix(tests): repair broken test suite | **KEEP → merge into `@workspace/constellation`** |
| `lib/atlas-spatial-runtime` | `@szl-holdings/atlas-spatial-runtime` | Model lanes, replay engine, drift guard, scenario forge, scene memory router | `api-server` | e77e9461 — Task #848 ATLAS Spatial Runtime | **KEEP → specialist layer; associate with `@workspace/memory-fabric`** |
| `lib/scene-export` | `@szl-holdings/scene-export` | Scene/artifact export adapters, tests | Standalone | d33a7614 — feat: ATLAS export adapters | **KEEP → specialist** |

### 3f. Communication & Messaging Libraries

| Package | npm name | Purpose | Key Consumers | Last Meaningful Change | Decision |
|---|---|---|---|---|---|
| `lib/prism-bus` | `@szl-holdings/prism-bus` | Message bus, MCP connectors, React context + hooks | `aegis`, `carlota-jo`, `terra`, `vessels`, `szl-holdings`, `szl-holdings-mobile` | 86a67dcd — Update project tasks | **KEEP → absorb into `@workspace/tool-mesh`** |
| `lib/mcp-client` | `@szl-holdings/mcp-client` | MCP client UI components, hooks, MCP store provider | `prism-bus` (indirect) | c7b8bf72 — fix(tests): repair broken test suite | **KEEP → part of `@workspace/tool-mesh`** |
| `lib/data-connectors` | `@szl-holdings/data-connectors` | Data connector adapters (wraps `services`) | `api-server` | 68954f63 — feat: Universal Tool Connector Hub | **KEEP → part of `@workspace/tool-mesh`** |

### 3g. Workflow & Runtime Libraries

| Package | npm name | Purpose | Key Consumers | Last Meaningful Change | Decision |
|---|---|---|---|---|---|
| `lib/workflow-engine` | `@szl-holdings/workflow-engine` | Single-line re-export of `forge-runtime` event bus | `api-server` (via forge-runtime) | a9466b3c — fix: add workflow-engine stub | **DEPRECATE → consumers import `@szl-holdings/forge-runtime` directly** |

### 3h. Mobile & Web Utilities

| Package | npm name | Purpose | Key Consumers | Last Meaningful Change | Decision |
|---|---|---|---|---|---|
| `lib/mobile-shared` | `@szl-holdings/mobile-shared` | Mobile components, hooks, offline persistence, push notifications | `szl-holdings-mobile` | 250f2a70 — fix(szl-holdings-mobile): resolve TypeScript errors | **KEEP** |
| `lib/replit-auth-web` | `@szl-holdings/replit-auth-web` | Replit OpenID Connect auth for web | `szl-holdings`, `carlota-jo`, `vessels` | 1f4d65f8 — feat: GitHub Packages Registry Operational | **KEEP** |
| `lib/analytics` | `@szl-holdings/analytics` | Plausible analytics wrapper | `szl-holdings`, `carlota-jo` | 45191ead — Restored to 70cafc8ad | **KEEP (thin)** |
| `lib/i18n` | `@szl-holdings/i18n` | Internationalization | Apps | c7b8bf72 — fix(tests): repair broken test suite | **KEEP** |
| `lib/object-storage-web` | `@workspace/object-storage-web` | Object storage client for web | Apps | 9cfc4e0a — feat: external document storage | **KEEP** |
| `lib/approvals` | (no package.json found) | Approval workflows stub | Unknown | 4ab43106 — Platform stabilization | **REVIEW — unclear if distinct from covenant-policy** |

### 3i. Stub / Conflicted Libraries (CRITICAL — see Section 6)

| Package | npm name | Content | Last Meaningful Change | Note |
|---|---|---|---|---|
| `lib/action-engine` | `@szl-holdings/action-engine` | Simplified JS workflow runner — in-memory Map, no approvals | 7958b17c — Restore all apps | **NAMING CONFLICT** — same scope as `packages/action-engine` (full TS) |
| `lib/decision-engine` | `@szl-holdings/decision-engine` | Simplified JS ranker and priority scorer | 7958b17c — Restore all apps | **NAMING CONFLICT** — same scope as `packages/decision-engine` (full TS) |
| `lib/policy-engine` | `@szl-holdings/policy-engine` | Simplified JS policy map and evaluator | 7958b17c — Restore all apps | **NAMING CONFLICT** — same scope as `packages/policy-engine` (full TS) |

---

## 4. Artifact Inventory (15 entries)

| Artifact Dir | Title | Kind | Registered | Status | Last Meaningful Change | Key Workspace Deps |
|---|---|---|---|---|---|---|
| `artifacts/aegis` | Aegis — Unified Defense & Intelligence Command | web | Yes | Active | 6fe12df2 — feat: onboarding experience | `graphql-client`, `observability`, `prism-bus`, `services`, `offline-engine` |
| `artifacts/api-server` | API Server | web | Yes | Active — core backend | 7ea19f26 — Phase 4-5 audit | `action-engine`, `ai-engine`, `decision-engine`, `decision-fabric`, `api-zod`, `audit`, `auth`, `config`, `covenant-policy`, `policy-engine`, `crdt-sync`, `data-connectors`, `db`, `forge-runtime`, `intelligence-feeds`, `monte-carlo`, `observability`, `business-events`, `telemetry-standards`, `prism-bus`, `proof-chain`, `pulse-evals`, `receipt-graph`, `services`, `worldline`, `atlas-spatial-runtime` |
| `artifacts/carlota-jo` | Carlota Jo Consulting | web | Yes | Active | 7958b17c — Restore all apps | `analytics`, `graphql-client`, `observability`, `replit-auth-web`, `shared-ui`, `prism-bus` |
| `artifacts/command` | Unified Command | web | Yes | Active | 1c5e401b — feat: operator demo route polish | `ui-command` |
| `artifacts/mockup-sandbox` | Component Preview Server | design | Yes | Active — design tooling | 250f2a70 — fix(szl-holdings-mobile) | none |
| `artifacts/szl-holdings` | SZL Holdings Dashboard | web | Yes | Active | a70c2e21 — feat(szl-holdings): intelligence-grade | `analytics`, `graphql-client`, `observability`, `replit-auth-web`, `shared-ui`, `prism-bus`, `covenant-policy`, `monte-carlo`, `ui-command` |
| `artifacts/szl-holdings-mobile` | SZL Holdings — Mobile Command | mobile | Yes | Active | 93a4a764 — feat: Business State UX | `prism-bus` |
| `artifacts/terra` | Terra — Real Estate Intelligence | web | Yes | Active | 6fe12df2 — feat: onboarding experience | `graphql-client`, `prism-bus` |
| `artifacts/vessels` | Vessels Maritime Intelligence | web | Yes | Active | 6fe12df2 — feat: onboarding experience | `graphql-client`, `observability`, `prism-bus`, `replit-auth-web`, `services`, `offline-engine` |
| `artifacts/cortex-mobile` | CORTEX Mobile | mobile | **No** | **DEFERRED** — `DEFERRED.md` present | 130ff9af — Mobile Beta Honest Pass (Phase K) | — |
| `artifacts/firestorm` | Firestorm | — | **No** | **ARCHIVED** — `ARCHIVED.md` present | 12ccda0b — Series A Cleanup Phase 2 | — |
| `artifacts/imperium` | Imperium | — | **No** | **ARCHIVED + DEPRECATED** | 4f477e48 — feat(ops): Mobile, infrastructure | — |
| `artifacts/lyte-command-center` | Lyte Command Center | — | **No** | **ARCHIVED + DEPRECATED** | 4f477e48 — feat(ops): Mobile, infrastructure | — |
| `artifacts/prism-counsel` | Prism Counsel | — | **No** | **DEPRECATED** | 12ccda0b — Series A Cleanup Phase 2 | — |
| `artifacts/stephen-site` | Stephen Site | — | **No** | **DEPRECATED** — replaced by `career` slug in `lib/config` | 12ccda0b — Series A Cleanup Phase 2 | — |

---

## 5. DB Schema Inventory — `lib/db/src/schema/` (118 files)

**Canonical tag legend** (mapping to task terminology):

| Extended tag used in this table | Canonical equivalent |
|---|---|
| `keep` | keep — active, in-use schema; no change needed |
| `keep-active-domain` | keep — active domain-specific schema powering a live artifact |
| `keep-legacy-data` | keep — artifact code is deprecated/archived but schema data must remain queryable; candidate for archival migration in a future task |
| `review` | keep (pending review) — schema present but consumer unclear; auditor recommends confirming before any removal |

No schema file is tagged deprecate or merge-into-X at the DB layer. The DB layer is considered canonical and stable. Deprecation of artifact code does not imply removal of its schema (persisted data must remain queryable).

| File | Domain | Last Meaningful Change | Tag |
|---|---|---|---|
| `a2a.ts` | AI agent-to-agent protocol | a4aa312e — feat: implement A2A protocol | **keep** |
| `activity.ts` | Platform activity feed | 3efd4223 — Task #3: Platform foundation | **keep** |
| `agent_os.ts` | Agent OS primitives | b3d6db73 — feat(agent-os): complete code review | **keep** |
| `agent_skills.ts` | Agent dynamic skills | f4268e2e — feat(alloy): Task #464 Dynamic Skills | **keep** |
| `agent_training.ts` | Agent training jobs | 4de0f986 — feat: Task #60 Nuro Mesh | **keep** |
| `alloy_ai_decisions.ts` | Alloy AI decision records | e2d22203 — feat: consolidate all DB schemas | **keep** |
| `alloy_chat.ts` | Alloy multi-model chat | 8817e814 — Task #57: AlloyChat Advanced AI | **keep** |
| `alloy_comms.ts` | Alloy communications | e2d22203 — feat: consolidate all DB schemas | **keep** |
| `alloy_platform.ts` | Alloy platform metadata | e8b96a9d — feat(omega-phase-1): backend primitives | **keep** |
| `alloy.ts` | Alloy core entities | 6230cba9 — feat: Post-Payload Phase 2 | **keep** |
| `analytics.ts` | Platform analytics events | 6f82dad7 — feat(analytics): Unified Analytics | **keep** |
| `api_keys.ts` | API key management | 3efd4223 — Task #3: Platform foundation | **keep** |
| `approvals.ts` | Approval workflow gates | e8b96a9d — feat(omega-phase-1): backend primitives | **keep** |
| `apps_registry.ts` | Platform app registry | 3efd4223 — Task #3: Platform foundation | **keep** |
| `atlas_artifacts.ts` | ATLAS artifact metadata | fd99fcd0 — Task #337: Outcome Graph, Atlas Artifacts | **keep** |
| `atlas_spatial_runtime.ts` | Spatial runtime sessions | e77e9461 — Task #848 ATLAS Spatial Runtime | **keep** |
| `audit_chain_events.ts` | Cryptographic audit chain | f7755213 — feat(#578): Strategic ecosystem gap fill | **keep** |
| `audit_logs.ts` | General audit log entries | 0ec93e82 — Task #106: Master Payload Phase 1 | **keep** |
| `auth.ts` | Auth sessions and identities | 35dd385e — fix(marketing): complete code review | **keep** |
| `azure_tenants.ts` | Azure/white-label tenants | 43d91f76 — feat: White-label tenant branding | **keep** |
| `billing.ts` | Billing and subscription | 676e0d8d — Task #8: Observability, billing readiness | **keep** |
| `canonical.ts` | Platform canonical entities | 45191ead — Restored to 70cafc8ad | **keep** |
| `capital_readiness.ts` | Capital readiness tracking | eda2f25d — feat(szl-holdings): Complete Capital Readiness | **keep** |
| `carlota_client.ts` | Carlota Jo client profiles | 0ec93e82 — Task #106: Master Payload Phase 1 | **keep-active-domain** |
| `carlota_jo.ts` | Carlota Jo engagements | 3e414f9b — Full-stack backend completeness | **keep-active-domain** |
| `certification_readiness.ts` | Compliance certification tracking | 8e137b02 — Fix 4 code-review-rejected issues | **keep** |
| `change_events.ts` | Platform change event log | b7de3842 — Task #544: CRDT collaborative editing | **keep** |
| `changelog.ts` | Product changelog entries | e169b353 — Task #692: Product onboarding | **keep** |
| `cms.ts` | Blog/content management | dc1e4ab2 — feat(cms): Blog CMS | **keep** |
| `comments.ts` | In-app collaboration comments | 7b2193ee — feat(collaboration): Add in-app collaboration | **keep** |
| `compliance.ts` | Financial/regulatory compliance | 5b4acff8 — Task #486: Financial compliance & CRM | **keep** |
| `connectors.ts` | External connector registry | 5b4acff8 — Task #486: Financial compliance & CRM | **keep** |
| `consciousness.ts` | AI consciousness layer | fba9df73 — feat: consciousness layer full integration | **keep** |
| `conversations.ts` | AlloyChat conversation threads | 272380c0 — feat: AlloyChat multi-model AI operations | **keep** |
| `cortex_action_drafts.ts` | CORTEX action draft queue | 4a16f967 — fix(cortex): complete multi-tenant isolation | **keep** |
| `covenant_sim.ts` | Covenant simulation engine | e2d22203 — feat: consolidate all DB schemas | **keep** |
| `daily_briefings.ts` | AI daily briefing records | f7755213 — feat(#578): Strategic ecosystem gap fill | **keep** |
| `data_retention.ts` | Data retention policies | 5ed1f893 — feat(szl-holdings): enterprise trust | **keep** |
| `decision_fabric.ts` | Decision fabric records | 5f480361 — Task #799 Decision Fabric | **keep** |
| `distribution-os.ts` | Distribution OS / virality engine | 3fd9ae02 — feat(distribution-os): Predictive Virality | **keep** |
| `documents.ts` | Document engine records | 9c26c552 — feat(document-engine): Plate-based editor | **keep** |
| `dreamscape.ts` | Dreamscape/predictive AI (absorbed into Alloy) | 45191ead — Restored to 70cafc8ad | **keep-legacy-data** |
| `entities.ts` | Core platform entity registry | 310ef630 — Platform stabilization: all 6 web apps | **keep** |
| `export_jobs.ts` | Background export job queue | 650dc1d9 — Fix all code review rejections in reporting | **keep** |
| `feature_flags.ts` | Feature flag management | e269bd54 — Task #131: Canonical data model | **keep** |
| `feedback.ts` | NPS surveys and contextual feedback | e42e296a — feat: NPS surveys & contextual feedback | **keep** |
| `files.ts` | Platform file storage references | 3efd4223 — Task #3: Platform foundation | **keep** |
| `fine_tuning.ts` | LLM fine-tuning job records | 37bc8d8a — feat: end-to-end fine-tuning pipeline | **keep** |
| `firestorm.ts` | Firestorm security simulation data | e3a2e099 — Aegis Phase 3 (Task #282) | **keep-legacy-data** (artifact archived; DB layer active) |
| `fund_ops.ts` | Fund operations (SZL Holdings) | a35968d8 — feat(szl-holdings): Fund Operations | **keep** |
| `governance.ts` | Governance rule records | 6d16634e — feat(terra): Complete Phase 3 | **keep** |
| `health_checks.ts` | Platform health check records | 3efd4223 — Task #3: Platform foundation | **keep** |
| `holdings.ts` | Holdings portfolio records | 3e414f9b — Full-stack backend completeness | **keep** |
| `inca_product.ts` | INCA AI research product | 0ec93e82 — Task #106: Master Payload Phase 1 | **keep** |
| `inca.ts` | INCA AI research core | 02ac9bda — fix: SZL audit hardening | **keep** |
| `index.ts` | Schema barrel export | 5f480361 — Task #799 Decision Fabric | **keep** |
| `intelligence_cache.ts` | Intelligence feed cache | 3e4d10fc — Task #243: Complete mock-to-real hardening | **keep** |
| `invitations.ts` | Platform user invitations | a4a000fe — feat: Phase 2-3 auth, tenancy | **keep** |
| `job_queue.ts` | Background job queue (Postgres-backed) | 2487c6f8 — Task #557: Replace InProcessJobQueue | **keep** |
| `knowledge_graph.ts` | AI knowledge graph nodes/edges | 84f4cc3c — fix(task-559): Address code-review comments | **keep** |
| `lyte_product.ts` | Lyte commerce product records | bee25692 — Advanced Platform Hardening | **keep-legacy-data** (Lyte archived; DB layer active) |
| `lyte.ts` | Lyte command center core | 6230cba9 — feat: Post-Payload Phase 2 | **keep-legacy-data** |
| `marine_insurance.ts` | Marine insurance policies | 6edc2953 — Task #488: Three capability leaps | **keep-active-domain** |
| `maritime.ts` | Maritime domain entities | e269bd54 — Task #131: Canonical data model | **keep-active-domain** |
| `messages.ts` | Platform messaging records | 272380c0 — feat: AlloyChat multi-model AI operations | **keep** |
| `metering.ts` | Usage metering records | 98b33d2c — feat(metering): Usage Metering | **keep** |
| `ml_pipeline.ts` | ML training pipeline records | 4d3df81c — chore(rebase): Resolve conflicts ML Pipeline | **keep** |
| `msp_rmm.ts` | Managed services RMM/PSA | 6cbf282e — Task #496: Production RMM/PSA | **keep** |
| `msp.ts` | Managed service provider core | 6cbf282e — Task #496: Production RMM/PSA | **keep** |
| `multiplayer_sessions.ts` | Real-time collaboration sessions | f7755213 — feat(#578): Strategic ecosystem gap fill | **keep** |
| `notifications.ts` | Platform notifications | 3efd4223 — Task #3: Platform foundation | **keep** |
| `nuro_mesh.ts` | Nuro Mesh innovation layer | 4e76b997 — Task #473 Nuro Mesh Innovation Layer | **keep** |
| `organizations.ts` | Tenant organizations | a4a000fe — feat: Phase 2-3 auth, tenancy | **keep** |
| `outcome_graph.ts` | Outcome graph records | fd99fcd0 — Task #337: Outcome Graph, Atlas Artifacts | **keep** |
| `ownership_control.ts` | Ownership and control records | df3911e1 — feat(task-154): Mom-Led Ownership | **keep** |
| `partner_portal.ts` | White-label partner portal | d29e3346 — feat: Multi-Tenancy, White-Label Branding | **keep** |
| `platform_events.ts` | Platform-wide event stream | 6c3e02ec — feat: complete doctrine rebrand | **keep** |
| `platform_ops.ts` | Platform operational metadata | d1a0526c — feat: Platform services | **keep** |
| `platform_status.ts` | Platform status and health | 79b45b46 — feat(szl-holdings): operational visibility | **keep** |
| `prism_counsel_ny.ts` | Prism Counsel NY jurisdiction | 936a33db — feat(prism-counsel-ny): Task #283 | **keep-legacy-data** (artifact deprecated; DB layer active) |
| `prism_counsel_omega.ts` | Prism Counsel Omega stream | 883bbc78 — feat(prism-counsel): Legal Business Observability | **keep-legacy-data** |
| `prism_counsel_ops.ts` | Prism Counsel operations | fc264c4d — Add infrastructure for legal platform | **keep-legacy-data** |
| `prism_counsel_p2_graphql_subgraph.ts` | Prism Counsel P2 GraphQL subgraph | 45191ead — Restored to 70cafc8ad | **keep-legacy-data** |
| `prism_counsel_p2.ts` | Prism Counsel Pilot 2 | 77ada9fe — feat(prism-counsel): Pilot Two | **keep-legacy-data** |
| `prism_counsel_pilot_one.ts` | Prism Counsel Pilot 1 | 37994566 — feat(prism-counsel): PRISM Counsel Pilot One | **keep-legacy-data** |
| `prism_counsel_pilot.ts` | Prism Counsel Pilot 0 | fa7cc009 — Add new navigation and features Pilot Zero | **keep-legacy-data** |
| `prism_counsel_purview.ts` | Prism Counsel Purview | d5c1331b — feat(prism-counsel): Pilot Two Purview | **keep-legacy-data** |
| `prism_counsel_recovery.ts` | Prism Counsel recovery tables | 1ac5da8c — feat(prism-counsel): Pilot Two Recovery | **keep-legacy-data** |
| `prism_counsel_review.ts` | Prism Counsel review queue | 45191ead — Restored to 70cafc8ad | **keep-legacy-data** |
| `prism_counsel_s31.ts` | Prism Counsel S31 | 26a186b1 — Add new sections for advanced platform | **keep-legacy-data** |
| `prism_counsel.ts` | Prism Counsel core | 45191ead — Restored to 70cafc8ad | **keep-legacy-data** |
| `projects.ts` | Platform project records | 03a245cf — Add a project list feature | **keep** |
| `proof_chain.ts` | Cryptographic proof chain entries | e8b96a9d — feat(omega-phase-1): backend primitives | **keep** |
| `push_infra.ts` | Push notification infrastructure | 90a1afe7 — fix(push-infra): add pageSize lower bound | **keep** |
| `push_tokens.ts` | Device push tokens | 90a1afe7 — fix(push-infra): add pageSize lower bound | **keep** |
| `rag_knowledge_documents.ts` | RAG knowledge document chunks | e2d22203 — feat: consolidate all DB schemas | **keep** |
| `rag_knowledge.ts` | RAG knowledge base entries | 557efbf9 — fix(security): P0 hardening complete | **keep** |
| `readiness.ts` | Platform readiness assessment | 6cc47c92 — Build three new SZL Holdings apps | **keep** |
| `recommendations.ts` | AI recommendation records | 2d8726ce — Task #152: SZL Ecosystem Consolidation | **keep** |
| `reports.ts` | Platform report records | 2667ee7a — feat: Industrial report generation | **keep** |
| `revenue_events.ts` | Revenue event stream | e3ed94db — feat: mobile publishing & commercial flow | **keep** |
| `scim.ts` | SCIM 2.0 user provisioning | f2014284 — Task #220: SCIM 2.0 user provisioning | **keep** |
| `self_improvement.ts` | Agent self-improvement records | e2d22203 — feat: consolidate all DB schemas | **keep** |
| `settings.ts` | Tenant/user settings | 86a67dcd — Update project tasks | **keep** |
| `simulation.ts` | Simulation sessions | ef3d5bc3 — Task #505: Database migration consolidation | **keep** |
| `stephen_site.ts` | Stephen Site legacy (Career site) | 3efd4223 — Task #3: Platform foundation | **keep-legacy-data** (artifact deprecated; DB schema retained) |
| `stephen.ts` | Stephen founder identity records | 34f8a927 — Task #45: Ecosystem reconciliation | **keep-legacy-data** |
| `stream_sources.ts` | Real-time stream source config | 4068980c — Task #508: Real-time streaming ingestion | **keep** |
| `support_tickets.ts` | Support ticket records | 5ed1f893 — feat(szl-holdings): enterprise trust | **keep** |
| `szl_canonical.ts` | SZL canonical entity registry | 45191ead — Restored to 70cafc8ad | **keep** |
| `terra.ts` | Terra real estate entities | 6d16634e — feat(terra): Complete Phase 3 | **keep-active-domain** |
| `vessels_intelligence.ts` | Vessels intelligence signals | 45191ead — Restored to 70cafc8ad | **keep-active-domain** |
| `vessels_product.ts` | Vessels product records | 0ec93e82 — Task #106: Master Payload Phase 1 | **keep-active-domain** |
| `vessels_trading.ts` | Vessels trading/P&L | 6edc2953 — Task #488: Three capability leaps | **keep-active-domain** |
| `vessels.ts` | Vessels core domain | db5da456 — feat(task-124): productize Lyte, Vessels | **keep-active-domain** |
| `webhook_events.ts` | Outbound webhook event log | 3efd4223 — Task #3: Platform foundation | **keep** |
| `web_push.ts` | Web Push subscription records | c7e5c440 — feat(notifications): multi-channel expansion | **keep** |
| `worldline.ts` | Worldline signal overlay data | e8b96a9d — feat(omega-phase-1): backend primitives | **keep** |

**DB schema health:** Single canonical `drizzle.config.ts` pointing to `lib/db/src/schema/index.ts`. No schema duplication detected at the file level. The `index.ts` barrel is the single entry point. Schemas for deprecated artifacts (`firestorm`, `lyte`, `prism_counsel`, `stephen_site`) are tagged `keep-legacy-data` — the artifact code is retired but the persisted data must remain queryable.

---

## 6. Critical Issues

### 6.1 Package Naming Collisions (Highest Priority)

Three packages have the **identical npm name** in both `lib/` and `packages/`:

| npm name | `lib/` version | `packages/` version | Impact |
|---|---|---|---|
| `@szl-holdings/action-engine` | `lib/action-engine/src/index.js` — simplified JS workflow runner, in-memory Map, no approval gates | `packages/action-engine/` — full TS with approval gates, rollback hooks, history | pnpm resolves both; `api-server` imports may resolve to either, creating silent behavioral divergence |
| `@szl-holdings/decision-engine` | `lib/decision-engine/src/index.js` — simplified JS signal ranker | `packages/decision-engine/` — full TS with atlas-core Zod integration | Same ambiguity |
| `@szl-holdings/policy-engine` | `lib/policy-engine/src/index.js` — simplified JS policy map | `packages/policy-engine/` — full TS with guardrails, Zod validation | Same ambiguity |

**Resolution plan (recorded, not implemented here):**  
The `packages/` versions are the canonical implementations. The `lib/` stubs should be renamed (e.g., `@szl-holdings/action-engine-stub`) or removed once the foundation packages (`alloy`, `guardian`, `eval-os`) absorb them.

### 6.2 Redundant Packages

| Redundancy | Affected Packages | Proposed Resolution |
|---|---|---|
| `packages/atlas-types` is a zero-logic passthrough of `packages/atlas-core` | `atlas-types`, `atlas-core` | Deprecate `atlas-types`; consumers import `@workspace/constellation` directly |
| `lib/workflow-engine` re-exports only the event bus from `lib/forge-runtime` | `workflow-engine`, `forge-runtime` | Deprecate `workflow-engine`; consumers import `forge-runtime` directly |
| `packages/observability-core` is a thin middleware wrapper around `lib/observability` | `packages/observability-core`, `lib/observability` | Merge into `@workspace/trace-graph` |
| `packages/telemetry-standards` duplicates telemetry contracts in `lib/observability` | `packages/telemetry-standards`, `lib/observability` | Merge into `@workspace/trace-graph` |
| `packages/business-events` duplicates the event bus in `lib/observability/event-bus.ts` | `packages/business-events`, `lib/observability` | Merge into `@workspace/trace-graph` |
| `lib/pulse-evals` duplicates evaluation runner in `packages/evals-core` | `lib/pulse-evals`, `packages/evals-core` | Merge both into `@workspace/eval-os` |
| `lib/covenant-policy` (approvals + decisions) overlaps with `packages/policy-engine` (guardrails + governance) | `lib/covenant-policy`, `packages/policy-engine` | Merge both into `@workspace/guardian` |

### 6.3 Dead / Archived Artifacts

These directories should be removed in a future cleanup task (not in this task):

| Directory | Reason |
|---|---|
| `artifacts/firestorm` | `ARCHIVED.md` present; not registered; no pnpm workspace consumers |
| `artifacts/imperium` | `ARCHIVED.md` + `DEPRECATED.md` |
| `artifacts/lyte-command-center` | `ARCHIVED.md` + `DEPRECATED.md` |
| `artifacts/prism-counsel` | `DEPRECATED.md` |
| `artifacts/stephen-site` | `DEPRECATED.md`; replaced by `career` slug in `lib/config` |
| `packages/atlassian-connect` | No `package.json`, no source, no consumers |

**Note:** `artifacts/cortex-mobile` has `DEFERRED.md` only — it is not dead, just paused. Do not remove.

---

## 7. Cross-App Duplication Report

### 7.1 Entity Types / Schemas

- **Atlas entity types** (`AtlasSignal`, `AtlasRisk`, `AtlasCase`, etc.) are defined once in `packages/atlas-core` and re-exported from `packages/atlas-types`. However, `artifacts/api-server/src/lib/atlas-execution-engine.ts` and related route files (`decisioning.ts`, `domain-atlas-execution.ts`) likely re-declare entity types inline rather than importing from `atlas-core`. These should be audited and replaced with `@workspace/constellation` imports.
- The `lib/db` schema is the single canonical DB representation. No schema duplication detected at the Drizzle layer.

### 7.2 API Clients

Two parallel client stacks exist:
1. **REST + Orval/Zod**: `lib/api-spec` → codegen → `lib/api-zod` → `lib/api-client-react` (TanStack Query)
2. **GraphQL + Apollo**: `lib/graphql-client` (Apollo Client, subscriptions, hooks)

Both are legitimate (REST for CRUD, GraphQL for real-time/relational queries). No elimination needed, but these are the two canonical client paths — no third client stack should be introduced.

### 7.3 Auth

Three auth implementations exist side by side:
1. `lib/auth` — `AuthService` + `DevAuthProvider` (production-capable, provider pattern)
2. `lib/replit-auth-web` — Replit OpenID Connect for web frontends
3. Several artifacts calling auth APIs directly without going through `lib/auth`

**Decision:** `lib/auth` becomes the canonical auth boundary. Replit auth is a provider registered in `AuthService`. No new auth patterns should be added.

### 7.4 Observability / Telemetry

Four overlapping implementations:
1. `lib/observability` — OTel, Sentry, GenAI telemetry, analytics collector, event bus
2. `packages/observability-core` — Context propagation, correlation middleware (depends on lib/observability)
3. `packages/telemetry-standards` — Telemetry schema contracts (GenAI, business, HTTP)
4. `packages/business-events` — Event emitter and adapters (overlaps with lib/observability event-bus)

All four collapse into `@workspace/trace-graph`.

### 7.5 UI Primitives

Two parallel UI libraries:
1. `lib/shared-ui` — ~100 components, design system, analytics, AI widgets, entity graph, simulation cockpit
2. `packages/ui-command` — Composable command surface: causal timelines, KPI blocks, recommendation queues, risk heatmaps

Both are legitimate with distinct responsibilities (`shared-ui` = general platform UI; `ui-command` = AI decision surface). These should be audited to confirm no component is duplicated between them.

### 7.6 Policy / Approval

Three implementations:
1. `packages/policy-engine` — TS, full Zod, guardrails, evaluator (canonical)
2. `lib/policy-engine` — simplified JS, in-memory policy map (**naming conflict**)
3. `lib/covenant-policy` — Drizzle-backed approvals, decision templates, engine

Target: single `@workspace/guardian` absorbing all three.

### 7.7 Evaluation / Replay

Four implementations:
1. `packages/evals-core` — benchmarks, regression, compare, metrics
2. `packages/decision-engine` — signal ranking, business impact scoring
3. `lib/pulse-evals` — golden datasets, eval runner
4. `lib/decision-fabric` — decision records, learning loop, traceability

Target: `@workspace/eval-os` absorbs `evals-core` + `pulse-evals` + `decision-engine` (packages). `decision-fabric` sits above as a domain service or merges into `eval-os`.

---

## 8. Consolidation Map — Target Foundation Layers

Each target layer shows: canonical package name → which existing packages it absorbs or replaces.

### `@workspace/constellation`
**Role:** Knowledge graph, entity model, ontology, spatial relationships, outcomes, worldline  
**Absorbs:**
- `packages/atlas-core` (rename, primary source)
- `packages/atlas-events` (merge in)
- `packages/atlas-types` (deprecate — passthrough)
- `lib/outcome-graph` (merge in)
- `lib/atlas-artifacts` (merge in)
- `lib/worldline` (merge in)

### `@workspace/trace-graph`
**Role:** Distributed tracing, telemetry, event bus, observability, audit, proof chain, receipt graph  
**Absorbs:**
- `lib/observability` (rename, primary source)
- `packages/observability-core` (merge in)
- `packages/telemetry-standards` (merge in)
- `packages/business-events` (merge in)
- `lib/audit` (merge in)
- `lib/proof-chain` (merge in)
- `lib/receipt-graph` (merge in)

### `@workspace/eval-os`
**Role:** Agent evaluation, scoring, regression, golden datasets, decision fabric, learning loop  
**Absorbs:**
- `packages/evals-core` (rename, primary source)
- `lib/pulse-evals` (merge in)
- `packages/decision-engine` (merge in)
- `lib/decision-fabric` (merge in — or keep as domain service above eval-os)

### `@workspace/guardian`
**Role:** Policy enforcement, guardrails, governance rules, covenant approvals, compliance gates  
**Absorbs:**
- `packages/policy-engine` (rename, primary source)
- `lib/covenant-policy` (merge in)
- `lib/policy-engine` (lib/ stub — resolve naming conflict then retire)

### `@workspace/tool-mesh`
**Role:** Tool registry, MCP bridging, prompt registry, intelligence feeds, data connectors, approval policy, execution tracking  
**Absorbs:**
- `packages/tool-registry` (rename, primary source)
- `packages/prompt-registry` (merge in)
- `lib/mcp-client` (merge in)
- `lib/prism-bus` (merge in — bus/connector half; hooks/provider remain in shared-ui)
- `lib/data-connectors` (merge in)
- `lib/intelligence-feeds` (merge in)

### `@workspace/memory-fabric`
**Role:** Persistent memory, CRDT sync, offline engine, replay, spatial runtime, digital twins  
**Absorbs:**
- `packages/replay-core` (merge in, primary source)
- `lib/crdt-sync` (merge in)
- `lib/offline-engine` (merge in)
- `lib/atlas-spatial-runtime` (merge in — or keep as specialist layer)
- `lib/scene-export` (associate)
- `packages/openusd-export` (associate)

### `@workspace/alloy`
**Role:** AI control plane — model routing, eval-aware selection, cost controls, PII redaction, agent tier enforcement, durable execution, agent scheduler  
**Absorbs:**
- `packages/ai-control-plane` (rename, primary source)
- `lib/forge-runtime` (merge in)
- `packages/action-engine` (merge in)
- `lib/action-engine` (lib/ stub — resolve naming conflict then retire)
- `lib/workflow-engine` (deprecate — thin re-export, retire)
- `lib/decision-engine` (lib/ stub — resolve naming conflict then retire)

---

## 9. Proposed Removal List (Do Not Execute — List Only)

Candidates for removal in a future cleanup task:

| Path | Reason |
|---|---|
| `artifacts/firestorm/` | ARCHIVED — no consumers, no registered artifact |
| `artifacts/imperium/` | ARCHIVED + DEPRECATED |
| `artifacts/lyte-command-center/` | ARCHIVED + DEPRECATED |
| `artifacts/prism-counsel/` | DEPRECATED |
| `artifacts/stephen-site/` | DEPRECATED — replaced by `career` slug |
| `packages/atlassian-connect/` | No package.json, no source, no consumers |
| `packages/atlas-types/` | Pure passthrough re-export of atlas-core |
| `lib/workflow-engine/` | Single-line re-export of forge-runtime event bus |
| `lib/action-engine/src/index.js` | Naming conflict; simplified JS superseded by packages/ version |
| `lib/decision-engine/src/index.js` | Naming conflict; simplified JS superseded by packages/ version |
| `lib/policy-engine/src/index.js` | Naming conflict; simplified JS superseded by packages/ version |

---

## 10. Canonical Package Naming Decision

| Layer | Package Name | Primary Source | Absorbs / Replaces |
|---|---|---|---|
| Knowledge graph + entity ontology | `@workspace/constellation` | `packages/atlas-core` | atlas-events, atlas-types (deprecate), outcome-graph, atlas-artifacts, worldline |
| Distributed tracing + audit | `@workspace/trace-graph` | `lib/observability` | observability-core, telemetry-standards, business-events, audit, proof-chain, receipt-graph |
| Agent evaluation + scoring | `@workspace/eval-os` | `packages/evals-core` | pulse-evals, decision-engine (pkg), decision-fabric |
| Policy + governance enforcement | `@workspace/guardian` | `packages/policy-engine` | covenant-policy, lib/policy-engine stub |
| Tool registry + MCP + feeds | `@workspace/tool-mesh` | `packages/tool-registry` | prompt-registry, mcp-client, prism-bus, data-connectors, intelligence-feeds |
| Memory + sync + replay | `@workspace/memory-fabric` | `packages/replay-core` | crdt-sync, offline-engine, atlas-spatial-runtime, scene-export, openusd-export |
| AI control plane + agent runtime | `@workspace/alloy` | `packages/ai-control-plane` | forge-runtime, action-engine (pkg), lib stubs |

**Namespace rule:** All new shared layers use `@workspace/` (not `@szl-holdings/`) to distinguish them as platform-internal foundation packages rather than publishable domain libraries.

---

## 11. Dependency Graph

### 11a. Inter-Package Dependency Table (workspace packages only)

| Package | Depends On (workspace) |
|---|---|
| `packages/action-engine` | `packages/atlas-core`, `packages/decision-engine`, `packages/policy-engine` |
| `packages/atlas-events` | `packages/atlas-core` |
| `packages/atlas-types` | `packages/atlas-core` |
| `packages/decision-engine` | `packages/atlas-core` |
| `packages/evals-core` | *(none)* |
| `packages/observability-core` | `lib/observability` |
| `packages/policy-engine` | `packages/atlas-core` |
| `packages/replay-core` | *(none)* |
| `packages/tool-registry` | *(none — external pino only)* |
| `packages/business-events` | *(none)* |
| `packages/telemetry-standards` | *(none)* |
| `packages/ai-control-plane` | *(none — external pino only)* |
| `packages/prompt-registry` | *(none — external pino only)* |
| `packages/nvidia-adapters` | *(none — external pino only)* |
| `packages/openusd-export` | *(none — external pino only)* |
| ~~`packages/ui-command`~~ | _Removed (Task #2888) — superseded by `@szl-holdings/design-system`_ |
| `packages/demo-seed` | `lib/db` |
| `lib/db` | *(none — base layer)* |
| `lib/ai-engine` | `lib/db`, `lib/services` |
| `lib/observability` | `lib/db` |
| `lib/forge-runtime` | `lib/db`, `lib/observability`, `lib/prism-bus`, `lib/services` |
| `lib/decision-fabric` | `lib/db`, `lib/outcome-graph` |
| `lib/outcome-graph` | `lib/db` |
| `lib/intelligence-feeds` | `lib/db`, `lib/ai-engine` |
| `lib/covenant-policy` | `lib/db`, `lib/prism-bus`, `lib/auth` |
| `lib/audit` | `lib/db` |
| `lib/proof-chain` | `lib/db` |
| `lib/receipt-graph` | `lib/db`, `lib/proof-chain` |
| `lib/atlas-artifacts` | `lib/db`, `lib/proof-chain` |
| `lib/atlas-spatial-runtime` | `lib/db`, `lib/proof-chain`, `lib/worldline` |
| `lib/scene-export` | `lib/db`, `lib/proof-chain`, `lib/atlas-artifacts` |
| `lib/worldline` | `lib/db` |
| `lib/prism-bus` | `lib/mcp-client` |
| `lib/data-connectors` | `lib/services` |
| `lib/graphql-client` | *(none — external Apollo only)* |
| `lib/api-client-react` | *(none — external TanStack Query only)* |
| `lib/monte-carlo` | *(none)* |
| `lib/crdt-sync` | *(none)* |
| `lib/offline-engine` | *(none — external idb only)* |
| `lib/pulse-evals` | *(none)* |
| `lib/shared-ui` | *(none — external Radix/React only)* |
| `lib/mcp-client` | *(none — external TanStack Query only)* |
| `lib/workflow-engine` | `lib/forge-runtime` (re-export only) |
| `lib/mobile-shared` | *(none — external TanStack Query only)* |
| `lib/analytics` | *(none)* |
| `lib/auth` | *(none)* |
| `lib/config` | *(none)* |
| `lib/replit-auth-web` | *(none)* |
| `lib/api-spec` | *(none)* |
| `lib/api-zod` | *(none — external zod only)* |
| `lib/i18n` | *(none)* |
| `lib/object-storage-web` | *(none)* |

**No cycles detected** in the workspace dependency graph. The only cross-tier dependency (packages→lib) is `packages/observability-core` → `lib/observability`; resolved by merging both into `@workspace/trace-graph`.

**Heaviest hub:** `lib/db` is a dependency of 17 workspace packages — it is the safe base layer and must remain stable before any refactoring proceeds.

### 11b. Unreferenced Packages (no workspace consumer detected)

The following packages have **no workspace-level consumer** (`workspace:*` import) in any artifact or other lib/package based on `package.json` dependency inspection:

| Package | Note |
|---|---|
| `packages/evals-core` | Only consumed via CLI or test scripts; no artifact imports it |
| `packages/replay-core` | Same — no artifact imports it directly |
| `packages/ai-control-plane` | No artifact imports it directly |
| `packages/prompt-registry` | No artifact imports it directly |
| `packages/nvidia-adapters` | Optional adapter; no artifact imports it |
| `packages/openusd-export` | Specialist export; no artifact imports it |
| `packages/telemetry-standards` | `api-server` imports it — **not unreferenced** (remove from list) |
| `packages/atlassian-connect` | No package.json, no consumers — dead |
| `lib/pulse-evals` | No artifact imports it directly (api-server is the only server consumer via forge-runtime) |
| `lib/scene-export` | No artifact imports it directly |
| `lib/atlas-artifacts` | Only used by `lib/scene-export` |
| `lib/approvals` | No package.json found; content unknown — dead or absorbed |
| `lib/i18n` | No artifact listed as consumer in package.json audit |
| `lib/crdt-sync` | Only `api-server` imports it |
| `lib/monte-carlo` | Only `api-server` and `szl-holdings` import it |

*Note: "unreferenced" here means no direct `workspace:*` import was found in any artifact `package.json`. A package may still be exercised at runtime via dynamic imports, scripts, or transitive dependencies not captured in this static audit.*

---

*This document is read-only analysis. No code, package names, or schemas were modified.*  
*Next step: Foundation 02 — Constellation graph & ontology (build `@workspace/constellation` from atlas-core).*
