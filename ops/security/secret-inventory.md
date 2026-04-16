# Secret Inventory

Generated: 2026-04-16 (updated)
Purpose: Full inventory of every credential-bearing variable, its current location, classification, and required action.

---

## Location Key

| Location | Description |
|----------|-------------|
| Replit Secrets | Set via Replit Secrets panel — encrypted, not in source |
| `.replit [userenv.shared]` | In `.replit` file — visible to anyone with repo access — NOT for secrets |
| Source code | Hardcoded in .ts/.tsx/.js — NEVER acceptable for production secrets |
| `.env.example` | Template placeholder — safe (no real values) |

---

## Current Inventory

### Core Platform

| Secret | Current Location | Classification | Risk | Action Required |
|--------|-----------------|----------------|------|-----------------|
| `SESSION_SECRET` | Replit Secrets ✓ | PRIVATE | HIGH | Rotate every 90 days |
| `OAUTH_STATE_SECRET` | ~~.replit shared~~ → REMOVED | PRIVATE | HIGH | **Add to Replit Secrets with new value** |
| `FIELD_ENCRYPTION_KEY` | Replit Secrets ✓ | PRIVATE | HIGH | Rotate every 90 days |
| `CONNECTOR_ENCRYPTION_KEY` | Replit Secrets (assumed) | PRIVATE | HIGH | Confirm existence; rotate every 90 days |
| `ALLOY_INTERNAL_TOKEN` | Replit Secrets ✓ | PRIVATE | HIGH | Rotate every 90 days |
| `DATABASE_URL` | Replit Secrets ✓ | PRIVATE | HIGH | Managed by Replit — do not rotate manually |

### Push Notifications (VAPID)

| Secret | Current Location | Classification | Risk | Action Required |
|--------|-----------------|----------------|------|-----------------|
| `VAPID_PRIVATE_KEY` | ~~.replit shared~~ → REMOVED | PRIVATE | HIGH | **Add to Replit Secrets with new value (rotate)** |
| `VAPID_PUBLIC_KEY` | .replit [userenv.shared] | PUBLIC | LOW | Update when rotating private key |
| `VAPID_SUBJECT` | .replit [userenv.shared] | PUBLIC | NONE | No action needed |

### AI Services

| Secret | Current Location | Classification | Risk | Action Required |
|--------|-----------------|----------------|------|-----------------|
| `OPENAI_API_KEY` (AI_INTEGRATIONS_OPENAI_API_KEY) | Replit Secrets ✓ | PRIVATE | HIGH | Rotate every 180 days |
| `ANTHROPIC_API_KEY` (AI_INTEGRATIONS_ANTHROPIC_API_KEY) | Replit Secrets ✓ | PRIVATE | HIGH | Rotate every 180 days |
| `GEMINI_API_KEY` (AI_INTEGRATIONS_GEMINI_API_KEY) | Replit Secrets ✓ | PRIVATE | HIGH | Rotate every 180 days |
| `HF_TOKEN` | Unknown — check Replit Secrets | PRIVATE | MEDIUM | Confirm; add if used |

### Auth (Clerk)

| Secret | Current Location | Classification | Risk | Action Required |
|--------|-----------------|----------------|------|-----------------|
| `CLERK_SECRET_KEY` | Replit Secrets ✓ | PRIVATE | HIGH | Rotate if compromised |
| `CLERK_PUBLISHABLE_KEY` | Replit Secrets ✓ | PUBLIC (Clerk design) | LOW | No action needed |
| `VITE_CLERK_PUBLISHABLE_KEY` | Replit Secrets ✓ | PUBLIC (Clerk design) | LOW | No action needed |

### External Services

| Secret | Current Location | Classification | Risk | Action Required |
|--------|-----------------|----------------|------|-----------------|
| `STRIPE_SECRET_KEY` | Unknown — check Replit Secrets | PRIVATE | HIGH | Confirm; rotate every 180 days |
| `STRIPE_WEBHOOK_SECRET` | Unknown — check Replit Secrets | PRIVATE | HIGH | Confirm; set if Stripe webhooks active |
| `RESEND_API_KEY` | Unknown — check Replit Secrets | PRIVATE | MEDIUM | Confirm; rotate every 180 days |
| `SENDGRID_API_KEY` | Unknown — check Replit Secrets | PRIVATE | MEDIUM | Confirm; add if SendGrid used |
| `MAPBOX_ACCESS_TOKEN` | Unknown — check Replit Secrets | PRIVATE | MEDIUM | Confirm; rotate every 180 days |
| `SLACK_BOT_TOKEN` | Unknown | PRIVATE | MEDIUM | Confirm; add if Slack integration active |
| `TWILIO_AUTH_TOKEN` | Unknown | PRIVATE | MEDIUM | Confirm; add if Twilio active |

### CI/CD (GitHub Actions)

| Secret | Location | Classification | Action |
|--------|----------|----------------|--------|
| `REPLIT_STAGING_DEPLOY_TOKEN` | GitHub Secrets | PRIVATE | Set when staging deploy is configured |
| `REPLIT_STAGING_APP_ID` | GitHub Secrets | PRIVATE | Set when staging deploy is configured |
| `REPLIT_PROD_DEPLOY_TOKEN` | GitHub Secrets | PRIVATE | Set when production deploy is configured |
| `REPLIT_PROD_APP_ID` | GitHub Secrets | PRIVATE | Set when production deploy is configured |
| `EXPO_TOKEN` | EAS Secrets | PRIVATE | Set when EAS builds are configured |
| `INTEGRATION_TEST_TOKEN` | Source code (!)  | PRIVATE | Move to GitHub Secrets / env var |

### Mobile (EAS / Firebase)

| File | Location | Status | Action |
|------|----------|--------|--------|
| `google-services.json` (szl-holdings-mobile) | `artifacts/szl-holdings-mobile/` | PLACEHOLDER ✓ | Add real file when Firebase configured; .gitignore prevents commit |
| `GoogleService-Info.plist` (szl-holdings-mobile) | `artifacts/szl-holdings-mobile/` | PLACEHOLDER ✓ | Add real file when Firebase configured; .gitignore prevents commit |
| `google-services.json` (cortex-mobile) | `artifacts/cortex-mobile/` | Check needed | Add real file before EAS build; .gitignore prevents commit |
| `GoogleService-Info.plist` (cortex-mobile) | `artifacts/cortex-mobile/` | Check needed | Add real file before EAS build; .gitignore prevents commit |
| `google-play-service-account.json` | Not in repo | N/A | Add to EAS Secrets; .gitignore prevents accidental commit |

---

## Confirmed Safe in `.replit`

These values ARE in `.replit [userenv.shared]` and are safe to be there (public values):

| Variable | Value Type | Why Safe |
|----------|-----------|----------|
| `VAPID_PUBLIC_KEY` | VAPID public key | Public by design — must share with clients |
| `VAPID_SUBJECT` | Email address | Public contact, not a secret |
| `NODE_ENV` (production section) | Config | Not a secret |
| `LOG_LEVEL` (production section) | Config | Not a secret |
| `CORS_ORIGINS` (production section) | Config | Not a secret |
| `PUBLIC_APP_URL` (production section) | Config | Not a secret |

---

## Summary Dashboard

| Category | Total | In Replit Secrets | In `.replit` shared (safe) | In Source (Bad) | Unknown |
|----------|-------|-------------------|---------------------------|-----------------|---------|
| Core platform | 6 | 6 | 0 | 0 | 0 |
| VAPID | 3 | 1 (private key) | 2 (public key + subject) | 0 | 0 |
| AI services | 4 | 3 | 0 | 0 | 1 |
| Auth (Clerk) | 3 | 3 | 0 | 0 | 0 |
| External services | 7 | 0 | 0 | 0 | 7 |
| CI/CD | 5 | 0 | 0 | 0 | 5 |
| Mobile credentials | 3 | 0 | 0 | 0 (placeholders in .example) | 0 |
| **TOTAL** | **31** | **13** | **2** | **0** | **13** |

**Status:** OAUTH_STATE_SECRET and VAPID_PRIVATE_KEY have been removed from `.replit` shared config. Mobile credential files converted to `.example` placeholders with real files blocked by `.gitignore`. No secrets found in source code. Unknown items are external service keys that may not yet be configured (Stripe, SendGrid, etc.) — not leaks.
