# Moonshot Phase 1 — Complete Platform Inventory

**Generated:** 2026-04-25  
**Track:** Moonshot Phase 1 — Truth & Audit  
**Method:** Filesystem walk + static analysis + source-of-truth.json v1.3.0  
**Canonical data:** `audit/source-of-truth.json`

---

## 1. Registered Artifacts (14 total)

| # | Artifact Dir | Kind | Display Name | Preview Path | Status |
|---|-------------|------|-------------|-------------|--------|
| 1 | `artifacts/szl-holdings` | web | SZL Holdings Dashboard | `/` | Active |
| 2 | `artifacts/api-server` | web | API Server | `/api/` | Active |
| 3 | `artifacts/command` | web | Unified Command (FORGE Portal) | `/command/` | Active |
| 4 | `artifacts/terra` | web | DOMAINE — Real Estate Intelligence | `/terra/` | Active |
| 5 | `artifacts/vessels` | web | SEXTANT Maritime Intelligence | `/vessels/` | Active |
| 6 | `artifacts/carlota-jo` | web | Carlota Jo Consulting | `/carlota-jo/` | Active |
| 7 | `artifacts/pulse` | web | LUMINA — AI Executive Briefing | `/pulse/` | Active |
| 8 | `artifacts/aegis` | web | PARAGON — Investor Pitch Deck | `/aegis/` | Active |
| 9 | `artifacts/sentra` | web | TENAX — Cyber Resilience Command | `/sentra/` | Active |
| 10 | `artifacts/counsel` | web | Counsel — Legal Matter Command | `/counsel/` | Active |
| 11 | `artifacts/lyte-command-center` | web | KORA — Decision Intelligence | `/lyte/` | Active |
| 12 | `artifacts/szl-demo-video` | video | SZL Holdings — Governed Autonomy Demo | `/szl-demo-video/` | Active |
| 13 | `artifacts/szl-holdings-mobile` | mobile | APEX — Unified Mobile Command | `/szl-holdings-mobile/` | Active |
| 14 | `artifacts/mockup-sandbox` | design | PRAXIS — Unified Agentic AI Layer | `/nexus/` | Internal |

**No unregistered artifact directories remain on disk** (all 6 vestigial dirs removed per ORIGINALITY_REPORT.md §2).

---

## 2. Background Applications (`apps/`)

| Package | npm Name | Purpose |
|---------|----------|---------|
| `apps/alloy-embedding-api` | `@workspace/alloy-embedding-api` | AEF REST gateway — embed, rerank, hybrid search |
| `apps/alloy-ingestion-orchestrator` | `@workspace/alloy-ingestion-orchestrator` | Data ingestion pipeline |
| `apps/alloy-runtime-api` | `@workspace/alloy-runtime-api` | AEEP runtime API (v1 endpoints) |

**Count: 3**

---

## 3. Services (`services/`)

| Package | Purpose |
|---------|---------|
| `services/alloy-fabric-api` | Alloy/FORGE fabric API layer |
| `services/alloy-fabric-ingest-control` | Ingestion control service |
| `services/lyte-metrics-store` | KORA/Lyte metrics persistence |
| `services/substrate-mcp-gateway` | Substrate MCP gateway |
| `services/substrate-py-workers` | Python worker substrate |

**Count: 5**

---

## 4. Workers (`workers/`)

| Package | Purpose |
|---------|---------|
| `workers/alloy-embed-worker` | Embedding worker (5 backends) |
| `workers/alloy-rank-worker` | Ranking worker |
| `workers/alloy-rerank-worker` | Reranking worker |
| `workers/alloy-vector-worker` | Vector search worker |
| `workers/substrate-python` | Python substrate worker |

**Count: 5**

---

## 5. Domain Packages (`packages/`) — 84 total

Categories (partial — key packages listed):

| Category | Packages |
|----------|---------|
| AEF Contracts & Runtime | `aef-contracts`, `aef-workflow-runtime`, `aef-evidence-ledger`, `aef-policy-guard`, `aef-retrieval-core`, `aef-sdk`, `aef-storage-adapters`, `aef-evals`, `aef-domain-profiles` |
| Agent Infrastructure | `agent-core`, `agents-core`, `agents-evals`, `agents-prompts`, `agents-tools`, `tool-mesh`, `tool-registry`, `skill-library` |
| Atlas / KORA | `atlas-core`, `atlas-events`, `atlas-types`, `atlas-artifacts` |
| AI Control & Evaluation | `ai-control-plane`, `eval-forge`, `eval-os`, `evals-core`, `prompt-registry` |
| Governance Primitives | `policy-engine`, `policy-guard`, `forge`, `approvals-inbox`, `evidence-ledger`, `evidence-graph`, `run-ledger`, `trace-graph` |
| Memory & Intelligence | `memory-core`, `memory-fabric`, `cognitive-runtime`, `cognitive-observability`, `self-model`, `signal-mesh`, `decision-engine` |
| Data & Schema | `db`, `db-migrations`, `db-repository`, `db-schema`, `schemas`, `domain-claims`, `ontology`, `contracts` |
| Platform Config | `config`, `env`, `platform-metrics-registry`, `brand-registry`, `tokens`, `telemetry-standards` |
| UI & UX | `design-system`, `ui-command`, `shared-contracts` |
| Infra / Substrate | `substrate`, `substrate-client`, `szl-alloy`, `alloy`, `simulation`, `replay-core`, `reflection-engine`, `planner` |
| Connectors | `connectors`, `atlassian-connect`, `constellation`, `nvidia-adapters`, `observability-core`, `otel`, `marketing`, `guardian`, `verifier` |
| Domain | `domain-profiles`, `executive-briefing`, `demo-seed`, `business-events`, `openusd-export`, `retrieval-core`, `workflow-runtime` |
| Auth | `auth-shared` |

**Count: 84** (verified: `ls packages/ | wc -l`)

---

## 6. Shared Library Packages (`lib/`) — 42 total

| Category | Packages |
|----------|---------|
| AI Engine | `ai-engine` |
| Database | `db` |
| Auth | `auth`, `replit-auth-web` |
| API | `api-client-react`, `api-spec`, `api-zod`, `graphql-client` |
| Governance | `proof-chain`, `outcome-graph`, `covenant-policy`, `policy-engine` |
| Execution | `workflow-engine`, `monte-carlo`, `decision-engine`, `decision-fabric`, `prism-bus` |
| UI | `shared-ui`, `mobile-shared` |
| Data | `approvals`, `analytics`, `observability`, `audit`, `telemetry-standards` (via lib) |
| Infrastructure | `intelligence-feeds`, `data-connectors`, `object-storage-web`, `crdt-sync`, `mcp-client`, `services` |
| Other | `atlas-spatial-runtime`, `atlas-artifacts`, `offline-engine`, `forge-runtime`, `domain-claims`, `ontology`, `receipt-graph`, `pulse-evals`, `worldline`, `i18n`, `scene-export`, `config` |

**Count: 42** (verified: `ls lib/ | wc -l`)

---

## 7. API Routes

| Metric | Value | Command |
|--------|-------|---------|
| Total route files | 357 | `find artifacts/api-server/src/routes -name '*.ts' ! -name '*.test.ts' ! -name '*.spec.ts' | wc -l` |
| Top-level route groups | 12 | `find artifacts/api-server/src/routes -mindepth 1 -maxdepth 1 -type d | grep -v '__tests__' | wc -l` |

**Top-level route group directories:**
- `admin/` — Platform admin, org provisioning
- `control-tower/` — Cross-domain health, observability hub
- `distribution-os/` — Distribution OS routes
- `documents/` — Document management
- `domain-agents/` — Domain-specific AI agent endpoints
- `firestorm/` — PARAGON/Firestorm security routes (legacy name retained in route dir)
- `groups/` — Group management
- `intelligence/` — Intelligence feeds and research
- `metering/` — Usage metering
- `rmm/` — Remote monitoring and management
- `tenant-provisioning/` — Tenant onboarding
- `terra-crm/` — DOMAINE CRM routes

---

## 8. Database Schema

| Metric | Value | Source |
|--------|-------|--------|
| Schema files | 170 | `find lib/db/src/schema -name '*.ts' | wc -l` |
| pgTable definitions (raw grep) | 939 | `grep -r '= pgTable' lib/db/src/schema/ --include='*.ts' | wc -l` |
| Live provisioned tables | 730 | Track 4 DB verification (drizzle push, 2026-04-21) |
| Drizzle migration files | 132 | `ls lib/db/drizzle/ | grep -v '^meta$' | wc -l` |
| Drizzle journal entries | 63 | `python3 -c "import json; d=json.load(open('lib/db/drizzle/meta/_journal.json')); print(len(d.get('entries',[])))"`  |
| Hand-authored migrations | 24 | `ls lib/db/migrations/ | wc -l` |
| Rollback scripts | 5 | `ls scripts/rollback/*.sql | wc -l` |

**Schema domains:** Authentication & Identity, Audit & Compliance, FORGE (Alloy) Execution Fabric, PARAGON Security & Defense, SEXTANT Maritime, DOMAINE Real Estate, Counsel Legal, Carlota Jo Advisory, LUMINA Briefing, FORGE AI Runtime, Outcome Graph, Proof Chain, Covenant Policy.

---

## 9. Scheduled Jobs

Key background jobs and scheduled tasks identified in `artifacts/api-server/src/lib/`:

| Job | File | Frequency |
|-----|------|-----------|
| Health degradation watcher | `health-degradation-watcher.ts` | Continuous / interval |
| Intelligence feeds init | `intelligence-feeds-init.ts` | Startup + scheduled refresh |
| Embedding worker | `embedding-worker.ts` | Queue-driven |
| Alloy orchestration | `alloy-orchestration.ts` | Event-driven |
| Control tower mesh publisher | `control-tower-mesh-publisher.ts` | Interval |
| Competitive intel notifications | `competitive-intel-notifications.ts` | Scheduled |
| Alloy run failure notifications | `alloy-run-failure-notifications.ts` | Event-driven |
| Domain notifications | `domain-notifications.ts` | Event-driven |

**Job queue:** `lib/job-queue.ts` (in-memory; see known gap GAP-017 for persistence)

---

## 10. Message Queues

| Queue | Implementation | Note |
|-------|---------------|------|
| Job queue | In-memory (Node.js) | GAP-017: no persistence across restarts |
| Signal bus | PostgreSQL-backed rules engine | `signal_bus_rules`, `signal_bus_routed_events`, `signal_bus_dead_letters` tables |
| Embedding queue | Worker pool | `workers/alloy-embed-worker` |

---

## 11. Prompts & Model Configs

| Location | Contents |
|----------|---------|
| `packages/agents-prompts/src/` | Agent prompt templates |
| `packages/prompt-registry/src/` | Prompt registry (versioned, hashed) |
| `artifacts/api-server/src/lib/model-registry.ts` | Model routing configuration |
| `artifacts/api-server/src/services/prism-model-router.ts` | Multi-provider model router (OpenAI, Anthropic, Gemini) |
| `lib/ai-engine/src/fine-tuning/model-registry-extension.ts` | Fine-tuning model configs |
| `lib/ai-engine/src/innovation/prompt-evolution.ts` | Prompt evolution logic |

**AI providers:** OpenAI, Anthropic, Gemini, HuggingFace Inference API, Elevenlabs

---

## 12. Environment Variables

| Metric | Value | Source |
|--------|-------|--------|
| Declared vars in `.env.example` | 213 | `grep -cE '^[A-Z_]+=' .env.example` |
| Full register | `audit/env-var-matrix.md` | Detailed per-domain var inventory |

**Key credential categories:** Database (5 vars), Auth/Session (4), Email (10+), Stripe/Billing (5+), AI providers (10+), External data feeds (15+), Observability (3), Mapbox (2), AIS (1).

---

## 13. CI/CD Workflows

**Count: 23** (`ls .github/workflows/ | wc -l`)

| Workflow | File | Purpose |
|----------|------|---------|
| CI | `ci.yml` | Full CI: typecheck, lint, test, build, docs-claims |
| CodeQL | `codeql.yml` | GitHub code scanning |
| Security | `security.yml` | Security checks |
| Audit Full | `audit-full.yml` | Full audit suite |
| Build | `build.yml` | Build verification |
| Deploy Staging | `deploy-staging.yml` | Staging deployment |
| Deploy Production | `deploy-production.yml` | Production deployment |
| Dependency Review | `dependency-review.yml` | Dependency vulnerability review |
| Lighthouse | `lighthouse.yml` | Performance audits |
| A11y | `a11y.yml` | Accessibility checks |
| Commitlint | `commitlint.yml` | Commit message format |
| Container Publish | `container-publish.yml` | Container image publishing |
| E2E | `e2e.yml` | End-to-end tests |
| Nightly Smoke | `nightly-smoke.yml` | Nightly smoke tests |
| npm Publish | `npm-publish.yml` | Package publishing |
| PRISM Counsel CI | `prism-counsel-ci.yml` | PRISM Counsel legacy CI |
| README QA | `readme-qa.yml` | README validation |
| Release | `release.yml` | Release pipeline |
| Backup | `backup.yml` | Database backup |
| Secret Scan | `secret-scan.yml` | Secrets scanning |
| Secret Scan Scheduled | `secret-scan-scheduled.yml` | Scheduled secrets scan |
| Uptime Monitor | `uptime-monitor.yml` | Uptime monitoring |
| Verify Source of Truth | `verify-source-of-truth.yml` | SOT drift detection |

---

## 14. Deployment Surfaces

| Environment | Trigger | Config |
|-------------|---------|--------|
| Development | Always on (Replit workspace) | Per-artifact workflows |
| Staging | Push to `main` | `deploy-staging.yml` |
| Production | Published release | `deploy-production.yml` |

**Replit artifact workflows:** 14 registered artifacts, each with a dedicated workflow.

---

## 15. Screenshots & Media Assets

| Location | Contents | Count |
|----------|---------|-------|
| `screenshots/` | Historical screenshots (after Phase 1 cleanup) | ~153 files |
| `screenshots/approved/` | Post-redesign verified screenshots | 0 (empty — refresh deferred to Phase 2) |
| `docs/assets/screenshots/current/` | Current README-facing screenshots | 7 |
| `launch-shots/` | Launch-ready screenshots | 7 |
| `artifacts/szl-demo-video/deliverables/` | Video deliverables (16:9 + 1:1) | 2 MP4s |

**Screenshot catalog:** `audit/screenshot-catalog.md`

---

## 16. Security Infrastructure

| Component | Location |
|-----------|---------|
| RBAC roles | 11 roles in `lib/db/src/schema/auth.ts` |
| CSRF middleware | `artifacts/api-server/src/middlewares/csrf.ts` |
| Auth middleware | `artifacts/api-server/src/middlewares/` |
| Proof Chain | `lib/proof-chain/` |
| Security checklist | `docs/security/security-checklist.md` |
| Access control matrix | `docs/security/access-control-matrix.md` |
| Security policy | `SECURITY.md` |
| Trust center | `docs/trust/trust-center.md` |

---

## 17. Key Documentation

| Document | Location | Purpose |
|----------|---------|---------|
| Architecture | `docs/architecture/architecture.md` | System topology (v4.0, canonical) |
| Platform primitives | `docs/architecture/platform-primitives.md` | Six core abstractions |
| Data model | `docs/architecture/data-model.md` | Schema reference |
| API spec | `docs/architecture/api-spec.md` | Route inventory |
| Known gaps | `docs/operations/known-gaps.md` | Technical debt register |
| Deployment guide | `docs/operations/deployment-guide.md` | Deployment procedures |
| Operations runbook | `docs/operations/operations-runbook.md` | Incident response |
| Source of truth | `audit/source-of-truth.json` | Machine-readable canonical counts |
| Reconciliation | `audit/public-claims-reconciliation.md` | Claims diff history |
| Workspace inventory | `audit/workspace-inventory.md` | Prior workspace walk (2026-04-21) |

---

*Generated by Moonshot Phase 1 audit. All counts verified against filesystem as of 2026-04-25.*
*Reconciliation script: `node scripts/audit/validate-source-of-truth.js` — must exit 0 before any PR merge.*
