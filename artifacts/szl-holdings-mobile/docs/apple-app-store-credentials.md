# Apple App Store Connect Credentials

This document describes every Apple credential required to submit the CORTEX mobile app to the iOS App Store and how to configure them.

## Where credentials live

All credentials are referenced in `eas.json` as EAS Secret environment variables (prefix `$EXPO_…`). **Never hard-code real values in `eas.json`.** Store them using the EAS CLI:

```bash
eas secret:create --scope project --name EXPO_APPLE_ID --value "you@example.com"
```

## Required credentials

| EAS Secret name | Description | Where to find it |
|---|---|---|
| `EXPO_APPLE_ID` | Apple ID (email) used to sign in to App Store Connect | Your Apple Developer account email |
| `EXPO_ASC_APP_ID` | App Store Connect App ID (numeric, e.g. `1234567890`) | App Store Connect → My Apps → your app → App Information → Apple ID |
| `EXPO_APPLE_TEAM_ID` | Apple Developer Team ID (10-char alphanumeric) | developer.apple.com → Account → Membership → Team ID |
| `EXPO_ASC_API_KEY_ID` | App Store Connect API Key ID | App Store Connect → Users and Access → Keys → Key ID |
| `EXPO_ASC_API_KEY_ISSUER_ID` | API Key Issuer ID (UUID) | Same page as Key ID — "Issuer ID" at the top |
| `EXPO_ASC_API_KEY_PATH` | Local path to the `.p8` private key file | Downloaded when you create the API key (one-time only) |

## How to create an App Store Connect API key

1. Sign in to [App Store Connect](https://appstoreconnect.apple.com).
2. Go to **Users and Access → Integrations → App Store Connect API**.
3. Click **+** to generate a new key.
4. Name it (e.g. `CORTEX EAS Build`) and assign the **App Manager** role.
5. Download the `.p8` file immediately — Apple only lets you download it once.
6. Copy the **Key ID** and **Issuer ID** from that page.

## Registering the app in App Store Connect

Before the first submission you must register the app:

1. In App Store Connect click **+** → **New App**.
2. Select **iOS**, enter the app name (`CORTEX — SZL Executive Command`).
3. Bundle ID: `com.szlholdings.executive.mobile` (must match `app.json`).
4. SKU: `com.szlholdings.executive.mobile` (already set in `eas.json`).
5. Copy the numeric **Apple ID** that appears in App Information — this is `EXPO_ASC_APP_ID`.

## Submitting a build

```bash
# Build production IPA
eas build --platform ios --profile production

# Submit to App Store Connect
eas submit --platform ios --profile production
```

EAS reads all `$EXPO_…` secrets automatically from your project secrets store.
