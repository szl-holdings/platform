# Manual Actions Left

Phase J · SZL Scale, Close, and Operate Pass
Updated: 2026-04-16

## Purpose

The focused list of operator actions still required before the platform
serves its first paying customer in Production. Drive this list to
zero. The full action catalog — including ongoing and per-event actions
— lives in `manual-console-actions-master.md`.

## Status Legend

- 🔴 Required before first paying tenant
- 🟡 Required before public launch / public app store release
- 🟢 Recurring (in master list, not blocking initial launch)

---

## Production Cutover (🔴)

These are the prerequisites for the first paying tenant on Production.
Procedure: `production-cutover-checklist.md`.

- [ ] 🔴 Create Production deployment slot (Replit Autoscale)
- [ ] 🔴 Create Staging deployment slot (Replit Autoscale)
- [ ] 🔴 Provision Production PostgreSQL
- [ ] 🔴 Provision Staging PostgreSQL
- [ ] 🔴 Generate + set `OAUTH_STATE_SECRET` in Production Secrets
      (`openssl rand -hex 32`)
- [ ] 🔴 Generate + set fresh VAPID keypair; private in Production
      Secrets, public updated in `.replit [userenv.shared]`
- [ ] 🔴 Generate + set `SESSION_SECRET` in Production Secrets
- [ ] 🔴 Generate + set `FIELD_ENCRYPTION_KEY` in Production Secrets
- [ ] 🔴 Generate + set `CONNECTOR_ENCRYPTION_KEY` in Production Secrets
- [ ] 🔴 Generate + set `ALLOY_INTERNAL_TOKEN` in Production Secrets
- [ ] 🔴 Set `ALLOY_REQUIRE_APPROVAL_CRITICAL=true` in Production
- [ ] 🔴 Set production AI provider keys (OpenAI, Anthropic, Gemini)
- [ ] 🔴 Configure Clerk Production instance with prod domain
- [ ] 🔴 Set `CORS_ORIGINS` to production domain only
- [ ] 🔴 Set `PUBLIC_APP_URL` to production base URL
- [ ] 🔴 Run `pnpm run migrate` against Production DB
- [ ] 🔴 Verify table count = 569 in Production
- [ ] 🔴 Custom domain configured (if applicable); DNS propagated

## CI / GitHub (🔴)

- [ ] 🔴 Set GitHub Secrets: `REPLIT_STAGING_DEPLOY_TOKEN`,
      `REPLIT_STAGING_APP_ID`, `REPLIT_PROD_DEPLOY_TOKEN`,
      `REPLIT_PROD_APP_ID`
- [x] ✅ Set `INTEGRATION_TEST_TOKEN` in GitHub Secrets and Replit Secrets (wired through `.github/workflows/ci.yml` integration-test job)
- [ ] 🔴 Archive legacy CI workflow (retained as archival record; disable if still active)
- [ ] 🔴 Update `e2e.yml` matrix to remove deprecated apps
- [ ] 🔴 Verify `deploy-staging.yml` runs cleanly on next push to main
- [ ] 🔴 Verify `deploy-production.yml` halts at confirm gate

## Pager + On-Call (🔴)

- [ ] 🔴 Stand up pager channel (PagerDuty or equivalent)
- [ ] 🔴 Wire Tier 1 telemetry alarms from
      `telemetry-priority-matrix.md` to pager
- [ ] 🔴 Daily self-test of pager
- [ ] 🔴 Founder phone number documented in launch pack as backup path

## First Tenant (🔴)

- [ ] 🔴 Run production smoke tests per `staging-and-prod-smoke-tests.md`
- [ ] 🔴 First tenant org created via authenticated API (never SQL)
- [ ] 🔴 Primary contact + decision-maker invited; RBAC roles assigned
- [ ] 🔴 Slack Connect channel opened
- [ ] 🔴 `customer-launch-pack.md` link delivered
- [ ] 🔴 Founder watches first 60 minutes of telemetry
- [ ] 🔴 `what-changed.md` "live" entry filed

## Mobile — TestFlight + Play Internal (🟡)

- [ ] 🟡 Apple Developer Program membership current
- [ ] 🟡 Register App ID `com.szlholdings.executive.mobile` (Apple)
- [ ] 🟡 Create App Store Connect app
- [ ] 🟡 Set `appleId`, `ascAppId`, `appleTeamId` in `eas.json`
- [ ] 🟡 Google Play Console app created
- [ ] 🟡 Service Account with Release Manager role created
- [ ] 🟡 Real `google-play-service-account.json` placed
- [ ] 🟡 Real `google-services.json` placed
- [ ] 🟡 Real `GoogleService-Info.plist` placed
- [ ] 🟡 EAS project linked (`eas init`)
- [ ] 🟡 EAS preview build for iOS succeeds
- [ ] 🟡 EAS preview build for Android succeeds
- [ ] 🟡 Sentry project + DSN added
- [ ] 🟡 Reviewer notes + test accounts prepared per
      `ops/mobile/reviewer-notes-and-test-accounts.md`
- [ ] 🟡 ≥3 internal testers using CORTEX for ≥1 week
- [ ] 🟡 Privacy manifest (iOS) complete
- [ ] 🟡 Data Collection Disclosure (both stores) complete

## Counsel (🟡 / 🟢)

- [ ] 🟡 MSA + DPA + Order Form templates final
- [ ] 🟡 Standard fallback positions documented (LOL cap, IP indemnity,
      audit rights, data return)
- [ ] 🟢 Quarterly DPA + subprocessor review (recurring)

## Compliance (🟡)

- [ ] 🟡 SOC 2 auditor selected when first enterprise contract in motion
- [ ] 🟡 Pen test vendor selected and engaged when first contract
      requiring it is in motion

## Tooling — Tier-Drift Detector (🟢)

Per `scale-constraints-memo.md`. Not blocking initial launch but should
be built before customer count > 5.

- [ ] 🟢 Automated drift detector for schema across tiers
- [ ] 🟢 Automated drift detector for env-registry across tiers
- [ ] 🟢 Slack notification on drift detection

---

## How to Use This List

- Founder reviews this list weekly during the Monday block
- Anything completed is checked here AND in `what-changed.md`
- Items that turn out to be unnecessary are removed with a note in
  `what-changed.md`
- New items added by recent decisions go to the appropriate section
- 🔴 items block the first paying tenant
- 🟡 items block public launch
- 🟢 items are operational-tax that does not block initial launch

When all 🔴 items are checked, the platform can take its first paying
tenant. When all 🔴 + 🟡 items are checked, the platform can be
publicly announced and CORTEX can be in public app stores.
