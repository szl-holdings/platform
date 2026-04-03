# Lyte Mobile — Primary Mobile Release Plan

**App**: Lyte — AIOps Command  
**Target Platform**: iOS (primary) + Android  
**Bundle ID (iOS)**: `com.lyte.aiops.mobile`  
**Package (Android)**: `com.lyte.aiops.mobile`  
**Version**: 1.0.0 (Build 1)

---

## Release Phases

### Phase 1 — Internal Dev Build
- Build a development client using EAS Build (`eas build --profile development`)
- Install on physical test devices via TestFlight (iOS) or direct APK (Android)
- Connect to local or staging API (`EXPO_PUBLIC_ENV=development`)
- Validate: auth flows, token refresh, push notifications, offline mode banner

### Phase 2 — Preview (Internal Staging)
- Build internal distribution build: `eas build --profile preview`
- Distribute to QA team via TestFlight internal track / Android APK
- Connect to staging API (`EXPO_PUBLIC_ENV=preview`)
- Validate: all tabs (Inbox, Health, Signals, Alerts, PRISM, Profile), crash reporting, analytics

### Phase 3 — Production Build
- Increment `versionCode` / `buildNumber` in app.json or via EAS `autoIncrement`
- Build: `eas build --profile production --platform all`
- Submit iOS: `eas submit --profile production --platform ios`
- Submit Android: `eas submit --profile production --platform android`

---

## Pre-submission Checklist

### App Identity
- [x] App name: "Lyte — AIOps Command"
- [x] Bundle identifier (iOS): `com.lyte.aiops.mobile`
- [x] Package name (Android): `com.lyte.aiops.mobile`
- [x] EAS Project ID set in app.json `extra.eas.projectId`
- [ ] Actual EAS Project ID registered on expo.dev (replace placeholder)
- [ ] Apple App Store Connect App ID (replace `FILL_IN_APP_STORE_CONNECT_APP_ID`)
- [ ] Apple Team ID (replace `FILL_IN_APPLE_TEAM_ID`)
- [ ] Google Play service account key (`google-play-key.json`) obtained and secured

### API & Environment
- [x] `EXPO_PUBLIC_ENV` switches correctly per EAS build profile
- [x] Dev: points to Replit dev domain API
- [x] Preview: points to `lyte-api-staging.lyte.ai`
- [x] Production: points to `api.lyte.ai`
- [x] Auth token refresh implemented with offline-safe handling (AuthContext)
- [x] Token expiry tracking and proactive refresh 5 minutes before expiry

### Assets
- [x] App icon: `./assets/images/icon.png` (1024×1024 PNG)
- [x] Splash screen: `./assets/images/splash-icon.png`
- [x] Adaptive icon (Android): configured with `#070c14` background
- [ ] App Store screenshots (6.7", 6.5", 5.5" for iOS; various for Android) — prepare 3–5 screens
- [ ] App preview video (optional but recommended)

### Permissions
- [x] Camera: "Lyte uses your camera to scan QR codes for device configuration."
- [x] Photo library access described
- [x] Face ID permission string set
- [x] `ITSAppUsesNonExemptEncryption: false` set (avoids encryption export compliance)
- [x] iOS Privacy Manifest (`NSPrivacyAccessedAPITypes`) configured
- [x] Android biometric permissions declared

### Crash Reporting & Observability
- [ ] Sentry (or equivalent) integrated — install `expo-sentry` and configure DSN
- [ ] Analytics events wired (active users, session length, key feature usage)

### Store Metadata
- [ ] App description (max 4000 chars for App Store, 4000 chars for Google Play)
- [ ] Short description (80 chars max for Google Play)
- [ ] Keywords / search tags
- [ ] Privacy policy URL: `https://lyte.ai/privacy`
- [ ] Support URL: `https://lyte.ai/support`
- [ ] Category: Business / Developer Tools
- [ ] Age rating: 4+

### Policies
- [x] Privacy policy URL configured in `app.json` extra
- [x] Terms of service URL configured
- [x] No personal data sold to third parties (confirm with legal)

---

## EAS Configuration Summary

See `eas.json` for the full EAS build/submit profile configuration.

| Profile     | Distribution | Android      | iOS Simulator | API Env       |
|-------------|-------------|--------------|---------------|---------------|
| development | internal     | APK          | yes           | development   |
| preview     | internal     | APK          | no            | preview       |
| production  | store        | App Bundle   | no            | production    |

---

## Dry-Run Build Commands

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Log in to Expo account
eas login

# Create/link project on expo.dev (first time)
eas init

# Build for iOS simulator (dev)
eas build --profile development --platform ios --local

# Build for Android APK (preview, internal)
eas build --profile preview --platform android

# Build production app bundle (both platforms)
eas build --profile production --platform all

# Submit to stores (after production build)
eas submit --profile production --platform ios
eas submit --profile production --platform android

# OTA update (after app is live)
eas update --channel production --message "Bug fixes and performance improvements"
```

---

## Post-Launch

- Monitor crash reports in Sentry dashboard
- Watch push notification delivery rates
- Review App Store / Google Play reviews weekly
- Plan OTA updates for minor fixes (no re-submission required with EAS Update)
- Plan store re-submissions for native code changes only
