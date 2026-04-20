# App Store & Google Play Submission Checklist

This document covers everything needed to submit all 7 mobile apps to the Apple App Store and Google Play Store using EAS Build and EAS Submit.

---

## App Inventory

| App | iOS Bundle ID | Android Package | EAS Project ID |
|-----|--------------|-----------------|----------------|
| Aegis — SOC Command | `com.aegis.soc.mobile` | `com.aegis.soc.mobile` | `aegis-mobile` |
| Carlota Jo — Client App | `com.carlotajo.advisory.mobile` | `com.carlotajo.advisory.mobile` | `carlota-jo-mobile` |
| Lyte — AIOps Command | `com.lyte.aiops.mobile` | `com.lyte.aiops.mobile` | `lyte-aiops-mobile` |
| Stephen Lutar | `com.stephenlutar.founder.mobile` | `com.stephenlutar.founder.mobile` | `stephen-mobile` |
| SZL Holdings | `com.szlholdings.executive.mobile` | `com.szlholdings.executive.mobile` | `szl-holdings-mobile` |
| Terra — Field Intelligence | `com.terra.realestate.mobile` | `com.terra.realestate.mobile` | `terra-mobile` |
| Vessels — Fleet Command | `com.vessels.maritime.mobile` | `com.vessels.maritime.mobile` | `vessels-mobile` |

---

## Phase 1 — Prerequisites

### 1.1 Accounts Required

- **Apple Developer Account** — $99/year at https://developer.apple.com/account/
  - Individual or Organization account (Organization required for company apps)
  - Enroll and complete agreements in App Store Connect before proceeding

- **Google Play Console Account** — $25 one-time at https://play.google.com/console/
  - Complete developer profile and payment account setup
  - Accept Play Developer Distribution Agreement

### 1.2 Install EAS CLI

```bash
npm install -g eas-cli
eas login
```

### 1.3 Create EAS Projects

For each app, run the following from that app's directory to link it to a real EAS project:

```bash
# Example for Aegis
cd artifacts/aegis-mobile
eas project:init
```

This will replace the placeholder `projectId` in each `app.json` with a real UUID. **Do this for all 7 apps.**

---

## Phase 2 — Firebase / Push Notification Setup (FCM & APNs)

Each app has placeholder files that must be replaced with real Firebase configs:

- `google-services.json` — Android FCM configuration
- `GoogleService-Info.plist` — iOS APNs configuration

### Steps for each app:

1. Go to https://console.firebase.google.com
2. Create a new project (or use an existing one) for each app
3. Add an **Android app** using the exact package name from the table above
4. Download `google-services.json` and replace the placeholder in each app directory
5. Add an **iOS app** using the exact bundle ID from the table above
6. Download `GoogleService-Info.plist` and replace the placeholder in each app directory
7. In Firebase Console → Project Settings → Cloud Messaging, note the **Server Key** — needed for the API server's push notification sender

### APNs Key Setup (for iOS push notifications):
1. In Apple Developer portal → Certificates, Identifiers & Profiles → Keys
2. Create an **APNs key** (one key can be used across all apps)
3. Download the `.p8` key file
4. In Firebase Console → Project Settings → Cloud Messaging → iOS app, upload the APNs key

---

## Phase 3 — App Store Connect Setup (iOS)

For **each** of the 7 apps:

1. Go to https://appstoreconnect.apple.com → My Apps → "+"
2. Create a new app with:
   - **Platform**: iOS
   - **Name**: (from table above)
   - **Primary Language**: English (U.S.)
   - **Bundle ID**: (from table above — register in Developer portal first if not listed)
   - **SKU**: Use the bundle identifier as the SKU
3. In **App Information**:
   - Set **Category** (see recommendations below)
   - Set **Privacy Policy URL** (from each app's `extra.privacyUrl` in `app.json`)
   - Set **Support URL** (from each app's `extra.supportUrl`)
4. In **Pricing and Availability**: Set to Free
5. Note the **Apple ID (ascAppId)** shown — update `eas.json` `submit.production.ios.ascAppId` for each app

### Recommended App Store Categories

| App | Primary Category | Secondary Category |
|-----|-----------------|-------------------|
| Aegis | Business | Utilities |
| Carlota Jo | Business | Productivity |
| Lyte | Business | Productivity |
| Stephen Lutar | Business | Productivity |
| SZL Holdings | Finance | Business |
| Terra | Business | Finance |
| Vessels | Business | Navigation |

### Required App Store Assets (per app)

- **App Icon**: 1024×1024 PNG (no alpha, no rounded corners) — already configured in `app.json`
- **Screenshots**: Minimum 3 per device size — required for iPhone 6.5" and iPhone 5.5"
  - 6.5" display: 1242×2688 or 1284×2778
  - 5.5" display: 1242×2208
  - iPad Pro (if `supportsTablet: true`): 2048×2732 — required for Aegis only
- **App Preview Videos** (optional but recommended)
- **Description**: Each app's `description` from `app.json` can serve as a starting point; expand to 4000 characters max for the store listing
- **Keywords**: 100 characters max, comma-separated
- **What's New**: Required for updates; leave blank for v1.0

---

## Phase 4 — Google Play Console Setup (Android)

For **each** of the 7 apps:

1. Go to https://play.google.com/console → Create app
2. Set app name, default language (English - US), app or game (App), free or paid (Free)
3. Complete **Store Listing**:
   - **Short description**: 80 characters max
   - **Full description**: 4000 characters max (use `app.json` `description` as base)
   - **App icon**: 512×512 PNG — configured in `app.json`
   - **Feature graphic**: 1024×500 PNG (required)
   - **Screenshots**: At least 2 for phone; 1024×500 or larger
4. In **App Content**:
   - Complete Privacy Policy URL
   - Complete Content Rating questionnaire (select "Business" for all apps)
   - Set Target Audience (18+ for all apps)
5. In **Store Settings**: Select category (match App Store categories above)

### Google Play Service Account (for EAS Submit)

1. In Google Play Console → Setup → API access
2. Link to a Google Cloud Project (or create one)
3. Click "Create new service account" → Follow the link to Google Cloud Console
4. Create a service account with role **Service Account User**
5. Create a JSON key and download it
6. Back in Play Console, grant the service account **Release manager** permissions
7. Replace `google-play-service-account.json` placeholder in **each** app directory with the real JSON key

> **Note**: One service account can manage all 7 apps within the same Play Console account.

---

## Phase 5 — EAS Configuration

### Update `eas.json` submit section for each app

Replace the placeholder values in each app's `eas.json`:

```json
"submit": {
  "production": {
    "ios": {
      "appleId": "your-real-apple-id@example.com",
      "ascAppId": "1234567890",        // From App Store Connect
      "appleTeamId": "ABCDE12345"      // From Apple Developer portal
    }
  }
}
```

The `appleTeamId` can be found in Apple Developer portal → Membership → Team ID.

---

## Phase 6 — Build & Submit

### Per-app build and submit commands

Run these from the root of each app directory (e.g., `cd artifacts/aegis-mobile`):

```bash
# 1. Run a development build (for testing on device)
eas build --profile development --platform all

# 2. Run a preview build (internal distribution, no store)
eas build --profile preview --platform all

# 3. Run a production build (for store submission)
eas build --profile production --platform all

# 4. Submit to both stores (after production build completes)
eas submit --profile production --platform ios
eas submit --profile production --platform android
```

### EAS credentials (handled automatically)

EAS Build manages signing credentials automatically (`credentialsSource: "remote"` is set in all production profiles). On first run, it will:
- **iOS**: Generate a Distribution Certificate and Provisioning Profile
- **Android**: Generate an upload keystore

**Store the EAS-managed credentials in your Expo account — never delete them.**

---

## Phase 7 — App Review Preparation

### Apple App Store Review

All 7 apps use biometrics, camera, location, or notifications. Reviewers will verify each permission is used as described. Ensure:

- Permission strings in `infoPlist` match actual usage
- Test account credentials are provided in App Review notes
- If any app has restricted access (invite-only), include test account login in "Notes for Reviewer"

| App | Permissions Requiring Justification |
|-----|--------------------------------------|
| Aegis | Face ID (auth), Camera (QR scan), Notifications (critical alerts) |
| Carlota Jo | Camera (document scan), Notifications (messages/sessions) |
| Lyte | Face ID (auth), Camera (QR), Photo Library (incident attachments), Location (site alerts), Notifications |
| Stephen Lutar | Notifications |
| SZL Holdings | Face ID (auth), Camera (doc scan), Notifications |
| Terra | Camera (property photos), Location (nearby properties), Notifications (distress signals) |
| Vessels | Location (fleet proximity), Camera (QR scan), Notifications (vessel alerts) |

### Encryption Export Compliance

All apps set `ITSAppUsesNonExemptEncryption: false` — this means HTTPS-only, no custom encryption. This is already configured and no additional export documentation is required.

---

## Phase 8 — Android Notification Channels

The following channels are pre-registered in the app code via `lib/notifications.ts`. They match the channel IDs used in the API server's `push-templates.ts`:

| App | Channel ID | Importance | Purpose |
|-----|-----------|-----------|---------|
| Aegis | `aegis-critical` | MAX (bypassDnd) | Threat alerts |
| Aegis | `aegis-incidents` | HIGH | Incident updates |
| Aegis | `aegis-health` | DEFAULT | System health |
| Vessels | `vessels-alerts` | MAX (bypassDnd) | Vessel alerts |
| Vessels | `vessels-compliance` | HIGH | Compliance warnings |
| Vessels | `vessels-updates` | DEFAULT | Port arrivals |
| Terra | `terra-deals` | HIGH | Deal updates |
| Terra | `terra-listings` | DEFAULT | Listing changes |
| Terra | `terra-distress` | MAX (bypassDnd) | Distress signals |
| Carlota Jo | `carlota-sessions` | HIGH | Session reminders |
| Carlota Jo | `carlota-documents` | DEFAULT | Document uploads |
| Carlota Jo | `carlota-messages` | HIGH | Secure messages |
| Lyte | `lyte-kpis` | HIGH | KPI alerts |
| Lyte | `lyte-escalations` | MAX (bypassDnd) | Escalations |
| Lyte | `lyte-milestones` | DEFAULT | Milestones |

Channels are created when `registerForPushNotifications()` is called on app startup. Ensure this function is called early in each app's root layout.

---

## Phase 9 — Post-Submission

1. **Apple**: After submission, monitor App Store Connect for reviewer questions. Review typically takes 24–48 hours for initial submissions.
2. **Google**: Internal testing track → Closed testing → Open testing → Production (each requires promotion). First submissions to production take 3–7 days for review.
3. **OTA Updates**: The `updates` field in all `app.json` files has `enabled: false`. If you wish to use Expo's OTA update system for minor JS-only updates (bypassing store review), set `enabled: true` and configure the EAS Update service.

---

## Secrets Summary

Collect and securely store the following before beginning:

| Secret | Where to Find | Used By |
|--------|--------------|---------|
| Apple Developer Apple ID | developer.apple.com (your email) | `eas.json` per app |
| Apple Team ID | developer.apple.com → Membership | `eas.json` per app |
| ASC App IDs (7x) | App Store Connect → each app's App Information | `eas.json` per app |
| APNs Auth Key (.p8) | developer.apple.com → Keys | Firebase Console |
| Firebase `google-services.json` (7x) | Firebase Console → Android app | Each app directory |
| Firebase `GoogleService-Info.plist` (7x) | Firebase Console → iOS app | Each app directory |
| Google Play Service Account JSON | Google Play Console → API Access | Each app directory |
| Expo Account Credentials | expo.dev — managed by EAS | EAS Build (remote) |
