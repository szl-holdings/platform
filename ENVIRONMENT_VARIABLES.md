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
| `A11OY_ATELIER_CONTINUITY_DIR` | **optional, server-only** | Absolute, non-root directory for encrypted local Turn Capsule continuity. Configure together with `A11OY_ATELIER_CONTINUITY_KEY`. |
| `A11OY_ATELIER_CONTINUITY_KEY` | **optional, server-only secret** | Exactly 32 bytes encoded as 64 hex characters or padded base64. Configure together with `A11OY_ATELIER_CONTINUITY_DIR`; retain the same key across an intended restart. |
| `A11OY_ATELIER_CONTINUITY_REQUIRED` | **optional, server-only** | Accepts `true`/`false`, `yes`/`no`, or `1`/`0`; defaults to false outside production. NODE_ENV=production always requires durable continuity; a false flag cannot disable that boundary. |

Atelier does **not** emit mock model responses. If neither the direct API key nor a usable local CLI path is configured, provider selection fails closed. The local CLI adapter disables tools, web search, and subagents for the v1 workbench boundary.

Outside production, without both continuity variables and unless durable continuity is explicitly required, Atelier uses an in-process, non-durable Turn Capsule store. Production, explicit-required mode, and invalid partial configuration fail only the Atelier surface closed with sanitized unavailable health; unrelated runtime routes remain mountable. With both variables, the encrypted local adapter provides authenticated, restart-safe session continuity for a single runtime process on one host. It enforces expiry and orphan cleanup on startup, continuity operations, and a 15-minute running-service sweep; physical files cannot self-delete while the process or host is off. This is not a distributed or multi-host persistence claim: there is no distributed lock or shared database. The EvidenceLedger append remains process-local and is not made durable by the Turn Capsule store.

### Shared local proxy

| Variable | Classification | Purpose |
|----------|----------------|---------|
| `SHARED_PROXY_PORT` | **optional, local-only** | Shared-proxy listener; defaults to `9090` and must be an integer from `1024` through `65535`. |
| `SHARED_PROXY_A11OY_PORT` | **optional, local-only** | A11oy UI upstream for `/a11oy/`; defaults to `4110` and must be an integer from `1` through `65535`. |
| `SHARED_PROXY_API_PORT` | **optional, local-only** | Runtime API upstream for `/api/` and `/ws/`; defaults to `8080` and must be an integer from `1` through `65535`. |
| `SHARED_PROXY_BIND_HOST` | **optional, local-only** | Listener address; defaults to `0.0.0.0` and accepts only `0.0.0.0`, `::`, `127.0.0.1`, or `::1`. A local API-key bridge requires a loopback value. |
| `SHARED_PROXY_LOCAL_API_KEY_BRIDGE` | **optional, local-only** | Accepts `true`/`false`, `yes`/`no`, or `1`/`0`; defaults to false. When enabled on loopback, the server-side proxy attaches `ALLOY_API_KEY` and the fixed local tenant only for `/api/a11oy/v1/atelier` routes, and rejects unexpected Host or Origin values. |
| `SHARED_PROXY_LOCAL_TENANT_ID` | **required when the local bridge is enabled** | Fixed tenant ID for the loopback-only bridge; a non-empty, trimmed value of at most 128 characters. The proxy ignores browser-supplied tenant headers on Atelier routes. This is local development scoping, not user authentication. |
| `ALLOY_API_KEY` | **required-prod, server-only secret** | Runtime API credential. The loopback-only bridge reads it in the proxy process but never serializes it into browser assets, forwarded responses, or proxy status. |

The shared proxy resolves these values when it starts. It rejects malformed or out-of-range ports and refuses a listener that equals any configured upstream or the canonical fallback port. Port overrides route traffic only; they do not start or reconfigure the upstream processes. The local API-key bridge is deliberately disabled by default and fails closed unless a loopback bind, a fixed local tenant, and a non-empty, trimmed `ALLOY_API_KEY` are present. It authenticates the local proxy-to-Atelier-API hop without placing the key in browser JavaScript; it is not a substitute for deployed identity, TLS, or an authenticated edge.

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
