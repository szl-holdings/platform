# Manual Console Actions Master List

Phase G · SZL Scale, Close, and Operate Pass
Updated: 2026-04-16

## Purpose

The complete list of operator actions that require a human in a console
somewhere — Replit, GitHub, Apple Developer, Google Play, Clerk, AI
provider dashboards, Stripe, etc. Anything that is not codeable today.

The discipline: every manual action either (a) gets automated or
(b) ends up here with a clear owner and trigger.

## Replit

| # | Action | When | Owner |
|---|--------|------|-------|
| R1 | Create Production deployment slot | Once, before Production cutover | Founder |
| R2 | Create Staging deployment slot | Once | Founder |
| R3 | Set Production Replit Secrets per `production-cutover-checklist.md` Phase 1 | Once + each rotation | Founder |
| R4 | Set Staging Replit Secrets | Once + each rotation | Founder |
| R5 | Provision Production PostgreSQL | Once | Founder |
| R6 | Provision Staging PostgreSQL | Once | Founder |
| R7 | Configure custom domain on production deployment | Once if applicable | Founder |
| R8 | Approve `deploy-production.yml` confirm gate | Per release | Founder |
| R9 | Restore from PostgreSQL point-in-time recovery (if needed) | Per P0 data event | Founder + Replit support |

## GitHub

| # | Action | When | Owner |
|---|--------|------|-------|
| G1 | Set GitHub Secret `REPLIT_STAGING_DEPLOY_TOKEN` | Once + on rotation | Founder |
| G2 | Set GitHub Secret `REPLIT_STAGING_APP_ID` | Once | Founder |
| G3 | Set GitHub Secret `REPLIT_PROD_DEPLOY_TOKEN` | Once + on rotation | Founder |
| G4 | Set GitHub Secret `REPLIT_PROD_APP_ID` | Once | Founder |
| G5 | Set GitHub Secret `INTEGRATION_TEST_TOKEN` | Once + on rotation | Founder |
| G6 | Tag a release `vX.Y.Z` and push | Per release | Founder |
| G7 | Archive legacy CI workflow (retain as archival record; disable triggers) | Once — COMPLETED | Engineering |
| G8 | Update `e2e.yml` matrix to remove archived app specs | Once — COMPLETED | Engineering |
| G9 | Triage Dependabot PRs | Weekly | Founder + Engineering |
| G10 | Triage CodeQL alerts | Weekly | Founder + Engineering |

## Clerk

| # | Action | When | Owner |
|---|--------|------|-------|
| C1 | Configure Production Clerk instance with prod domain | Once | Founder |
| C2 | Add allowed origins for prod domain | Once | Founder |
| C3 | Configure OIDC redirect URIs | Once | Founder |
| C4 | Rotate `CLERK_SECRET_KEY` on suspicion of compromise | As needed | Founder |
| C5 | Add custom OAuth credentials for enterprise SSO | Per enterprise contract | Founder |

## AI Providers

| # | Action | When | Owner |
|---|--------|------|-------|
| A1 | Add AI integrations via Replit (OpenAI, Anthropic, Gemini) | Once | Founder |
| A2 | Rotate AI provider keys via Replit Secrets | Every 180 days | Founder |
| A3 | Adjust per-provider rate limits if hit in Production | As needed | Founder |

## Stripe

| # | Action | When | Owner |
|---|--------|------|-------|
| S1 | Set `STRIPE_SECRET_KEY` (live) in Production Secrets | Once when billing live | Founder |
| S2 | Configure Stripe webhook endpoint pointing at Production | Once | Founder |
| S3 | Set `STRIPE_WEBHOOK_SECRET` | Once + on rotation | Founder |
| S4 | Add new products / prices in Stripe dashboard | Per pricing change | Founder |

## Apple Developer + App Store Connect (CORTEX)

| # | Action | When | Owner |
|---|--------|------|-------|
| AP1 | Apple Developer Program membership current | Annual | Founder |
| AP2 | Register App ID `com.szlholdings.executive.mobile` | Once | Founder |
| AP3 | Create App Store Connect app | Once | Founder |
| AP4 | Set `appleId`, `ascAppId`, `appleTeamId` in `eas.json` | Once | Engineering |
| AP5 | Run `eas build --profile production --platform ios` | Per native release | Engineering |
| AP6 | Run `eas submit --profile production --platform ios --latest` | Per release | Engineering |
| AP7 | Create TestFlight test groups | Once | Founder |
| AP8 | Add TestFlight testers | Per tester batch | Founder |
| AP9 | Provide reviewer test account in TestFlight notes | Per submission | Founder |
| AP10 | Submit for App Store review | Per public release | Founder |
| AP11 | Stop TestFlight distribution (rollback) | Per rollback | Engineering |

## Google Play (CORTEX)

| # | Action | When | Owner |
|---|--------|------|-------|
| GP1 | Google Play Console developer account current | One-time | Founder |
| GP2 | Create Play Console app | Once | Founder |
| GP3 | Link Google Cloud project + Service Account with Release Manager | Once | Founder |
| GP4 | Place `google-play-service-account.json` | Once | Engineering |
| GP5 | Run `eas build --profile production --platform android` | Per native release | Engineering |
| GP6 | Run `eas submit --profile production --platform android --latest` | Per release | Engineering |
| GP7 | Create internal testing tester list | Once + per batch | Founder |
| GP8 | Share opt-in URL with testers | Per batch | Founder |
| GP9 | Submit for Play Store review | Per public release | Founder |
| GP10 | Halt rollout (rollback) | Per rollback | Engineering |

## Firebase (Mobile)

| # | Action | When | Owner |
|---|--------|------|-------|
| F1 | Create Firebase project for CORTEX | Once | Founder |
| F2 | Download real `google-services.json` (Android) | Once | Engineering |
| F3 | Download real `GoogleService-Info.plist` (iOS) | Once | Engineering |
| F4 | Place files into `artifacts/szl-holdings-mobile/` | Once | Engineering |

## Sentry (Mobile)

| # | Action | When | Owner |
|---|--------|------|-------|
| SE1 | Create Sentry project | Once | Engineering |
| SE2 | Add `SENTRY_DSN` to EAS secrets | Once | Engineering |
| SE3 | Initialize Sentry in app root | Once | Engineering |
| SE4 | Triage Sentry crash reports | Weekly | Founder + Engineering |

## Tenant Provisioning

| # | Action | When | Owner |
|---|--------|------|-------|
| T1 | Create org row via authenticated API (never via SQL) | Per signed partner | Founder |
| T2 | Invite primary contact + decision-maker users via Clerk | Per signed partner | Founder |
| T3 | Assign RBAC roles | Per signed partner | Founder |
| T4 | Open Slack Connect channel | Per signed partner | Founder |
| T5 | Send `customer-launch-pack.md` link | Per signed partner | Founder |
| T6 | First-load partner data via documented import path | Per signed partner | Founder + Engineering |

## Pager Channel (PENDING)

| # | Action | When | Owner |
|---|--------|------|-------|
| P1 | Stand up pager channel (PagerDuty or equivalent) | Once, before first paying tenant | Founder |
| P2 | Wire Tier 1 telemetry alarms to pager | Once | Engineering |
| P3 | Daily self-test of pager | Daily, automated | Engineering |
| P4 | On-call rotation defined | When second engineer onboards | Founder |

## Counsel

| # | Action | When | Owner |
|---|--------|------|-------|
| L1 | DocuSign account active | Always | Counsel |
| L2 | Send MSA + DPA + Order Form | Per opportunity | Counsel |
| L3 | Negotiate redlines | Per opportunity | Counsel |
| L4 | File signed contracts | Per signature | Counsel |
| L5 | Quarterly DPA + subprocessor review | Quarterly | Counsel + Founder |

## Review Cadence

This list is reviewed monthly. Items that have been automated are
removed. Items that have been added during the month are validated for
ownership.
