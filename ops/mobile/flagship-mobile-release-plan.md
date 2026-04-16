# Flagship Mobile Release Plan — CORTEX

> **DEPRECATED** — This document has been superseded by [`ops/mobile/flagship-release-readiness.md`](flagship-release-readiness.md).
> This file is retained for historical reference only. Do not update it.

Generated: 2026-04-15

## Overview

CORTEX (artifacts/cortex-mobile) is the flagship mobile command center for SZL Holdings. It provides unified access to all 8 business domains in a single native app.

## Release Ladder

| Priority | App | Target | Status |
|----------|-----|--------|--------|
| 1 | CORTEX (cortex-mobile) | TestFlight + Play Internal | Alpha-ready |
| 2 | SZL Holdings Mobile (szl-holdings-mobile) | After CORTEX | Deferred |

## Pre-Release Checklist

### App Configuration
- [ ] Bundle identifier: `com.szlholdings.cortex` (verify in app.json)
- [ ] Version: 1.0.0
- [ ] Build number: auto-increment via EAS
- [ ] App icons: all sizes generated
- [ ] Splash screen: branded, fast load
- [ ] Deep linking scheme configured

### Authentication
- [x] Biometric auth (Face ID/Touch ID) via expo-local-authentication
- [x] PIN setup with SHA-256 hashing via expo-crypto
- [x] Secure storage via expo-secure-store
- [x] 5-attempt lockout with 30s cooldown
- [ ] Auth flow tested on physical device

### Permissions
- [ ] Camera: rationale string for AR features
- [ ] Location: rationale for geospatial features
- [ ] Notifications: rationale for daily digest
- [ ] Screen capture: prevention for sensitive workspaces

### Offline
- [x] SyncEngineProvider + OfflineBanner in mobile-shared
- [ ] Verify offline mode on airplane mode
- [ ] Verify sync on reconnection

### Push Notifications
- [x] expo-notifications configured
- [x] Daily digest scheduling
- [ ] Push token registration with backend
- [ ] Test notification delivery

## EAS Configuration

### Build Profiles (eas.json)
```json
{
  "build": {
    "development": {
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "<APPLE_ID>",
        "ascAppId": "<ASC_APP_ID>",
        "appleTeamId": "<TEAM_ID>"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json"
      }
    }
  }
}
```

### EAS Secrets
```
EXPO_TOKEN                    # For CI-triggered builds
APPLE_TEAM_ID                 # Apple Developer Team ID
ASC_APP_ID                    # App Store Connect App ID
```

## TestFlight Submission

1. Run: `eas build --platform ios --profile production`
2. Run: `eas submit --platform ios`
3. Create TestFlight test group
4. Add internal testers
5. Provide test account credentials in TestFlight notes

## Play Internal Testing

1. Run: `eas build --platform android --profile production`
2. Upload to Play Console > Internal testing
3. Create tester list
4. Share opt-in link

## Store Listing Assets Needed

| Asset | Spec | Status |
|-------|------|--------|
| App icon | 1024x1024 PNG | Needed |
| iPhone screenshots (6.7") | 1290x2796 | Needed |
| iPhone screenshots (6.5") | 1284x2778 | Needed |
| iPad screenshots | 2048x2732 | Needed |
| Android phone screenshots | 1080x1920 | Needed |
| Feature graphic (Android) | 1024x500 | Needed |
| App description | 4000 chars max | Draft needed |
| Keywords | 100 chars (iOS) | Draft needed |
| Privacy policy URL | Required | szlholdings.com/legal/privacy |

## Privacy & Compliance

### iOS Privacy Manifest
- [ ] NSPrivacyTrackedData: define tracked data categories
- [ ] NSPrivacyCollectedData: define collected data types
- [ ] Required reason APIs: verify usage declarations

### Data Collection Disclosure (Both Platforms)
- Authentication data (email, name)
- Usage analytics (anonymous)
- Push notification tokens
- Biometric data (processed on-device only, never transmitted)
