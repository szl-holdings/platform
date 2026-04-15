# TestFlight & Play Internal Testing Runbook

Generated: 2026-04-15

## Prerequisites

1. Apple Developer Program membership ($99/year)
2. Google Play Console developer account ($25 one-time)
3. EAS CLI installed: `npm install -g eas-cli`
4. Expo account: `eas login`
5. EAS project linked: `eas init` in cortex-mobile directory

## iOS: TestFlight

### First-Time Setup
1. Create App ID in Apple Developer portal
2. Create app in App Store Connect
3. Note the Apple Team ID and ASC App ID
4. Configure eas.json with iOS submit settings

### Build & Submit
```bash
cd artifacts/cortex-mobile

# Build production iOS binary
eas build --platform ios --profile production

# Submit to TestFlight
eas submit --platform ios --latest
```

### TestFlight Configuration
1. Go to App Store Connect > Your App > TestFlight
2. Create internal testing group "SZL Team"
3. Add testers by Apple ID email
4. Add test notes:
   ```
   Test Account:
   Email: demo@szlholdings.com
   Password: [provided separately]

   Key flows to test:
   1. Login and workspace selection
   2. Signal feed browsing
   3. Voice command (tap mic icon)
   4. Quick action card swiping
   5. Biometric setup in Settings > Security
   6. Offline mode (enable airplane mode)
   ```
5. Submit build for internal testing (no review needed)

### Review Submission (when ready for public)
1. Complete app privacy details
2. Submit Privacy Manifest
3. Add all screenshots and metadata
4. Submit for review

## Android: Play Internal Testing

### First-Time Setup
1. Create app in Google Play Console
2. Create Google Service Account for automated uploads
3. Download service account JSON key
4. Configure eas.json with Android submit settings

### Build & Submit
```bash
cd artifacts/cortex-mobile

# Build production Android binary (AAB)
eas build --platform android --profile production

# Submit to Play Console
eas submit --platform android --latest
```

### Internal Testing Configuration
1. Go to Play Console > Your App > Testing > Internal testing
2. Create new release from uploaded AAB
3. Create tester list with email addresses
4. Share opt-in URL with testers
5. Testers accept invite and download from Play Store

## Crash & Telemetry

### Sentry Setup
1. Add `sentry-expo` to cortex-mobile
2. Configure DSN in app.json
3. Add source maps upload to EAS build
4. Monitor crashes in Sentry dashboard

### Analytics
1. Add expo-analytics or PostHog mobile SDK
2. Track: screen views, feature usage, session duration
3. Monitor: crash rate, launch time, sync performance

## Release Cadence

| Phase | Frequency | Audience |
|-------|-----------|----------|
| Alpha | Weekly | Internal team only |
| Beta | Bi-weekly | Invited testers |
| Production | Monthly | Public |

## Rollback

1. In App Store Connect: Stop distributing current build
2. In Play Console: Halt rollout, revert to previous version
3. EAS builds are versioned — rebuild previous commit if needed
