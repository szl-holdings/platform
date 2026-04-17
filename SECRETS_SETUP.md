# Secrets & Credential Setup Guide

This document tells every developer exactly how to configure credentials for EAS builds and local development. **Never commit real credential files.** All sensitive file patterns are listed in `.gitignore`.

---

## Primary Workflow — EAS Remote Credentials (CI/CD and Team Builds)

EAS remote credentials are the canonical way to build and submit CORTEX. No developer needs local copies of Firebase or Google Play files. All credentials are stored in EAS and injected automatically during every cloud build.

### Why EAS-first?

- Zero local credential files means zero risk of accidental commits.
- Any team member or CI runner can trigger a build without manual setup.
- Credential rotation happens in EAS once and propagates to all future builds immediately.
- `app.config.js` reads `GOOGLE_SERVICES_JSON` and `GOOGLE_SERVICE_INFO_PLIST` from the EAS build environment; local files are used only as fallbacks for development.

---

## EAS Secret Upload — One-Time Setup

Run these commands once per EAS project (after obtaining real files from the Firebase / Google Play consoles). You must have the EAS CLI installed and be logged in (`eas login`).

### 1. Firebase — Android (`GOOGLE_SERVICES_JSON`)

```bash
# Download google-services.json from Firebase Console first, then:
eas secret:create \
  --scope project \
  --name GOOGLE_SERVICES_JSON \
  --type file \
  --value ./google-services.json
```

During every EAS build the file is placed in the build environment and its path is exposed as `$GOOGLE_SERVICES_JSON`. `app.config.js` reads this path via `process.env.GOOGLE_SERVICES_JSON`.

### 2. Firebase — iOS (`GOOGLE_SERVICE_INFO_PLIST`)

```bash
# Download GoogleService-Info.plist from Firebase Console first, then:
eas secret:create \
  --scope project \
  --name GOOGLE_SERVICE_INFO_PLIST \
  --type file \
  --value ./GoogleService-Info.plist
```

`app.config.js` reads `process.env.GOOGLE_SERVICE_INFO_PLIST` for `ios.googleServicesFile`.

### 3. Google Play Service Account (`GOOGLE_SERVICE_ACCOUNT_KEY_JSON`)

Used for `eas submit` to the Play Store. EAS Submit reads `GOOGLE_SERVICE_ACCOUNT_KEY_JSON` automatically — no `serviceAccountKeyPath` is needed in `eas.json`.

```bash
# Download the service account JSON from Google Play Console first, then:
eas secret:create \
  --scope project \
  --name GOOGLE_SERVICE_ACCOUNT_KEY_JSON \
  --type string \
  --value "$(cat google-play-service-account.json)"
```

### 4. Android Keystore (release signing)

EAS manages the Android release keystore remotely. `eas.json` has `"credentialsSource": "remote"` for production Android builds. To enroll a keystore:

```bash
eas credentials
# Select Android → production → Set up a new keystore
```

EAS stores the keystore in its credential store; no developer ever needs the `.jks` file locally.

### 5. iOS Distribution Certificate & Provisioning Profile

EAS manages iOS signing remotely. `eas.json` has `"credentialsSource": "remote"` for production iOS builds.

```bash
eas credentials
# Select iOS → production → Set up distribution certificate / provisioning profile
```

Never place `.p12`, `.cer`, or `.mobileprovision` files inside the repo.

---

## Local Development Fallback

For local `expo start` or `eas build --local`, `app.config.js` falls back to the placeholder files already committed to the repo if the EAS environment variables are not set. The placeholder files contain only `PLACEHOLDER_*` values and are safe — they exist only so `expo prebuild` does not fail with a missing-file error.

**To use real credentials locally (optional):** overwrite the real-name file in place, then verify with `git status` that the file appears as ignored (not staged). The `.gitignore` is hardened to block these files from staging.

| Real file (gitignored, fallback only) | EAS secret name                 | Secret type | Template / example (committed) |
|---------------------------------------|---------------------------------|-------------|--------------------------------|
| `google-services.json`                | `GOOGLE_SERVICES_JSON`          | file        | `google-services.example.json` |
| `GoogleService-Info.plist`            | `GOOGLE_SERVICE_INFO_PLIST`     | file        | `GoogleService-Info.example.plist` |
| `google-play-service-account.json`    | `GOOGLE_SERVICE_ACCOUNT_KEY_JSON` | string (JSON content) | `google-play-service-account.example.json` |

---

## How `app.config.js` Reads EAS Secrets

`artifacts/szl-holdings-mobile/app.config.js` resolves credential paths dynamically:

```js
android: {
  googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
},
ios: {
  googleServicesFile: process.env.GOOGLE_SERVICE_INFO_PLIST ?? './GoogleService-Info.plist',
},
```

When `eas build` runs with the file secrets above, EAS sets these env vars to the paths of the injected files. In local dev without those env vars, the committed placeholder files are used as the fallback.

---

## Environment Variables (API keys, backend URLs)

- Copy `.env.example` to `.env` at the repo root (comprehensive — 175 variables).
- Fill in values from the team secrets store.
- `.env` files are gitignored. Never commit filled-in `.env` files.
- See `ENVIRONMENT_VARIABLES.md` for the full canonical reference with descriptions, required/optional status, and source-verified defaults.
- See `AUDIT_FINDINGS_REGISTER.md` for active security findings related to secret hygiene.

---

## Checking Stored EAS Secrets

```bash
eas secret:list
```

This shows all secrets scoped to the project (names only — values are never displayed).

---

## Rotating Credentials

1. Obtain the new credential file.
2. Run `eas secret:push --scope project --name <SECRET_NAME> --value <new-file>` to overwrite the stored secret.
3. Trigger a new EAS build — it will pick up the rotated credential automatically.
4. Shred the local copy of the new file once the build succeeds.
