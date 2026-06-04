# Manual Actions Remaining

Updated: 2026-04-16

## About This Document

This document lists every action that cannot be automated or implemented by the AI agent — things that require founder decision, external accounts, credentials, vendor relationships, or physical device access. Items are ordered by priority.

---

## Category 1: Mobile Release Prerequisites (CORTEX)

These block the TestFlight Alpha.

| # | Action | Who | Effort | Dependency |
|---|--------|-----|--------|------------|
| M1 | Create Apple Developer Program account ($99/year) at developer.apple.com | Founder | 30 min + 24–48h approval | None |
| M2 | Create Google Play Console account ($25 one-time) at play.google.com/console | Founder | 15 min | None |
| M3 | Create CORTEX app record in App Store Connect; note ASC App ID | Founder | 15 min | M1 |
| M4 | Create CORTEX app record in Google Play Console | Founder | 15 min | M2 |
| M5 | Create Firebase project for CORTEX; download `google-services.json` and `GoogleService-Info.plist` | Founder | 30 min | None |
| M6 | Replace placeholder Firebase files in `artifacts/cortex-mobile/` with real files (gitignored) | Founder/Dev | 10 min | M5 |
| M7 | Create APNs auth key in Apple Developer portal; upload to Firebase Console | Founder | 15 min | M1, M5 |
| M8 | Create Google Play Service Account JSON; place in `artifacts/cortex-mobile/` (gitignored) | Founder | 30 min | M2 |
| M9 | Run `eas init` in `artifacts/cortex-mobile/` to link to real EAS project | Dev | 5 min | Expo account |
| M10 | Update `eas.json` with real Apple ID, Team ID, ASC App ID | Dev | 10 min | M1, M3 |
| M11 | Store all secrets in team password manager (demo PIN, test account credentials) | Founder | 15 min | None |
| M12 | Test CORTEX on physical iOS and Android devices | Dev/Founder | 2–4 hours | M6, M9 |
| M13 | Capture store screenshots on physical device or simulator | Dev | 2 hours | M12 |
| M14 | Commission CORTEX app icon (1024×1024 PNG, dark brand aesthetic) | Design | 1–2 days | None |
| M15 | Create Privacy Policy page at szlholdings.com/legal/privacy | Legal/Dev | 2 hours | None |
| M16 | Create Support page at szlholdings.com/contact | Dev | 1 hour | None |
| M17 | Submit CORTEX to TestFlight and Play Internal Testing | Dev | 1 hour | All above |

---

## Category 2: Infrastructure and Production

| # | Action | Who | Effort | Dependency |
|---|--------|-----|--------|------------|
| I1 | Create Azure account and resource group `szl-production` | Founder | 30 min | None |
| I2 | Run `az deployment group create` with Bicep templates from `/infra/` | DevOps | 2 hours | I1 |
| I3 | Configure Azure Key Vault secrets (DATABASE_URL, SESSION_SECRET, etc.) | DevOps | 1 hour | I2 |
| I4 | Configure custom domain DNS records at registrar (CNAME to Front Door) | Founder | 30 min | I2 |
| I5 | Migrate database from Replit PostgreSQL to Azure PostgreSQL | DevOps | 4 hours | I1–I4 |
| I6 | Configure GitHub Secrets for CI deployment to Azure | DevOps | 1 hour | I1 |
| I7 | Test disaster recovery: restore from backup to scratch DB and verify | DevOps | 2–3 hours | None (can do now) |
| I8 | Set up uptime monitoring alerts (Replit health check or Azure Monitor) | DevOps | 1 hour | None |

---

## Category 3: Data and API Wiring

These items require code development but are called out here because they also need data contracts/decisions:

| # | Action | Who | Notes |
|---|--------|-----|-------|
| D1 | Wire CORTEX badge counts to live API signals | Dev | Outstanding task in backlog |
| D2 | Add deep linking so push notifications open correct workspace | Dev | Requires `cortex://` scheme + backend notification payload changes |
| D3 | Connect Forge Client Satisfaction to real survey data | Dev | Outstanding task |
| D4 | Wire Autopilot header stats to live API data | Dev | Outstanding task |
| D5 | Connect Vessels commercial modules to live database | Dev | Outstanding task |
| D6 | Connect Aegis security modules to live API data | Dev | Outstanding task |
| D7 | Implement `/api/push/register` endpoint for mobile push tokens | Dev | Required before push notifications work |

---

## Category 4: Legal and Compliance

| # | Action | Who | Notes |
|---|--------|-----|-------|
| L1 | Publish Privacy Policy at szlholdings.com/legal/privacy | Legal | Required for app store submissions |
| L2 | Publish Terms of Service at szlholdings.com/legal/terms | Legal | Required for enterprise customers |
| L3 | Complete iOS Privacy Manifest (`PrivacyInfo.xcprivacy`) | Dev + Legal | Required for iOS 17+ apps |
| L4 | Complete App Store Content Rating questionnaire | Founder | During app record creation |
| L5 | Complete Android Target Audience declaration | Founder | During Play Console setup |
| L6 | GDPR data deletion procedure documented and tested | Legal + Dev | Required before EU customers |

---

## Category 5: External Accounts and Services

| # | Action | Who | Notes |
|---|--------|-----|-------|
| E1 | Create Expo account at expo.dev | Founder/Dev | Required for EAS builds |
| E2 | Create Sentry account for crash monitoring | Dev | Recommended before Alpha |
| E3 | Set up domain email: mobile-feedback@szlholdings.com | Founder | For beta tester feedback |
| E4 | Configure Replit environment secrets for staging namespace | Dev | `STAGING_*` prefix secrets |
| E5 | Invite first beta testers via TestFlight / Play Internal | Founder | After M17 complete |

---

## Priority Summary

| Priority | Actions | Unlocks |
|----------|---------|---------|
| P0 (This week) | M1, M2, M5, E1 | CORTEX Alpha path begins |
| P1 (Next 2 weeks) | M3–M17, I7 | TestFlight Alpha |
| P2 (Next month) | I1–I8, D1–D7 | Enterprise readiness |
| P3 (Quarter) | L1–L6, E2–E5 | Compliance and scale |

---

*This document is the definitive list of founder/human actions. Update items with completion dates as they are resolved.*
