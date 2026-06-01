# Secrets Setup

This document describes every secret and environment variable required to build, submit, and deploy the SZL Holdings mobile app via EAS. All secrets are stored in EAS (Expo Application Services) and never hardcoded in source files.

---

## Apple / iOS Credentials

iOS submission requires identifying your Apple Developer account, your App Store Connect app, and a method of authenticating to App Store Connect. The recommended authentication method is an **App Store Connect API key** — it does not require 2FA interaction and is safer than storing your Apple ID password.

### Required secrets

| EAS Secret Name | Where to find it |
|---|---|
| `EXPO_APPLE_ID` | Your Apple ID email address registered with Apple Developer |
| `EXPO_ASC_APP_ID` | App Store Connect → Your App → App Information → Apple ID (numeric) |
| `EXPO_APPLE_TEAM_ID` | developer.apple.com → Membership → Team ID |
| `EXPO_ASC_API_KEY_ID` | App Store Connect → Users and Access → Keys → Key ID |
| `EXPO_ASC_API_KEY_ISSUER_ID` | App Store Connect → Users and Access → Keys → Issuer ID |
| `EXPO_ASC_API_KEY_PATH` | Local path to the downloaded `.p8` key file (used during CI upload) |

### Step 1 — Create an App Store Connect API key

1. Sign in to [App Store Connect](https://appstoreconnect.apple.com).
2. Go to **Users and Access → Integrations → App Store Connect API**.
3. Click **+** and generate a key with the **App Manager** role.
4. Download the `.p8` file immediately — Apple only lets you download it once.
5. Note the **Key ID** and **Issuer ID** shown on that page.

### Step 2 — Store the API key content as an EAS secret

EAS secrets are stored at the project level. Run these commands from inside `artifacts/szl-holdings-mobile/`:

```bash
# Upload the .p8 key file content as a secret
eas secret:create \
  --scope project \
  --name EXPO_ASC_API_KEY_PATH \
  --type file \
  --value /path/to/AuthKey_XXXXXXXXXX.p8

# Store the Key ID
eas secret:create \
  --scope project \
  --name EXPO_ASC_API_KEY_ID \
  --value "XXXXXXXXXX"

# Store the Issuer ID
eas secret:create \
  --scope project \
  --name EXPO_ASC_API_KEY_ISSUER_ID \
  --value "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### Step 3 — Store the Apple account identifiers as EAS secrets

These are still needed so EAS can locate the correct app in App Store Connect even when using API key auth.

```bash
# Your Apple ID email
eas secret:create \
  --scope project \
  --name EXPO_APPLE_ID \
  --value "your-apple-id@example.com"

# Numeric App Store Connect App ID (from App Information page)
eas secret:create \
  --scope project \
  --name EXPO_ASC_APP_ID \
  --value "1234567890"

# Apple Developer Team ID (10-character alphanumeric)
eas secret:create \
  --scope project \
  --name EXPO_APPLE_TEAM_ID \
  --value "XXXXXXXXXX"
```

### Verifying secrets are registered

```bash
eas secret:list
```

All six secrets above should appear with scope `project`.

---

## Android / Google Play Credentials

| EAS Secret Name | Purpose |
|---|---|
| `EXPO_GOOGLE_SERVICE_ACCOUNT_KEY` | Service account JSON for Play Store submission |

```bash
eas secret:create \
  --scope project \
  --name EXPO_GOOGLE_SERVICE_ACCOUNT_KEY \
  --type file \
  --value /path/to/service-account-key.json
```

---

## Submitting a Build

Once all secrets are registered, trigger a submission with:

```bash
# Submit to App Store production
eas submit --platform ios --profile production

# Submit to TestFlight
eas submit --platform ios --profile testflight
```

EAS will automatically resolve all `$EXPO_*` environment variables from the stored secrets — no local `.env` file is required for CI.

---

## Rotating Credentials

To update a secret (e.g. after an API key rotation):

```bash
eas secret:delete --name EXPO_ASC_API_KEY_ID
eas secret:create --scope project --name EXPO_ASC_API_KEY_ID --value "NEW_KEY_ID"
```

Repeat for each secret that changed, then re-run the affected build or submit job.
