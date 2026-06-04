# Mobile App Deployment Guide

Step-by-step guide for submitting all 7 mobile apps to the Apple App Store and Google Play Store.

---

## Apps Covered

| Key | App Name | Bundle ID / Package |
|-----|----------|---------------------|
| `aegis` | Aegis — SOC Command Center | `com.aegis.soc.mobile` |
| `carlota-jo` | Carlota Jo — Client App | `com.carlotajo.advisory.mobile` |
| `lyte` | Lyte — AIOps Command | `com.lyte.aiops.mobile` |
| `szl` | SZL Holdings — Executive Command | `com.szlholdings.executive.mobile` |
| `stephen` | Stephen Lutar — Personal Command | `com.stephenlutar.founder.mobile` |
| `terra` | Terra — Real Estate Intelligence | `com.terra.realestate.mobile` |
| `vessels` | Vessels — Fleet Command | `com.vessels.maritime.mobile` |

---

## Prerequisites

### Tools to Install

```bash
# EAS CLI (Expo Application Services)
npm install -g eas-cli

# Verify installation
eas --version
```

### Accounts Required

- **Apple Developer Program** — $99/year at [developer.apple.com](https://developer.apple.com)
- **Google Play Console** — One-time $25 at [play.google.com/console](https://play.google.com/console)
- **Expo Account** — Free at [expo.dev](https://expo.dev)

---

## Part 1: Apple App Store Setup

### Step 1 — Enroll in Apple Developer Program

1. Go to [developer.apple.com/enroll](https://developer.apple.com/enroll)
2. Sign in with your Apple ID
3. Choose **Individual** or **Organization** enrollment
4. Pay the $99 annual fee
5. Wait for approval (usually same day, sometimes 24-48h)

### Step 2 — Find Your Apple Team ID

1. Log in to [developer.apple.com](https://developer.apple.com)
2. Click your name in the top-right → **Account**
3. Under **Membership Details**, find **Team ID** (10-character alphanumeric, e.g., `ABC1234567`)

### Step 3 — Create App Store Connect Records

For each app you want to submit:

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Click **My Apps** → **+** → **New App**
3. Fill in:
   - **Platforms**: iOS
   - **Name**: Use the app name from the table above
   - **Primary Language**: English (U.S.)
   - **Bundle ID**: Use the bundle ID from the table above (register it first if needed)
   - **SKU**: Can match the bundle ID (e.g., `com.aegis.soc.mobile`)
4. After creation, find the **Apple ID** in the app's App Information page (numeric, e.g., `6478123456`)
   — this is your **ASC App ID**

### Step 4 — Register Bundle IDs (if needed)

1. Go to [developer.apple.com/account/resources/identifiers](https://developer.apple.com/account/resources/identifiers)
2. Click **+** → **App IDs** → **App**
3. Enter the bundle identifier and enable required capabilities:
   - Push Notifications
   - Sign In with Apple (if used)
   - Face ID (no extra config needed)

### Step 5 — Plug Apple Credentials into Each App

Open each app's `eas.json` and fill in:

```json
"submit": {
  "production": {
    "ios": {
      "appleId": "your-apple-id@email.com",
      "ascAppId": "6478123456",
      "appleTeamId": "ABC1234567"
    }
  }
}
```

**Field mapping:**
- `appleId` → Your Apple Developer account email
- `ascAppId` → The numeric App ID from App Store Connect (Step 3)
- `appleTeamId` → Your Team ID from Step 2

---

## Part 2: Google Play Store Setup

### Step 1 — Create Google Play Console Account

1. Go to [play.google.com/console](https://play.google.com/console)
2. Sign in with a Google account
3. Pay the one-time $25 registration fee
4. Complete the account details

### Step 2 — Create App Records in Google Play Console

For each app:

1. Click **Create app**
2. Fill in App name, Default language, App or Game, Free or Paid
3. Complete the store listing, content rating, and target audience sections
4. Use the metadata from each app's `store/android/` directory

### Step 3 — Create a Service Account for EAS Submit

EAS needs a service account key to submit to Google Play automatically.

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project or use an existing one
3. Enable the **Google Play Android Developer API**
4. Go to **IAM & Admin** → **Service Accounts** → **Create Service Account**
5. Name it something like `eas-submit`
6. Grant it no roles at this stage (roles are set in Play Console)
7. Click the created service account → **Keys** → **Add Key** → **Create new key** → **JSON**
8. Download the JSON file — this is your `google-play-key.json`

### Step 4 — Grant Service Account Access in Play Console

1. In Google Play Console, go to **Setup** → **API access**
2. Link to the Google Cloud project from Step 3
3. Find your service account and click **Grant Access**
4. Set permissions: **Release Manager** (or **Release Apps** for minimum access)

### Step 5 — Place the Service Account Key

Place the downloaded JSON file in each app's directory as `google-play-key.json`:

```
artifacts/aegis-mobile/google-play-key.json
artifacts/carlota-jo-mobile/google-play-key.json
artifacts/lyte-mobile/google-play-key.json
artifacts/szl-holdings-mobile/google-play-key.json
artifacts/stephen-mobile/google-play-key.json
artifacts/terra-mobile/google-play-key.json
artifacts/vessels-mobile/google-play-key.json
```

> ⚠️ **Add `google-play-key.json` to `.gitignore`** — never commit credentials to version control.

---

## Part 3: EAS Project Setup

### Step 1 — Authenticate with Expo

```bash
eas login
# Enter your expo.dev email and password
```

### Step 2 — Initialize EAS Projects

For each app, run `eas init` to get a real EAS project ID:

```bash
cd artifacts/aegis-mobile && eas init
cd artifacts/carlota-jo-mobile && eas init
cd artifacts/lyte-mobile && eas init
cd artifacts/szl-holdings-mobile && eas init
cd artifacts/stephen-mobile && eas init
cd artifacts/terra-mobile && eas init
cd artifacts/vessels-mobile && eas init
```

Each command will update the `extra.eas.projectId` in `app.json` with a real UUID.

### Step 3 — Configure EAS Update Channels

After `eas init`, set up the update channels for OTA deployment:

```bash
cd artifacts/aegis-mobile && eas channel:create production && eas channel:create preview
# Repeat for each app
```

---

## Part 4: Building and Submitting

### Using the Master Deployment Script

```bash
# Build all apps for production (both platforms)
node scripts/deploy-mobile.js --all --profile production

# Build specific apps for iOS only
node scripts/deploy-mobile.js aegis vessels --platform ios

# Build + submit in one step
node scripts/deploy-mobile.js --all --submit

# Push OTA update to all apps
node scripts/deploy-mobile.js --all --update

# Preview commands without running
node scripts/deploy-mobile.js --all --dry-run
```

### Manual Per-App Commands

```bash
cd artifacts/aegis-mobile

# Build for iOS production
eas build --platform ios --profile production

# Build for Android production
eas build --platform android --profile production

# Submit to App Store (after build)
eas submit --platform ios --profile production --latest

# Submit to Google Play (after build)
eas submit --platform android --profile production --latest

# Push OTA update
eas update --channel production --message "Bug fixes and improvements"
```

---

## Part 5: Store Listing Metadata

Each app has pre-written metadata in its `store/` directory:

```
artifacts/<app>/store/
  ios/
    description.txt       — Full App Store description
    keywords.txt          — Comma-separated keywords (max 100 chars)
    release-notes.txt     — What's new text for this version
    privacy-details.json  — Privacy nutrition label data
  android/
    description.txt       — Full Google Play description
    short-description.txt — Short description (max 80 chars)
    store-config.json     — Category, rating, URLs
```

Upload this content to App Store Connect and Google Play Console when creating your store listings.

---

## Part 6: Screenshots

Generate screenshot guides and output directories:

```bash
# Generate guides for all apps
node scripts/generate-screenshots.js --all

# Open each app's screenshot guide
open artifacts/aegis-mobile/store/screenshot-guide.html
```

**Required screenshot sizes:**

| Platform | Size | Status |
|----------|------|--------|
| iPhone 6.7" | 1290 × 2796 | Required |
| iPhone 6.5" | 1242 × 2688 | Recommended |
| iPhone 5.5" | 1242 × 2208 | Optional |
| iPad Pro 12.9" | 2048 × 2732 | Required if supporting iPad |
| Android Phone | 1080 × 1920 | Required |
| Android Tablet | 1200 × 1920 | Optional |

---

## Part 7: App Icons Verification

Each app's `icon.png` should be **1024 × 1024 pixels** at the path:
`artifacts/<app>/assets/images/icon.png`

Check and verify:
```bash
# Check icon dimensions (requires ImageMagick)
for app in aegis-mobile carlota-jo-mobile lyte-mobile szl-holdings-mobile stephen-mobile terra-mobile vessels-mobile; do
  echo "$app:"
  identify artifacts/$app/assets/images/icon.png 2>/dev/null | grep -o "[0-9]*x[0-9]*" | head -1
done
```

The adaptive icon for Android is configured in each `app.json`:
```json
"android": {
  "adaptiveIcon": {
    "foregroundImage": "./assets/images/icon.png",
    "backgroundColor": "#<app-background-color>"
  }
}
```

For a fully compliant adaptive icon, consider creating a separate foreground image
with padding (approximately 66dp safe zone within 108dp total canvas).

---

## Credential Summary Checklist

For each app, you need:

- [ ] Apple Developer account email (`appleId`)
- [ ] Apple Team ID (`appleTeamId`) — from developer.apple.com
- [ ] ASC App ID (`ascAppId`) — from App Store Connect after creating app record
- [ ] `google-play-key.json` — Service account JSON from Google Cloud Console
- [ ] EAS project initialized (`eas init` run in each app directory)
- [ ] EAS update channels created (`production`, `preview`)

---

## Useful Links

- [Expo EAS Build docs](https://docs.expo.dev/build/introduction/)
- [Expo EAS Submit docs](https://docs.expo.dev/submit/introduction/)
- [Expo EAS Update docs](https://docs.expo.dev/eas-update/introduction/)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Google Play Console](https://play.google.com/console)
- [Apple Developer Portal](https://developer.apple.com)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy Center](https://support.google.com/googleplay/android-developer/answer/9858722)
