# GAP-001 — Firebase & Google Credential Rotation Runbook

**Gap ID:** GAP-001  
**Severity:** High  
**Status:** Runbook ready — manual rotation required by authorized operator  
**Last updated:** 2026-04-25

---

## Context

GAP-001 was identified during the Phase 0 Launch Readiness audit (April 2026). Placeholder credential files were found in the repository history for Firebase and Google services. While the files confirmed to contain only placeholder values (not active keys), the git history may retain any real values if they were ever committed. Manual rotation of all Firebase/Google service credentials is required as a precautionary measure before public launch.

---

## Credentials in Scope

| Credential | Service | Location | Rotation Method |
|-----------|---------|----------|----------------|
| Firebase project API key | Firebase Auth / Firestore | `FIREBASE_API_KEY` env var | Firebase Console → Project Settings → API Keys |
| Firebase service account private key | Firebase Admin SDK | `FIREBASE_SERVICE_ACCOUNT_JSON` env var | Firebase Console → Project Settings → Service Accounts → Generate new key |
| Google OAuth 2.0 client secret | Google Sign-In (Clerk) | Configured in Clerk dashboard | Google Cloud Console → APIs & Credentials |
| Google Play service account key | Android publishing (EAS) | `GOOGLE_SERVICE_ACCOUNT_KEY_JSON` EAS secret | Google Cloud Console → IAM & Admin → Service Accounts |
| Google services JSON | Firebase Android SDK | `GOOGLE_SERVICES_JSON` EAS secret | Firebase Console → Project Settings → Your Apps (Android) |
| Google service info plist | Firebase iOS SDK | `GOOGLE_SERVICE_INFO_PLIST` EAS secret | Firebase Console → Project Settings → Your Apps (iOS) |

---

## Dry-Run Verification Checklist

Run this checklist before executing rotation to confirm current state and identify scope:

```bash
#!/usr/bin/env bash
# GAP-001 Dry-Run Verification — run as read-only pre-check
set -euo pipefail

echo "=== GAP-001 Credential Rotation Dry-Run ==="
echo ""

echo "[1] Checking for hardcoded credentials in current HEAD..."
if git grep -l 'AIza[A-Za-z0-9_\-]{35}' -- ':!*.md' ':!*.example' 2>/dev/null; then
  echo "  WARNING: Firebase API key pattern found in current HEAD"
else
  echo "  PASS: No Firebase API key patterns in current HEAD"
fi

echo ""
echo "[2] Checking for service account JSON in tracked files..."
if git ls-files | xargs grep -l '"private_key_id"' 2>/dev/null; then
  echo "  WARNING: Service account JSON found in tracked files"
else
  echo "  PASS: No service account JSON in tracked files"
fi

echo ""
echo "[3] Checking environment variables are set (not checking values)..."
for var in FIREBASE_API_KEY FIREBASE_SERVICE_ACCOUNT_JSON; do
  if [ -n "${!var:-}" ]; then
    echo "  SET: $var is configured"
  else
    echo "  MISSING: $var is not set"
  fi
done

echo ""
echo "[4] Checking EAS secrets are registered..."
if command -v eas &>/dev/null; then
  eas secret:list 2>/dev/null || echo "  NOTE: EAS CLI not authenticated — run 'eas login' first"
else
  echo "  NOTE: EAS CLI not installed — install with 'npm install -g eas-cli'"
fi

echo ""
echo "=== Dry-run complete. Review warnings above before proceeding. ==="
```

---

## Rotation Procedure

**Prerequisites:**
- Access to Firebase Console (project owner or admin)
- Access to Google Cloud Console (IAM admin)
- Access to Replit environment secrets
- Access to EAS CLI (authenticated)
- Access to Clerk dashboard (for OAuth client)

**Step 1 — Rotate Firebase API key:**
1. Go to Firebase Console → Project Settings → General tab
2. Under "Your apps," find the web app configuration
3. Note the current API key for comparison
4. Go to Google Cloud Console → APIs & Services → Credentials
5. Find the browser key associated with Firebase, click Edit
6. Click "Regenerate key" and confirm
7. Update `VITE_FIREBASE_API_KEY` (or equivalent) in Replit environment secrets

**Step 2 — Rotate Firebase service account key:**
1. Go to Firebase Console → Project Settings → Service accounts tab
2. Click "Generate new private key"
3. Download the JSON file
4. Base64-encode: `cat service-account.json | base64 | tr -d '\n'`
5. Update `FIREBASE_SERVICE_ACCOUNT_JSON` in Replit environment secrets
6. Update `GOOGLE_SERVICES_JSON` EAS secret: `eas secret:push --scope project --env-file <(echo "GOOGLE_SERVICES_JSON=$(cat google-services.json | base64)")`
7. Delete the old service account key from Google Cloud Console → IAM → Service Accounts
8. **Delete the local JSON file immediately**: `shred -u service-account.json`

**Step 3 — Rotate Google OAuth client secret:**
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Find the OAuth 2.0 client used for Google Sign-In
3. Click Edit → "Reset secret"
4. Update the new client secret in the Clerk dashboard (Google provider settings)

**Step 4 — Rotate Google Play service account key:**
1. Go to Google Cloud Console → IAM & Admin → Service Accounts
2. Find the Play Console service account
3. Add a new key (JSON format)
4. Update `GOOGLE_SERVICE_ACCOUNT_KEY_JSON` EAS secret
5. Verify with `eas submit --platform android --latest --non-interactive` (dry-run mode)
6. Delete the old key from Google Cloud Console

**Step 5 — Verify rotation:**
```bash
# Re-run dry-run verification to confirm no old credentials detected
bash docs/operations/GAP-001-credential-rotation.md  # See "Dry-Run" section above
# Test Firebase Auth (if auth is enabled): attempt sign-in in staging
# Test API server startup (Firebase Admin SDK): check health endpoint
```

**Step 6 — Document completion:**
Update this file with the rotation date and operator. Update `docs/operations/known-gaps.md` to close GAP-001.

---

## Post-Rotation

- Archive this runbook entry with rotation date and responsible party
- Run `pnpm --filter @workspace/api-server test` to verify Firebase connectivity
- Monitor application logs for `INVALID_API_KEY` or `invalid_client` errors for 24 hours

---

## Risk Acceptance (Interim)

If immediate rotation is not feasible before a planned milestone, the authorized operator must sign off:

> I acknowledge that Firebase/Google credentials in the git history may be at risk if they were ever committed as real values. I accept this risk for the interval [START DATE] to [END DATE] and will complete rotation before [DEADLINE].
>
> Operator: ______________________________  
> Date: __________________________________

---

*This runbook was produced as part of the A11OY Operationalization Sweep (Task #3489) to close GAP-001 with executable rotation artifacts.*
