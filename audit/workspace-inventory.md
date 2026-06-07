# SZL Holdings — Workspace Inventory

**Generated:** 2026-04-21  
**Track:** Zero-Gap Track 1  
**Method:** Filesystem walk + manual inspection of key config files  
**Canonical data:** See `audit/source-of-truth.json`

---

## 1. Registered Artifacts (14 total)

Registered means the artifact has a `.replit-artifact/artifact.toml` and appears in the Replit workspace artifact registry.

| # | Artifact ID | Kind | Title | Preview Path | Status |
|---|-------------|------|-------|-------------|--------|
| 1 | `artifacts/szl-holdings` | web | SZL Holdings Dashboard | `/` | Active |
| 2 | `artifacts/api-server` | web | API Server | `/api/` | Active |
| 3 | `artifacts/command` | web | Unified Command | `/command/` | Active |
| 4 | `artifacts/terra` | web | Terra — Real Estate Intelligence | `/terra/` | Active |
| 5 | `artifacts/vessels` | web | Vessels Maritime Intelligence | `/vessels/` | Active |
| 6 | `artifacts/carlota-jo` | web | Carlota Jo Consulting | `/carlota-jo/` | Active |
| 7 | `artifacts/pulse` | web | Pulse — AI Executive Briefing | `/pulse/` | Active |
| 8 | `artifacts/aegis` | web | SZL Holdings — Investor Pitch Deck | `/aegis/` | Active |
| 9 | `artifacts/sentra` | web | Sentra — Cyber Resilience Command | `/sentra/` | Active |
| 10 | `artifacts/counsel` | web | Counsel — Legal Matter Command | `/counsel/` | Active |
| 11 | `artifacts/lyte-command-center` | web | Lyte — Decision Intelligence | `/lyte/` | Active |
| 12 | `artifacts/szl-demo-video` | video | SZL Holdings — Governed Autonomy Demo | `/szl-demo-video/` | Active |
| 13 | `artifacts/szl-holdings-mobile` | mobile | SZL Holdings — Mobile Command | `/szl-holdings-mobile/` | Active |
| 14 | `artifacts/mockup-sandbox` | design | NEXUS — Unified Agentic AI Layer | `/nexus/` | Internal |

**Verified by:** `find artifacts -name artifact.toml` → 14 results (2026-04-21)

---

## 2. Artifact Directories On Disk (Not Registered)

These directories exist on disk but have no `artifact.toml` and are not in the workspace registry.

| Directory | Status | Notes |
|-----------|--------|-------|
| `artifacts/firestorm/` | Archived (Task #920) | Aegis defense UI; API routes still live |
| `artifacts/imperium/` | Archived (Task #920) | Cloud sovereignty UI merged into Command |
| `artifacts/prism-counsel/` | Archived (Task #634) | PRISM Counsel UI; API routes still live |
| `artifacts/cortex-mobile/` | Concept | No active development; placeholder |
| `artifacts/internal-audit/` | Internal tooling | Audit tooling; not a product |
| `artifacts/audit/` | Internal tooling | Audit artifacts; not a product artifact |

---

## 3. Applications (`apps/`)

| Package | Purpose |
|---------|---------|
| `apps/alloy-embedding-api` | AEF REST gateway — embed, rerank, hybrid search |
| `apps/alloy-ingestion-orchestrator` | Data ingestion pipeline |
| `apps/alloy-runtime-api` | AEEP runtime API (v1 endpoints) |

**Count: 3**

---

## 4. Services (`services/`)

| Service | Purpose |
|---------|---------|
| `services/alloy-fabric-api` | Alloy fabric API layer |
| `services/alloy-fabric-ingest-control` | Ingestion control service |
| `services/lyte-metrics-store` | Lyte metrics persistence |
| `services/substrate-mcp-gateway` | Substrate MCP gateway |
| `services/substrate-py-workers` | Python worker substrate |

**Count: 5**

---

## 5. Workers (`workers/`)

| Worker | Purpose |
|--------|---------|
| `workers/alloy-embed-worker` | Embedding worker (5 backends) |
| `workers/alloy-rank-worker` | Ranking worker |
| `workers/alloy-rerank-worker` | Reranking worker (cross-encoder) |
| `workers/alloy-vector-worker` | Vector indexing worker |
| `workers/substrate-python` | Python substrate worker (FastAPI + Pydantic v2) |

**Count: 5**

---

## 6. Domain Packages (`packages/`)

**Count: 82 directories** (verified by `ls packages/ | wc -l`)

Key packages:

| Package | Role |
|---------|------|
| `packages/config` | Platform registry, claims, feature flags, env contract |
| `packages/db` | Database client (primary consumer) |
| `packages/db-schema` | Drizzle schema definitions (8 domain files) |
| `packages/db-migrations` | Migration tracking |
| `packages/db-repository` | Repository pattern layer |
| `packages/design-system` | AEEP design system (tokens, shell, layout, data, evidence) |
| `packages/substrate` | Sovereign Execution Substrate (`@szl/substrate`) |
| `packages/agent-core` | Agent run context factory |
| `packages/workflow-runtime` | Workflow run engine |
| `packages/retrieval-core` | Query planner + RRF reranker |
| `packages/memory-core` | In-memory store reference implementation |
| `packages/evidence-ledger` | Immutable append-only ledger |
| `packages/policy-guard` | Policy rule evaluation engine |
| `packages/domain-profiles` | 6 domain profile definitions |
| `packages/platform-metrics-registry` | Typed metric schema + registry |
| `packages/shared-contracts` | 8 agent roles, 10 starter workflows, typed contracts |

---

## 7. Shared Libraries (`lib/`)

**Count: 41 directories** (verified by `ls lib/ | wc -l`)

Key libraries:

| Library | Role |
|---------|------|
| `lib/db` | PostgreSQL client, schema, Drizzle ORM setup |
| `lib/auth` | Authentication providers, session handling |
| `lib/shared-ui` | Shared React UI components |
| `lib/ai-engine` | Multi-provider AI client (OpenAI, Anthropic, Gemini) |
| `lib/workflow-engine` | Durable workflow orchestration |
| `lib/outcome-graph` | Outcome lifecycle tracking |
| `lib/proof-chain` | Immutable audit trail |
| `lib/prism-bus` | Cross-domain event bus (PRISM Bus / Event Fabric) |
| `lib/monte-carlo` | Probabilistic simulation engine |
| `lib/policy-engine` | Covenant Policy enforcement |
| `lib/observability` | OpenTelemetry instrumentation |
| `lib/audit` | Audit event writer |
| `lib/replit-auth-web` | Replit OIDC auth web client |
| `lib/graphql-client` | Apollo GraphQL client |
| `lib/mcp-client` | MCP tool mesh client |

---

## 8. API Route Groups (api-server)

**Route files: 347** (`.ts` files in `artifacts/api-server/src/routes/`, excluding tests)  
**Top-level route groups: 12** (command: `find artifacts/api-server/src/routes -mindepth 1 -maxdepth 1 -type d | grep -v '__tests__' | wc -l`)

| Group | Path Prefix |
|-------|------------|
| `admin` | `/admin/*` |
| `control-tower` | `/control-tower/*` |
| `distribution-os` | `/distribution-os/*` |
| `documents` | `/documents/*` |
| `domain-agents` | `/domain-agents/*` |
| `firestorm` | `/firestorm/*` |
| `groups` | `/groups/*` |
| `intelligence` | `/intelligence/*` |
| `metering` | `/metering/*` |
| `rmm` | `/rmm/*` |
| `tenant-provisioning` | `/tenant-provisioning/*` |
| `terra-crm` | `/terra-crm/*` |

---

## 9. Database

### Schema

| Location | Files | Approach |
|----------|-------|---------|
| `lib/db/src/schema/` | 165 `.ts` schema files | Drizzle ORM `pgTable` definitions |
| `packages/db-schema/src/domains/` | 8 domain schema files | Domain-scoped supplementary schema |

**Drizzle table definitions (pgTable calls):** ~1,078 (grep count, 2026-04-21)  
**Note:** `docs/platform-facts.md` reports 906 — generated 2026-04-20 with a stricter regex. Both counts are methodologically valid; 906 is the registry-canonical figure.

### Migrations

| Location | Files | Notes |
|----------|-------|-------|
| `lib/db/drizzle/` | 115 SQL migration files | Primary Drizzle migrations (0000–0094); some parallel branching (duplicate sequence numbers) |
| `scripts/rollback/` | 5 rollback SQL scripts | Emergency rollback scripts |
| `packages/db-migrations/` | 0 SQL files | Package exists; SQL not yet populated |

---

## 10. CI Workflows (`.github/workflows/`)

**Count: 18**

| Workflow | Purpose |
|---------|---------|
| `audit-full.yml` | Full audit suite |
| `backup.yml` | Database backup |
| `build.yml` | Build validation |
| `ci.yml` | Primary CI (lint, typecheck, test) |
| `codeql.yml` | CodeQL security scan |
| `container-publish.yml` | Container image publishing |
| `dependency-review.yml` | Dependency review on PRs |
| `deploy-production.yml` | Production deployment |
| `deploy-staging.yml` | Staging deployment |
| `e2e.yml` | Playwright E2E tests |
| `lighthouse.yml` | Lighthouse performance audits |
| `npm-publish.yml` | NPM package publishing |
| `prism-counsel-ci.yml` | PRISM Counsel CI (legacy — archived artifact) |
| `readme-qa.yml` | README asset and badge validation |
| `release.yml` | Release workflow (changelog, tags) |
| `secret-scan-scheduled.yml` | Scheduled Gitleaks scan |
| `security.yml` | Security scan suite |
| `uptime-monitor.yml` | Uptime monitoring |

---

## 11. Environment Variables

**Count: 212** (lines matching `^[A-Z_]+=` in `.env.example`, 2026-04-21)

Categories: Authentication, Database, AI providers (OpenAI, Anthropic, Gemini, HuggingFace, ElevenLabs), Payment (Stripe), Communications (Resend, SendGrid, Twilio, Slack), Maritime data, Threat intelligence, Government data APIs, Mobile (Expo, EAS), Analytics, Infrastructure (Redis, Azure).

---

## 12. Authentication Surface

| Provider | Used By | Notes |
|---------|---------|-------|
| Replit OIDC (PKCE) | Primary auth for all web artifacts | Shared via `lib/replit-auth-web` / `lib/auth` |
| RBAC | All routes | 11-role model; deny-by-default |
| Session-based | API server | Express sessions with org-scoped tenant isolation |
| Biometric (planned) | CORTEX mobile | React Native Expo; not yet shipped |

---

## 13. Mobile Surface

| Artifact | Status | Platform |
|---------|--------|---------|
| `artifacts/szl-holdings-mobile` | Deferred (after CORTEX ships) | Expo / React Native (iOS + Android) |
| `artifacts/cortex-mobile` | Concept — no active development | Planned Expo / React Native |

---

## 14. Demo Entry Points

| Path | Purpose |
|-----|---------|
| `/command/demo` | Demo Launchpad — scripted tracks, persona switching, one-click reset |
| `launch/` | Launch content directory (17+ files: ability matrix, mock register, ops docs) |
| `demo-assets/` | Demo media assets |
| `archive/media/launch-shots/` | Launch screenshot set (7 images) — archived from root |

---

## 15. Screenshots & Visual Assets

| Location | Contents |
|---------|---------|
| `assets/readme/` | README-facing product/architecture/brand images |
| `archive/media/launch-shots/` | 7 launch screenshots (01–07 JPG) — archived from root during Track 1 cleanup |
| `docs/screenshots/` | Documentation screenshots |
| `archive/media/` | Archived media assets (formerly `media/` at root) |

---

## 16. Test Coverage

| Suite | Config | Location |
|-------|--------|---------|
| Unit / API | `vitest.config.ts` | `artifacts/api-server/src/**/*.test.ts` |
| Integration | `vitest.integration.config.ts` | `artifacts/api-server/src/**/*.integration.test.ts` |
| Components | `vitest.components.config.ts` | Component-level tests |
| E2E | `playwright.config.ts` | `tests/e2e/*.spec.ts` |
| Substrate | `packages/substrate/src/*.test.ts` | Compiler (9 tests) + engine (6 tests) |

---

## 17. Infrastructure Configuration

| Location | Contents |
|---------|---------|
| `infra/` | Azure Bicep IaC templates (App Service, PostgreSQL, Key Vault, Redis, CDN) |
| `ops/infra/` | Target production architecture, environment matrix, recovery model |
| `ops/mobile/` | EAS build profiles, TestFlight/Play Internal runbooks |
| `docker-compose.yml` | Local development services |
| `.replit` | Replit workflow configuration, port bindings, environment variables |
