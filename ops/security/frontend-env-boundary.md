# Frontend Environment Variable Boundary

Generated: 2026-04-16 (updated)
Purpose: Define and enforce the boundary between server-side secrets and client-safe environment variables.

---

## The Core Rule

**`VITE_*` environment variables are embedded in client JavaScript bundles at build time. They are visible to anyone who loads the app.**

This means:
- Any variable with `VITE_` prefix is public — treat it as if it's on a public webpage
- Secret keys, API credentials, database URLs, session secrets, and encryption keys MUST NOT use the `VITE_` prefix
- The API server is the only component that should consume secret environment variables

---

## Approved VITE_ Variables (Client-Safe Only)

These are the ONLY variables that should use the `VITE_` prefix:

| Variable | Purpose | Why Safe |
|----------|---------|----------|
| `VITE_API_URL` | API base URL | Public URL — intentionally visible |
| `VITE_APP_VERSION` | App version string | Metadata — public |
| `VITE_APP_ENV` | Environment name (dev/preview/prod) | Config — public |
| `VITE_SENTRY_DSN` | Sentry error tracking endpoint | Public by Sentry's design — DSN is not a secret |
| `VITE_PLAUSIBLE_DOMAIN` | Plausible analytics domain | Public by Plausible's design |
| `VITE_MAPBOX_TOKEN` | Mapbox public token (`pk.*`) | Public token — Mapbox uses domain restrictions instead |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk auth public key | Public by Clerk's design |

---

## Variables That Must NEVER Have VITE_ Prefix

| Variable Type | Why |
|--------------|-----|
| API secret keys (OpenAI, Anthropic, Stripe, etc.) | Full API access — catastrophic if leaked |
| `SESSION_SECRET` | Session forgery — auth bypass |
| `OAUTH_STATE_SECRET` | OAuth CSRF bypass |
| `FIELD_ENCRYPTION_KEY` | All encrypted data would be readable |
| `CONNECTOR_ENCRYPTION_KEY` | Connector credentials exposed |
| `ALLOY_INTERNAL_TOKEN` | Internal service auth bypass |
| `VAPID_PRIVATE_KEY` | Push notification forgery |
| `DATABASE_URL` | Full database access |
| `STRIPE_SECRET_KEY` | Payment fraud |
| `SENDGRID_API_KEY` / `RESEND_API_KEY` | Email abuse (spam, phishing) |
| `CLERK_SECRET_KEY` | Full auth system access |
| `SLACK_BOT_TOKEN` | Channel read/write access |
| `TWILIO_AUTH_TOKEN` | SMS abuse, billing fraud |

---

## How the Boundary Works in This Codebase

### Server-side (api-server)
- Reads ALL environment variables via `process.env`
- Consumes secrets: SESSION_SECRET, AI keys, DB credentials, etc.
- Exposes NO secrets to clients via API responses (all secrets stay server-side)
- API server is the only bridge between secret env vars and client-visible data

### Client-side (Vite apps)
- Only see variables prefixed with `VITE_` at build time
- At runtime, access via `import.meta.env.VITE_*`
- Should never need database credentials, session secrets, or API service keys

### Mobile (Expo)
- Only see variables prefixed with `EXPO_PUBLIC_` in client code
- Access via `process.env.EXPO_PUBLIC_*`
- Same rule: no secrets with EXPO_PUBLIC_ prefix
- Server-side calls go through the API server

---

## Audit Checklist

Run this check before every release:

```bash
# Check for any VITE_ variables that look like secrets
grep -r "VITE_" --include="*.ts" --include="*.tsx" --include="*.env*" . \
  | grep -v node_modules | grep -v ".gitignore" \
  | grep -v "VITE_API_URL\|VITE_APP_VERSION\|VITE_APP_ENV\|VITE_SENTRY_DSN\|VITE_PLAUSIBLE\|VITE_MAPBOX_TOKEN\|VITE_CLERK"

# Check for any EXPO_PUBLIC_ variables that look like secrets
grep -r "EXPO_PUBLIC_" --include="*.ts" --include="*.tsx" . \
  | grep -v node_modules \
  | grep -v "EXPO_PUBLIC_APP_ENV\|EXPO_PUBLIC_API_URL"
```

Any result from these greps that contains `KEY`, `SECRET`, `TOKEN`, `PASSWORD`, or `CREDENTIAL` in the variable name is a violation.

---

## Currently Known VITE_ Variables in This Codebase

| Variable | Location | Status |
|----------|----------|--------|
| `VITE_PLAUSIBLE_DOMAIN` | `.env.example`, szl-holdings src | SAFE — analytics domain |
| `VITE_APP_URL` | `.env.example` | SAFE — public URL |
| `VITE_CLERK_PUBLISHABLE_KEY` | Replit Secrets | SAFE — Clerk public key by design |
| `VITE_API_URL` | `.env.example`, multiple apps | SAFE — public URL |

---

## Currently Known EXPO_PUBLIC_ Variables

| Variable | Location | Status |
|----------|----------|--------|
| `EXPO_PUBLIC_APP_ENV` | `eas.json` build configs | SAFE — environment name only |

---

## Violation Response Process

If a secret is discovered with a VITE_ or EXPO_PUBLIC_ prefix:
1. **Immediately** treat it as compromised — it was embedded in a client bundle
2. Rotate the secret (generate new value, update in Replit Secrets)
3. Remove the VITE_ prefix — move consumption to server-side only
4. If the secret was in a public deployment, notify affected service provider
5. Document in `ops/security/rotate-now.md`
