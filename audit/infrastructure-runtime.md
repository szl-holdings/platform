# SZL Holdings — Infrastructure & Runtime State

**Audit date:** 2026-04-21  
**Status labels:** VERIFIED · PARTIALLY VERIFIED · UNVERIFIED · BROKEN · NOT STARTED

---

## Replit Runtime State (Current)

| Component | Status | Notes |
|-----------|--------|-------|
| All 18 workflows | **NOT STARTED** | Critical — nothing is running |
| `artifacts/api-server: api` | NOT STARTED | Core backend — must start first |
| `artifacts/szl-holdings: web` | NOT STARTED | Corporate home |
| `artifacts/aegis: web` | NOT STARTED | Security intelligence |
| `artifacts/vessels: web` | NOT STARTED | Maritime intelligence |
| `artifacts/terra: web` | NOT STARTED | Real estate intelligence |
| `artifacts/carlota-jo: web` | NOT STARTED | Advisory portal |
| `artifacts/command: web` | NOT STARTED | CORTEX unified command |
| `artifacts/lyte-command-center: web` | NOT STARTED | Lyte decision intelligence |
| `artifacts/pulse: web` | NOT STARTED | AI executive briefing |
| `artifacts/sentra: web` | NOT STARTED | Agent mesh defense |
| `artifacts/counsel: web` | NOT STARTED | Legal (skeleton) |
| `artifacts/szl-demo-video: web` | NOT STARTED | Demo video |
| `artifacts/szl-holdings-mobile: expo` | NOT STARTED | Mobile app |
| `artifacts/mockup-sandbox: web` | NOT STARTED | Design tool |
| `shared-proxy` | NOT STARTED | Routing proxy |
| `lyte-metrics-store: service` | NOT STARTED | Metrics service |
| `lyte-metrics-store-test` | NOT STARTED | Test workflow |
| `api-test` | NOT STARTED | API test workflow |

---

## Node.js Runtime

| Attribute | Canonical | Actual | Status |
|-----------|-----------|--------|--------|
| Node.js version | 22 LTS (Dockerfiles/CI) | 24 (Replit platform-managed) | PARTIALLY VERIFIED — "acceptable gap" per `PLATFORM_CANONICAL.md` |
| pnpm version | 10.x (10.26.1) | 10.26.1 | VERIFIED — `PLATFORM_CANONICAL.md` |
| NixOS channel | stable-25_05 | stable-25_05 | VERIFIED — `.replit` |
| PostgreSQL | 16 | 16 | VERIFIED — `.replit` modules |
| TypeScript | 5.x | 5.x | VERIFIED — `pnpm-workspace.yaml` catalog |

---

## CI/CD Infrastructure

| Component | Status | Notes |
|-----------|--------|-------|
| `.github/workflows/ci.yml` | VERIFIED | 14,191 bytes; comprehensive |
| `.github/workflows/codeql.yml` | VERIFIED | CodeQL for TS/JS |
| `.github/dependabot.yml` | VERIFIED | npm + GitHub Actions |
| CI gate: `pnpm lint` | PARTIALLY VERIFIED | Configured; 10,348 Biome warn-level items |
| CI gate: `pnpm typecheck` | PARTIALLY VERIFIED | Clean on targeted packages; full monorepo not confirmed |
| CI gate: `pnpm test` | PARTIALLY VERIFIED | API server has 851 vitest tests; other artifacts minimal |
| CI gate: `pnpm build` | PARTIALLY VERIFIED | All artifacts have build script; build not run in this audit |
| CI gate: `pnpm test:integration` | NOT STARTED | "Not yet wired to CI gate" per `PLATFORM_CANONICAL.md` |
| CI gate: `pnpm test:e2e` | NOT STARTED | "No active suite yet" |
| `audit:route-security:strict` | PARTIALLY VERIFIED | Task #1902 added this gate; strict mode active |
| Post-merge automation (`scripts/post-merge.sh`) | PARTIALLY VERIFIED | Script exists; runs `pnpm install`, `pnpm --filter db push`, build verify |

---

## Azure / Cloud Infrastructure

| Component | Status | Notes |
|-----------|--------|-------|
| `infra/` — Azure Bicep IaC templates | PARTIALLY VERIFIED | Directory exists; templates not validated or deployed |
| Reserved VM deployment target | UNVERIFIED | Documented in deployment model; not confirmed |
| Autoscale deployment target | UNVERIFIED | Documented; not confirmed |
| External Workers target | UNVERIFIED | For inference/reranking/eval workloads |

---

## Replit-Specific Configuration

| File | Status | Notes |
|------|--------|-------|
| `.replit` | VERIFIED | Configures modules, NixOS, postMerge, userenv |
| `replit.nix` | VERIFIED | Chromium, OpenGL, X11 for Playwright |
| `pnpm-workspace.yaml` | VERIFIED | Catalog with pinned versions |
| `pnpm-lock.yaml` | VERIFIED | Lock file present |

---

## External Service Dependencies

| Service | Purpose | Status |
|---------|---------|--------|
| PostgreSQL (Replit-managed) | Primary database | VERIFIED (DATABASE_URL set) |
| OpenAI API | AI generation | PARTIALLY VERIFIED (env var referenced) |
| Anthropic API | AI generation | PARTIALLY VERIFIED (env var referenced) |
| Google Gemini | AI generation | PARTIALLY VERIFIED (env var referenced) |
| Resend | Email delivery (primary) | UNVERIFIED (key required) |
| Stripe | Billing | PARTIALLY VERIFIED (test mode only) |
| Mapbox | Maps (Terra) | UNVERIFIED (token required) |
| NOAA | Maritime weather | PARTIALLY VERIFIED (public API) |
| Open-Meteo | Maritime weather | PARTIALLY VERIFIED (public API, no key) |
| GDELT | News/events | PARTIALLY VERIFIED (public API, no key) |
| CISA KEV | Vulnerability data | PARTIALLY VERIFIED (public API) |
| NVD | CVE data | PARTIALLY VERIFIED (public API) |
| Redis | Session store | NOT STARTED (not yet activated) |
| Sentry | Error monitoring | UNVERIFIED (DSN not configured) |
| MarineTraffic / AISHub / Digitraffic / BarentsWatch | Live AIS data | UNVERIFIED (no API keys in .env.example) |
| AlienVault OTX / Shodan / GreyNoise | Threat intelligence | UNVERIFIED (no API keys in .env.example) |

---

## Startup Sequence (Required Order)

When starting the platform for the first time after a clean environment:

1. `pnpm install` — install all dependencies
2. `pnpm migrate` — push schema to database (`drizzle-kit push`)
3. `pnpm seed` — run canonical seed (idempotent)
4. Start `api-server` workflow first
5. Start `shared-proxy` workflow
6. Start frontend artifact workflows (any order)
7. Run `pnpm health:check` — verify API health endpoints
8. Run `pnpm test` — verify test suite passes

**Current state:** None of steps 4–8 have been completed. All workflows NOT STARTED.

---

## Production Readiness Blockers

Before any production deployment can proceed:

**Security — address first:**
- Move `SUBSTRATE_SIGNING_KEY` from `.replit [userenv.shared]` to Replit Secrets (256-bit key committed in `.replit`)
- Verify `ALLOY_INTERNAL_TOKEN` is not used in production; move any production token to Replit Secrets

**Configuration:**
1. Add enterprise custom domain to `CORS_ORIGINS` in `.replit [userenv.production]` (Replit domains `*.replit.app,*.replit.dev,*.repl.co` already configured)
2. Configure Sentry DSN for both frontend and backend (Risk #8)
3. Activate Stripe live mode keys (Risk #3)
4. Set `MFA_SECRET_ENCRYPTION_KEY` (auth finding F-02)
5. Activate Redis session store (replaces in-memory)
6. Configure all required production env vars (see `audit/env-var-matrix.md`)
7. Run smoke test against production URL
8. Verify CORS headers are correct for all artifact domains
