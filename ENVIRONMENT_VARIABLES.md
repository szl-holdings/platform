# Environment Variables Reference

Canonical reference for all environment variables used across the SZL Holdings monorepo.

See `.env.example` for the full list with inline comments and default values.

---

## Classification

| Code | Meaning |
|------|---------|
| **required-prod** | Must be set in production (Replit Secrets). Missing = service failure. |
| **required-local** | Must be set for any local dev run. |
| **optional** | Service degrades gracefully (mock/demo mode) if absent. |
| **demo-fallback** | Has a safe hard-coded demo value; override for real data. |

---

## Security & Cryptography

### `IP_HASH_SALT`

| Property | Value |
|----------|-------|
| Classification | **required-prod** |
| Default | *(none — empty string used as fallback, which is insecure)* |
| Used by | `lib/audit/src/ip-hash.ts`, `scripts/migrate-ip-hashes.ts` |

**Purpose.** A secret salt prepended to every IP address before it is SHA-256 hashed. The hash (truncated to 40 hex chars, prefixed `sha256:`) is what gets stored in audit tables (`activity_log`, `audit_events`, `alloy_audit_log`, `platform_audit_log`). Salting prevents precomputation attacks over the finite IPv4/v6 address space.

**Format.** Any non-empty string. Recommended: 32+ bytes of random hex.

```sh
# Generate a suitable value:
openssl rand -hex 32
```

**Rotation implications.**

- Rotating `IP_HASH_SALT` changes every future hash output.
- Rows written before rotation will have hashes produced with the old salt and **will not correlate** with rows written after rotation.
- The migration script (`pnpm --filter @workspace/scripts migrate:ip-hashes`) re-hashes using whatever salt is currently set. If you rotate the salt after running the backfill, the historical rows become un-correlatable with new writes — this is intentional for privacy (forward-only re-keying).
- Rotation is a one-way operation: there is no rollback without re-running the migration with the old salt.

**Without a salt.** If `IP_HASH_SALT` is unset in production, `hashIp()` logs a warning and falls back to an empty-string salt. Unsalted SHA-256 hashes over the IPv4/v6 space are trivially reversible via precomputation. **Always set this in production.**

---

### `SESSION_SECRET`

| Property | Value |
|----------|-------|
| Classification | **required-prod** |
| Used by | Session middleware (`artifacts/api-server`) |

Secret used to sign session cookies. Generate with `openssl rand -hex 32`.

---

### `OAUTH_STATE_SECRET`

| Property | Value |
|----------|-------|
| Classification | **required-prod** |
| Used by | OAuth CSRF state validation |

Secret used to sign OAuth state parameters. Generate with `openssl rand -hex 32`.

---

## Database

### `DATABASE_URL`

| Property | Value |
|----------|-------|
| Classification | **required-local**, **required-prod** |
| Format | `postgresql://user:password@host:5432/dbname` |

Primary PostgreSQL connection string.

---

## A11oy Atelier

| Variable | Classification | Purpose |
|----------|----------------|---------|
| `A11OY_ATELIER_XAI_API_KEY` | **optional, server-only** | Enables the fixed-endpoint xAI Responses API adapter. Never expose through a `VITE_` variable. |
| `A11OY_ATELIER_GROK_CLI_PATH` | **optional, local-only** | Absolute path to a locally installed, signed Grok Build executable. Do not configure in deployed containers. |
| `A11OY_ATELIER_MODEL` | **optional** | Provider model identifier; defaults to `grok-4.6`. |
| `A11OY_ATELIER_API_BASE_URL` | **optional, CLI-only** | Base URL used by `a11oy-atelier`; defaults to `http://127.0.0.1:8080`. |
| `A11OY_ATELIER_TENANT_ID` | **optional, CLI-only** | Tenant header used by the local CLI; defaults to `default`. |
| `VITE_A11OY_ATELIER_TENANT_ID` | **optional, non-secret** | Development tenant selector for the browser. Production identity remains authoritative. |

Atelier does **not** emit mock model responses. If neither the direct API key nor a usable local CLI path is configured, provider selection fails closed. The local CLI adapter disables tools, web search, and subagents for the v1 workbench boundary.

## Server

### `PORT`

| Property | Value |
|----------|-------|
| Classification | **required-local** |
| Default | `3000` (Replit sets this automatically in hosted environments) |

TCP port the server binds to.

### `NODE_ENV`

| Property | Value |
|----------|-------|
| Classification | **required-local** |
| Values | `development` \| `staging` \| `production` |

Standard Node.js environment discriminator.

### `BASE_URL`

| Property | Value |
|----------|-------|
| Classification | **optional** |
| Example | `https://szlholdings.com/api` |

Public-facing base URL of the API server (no trailing slash).

---

*For the complete list of all environment variables with inline comments and defaults, see `.env.example` and `artifacts/api-server/.env.example`.*
