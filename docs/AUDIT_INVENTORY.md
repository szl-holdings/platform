# SZL Holdings — Full Workspace Audit Inventory

**Date:** April 22, 2026
**Scope:** Complete monorepo audit — apps, services, packages, APIs, schemas, scripts, infra, tests, docs, generated artifacts, Replit config, GitHub config

---

## 1. Registered Artifacts (Active)

| Artifact | Path | Purpose | Status | Start Command |
|----------|------|---------|--------|---------------|
| SZL Holdings Dashboard | `artifacts/szl-holdings` | Investor/corporate presence + Lyte command surface | Beta | `vite --host` |
| Aegis | `artifacts/aegis` | Security/defense intelligence — SOC, MSP, AI Research | Beta | `vite --host` |
| Vessels | `artifacts/vessels` | Maritime fleet intelligence — AIS, S&P, freight | Partial | `vite --host` |
| Terra | `artifacts/terra` | Real estate intelligence — distress, deals, diligence | Beta | `vite --host` |
| Counsel | `artifacts/counsel` | Legal matter command — filings, recovery, evidence | Beta | `vite --host` |
| Carlota Jo | `artifacts/carlota-jo` | UHNW advisory operations — service catalog, engagement | Beta | `vite --host` |
| Pulse | `artifacts/pulse` | AI executive briefing — live signal synthesis | Beta | `vite --host` |
| Sentra | `artifacts/sentra` | Cyber resilience command | Beta | `vite --host` |
| Unified Command | `artifacts/command` | Cross-domain command surface | Beta | `vite --host` |
| Lyte Command Center | `artifacts/lyte-command-center` | Decision intelligence surface | Beta | `vite --host` |
| API Server | `artifacts/api-server` | Unified backend — all domain routes, auth, jobs | Active | `pnpm dev:fast` |
| CORTEX Mobile | `artifacts/szl-holdings-mobile` | Expo React Native mobile command | Beta | `pnpm dev` |
| SZL Demo Video | `artifacts/szl-demo-video` | Governed Autonomy animated demo | Active | `vite --host` |
| Mockup Sandbox | `artifacts/mockup-sandbox` | Design prototyping sandbox | Internal | `bash start.sh` |

## 2. Unregistered / Dead Artifacts

| Artifact | Path | Size | Disposition |
|----------|------|------|-------------|
| Cortex Mobile (legacy) | `artifacts/cortex-mobile` | 260K | **Archive** — superseded by `szl-holdings-mobile` |
| Imperium | `artifacts/imperium` | 7.5M | **Archive** — cloud sovereignty, archived per Task #920 |
| Counsel (legacy) | `artifacts/prism-counsel` | 9.2M | **Archive** — superseded by `counsel`; legacy API routes retained in api-server |

## 3. Shared Libraries (`lib/`)

41 packages. Key libraries:

| Package | Purpose | Status |
|---------|---------|--------|
| `lib/db` | Drizzle ORM, connection pools, 166 schema files | Active |
| `lib/ai-engine` | AI pipeline, embedding, cognitive learning | Active |
| `lib/auth` | Replit OIDC auth integration | Active |
| `lib/config` | Runtime mode, feature flags, env contract | Active |
| `lib/observability` | OpenTelemetry instrumentation | Active |
| `lib/services` | External service health matrix | Active |
| `lib/shared-ui` | Cross-artifact React component library | Active |
| `lib/proof-chain` | Immutable evidence chain primitives | Active |
| `lib/outcome-graph` | Signal-to-outcome graph types | Active |
| `lib/policy-engine` | Covenant policy evaluation engine | Active |
| `lib/decision-engine` | Decision lifecycle state machine | Active |
| `lib/decision-fabric` | Cross-domain decision correlation | Active |
| `lib/workflow-engine` | Workflow runtime orchestration | Active |
| `lib/intelligence-feeds` | Live external data feed integrations | Active |
| `lib/audit` | Audit event persistence | Active |
| `lib/approvals` | Human approval gate primitives | Active |
| `lib/prism-bus` | Legal domain event bus | Active |
| `lib/covenant-policy` | Policy definition and enforcement | Active |
| `lib/domain-claims` | Tenant-scoped domain claim registry | Active |
| `lib/monte-carlo` | Monte Carlo simulation engine | Active |
| `lib/worldline` | Timeline/scenario modeling | Active |

## 4. Platform Packages (`packages/`)

82 packages. Key packages:

| Package | Purpose |
|---------|---------|
| `packages/env` | Environment variable schema and defaults |
| `packages/config` | Platform registry, claims, feature flags |
| `packages/guardian` | Guardian policy engine |
| `packages/alloy` | Alloy agent runtime |
| `packages/signal-mesh` | Cross-domain signal fabric |
| `packages/trace-graph` | Execution trace graph |
| `packages/memory-fabric` | Agent memory persistence |
| `packages/evidence-ledger` | Evidence chain persistence |
| `packages/platform-metrics-registry` | Auto-generated platform statistics |
| `packages/telemetry-standards` | OpenTelemetry standards |
| `packages/design-system` | Shared design tokens and components |
| `packages/aef-*` (9 packages) | Agent Execution Framework modules |
| `packages/db-*` (4 packages) | Database schema, migrations, repository |

## 5. API Surface

| Metric | Count |
|--------|-------|
| Route files (top-level) | 257 |
| Route files (including subdirectories) | 388 |
| Route handlers (GET/POST/PUT/PATCH/DELETE) | 2,781 |
| Environment variables referenced | 261 unique |
| Database tables (public schema) | 732 |
| Drizzle schema table definitions | 1,084 |

## 6. Database

| Metric | Value |
|--------|-------|
| Engine | PostgreSQL 16 |
| Schema tables | 732 live in `public` |
| Drizzle definitions | 1,084 (includes relations/views) |
| Migration files | 121 consolidated SQL files |
| Applied statements | 1,334 |
| Skipped (idempotent) | 189 |
| Migration errors (non-fatal) | ~12 missing-relation warnings from ordering |

## 7. Tests

| Category | Count |
|----------|-------|
| E2E spec files | 26 |
| Unit test files | ~15 |
| API test files | ~10 |
| Component test files | ~5 |
| Script test files | ~7 |
| Total test files | 63 |

## 8. Documentation

| Metric | Count |
|--------|-------|
| Markdown docs | 651 |
| Screenshots | 20 |
| Audit reports | 45+ |
| Architecture docs | 12+ |
| Trust/security docs | 8+ |

## 9. CI/CD (GitHub Actions)

22 workflow files:

| Workflow | Purpose |
|----------|---------|
| `ci.yml` | Lint + typecheck + build + test |
| `build.yml` | Full artifact build check |
| `security.yml` | Dependency audit + SAST |
| `codeql.yml` | CodeQL semantic analysis |
| `e2e.yml` | Playwright end-to-end tests |
| `release.yml` | Release artifact generation |
| `secret-scan.yml` | Secret detection (push) |
| `secret-scan-scheduled.yml` | Scheduled secret scan |
| `dependency-review.yml` | PR dependency review |
| `a11y.yml` | Accessibility checks |
| `lighthouse.yml` | Performance audit |
| `deploy-production.yml` | Production deployment |
| `deploy-staging.yml` | Staging deployment |
| `backup.yml` | Database backup |
| `uptime-monitor.yml` | Uptime monitoring |
| `audit-full.yml` | Full audit pipeline |
| `container-publish.yml` | Container image publish |
| `npm-publish.yml` | npm package publish |
| `commitlint.yml` | Commit message linting |
| `readme-qa.yml` | README quality assurance |
| `verify-source-of-truth.yml` | Platform facts validation |
| `prism-counsel-ci.yml` | Legacy — should be archived |

## 10. Replit Configuration

| Item | Status |
|------|--------|
| `.replit` | Configured — 14 artifact workflows |
| `replit.nix` | Present — Node.js + PostgreSQL |
| `artifact.toml` | Present per artifact |
| Database | Provisioned, healthy (11ms latency) |
| Auth | Replit OIDC configured |
| Secrets | `VITE_OTEL_ENDPOINT`, `VITE_OTEL_HEADERS` available |

## 11. Known Issues

| Issue | Severity | Status |
|-------|----------|--------|
| Migration ordering — 12 statements fail on missing relations | Medium | Task #2886 |
| 3 dead artifacts consuming 17MB | Low | Archive recommended |
| `prism-counsel-ci.yml` references archived artifact | Low | Remove |
| 261 env vars — no canonical required/optional register | Medium | Partial (`packages/env`) |
| Pool checkout warnings spam logs on startup | Medium | **Fixed this session** — bootstrap unblocked |
| Schema table count (1,084) exceeds live table count (732) — possible orphan definitions | Low | Audit recommended |
