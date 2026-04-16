# CORTEX Mobile — First-Run Setup Guide

This guide walks you through the exact steps needed to go from this repo to a working
TestFlight internal build. Complete each step in order.

---

## Step 1 — Expo Account and EAS CLI

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Log in to your Expo account (create one at expo.dev if needed)
eas login
```

---

## Step 2 — Link the EAS Project

Run this from inside the app directory:

```bash
cd artifacts/szl-holdings-mobile
eas init
```

EAS will create or link a project on expo.dev and print a UUID like
`f47ac10b-58cc-4372-a567-0e02b2c3d479`.

Update **two places** with this UUID:

**`app.json`** (two fields to update, plus re-enable OTA):
```json
"extra": {
  "eas": {
    "projectId": "PASTE_UUID_HERE"
  }
},
"updates": {
  "enabled": true,           // <-- IMPORTANT: change this from false to true
  "url": "https://u.expo.dev/PASTE_UUID_HERE"
}
```

> **Note**: `updates.enabled` ships as `false` in the repo to prevent accidental OTA
> update attempts before a real EAS project exists. You must flip it to `true` once
> the UUID is set, or OTA push updates will silently do nothing.

---

## Step 3 — Firebase Credentials

1. Go to https://console.firebase.google.com → Create project → name it "CORTEX SZL Holdings"
2. Add Android app:
   - Package: `com.szlholdings.executive.mobile`
   - Download `google-services.json` → copy to `artifacts/szl-holdings-mobile/google-services.json`
3. Add iOS app:
   - Bundle ID: `com.szlholdings.executive.mobile`
   - Download `GoogleService-Info.plist` → copy to `artifacts/szl-holdings-mobile/GoogleService-Info.plist`
4. In Firebase → Project Settings → Cloud Messaging → iOS app:
   - Upload your APNs Auth Key (.p8), Key ID, and Team ID

These files are gitignored. See `*.template` files for the expected structure.

---

## Step 4 — Apple Credentials (iOS only)

Update `eas.json` `submit.production.ios` with real values:

| Field | Where to Find |
|-------|--------------|
| `appleId` | Your Apple ID email |
| `appleTeamId` | developer.apple.com → Membership → Team ID |
| `ascAppId` | App Store Connect → App Information → Apple ID |

To get `ascAppId`, first create the app record in App Store Connect:
1. Go to https://appstoreconnect.apple.com → My Apps → "+"
2. iOS app, name: "CORTEX", bundle ID: `com.szlholdings.executive.mobile`
3. The 10-digit Apple ID shown on the App Information page is the `ascAppId`

---

## Step 5 — Google Play Credentials (Android only)

1. In Google Play Console → Setup → API access:
   - Link to a Google Cloud project → Create service account → Role: Release Manager
   - Create JSON key → download
2. Copy to `artifacts/szl-holdings-mobile/google-play-service-account.json` (gitignored)
3. In Play Console, create the app record:
   - App name: "CORTEX — Unified Command", package: `com.szlholdings.executive.mobile`

---

## Step 6 — First Build (Preview / Internal Distribution)

```bash
cd artifacts/szl-holdings-mobile

# Internal iOS build (device, no simulator) + Android APK
eas build --profile preview --platform all

# This is the TestFlight / Play internal testing build.
# EAS will manage signing credentials automatically on first run.
```

---

## Step 7 — Submit to TestFlight

```bash
# After the preview build completes:
eas submit --profile production --platform ios --latest
```

Go to App Store Connect → TestFlight → add internal testers.

---

## Step 8 — Submit to Play Internal Testing

```bash
eas submit --profile production --platform android --latest
```

Go to Play Console → Testing → Internal Testing → create release from uploaded AAB.

---

## Credential Checklist

Before running Step 6:

- [ ] Real EAS project UUID in `app.json` (`extra.eas.projectId` and `updates.url`)
- [ ] `updates.enabled` set to `true` in `app.json`
- [ ] `google-services.json` is the real Firebase file (not the placeholder)
- [ ] `GoogleService-Info.plist` is the real Firebase file (not the placeholder)
- [ ] APNs key uploaded to Firebase Console
- [ ] `eas.json` Apple fields filled in (for `eas submit` only; not needed for build)
- [ ] `google-play-service-account.json` is the real Play Console service account key

---

## Reference

- Full readiness matrix: `ops/mobile/flagship-release-readiness.md`
- EAS secrets inventory: `ops/mobile/eas-and-store-secrets-matrix.md`
- Push notification setup: `ops/mobile/push-notification-setup.md`
- TestFlight runbook: `ops/mobile/testflight-play-internal-runbook.md`
