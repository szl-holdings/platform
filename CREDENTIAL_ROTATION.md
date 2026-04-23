# Credential Rotation Runbook — Firebase & Google Play

> **Scope:** Firebase service credentials (`google-services.json`, `GoogleService-Info.plist`) and
> Google Play service account keys used by the SZL Holdings mobile app (EAS builds).
>
> **When to run this:** After any security event that may have exposed a credential, on a scheduled
> key-rotation policy, or when a team member with credential access departs.

---

## 1. Firebase Credentials

Firebase issues two credential files that are embedded in every native build:

| File | Platform | Contains |
|------|----------|----------|
| `google-services.json` | Android | API key, OAuth client IDs, project/app IDs |
| `GoogleService-Info.plist` | iOS | API key, OAuth client IDs, GCM sender ID |

### 1a. Regenerate the Firebase API key first

> **Critical ordering:** The API key embedded in the credential files is managed in Google Cloud
> Console, not Firebase Console. You must regenerate it **before** downloading the files, because
> downloading first and regenerating after will immediately invalidate the key inside files you
> already pushed — breaking Firebase in any build that uses them.

1. Go to [Google Cloud Console](https://console.cloud.google.com) → select the Firebase-linked
   GCP project (same project as Firebase; visible in Firebase Console → Project Settings →
   **Your project** → **Project ID**).
2. Navigate to **APIs & Services** → **Credentials**.
3. Locate the API key labelled **Android key (auto created by Firebase)** and/or **iOS key (auto
   created by Firebase)**.
4. Click the key name → **Regenerate key** → confirm.
   - The old key value is **immediately invalidated**.
   - The new key value is now live in GCP but not yet reflected in any downloaded credential file.
5. Repeat for the other platform key if rotating both.

> **Do not delete** the API key entry — Firebase recreates it automatically and may generate a
> different key name. Regenerate in place so the entry name stays stable.

### 1b. Download the updated Firebase credential files

Now that the API key has been regenerated, the Firebase Console will embed the new key value in
freshly downloaded credential files.

1. Go to [Firebase Console](https://console.firebase.google.com) → select the **CORTEX SZL Holdings** project.
2. **Project Settings** (gear icon) → **Your apps**.
3. For **Android** (`com.szlholdings.executive.mobile`):
   - Click the app card → **Download google-services.json**.
4. For **iOS** (`com.szlholdings.executive.mobile`):
   - Click the app card → **Download GoogleService-Info.plist**.
5. Open each file and confirm the `current_key` / `API_KEY` field contains a value **different**
   from the one in the previous credential files. If they match, the Firebase Console may have
   cached the old value — wait 1–2 minutes and re-download.
6. Copy the files to `artifacts/szl-holdings-mobile/`:
   - `google-services.json` (gitignored)
   - `GoogleService-Info.plist` (gitignored)

### 1c. Push the new credentials to EAS

EAS builds read the credential files directly from the repo when running locally, but for CI /
automated builds the files are stored as base64-encoded EAS secrets.

```bash
cd artifacts/szl-holdings-mobile

# Encode and push the Android credential
GOOGLE_SERVICES_B64=$(base64 -w 0 google-services.json)
eas secret:push --scope project --env-file /dev/stdin <<EOF
GOOGLE_SERVICES_JSON_B64=$GOOGLE_SERVICES_B64
EOF

# Encode and push the iOS credential
GOOGLE_SERVICE_INFO_B64=$(base64 -w 0 GoogleService-Info.plist)
eas secret:push --scope project --env-file /dev/stdin <<EOF
GOOGLE_SERVICE_INFO_PLIST_B64=$GOOGLE_SERVICE_INFO_B64
EOF
```

If your CI pipeline decodes these secrets back to files at build time, verify the decode step in
`scripts/build.js` still references the same variable names.

> **Alternative — update individual secrets:**
> ```bash
> eas secret:create --scope project --force \
>   --name GOOGLE_SERVICES_JSON_B64 \
>   --value "$(base64 -w 0 google-services.json)"
>
> eas secret:create --scope project --force \
>   --name GOOGLE_SERVICE_INFO_PLIST_B64 \
>   --value "$(base64 -w 0 GoogleService-Info.plist)"
> ```
> `--force` overwrites the existing secret without requiring a delete step.

### 1d. Verify the build used the new credential

> **Maintenance window note:** Because the old API key is invalidated in step 1a, any app binary
> still embedded with the old key will experience Firebase failures (auth, push notifications,
> Firestore) from that point forward. Plan the rotation during a low-traffic period and have a
> rollback plan ready (keeping the previous credential files allows a rapid re-push to EAS if
> the new build verification fails).

1. Trigger a new EAS build:
   ```bash
   cd artifacts/szl-holdings-mobile
   eas build --profile preview --platform all --no-wait
   ```
2. Open the build log in the [EAS dashboard](https://expo.dev) → confirm the build started **after**
   the secret push timestamp. Builds started before the push will still carry the old (now invalid) key.
3. Download the built APK / IPA and inspect the embedded credential:
   - **Android APK:** `unzip -p build.apk assets/google-services.json | python3 -m json.tool | grep api_key`
   - **iOS IPA:** `unzip -p build.ipa Payload/*.app/GoogleService-Info.plist | plutil -p - | grep API_KEY`
4. Confirm the `api_key` / `API_KEY` value matches the newly downloaded credential file from step 1b.
   If it matches the **old** value, the build picked up a cached or pre-push secret — re-trigger.
5. Smoke-test Firebase-dependent features in the new build (authentication, push notifications) to
   confirm the new key is accepted by Firebase services before closing the rotation ticket.

---

## 2. Google Play Service Account Key

The Google Play service account key (`google-play-service-account.json`) grants EAS Submit write
access to the Play Console. It is a long-lived JSON key that must be rotated whenever compromised
or on a scheduled basis.

### 2a. Get a new Google Play service account key

1. Go to [Google Cloud Console](https://console.cloud.google.com) → the project linked to your
   Play Console (usually the same Firebase-linked project).
2. **IAM & Admin** → **Service Accounts**.
3. Locate the service account used for Play Console access (role: **Release Manager** or equivalent).
4. Click the account → **Keys** tab → **Add Key** → **Create new key** → **JSON** → **Create**.
5. A new `.json` key file downloads automatically.
6. Copy it to `artifacts/szl-holdings-mobile/google-play-service-account.json` (gitignored).

### 2b. Push the new key to EAS

```bash
cd artifacts/szl-holdings-mobile

PLAY_SA_B64=$(base64 -w 0 google-play-service-account.json)
eas secret:create --scope project --force \
  --name GOOGLE_PLAY_SERVICE_ACCOUNT_B64 \
  --value "$PLAY_SA_B64"
```

If EAS Submit reads the file directly (not via a secret), no secret push is needed — only the local
file replacement at `artifacts/szl-holdings-mobile/google-play-service-account.json` is required.
Confirm which approach your CI uses before skipping this step.

### 2c. Revoke the old Google Play service account key

1. Return to **IAM & Admin** → **Service Accounts** → the same service account.
2. **Keys** tab → locate the old key by its **Key ID** (visible in the previously downloaded JSON
   under `private_key_id`).
3. Click the three-dot menu next to the old key → **Delete key** → confirm.
4. The old key is immediately invalidated. Any EAS Submit jobs using it will fail after this point.

> **Ordering matters:** Always push the new key (step 2b) and confirm at least one successful
> submission before deleting the old key (step 2c).

### 2d. Verify the submission used the new key

1. Run a submission dry-run (does not publish to production):
   ```bash
   cd artifacts/szl-holdings-mobile
   eas submit --profile production --platform android --latest --verbose
   ```
2. In the EAS Submit log, confirm the service account email matches the **new** key's
   `client_email` field from `google-play-service-account.json`.
3. In Play Console → **Setup** → **API access**, confirm the service account's **Last used** date
   updates to reflect the new submission attempt.

---

## 3. Rotation Checklist

Use this checklist for each rotation event. Copy it into the incident ticket or rotation log.

```
## Credential Rotation — [DATE] — [REASON]

### Firebase
- [ ] Regenerated Firebase API key(s) in GCP Console (APIs & Services → Credentials) — old key IMMEDIATELY invalidated
- [ ] Re-downloaded google-services.json from Firebase Console and confirmed api_key value changed
- [ ] Re-downloaded GoogleService-Info.plist from Firebase Console and confirmed API_KEY value changed
- [ ] Pushed GOOGLE_SERVICES_JSON_B64 EAS secret (eas secret:create --force)
- [ ] Pushed GOOGLE_SERVICE_INFO_PLIST_B64 EAS secret (eas secret:create --force)
- [ ] Triggered new EAS build AFTER secret push timestamp
- [ ] Confirmed new build embeds the new api_key value (inspected APK/IPA — see §1d step 3)
- [ ] Smoke-tested Firebase auth and push notifications in new build — working correctly
- [ ] Confirmed old key is invalid: tested old key value against Firebase API — received 403/400

### Google Play
- [ ] Created new service account JSON key in Google Cloud Console
- [ ] Copied new key to google-play-service-account.json (local, gitignored)
- [ ] Pushed GOOGLE_PLAY_SERVICE_ACCOUNT_B64 EAS secret (if used by CI)
- [ ] Ran eas submit --verbose and confirmed new client_email in logs
- [ ] Deleted old key from Google Cloud Console (Keys tab)
- [ ] Confirmed Play Console "Last used" date updated for the service account

### Sign-off
- Rotated by: _______________
- Reviewed by: _______________
- Incident ref / rotation ticket: _______________
```

---

## 4. Scheduling

| Credential | Recommended Rotation Frequency | Mandatory Trigger |
|------------|--------------------------------|-------------------|
| Firebase API keys | Every 12 months | Security event, team departure |
| Google Play service account key | Every 12 months | Security event, team departure |

Set a calendar reminder or add a line to the quarterly security review in `INCIDENT_RESPONSE.md`.

---

## 5. Related Documents

- **First-run credential setup:** `artifacts/szl-holdings-mobile/SETUP.md`
- **EAS secrets inventory:** `ops/mobile/eas-and-store-secrets-matrix.md`
- **Incident response:** `INCIDENT_RESPONSE.md`
- **Security policy:** `SECURITY.md`
