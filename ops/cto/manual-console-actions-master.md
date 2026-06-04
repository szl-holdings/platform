# Manual Console Actions — Master List

Updated: 2026-04-16
Authority: CTO Pass Phase I

This is the single authoritative reference for every action that cannot be automated from the repo. All items must be completed by a human operator with access to the respective external console before a CORTEX build can be submitted to TestFlight or Play Internal Testing.

---

## How to Use This Document

Work through each section in order before attempting `eas build`. Items marked **Alpha Blocker** must be complete before the first build. Items marked **Submit Blocker** must be complete before `eas submit`. Items marked **Post-Alpha** can wait until the Beta gate.

---

## 1. Expo Console (expo.dev)

| # | Action | Blocker Level | Notes |
|---|--------|--------------|-------|
| 1.1 | Create Expo account if not already active | Alpha Blocker | expo.dev → Sign up |
| 1.2 | Run `eas login` inside `artifacts/szl-holdings-mobile` | Alpha Blocker | Authenticates EAS CLI |
| 1.3 | Run `eas init` inside `artifacts/szl-holdings-mobile` | Alpha Blocker | Creates project on expo.dev, generates real UUID |
| 1.4 | Copy the UUID from `eas init` output | Alpha Blocker | Replace `FILL_IN_EAS_PROJECT_UUID` in `app.json` (2 places: `extra.eas.projectId` and `updates.url`) |
| 1.5 | Set `updates.enabled: true` in `app.json` | Post-Alpha | Only after real UUID is in place |
| 1.6 | In expo.dev → Project → Secrets, set `EXPO_TOKEN` | Alpha Blocker if using CI | Required for CI-triggered EAS builds; optional for local builds |
| 1.7 | Verify the project appears at expo.dev/accounts/[org]/projects | Verification | Confirm `eas init` completed successfully |

---

## 2. Apple Console (developer.apple.com + appstoreconnect.apple.com)

### Apple Developer Portal

| # | Action | Blocker Level | Notes |
|---|--------|--------------|-------|
| 2.1 | Confirm Apple Developer Program membership is active ($99/year) | Alpha Blocker | developer.apple.com → Account |
| 2.2 | Register App ID `com.szlholdings.executive.mobile` | Alpha Blocker | Certificates, Identifiers & Profiles → Identifiers → "+" → App IDs |
| 2.3 | Enable capabilities: Push Notifications, Associated Domains | Alpha Blocker | On the App ID just registered |
| 2.4 | Note your Team ID (10-character string) | Submit Blocker | Membership → Team ID |
| 2.5 | Create APNs Auth Key (.p8 file) | Alpha Blocker (push) | Keys → "+" → Apple Push Notifications service (APNs) → Download and store securely |
| 2.6 | Upload APNs key to Firebase Console (iOS app) | Alpha Blocker (push) | Firebase → Project Settings → Cloud Messaging → APNs Auth Key |

### App Store Connect

| # | Action | Blocker Level | Notes |
|---|--------|--------------|-------|
| 2.7 | Create new app in App Store Connect | Submit Blocker | My Apps → "+" → Platform: iOS, Name: "CORTEX", Bundle ID: `com.szlholdings.executive.mobile` |
| 2.8 | Note the 10-digit ASC App ID | Submit Blocker | Shown on the App Information page after creation |
| 2.9 | Update `eas.json` with `appleId`, `ascAppId`, `appleTeamId` | Submit Blocker | Required for `eas submit --platform ios` |
| 2.10 | Create TestFlight internal group "SZL Team" | Alpha Blocker | TestFlight → "+" → Add testers by Apple ID email |
| 2.11 | Add internal tester Apple IDs | Alpha Blocker | Up to 100 testers; no App Review required for internal group |
| 2.12 | Complete App Privacy Details | Submit Blocker (public) | App Store Connect → Privacy → Data Types. Declare: authentication identifiers, push tokens. Biometric data: on-device only, not collected. |
| 2.13 | Upload 6.7" iPhone screenshots (1290×2796) | Submit Blocker (public) | Minimum 3 required. See `ops/mobile/store-asset-inventory.md` for content plan. |
| 2.14 | Upload 6.5" iPhone screenshots (1284×2778) | Submit Blocker (public) | Minimum 3 required |
| 2.15 | Enter app name, subtitle, description, keywords | Submit Blocker (public) | See approved copy in `ops/mobile/store-asset-inventory.md` |
| 2.16 | Set support URL and privacy policy URL | Submit Blocker (public) | `https://szlholdings.com/contact` and `https://szlholdings.com/legal/privacy` |
| 2.17 | Complete App Review Information (test account + notes) | Submit Blocker (public) | Copy from `ops/mobile/reviewer-notes-and-test-accounts.md` |

---

## 3. Google Console (play.google.com/console + Firebase Console)

### Google Play Console

| # | Action | Blocker Level | Notes |
|---|--------|--------------|-------|
| 3.1 | Confirm Google Play Console developer account is active ($25 one-time) | Alpha Blocker | play.google.com/console |
| 3.2 | Create new app: "CORTEX", English (US), App, Free | Alpha Blocker | "Create app" in Play Console dashboard |
| 3.3 | Complete mandatory store listing fields to unlock internal testing track | Alpha Blocker | Short description, full description, email, privacy policy URL |
| 3.4 | Set up Google Cloud API access for automated submission | Submit Blocker | Play Console → Setup → API access → Link to Google Cloud project |
| 3.5 | Create service account with Release Manager role | Submit Blocker | Google Cloud Console → IAM & Admin → Service Accounts |
| 3.6 | Download service account JSON key | Submit Blocker | Place at `artifacts/szl-holdings-mobile/google-play-service-account.json` (gitignored) |
| 3.7 | Upload the JSON key path to `eas.json` submit config | Submit Blocker | `android.serviceAccountKeyPath: "./google-play-service-account.json"` |
| 3.8 | Create internal testing track release | Alpha Blocker | Testing → Internal testing → Create new release |
| 3.9 | Create tester list with email addresses | Alpha Blocker | Testing → Internal testing → Testers tab |
| 3.10 | Share opt-in URL with testers | Alpha Blocker | Testers click the link to opt in and install from Play Store |
| 3.11 | Upload phone screenshots (1080×1920 min) | Submit Blocker (public) | 2–8 required. See `ops/mobile/store-asset-inventory.md`. |
| 3.12 | Upload feature graphic (1024×500) | Submit Blocker (public) | Required for Play Store listing |
| 3.13 | Complete content rating questionnaire | Submit Blocker (public) | Policy → App content → Content rating |
| 3.14 | Set target audience to 18+ | Submit Blocker (public) | Policy → App content → Target audience |

### Firebase Console (console.firebase.google.com)

| # | Action | Blocker Level | Notes |
|---|--------|--------------|-------|
| 3.15 | Create Firebase project (if not already created) | Alpha Blocker | console.firebase.google.com → "Create a project" |
| 3.16 | Add iOS app with bundle ID `com.szlholdings.executive.mobile` | Alpha Blocker | Project Settings → Your apps → Add app → iOS |
| 3.17 | Download `GoogleService-Info.plist` | Alpha Blocker | Replace placeholder at `artifacts/szl-holdings-mobile/GoogleService-Info.plist` |
| 3.18 | Add Android app with package `com.szlholdings.executive.mobile` | Alpha Blocker | Project Settings → Your apps → Add app → Android |
| 3.19 | Download `google-services.json` | Alpha Blocker | Replace placeholder at `artifacts/szl-holdings-mobile/google-services.json` |
| 3.20 | Enable Cloud Messaging (FCM) | Alpha Blocker (push) | Project Settings → Cloud Messaging → Firebase Cloud Messaging API |
| 3.21 | Upload APNs Auth Key to Firebase (iOS push) | Alpha Blocker (push) | Project Settings → Cloud Messaging → APNs Auth Key (from step 2.5) |

---

## 4. Replit Console (replit.com)

| # | Action | Blocker Level | Notes |
|---|--------|--------------|-------|
| 4.1 | Set `EXPO_TOKEN` as a Replit secret | CI Blocker | Only needed if using Replit-based CI to trigger EAS builds. Set in Replit Secrets panel. |
| 4.2 | Set `APPLE_TEAM_ID` as a Replit secret | CI Blocker | Only if CI submission is used |
| 4.3 | Set `ASC_APP_ID` as a Replit secret | CI Blocker | Only if CI submission is used |
| 4.4 | Confirm `artifacts/szl-holdings-mobile` workflow is configured and healthy | Alpha Blocker | Used for development; not used for EAS builds (EAS builds run on Expo's infrastructure) |
| 4.5 | Do not store Firebase credential files or keystore files in Replit project root | Security | These are gitignored and must remain out of version control |

---

## 5. GitHub Console (github.com)

| # | Action | Blocker Level | Notes |
|---|--------|--------------|-------|
| 5.1 | Add `EXPO_TOKEN` as a GitHub Actions secret | CI Blocker | Settings → Secrets and variables → Actions → New repository secret |
| 5.2 | Add `APPLE_ID` as a GitHub Actions secret | CI Blocker (submit) | Apple account email for EAS submit |
| 5.3 | Add `APPLE_TEAM_ID` as a GitHub Actions secret | CI Blocker (submit) | 10-character Apple team ID |
| 5.4 | Add `ASC_APP_ID` as a GitHub Actions secret | CI Blocker (submit) | App Store Connect app numeric ID |
| 5.5 | Confirm `.gitignore` excludes credential files | Alpha Blocker | `google-services.json`, `GoogleService-Info.plist`, `google-play-service-account.json`, `*.p8`, `*.keystore` must not be committed |
| 5.6 | Review any existing CI workflows to ensure they do not attempt mobile builds without credentials | Alpha Blocker | A failed CI build that expects credentials will break the pipeline |

---

## Completion Order (Recommended)

For the fastest path to the first working Alpha build:

1. Expo: 1.1 → 1.2 → 1.3 → 1.4
2. Firebase: 3.15 → 3.16 → 3.17 → 3.18 → 3.19 → 3.20
3. Apple Developer: 2.1 → 2.2 → 2.3 → 2.5 → 2.6
4. Build: `eas build --profile preview --platform ios && eas build --profile preview --platform android`
5. Apple TestFlight: 2.7 → 2.8 → 2.9 → 2.10 → 2.11
6. Google Play Internal: 3.1 → 3.2 → 3.3 → 3.8 → 3.9

Submit blockers (store listings, screenshots, copy) can be deferred until the Beta gate.

---

## Related Files

- `ops/mobile/eas-and-store-secrets-matrix.md` — EAS secrets inventory with full credential matrix
- `ops/mobile/testflight-play-internal-runbook.md` — step-by-step CLI commands for build and submit
- `ops/mobile/flagship-release-readiness.md` — readiness matrix and go/no-go checklist
- `ops/mobile/store-asset-inventory.md` — store copy and screenshot specs
- `ops/cto/mobile-beta-final.md` — canonical app confirmation and store-facing audit
- `ops/cto/beta-support-flow.md` — beta lifecycle from invite through release notes
