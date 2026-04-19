# Secrets Policy — SZL Holdings Platform

> Policy governing the creation, storage, rotation, and handling of secrets and credentials across the SZL Holdings platform.

---

## Scope

This policy applies to all secrets used by the SZL Holdings platform, including:
- Database credentials
- API keys and tokens
- Session and signing secrets
- OAuth client credentials
- Webhook signing secrets
- Encryption keys

---

## Core Principles

1. **Never commit secrets to version control.** No exceptions.
2. **Environment-specific secrets.** Development and production secrets are always different.
3. **Minimum privilege.** Each service only holds the secrets it requires.
4. **Rotation by schedule.** All secrets are rotated at defined intervals.
5. **Immediate rotation on exposure.** Any suspected exposure triggers immediate rotation.

---

## Secret Storage

| Environment | Storage Method |
|-------------|---------------|
| Development (Replit) | Replit Secrets (environment variable store) |
| Production (Azure) | Azure Key Vault |
| Backup (emergency) | Encrypted password manager (offline, access restricted to founder) |

**Never acceptable:**
- `.env` files with real values committed to git
- Hardcoded credentials in source code
- Secrets in application logs or error messages
- Secrets in `README.md`, comments, or documentation
- Secrets stored in browser localStorage or cookies (only tokens with appropriate TTL)

---

## Secret Classification

| Class | Examples | Rotation | Storage |
|-------|---------|---------|---------|
| **Critical** | `DATABASE_URL`, `SESSION_SECRET`, OAuth secrets | Quarterly + on exposure | Key Vault / Replit Secrets |
| **High** | API keys (Stripe, HuggingFace), SMTP credentials | Annually + on exposure | Key Vault / Replit Secrets |
| **Medium** | Analytics keys (PostHog), mapping tokens | Annually | Key Vault / Replit Secrets |
| **Low** | Public API keys (Stripe publishable key) | Annually | Environment variable (not secret) |

---

## Rotation Schedule

| Secret | Frequency |
|--------|-----------|
| `SESSION_SECRET` | Quarterly |
| `DATABASE_URL` (password component) | Annually |
| `ADMIN_PIN` | Quarterly |
| `STRIPE_SECRET_KEY` | Annually |
| `STRIPE_WEBHOOK_SECRET` | On Stripe key rotation |
| `HUGGINGFACE_API_KEY` | Annually |
| `MAPBOX_ACCESS_TOKEN` | Annually |
| `OAUTH_CLIENT_SECRET` | Per Azure AD recommendation |
| SMTP credentials | Annually |
| `INTERNAL_SERVICE_TOKENS` (each entry) | Quarterly, or immediately on team change |
| `ALLOY_INTERNAL_TOKEN` (legacy, deprecated) | Quarterly until migrated to `INTERNAL_SERVICE_TOKENS` |

For rotation procedures, see [RUNBOOK_SECRETS.md](../infra/runbooks/RUNBOOK_SECRETS.md).

---

## Internal Service Tokens

Server-to-server calls (e.g. AlloyChat → admin endpoints, background workers
recording usage events, internal health probes) are authenticated with the
`x-internal-token` header. The platform supports two configuration paths:

### 1. Preferred — `INTERNAL_SERVICE_TOKENS` (scoped, per-domain)

Set `INTERNAL_SERVICE_TOKENS` to a JSON array. Each entry declares an explicit
scope set; tokens **never** carry blanket `super_admin` privileges.

```json
[
  { "name": "alloy-runner",     "token": "…", "scopes": ["alloy:write", "agent:write"], "pathPrefixes": ["/api/alloy/agent/"] },
  { "name": "health-prober",    "token": "…", "scopes": ["health:read"],                "pathPrefixes": ["/api/internal/health"] },
  { "name": "admin-automation", "token": "…", "scopes": ["internal:write"],             "pathPrefixes": ["/api/internal/"] }
]
```

Recognized scopes (see `artifacts/api-server/src/lib/internal-tokens.ts`):
`alloy:read`, `alloy:write`, `agent:read`, `agent:write`, `health:read`,
`health:write`, `internal:read`, `internal:write`, `usage-events:write`.

Routes that need to gate on a specific scope use the
`requireInternalScope("…")` middleware (defined in
`artifacts/api-server/src/middlewares/auth.ts`). The synthesized request user
for a scoped token is **never** mapped to `super_admin` — it gets the `ops`
role plus its declared scope set.

### 2. Legacy — `ALLOY_INTERNAL_TOKEN` (deprecated, hard-restricted)

Accepted for backward compatibility only. On first use per process the server
logs a deprecation warning. The legacy token is mapped to:

- **Role:** `["ops"]` only — **never `super_admin`**.
- **Scopes:** `["alloy:read","alloy:write","agent:read","agent:write","internal:read","health:read"]`.
  Notably, `internal:write` is **not** granted, so the legacy token cannot
  pass `adminGuard` (which requires `internal:write`).
- **Path allowlist:** the legacy token is accepted **only** on its historical
  surface:
  - `/api/internal/`
  - `/api/alloy/agent/`
  - `/api/health` and `/health` (diagnostics)
  - `/api/env-registry`

  Anything outside this allowlist (e.g. `/api/admin/*`, `/api/orgs/*`,
  `/api/billing/*`, `/api/auth/*`) is treated as if no internal token was
  presented — the caller falls back to normal session/bearer auth.

#### Production startup policy

In production (`NODE_ENV=production`) the server **refuses to boot** if
`ALLOY_INTERNAL_TOKEN` is the only internal token configured (no
`INTERNAL_SERVICE_TOKENS`). Operators with an unavoidable migration window
can opt out by setting `INTERNAL_TOKENS_ALLOW_LEGACY_ONLY=true`; the opt-out
emits a warning on every startup so it cannot be silently left in place.

Operators must treat `ALLOY_INTERNAL_TOKEN` as a transitional control:
migrate each consumer to a scoped `INTERNAL_SERVICE_TOKENS` entry with the
narrowest `pathPrefixes` it actually needs, then remove
`ALLOY_INTERNAL_TOKEN` from the environment.

### Rotation procedure

1. Generate a new token (≥32 random bytes, hex-encoded —
   `openssl rand -hex 32`).
2. Append the new entry to `INTERNAL_SERVICE_TOKENS` alongside the old one
   (both are accepted simultaneously while consumers cut over).
3. Roll the new token to every consumer (AlloyChat workers, background jobs,
   integration partners). Each consumer should fetch the token from its
   secrets store at startup.
4. After 24 hours of zero observed traffic on the old token in audit logs
   (`grep "Internal agent token accepted"` for `tokenName`), remove the old
   entry from `INTERNAL_SERVICE_TOKENS`.
5. Restart the API server to invalidate the in-memory registry cache.
6. Record the rotation in `docs/internal/secret-rotations.log`.

If a token is suspected to be exposed, follow the **Secret Exposure Response**
section below — remove the entry immediately, do not wait for 24h drain.

---

## Secret Exposure Response

If any secret is exposed or suspected to be exposed:

1. **Rotate immediately** — Do not wait to confirm.
2. **Revoke the old credential** at the source.
3. **Audit access logs** — Determine if the secret was used by unauthorized parties.
4. **Update all environments** — Development + Production.
5. **Notify** — stephen@szlholdings.com immediately.
6. **File incident report** — In `docs/internal/incidents/`.
7. **Assess breach notification obligations** — If customer data may be affected.

See [INCIDENT_RESPONSE.md](../INCIDENT_RESPONSE.md) for the full incident workflow.

---

## `.env.example` Policy

A `.env.example` file in each artifact is acceptable and encouraged. It must:
- List all required environment variables with placeholder values
- Include a description comment for each variable
- **Never** include real values — only structure and descriptions

Example:
```bash
# PostgreSQL connection string
DATABASE_URL=postgresql://user:password@host:5432/database

# Session signing secret (generate with: openssl rand -hex 32)
SESSION_SECRET=your-secret-here
```

---

## Code Review Requirements

All code changes must be reviewed for:
- No hardcoded credentials, API keys, or passwords
- No secrets in log statements (`console.log`, `logger.info`, etc.)
- No secrets in error messages returned to the client
- Environment variables accessed via `process.env` only (not imported from files)

---

## Audit and Monitoring

- Azure Key Vault access logs are retained for 90 days
- All secret accesses are logged (who accessed what, when)
- Quarterly audit of all active secrets against this policy
- Annual review of all service accounts and their permissions

---

## Compliance

This policy supports:
- SOC 2 Trust Service Criteria (Security)
- GDPR Article 32 (Security of processing)
- General security best practices (OWASP, CIS Controls)

---

*Maintained by: Stephen Lutar, Founder & CEO, SZL Holdings*
*Last updated: 2026-04-03*
*Next review: 2026-07-01*
