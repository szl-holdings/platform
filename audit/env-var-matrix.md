# SZL Holdings — Environment Variable Matrix

**Audit date:** 2026-04-21  
**Source:** `audit/inventory/env-usage.json` (237 `process.env.*` + 19 `import.meta.env.*` usages), `.env.example`, `PLATFORM_CANONICAL.md`

---

## Precedence Order (Highest → Lowest)

1. **Replit Secrets** — `DATABASE_URL`, `SESSION_SECRET`, `ALLOY_INTERNAL_TOKEN`, AI proxy keys, `PGPASSWORD`
2. **`.replit [userenv.production]`** — `NODE_ENV`, `LOG_LEVEL`, `CORS_ORIGINS`, `PUBLIC_APP_URL`
3. **`.replit [userenv.shared]`** — `VAPID_PUBLIC_KEY`, `VAPID_SUBJECT`
4. **`.env`** (local dev only, never committed)

---

## Critical Variables — Required for Any Operation

| Variable | Purpose | Top Usages | Replit Secret? | Status |
|----------|---------|-----------|----------------|--------|
| `DATABASE_URL` | PostgreSQL connection | 23 | Yes | VERIFIED (set in Phase A) |
| `SESSION_SECRET` | Session cookie signing | — | Yes | VERIFIED (set in Phase A) |
| `NODE_ENV` | Runtime mode | 83 | `.replit [userenv.production]` | VERIFIED |
| `PORT` | Server listen port | 14 | Platform-injected | VERIFIED (auto-set by Replit) |

---

## Auth Variables

| Variable | Purpose | Usages | Status |
|----------|---------|--------|--------|
| `ALLOY_INTERNAL_TOKEN` | Service-to-service super_admin grant | 22 | VERIFIED (set in Phase A) |
| `JWT_SECRET` | JWT signing | — | VERIFIED (set in Phase A) |
| `ENCRYPTION_KEY` | Encryption key | — | VERIFIED (set in Phase A) |
| `OAUTH_STATE_SECRET` | OAuth state signing | — | PARTIALLY VERIFIED (in .env.example) |
| `ISSUER_URL` | OIDC issuer | — | PARTIALLY VERIFIED (in .env.example) |
| `MFA_SECRET_ENCRYPTION_KEY` | TOTP secret encryption | — | **BROKEN — not set; F-02** |
| `BOOTSTRAP_ADMIN_USERNAME` | Bootstrap admin seed | — | VERIFIED (set in Phase A) |
| `BOOTSTRAP_ADMIN_PASSWORD` | Bootstrap admin seed | — | VERIFIED (set in Phase A) |
| `BOOTSTRAP_ADMIN_EMAIL` | Bootstrap admin seed | — | VERIFIED (set in Phase A) |

---

## Mobile Variables

| Variable | Purpose | Usages | Status |
|----------|---------|--------|--------|
| `EXPO_PUBLIC_DOMAIN` | Expo app domain | 140 (most-used in codebase) | PARTIALLY VERIFIED |
| `EXPO_PUBLIC_API_BASE_URL` | API base URL for mobile | 15 | PARTIALLY VERIFIED |

---

## External Service Variables

| Variable | Purpose | Usages | Status |
|----------|---------|--------|--------|
| `STRIPE_SECRET_KEY` | Stripe billing | 24 | PARTIALLY VERIFIED (test mode only) |
| `GOOGLE_MAPS_API_KEY` | Maps (Terra, mobile) | 13 | UNVERIFIED (no evidence of key being set) |
| `RESEND_API_KEY` | Email delivery (primary) | — | UNVERIFIED |
| `SENDGRID_API_KEY` | Email delivery (fallback) | — | UNVERIFIED |

---

## AI Provider Variables

| Variable | Purpose | Status |
|----------|---------|--------|
| `OPENAI_API_KEY` | OpenAI generation | PARTIALLY VERIFIED (proxied via Replit AI integration) |
| `ANTHROPIC_API_KEY` | Anthropic generation | PARTIALLY VERIFIED |
| `GOOGLE_AI_API_KEY` / `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini | PARTIALLY VERIFIED |
| `HUGGINGFACE_API_KEY` | HuggingFace inference | UNVERIFIED |
| `NVIDIA_NIM_API_KEY` | NVIDIA NIM | UNVERIFIED |

---

## Runtime Mode Variables

| Variable | Purpose | Status |
|----------|---------|--------|
| `APP_ENV` | Environment classification | PARTIALLY VERIFIED (`development` in .env.example) |
| `RUNTIME_MODE` | Explicit mode override | PARTIALLY VERIFIED (documented; should not be set in production) |
| `LOG_LEVEL` | Log verbosity | PARTIALLY VERIFIED (`info` default) |
| `REPLIT_DEV_DOMAIN` | Replit dev domain | 37 usages | VERIFIED (platform-injected) |
| `REPL_ID` | Replit repl identifier | 17 usages | VERIFIED (platform-injected) |

---

## Production-Only Variables (Not Set in Dev)

| Variable | Required Before | Status |
|----------|----------------|--------|
| `CORS_ORIGINS` | Custom enterprise domain | PARTIALLY VERIFIED — already set in `.replit [userenv.production]` for `*.replit.app,*.replit.dev,*.repl.co`; add any custom enterprise domain |
| `PUBLIC_APP_URL` | Production frontend URLs | UNVERIFIED |
| `STRIPE_SECRET_KEY` (live) | First paying customer | PARTIALLY VERIFIED (test mode) |
| `STRIPE_WEBHOOK_SECRET` (live) | Stripe webhooks | UNVERIFIED |
| Sentry DSN (backend) | Production error monitoring | UNVERIFIED |
| Sentry DSN (frontend) | Production error monitoring | UNVERIFIED |
| `VAPID_PUBLIC_KEY` | Web push notifications | PARTIALLY VERIFIED (in `.replit [userenv.shared]`) |
| `VAPID_SUBJECT` | Web push notifications | PARTIALLY VERIFIED |

---

## Variables With Many Usages But No Confirmed Secret

| Variable | Usages | Risk |
|----------|--------|------|
| `GOMAXPROCS` | 24 | Low — Go runtime tuning; likely leftover from a Go service |
| `VITE_APP_URL` | 16 | Medium — frontend URL construction |
| `BASE_PATH` | 12 | Medium — artifact base path injection |
| `APP_ENV` | 16 | Medium — mode resolution |

---

## Hardcoded Credential-Like Values in `.replit` (SECURITY FINDING)

Phase A secrets scan covered only `.ts/.tsx/.js/.jsx` source files. The following credential-like values are hardcoded in the committed `.replit` config file — Phase A missed these:

| Variable | Section | Value type | Risk | Action |
|----------|---------|-----------|------|--------|
| `SUBSTRATE_SIGNING_KEY` | `[userenv.shared]` | 256-bit hex signing key | HIGH — committed key; shared across all environments | Move to Replit Secrets immediately |
| `ALLOY_INTERNAL_TOKEN` | `[userenv.development]` | Service auth token (`dev-*` prefix) | MEDIUM — dev token; acceptable for dev use only | Verify not used in production; move production token to Replit Secrets |

`CORS_ORIGINS` in `[userenv.production]` is a non-sensitive config value (not a credential) — no action required for that one.

---

## Note on `GOMAXPROCS`

The second most-referenced non-platform env var (24 usages after `NODE_ENV`) is `GOMAXPROCS`, a Go runtime variable. This workspace has no Go services in active use. These usages are likely remnants from an archived Go-based component. The variable has no effect in a Node.js/TypeScript environment — its presence in 24 files suggests copy-paste contamination from an earlier architectural phase.

---

## Summary: Pre-Production Secrets Checklist

Before any public deployment, the following must be set in Replit Secrets:

- [ ] `CORS_ORIGINS` — add any custom enterprise domain (Replit domains already covered in `.replit [userenv.production]`)
- [ ] `MFA_SECRET_ENCRYPTION_KEY` — 32-byte hex
- [ ] `STRIPE_SECRET_KEY` — live mode key
- [ ] `STRIPE_WEBHOOK_SECRET` — live webhook secret
- [ ] `RESEND_API_KEY` — email delivery
- [ ] `GOOGLE_MAPS_API_KEY` — maps (if Terra is demo'd)
- [ ] Sentry DSN (backend and frontend)
- [ ] `REDIS_URL` — when Redis session store is activated
- [ ] `PUBLIC_APP_URL` — production frontend URL
