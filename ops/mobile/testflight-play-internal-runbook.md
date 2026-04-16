# TestFlight & Play Internal Testing Runbook — CORTEX

Updated: 2026-04-16

## App Reference

**App**: CORTEX  
**Directory**: `artifacts/szl-holdings-mobile`  
**iOS Bundle ID**: `com.szlholdings.executive.mobile`  
**Android Package**: `com.szlholdings.executive.mobile`

---

## Prerequisites

1. Apple Developer Program membership ($99/year) — active
2. Google Play Console developer account ($25 one-time) — active
3. EAS CLI installed: `npm install -g eas-cli`
4. Expo account: `eas login`
5. EAS project linked: run `eas init` inside `artifacts/szl-holdings-mobile`
6. Real Firebase credentials in place (not placeholder files) — see `eas-and-store-secrets-matrix.md`
7. Apple credentials set in `eas.json` (`appleId`, `ascAppId`, `appleTeamId`)

---

## iOS: TestFlight

### First-Time Setup

1. In Apple Developer portal → Certificates, Identifiers & Profiles → Identifiers:
   - Register App ID `com.szlholdings.executive.mobile`
   - Enable: Push Notifications, Associated Domains (if deep linking needed)
2. In App Store Connect → My Apps → "+":
   - Platform: iOS, Name: "CORTEX", Bundle ID: `com.szlholdings.executive.mobile`
   - Note the 10-digit **Apple ID (ASC App ID)** — add to `eas.json`
3. Update `eas.json` with real `appleId`, `ascAppId`, `appleTeamId` values

### Build & Submit to TestFlight

```bash
cd artifacts/szl-holdings-mobile

# 1. Link project to expo.dev (first time only)
eas init

# 2. Build preview build for internal distribution
eas build --profile preview --platform ios

# 3. Submit to TestFlight
eas submit --profile production --platform ios --latest
```

### TestFlight Internal Testing Configuration

1. Go to App Store Connect → CORTEX → TestFlight
2. Create internal testing group "SZL Team"
3. Add testers by Apple ID email (up to 100 internal testers, no review needed)
4. Add test notes:
   ```
   Test Account:
   Email:    demo@szlholdings.com
   Password: [retrieve from password manager — do not write here]

   Key flows:
   1. Launch → biometric prompt → tap "Use PIN" if Face ID not available
   2. Enter PIN: [retrieve from password manager]
   3. Verify 8 domain workspace tiles visible on home screen
   4. Tap any workspace → browse content
   5. Test offline mode: enable airplane mode → verify offline banner appears
   6. Re-enable network → verify sync resumes
   7. Go to Settings → Security → test biometric re-enrollment
   ```
5. Submit build for internal testing (no Apple review required)

### iOS Production Review Submission (when ready)

1. Complete App Privacy Details in App Store Connect
2. Add all screenshots (6.7", 6.5", 5.5" iPhone)
3. Write description, keywords, subtitle
4. Confirm `ITSAppUsesNonExemptEncryption: false` (already set in `app.json`)
5. Submit for review

---

## Android: Play Internal Testing

### First-Time Setup

1. In Google Play Console → Create app:
   - App name: "CORTEX", default language: English (US), type: App, free
2. Complete mandatory store listing fields to unlock internal testing track
3. In Setup → API access:
   - Link to a Google Cloud project
   - Create service account with Release Manager permissions
   - Download JSON key → place at `artifacts/szl-holdings-mobile/google-play-service-account.json`
   - (Template: `google-play-service-account.json.template`)

### Build & Submit to Play Internal Testing

```bash
cd artifacts/szl-holdings-mobile

# Build production AAB
eas build --profile production --platform android

# Submit to Play Console internal track
eas submit --profile production --platform android --latest
```

### Internal Testing Configuration

1. Play Console → CORTEX → Testing → Internal testing → Create new release
2. Upload the AAB (or EAS submit handles this automatically)
3. Add testers: create a list with email addresses
4. Share the opt-in URL with testers
5. Testers accept invite and install from Play Store

---

## Crash & Observability

### Sentry (Recommended Before Alpha)

```bash
# In artifacts/szl-holdings-mobile
pnpm add @sentry/react-native
```

1. Create Sentry project at sentry.io
2. Add `SENTRY_DSN` to EAS secrets: `eas secret:create --name SENTRY_DSN --value <dsn>`
3. Initialize Sentry in the app root layout
4. Monitor crashes at sentry.io after builds

### OTA Updates (After EAS Project is Linked)

Once the real EAS project UUID is set in `app.json` and `updates.enabled` is set to `true`:

```bash
# Push a JS-only OTA update (no store re-submission needed)
eas update --channel production --message "Fix: [description]"
```

---

## Release Cadence

| Phase | Frequency | Audience |
|-------|-----------|----------|
| Alpha | Weekly | Internal team only (TestFlight internal + Play internal) |
| Beta | Bi-weekly | Invited external testers (TestFlight external + Play closed) |
| Production | As needed | Public (App Store + Play Store) |

---

## Rollback

- **iOS**: App Store Connect → TestFlight → stop distributing the current build
- **Android**: Play Console → Testing → halt rollout; revert to previous release
- **OTA rollback**: `eas update --channel production --rollback-to-embedded`

---

## Related Documentation

- Operator setup steps: `artifacts/szl-holdings-mobile/SETUP.md`
- Release readiness matrix: `ops/mobile/flagship-release-readiness.md`
- EAS secrets inventory: `ops/mobile/eas-and-store-secrets-matrix.md`
- Push notification architecture: `ops/mobile/push-notification-setup.md`
- Reviewer notes and test accounts: `ops/mobile/reviewer-notes-and-test-accounts.md`
- Store asset requirements: `ops/mobile/store-asset-inventory.md`
