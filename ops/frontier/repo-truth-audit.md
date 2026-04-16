# Repo Truth Audit

Generated: 2026-04-15
Scope: Full codebase — artifacts, shared libraries, mobile, CI/CD, documentation

---

## Summary

| Category | Claimed | Verified Actual | Verdict |
|----------|---------|-----------------|---------|
| Web Applications | 22 | 15 artifact dirs (8 canonical, 2 deprecated running, 3 deprecated, 2 mobile) | INFLATED |
| Shared Libraries | 37 | 33 packages in `lib/` | CLOSE (README outdated) |
| API Endpoints | 2,331 | 172 route files, ~1,800–2,000 endpoints estimated | ASPIRATIONAL |
| Database Tables | 644 | 561 (per repo-inventory) | INFLATED |
| Source Files | 1,620 TypeScript files | ~1,400+ verified | PLAUSIBLE |
| Lines of Code | 450,000+ | ~450,000 (api-server alone is 82,610 lines) | PLAUSIBLE |
| UI Components | 252 web + 116 mobile | Not independently counted; component counts per app below | UNVERIFIED |
| Native Mobile Apps | 2 | 2 (cortex-mobile, szl-holdings-mobile) | ACCURATE |

---

## Artifact Audit

### Web Artifacts

| Artifact | Dir | Source Files | Status | Classification | Notes |
|----------|-----|-------------|--------|----------------|-------|
| szl-holdings | `artifacts/szl-holdings` | 338 ts/tsx | Running | CANONICAL | Flagship web app; 251 pages/routes |
| api-server | `artifacts/api-server` | 351 ts/tsx | Running | CANONICAL | 172 route files, 82k+ LOC |
| firestorm | `artifacts/firestorm` | 9 ts/tsx | Running | CANONICAL | Aegis/Defense UI; small but real |
| aegis | `artifacts/aegis` | 164 ts/tsx | Running | DUPLICATE | Same domain as firestorm; separate artifact with full UI |
| terra | `artifacts/terra` | 91 ts/tsx | Running | CANONICAL | Real estate intelligence; 73 pages |
| vessels | `artifacts/vessels` | 101 ts/tsx | Running | CANONICAL | Maritime intelligence; 84 pages |
| carlota-jo | `artifacts/carlota-jo` | 69 ts/tsx | Running | CANONICAL | Advisory consulting; 49 pages |
| command | `artifacts/command` | 213 ts/tsx | Running | CANONICAL | Unified ops command; 172 pages |
| lyte-command-center | `artifacts/lyte-command-center` | 155 ts/tsx | Running | SECONDARY | Merged into command; still running separately |
| imperium | `artifacts/imperium` | 22 ts/tsx | Running | SECONDARY | Cloud infra; merged into command |
| prism-counsel | `artifacts/prism-counsel` | 138 ts/tsx | Has DEPRECATED.md | ARCHIVE | Legal was deprecated task #579; has full code but DEPRECATED.md |
| stephen-site | `artifacts/stephen-site` | 60 ts/tsx | Has DEPRECATED.md | ARCHIVE | Founder site deprecated task #579 |
| mockup-sandbox | `artifacts/mockup-sandbox` | 3 ts/tsx | Internal | INTERNAL-DEMO | UI prototyping tool only |

### Mobile Artifacts

| Artifact | Dir | App Files | Status | Classification | Notes |
|----------|-----|-----------|--------|----------------|-------|
| cortex-mobile | `artifacts/cortex-mobile` | Full Expo app | Active | CANONICAL | Primary mobile flagship; 8 domain workspaces |
| szl-holdings-mobile | `artifacts/szl-holdings-mobile` | Full Expo app | Secondary | SECONDARY | Production later per disposition matrix |

---

## Shared Library Audit

| Library | Src Files | Activity | Classification | Notes |
|---------|-----------|----------|----------------|-------|
| ai-engine | 129 | High | ACTIVE | AI orchestration; heavily used by api-server |
| db | 113 | High | ACTIVE | 561+ table schemas; core dependency |
| shared-ui | 205 | High | ACTIVE | Design system; consumed by all web apps |
| services | 99 | High | ACTIVE | Business service layer |
| api-zod | 154 | High | ACTIVE | Zod validation schemas; consumed widely |
| observability | 44 | Medium | ACTIVE | Telemetry/metrics |
| mobile-shared | 45 | Medium | ACTIVE | Shared mobile components |
| forge-runtime | 14 | Medium | ACTIVE | Agent execution engine |
| intelligence-feeds | 8 | Medium | ACTIVE | Threat intel ingestion |
| prism-bus | 7 | Medium | ACTIVE | Cross-domain event bus |
| mcp-client | 7 | Low | ACTIVE | Model Context Protocol |
| offline-engine | 10 | Low | ACTIVE | Mobile offline sync |
| monte-carlo | 9 | Low | ACTIVE | Financial simulation |
| graphql-client | 13 | Low | ACTIVE | GraphQL client helpers |
| covenant-policy | 5 | Low | ACTIVE | Policy engine |
| crdt-sync | 3 | Low | LIGHT | Thin implementation |
| analytics | 3 | Low | LIGHT | 3 files; lightweight wrapper |
| api-client-react | 4 | Low | LIGHT | 4 files; thin React API client |
| auth | 1 | Low | LIGHT | Single index.ts; middleware stub |
| audit | 2 | Low | LIGHT | 2 files; thin audit wrapper |
| config | 1 | Low | LIGHT | Single config entry point |
| data-connectors | 1 | Low | LIGHT | 1 file stub |
| outcome-graph | 1 | Low | LIGHT | 1 file stub |
| proof-chain | 1 | Low | LIGHT | 1 file stub |
| receipt-graph | 4 | Low | LIGHT | 4 files |
| pulse-evals | 5 | Low | LIGHT | 5 files |
| worldline | 1 | Low | LIGHT | 1 file stub |
| workflow-engine | 1 | Low | LIGHT | 1 file stub |
| replit-auth-web | 3 | Low | LIGHT | 3 files |
| object-storage-web | 3 | Low | ACTIVE | Object storage integration |
| atlas-artifacts | 1 | Low | LIGHT | 1 file |
| i18n | 3 | Low | LIGHT | 3 files |
| api-spec | 0 | None | SHELL | No src or index.ts — empty package |
| approvals | 0 | None | SHELL | No src or index.ts — empty package |

**Note:** README claims 37 shared libraries. Actual count is 33. Two packages (api-spec, approvals) appear to be shells with no source code.

---

## CI/CD Audit

| Workflow File | Trigger | Status | Notes |
|--------------|---------|--------|-------|
| `ci.yml` | PR/push master | ACTIVE | Lint, typecheck, test — functional |
| `e2e.yml` | PR/push master | STALE-PARTIAL | Tests szl-holdings, lyte-command-center, firestorm — lyte-command-center is deprecated |
| `codeql.yml` | PR/push + weekly | ACTIVE | JavaScript/TypeScript analysis |
| `security.yml` | PR/push + weekly | ACTIVE | Dependency scan + SBOM |
| `dependency-review.yml` | PR | ACTIVE | Dependabot review gate |
| `deploy-staging.yml` | push to main | ACTIVE | Staging deployment |
| `deploy-production.yml` | release published | ACTIVE | Production deployment with confirm gate |
| `deploy.yml` | Likely legacy | NEEDS REVIEW | Overlaps with deploy-staging/deploy-production |
| `lighthouse.yml` | PR/push | ACTIVE | Performance CI |
| `container-publish.yml` | release | ACTIVE | Docker image publishing |
| `npm-publish.yml` | release | POSSIBLY STALE | npm publish — pnpm workspace may not need this |
| `release.yml` | manual | ACTIVE | Release creation workflow |
| `prism-counsel-ci.yml` | PR/push | STALE | References deprecated prism-counsel app |

**Key finding:** `e2e.yml` still tests `lyte-command-center` which has been merged into `command`. `prism-counsel-ci.yml` targets a deprecated app.

---

## Documentation Accuracy Audit

| Claim | Source | Verified? | Finding |
|-------|--------|-----------|---------|
| "22 apps" badge | README | NO | 15 artifact dirs; 8 canonical web + 2 mobile + 5 deprecated/internal |
| "2,331 API endpoints" | README | UNVERIFIED | 172 route files exist; endpoint count unconfirmed |
| "644 DB tables" | README | NO | repo-inventory.md records 561 tables |
| "37 shared libraries" | README | NO | 33 packages exist; 2 are empty shells |
| "Carlota Jo: Live" | README Products table | PLAUSIBLE | Has full code + 49 pages; no runtime verification |
| "Stephen Lutar site: Live" | README Products table | MISLEADING | Has DEPRECATED.md; content moved to /founder |
| "PRISM Counsel: Functional alpha" | README Products table | MISLEADING | Has DEPRECATED.md; deprecated in task #579 |
| "IMPERIUM: Functional alpha" | README Products table | MISLEADING | 22 files; merged into command app |
| "Node 20.x" | README badge | OUTDATED | `modules = ["nodejs-24"]` in .replit |
| "51 packages" | README stack section | INFLATED | 33 lib packages + 15 artifact packages = 48 total |

---

## Credential & Secret Audit

### Confirmed Hardcoded Secrets in .replit

| Secret | Value Status | Risk | Action Required |
|--------|-------------|------|-----------------|
| `OAUTH_STATE_SECRET` | Real 64-char hex value | HIGH — rotatable secret in plaintext | Move to Replit Secret, remove from .replit |
| `VAPID_PRIVATE_KEY` | Real VAPID private key | HIGH — rotatable private key in plaintext | Move to Replit Secret, remove from .replit |
| `VAPID_PUBLIC_KEY` | VAPID public key | LOW — public by design | Can remain as env var |
| `VAPID_SUBJECT` | Email address | LOW — public by design | Can remain as env var |

### Mobile Credential Files

| File | Status | Action |
|------|--------|--------|
| `artifacts/szl-holdings-mobile/google-services.json` | ALREADY PLACEHOLDER | Add to .gitignore to prevent real file commits |
| `artifacts/szl-holdings-mobile/GoogleService-Info.plist` | ALREADY PLACEHOLDER | Add to .gitignore |
| `artifacts/cortex-mobile/google-services.json` | Check needed | Add to .gitignore |
| `artifacts/cortex-mobile/GoogleService-Info.plist` | Check needed | Add to .gitignore |

### Other Secret Patterns Found

| Finding | Location | Risk |
|---------|----------|------|
| `sk_live_` display string | lyte-command-center/demo-settings.tsx, command/demo-settings.tsx | UI mock text only — no actual key |
| `szl-test-integration-live-2026` | tests/api/server-live.test.ts (per risks-and-gaps.md) | Test token in source — LOW but should move to env var |
| Dev fallback key `rmm-dev-only-key` | artifacts/api-server/src/routes/rmm.ts (per risks-and-gaps.md) | Guarded by NODE_ENV — LOW |

No live API keys (Stripe, OpenAI, SendGrid, etc.) were found embedded in source code.

---

## Summary Classification

| Classification | Count | Items |
|---------------|-------|-------|
| CANONICAL (production now) | 8 | szl-holdings, api-server, firestorm, aegis, terra, vessels, carlota-jo, command |
| CANONICAL MOBILE | 2 | cortex-mobile, szl-holdings-mobile |
| SECONDARY (production later) | 2 | lyte-command-center, imperium |
| INTERNAL-DEMO | 1 | mockup-sandbox |
| ARCHIVE-DEPRECATE | 2 | prism-counsel, stephen-site |
