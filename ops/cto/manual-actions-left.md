# Manual Actions Remaining

**Owner:** Founder  
**Last updated:** April 2026  
**Version:** 1.0

---

## Purpose

This document lists every action that cannot be automated and requires a human to perform it in an external console, dashboard, or third-party service. These cannot be done by an agent or CI pipeline. Each item has a clear instruction and acceptance test.

Work through this list from top to bottom. The order is priority-sorted.

---

## Category 1 — Secrets & Credentials (Do First)

| # | Action | Where | Instruction | Acceptance Test |
|---|--------|--------|-------------|-----------------|
| 1 | Generate and add `OAUTH_STATE_SECRET` | Replit Secrets panel | Run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` locally; paste result as the secret value | Confirm key appears in Replit Secrets; verify OIDC login flow works |
| 2 | Generate and add `VAPID_PRIVATE_KEY` | Replit Secrets panel | Run `npx web-push generate-vapid-keys` and copy the private key; also update `VAPID_PUBLIC_KEY` in `.replit` shared config | Web push subscription endpoint works |
| 3 | Confirm `CONNECTOR_ENCRYPTION_KEY` exists | Replit Secrets panel | Check the panel; if missing, run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and add it | Key present in Secrets panel |
| 4 | Confirm `STRIPE_SECRET_KEY` | Replit Secrets panel | Log into Stripe dashboard → Developers → API Keys → reveal Secret Key; paste into Replit Secrets | `/api/health/detailed` shows Stripe dependency healthy (once wired) |
| 5 | Confirm `STRIPE_WEBHOOK_SECRET` | Replit Secrets panel | Stripe dashboard → Webhooks → select endpoint → reveal Signing Secret | Stripe webhook signature validation passes |
| 6 | Confirm `RESEND_API_KEY` | Replit Secrets panel | Log into Resend dashboard → API Keys; copy key; paste into Replit Secrets | Transactional email sends successfully |
| 7 | Confirm `MAPBOX_ACCESS_TOKEN` | Replit Secrets panel | Log into Mapbox account → Tokens → copy default public token | Map tiles load in Terra and Vessels |
| 8 | Confirm `HF_TOKEN` | Replit Secrets panel | Log into Hugging Face → Settings → Access Tokens; if used, paste into Replit Secrets | Confirm whether this key is active in code |

---

## Category 2 — GitHub / CI Secrets

| # | Action | Where | Instruction | Acceptance Test |
|---|--------|--------|-------------|-----------------|
| 9 | ✅ DONE — `INTEGRATION_TEST_TOKEN` removed from source (task #721). Add to GitHub Secrets | GitHub → Settings → Secrets → Actions | Generate `openssl rand -hex 32`; add as `INTEGRATION_TEST_TOKEN` in GitHub Secrets | Integration tests pass in CI; token not visible in source |
| 10 | Add `REPLIT_PROD_DEPLOY_TOKEN` and `REPLIT_PROD_APP_ID` | GitHub → Settings → Secrets → Actions | Generate in Replit deployment settings for the production deployment; paste both into GitHub Secrets | CD pipeline can deploy to production |
| 11 | Add `REPLIT_STAGING_DEPLOY_TOKEN` and `REPLIT_STAGING_APP_ID` | GitHub → Settings → Secrets → Actions | Generate in Replit deployment settings for staging; paste into GitHub Secrets | CD pipeline can deploy to staging |
| 12 | Add `EXPO_TOKEN` | EAS Secrets / GitHub Secrets | Log into Expo account → Access Tokens → Create; add as `EXPO_TOKEN` in GitHub Secrets | EAS builds succeed in CI |

---

## Category 3 — Mobile App Release Infrastructure

| # | Action | Where | Instruction | Acceptance Test |
|---|--------|--------|-------------|-----------------|
| 13 | Set up Firebase project for CORTEX mobile | Firebase console (console.firebase.google.com) | Create project → Add Android/iOS apps → download `google-services.json` and `GoogleService-Info.plist` → copy to `artifacts/szl-holdings-mobile/` (replacing the placeholder files) | EAS build completes without Firebase config error |
| 14 | Create App Store Connect record for CORTEX | App Store Connect (appstoreconnect.apple.com) | Log in → My Apps → + → New App; set bundle ID `com.szlholdings.executive.mobile`; set name "CORTEX"; fill `appleId`, `ascAppId`, `appleTeamId` in `artifacts/szl-holdings-mobile/eas.json` → `submit.testflight.ios` | App record visible in App Store Connect |
| 15 | Create Google Play Console record for CORTEX | Play Console (play.google.com/console) | Log in → All Apps → Create App; set package name `com.szlholdings.executive.mobile` | App record visible in Play Console |
| 16 | Link EAS project to app store records | Terminal (Expo CLI) | Run `eas init` inside `artifacts/szl-holdings-mobile/`; link to App Store Connect and Play Console records; paste the UUID into `app.json` `extra.eas.projectId` and `updates.url`; flip `updates.enabled` to `true` | `eas build --profile testflight --platform ios` completes successfully |
| 17 | ✅ DONE — iOS Privacy Manifest (`PrivacyInfo.xcprivacy`) created | `artifacts/szl-holdings-mobile/ios/PrivacyInfo.xcprivacy` | File created; `privacyManifests` also configured in `app.config.js` (Expo managed workflow uses the config key; the xcprivacy file is the bare-workflow reference) | App Store submission accepted without Privacy Manifest error |
| 18 | Add `google-play-service-account.json` to EAS Secrets | EAS dashboard | Generate in Google Play Console → Setup → API access → Create service account; grant release manager role; download JSON; upload to EAS | `eas submit --platform android` succeeds |

---

## Category 4 — Domain & Production Configuration

| # | Action | Where | Instruction | Acceptance Test |
|---|--------|--------|-------------|-----------------|
| 19 | Configure custom domain on Replit deployment | Replit deployment settings | Set `app.szlholdings.com` (or chosen domain) → configure DNS A record to Replit IP → verify TLS provisioned | `https://app.szlholdings.com` resolves with valid TLS |
| 20 | Update `CORS_ORIGINS` in production environment | Replit deployment environment variables | Set to `https://app.szlholdings.com` (not wildcard); do not include localhost | API returns correct CORS headers for production domain; rejects other origins |
| 21 | Set `NODE_ENV=production` in production environment | Replit deployment environment variables | Confirm the production deployment has `NODE_ENV=production` | `/api/health` shows `"env":"production"` |
| 22 | Create and monitor `security@szlholdings.com` inbox | Email provider | Set up or confirm email alias exists; test delivery | Sending to `security@szlholdings.com` arrives in monitored inbox |
| 23 | Create and monitor `inquiries@szlholdings.com` inbox | Email provider | Set up or confirm email alias exists; test delivery | Sending to `inquiries@szlholdings.com` arrives in monitored inbox |

---

## Category 5 — Operational Setup

| # | Action | Where | Instruction | Acceptance Test |
|---|--------|--------|-------------|-----------------|
| 24 | Connect Slack webhook to `#ops-alerts` channel | Slack → Your App → Incoming Webhooks | Create Incoming Webhook for `#ops-alerts`; add URL as `SLACK_WEBHOOK_URL` in Replit Secrets | Test alert appears in `#ops-alerts` within 60 seconds |
| 25 | Create smoke test user account in production | Production app login | Create account with a dedicated email (e.g. `smoke@yourdomain.com`) and a unique randomly generated password; store the password in Replit Secrets as `SMOKE_TEST_PASSWORD` — do not use a predictable or shared password | Smoke test auth check returns non-null token |
| 26 | Confirm database backup is accessible | Replit database panel or backup storage | Verify `backup_manifest.json` is current; confirm a restore test has been performed or is scheduled | Backup file is accessible and restore procedure is documented |
| 27 | Rotate all 90-day credentials before launch | Replit Secrets panel | Rotate: `SESSION_SECRET`, `FIELD_ENCRYPTION_KEY`, `CONNECTOR_ENCRYPTION_KEY`, `ALLOY_INTERNAL_TOKEN` | New values in Replit Secrets; old values discarded |

---

## Summary Dashboard

| Category | Total Items | Completed | Remaining |
|----------|------------|-----------|-----------|
| Secrets & Credentials | 8 | 0 | 8 |
| GitHub / CI Secrets | 4 | 0 | 4 |
| Mobile App Release | 6 | 1 | 5 |
| Domain & Production Config | 5 | 0 | 5 |
| Operational Setup | 4 | 0 | 4 |
| **Total** | **27** | **1** | **26** |

Update the "Completed" column as you work through each item.

**Web launch gate (Categories 1, 2, 4, 5):** Items 1–12 and 24–27 must be complete before production web launch. Target: 18/27 for web go-live.

**Mobile launch track (Category 3):** Items 13–18 can run in parallel with web launch. These are not required for web go-live but must be complete before CORTEX mobile TestFlight. Target: 27/27 before mobile submission.

---

*See also: `ops/security/secret-inventory.md` · `ops/cto/next-15-actions.md` · `docs/internal/ops/go-live-sequence.md`*
