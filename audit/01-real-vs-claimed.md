# SZL Holdings — What Is Real vs. Claimed

**Audit date:** 2026-04-21  
**Status labels:** VERIFIED · PARTIALLY VERIFIED · UNVERIFIED · BROKEN · OUT OF SCOPE  
**Reproducibility:** All counts in this document are reproducible via exact commands in `audit/counting-methodology.md`.

---

## Legend

- **VERIFIED** — Confirmed by direct filesystem inspection, grep, or documented test evidence
- **PARTIALLY VERIFIED** — Code/config exists but runtime behavior not confirmed (server not running)
- **UNVERIFIED** — Claim made in docs or UI; no code or runtime evidence found
- **BROKEN** — Code exists but contains a known defect or the claim contradicts observed state
- **OUT OF SCOPE** — Claim is aspirational/roadmap; not expected to be implemented now

---

## Platform Identity Claims

| Claim | Source | Status | Evidence / Notes |
|-------|--------|--------|-----------------|
| "Platform version 4.0.0" | `platform-facts.md` | UNVERIFIED | Version string in docs only; no `version` field in root `package.json` reflecting this |
| "Founded 2024" | `platform-facts.md` | UNVERIFIED | No corporate registration evidence in repo |
| "Last comprehensive audit: 2026-04-20" | `platform-facts.md` | PARTIALLY VERIFIED | Phase A + B reports exist at that date; this Phase 3 audit supersedes |
| "Codename: AEEP" | `platform-facts.md` | UNVERIFIED | Naming convention in docs only; not reflected in CI or package names |

---

## Application Surface Claims

| Claim | Source | Status | Evidence / Notes |
|-------|--------|--------|-----------------|
| "Active registered artifacts: 2" | `platform-facts.md` | BROKEN | Two registration systems exist: `.replit [[artifacts]]` has 2 entries (`artifacts/api-server`, `artifacts/mockup-sandbox`); workspace registry has 15 registered artifacts. "2 active" misrepresents both systems — the other 13 are registered but not in `.replit [[artifacts]]`; none are currently running |
| "Total artifacts (including archived): 20" | `platform-facts.md` | PARTIALLY VERIFIED | 15 registered + 5 on-disk orphans (`firestorm/`, `imperium/`, `cortex-mobile/`, `audit/`, `internal-audit/`) = 20 total, but classification is inconsistent |
| "Domain packs: 6" | `platform-facts.md` | PARTIALLY VERIFIED | 6 named (Lyte, Vessels, Terra, Aegis, PRISM, Carlota) but `counsel` and `prism-counsel` are separate artifacts — domain pack boundaries not machine-enforced |
| "All platforms: Live" | `PRODUCT_MATRIX.md` | BROKEN | All workflows NOT STARTED; none serving traffic |
| "Lyte: Live" | `PRODUCT_MATRIX.md` | UNVERIFIED | Workflow not running; `lyte-command-center` has 23 src files and live API routes merged (#1040), but smoke test absent |
| "Aegis: Live" | `PRODUCT_MATRIX.md` | UNVERIFIED | Workflow not running; 212 src files, CISA/NVD routes present |
| "Terra: Live" | `PRODUCT_MATRIX.md` | UNVERIFIED | Workflow not running; 116 src files; Mapbox token required |
| "Vessels: Live" | `PRODUCT_MATRIX.md` | UNVERIFIED | Workflow not running; AIS simulated (not live AIS feed per reconciliation report) |
| "Carlota Jo: Live" | `PRODUCT_MATRIX.md` | PARTIALLY VERIFIED | 89 src files, GA lifecycle, most mature but still not running |
| "SZL Holdings: Live" | `PRODUCT_MATRIX.md` | UNVERIFIED | Workflow not running; serves as corporate home |

---

## Package Ecosystem Claims

| Claim | Source | Status | Evidence / Notes |
|-------|--------|--------|-----------------|
| "Domain packages: 77" | `platform-facts.md` | BROKEN | `find packages -maxdepth 1 -mindepth 1 -type d \| wc -l` = **81** package directories (`ls packages/` = 82 entries but includes `packages/proxy-routes.ts` — a standalone file, not a package directory) |
| "Shared library packages: 41" | `platform-facts.md` | VERIFIED | `find lib -maxdepth 1 -mindepth 1 -type d \| wc -l` = 41 |
| "Total packages: 118" | `platform-facts.md` | BROKEN | Actual: 81 package dirs + 41 lib dirs = **122** (see `audit/counting-methodology.md`) |

---

## Data Layer Claims

| Claim | Source | Status | Evidence / Notes |
|-------|--------|--------|-----------------|
| "Database tables: 906" | `platform-facts.md` | BROKEN | `grep -r "pgTable(" lib/db/src/schema/ --include="*.ts" \| wc -l` = **915** actual table definitions (direct `pgTable(` calls); `grep "pgTable"` broadly = 1,078 lines incl. imports/type refs |
| "Schema files: 163" | `platform-facts.md` | BROKEN | `ls lib/db/src/schema/` = 165 files |
| "Schema domains: 10" | `platform-facts.md` | UNVERIFIED | Domain grouping not machine-validated; schema files cross domain boundaries |
| "Migration strategy: forward-only (db:push)" | `PLATFORM_CANONICAL.md` | VERIFIED | `drizzle-kit push` in `pnpm migrate` — no rollback migrations exist |
| "Idempotent seeds using onConflictDoNothing()" | `PLATFORM_CANONICAL.md` | PARTIALLY VERIFIED | Pattern visible in seed files; not CI-gate-tested |

---

## API Surface Claims

| Claim | Source | Status | Evidence / Notes |
|-------|--------|--------|-----------------|
| "API route groups: 14" | `platform-facts.md` | BROKEN | `ls artifacts/api-server/src/routes/` = 268 entries; 14 is a gross understatement |
| "Route files: 182" | `APP_STATUS.md` (stale) | BROKEN | Actual: 268 top-level entries, 382 total `.ts` route files (confirmed: `find artifacts/api-server/src/routes -name "*.ts" \| wc -l`) |
| "Route files: 256" | Reconciliation report | BROKEN | Actual count at this audit: 268 groups / 382 files |
| "AEEP v1 endpoints: 18" | `platform-facts.md` | PARTIALLY VERIFIED | 18 routes listed; all marked "Active" but runtime not confirmed |
| "Route validation coverage: 21/170" | `APP_STATUS.md` | BROKEN | Task #1902 merged — `audit:route-security:strict` CI gate added; actual coverage higher but exact number unknown without running the script |
| "Health endpoints exist" | `PLATFORM_CANONICAL.md` | PARTIALLY VERIFIED | `pnpm health:check` script listed; server must be running to verify |

---

## Authentication Claims

| Claim | Source | Status | Evidence / Notes |
|-------|--------|--------|-----------------|
| "Protocol: OpenID Connect (PKCE)" | `PLATFORM_CANONICAL.md` | PARTIALLY VERIFIED | `@szl-holdings/replit-auth-web` library exists; OIDC config in auth lib; runtime not confirmed |
| "RBAC roles: 7 (super_admin, exec, ops, compliance, maintenance, analyst, viewer)" | `PLATFORM_CANONICAL.md` | BROKEN | Actual schema: 12 `platformRole` enum values + 4 `rolesTable` enum values + canonical mapping layer = dual parallel system. The 7 names in `PLATFORM_CANONICAL.md` do not match either enum |
| "RBAC roles: 11" | `platform-facts.md` | BROKEN | Actual `platformRole` enum has 12 values; `rolesTable` has 4 more distinct values |
| "Session store: Redis (enterprise production)" | `PLATFORM_CANONICAL.md` | UNVERIFIED | Redis "not yet activated" per same doc |
| "Internal token: ALLOY_INTERNAL_TOKEN → grants super_admin" | `PLATFORM_CANONICAL.md` | PARTIALLY VERIFIED | Token referenced 22× in codebase; grant logic in auth middleware — runtime not confirmed |
| "Authentication providers: Replit Auth (OIDC/PKCE), Clerk" | `platform-facts.md` | PARTIALLY VERIFIED | Replit Auth wired; Clerk referenced in `platform-facts.md` but not found as an active library in artifact source |

---

## Infrastructure Claims

| Claim | Source | Status | Evidence / Notes |
|-------|--------|--------|-----------------|
| "Azure Bicep IaC templates" | `PLATFORM_OVERVIEW.md` | PARTIALLY VERIFIED | `infra/` directory exists; contents not smoke-tested |
| "WebSocket with HMAC-signed tickets" | `PLATFORM_OVERVIEW.md` | PARTIALLY VERIFIED | Code exists in API server; runtime behavior UNVERIFIED |
| "Multi-provider email (Resend/SendGrid/SMTP)" | `PLATFORM_OVERVIEW.md` | PARTIALLY VERIFIED | All three providers wired in `.env.example`; fallback chain documented; delivery UNVERIFIED |
| "Stripe (Checkout, Subscriptions, Invoicing)" | `PLATFORM_OVERVIEW.md` | PARTIALLY VERIFIED | Stripe secret key referenced 24× in codebase; test mode only (not live) |
| "Mapbox GL JS" | `PLATFORM_OVERVIEW.md` | PARTIALLY VERIFIED | `GOOGLE_MAPS_API_KEY` used 13× in code; Mapbox also referenced; Terra requires token |
| "OTel / distributed tracing" | Multiple docs | UNVERIFIED | Spec complete; instrumentation not implemented |
| "Sentry error monitoring" | `OPEN_RISKS_AND_NEXT_10.md` | UNVERIFIED | DSN not configured |
| "StateRAMP readiness track (Aegis)" | `PRODUCT_MATRIX.md` | UNVERIFIED | No StateRAMP documentation or compliance evidence in repo |
| "STIX/TAXII protocol layer (Aegis)" | `PRODUCT_MATRIX.md` | PARTIALLY VERIFIED | Route files present; actual protocol implementation not verified |
| "MITRE ATT&CK v14 detection coverage (Aegis)" | `PRODUCT_MATRIX.md` | PARTIALLY VERIFIED | MITRE ATT&CK data source referenced; coverage claim unverified |
| "40+ connector integrations (Lyte)" | `PRODUCT_MATRIX.md` | UNVERIFIED | No connector count in any machine-readable manifest |
| "Live NYC distress data pipeline (Terra)" | `PRODUCT_MATRIX.md` | PARTIALLY VERIFIED | NYC Open Data routes exist; live polling UNVERIFIED |
| "AIS telemetry integration (Vessels)" | `PRODUCT_MATRIX.md` | PARTIALLY VERIFIED | AIS routes exist; reconciliation report says "AIS simulated" not live feed |
| "Dark vessel detection (Vessels)" | `PRODUCT_MATRIX.md` | PARTIALLY VERIFIED | Route file exists; algorithm implementation UNVERIFIED |
| "Sanctions screening — OFAC SDN (Vessels)" | `PRODUCT_MATRIX.md` | PARTIALLY VERIFIED | OFAC reference in external data sources list; route existence not confirmed without grep |

---

## AI Capability Claims

| Claim | Source | Status | Evidence / Notes |
|-------|--------|--------|-----------------|
| "OpenAI, Anthropic, Google Gemini, HuggingFace, NVIDIA NIM" | `platform-facts.md` | PARTIALLY VERIFIED | All referenced in env vars and gateway code; actual API calls UNVERIFIED |
| "8 typed agent role contracts" | `platform-facts.md` | PARTIALLY VERIFIED | Named in docs; TypeScript interfaces exist in `packages/`; runtime execution UNVERIFIED |
| "8 cognitive loop phases" | `platform-facts.md` | PARTIALLY VERIFIED | Phase names present in package code |
| "10 starter workflow definitions" | `platform-facts.md` | PARTIALLY VERIFIED | Count not independently verified at this audit |
| "5 embedding backends" | `platform-facts.md` | PARTIALLY VERIFIED | Documented in `platform-facts.md`; backends exist in code |
| "4 memory tiers" | `platform-facts.md` | PARTIALLY VERIFIED | Tier names in code; runtime behavior UNVERIFIED |
| "Agent eval infrastructure" | Multiple docs | UNVERIFIED | Spec complete; runner not built per `OPEN_RISKS_AND_NEXT_10.md` |

---

## External Data Source Claims

| Claim | Source | Status | Evidence / Notes |
|-------|--------|--------|-----------------|
| "MarineTraffic, AISHub, Digitraffic, BarentsWatch" | `platform-facts.md` | UNVERIFIED | Named in docs; no API key env vars for these in `.env.example` |
| "Open-Meteo Marine" | `platform-facts.md` | PARTIALLY VERIFIED | Open-Meteo is public/no-key; route likely functional |
| "AlienVault OTX, MISP OSINT, Shodan, GreyNoise, MalwareBazaar" | `platform-facts.md` | UNVERIFIED | No API keys for these in `.env.example` |
| "CourtListener REST API" | `platform-facts.md` | UNVERIFIED | No env var for CourtListener key |
| "NOAA, GDELT" | Reconciliation report | PARTIALLY VERIFIED | Both are public-access APIs; routes likely functional |
| "SEC EDGAR, Census/BLS, FEMA NRI, NYC Open Data" | `platform-facts.md` | PARTIALLY VERIFIED | All public APIs; route code exists |

---

*End of Real vs. Claimed register. All BROKEN items require a correction in the canonical docs before any investor-facing content refresh.*
