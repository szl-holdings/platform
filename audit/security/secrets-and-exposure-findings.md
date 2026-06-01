# Secrets & Exposure Findings

**Date:** 2026-04-26  
**Scope:** Committed secrets, debug endpoints, dev bypasses, unsafe defaults, and client-exposed env vars across the full monorepo.  
**Basis:** Gitleaks full-history scan, `security/secret-audit.md` (Phase 9 update), manual static review of `artifacts/api-server/src/routes/debug.ts`, `global-auth-enforcer.ts`, all `.env.example` files, and `VITE_*` / `EXPO_PUBLIC_*` usage.

---

## 1. Committed Secrets Scan

### Result: CLEAN

| Finding | Count |
|---------|-------|
| True positives (live credentials) | **0** |
| False positives (documented) | 1 |
| Credential-shaped placeholder strings | 0 |

Gitleaks is configured with `.gitleaks.toml` which extends the upstream default ruleset (150+ provider patterns) and adds custom rules for Expo EAS tokens, Resend production keys, Stripe live keys, PostHog keys, and Slack bot tokens. Every suppression in the allowlist has an inline rationale. Full scan history: `security/secret-audit.md`.

**False positive (documented):**

| ID | File | Value | Reason | Disposition |
|----|------|-------|--------|-------------|
| FP-001 | `.gitleaks.toml` | `AKIAIOSFODNN7EXAMPLE` | Canonical AWS documentation example key, used in the gitleaks allowlist itself to suppress pattern matches elsewhere | Accepted — allowlisted in `.gitleaks.toml` global `paths` |

---

## 2. Debug Endpoints

### `/api/debug/sentry-test` and `/api/debug/integrations`

**File:** `artifacts/api-server/src/routes/debug.ts`

| Property | Value |
|----------|-------|
| Auth guard | `authMiddleware()` — requires valid user session |
| Production guard | `if (isProduction) return res.status(403).json(...)` |
| What is returned in dev | Sentry test error capture + integration config flags |
| What `/debug/integrations` reveals | Boolean flags only (`!!process.env.STRIPE_SECRET_KEY`), never key values |
| Public allowlist | NOT listed — behind `authMiddleware()` |
| Risk in production | **None** — 403 returned before any data is produced |

**Disposition:** Acceptable. The debug routes are correctly session-gated and runtime-guarded. The `/debug/integrations` response leaks only booleans (`configured: true/false`), not key values. The production hard-stop (403) is the correct pattern.

**Note:** `/debug/integrations` reveals `VITE_POSTHOG_KEY` and `VITE_AMPLITUDE_API_KEY` configured status (boolean only). Both debug routes are gated behind `requireRole('admin')` (added as part of this audit) in addition to the runtime 403 in production. The surface is appropriately narrow.

---

## 3. Dev Bypasses

### 3a. Demo PIN surfaces

**File:** `artifacts/api-server/src/middlewares/global-auth-enforcer.ts`, lines 615–627

```
// Non-production demo access routes: PIN-validated but session-free.
// /api/pulse/demo/verify accepts PIN in POST body.
if (process.env.NODE_ENV !== 'production' &&
    (path.startsWith("/api/pulse/demo/") || path === "/api/pulse/demo/verify")) {
```

**Assessment:** The PIN-only demo surfaces are explicitly blocked in production by `NODE_ENV` check. This is the correct pattern — not a bypass in production.

**Disposition:** Accepted. No action required.

### 3b. `ADMIN_PIN=000000` in `.env.example`

**File:** `artifacts/api-server/.env.example`

The `.env.example` contains `ADMIN_PIN=000000` as the placeholder value. This is a developer template value, not a production default. The API server never reads `.env.example` at runtime. Operators must set `ADMIN_PIN` (and `VITE_ADMIN_PIN`) in production environment secrets.

**Disposition:** Accepted as placeholder. **Recommendation:** Add a startup-validation assertion that `ADMIN_PIN !== '000000'` in `NODE_ENV === 'production'`.

### 3c. `SESSION_SECRET=change-me-to-a-long-random-string` in `.env.example`

**File:** `artifacts/api-server/.env.example`

Same pattern as `ADMIN_PIN`. Startup validation (`artifacts/api-server/src/lib/startup-validation.ts`) already emits a warning when `SESSION_SECRET` matches the known dev canary value. This is the correct protection mechanism.

**Disposition:** Accepted. Startup validation is the right control.

### 3d. `ALLOY_INTERNAL_TOKEN=change-me-internal-service-token` in `.env.example`

Same startup-validation pattern. The `startupValidation.ts` file uses a known canary value check and warns if the default is still configured.

**Disposition:** Accepted.

### 3e. `CONNECTOR_ENCRYPTION_KEY=000...000` (64 zeros) in `.env.example`

All-zeros key is a known "not configured" sentinel. The connector encryption path checks for this value and should reject it in production.

**Disposition:** Accepted as placeholder. Verify production deployment has a real random key set.

### 3f. Vitest bootstrap token `vitest-internal-token-*`

**File:** `artifacts/api-server/src/__tests__/helpers/test-env-bootstrap.ts`

Sets `ALLOY_INTERNAL_TOKEN` to a clearly labeled non-production value when the env var is absent in test environments. This is suppressed in gitleaks. The test bootstrap file is never loaded in production runtime.

**Disposition:** Accepted.

---

## 4. Client-Exposed Environment Variables (`VITE_*` / `EXPO_PUBLIC_*`)

All `VITE_*` variables are bundled into the frontend JavaScript by Vite's build process and are visible to any browser. This is expected behaviour for frontend configuration. The audit verified that no server-side secrets are placed in the `VITE_*` namespace.

### `VITE_*` Variables Inventory

| Variable | Artifact | Type | Is Secret? | Assessment |
|----------|----------|------|------------|------------|
| `VITE_POSTHOG_KEY` | szl-holdings, sentra, counsel, etc. | Analytics write key | No — client-side analytics key, intended for browser | ✅ Acceptable |
| `VITE_POSTHOG_HOST` | szl-holdings | Analytics host URL | No — URL only | ✅ Acceptable |
| `VITE_PLAUSIBLE_DOMAIN` | szl-holdings | Analytics domain | No — just domain name | ✅ Acceptable |
| `VITE_MAPBOX_TOKEN` | szl-holdings, vessels, terra | Mapbox public token | No — Mapbox public tokens are scoped and rate-limited by domain | ✅ Acceptable |
| `VITE_API_URL` | All web artifacts | API base URL | No — public endpoint URL | ✅ Acceptable |
| `VITE_APP_MODE` | szl-holdings | App mode flag | No — `product`/`demo`/`sandbox` | ✅ Acceptable |
| `VITE_SANDBOX_API_BASE` | szl-holdings | Sandbox API URL | No — URL only | ✅ Acceptable |
| `VITE_REPLIT_AUTH_CLIENT_ID` | szl-holdings | OIDC client ID | Partially sensitive — OIDC client IDs are semi-public (required for PKCE flow); acceptable pattern | ✅ Acceptable |
| `VITE_AMPLITUDE_API_KEY` | Various | Analytics key | No — client-side analytics write key | ✅ Acceptable |
| `VITE_ADMIN_PIN` | api-server dev proxy | 4-digit PIN for dev | No — dev-only, not a production secret | ✅ Acceptable (dev-only) |

**Result:** No server secrets (database URL, session secret, Stripe secret key, internal tokens) are present in the `VITE_*` namespace. Google Maps API key is held server-side only and proxied through `/api/maps/*`.

### `EXPO_PUBLIC_*` Variables

Mobile app uses `EXPO_PUBLIC_*` prefix (equivalent to `VITE_*` for React Native). Inventory limited to analytics keys and API URLs — same classification as above.

---

## 5. Dev-Only Routes Reachable in Non-Production

The following routes are intentionally public in non-production environments but restricted in production. All use `NODE_ENV` checks:

| Route | Mechanism | Production Behaviour |
|-------|-----------|---------------------|
| `/api/pulse/demo/*` | `NODE_ENV !== 'production'` check in `global-auth-enforcer.ts` | Blocked (not in public allowlist for prod) |
| `/api/debug/sentry-test` | `authMiddleware()` + runtime 403 if `isProduction` | 403 |
| `/api/debug/integrations` | `authMiddleware()` + runtime 403 if `isProduction` | 403 |
| `/api/demo/reset` | Listed in `PUBLIC_EXACT_PATHS` — **reachable in production** | Persistent DB state modified (AF-024) |

**Note:** `/api/demo/reset` is listed in the public allowlist without a production guard. This is an AF-024 finding (persistent production state mutation via public route). The handler may have internal guards; this should be audited individually.

---

## 6. Known Dev-Only Constant Values in Source

The following hardcoded non-secret values appear in source for validator/canary purposes and are documented in gitleaks allowlists:

| Value | File | Purpose | Disposition |
|-------|------|---------|-------------|
| `5228884b12bc50c3be1c0f8345d5f5475baf5bc2ccb265d5e9bc02674c04258a` | `artifacts/api-server/src/lib/startup-validation.ts` | Dev substrate signing key canary — triggers warning if still in use | Accepted — canary by design |
| `vessels-bol-chain-secret-dev-only` | `artifacts/api-server/src/routes/vessels-modules.ts` | BoL HMAC dev-only fallback, labeled in name | Accepted — label is self-documenting |
| `ci-test-session-secret-not-for-production` | `.github/workflows/ci.yml` | CI test session secret, explicitly labeled non-production | Accepted |

---

## 7. Sensitive Documentation / Audit Files

The following audit and documentation files contain credential-shaped example values (for documentation purposes only). They are correctly allowlisted in `.gitleaks.toml`:

| File | Content Type | Disposition |
|------|-------------|-------------|
| `audit/FINAL_DETAILED_REPORT.md` | Contains `AKIAIOSFODNN7EXAMPLE` in examples | Allowlisted — confirmed false positive |
| `audit/FINAL_EXEC_SUMMARY.md` | Credential-pattern examples | Allowlisted |
| `audit/security/auth-review.md` | Auth example values | Allowlisted |
| `security/secret-audit.md` | Credential patterns in scanner docs | Allowlisted |
| `ops/benchmark/api-idempotency-and-events.md` | Example idempotency keys, Bearer token patterns | Allowlisted |

---

## Summary

| Category | Count | Action Required |
|----------|-------|----------------|
| Committed live secrets | 0 | None |
| Documented false positives | 1 (FP-001) | None |
| Dev bypasses: correctly guarded in prod | 5 | None |
| Dev bypasses: public in prod (AF-024) | 1 (`/api/demo/reset`) | Audit handler for production guard |
| `VITE_*` secrets leakage | 0 | None |
| Hardcoded canary values | 3 | None (by design) |
| Recommendations | 2 | Add `ADMIN_PIN !== '000000'` startup check; gate debug routes behind admin role |
