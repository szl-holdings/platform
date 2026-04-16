# SZL Holdings — Full System Inventory

**Last updated:** 2026-04-16 (Phase 0–1 Audit)
**Owner:** Platform Engineering
**Audience:** Technical advisors, incoming VP Engineering, enterprise evaluators, auditors

This is the canonical exhaustive inventory of the entire SZL Holdings monorepo. It supersedes all prior partial inventories. For gaps, see `AUDIT_FINDINGS_REGISTER.md`. For secret hygiene, see `SECRETS_SETUP.md` and `SECURITY-CHECKLIST.md`.

---

## 1. Deployable Artifacts (15 total)

### 1.1 Active Web Artifacts (7)

| Artifact Dir | Package Name | Preview Path | Purpose | Maturity | Auth | Data Mode |
|---|---|---|---|---|---|---|
| `artifacts/szl-holdings` | `@workspace/szl-holdings` | `/` | Corporate site, investor hub, trust center, Decision Theater, legal pages | Production-ready | Public + OIDC (investor portal) | Real + illustrative content |
| `artifacts/api-server` | `@workspace/api-server` | `/api/` | REST, GraphQL, WebSocket backend for all domain packs | Production-ready | OIDC/PKCE session-based | Real PostgreSQL |
| `artifacts/command` | `@workspace/command` | `/command/` | Unified ops command center (Lyte + IMPERIUM absorbed) | Production-ready | OIDC required | Real API + DB |
| `artifacts/aegis` | `@workspace/aegis` | `/aegis/` | Defense & security intelligence platform | Production-ready | OIDC required | Real structured data |
| `artifacts/vessels` | `@workspace/vessels` | `/vessels/` | Maritime fleet command and intelligence | Production-ready | OIDC required | Real structured data (simulated AIS) |
| `artifacts/terra` | `@workspace/terra` | `/terra/` | Real estate intelligence and deal management | Production-ready | OIDC required | Real structured data + NYC Open Data |
| `artifacts/carlota-jo` | `@workspace/carlota-jo` | `/carlota-jo/` | Premium advisory and case management | Production-ready | OIDC required | Real structured data |

### 1.2 Active Mobile Artifacts (1)

| Artifact Dir | Package Name | Preview | Purpose | Maturity | Auth |
|---|---|---|---|---|---|
| `artifacts/szl-holdings-mobile` | `@workspace/szl-holdings-mobile` | Expo tunnel | CORTEX unified mobile command (iOS/Android) | Beta | OIDC required |

### 1.3 Active Internal/Tooling Artifacts (1)

| Artifact Dir | Package Name | Preview Path | Purpose |
|---|---|---|---|
| `artifacts/mockup-sandbox` | `@workspace/mockup-sandbox` | `/__mockup` | Design system component preview — internal dev tool |

### 1.4 Deprecated/Archived Artifact Directories (5)

| Artifact Dir | Status | Notes |
|---|---|---|
| `artifacts/firestorm` | Archived — content in Aegis | `DEPRECATED.md` present; Aegis is canonical successor |
| `artifacts/lyte-command-center` | Archived — content in Command | Legacy build dist present; no active source; deregistered |
| `artifacts/imperium` | Skeleton — never built | Only `node_modules/`, no source, no package.json |
| `artifacts/prism-counsel` | Archived | Legal matter management; deregistered; content now in Command/API |
| `artifacts/stephen-site` | Deprecated | Founder profile moved to `/founder` in `szl-holdings` |

### 1.5 Unscaffolded/In-Progress Artifact Directories (1)

| Artifact Dir | Status | Notes |
|---|---|---|
| `artifacts/cortex-mobile` | Active development, unregistered | Expo config + `app/` present; separate from `szl-holdings-mobile`; no artifact.toml |

---

## 2. Shared Libraries (lib/ — 40 directories, 39 with package.json)

| Library | Package Name | Purpose | Notes |
|---|---|---|---|
| `lib/action-engine` | `@szl-holdings/action-engine` | Action execution and coordination engine | |
| `lib/ai-engine` | `@szl-holdings/ai-engine` | OpenAI / Anthropic / Gemini provider wrappers, eval hooks, trace capture | Multi-provider via Replit AI proxy |
| `lib/analytics` | `@szl-holdings/analytics` | Analytics event tracking | |
| `lib/api-client-react` | `@szl-holdings/api-client-react` | React Query hooks for API | Generated |
| `lib/api-spec` | `@szl-holdings/api-spec` | OpenAPI 3.1 specification | Single source of truth for API contracts |
| `lib/api-zod` | `@szl-holdings/api-zod` | Zod schemas for API request/response validation | |
| `lib/approvals` | `@szl-holdings/approvals` | Multi-step approval workflow types and helpers | |
| `lib/atlas-artifacts` | `@szl-holdings/atlas-artifacts` | Atlas artifact registration and metadata | |
| `lib/atlas-spatial-runtime` | `@szl-holdings/atlas-spatial-runtime` | Spatial graph runtime for Atlas | |
| `lib/audit` | `@szl-holdings/audit` | Immutable audit trail and event log | |
| `lib/auth` | `@szl-holdings/auth` | Auth types, OIDC helpers, session management | |
| `lib/config` | `@szl-holdings/config` | Platform-wide constants, app registry, roles | |
| `lib/covenant-policy` | `@szl-holdings/covenant-policy` | Policy enforcement and compliance rules | |
| `lib/crdt-sync` | `@szl-holdings/crdt-sync` | CRDT-based real-time sync primitives | |
| `lib/data-connectors` | `@szl-holdings/data-connectors` | External data source connector framework | |
| `lib/db` | `@szl-holdings/db` | Drizzle ORM schema, migrations, PostgreSQL client | 700+ tables, 10 schema domains |
| `lib/decision-engine` | `@szl-holdings/decision-engine` | Decision scoring and recommendation engine | |
| `lib/decision-fabric` | `@szl-holdings/decision-fabric` | Decision trace and audit fabric | |
| `lib/forge-runtime` | `@szl-holdings/forge-runtime` | Alloy workflow execution engine internals | Durable job queue, agent execution |
| `lib/graphql-client` | `@szl-holdings/graphql-client` | Apollo GraphQL client layer | |
| `lib/i18n` | `@szl-holdings/i18n` | Internationalization framework | |
| `lib/intelligence-feeds` | `@szl-holdings/intelligence-feeds` | AIS, STIX/TAXII, legal data, CISA KEV, NVD, MITRE ATT&CK adapters | Multiple live feeds |
| `lib/mcp-client` | `@szl-holdings/mcp-client` | Model Context Protocol client | |
| `lib/mobile-shared` | `@szl-holdings/mobile-shared` | React Native shared components | |
| `lib/monte-carlo` | `@szl-holdings/monte-carlo` | Probabilistic risk simulation | |
| `lib/object-storage-web` | `@szl-holdings/object-storage-web` | Object storage integration for web | |
| `lib/observability` | `@szl-holdings/observability` | APM, structured Pino logging, metrics, health endpoints | |
| `lib/offline-engine` | `@szl-holdings/offline-engine` | Offline sync for mobile | |
| `lib/outcome-graph` | `@szl-holdings/outcome-graph` | Outcome graph data model | |
| `lib/policy-engine` | `@szl-holdings/policy-engine` | Policy rule evaluation | |
| `lib/prism-bus` | `@szl-holdings/prism-bus` | Cross-domain event bus | |
| `lib/proof-chain` | `@szl-holdings/proof-chain` | Cryptographic audit trail | |
| `lib/pulse-evals` | `@szl-holdings/pulse-evals` | Pulse evaluation framework | |
| `lib/receipt-graph` | `@szl-holdings/receipt-graph` | Receipt and transaction graph | |
| `lib/replit-auth-web` | `@szl-holdings/replit-auth-web` | Replit Auth OIDC integration helpers for web | |
| `lib/scene-export` | `@szl-holdings/scene-export` | Scene export utilities | |
| `lib/services` | `@szl-holdings/services` | Business logic adapters (email, notifications, geocoding) | |
| `lib/shared-ui` | `@szl-holdings/shared-ui` | Cross-app React component library | |
| `lib/workflow-engine` | `@szl-holdings/workflow-engine` | Alloy workflow CRUD, execution routing, approval gates | |
| `lib/worldline` | `@szl-holdings/worldline` | Timeline and event sequencing | |

### 2.1 lib/ Integration Subdirectories

| Path | Purpose |
|---|---|
| `lib/integrations/*` | Third-party integration packages (Salesforce, Atlassian, etc.) |

---

## 3. Marketplace Packages (packages/ — 18 directories)

| Package | Name | Purpose |
|---|---|---|
| `packages/action-engine` | `@szl-holdings/action-engine` | Action execution engine (marketplace edition) |
| `packages/ai-control-plane` | `@szl-holdings/ai-control-plane` | AI model control plane and routing |
| `packages/atlas-core` | `@szl-holdings/atlas-core` | Atlas spatial intelligence core |
| `packages/atlas-events` | `@szl-holdings/atlas-events` | Atlas event streaming |
| `packages/atlassian-connect` | — | Atlassian Connect / Jira integration (no package.json) |
| `packages/atlas-types` | `@szl-holdings/atlas-types` | Shared Atlas type definitions |
| `packages/business-events` | `@szl-holdings/business-events` | Business event schema and publishers |
| `packages/decision-engine` | `@szl-holdings/decision-engine` | Decision scoring engine (marketplace edition) |
| `packages/evals-core` | `@szl-holdings/evals-core` | AI evaluation framework core |
| `packages/nvidia-adapters` | `@szl-holdings/nvidia-adapters` | NVIDIA NIM API adapters |
| `packages/observability-core` | `@szl-holdings/observability-core` | Observability primitives (marketplace edition) |
| `packages/openusd-export` | `@szl-holdings/openusd-export` | OpenUSD scene export |
| `packages/policy-engine` | `@szl-holdings/policy-engine` | Policy engine (marketplace edition) |
| `packages/prompt-registry` | `@szl-holdings/prompt-registry` | Versioned prompt template registry |
| `packages/replay-core` | `@szl-holdings/replay-core` | Replay and time-travel debugging |
| `packages/telemetry-standards` | `@szl-holdings/telemetry-standards` | OpenTelemetry conventions and standards |
| `packages/tool-registry` | `@szl-holdings/tool-registry` | AI tool / function-call registry |
| `packages/ui-command` | `@szl-holdings/ui-command` | Command palette UI primitives |

---

## 4. API Server — Route Files (225 total `.ts` files in `artifacts/api-server/src/routes/`, 189 top-level entries)

### 4.1 Primary Domain Route Groups

| Route Prefix | Domain | Files |
|---|---|---|
| `/api/auth` | Authentication / sessions | `auth.ts`, `oidc-auth.ts`, `scim.ts` |
| `/api/alloy` | Workflow engine, approvals, audit | `alloy.ts`, `alloy-chat.ts`, `alloy-governance.ts`, `alloy-integrations.ts`, `alloy-email.ts`, `alloy-meetings.ts`, `alloy-research.ts`, `alloy-skills.ts`, `alloy-voice.ts`, `alloy-channels.ts`, `alloy-digest.ts`, `alloy-cognitive-learning.ts`, `approvals.ts` |
| `/api/firestorm` | SOC / security ops (Aegis) | `firestorm/`, `firestorm-live.ts`, `firestorm-command-surfaces.ts` |
| `/api/terra` | Property intelligence + CRM | `terra.ts`, `terra-live.ts`, `terra-distress.ts`, `terra-broker.ts`, `terra-crm/` |
| `/api/vessels` | Fleet tracking + maritime ops | `vessels.ts`, `vessels-live.ts`, `vessels-extended.ts`, `vessels-insurance.ts`, `vessels-trading.ts`, `vessels-platform.ts` |
| `/api/prism-counsel` | Legal matter management | `prism-counsel-core.ts`, `prism-counsel-court.ts`, `prism-counsel-ny.ts`, `prism-counsel-ops.ts`, `prism-counsel-pilot.ts`, `prism-counsel-pilot-one.ts`, `prism-counsel-purview.ts`, `prism-counsel-review.ts`, `prism-counsel-s31.ts` |
| `/api/ai` | AI tool execution | `ai-engine.ts`, `nuro-mesh.ts`, `nuro-mesh-advanced.ts`, `agent-federation.ts`, `agent-autonomy.ts`, `agent-training.ts`, `agent-os.ts`, `fine-tuning.ts`, `ml-pipeline.ts`, `pulse-evals.ts` |
| `/api/intelligence` | External intel feeds | `intelligence/`, `gov-data.ts`, `signal-chains.ts`, `correlation-map.ts` |
| `/api/storage` | Object storage / file management | `storage.ts`, `files.ts`, `documents/` |
| `/api/billing` | Stripe billing operations | `billing.ts`, `lyte-billing.ts`, `usage.ts`, `metering/` |
| `/api/admin` | Backup, tenant provisioning | `admin/`, `tenant-provisioning/`, `gdpr.ts`, `data-retention.ts` |
| `/api/notifications` | Push notifications | `push-notifications.ts`, `push-tokens.ts`, `push-analytics.ts`, `push-history.ts`, `push-preferences.ts`, `web-push-subscriptions.ts` |
| `/api/graphql` | GraphQL endpoint (Apollo) | `core.ts` (Apollo Server) |
| `/api/health` | System health checks | `health.ts`, `health-integrations.ts` |
| `/api/docs` | Swagger UI (OpenAPI spec) | (served by api-spec) |

### 4.2 Additional Route Files

| File | Domain |
|---|---|
| `autopilot.ts` | AI autopilot / recommendations |
| `capital-readiness.ts` | Fund ops / cap table |
| `certification-readiness.ts` | Compliance certifications |
| `command.ts`, `cortex.ts` | Command/CORTEX portal |
| `compliance.ts` | Compliance management |
| `connector-hub.ts`, `connectors.ts` | Data connectors |
| `crm.ts` | General CRM |
| `cross-domain-query.ts` | Cross-domain data queries |
| `distribution-os/` | Distribution OS routes |
| `dreamscape.ts`, `dreamscape-live.ts` | Dreamscape product |
| `feature-flags.ts` | Feature flag management |
| `forge-runtime-api.ts` | Forge runtime API |
| `holdings.ts` | Holdings fund ops |
| `mcp.ts` | Model Context Protocol endpoints |
| `monte-carlo.ts` | Monte Carlo simulation |
| `onboarding.ts` | Onboarding flows |
| `outcome-graph.ts` | Outcome graph API |
| `proof-chain.ts` | Proof chain / audit trail |
| `reports.ts` | Report generation |
| `rmm/` | RMM (Remote Monitoring & Management) |
| `services.ts` | Service management |
| `streaming-ingestion.ts` | Real-time data ingestion |
| `worldline.ts` | Worldline / timeline |
| `webhooks.ts` | Webhook delivery |
| `observability.ts` | APM / telemetry endpoints |

---

## 5. Database — Schema Domains (lib/db/src/schema/)

The database uses Drizzle ORM with PostgreSQL 16+. Tables are organized into 10 domain namespaces.

| Schema File | Domain | Approximate Table Count |
|---|---|---|
| `auth.ts`, `oidc-auth.ts` | Auth / sessions / OIDC | ~10 |
| `audit.ts`, `audit_chain_events.ts`, `audit_logs.ts` | Audit trail / compliance | ~5 |
| `alloy.ts`, `alloy_ai_decisions.ts`, `alloy_chat.ts`, `alloy_comms.ts`, `alloy_platform.ts` | Alloy workflow engine | ~20 |
| `vessels.ts` | Maritime / fleet | ~30 |
| `firestorm.ts` | Security / SOC | ~20 |
| `terra.ts` | Real estate | ~15 |
| `prism-counsel-core.ts`, `prism_counsel_*.ts` (10+ files) | Legal matter management | ~30 |
| `billing.ts` | Stripe billing | ~10 |
| `connectors.ts`, `data_retention.ts`, `feature_flags.ts` | Platform utilities | ~15 |
| `holdings.ts`, `fund_ops.ts`, `capital_readiness.ts` | Holdings / fund ops | ~15 |
| `carlota_jo.ts`, `carlota_client.ts` | Advisory / CRM | ~10 |
| `consciousness.ts`, `decision_fabric.ts`, `covenant_sim.ts` | AI governance | ~10 |
| `analytics.ts`, `telemetry.ts` | Analytics / observability | ~8 |
| `notifications.ts`, `push_*.ts` | Notification channels | ~8 |
| (+ many more across 150+ schema files) | All domains | **700+ tables total** |

### 5.1 Database Migrations

| File | Purpose |
|---|---|
| `lib/db/migrations/0001_add_tenant_id_to_rag_knowledge_chunks.sql` | Tenant isolation (P0 — resolved Apr 2026) |
| Additional migration files | See `lib/db/migrations/` |

### 5.2 Seed Scripts

| Script | Status | Notes |
|---|---|---|
| `scripts/seed-demo-data.ts` | Working | General platform seed |
| `scripts/seed-demo-canonical.sh` | Working | Canonical demo seed |
| `scripts/seed-pilot-data.ts` | Working | Pilot org seed |
| `scripts/seed-pilot-org.ts` | Working | Pilot organization |
| `scripts/seed-prism-counsel.ts` | **Broken** | Recovery tables seed broken — tracked TD-002 |
| `scripts/seed-marine-extended.ts` | Working | Maritime extended data |
| `scripts/seed-governance.ts` | Working | Governance/audit data |
| `scripts/seed-carlota-clients.ts` | Working | Advisory client data |
| `scripts/seed-holdings-fundops.ts` | Working | Holdings fund operations |
| `scripts/seed-agent-os.ts` | Working | Agent OS data |
| `scripts/seed-audit-logs.ts` | Working | Audit trail seed |
| `scripts/seed-stephen.ts` | Working | Founder identity data |
| `scripts/seed-distribution-os.ts` | Working | Distribution OS seed |
| `scripts/seed-atlas.ts` | Working | Atlas artifact seed |
| `scripts/seed-pilot-data.ts` | Working | Pilot customer data |

---

## 6. CI/CD Workflows (.github/workflows/ — 13 files)

| File | Purpose | Status |
|---|---|---|
| `ci.yml` | Main CI: lint, typecheck, test, build | Active — runs on PRs and main |
| `e2e.yml` | Playwright E2E tests | Active |
| `build.yml` | Build validation | Active |
| `deploy-staging.yml` | Staging deployment | Active |
| `deploy-production.yml` | Production deployment | Active |
| `security.yml` | Security scans (pnpm audit, secret scan) | Active |
| `codeql.yml` | CodeQL SAST analysis | Active — `permissions: {}` top-level deny |
| `dependency-review.yml` | Dependency vulnerability review on PRs | Active |
| `lighthouse.yml` | Lighthouse performance CI | Active |
| `release.yml` | Release workflow | Active |
| `npm-publish.yml` | npm package publish | Active |
| `container-publish.yml` | Docker container publish | Active — `lyte-command-center` entry removed |
| `prism-counsel-ci.yml` | PRISM Counsel-specific CI | Active |

**Note:** All 13 workflows are fully pinned to commit SHAs (verified April 2026). All workflow permissions are least-privilege. See `docs/audit/series-a-gap-register.md` for CI gap details.

---

## 7. Scripts and Automation (scripts/)

| Script / Dir | Purpose |
|---|---|
| `scripts/qa/` | QA automation scripts (smoke-routes, check-links, audit-mocks, audit-routes, post-merge-verify, etc.) |
| `scripts/media/` | Screenshot capture scripts |
| `scripts/rollback/` | Rollback automation |
| `scripts/launch-kit/` | Launch readiness tooling |
| `scripts/github/` | GitHub automation |
| `scripts/public-mirror/` | Public mirror scripts |
| `scripts/seed-*.ts` | Seed data scripts (see Section 5.2) |
| `scripts/generate-screenshots.js` | Screenshot generation |
| `scripts/deploy-mobile.js` | Mobile deployment helper |
| `scripts/backup-db.sh` | Database backup |
| `scripts/post-merge.sh` | Post-merge setup runner |

---

## 8. External / Third-Party Integrations

### 8.1 Live Integrations (active credentials or public API)

| Integration | Purpose | Credential / Config |
|---|---|---|
| OpenAI / Anthropic / Gemini | AI inference (via Replit AI proxy) | `AI_INTEGRATIONS_*` env vars |
| Replit PostgreSQL | Primary database | `DATABASE_URL` |
| Replit Object Storage | File storage | Platform-managed |
| CISA KEV catalog | Live CVE feed | Public API |
| NVD CVE database | Live vulnerability search | Public API |
| MITRE ATT&CK v14 | Live threat intelligence | Public GitHub |
| AbuseIPDB | IP reputation | Public API |
| BLS employment data | Economic intelligence | Public API |
| NYC Open Data (SODA) | Real estate distress pipeline | `SODA_APP_TOKEN` (optional rate-limit token) |
| NOAA CO-OPS | Marine weather data | Public API |
| Open-Meteo | Marine forecast | Public API |
| GDELT | Geopolitical events | Public API |
| World Bank | GDP indicators | Public API |
| GitHub Trending | Tech intelligence feed | Public API |
| HBR RSS | Business intelligence | Public RSS |
| TechCrunch / The Verge RSS | Tech news | Public RSS |
| Microsoft Outlook Calendar | Carlota Jo availability | `MICROSOFT_GRAPH_CLIENT_ID` etc. |

### 8.2 Stub Integrations (configured, no live credentials)

| Integration | Config Vars Needed | Status |
|---|---|---|
| Stripe billing | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Demo mode — no live charges |
| Resend (email) | `RESEND_API_KEY` | Silent drop without key |
| SendGrid (email fallback) | `SENDGRID_API_KEY` | Not canonical email path |
| Mapbox maps | `MAPBOX_ACCESS_TOKEN` | Map views blank without key |
| Sentry error tracking | `SENTRY_DSN` | Errors console-only without key |
| Live AIS provider | `AIS_API_KEY` or `AISHUB_USERNAME` | No subscription — seeded positions |
| Azure AD SSO / SCIM | `AZURE_AD_*` | Code ready; needs tenant consent |
| Redis session store | `AZURE_REDIS_CONNECTION_STRING` or `REDIS_URL` | In-memory fallback |
| Slack bot | `SLACK_BOT_TOKEN` | Disabled without key |
| Twilio SMS | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | Disabled without key |
| DocuSign | `DOCUSIGN_*` | Code ready; no credentials |
| HubSpot | `HUBSPOT_ACCESS_TOKEN` | Stub |
| Azure Document Intelligence | `AZURE_DOC_INTEL_ENDPOINT`, `AZURE_DOC_INTEL_KEY` | Placeholder extraction mode |
| Azure Blob / Redis / KeyVault | `AZURE_*` | Azure deployment only |
| Power Automate webhook | `POWER_AUTOMATE_WEBHOOK_SECRET` | Code ready |
| VAPID web push | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Disabled without keys |

---

## 9. Documentation Suite

### 9.1 Root-Level Documents

| File | Purpose |
|---|---|
| `ARCHITECTURE.md` | Platform architecture reference |
| `KNOWN-GAPS.md` | Known security and operational gaps register |
| `SECURITY.md` | Security policy and responsible disclosure |
| `SECURITY-CHECKLIST.md` | Security control inventory and credential hygiene |
| `SECRETS_SETUP.md` | Developer guide for credential setup and rotation |
| `ENVIRONMENT_VARIABLES.md` | Comprehensive env var reference (this audit) |
| `FULL_SYSTEM_INVENTORY.md` | This document |
| `AUDIT_FINDINGS_REGISTER.md` | Consolidated findings register (this audit) |
| `OUT_OF_SCOPE_REGISTER.md` | Deferred/out-of-scope items (this audit) |
| `LAUNCH_BLOCKERS.md` | Hard and conditional launch blockers |
| `GO_NO_GO_CHECKLIST.md` | Final launch decision checklist |
| `OPERATIONAL_READINESS_SCORECARD.md` | Red/yellow/green readiness scorecard |
| `PUBLIC_LAUNCH_READINESS.md` | Launch bar definitions |
| `EXECUTIVE_LAUNCH_SUMMARY.md` | Leadership and investor summary |
| `ACCESS-CONTROL-MATRIX.md` | Role-permission mapping |
| `replit.md` | Replit workspace configuration and project context |

### 9.2 docs/ Subdirectories

| Directory | Contents |
|---|---|
| `docs/audit/` | Full audit register, gap register, mock/stub register, omega findings, series-a audits |
| `docs/architecture/` | System overview, data flow, platform map, deployment model |
| `docs/internal/` | Operations runbook, env canonical map, baseline gap closure |
| `docs/trust/` | Trust center, security posture, data classification |
| `docs/security/` | Security remediation log, security findings |
| `docs/operations/` | Runbooks, oncall model, incident playbooks |
| `docs/investor/` | Investor readiness, technical due diligence packet |
| `docs/demo/` | Demo scripts, demo data policy |
| `docs/releases/` | Release gates, changelog |
| `docs/mobile/` | Mobile deployment guide |
| `docs/api/` | API spec, API surface docs |
| `docs/observability/` | OTEL, logging, SLOs |
| `docs/integrations/` | Integration-specific guides |
| `infra/docs/` | Azure Bicep IaC documentation |

---

## 10. Infrastructure (infra/)

| Dir/File | Purpose |
|---|---|
| `infra/` | Azure Bicep IaC templates (App Service, PostgreSQL, Key Vault, Redis, CDN) |
| `.github/workflows/` | CI/CD pipeline (see Section 6) |
| `artifact.toml` (per artifact) | Replit artifact registration |
| `.replit` | Replit workspace configuration |
| `pnpm-workspace.yaml` | pnpm workspace definition with catalog |
| `tsconfig.base.json` | Shared TypeScript configuration |
| `playwright.config.ts` | E2E test configuration |
| `vitest.config.ts` | Unit test configuration |
| `vitest.integration.config.ts` | Integration test configuration |
| `vitest.components.config.ts` | Component test configuration |

---

## 11. Tests

| Test Suite | Config | Scope |
|---|---|---|
| Unit tests | `vitest.config.ts` | `lib/` packages — core business logic |
| Integration tests | `vitest.integration.config.ts` | API server routes via supertest |
| Component tests | `vitest.components.config.ts` | React component tests |
| E2E tests | `playwright.config.ts` | Browser-level user flows |
| Atlas tests | `vitest.config.ts` | Scene export lib tests |

**Known gap:** E2E coverage is sparse — mutation/write paths for several apps are not covered (GAP-013).

---

## 12. Feature Flags

Managed via `lib/platform-flags.ts`. Flags control optional integrations:

| Flag | Controls |
|---|---|
| `FEATURE_ALLOY_GOVERNANCE` | Alloy governance flows |
| `FEATURE_ALLOY_ORCHESTRATION` | Alloy workflow orchestration |
| `FEATURE_ALLOY_WEBHOOKS` | Alloy webhook delivery |
| `FEATURE_AUDIT_LOGGING` | Audit logging |
| `AIS_FEED_ENABLED` | Live AIS data feed |
| `LEGAL_FEED_ENABLED` | Legal intelligence feed |
| `SANCTIONS_FEED_ENABLED` | Sanctions list feed |
| `STIX_FEED_ENABLED` | STIX/TAXII threat intel feed |

---

## 13. Cron / Scheduled Jobs

Scheduled jobs are handled via Forge Runtime (`lib/forge-runtime`). No external cron scheduler is configured. Background jobs include:
- Intelligence feed ingestion (CISA, NVD, MITRE, AIS, legal)
- Alloy workflow heartbeat and retry
- Audit log compaction
- Backup jobs (via `scripts/backup-db.sh`)

---

## 14. Governance Primitives (Six)

All platform surfaces share six governance primitives:

| Primitive | Package | Purpose |
|---|---|---|
| Outcome Graph | `lib/outcome-graph` | Business outcome tracking |
| Proof Chain | `lib/proof-chain` | Cryptographic immutable audit trail |
| Covenant Policy | `lib/covenant-policy` | Policy enforcement engine |
| Decision Simulation | `lib/monte-carlo` | Probabilistic risk simulation |
| Workflow Engine | `lib/workflow-engine` (Alloy) | Approval gates and workflow orchestration |
| Event Fabric | `lib/prism-bus` | Cross-domain event bus |

---

---

## Appendix A — Scripted Verification (Reproducible Counts)

The following commands were run against the monorepo on **2026-04-16 21:27 UTC** to produce the numeric assertions in this document. Re-run at any time to verify current state.

```bash
# lib/ directory count
$ ls lib/ | wc -l
40

# lib/ directories with package.json
$ for d in lib/*/; do [ -f "${d}package.json" ] && echo "$d"; done | wc -l
39

# packages/ directory count
$ ls packages/ | wc -l
18

# packages/ directories with package.json (atlassian-connect has none)
$ for d in packages/*/; do [ -f "${d}package.json" ] && echo "$d"; done | wc -l
17

# artifacts/ directory count
$ ls artifacts/ | wc -l
15

# GitHub Actions workflow files
$ ls .github/workflows/*.yml | wc -l
13

# API route .ts files (total, including subdirectories)
$ find artifacts/api-server/src/routes -name "*.ts" | wc -l
225

# API route top-level entries (files + subdirectories)
$ ls artifacts/api-server/src/routes/ | wc -l
189

# .env.example variable count
$ grep "^[A-Z_]" .env.example | grep -v "^#" | cut -d= -f1 | wc -l
175
```

> **Note on .env.example vs ENVIRONMENT_VARIABLES.md:**
> `ENVIRONMENT_VARIABLES.md` documents ~150 variables with descriptions and defaults.
> `.env.example` contains 175 variables — the 25-variable surplus covers:
> build-time constants (`BUILD_VERSION`, `COMMIT_SHA`, `CI`), platform-injected values
> (`REPL_ID`, `REPLIT_DEV_DOMAIN`), and optional overrides that don't require documentation
> entries (SMTP, storage tuning). Every variable in ENVIRONMENT_VARIABLES.md appears in
> `.env.example`; the inverse is not required for read-only/injected vars.

---

*Related: `AUDIT_FINDINGS_REGISTER.md` · `KNOWN-GAPS.md` · `OUT_OF_SCOPE_REGISTER.md` · `ENVIRONMENT_VARIABLES.md` · `SECRETS_SETUP.md`*

*Last verified against source code: 2026-04-16*
