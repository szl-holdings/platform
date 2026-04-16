# EAS Profiles and Store Secrets Matrix

Updated: 2026-04-16

## Scope

This document covers CORTEX (`artifacts/szl-holdings-mobile`) — the flagship mobile app in
active release preparation. `artifacts/cortex-mobile` is a deferred partial scaffold with no
build config; it is not covered here.

---

## EAS Build Profiles

Defined in `artifacts/szl-holdings-mobile/eas.json`:

| Profile | Distribution | iOS | Android | API Env |
|---------|-------------|-----|---------|---------|
| development | internal | Simulator | APK | `EXPO_PUBLIC_APP_ENV=development` |
| preview | internal | Device | APK | `EXPO_PUBLIC_APP_ENV=preview` |
| production | store | Device (remote creds) | AAB (remote creds) | `EXPO_PUBLIC_APP_ENV=production` |

Key settings:
- `credentialsSource: "remote"` on production (EAS manages signing; no local keystore needed)
- `autoIncrement: true` on production (build number bumps automatically)
- `requireCommit: false` — local uncommitted changes can be included in dev/preview builds

---

## Pre-Build Configuration Required

Before the first EAS build, update these placeholders:

### In `artifacts/szl-holdings-mobile/app.json`

| Field | Current Value | Action |
|-------|--------------|--------|
| `extra.eas.projectId` | `FILL_IN_EAS_PROJECT_UUID` | Run `eas init`; paste real UUID |
| `updates.url` | `https://u.expo.dev/FILL_IN_EAS_PROJECT_UUID` | Update with real UUID after `eas init` |
| `updates.enabled` | `false` | Set to `true` after UUID is populated |

### In `artifacts/szl-holdings-mobile/eas.json`

| Field | Current Value | Action |
|-------|--------------|--------|
| `submit.production.ios.appleId` | `FILL_IN_APPLE_ID_EMAIL` | Set to Apple ID email used for signing |
| `submit.production.ios.ascAppId` | `FILL_IN_APP_STORE_CONNECT_APP_ID` | 10-digit ASC App ID from App Store Connect |
| `submit.production.ios.appleTeamId` | `FILL_IN_APPLE_TEAM_ID` | Team ID from developer.apple.com → Membership |

---

## Secrets Inventory

### EAS / Expo Secrets (set via `eas secret:create` or expo.dev dashboard)

| Secret Name | Required | Purpose |
|-------------|----------|---------|
| `EXPO_TOKEN` | Yes | Automated EAS builds from CI |
| `SENTRY_DSN` | Recommended | Crash reporting (once Sentry is integrated) |

### Apple / iOS

| Item | Source | Where Set | Status |
|------|--------|-----------|--------|
| Apple Developer Apple ID | developer.apple.com | `eas.json` → `submit.production.ios.appleId` | Pending |
| Apple Team ID | developer.apple.com → Membership | `eas.json` → `submit.production.ios.appleTeamId` | Pending |
| ASC App ID | App Store Connect → App Information | `eas.json` → `submit.production.ios.ascAppId` | Pending |
| Distribution Certificate | EAS auto-generated on first production build | EAS remote credentials (expo.dev) | Auto |
| Provisioning Profile | EAS auto-generated | EAS remote credentials (expo.dev) | Auto |
| APNs Auth Key (.p8) | developer.apple.com → Keys | Upload to Firebase Console | Pending |

### Android / Google

| Item | Source | Where Set | Status |
|------|--------|-----------|--------|
| Upload Keystore | EAS auto-generated on first production build | EAS remote credentials (expo.dev) | Auto |
| `google-services.json` | Firebase Console → Android app | `artifacts/szl-holdings-mobile/` root (gitignored) | Placeholder |
| `GoogleService-Info.plist` | Firebase Console → iOS app | `artifacts/szl-holdings-mobile/` root (gitignored) | Placeholder |
| Google Play Service Account JSON | Google Play Console → Setup → API access | `artifacts/szl-holdings-mobile/google-play-service-account.json` (gitignored) | Placeholder |

### Firebase Setup Steps

1. Go to https://console.firebase.google.com → Create project for CORTEX
2. Add Android app with package `com.szlholdings.executive.mobile` → download `google-services.json`
3. Add iOS app with bundle ID `com.szlholdings.executive.mobile` → download `GoogleService-Info.plist`
4. In Project Settings → Cloud Messaging → iOS app, upload APNs Auth Key (.p8)
5. Copy both files to `artifacts/szl-holdings-mobile/` (they are gitignored; use `.template` files as guides)

---

## Credential Files in Repo

| File | Status | Action |
|------|--------|--------|
| `google-services.json` | Placeholder (gitignored) | Replace with real Firebase download |
| `GoogleService-Info.plist` | Placeholder (gitignored) | Replace with real Firebase download |
| `google-play-service-account.json` | Placeholder (gitignored) | Replace with real Play Console key |
| `google-services.json.template` | Template — safe to commit | Reference for structure; copy to `google-services.json` |
| `GoogleService-Info.plist.template` | Template — safe to commit | Reference for structure; copy to `GoogleService-Info.plist` |
| `google-play-service-account.json.template` | Template — safe to commit | Reference for structure; copy to `google-play-service-account.json` |
| `google-services.example.json` | Legacy example — safe to commit | Superseded by `.template` files |
| `GoogleService-Info.example.plist` | Legacy example — safe to commit | Superseded by `.template` files |
| `google-play-service-account.example.json` | Legacy example — safe to commit | Superseded by `.template` files |

---

## `.gitignore` Status

The following are confirmed excluded in `artifacts/szl-holdings-mobile/.gitignore`:

```
google-services.json
GoogleService-Info.plist
google-play-service-account.json
.expo/credentials.json
```

---

## CI Secrets (GitHub Actions)

If EAS builds are triggered from CI:

| Secret Name | GitHub Secrets Path | Value Source |
|-------------|---------------------|--------------|
| `EXPO_TOKEN` | Repository → Secrets | expo.dev → Account → Access Tokens |
| `APPLE_TEAM_ID` | Repository → Secrets | developer.apple.com → Membership |
| `ASC_APP_ID` | Repository → Secrets | App Store Connect |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Repository → Secrets | Google Play Console (base64-encoded JSON) |

---

## Secrets Rotation Policy

| Secret | Rotation Trigger | Action |
|--------|-----------------|--------|
| `EXPO_TOKEN` | Annually or on team change | Revoke old, create new, update CI |
| Upload Keystore | Never (loss = resubmit to Play Store as new app) | Back up via `eas credentials --platform android` |
| APNs Key | If revoked in Apple portal | Regenerate, re-upload to Firebase |
| Firebase configs | On project recreation | Re-download and replace local files |

---

*Supersedes: `ops/mobile/eas-secrets-matrix.md` (retained as historical reference only)*
