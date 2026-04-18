# Repo Control Tower

Generated: 2026-04-16
Phase: J — Repo Hygiene & Release Discipline

---

## Purpose

A single-page reference for anyone reviewing the repository — investor, engineer, security auditor, or diligence team. Answers: "Is this codebase controlled? Is it real? Is it investable?"

---

## Repository Identity

| Field | Value |
|-------|-------|
| Repo | `szl-holdings-platform` |
| Default branch | `main` |
| Versioning | SemVer (`MAJOR.MINOR.PATCH`) |
| Current version | `v0.1.0` |
| Workspace manager | pnpm workspaces |
| Runtime | Node 24 |
| Language | TypeScript (strict) |

---

## Canonical Artifacts

These are the active, maintained, investor-presentable surfaces:

| Artifact | Path | Kind | Status |
|----------|------|------|--------|
| SZL Holdings | `artifacts/szl-holdings` | Web (public) | CANONICAL |
| Aegis | `artifacts/aegis` | Web (defense UI) | CANONICAL |
| Terra | `artifacts/terra` | Web (real estate) | CANONICAL |
| Vessels | `artifacts/vessels` | Web (maritime) | CANONICAL |
| Carlota Jo | `artifacts/carlota-jo` | Web (advisory) | CANONICAL |
| Command Portal | `artifacts/command` | Web (ops) | CANONICAL |
| API Server | `artifacts/api-server` | Backend | CANONICAL |
| CORTEX Mobile | `artifacts/cortex-mobile` | Mobile (Expo) | CANONICAL-MOBILE |
| SZL Holdings Mobile | `artifacts/szl-holdings-mobile` | Mobile (Expo) | CANONICAL-MOBILE |

---

## Archived / Deferred Surfaces

These artifacts exist in the repo but are not active. Each has an `ARCHIVED.md` or `DEPRECATED.md` notice.

5 archived artifacts — see `ops/frontier/disposition-matrix.md` for full list, paths, and redirect dispositions.

Mockup Sandbox (`artifacts/mockup-sandbox`) is an internal tool, never exposed publicly.

---

## Shared Libraries

**Active (33 packages):**

| Category | Libraries |
|----------|-----------|
| Core | `lib/ai-engine`, `lib/api-zod`, `lib/shared-ui`, `lib/services`, `lib/db` |
| Observability | `lib/observability` |
| Mobile | `lib/mobile-shared`, `lib/offline-engine` |
| Intelligence | `lib/intelligence-feeds`, `lib/forge-runtime` |
| Financial | `lib/monte-carlo` |
| Other | `lib/graphql-client`, `lib/covenant-policy`, `lib/prism-bus`, `lib/mcp-client`, `lib/object-storage-web`, `lib/replit-auth-web`, `lib/analytics`, `lib/api-client-react`, `lib/auth`, `lib/audit`, `lib/config`, `lib/crdt-sync`, `lib/data-connectors`, `lib/i18n`, `lib/outcome-graph`, `lib/proof-chain`, `lib/pulse-evals`, `lib/receipt-graph`, `lib/worldline`, `lib/workflow-engine`, `lib/atlas-artifacts` |

**Shell / evaluate for removal:** `lib/api-spec`, `lib/approvals`

---

## CI/CD Inventory

| Workflow | File | Status | Purpose |
|----------|------|--------|---------|
| CI | `ci.yml` | ACTIVE | Lint, typecheck, test, build — blocks merge |
| CodeQL | `codeql.yml` | ACTIVE | Static security analysis |
| Security | `security.yml` | ACTIVE | Dependency vulnerability scan |
| Dependency Review | `dependency-review.yml` | ACTIVE | PR-level dep review |
| E2E | `e2e.yml` | ACTIVE | Playwright end-to-end |
| Lighthouse | `lighthouse.yml` | ACTIVE | Performance audits |
| Deploy Staging | `deploy-staging.yml` | ACTIVE | Auto-deploy on push to main |
| Deploy Production | `deploy-production.yml` | ACTIVE | Deploy on release publish |
| Container Publish | `container-publish.yml` | ACTIVE | Docker image publishing |
| Release | `release.yml` | ACTIVE | Release automation |
| Deploy (legacy) | `deploy.yml` | DEPRECATED (no-op) | Replaced by deploy-staging/production |
| Legacy archived CI | (see `ops/frontier/current-vs-target-architecture.md`) | ARCHIVED | Deprecated app; triggers disabled |
| npm-publish | `npm-publish.yml` | REVIEW | Confirm needed for pnpm workspace |
| maven-publish, rubygems-publish, nuget-publish | `*.yml` | REVIEW | Likely GitHub template artifacts; confirm if needed |

---

## Branch Protection (Recommended)

These settings should be configured in GitHub Settings > Branches:

- Require PR with 1 reviewer minimum
- Required status checks: `ci / lint`, `ci / typecheck`, `ci / build`, `ci / test`
- Require conversation resolution
- Auto-delete head branches after merge
- Squash merging only

---

## Secret Hygiene Summary

| Category | Status |
|----------|--------|
| Core platform secrets | In Replit Secrets (5/6 confirmed) |
| AI service keys | In Replit Secrets (3/4 confirmed) |
| Auth (Clerk) | In Replit Secrets (3/3 confirmed) |
| External services | Unconfirmed — see `ops/security/secret-inventory.md` |
| Secrets in source code | 0 (none acceptable) |
| Secrets in `.replit` | 0 (only public values in `[userenv.shared]`) |

**Immediate actions:** Confirm `OAUTH_STATE_SECRET` and `VAPID_PRIVATE_KEY` are in Replit Secrets.

---

## Investor Review Checklist

An investor or diligence engineer reviewing this repo can verify:

- [ ] `README.md` — accurate platform description and architecture overview
- [ ] `CHANGELOG.md` — real version history with honest descriptions
- [ ] `SECURITY.md` — responsible disclosure policy
- [ ] `CONTRIBUTING.md` — contribution standards
- [ ] `CODE_OF_CONDUCT.md` — community standards
- [ ] `ops/` — documented operations, security, and release process
- [ ] `.github/workflows/ci.yml` — CI/CD gate with real checks
- [ ] `lib/observability` — telemetry infrastructure in code
- [ ] `ops/benchmark/` — this set of documents

---

## Competitive Repo Quality Benchmarks

### Stripe (Open-Source SDKs)
- Immaculate README with quickstart
- Comprehensive API reference linked from repo
- Every release has detailed changelog with migration guides
- Clean, consistent code style across all packages
- Active issue management with labeled triage

### Vercel (Next.js, Turbo)
- Professional README with badges (build status, coverage, npm version)
- Well-organized monorepo with turborepo orchestration
- Clear contribution guidelines with PR templates
- Active community engagement with responsive maintainers
- Release process documented and automated

### SZL Quality Bar
The SZL repo should be at Stripe SDK quality for investor inspection:
- Every directory has a clear purpose documented in its package.json description
- Every lib package has a README explaining what it does and why it exists
- No orphaned code, abandoned experiments, or dead feature flags
- CI is green on main at all times (no broken-window tolerance)
- Documentation is current — stale docs are worse than no docs
- Commit messages follow conventional format (feat/fix/docs/refactor)
- Release notes are substantive and investor-readable
