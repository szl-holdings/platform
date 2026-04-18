# CODEX_HANDOFF — SZL Holdings Platform

**Date:** April 2026  
**Purpose:** Orient a new agent (Codex, Claude, Cursor, or similar) to the current architecture, open priorities, known gaps, and recommended next steps. Read this before making any changes.

---

## Essential Reading (in order)

1. [architecture.md](architecture.md) — canonical architecture, monorepo structure, layer model
2. [ontology.md](ontology.md) — entity types, signal types, freshness, confidence, policy state
3. [policy-model.md](policy-model.md) — how policy evaluation and proof chain work
4. [telemetry-model.md](telemetry-model.md) — telemetry layers, semantic conventions, correlation contract
5. [app-moats.md](app-moats.md) — canonical product map (which names → which artifacts)
6. [AGENTS.md](AGENTS.md) — rules for all agents and engineers in this repo
7. [docs/PLATFORM_CANONICAL.md](docs/PLATFORM_CANONICAL.md) — build commands, runtime versions, env loading
8. [replit.md](replit.md) — live system overview (auto-loaded)

---

## Current Architecture State

### Monorepo
- **pnpm 10.x** workspace with `packages/`, `lib/`, `artifacts/`, `scripts/`.
- **TypeScript 5.x** across all packages. `tsconfig.base.json` sets `noImplicitAny`, `strictNullChecks`, `alwaysStrict`.
- **PostgreSQL 16** via Drizzle ORM 0.45.x. 799+ tables across 132 schema files in `lib/db/src/schema/`.
- **One API server** (`artifacts/api-server`) — Express 5, serves all domain pack routes plus GraphQL, MCP gateway, and NEXUS static build.
- **Shared proxy** on port 9090 — all sub-path apps (terra, vessels, carlota-jo, command, pulse) share it via `reusePort: true`.

### Active Artifacts (11 registered)
See [app-moats.md](app-moats.md) for the full map. Active: `szl-holdings`, `api-server`, `command`, `vessels`, `terra`, `carlota-jo`, `pulse`, `szl-holdings-mobile`, `mockup-sandbox` (NEXUS), `aegis` (pitch deck), `szl-demo-video`.

### Package Stack
| Layer | Key packages |
|-------|-------------|
| Ontology / types | `packages/ontology` (NEW), `packages/atlas-core`, `packages/atlas-types` |
| Agentic runtime | `packages/alloy`, `packages/cognitive-runtime`, `packages/planner` |
| Policy | `packages/policy-engine`, `lib/covenant-policy` |
| Memory | `packages/memory-fabric` |
| Trace | `packages/trace-graph` |
| Evals | `packages/evals-core`, `packages/eval-os` |
| Telemetry | `packages/telemetry-standards`, `packages/observability-core` |
| Brand | `packages/brand-registry` |
| Decision | `packages/decision-engine`, `packages/action-engine` |
| Execution | `packages/alloy`, `lib/workflow-engine` |

### Authentication
OIDC/PKCE via Replit Auth. 11-role RBAC: `anonymous_visitor`, `founder_admin`, `platform_admin`, `operator`, `analyst`, `executive_viewer`, `ops_manager`, `sales_delivery_user`, `maritime_ops_user`, `service_coordinator`, `pilot_customer_user`.

### AI Layer
Multi-provider via Replit AI proxy: OpenAI, Anthropic, Gemini. Nuro Mesh agent routing in `lib/ai-engine`. Forge governed agent factory in `artifacts/api-server/src/services/forge/` + `lib/db/src/schema/forge.ts`.

---

## Commands to Run

```bash
# Install dependencies
pnpm install

# TypeScript typecheck (all packages)
pnpm typecheck

# Build all packages
pnpm -r --if-present run build

# Run tests
pnpm test

# Lint
pnpm lint

# Schema migration
pnpm migrate

# Seed data
pnpm seed

# Health check
pnpm health:check

# Audit suite
pnpm audit:all
```

**Artifact-specific:**
```bash
# Build NEXUS UI only
pnpm --filter @workspace/api-server build:nexus

# Force NEXUS rebuild + start API server
pnpm --filter @workspace/api-server rebuild:nexus

# Skip NEXUS auto-rebuild (backend-only iterations)
SKIP_NEXUS_BUILD=1 pnpm --filter @workspace/api-server dev
```

---

## Open Priorities (April 2026)

The following are confirmed next-phase work items, in rough priority order:

### P1 — Blocking

| Item | Status | Notes |
|------|--------|-------|
| Firebase credential rotation + pre-launch technical blockers | Tracked | See `AUDIT_FINDINGS_REGISTER.md` |
| Policy appeal endpoint protection + test coverage | Queued | API guard + automated tests |

### P2 — High Value

| Item | Status | Notes |
|------|--------|-------|
| Living signal mesh + evidence graph with connector scaffolding | Queued (next task) | Builds on `packages/ontology` created here |
| Connect Pulse briefings to real AI model | Queued | Live content generation |
| Connect analytics events to real provider | Queued | Conversion tracking |
| SOC 2 Type II audit engagement | Queued | Unblocks enterprise |
| Demo reset button (in-platform) | Queued | Presenter workflow |

### P3 — Nice to Have
- LinkedIn version of Week 1 posts
- Terra and Vessels operator policy appeals
- Printable demo leave-behind PDFs

---

## Known Gaps

| Gap | Risk | Mitigation |
|-----|------|-----------|
| Integration tests not in CI gate | Medium | `pnpm test:integration` exists but not enforced |
| `packages/ontology` not yet consumed by existing packages | Low | Created this task; consumers wired in next phase |
| Real-time signal connectors are mostly mocked | Medium | Living signal mesh task will address |
| Memory Fabric not yet connected to live agent runs | Medium | Alloy runtime integration pending |
| `full_auto` autonomy mode not activated anywhere | Low (by design) | Requires founder approval per org |
| SOC 2 audit not started | Medium | Unblocks regulated enterprise deals |
| Mobile offline sync (`lib/offline-engine`) incomplete | Low | Covered in mobile roadmap |

See `KNOWN-GAPS.md` and `docs/known-gaps.md` for the full registry.

---

## Recommended Next Prompts (for a new agent session)

After reading the essential docs above, these are the recommended starting points for continued work:

**To continue the Living Infrastructure build:**
> "Read architecture.md, ontology.md, telemetry-model.md, and app-moats.md. Then build the signal mesh and evidence graph connector scaffolding as described in the living signal mesh task."

**To wire the ontology package into existing consumers:**
> "Read packages/ontology/src/index.ts and packages/atlas-core/src/index.ts. Update packages/decision-engine, packages/action-engine, and packages/policy-engine to import entity types from @workspace/ontology instead of defining local types."

**To fix a specific API gap:**
> "Read architecture.md and docs/PLATFORM_CANONICAL.md. Then look at artifacts/api-server/src/routes/ and find the route for [X]. Apply the API route rules from AGENTS.md."

**To add a new domain pack:**
> "Read app-moats.md and DOMAIN_PACK_CATALOG.md. Follow the domain pack anatomy checklist. Create signal connectors, domain agents, ontology entity types in packages/ontology, and a UI surface."

---

## Files That Should Not Be Modified Without Explicit Approval

| Path | Reason |
|------|--------|
| `pnpm-lock.yaml` | Modified by pnpm automatically; do not hand-edit |
| `lib/db/src/schema/` | Schema changes require a migration; discuss before modifying |
| `packages/brand-registry/src/` | Brand vocabulary changes affect all copy audits |
| `.replit` | Platform configuration; changing breaks Replit workflows |
| `scripts/post-merge.sh` | Runs automatically after every task merge |
| `packages/ontology/src/entities.ts` | Changing entity types has cascading effects |

---

## Signals That Something Is Wrong

If you see any of these, stop and investigate before proceeding:

- A package exports `Entity` or `Signal` types that differ from `packages/ontology`
- A recommendation object has no `confidence`, `freshness`, or `policyState` field
- A policy check is bypassed with a `// TODO: add policy check` comment
- A `correlationId` is generated with `uuid()` inside a downstream handler (should be propagated, not generated)
- A UI component renders AI-generated content without an evidence badge or freshness indicator
- A script seeds data without `onConflictDoNothing()`
- A route returns AI content without a proof ID in the response envelope

---

*Maintain this file: update Open Priorities and Known Gaps after each task completes. Architecture State should track the current package count, table count, and active artifact list.*
