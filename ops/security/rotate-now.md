# Rotate Now

Generated: 2026-04-15
Purpose: Immediate action list for credentials exposed or at-risk.

---

## CRITICAL — Action Required Before Production

### 1. OAUTH_STATE_SECRET — REMOVED FROM SOURCE, NEEDS ROTATION

**Status:** Was hardcoded in `.replit [userenv.shared]` — now deleted from shared env.
**Risk:** The value `0d5148c24475c3a022f044e15ad8a6088ccdadb82fd4a9c873eed64fe79c4e48` was committed in `.replit` which may be in git history.
**Impact:** OAuth state token forgery possible if attacker has the secret.

**Action:**
1. Generate a new value: `openssl rand -hex 32`
2. Add to Replit Secrets panel as `OAUTH_STATE_SECRET`
3. The code auto-generates a session-scoped fallback if this secret is absent — but production MUST use a stable, persistent secret

**Code reference:** `artifacts/api-server/src/routes/integrations.ts` + `src/lib/startup-validation.ts`

---

### 2. VAPID_PRIVATE_KEY — REMOVED FROM SOURCE, NEEDS ROTATION

**Status:** Was hardcoded in `.replit [userenv.shared]` — now deleted from shared env.
**Risk:** The value `e5b_fEr_dwZ544k8t_FCiDh4l1MjFLIsEYcmGs9Q7Cg` was committed in `.replit` which may be in git history.
**Impact:** An attacker with this key can forge web push notifications from your server.

**Action:**
1. Generate a new VAPID keypair:
   ```bash
   npx web-push generate-vapid-keys
   ```
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

## HIGH PRIORITY — Within 30 Days

### 4. Test Token in Source

**Location:** `tests/api/server-live.test.ts`
**Value:** `szl-test-integration-live-2026` (per risks-and-gaps.md)
**Risk:** Predictable token; anyone reading repo can use it for integration test bypass.

**Action:**
1. Move to env var `INTEGRATION_TEST_TOKEN`
2. Generate a random token: `openssl rand -base64 24`
3. Add to Replit Secrets panel for CI use

---

### 5. Dev Fallback Keys in Production Code

**Location:** `artifacts/api-server/src/middlewares/field-encryption.ts` (per risks-and-gaps.md)
**Risk:** If FIELD_ENCRYPTION_KEY is not set in production, data is encrypted with predictable dev key.

**Action:**
1. Verify the dev fallback throws `Error` when `NODE_ENV === 'production'`
2. Confirm `FIELD_ENCRYPTION_KEY` is set in Replit Secrets panel

---

## STANDARD — 90-Day Rotation Schedule

| Secret | Action |
|--------|--------|
| `SESSION_SECRET` | `openssl rand -hex 32` → Replit Secrets |
| `FIELD_ENCRYPTION_KEY` | `openssl rand -hex 32` → Replit Secrets |
| `CONNECTOR_ENCRYPTION_KEY` | `openssl rand -hex 32` → Replit Secrets |
| `ALLOY_INTERNAL_TOKEN` | `openssl rand -base64 48` → Replit Secrets |

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
1. After rotating all exposed secrets (OAUTH_STATE_SECRET, VAPID_PRIVATE_KEY), the old values are safe to leave in git history — they are no longer valid.
2. If a full git history rewrite is required (e.g., for compliance), use `git filter-repo --path .replit --invert-paths` on a clean clone. This is a destructive operation and requires force-pushing all branches. Coordinate with the team before executing.
3. For most purposes, rotating the secrets makes the old git history values inert.
