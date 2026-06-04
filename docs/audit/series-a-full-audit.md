# Series A Full Audit — Complete Inventory

**Date:** April 16, 2026  
**Auditor:** Platform Engineering  
**Scope:** Full SZL Holdings monorepo — artifacts, shared libraries, packages, workflows, external integrations, and operational documentation  
**Status:** AUTHORITATIVE — supersedes all prior partial inventories

---

## Table 1 — Deployable Artifacts (15 total)

### 1A — Active Web Artifacts (Registered via per-artifact `.replit-artifact/artifact.toml`)

> **How artifacts are registered:** Each artifact has a `.replit-artifact/artifact.toml` file in its directory (e.g., `artifacts/szl-holdings/.replit-artifact/artifact.toml`). The top-level `.replit` `[[artifacts]]` block explicitly lists only `api-server` and `mockup-sandbox`; all other web artifacts are registered via their per-directory config. All 7 web artifacts below are confirmed registered in the Replit platform (plus 1 mobile and 1 internal artifact in sections 1B and 1C).

| Artifact | Path | Purpose | Maturity | Auth | Data Mode | Owner |
|----------|------|---------|----------|------|-----------|-------|
| `szl-holdings` | `/` | Corporate site, investor hub, trust center, Decision Theater, legal pages | Production-ready | Public + OIDC (investor portal) | Real + illustrative content | Platform |
| `api-server` | `/api/` | REST, GraphQL, WebSocket backend for all domain packs | Production-ready | OIDC/PKCE session-based | Real PostgreSQL | Platform |
| `command` | `/command/` | Unified ops command center (absorbed Lyte + IMPERIUM) | Production-ready | OIDC required | Real API + real DB | Platform |
| `aegis` | `/aegis/` | Defense & security intelligence platform | Production-ready | OIDC required | Real structured data | Platform |
| `vessels` | `/vessels/` | Maritime fleet command and intelligence | Production-ready | OIDC required | Real structured data (simulated AIS) | Platform |
| `terra` | `/terra/` | Real estate intelligence and deal management | Production-ready | OIDC required | Real structured data + NYC Open Data | Platform |
| `carlota-jo` | `/carlota-jo/` | Premium advisory and case management | Production-ready | OIDC required | Real structured data | Platform |

### 1B — Active Mobile Artifacts

| Artifact | Preview | Purpose | Maturity | Auth | Data Mode | Owner |
|----------|---------|---------|----------|------|-----------|-------|
| `szl-holdings-mobile` | Expo tunnel | CORTEX unified mobile command (iOS/Android) | Beta | OIDC required | Real API | Platform |

### 1C — Active Internal/Tooling Artifacts

| Artifact | Preview | Purpose | Maturity | Auth | Data Mode |
|----------|---------|---------|----------|------|-----------|
| `mockup-sandbox` | `/__mockup` | Design system component preview | Internal dev tool | None (internal) | Static |

### 1D — Deprecated / Archived Artifacts

| Artifact | Status | Notes | Deployment Mode |
|----------|--------|-------|----------------|
| `firestorm` | Archived — content in Aegis | DEPRECATED.md present; Aegis is canonical successor | Not deployed |
| `lyte-command-center` | Archived — content in Command | Legacy build dist present; no active source | Not deployed |
| `imperium` | Skeleton — never built | Only node_modules, no source | Not deployed |
| `prism-counsel` | Archived | Legal matter management; deregistered | Not deployed |
| `stephen-site` | Deprecated | Founder profile moved to `/founder` in szl-holdings | Not deployed |

### 1E — Unscaffolded / In-Progress Artifact Directories

| Artifact | Status | Notes |
|----------|--------|-------|
| `cortex-mobile` | Active development, unregistered | Expo config present; separate from szl-holdings-mobile |

---

## Table 2 — Shared Libraries (lib/ — 34 directories, 33 with package.json)

| Library | Package Name | Purpose | Has Tests |
|---------|-------------|---------|-----------|
| `lib/ai-engine` | `@szl-holdings/ai-engine` | OpenAI / Anthropic / Gemini provider wrappers, eval hooks, trace capture | Partial |
| `lib/analytics` | `@szl-holdings/analytics` | Event tracking | Partial |
| `lib/api-client-react` | `@szl-holdings/api-client-react` | React query client hooks | Partial |
| `lib/api-spec` | `@szl-holdings/api-spec` | OpenAPI spec definitions | No |
| `lib/api-zod` | `@szl-holdings/api-zod` | Zod schemas for API validation | Partial |
| `lib/atlas-artifacts` | `@szl-holdings/atlas-artifacts` | Artifact registration and metadata | No |
| `lib/audit` | `@szl-holdings/audit` | Immutable audit trail and event log | Partial |
| `lib/auth` | `@szl-holdings/auth` | Auth types and shared utilities | No |
| `lib/config` | `@szl-holdings/config` | Platform-wide constants, app registry, roles | No |
| `lib/covenant-policy` | `@szl-holdings/covenant-policy` | Policy enforcement and compliance | Partial |
| `lib/crdt-sync` | `@szl-holdings/crdt-sync` | CRDT-based real-time sync | No |
| `lib/data-connectors` | `@szl-holdings/data-connectors` | External data source connector framework | No |
| `lib/db` | `@szl-holdings/db` | Drizzle ORM schema (569 tables, 116 files), PostgreSQL client | No |
| `lib/forge-runtime` | `@szl-holdings/forge-runtime` | Alloy workflow execution engine internals | Partial |
| `lib/graphql-client` | `@szl-holdings/graphql-client` | GraphQL client layer | No |
| `lib/i18n` | `@szl-holdings/i18n` | Internationalization framework | No |
| `lib/intelligence-feeds` | `@szl-holdings/intelligence-feeds` | External threat/data feed connectors | No |
| `lib/mcp-client` | `@szl-holdings/mcp-client` | MCP Gateway client | No |
| `lib/mobile-shared` | `@szl-holdings/mobile-shared` | Shared mobile components | No |
| `lib/monte-carlo` | `@szl-holdings/monte-carlo` | Probabilistic risk simulation | Partial |
| `lib/object-storage-web` | `@szl-holdings/object-storage-web` | Replit GCS-backed object storage client | No |
| `lib/observability` | `@szl-holdings/observability` | OTEL setup, observability middleware | No |
| `lib/offline-engine` | `@szl-holdings/offline-engine` | Offline-capable data sync | No |
| `lib/outcome-graph` | `@szl-holdings/outcome-graph` | Decision lifecycle graph | Partial |
| `lib/proof-chain` | `@szl-holdings/proof-chain` | Immutable proof trail | Partial |
| `lib/prism-bus` | `@szl-holdings/prism-bus` | Cross-domain event bus | Partial |
| `lib/pulse-evals` | `@szl-holdings/pulse-evals` | AI evaluation pipeline | No |
| `lib/receipt-graph` | `@szl-holdings/receipt-graph` | Transaction receipt graph | No |
| `lib/replit-auth-web` | `@szl-holdings/replit-auth-web` | Replit Auth OIDC/PKCE web client | No |
| `lib/services` | `@szl-holdings/services` | Domain service layer (all 8 domains) | Partial |
| `lib/shared-ui` | `@szl-holdings/shared-ui` | Design system components, tokens, Tailwind config | Partial |
| `lib/workflow-engine` | `@szl-holdings/workflow-engine` | Workflow orchestration API | Partial |
| `lib/worldline` | `@szl-holdings/worldline` | Payment and transaction processing | No |
| `lib/approvals` | `@szl-holdings/approvals` | Approval gate management | No |

---

## Table 3 — Platform Packages (packages/ — 15 directories, 14 with package.json)

> **Methodology:** `ls packages/` returns 15 directories; 14 have a `package.json`. `packages/atlassian-connect/` is a stub with no package.json (no published package).

### 3A — Business Observability Fabric (3 packages)

| Package | Name | Purpose |
|---------|------|---------|
| `packages/observability-core` | `@szl-holdings/observability-core` | OTEL setup, AsyncLocalStorage, correlation ID, Express middleware |
| `packages/business-events` | `@szl-holdings/business-events` | Typed ATLAS event emitters (11 event classes), domain KPI adapters |
| `packages/telemetry-standards` | `@szl-holdings/telemetry-standards` | GenAI semantic conventions, business/HTTP attribute contracts |

### 3B — ATLAS Enterprise State Model (3 packages)

| Package | Name | Purpose |
|---------|------|---------|
| `packages/atlas-core` | `@szl-holdings/atlas-core` | Full ATLAS schema: 14 primitive + 6 domain types with Zod validation |
| `packages/atlas-types` | `@szl-holdings/atlas-types` | Convenience re-exports of all ATLAS TypeScript types |
| `packages/atlas-events` | `@szl-holdings/atlas-events` | 100+ named events + event envelope contract |

### 3C — AI Control Plane & NVIDIA-Ready (5 packages)

| Package | Name | Purpose |
|---------|------|---------|
| `packages/ai-control-plane` | `@szl-holdings/ai-control-plane` | Model routing, eval selection, fallback, cost controls, PII redactor |
| `packages/prompt-registry` | `@szl-holdings/prompt-registry` | Versioned prompt management with A/B comparison |
| `packages/tool-registry` | `@szl-holdings/tool-registry` | Tool management with approval classes, MCP bridging, audit trail |
| `packages/nvidia-adapters` | `@szl-holdings/nvidia-adapters` | NVIDIA NIM endpoint adapter, NeMo eval hooks, agent profiler |
| `packages/openusd-export` | `@szl-holdings/openusd-export` | OpenUSD digital twin export (Vessels, Terra, Aegis) |

### 3D — Policy and Decision Engines (3 packages)

| Package | Name | Purpose |
|---------|------|---------|
| `packages/policy-engine` | `@szl-holdings/policy-engine` | Policy rule evaluation and enforcement |
| `packages/decision-engine` | `@szl-holdings/decision-engine` | Decision scoring and recommendation engine |
| `packages/action-engine` | `@szl-holdings/action-engine` | Action execution and attribution tracking |

### 3E — Integration Stubs / No Package (1 directory)

| Directory | Status | Notes |
|-----------|--------|-------|
| `packages/atlassian-connect` | No `package.json` — stub directory | Atlassian Connect integration placeholder; not published |

---

## Table 4 — External Integrations

| Integration | Purpose | Auth Method | Status | Required For |
|-------------|---------|-------------|--------|-------------|
| **Replit Auth (OIDC)** | Platform authentication | OIDC/PKCE | ✅ Active | All auth |
| **Replit PostgreSQL** | Primary database | Connection string | ✅ Active | All data |
| **Replit Object Storage** | File/asset storage | Bucket ID | ⚠️ Optional | File uploads |
| **Replit AI Proxy (OpenAI)** | GPT-4o and variants | API key via proxy | ✅ Active | AI features |
| **Replit AI Proxy (Anthropic)** | Claude variants | API key via proxy | ✅ Active | AI features |
| **Replit AI Proxy (Gemini)** | Gemini variants | API key via proxy | ✅ Active | AI features |
| **GitHub (integration)** | Repo access, Actions | GitHub App token | ✅ Active | CI/CD, dev workflow |
| **Stripe** | Payment processing | Secret key | ⚠️ Demo mode | Billing |
| **Resend** | Transactional email | API key | ⚠️ Optional | Email delivery |
| **HuggingFace** | Optional AI inference | API key | ⚠️ Optional | AI fallback |
| **ElevenLabs** | Voice synthesis | API key | ⚠️ Optional | Voice features |
| **Twilio** | SMS notifications | API key | ⚠️ Optional | SMS |
| **SendGrid** | Email (alternate) | API key | ⚠️ Optional | Email fallback |
| **Slack** | Team notifications | Webhook URL | ⚠️ Optional | Alerts |
| **MarineTraffic** | AIS vessel data | API key | ⚠️ External | Vessels live AIS |
| **AISHub** | AIS vessel data | API key | ⚠️ External | Vessels live AIS |
| **Shodan** | Network threat intel | API key | ⚠️ External | Aegis threat feeds |
| **GreyNoise** | IP reputation | API key | ⚠️ External | Aegis threat feeds |
| **AlienVault OTX** | OSINT threat feeds | API key | ⚠️ External | Aegis threat feeds |
| **CISA KEV** | Known exploited vulns | Public API | ✅ Public | Aegis |
| **NVD CVE** | CVE database | Public API | ✅ Public | Aegis |
| **MITRE ATT&CK** | Attack framework | Public API | ✅ Public | Aegis |
| **OFAC SDN** | Sanctions list | Public API | ✅ Public | Compliance |
| **CourtListener** | Legal case data | REST API | ⚠️ External | Carlota Jo |
| **SEC EDGAR** | Financial filings | Public API | ✅ Public | Analytics |
| **NYC Open Data** | Real estate data | Public API | ✅ Public | Terra |
| **Figma** | Design system | API key | ⚠️ Optional | Design workflow |
| **HubSpot** | CRM | API key | ⚠️ Optional | Sales operations |
| **Google APIs** | Maps, Drive | API key | ⚠️ Optional | Maps, documents |
| **Azure AD / Entra ID** | Enterprise SSO, SCIM | Admin consent | ⚠️ Enterprise | Multi-tenant |
| **Azure Power BI** | Embedded analytics | Workspace token | ⚠️ Enterprise | Tenant analytics |

---

## Table 5 — GitHub Actions Workflows (13 total)

| Workflow File | Trigger | Purpose | Status |
|---------------|---------|---------|--------|
| `ci.yml` | PR + push to main | Lint, typecheck, test, build, integration tests | ✅ Active, all actions SHA-pinned |
| `e2e.yml` | PR + push to main | Playwright E2E + axe-core a11y | ✅ Active, all actions SHA-pinned |
| `build.yml` | Push to main | Full artifact build check | ✅ Active, all actions SHA-pinned |
| `deploy-staging.yml` | Push to main | Staging deployment to Replit | ✅ Active — gracefully skips if `REPLIT_STAGING_DEPLOY_TOKEN` unset |
| `deploy-production.yml` | Release published / manual | Production deployment to Replit | ✅ Active — requires "deploy" confirmation for manual dispatch |
| `security.yml` | Push, PR, weekly | Dependency scan, SBOM generation, secret scan | ✅ Active |
| `codeql.yml` | Push, PR, weekly | CodeQL static analysis (JS/TS) | ✅ Active, `permissions: {}` deny-by-default |
| `dependency-review.yml` | PRs only | Block high-severity deps and forbidden licenses (GPL-3.0, AGPL-3.0) | ✅ Active |
| `lighthouse.yml` | PR + push to main | Lighthouse CI performance scoring per artifact | ✅ Active |
| `release.yml` | Push to main / manual | Semantic versioning + GitHub Release creation | ✅ Active |
| `npm-publish.yml` | Release published + tags | Publish lib packages to GitHub Packages | ✅ Active — intentional |
| `container-publish.yml` | Release published + tags | Build and push container images to GHCR | ⚠️ Active — matrix includes `lyte-command-center` (archived; no Dockerfile; will fail for that entry) |
| `prism-counsel-ci.yml` | Manual (`workflow_dispatch`) only | ARCHIVED — PRISM Counsel CI/CD | 🗄️ Archived — disabled from automatic triggers; runs archived-notice job only |

**Notes:**
- All 13 workflows have third-party actions pinned to immutable commit SHAs.
- No `maven-publish.yml`, `nuget-publish.yml`, or `rubygems-publish.yml` exist in this repo — confirmed absent.
- `prism-counsel-ci.yml` is explicitly documented as archived in its header comment. No security concern.

---

## Table 6 — Operational Documentation

### Canonical (Current, Authoritative)

| Document | Path | Status |
|----------|------|--------|
| Monorepo architecture reference | `replit.md` | ✅ Canonical — updated continuously |
| Deployment model | `docs/architecture/canonical-deployment-model.md` | ✅ Canonical — new (this audit) |
| Product surface map | `docs/architecture/canonical-product-surface.md` | ✅ Canonical — new (this audit) |
| Environment model | `docs/operations/canonical-environment-model.md` | ✅ Canonical — new (this audit) |
| Trust surface policy | `docs/trust/trust-surface-policy.md` | ✅ Canonical — new (this audit) |
| Secrets policy | `docs/SECRETS_POLICY.md` | ✅ Canonical |
| Secrets remediation | `docs/security/secrets-remediation.md` | ✅ Canonical — new (this audit) |
| Replit operations guide | `REPLIT_OPERATIONS.md` | ✅ Canonical (minor stale Azure references — tracked in gap register) |
| Security baseline | `docs/SECURITY_BASELINE.md` | ✅ Canonical |
| Known gaps | `docs/known-gaps.md` | ✅ Canonical |
| Platform inventory | `docs/audit/platform-inventory.md` | ✅ Canonical (this audit document supersedes it) |
| Security findings | `docs/audit/security-findings.md` | ✅ Canonical |
| Security remediation log | `docs/audit/security-remediation-log.md` | ✅ Canonical |
| Contributing guide | `CONTRIBUTING.md` | ✅ Canonical |
| Secrets setup | `SECRETS_SETUP.md` | ✅ Canonical |
| Release checklist | `RELEASE_CHECKLIST.md` | ✅ Canonical |
| QA summary | `QA_SUMMARY.md` | ✅ Canonical |
| Navigation strategy | `NAVIGATION_STRATEGY.md` | ✅ Canonical |
| Route inventory | `ROUTE_INVENTORY.md` | ✅ Canonical |
| Operations runbook | `OPERATIONS-RUNBOOK.md` | ✅ Canonical |

### Superseded / Deprecated (Retain for History — Do Not Update)

| Document | Path | Issue | Action |
|----------|------|-------|--------|
| Deployment readiness | `DEPLOYMENT_READINESS.md` | Superseded — already marked deprecated | Retain, do not update |
| Deployment guide | `DEPLOYMENT-GUIDE.md` | Contains Azure deployment procedures that are no longer primary | Review in Wave 3–4 |
| Deployment model | `docs/DEPLOYMENT_MODEL.md` | May contain pre-decision Replit vs Azure ambiguity | Review in Wave 3–4 |
| Production readiness | `docs/production-readiness.md` | Section 2 references Azure App Service; otherwise mostly current | Update Azure reference in Wave 3–4 |
| Omega audit findings | `docs/audit/omega-audit-findings.md` | Prior audit — correct but now superseded by this document | Archive |
| GitHub mirror policy | `docs/github-mirror-policy.md` | Mirror policy is aspirational — no mirror currently active | Clarify in Wave 3–4 |
| REPLIT_OPERATIONS.md release section | `REPLIT_OPERATIONS.md` | "Deploy via Azure Bicep templates" is stale | Fix in Wave 3–4 |

### Investor / Buyer Facing

| Document | Path | Status |
|----------|------|--------|
| Production readiness package | `docs/production-readiness.md` | Current but has minor Azure ref |
| Technical due diligence packet | `docs/TECHNICAL_DUE_DILIGENCE_PACKET.md` | Current |
| Executive summary | `docs/FOUNDER_EXEC_SUMMARY.md` | Current |
| Investor readiness | `docs/investor-readiness.md` | Current |
| Launch readiness scorecard | `docs/LAUNCH_READINESS_SCORECARD.md` | Current |
| GA/Beta internal status | `docs/GA_BETA_INTERNAL_STATUS.md` | Current |
| Open risks | `docs/OPEN_RISKS_AND_NEXT_10.md` | Current |

---

## Table 7 — Database Schema Summary

| Metric | Value |
|--------|-------|
| Total tables | 569 |
| Schema files | 116 (in `lib/db/src/schema/`) |
| ORM | Drizzle ORM 0.45.1 |
| Database | PostgreSQL 16 |
| Migration strategy | `drizzle-kit push` with `--force` flag |
| Seeding | `scripts/seed-demo-canonical.sh` — idempotent, uses `onConflictDoNothing()` |

---

_This document is the foundational Series A audit artifact. For gap analysis see `docs/audit/series-a-gap-register.md`. For out-of-scope items see `docs/audit/series-a-out-of-scope-register.md`._
