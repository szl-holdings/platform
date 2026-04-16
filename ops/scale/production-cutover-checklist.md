# Production Cutover Checklist

Phase B · SZL Scale, Close, and Operate Pass
Updated: 2026-04-16

## Purpose

The one-time checklist to take SZL Holdings from "Workspace + dormant
Staging/Production deployment slots" to "first paying tenant served
from Production." Run once. Every item is binary.

## Prerequisites

- [ ] Replit Production deployment slot created (Autoscale)
- [ ] Replit Staging deployment slot created (Autoscale)
- [ ] GitHub repo connected to both deployments
- [ ] All `ops/security/secret-inventory.md` items in the
      "needs rotation" / "needs to be set" categories are addressed
- [ ] Production database created (Replit-managed PostgreSQL,
      separate from workspace DB)
- [ ] DNS plan agreed (custom domain or `*.replit.app`)

## Phase 1 — Secrets

- [ ] `OAUTH_STATE_SECRET` — generated fresh (`openssl rand -hex 32`)
      and set in Production Replit Secrets
- [ ] `VAPID_PRIVATE_KEY` + matching `VAPID_PUBLIC_KEY` — fresh keypair
      generated (`npx web-push generate-vapid-keys`); private in
      Production Secrets, public in `.replit [userenv.shared]`
- [ ] `SESSION_SECRET` — fresh, in Production Secrets
- [ ] `FIELD_ENCRYPTION_KEY` — fresh, in Production Secrets
- [ ] `CONNECTOR_ENCRYPTION_KEY` — fresh, in Production Secrets
- [ ] `ALLOY_INTERNAL_TOKEN` — fresh, in Production Secrets
- [ ] `ALLOY_REQUIRE_APPROVAL_CRITICAL` — set to `true` in Production
      (production invariant per ATLAS env registry)
- [ ] AI provider keys (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`,
      `GEMINI_API_KEY`) — production keys, not test keys
- [ ] Clerk production keys (`CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`,
      `VITE_CLERK_PUBLISHABLE_KEY`) — pointed at the Production Clerk
      instance, not Development
- [ ] Stripe live keys configured if billing is live on day 1; if not,
      explicitly leave unset and ensure billing routes return 503

## Phase 2 — Database

- [ ] `DATABASE_URL` injected by Replit
- [ ] `pnpm run migrate` workflow run successfully against Production DB
- [ ] Verify table count matches Workspace (currently 569; see
      `ops/frontier/repo-truth-audit.md`)
- [ ] Verify schema file count matches Workspace (currently 116)
- [ ] Demo seed NOT loaded (`pnpm run seed:demo` is for non-production
      tiers only)
- [ ] First tenant org row created via API or admin tooling — never via
      ad-hoc SQL

## Phase 3 — CORS, Hosts, TLS

- [ ] `CORS_ORIGINS` set to production domain(s) only (no localhost,
      no workspace domains)
- [ ] `PUBLIC_APP_URL` set to production base URL
- [ ] TLS: confirmed via Replit Autoscale (managed)
- [ ] HSTS, CSP, X-Frame-Options verified via curl + browser dev tools
      against the production URL (Helmet middleware)
- [ ] Custom domain configured if applicable; DNS propagated

## Phase 4 — Auth

- [ ] Clerk production instance configured with the production domain
      in allowed origins
- [ ] OIDC redirect URIs include the production domain
- [ ] Test user with `org_admin` role created and able to log in
- [ ] Test user able to log out cleanly (session invalidated)
- [ ] MFA enrolment flow walked end-to-end

## Phase 5 — Workloads

- [ ] All seven canonical web artifacts (szl-holdings, api-server,
      aegis, terra, vessels, carlota-jo, command) build cleanly via
      their respective workflows
- [ ] No archived artifact (firestorm, lyte-command-center, imperium,
      prism-counsel, stephen-site) is registered to a production route
- [ ] Mockup sandbox and any internal-only artifact are NOT exposed
      under any production path

## Phase 6 — Observability

- [ ] OpenTelemetry plan items from `ops/observability/otel-plan.md`
      enabled in Production
- [ ] `staging-and-prod-smoke-tests.md` production-tier suite run end-to-end
- [ ] Tier-1 telemetry events from `telemetry-priority-matrix.md`
      verified to be flowing
- [ ] Pager channel reachable (see `manual-actions-left.md` if pager is
      still TBD)

## Phase 7 — Mobile (only if shipping mobile on day 1)

- [ ] Real Firebase credentials in place
      (`google-services.json`, `GoogleService-Info.plist`,
      `google-play-service-account.json`) — see
      `ops/mobile/eas-and-store-secrets-matrix.md`
- [ ] EAS production profile builds clean
- [ ] TestFlight + Play Internal already exercised by ≥3 internal
      testers per `mobile-beta-ops.md` exit criteria

## Phase 8 — Documentation

- [ ] `what-changed.md` updated with the cutover entry
- [ ] `manual-actions-left.md` updated to remove items just completed
- [ ] `go-live-readiness-verdict.md` updated to GREEN

## Cutover Execution

1. Founder runs Phase 1–7 checklist with engineering present
2. Founder pages first-tenant primary contact and confirms readiness
3. First tenant signed in, completes a single end-to-end workflow
4. Founder watches telemetry for 60 minutes
5. Founder declares "live" in `what-changed.md`

## Anti-Patterns

- Skipping Staging because the change is "small" — never
- Loading demo seed into Production — never
- Reusing a workspace secret value in Production — never
- Provisioning the first tenant via ad-hoc SQL — never
