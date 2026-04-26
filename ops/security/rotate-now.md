# Rotate Now

Generated: 2026-04-16 (updated 2026-04-26)
Purpose: Immediate action list for credentials exposed or at-risk.

**Rotation script:** `bash scripts/rotate-secrets.sh` — generates fresh values for all rotatable secrets and validates the current environment.

---

## CRITICAL — Action Required Before Production

### 1. OAUTH_STATE_SECRET — REMOVED FROM SOURCE, NEEDS ROTATION

**Status:** Was hardcoded in `.replit [userenv.shared]` — now deleted from shared env.
**Risk:** The previous value was committed in `.replit` and may remain in git history.
**Impact:** OAuth state token forgery possible if attacker has the secret.

**Action:**
1. Run `bash scripts/rotate-secrets.sh` — the `OAUTH_STATE_SECRET` value is generated automatically
2. Add to Replit Secrets panel as `OAUTH_STATE_SECRET`
3. The code auto-generates a session-scoped fallback if this secret is absent — but production MUST use a stable, persistent secret

**Code reference:** `artifacts/api-server/src/routes/integrations.ts` + `src/lib/startup-validation.ts`

---

### 2. VAPID_PRIVATE_KEY — REMOVED FROM SOURCE, NEEDS ROTATION

**Status:** Was hardcoded in `.replit [userenv.shared]` — now deleted from shared env.
**Risk:** The previous value was committed in `.replit` and may remain in git history.
**Impact:** An attacker with this key can forge web push notifications from your server.

**Action:**
1. Run `bash scripts/rotate-secrets.sh` — the script generates a new VAPID keypair via `npx web-push generate-vapid-keys`
2. Add new `VAPID_PRIVATE_KEY` to Replit Secrets panel
3. Update `VAPID_PUBLIC_KEY` in `.replit [userenv.shared]` to match the new keypair
4. Existing push subscriptions will need to be cleared and users re-subscribed (the public key changes)
5. If web push is not yet in production use, this is a clean slate rotation

**Code reference:** `artifacts/api-server/src/lib/web-push-sender.ts`

---

### 3. VAPID_PUBLIC_KEY — Note Only

**Status:** Remains in `.replit [userenv.shared]` — public key, intentionally public.
**Risk:** None by itself. Must be updated when VAPID_PRIVATE_KEY is rotated.
**Action:** Update to match new keypair after VAPID_PRIVATE_KEY rotation.

---

### 4. ALLOY_INTERNAL_TOKEN — ✅ REMOVED FROM SOURCE, NEEDS REPLIT SECRET

**Status:** Was hardcoded in `.replit [userenv.shared]` — **now removed** (2026-04-26).
**Risk:** The previous value was committed in `.replit` and may remain in git history.
**Impact:** M2M agent calls (Counsel execution fabric) will fail if the secret is not set in Replit Secrets.

**Action:**
1. Run `bash scripts/rotate-secrets.sh` — a fresh `ALLOY_INTERNAL_TOKEN` is generated automatically
2. Add the generated value to Replit Secrets panel as `ALLOY_INTERNAL_TOKEN`
3. Add to GitHub Actions secrets if CI authenticates against the API

**Code reference:** `packages/config/src/env-contract.ts`, `artifacts/api-server/src/lib/startup-validation.ts`

---

### 5. SUBSTRATE_GATEWAY_API_KEY & SUBSTRATE_SIGNING_KEY — ✅ REMOVED FROM SOURCE

**Status:** Were hardcoded in `.replit [userenv.shared]` — **now removed** (2026-04-26).
**Risk:** Previous values were committed in `.replit` and may remain in git history.
**Impact:** Substrate gateway features will not work until secrets are re-set in Replit Secrets.

**Action:**
1. Run `bash scripts/rotate-secrets.sh` — fresh values for both keys are generated
2. Add both to Replit Secrets panel as `SUBSTRATE_GATEWAY_API_KEY` and `SUBSTRATE_SIGNING_KEY`

---

### 6. ADMIN_PIN — ✅ REMOVED FROM SOURCE, NEEDS REPLIT SECRET

**Status:** Was hardcoded in `.replit [userenv.development]` — **now removed** (2026-04-26).
**Risk:** The previous value was committed in `.replit` and may remain in git history.
**Impact:** Admin dashboard PIN check will fall back to no-PIN mode until set in Replit Secrets.

**Action:**
1. Choose a strong passphrase (the rotation script prompts for a manual value)
2. Add to Replit Secrets panel as `ADMIN_PIN` (development scope only)

---

## HIGH PRIORITY — Within 30 Days

### 7. Test Token in Source — ✅ RESOLVED

**Location:** `tests/api/server-live.test.ts`
**Value:** `szl-test-integration-live-2026` — **removed from source**
**Resolution:** Token is now read from `process.env.INTEGRATION_TEST_TOKEN`; the file throws a clear error at startup if the variable is missing. No literal value remains in any tracked file.

**Remaining action:**
- Run `bash scripts/rotate-secrets.sh` — a fresh `INTEGRATION_TEST_TOKEN` is generated
- Add to Replit Secrets panel and GitHub Actions secrets

---

### 8. Dev Fallback Keys in Production Code — ✅ CONFIRMED SAFE

**Location:** `artifacts/api-server/src/middlewares/field-encryption.ts`
**Status:** Audited 2026-04-26 — the middleware **throws** `Error` when `FIELD_ENCRYPTION_KEY` is absent and `NODE_ENV === 'production'`. No silent fallback in production.

**Remaining action:**
- Confirm `FIELD_ENCRYPTION_KEY` is set in Replit Secrets panel (run `bash scripts/rotate-secrets.sh --validate-only`)

---

## STANDARD — 90-Day Rotation Schedule

Run `bash scripts/rotate-secrets.sh` to generate fresh values for all of these.

| Secret | Action |
|--------|--------|
| `SESSION_SECRET` | Generated by rotation script → Replit Secrets |
| `FIELD_ENCRYPTION_KEY` | Generated by rotation script → Replit Secrets (requires data migration) |
| `CONNECTOR_ENCRYPTION_KEY` | Generated by rotation script → Replit Secrets (requires re-encrypt) |
| `ALLOY_INTERNAL_TOKEN` | Generated by rotation script → Replit Secrets + GitHub Actions |
| `OAUTH_STATE_SECRET` | Generated by rotation script → Replit Secrets |

---

## STANDARD — 180-Day Rotation Schedule

| Secret | Where to Rotate |
|--------|----------------|
| `OPENAI_API_KEY` | platform.openai.com → API keys |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API keys |
| `GEMINI_API_KEY` | aistudio.google.com → API keys |
| `RESEND_API_KEY` | resend.com → API keys |
| `STRIPE_SECRET_KEY` | dashboard.stripe.com → Developers → API keys |
| `MAPBOX_ACCESS_TOKEN` | account.mapbox.com → Tokens |

---

## Git History Note

The `.replit` file was tracked with hardcoded secrets. To fully remediate:
1. After rotating all exposed secrets, the old values are safe to leave in git history — they are no longer valid.
2. If a full git history rewrite is required (e.g., for compliance), use `git filter-repo --path .replit --invert-paths` on a clean clone. This is a destructive operation and requires force-pushing all branches. Coordinate with the team before executing.
3. For most purposes, rotating the secrets makes the old git history values inert.
