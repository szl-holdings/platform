# Credential Rotation Runbook

This runbook covers rotating Firebase, Google Play, and Apple credentials for the CORTEX mobile app. Run this whenever a credential is compromised, a team member with access departs, or as part of a scheduled security review (recommended: every 90 days).

---

## 1. Firebase credentials

Firebase is used for push notifications (FCM) and analytics.

### What to rotate

| Credential | Location |
|---|---|
| Firebase service account key (JSON) | Google Cloud IAM — service accounts |
| FCM server key (legacy) | Firebase Console → Project Settings → Cloud Messaging |
| `google-services.json` (Android) | `artifacts/szl-holdings-mobile/google-services.json` |
| `GoogleService-Info.plist` (iOS) | `artifacts/szl-holdings-mobile/GoogleService-Info.plist` |

### Steps

1. **Create a new service account key**
   - Go to [Firebase Console](https://console.firebase.google.com) → Project Settings → Service accounts.
   - Click **Generate new private key** → download the new JSON.
   - In the EAS project, update the secret: `eas secret:create --scope project --name FIREBASE_SERVICE_ACCOUNT_KEY --value "$(cat new-key.json)"`
   - Delete the old key from Google Cloud IAM.

2. **Rotate the FCM server key** (if using the legacy API)
   - Firebase Console → Project Settings → Cloud Messaging → Server key → **Rotate**.
   - Update `FIREBASE_SERVER_KEY` in EAS secrets.

3. **Refresh `google-services.json` and `GoogleService-Info.plist`**
   - Firebase Console → Project Settings → Your apps → download the latest config files.
   - Replace the existing files in the repo.
   - Run a new EAS build to pick up the new config.

4. **Verify** by sending a test push notification via the Firebase Console.

---

## 2. Google Play credentials

Google Play credentials are used by EAS to submit Android builds to the Play Console.

### What to rotate

| Credential | Location |
|---|---|
| Google Play service account JSON | Google Cloud IAM |
| Upload keystore (`.jks`) | EAS managed credentials or self-managed |

### Steps — service account

1. Go to [Google Play Console](https://play.google.com/console) → Setup → API access.
2. Click your linked Google Cloud project → IAM → Service accounts.
3. Find the `expo-` service account (created by EAS).
4. Under **Keys**, click **Add key → Create new key → JSON** → download.
5. Update EAS: `eas secret:create --scope project --name GOOGLE_SERVICE_ACCOUNT_KEY_JSON --value "$(cat new-key.json)"`.
6. Delete the old key from Google Cloud.

### Steps — Android upload keystore

> **Warning:** If you lose the upload keystore and Google Play App Signing is not enabled, you cannot publish updates to the Play Store.

EAS manages the upload keystore remotely by default (`credentialsSource: remote` in `eas.json`).

To rotate:
1. `eas credentials --platform android` → select your build profile → **Keystore → Remove**.
2. EAS will generate a new keystore on the next build.
3. Submit the new APK/AAB to Google Play. Google Play App Signing will re-sign it with the distribution key.

---

## 3. Apple / EAS credentials

### What to rotate

| Credential | Notes |
|---|---|
| App Store Connect API key (`.p8`) | Set to expire; regenerate in App Store Connect |
| iOS Distribution certificate | Managed by EAS; rotate via `eas credentials` |
| iOS Provisioning profile | Regenerated automatically when the certificate rotates |

### Steps — App Store Connect API key

1. Go to App Store Connect → Users and Access → Integrations → API Keys.
2. Revoke the old key.
3. Create a new key (**App Manager** role), download the `.p8` file.
4. Update EAS secrets:
   ```bash
   eas secret:create --scope project --name EXPO_ASC_API_KEY_ID --value "<new-key-id>"
   eas secret:create --scope project --name EXPO_ASC_API_KEY_ISSUER_ID --value "<issuer-id>"
   eas secret:create --scope project --name EXPO_ASC_API_KEY_PATH --value "<path-to-p8>"
   ```

### Steps — iOS distribution certificate

1. `eas credentials --platform ios` → select the production profile → **Distribution Certificate → Remove`.
2. On the next `eas build --platform ios --profile production`, EAS will create and register a new certificate automatically.

---

## 4. Verification checklist after rotation

- [ ] Firebase: test push notification received on a physical device
- [ ] Google Play: successful internal test track upload via `eas submit --platform android`
- [ ] App Store: successful TestFlight upload via `eas submit --platform ios --profile testflight`
- [ ] Audit old secrets deleted from EAS and all cloud consoles
- [ ] Team credentials inventory updated (Bitwarden / 1Password vault)
- [ ] Rotation recorded in the security runbook changelog below

---

## Changelog

| Date | Rotated by | Credentials rotated | Notes |
|---|---|---|---|
| — | — | Initial runbook created | — |
