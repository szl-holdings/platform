# Bootstrap Admin Setup

This document describes how to provision the initial platform administrator account on a fresh deployment.

---

## Overview

The bootstrap admin seed creates the first `founder_admin` / `super_admin` user in the database. It is designed to be run once after a fresh database migration, but is fully idempotent — running it multiple times is safe.

**Credentials are never hard-coded or logged.** The script reads all sensitive values from environment variables.

---

## Required Secrets

Set the following in Replit Secrets (or your deployment environment) before running:

| Secret | Description |
|--------|-------------|
| `BOOTSTRAP_ADMIN_USERNAME` | Display name for the admin account (e.g. `Platform Admin`) |
| `BOOTSTRAP_ADMIN_EMAIL` | Email address used to log in |
| `BOOTSTRAP_ADMIN_PASSWORD` | Password — minimum 12 characters; use a password manager |

Do **not** pass these as CLI arguments or shell variables visible in `ps` output.

---

## Running the Script

```bash
# Using the workspace seed command
pnpm --filter @workspace/scripts run seed:bootstrap-admin

# Or directly with tsx
tsx scripts/seed-bootstrap-admin.ts
```

The script will:

1. Validate all required environment variables are present.
2. Validate the password meets minimum length requirements.
3. Hash the password using PBKDF2-SHA512 with a random 32-byte salt (100,000 iterations) — the same algorithm used by the live auth route.
4. Upsert the user record by email — if the user already exists, the display name, password hash, and `platformRole` are updated.
5. Ensure `super_admin` and `admin` role records exist (idempotent).
6. Assign both roles to the admin user (idempotent).

---

## Security Notes

- **Password hashing:** PBKDF2-SHA512, 100,000 iterations, 64-byte output, random 32-byte salt per hash. Hash format: `pbkdf2:<salt-hex>:<hash-hex>`.
- **No credential logging:** The script emits newline-delimited JSON log entries (fields: `ts`, `level`, `script`, `event`, optional metadata). Entries include the user ID but never the raw password, hash, or any credential value.
- **Idempotent:** Safe to run in CI/CD pipelines on every deploy; subsequent runs are no-ops if the user already exists with the same email.
- **Admin privilege escalation:** The bootstrap admin is assigned `founder_admin` platform role and both `super_admin` and `admin` RBAC roles. Treat the bootstrap credentials as a break-glass secret and rotate after the first login.

---

## After First Login

1. Log in with the bootstrap credentials at the admin interface.
2. Immediately change the password to a different value and invalidate all existing sessions.
3. Create personal admin accounts for each operator; do not share the bootstrap account.
4. Optionally, disable or deactivate the bootstrap account once personal accounts are established.

---

## Environment Configuration

All required secrets are documented in `.env.example` under the `Admin / Bootstrap` section. Add them to Replit Secrets before running in production.

```bash
BOOTSTRAP_ADMIN_USERNAME=Platform Admin
BOOTSTRAP_ADMIN_EMAIL=admin@szlholdings.com
BOOTSTRAP_ADMIN_PASSWORD=<generate with: openssl rand -base64 24>
```
