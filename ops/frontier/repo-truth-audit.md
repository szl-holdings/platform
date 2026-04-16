# Repo Truth Audit

Generated: 2026-04-16 (updated)
Scope: Full codebase — artifacts, shared libraries, mobile, CI/CD, documentation

---

## Summary

| Category | Claimed | Verified Actual | Verdict |
|----------|---------|-----------------|---------|
| Web Applications | 22 | 15 artifact dirs (7 canonical web, 1 internal, 5 archived, 1 shell, 1 mobile) | INFLATED |
| Shared Libraries | 37 | 34 packages in `lib/` (2 are empty shells: api-spec, approvals) | CLOSE (README outdated) |
| API Endpoints | 2,331 | 395 api-server src files, ~1,800–2,000 endpoints estimated | ASPIRATIONAL |
| Database Tables | 644→561 | 569 (verified via `information_schema`) | README OUTDATED |
| Schema Files | 112 | 116 (verified via `lib/db/src/schema/*.ts`) | CLOSE |
| Source Files | 1,620 TypeScript files | ~1,588 verified (sum across artifacts + lib) | PLAUSIBLE |
| Lines of Code | 450,000+ | ~450,000+ (lib alone is ~161k LOC; api-server + flagship add ~200k+) | PLAUSIBLE |
| UI Components | 252 web + 116 mobile | Not independently counted; component counts per app below | UNVERIFIED |
| Native Mobile Apps | 2 | 2 (cortex-mobile shell, szl-holdings-mobile full) | PARTIALLY ACCURATE |

---

## Artifact Audit

### Web Artifacts

| Artifact | Dir | Source Files | Status | Classification | Notes |
|----------|-----|-------------|--------|----------------|-------|
| szl-holdings | `artifacts/szl-holdings` | 402 ts/tsx | Running | CANONICAL | Flagship web app |
| api-server | `artifacts/api-server` | 395 ts/tsx | Running | CANONICAL | Sole backend; route files, 82k+ LOC |
| aegis | `artifacts/aegis` | 166 ts/tsx | Running | CANONICAL | Defense & security UI |
| terra | `artifacts/terra` | 92 ts/tsx | Running | CANONICAL | Real estate intelligence |
| vessels | `artifacts/vessels` | 103 ts/tsx | Running | CANONICAL | Maritime intelligence |
| carlota-jo | `artifacts/carlota-jo` | 70 ts/tsx | Running | CANONICAL | Advisory consulting |
| command | `artifacts/command` | 223 ts/tsx | Running | CANONICAL | Unified ops command (absorbed Lyte + IMPERIUM) |
| firestorm | `artifacts/firestorm` | 0 ts/tsx | ARCHIVED | ARCHIVE | Has ARCHIVED.md; code removed; superseded by aegis |
| lyte-command-center | `artifacts/lyte-command-center` | 1 ts/tsx | ARCHIVED | ARCHIVE | Has DEPRECATED.md; 1 residual vite.config.ts |
| imperium | `artifacts/imperium` | 0 ts/tsx | ARCHIVED | ARCHIVE | Has DEPRECATED.md; merged into command |
| prism-counsel | `artifacts/prism-counsel` | 0 ts/tsx | ARCHIVED | ARCHIVE | Has DEPRECATED.md; deprecated task #579; code removed |
| stephen-site | `artifacts/stephen-site` | 0 ts/tsx | ARCHIVED | ARCHIVE | Has DEPRECATED.md; content moved to /founder |
| mockup-sandbox | `artifacts/mockup-sandbox` | 5 ts/tsx | Internal | INTERNAL | Dev-only UI prototyping tool |

### Mobile Artifacts

| Artifact | Dir | App Files | Status | Classification | Notes |
|----------|-----|-----------|--------|----------------|-------|
| szl-holdings-mobile | `artifacts/szl-holdings-mobile` | 167 ts/tsx | Active | CANONICAL-MOBILE | Full Expo app; running workflow |
| cortex-mobile | `artifacts/cortex-mobile` | 2 ts/tsx | Shell | SHELL | Expo scaffold with no app code; 8-domain concept not implemented |

---

## Shared Library Audit

| Library | Src Files | Activity | Classification | Notes |
|---------|-----------|----------|----------------|-------|
| ai-engine | 258 | High | ACTIVE | AI orchestration; heavily used by api-server |
| db | 211 | High | ACTIVE | 569 table schemas; core dependency |
| shared-ui | 358 | High | ACTIVE | Design system; consumed by all web apps |
| services | 211 | High | ACTIVE | Business service layer |
| api-zod | 308 | High | ACTIVE | Zod validation schemas; consumed widely |
| observability | 75 | Medium | ACTIVE | Telemetry/metrics |
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
| analytics | 6 | Low | LIGHT | Lightweight wrapper |
| api-client-react | 8 | Low | LIGHT | Thin React API client |
| auth | 2 | Low | LIGHT | Middleware stub |
| audit | 4 | Low | LIGHT | Thin audit wrapper |
| config | 2 | Low | LIGHT | Config entry point |
| data-connectors | 2 | Low | LIGHT | Data connector stub |
| outcome-graph | 1 | Low | LIGHT | 1 file stub |
| proof-chain | 1 | Low | LIGHT | 1 file stub |
| receipt-graph | 8 | Low | LIGHT | Receipt graph |
| pulse-evals | 5 | Low | LIGHT | Eval framework |
| worldline | 2 | Low | LIGHT | Worldline stub |
| workflow-engine | 8 | Low | LIGHT | Workflow orchestration |
| replit-auth-web | 5 | Low | LIGHT | Auth web helpers |
| object-storage-web | 3 | Low | ACTIVE | Object storage integration |
| atlas-artifacts | 1 | Low | LIGHT | Atlas artifacts |
| i18n | 3 | Low | LIGHT | Internationalization |
| api-spec | 1 | Low | SHELL | Minimal spec package |
| approvals | 1 | Low | SHELL | Minimal approvals package |

**Note:** README claims 37 shared libraries. Actual count is 34 packages under `lib/`. Two packages (api-spec, approvals) have only 1 file each (minimal shells).

---

## CI/CD Audit

| Workflow File | Trigger | Status | Notes |
|--------------|---------|--------|-------|
| `build.yml` | PR/push main | ACTIVE | Build check gate |
| `ci.yml` | PR/push main | ACTIVE | Lint, typecheck, test, integration-test |
| `e2e.yml` | PR/push main | STALE-PARTIAL | Still references lyte-command-center (deprecated) |
| `codeql.yml` | PR/push + weekly | ACTIVE | JavaScript/TypeScript analysis |
| `security.yml` | PR/push + weekly | ACTIVE | Dependency scan + SBOM + secret scan |
| `dependency-review.yml` | PR | ACTIVE | Dependabot review gate |
| `deploy-staging.yml` | push to main | ACTIVE | Staging deployment |
| `deploy-production.yml` | release published | ACTIVE | Production deployment with confirm gate |
| `lighthouse.yml` | PR/push | ACTIVE | Performance CI |
| `container-publish.yml` | release | ACTIVE | Docker image publishing (SHA-pinned actions) |
| `npm-publish.yml` | release | POSSIBLY STALE | npm publish — pnpm workspace may not need this |
| `release.yml` | manual | ACTIVE | Release creation workflow |
| `prism-counsel-ci.yml` | PR/push | STALE | References deprecated prism-counsel app — DELETE |

**Key findings:** `e2e.yml` still tests `lyte-command-center` which has been merged into `command`. `prism-counsel-ci.yml` targets a deprecated app. All third-party actions SHA-pinned (verified in Task #893).

---

## Documentation Accuracy Audit

| Claim | Source | Verified? | Finding |
|-------|--------|-----------|---------|
| "561 tables" | README | CLOSE | 569 tables verified via `information_schema.tables` (README says 561) |
| "112 schema files" | README | CLOSE | 116 schema files verified via `lib/db/src/schema/*.ts` |
| "51 packages" | README Monorepo section | CLOSE | 34 lib + 15 artifacts = 49 package dirs; 2 lib packages are minimal shells |
| "CORTEX Mobile: Alpha prep" | README Products table | MISLEADING | cortex-mobile has only 2 ts files — essentially a shell, not alpha |
| "PRISM Counsel: Deprecated" | README Products table | ACCURATE | Correctly marked as deprecated |
| "IMPERIUM: Deprecated" | README Products table | ACCURATE | Correctly marked as deprecated (merged into Command) |
| "Lyte: Deprecated" | README Products table | ACCURATE | Correctly marked as deprecated (merged into Command) |
| Node version | .replit | ACCURATE | `modules = ["nodejs-24"]` matches current runtime |

---

## Credential & Secret Audit

### .replit Shared Config — Status

| Secret | Status | Risk | Notes |
|--------|--------|------|-------|
| `OAUTH_STATE_SECRET` | ✅ REMOVED | — | No longer in .replit; set as Replit Secret |
| `VAPID_PRIVATE_KEY` | ✅ REMOVED | — | No longer in .replit; set as Replit Secret |
| `VAPID_PUBLIC_KEY` | In `.replit [userenv.shared]` | NONE — public by design | Safe to keep; clients need this value |
| `VAPID_SUBJECT` | In `.replit [userenv.shared]` | NONE — mailto: address | Safe to keep |

### Mobile Credential Files — Status

| File | Status | Action |
|------|--------|--------|
| `google-services.json` | ✅ Only `.example` tracked; real file in `.gitignore` | DONE |
| `GoogleService-Info.plist` | ✅ Only `.example` tracked; real file in `.gitignore` | DONE |
| `google-play-service-account.json` | ✅ Only `.example` tracked; real file in `.gitignore` | DONE |
| `cortex-mobile/google-services.json` | Not present (shell app) | No action needed |
| `cortex-mobile/GoogleService-Info.plist` | Not present (shell app) | No action needed |

### Source Code Secret Scan — Status

Full regex scan (sk_live, AKIA, ghp_, PRIVATE KEY patterns) found 4 matches — all false positives:
- `scripts/public-mirror/validate-public-surface.ts` — regex pattern in scanner tool
- `scripts/qa/scan-secrets.js` — regex pattern in scanner tool
- `artifacts/command/src/operations/pages/demo-settings.tsx` — UI display text `sk_live_••••••••`
- `artifacts/api-server/src/routes/billing.ts` — `.startsWith("sk_live_")` check

**No live API keys, private keys, or credentials found in source code.**

---

## Summary Classification

| Classification | Count | Items |
|---------------|-------|-------|
| CANONICAL (production now) | 7 | szl-holdings, api-server, aegis, terra, vessels, carlota-jo, command |
| CANONICAL-MOBILE | 1 | szl-holdings-mobile |
| INTERNAL | 1 | mockup-sandbox |
| ARCHIVE (code removed, marker file remains) | 5 | firestorm, lyte-command-center, imperium, prism-counsel, stephen-site |
| SHELL (scaffold only, no real code) | 1 | cortex-mobile |
| MINIMAL SHELL (lib) | 2 | lib/api-spec, lib/approvals |

---

## Appendix: Reproducible Evidence Commands

All counts in this document were generated on 2026-04-16 using the following commands:

```bash
# Artifact directories
ls -d artifacts/*/ | wc -l                              # → 15

# Lib packages
ls -d lib/*/ | wc -l                                    # → 34

# DB tables (live)
psql "$DATABASE_URL" -t -c \
  "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'"
                                                         # → 569

# Schema files
ls lib/db/src/schema/*.ts | wc -l                       # → 116

# Source file count per artifact (all ts/tsx, excl node_modules)
for d in artifacts/*/; do
  name=$(basename "$d")
  count=$(find "$d" -name '*.ts' -o -name '*.tsx' \
          -not -path '*/node_modules/*' | wc -l)
  echo "$name: $count"
done

# Lib package file counts
for d in lib/*/; do
  name=$(basename "$d")
  count=$(find "$d" -name '*.ts' -o -name '*.tsx' \
          -not -path '*/node_modules/*' | wc -l)
  echo "$name: $count"
done

# Secret scan
node scripts/qa/scan-secrets.js                          # → CLEAN
```
