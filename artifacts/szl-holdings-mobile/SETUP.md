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

## Step 5b — Set EAS Build Environment Variables

The app needs two runtime environment variables to reach the backend API and
authenticate users. These must be set as **EAS secrets** so they are baked into
the binary at build time.

```bash
cd artifacts/szl-holdings-mobile

# The production Replit domain (no https://, no trailing slash)
# Example: "myapp.replit.app" or the custom domain you have configured
eas secret:create --scope project --name EXPO_PUBLIC_DOMAIN --value "YOUR_REPLIT_DEV_DOMAIN"

# The Replit app / OAuth client ID (shown in the Replit project settings)
eas secret:create --scope project --name EXPO_PUBLIC_REPL_ID --value "YOUR_REPL_ID"
```

Without `EXPO_PUBLIC_DOMAIN` the app will start but all API calls will fail
silently. Without `EXPO_PUBLIC_REPL_ID` the OAuth login flow will not work.
Both are required for a functional investor demo.

> **Finding these values on Replit:**
> - `EXPO_PUBLIC_DOMAIN`: the public preview URL hostname, e.g. `your-project.username.repl.co`
> - `EXPO_PUBLIC_REPL_ID`: visible in the URL bar of the Replit editor, or via `echo $REPL_ID` in the shell

---

## Step 6 — First Build (Preview / Internal Distribution)

```bash
cd artifacts/szl-holdings-mobile

# Recommended: use the dedicated TestFlight profile
eas build --profile testflight --platform ios

# Or build for both platforms at once (preview profile)
eas build --profile preview --platform all

# This is the TestFlight / Play internal testing build.
# EAS will manage signing credentials automatically on first run.
```

---

## Step 7 — Submit to TestFlight

Before running `eas submit`, ensure the submit fields in `eas.json` are filled in
under `submit.testflight.ios` (not `submit.production.ios`):

```json
"submit": {
  "testflight": {
    "ios": {
      "appleId": "your-apple-id@example.com",
      "ascAppId": "1234567890",
      "appleTeamId": "XXXXXXXXXX"
    }
  }
}
```

Then submit:

```bash
# Submit the testflight build to App Store Connect for internal testing
eas submit --profile testflight --platform ios --latest
```

Go to App Store Connect → TestFlight → add internal testers.

---

## Step 8 — Submit to Play Internal Testing

```bash
eas submit --profile production --platform android --latest
```

Go to Play Console → Testing → Internal Testing → create release from uploaded AAB.

---

## Step 9 — Investor Preview Without Expo Go or TestFlight

Investors who haven't installed Expo Go or received a TestFlight invitation can still
preview the full app via Expo's hosted web build. This requires no app store, no device
configuration, and no login to Expo.

### Option A — Expo Web (fastest, no install)

```bash
cd artifacts/szl-holdings-mobile

# Start the app in web mode with demo fixtures enabled (no live API required)
EXPO_PUBLIC_APP_MODE=demo npx expo start --web

# The app runs at the Replit preview URL:
#   https://YOUR_REPL_DEV_DOMAIN/szl-holdings-mobile/
```

Share the Replit preview URL with investors. The app runs in the browser with the full
CORTEX UI (Command Feed, CORTEX Intelligence, Portfolio Investor tab, FusionBar). No
app store account or device enrollment required.

> **Local vs EAS env vars**: `EXPO_PUBLIC_APP_MODE=demo` must be set in the **local
> shell** when running `npx expo start --web` (as shown above). EAS secrets only apply
> to EAS-managed builds — they do not affect local dev server sessions. The `.env`
> file approach also works: add `EXPO_PUBLIC_APP_MODE=demo` to a local `.env` file in
> the `artifacts/szl-holdings-mobile/` directory.
>
> **Demo fixture behavior**: In demo mode, POST endpoints like the FusionBar query and
> What-If scenario engine return static fixture responses regardless of the query
> submitted. This is intentional — it guarantees a polished, consistent demo without
> a live backend. The fixtures are defined in `lib/apiClient.ts`.

### Option B — Expo Go QR Code (iOS/Android)

```bash
npx expo start
# Scan the QR code with Expo Go (available free on the App Store)
```

Investors scan the QR code to preview the app instantly on their iPhone or Android.
No TestFlight enrollment needed, but Expo Go must be installed.

### Option C — TestFlight (production-ready, preferred for investor demos)

Complete Steps 1–7 above and send investors a TestFlight link via App Store Connect.
The TestFlight build uses `credentialsSource: "remote"` so no local signing files
are required — EAS manages the entire signing credential chain.

---

## Credential Checklist

Before running Step 6:

- [ ] Real EAS project UUID in `app.json` (`extra.eas.projectId` and `updates.url`)
- [ ] `updates.enabled` set to `true` in `app.json`
- [ ] `EXPO_PUBLIC_DOMAIN` EAS secret set to the Replit production domain
- [ ] `EXPO_PUBLIC_REPL_ID` EAS secret set to the Replit project ID
- [ ] `EXPO_PUBLIC_APP_MODE` set to `demo` for investor-demo builds (enables built-in fixtures, no live API required)
- [ ] `google-services.json` is the real Firebase file (not the placeholder)
- [ ] `GoogleService-Info.plist` is the real Firebase file (not the placeholder)
- [ ] APNs key uploaded to Firebase Console
- [ ] `eas.json` Apple fields filled in (`appleId`, `ascAppId`, `appleTeamId`) under `submit.testflight.ios`
- [ ] `google-play-service-account.json` is the real Play Console service account key
- [ ] All four build profiles (`device-development`, `preview`, `testflight`, `production`) use `credentialsSource: "remote"` ✓

---

## Reference

- **Investor demo preflight**: `ops/mobile/testflight-investor-demo-preflight.md`
- Full readiness matrix: `ops/mobile/flagship-release-readiness.md`
- EAS secrets inventory: `ops/mobile/eas-and-store-secrets-matrix.md`
- Push notification setup: `ops/mobile/push-notification-setup.md`
- TestFlight runbook: `ops/mobile/testflight-play-internal-runbook.md`
