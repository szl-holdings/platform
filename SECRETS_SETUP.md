# Secrets & Credential Setup Guide

This document tells every developer exactly how to configure credentials for local builds and EAS submissions. **Never commit real credential files.** All sensitive file patterns are listed in `.gitignore`.

---

## File Policy — Placeholders vs. Real Credentials

Three files live in `artifacts/szl-holdings-mobile/` under their real names (`google-services.json`, `GoogleService-Info.plist`, `google-play-service-account.json`). They currently contain only `PLACEHOLDER_*` values and are safe to track in git. They are **also listed in `.gitignore`**, which means:

- The current placeholder versions remain tracked (committed) as a build-safe default so `app.json` can reference them without a missing-file error.
- Any future version you create locally by overwriting them with real credentials will **not** be staged or committed — git will ignore the file after the first local write.

The `.example` variants (`google-services.example.json`, `GoogleService-Info.example.plist`, `google-play-service-account.example.json`) are permanent reference copies that document the expected structure. Developers should use them as a guide when obtaining real files from the Firebase / Google Play consoles.

**To provision real credentials:** follow the steps below, overwrite the real-name file in place, and verify with `git status` that the file appears as "ignored" (not staged).

---

## 1. Firebase — Android (`google-services.json`)

1. Open [Firebase Console](https://console.firebase.google.com) → select the project.
2. Go to **Project Settings** → **Your Apps** → the Android app (`com.szlholdings.executive.mobile`).
3. Click **Download google-services.json**.
4. Copy it to:
   ```
   artifacts/szl-holdings-mobile/google-services.json
   ```
5. This file is gitignored. Use `google-services.example.json` as a structural reference.

---

## 2. Firebase — iOS (`GoogleService-Info.plist`)

1. Open [Firebase Console](https://console.firebase.google.com) → select the project.
2. Go to **Project Settings** → **Your Apps** → the iOS app (`com.szlholdings.executive.mobile`).
3. Click **Download GoogleService-Info.plist**.
4. Copy it to:
   ```
   artifacts/szl-holdings-mobile/GoogleService-Info.plist
   ```
5. This file is gitignored. Use `GoogleService-Info.example.plist` as a structural reference.

---

## 3. Google Play Service Account (`google-play-service-account.json`)

Used only for `eas submit` to the Play Store.

1. Open [Google Play Console](https://play.google.com/console) → **Setup** → **API access**.
2. Link to a Google Cloud project, then create a Service Account with **Release Manager** role.
3. Download the JSON key for that service account.
4. Copy it to:
   ```
   artifacts/szl-holdings-mobile/google-play-service-account.json
   ```
5. This file is gitignored. Use `google-play-service-account.example.json` as a structural reference.
6. Update `eas.json` to point to this file if not already configured:
   ```json
   "submit": {
     "production": {
       "android": {
         "serviceAccountKeyPath": "./google-play-service-account.json"
       }
     }
   }
   ```

---

## 4. Android Keystore (release signing)

1. Generate or obtain the release keystore from the team secrets store (1Password / Vault).
2. Place it at a path **outside the repo** (e.g. `~/.android/szl-release.keystore`).
3. Reference it in your local `eas.json` or EAS secret environment variables — never commit it.
4. Register the keystore with EAS:
   ```bash
   eas credentials
   ```

---

## 5. iOS Distribution Certificate & Provisioning Profile

1. Obtain the `.p12` certificate and `.mobileprovision` from the team secrets store.
2. Import them into Xcode Keychain or run:
   ```bash
   eas credentials
   ```
   EAS manages these remotely — prefer remote storage over local files.
3. Never place `.p12`, `.cer`, or `.mobileprovision` files inside the repo.

---

## 6. Environment Variables (API keys, backend URLs)

- Copy `.env.example` to `.env` at the repo root (the file is comprehensive — 175 variables).
- Fill in values from the team secrets store.
- `.env` files are gitignored. Never commit filled-in `.env` files.
- See `ENVIRONMENT_VARIABLES.md` for the full canonical reference with descriptions, required/optional status, and source-verified defaults.
- See `AUDIT_FINDINGS_REGISTER.md` for active security findings related to secret hygiene.

---

## 7. EAS / Expo Build Secrets

For CI/CD, store secrets in EAS instead of files:
```bash
eas secret:create --scope project --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json
eas secret:create --scope project --name GOOGLE_SERVICE_INFO_PLIST --type file --value ./GoogleService-Info.plist
```
Then remove the local files before committing.

---

## Template Files

| Real file (gitignored) | Template / example (committed) |
|---|---|
| `google-services.json` | `google-services.example.json` |
| `GoogleService-Info.plist` | `GoogleService-Info.example.plist` |
| `google-play-service-account.json` | `google-play-service-account.example.json` |

All template files contain only `PLACEHOLDER_*` values and are safe to commit.
