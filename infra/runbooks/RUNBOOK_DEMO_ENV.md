# Runbook: Demo Environment — SZL Holdings Platform

> Setup, management, and reset procedures for the demo environment.

---

## Demo Environment Overview

The demo environment is the Replit workspace with demo data seeded into the development database. It is distinct from production and does not use real customer data.

**Demo org slug:** `demo-canonical`
**Demo user accounts:** Created by seed scripts, defined in `scripts/seed-demo-data.ts`

---

## Initial Setup

If the demo environment is being set up from scratch:

```bash
# Install dependencies
pnpm install

# Apply database migrations
pnpm --filter artifacts/api-server db:migrate

# Seed all demo data
pnpm seed:demo

# Start all workflows (via Replit workflow manager)
```

---

## Seeding Demo Data

### Full Reset (Recommended Before Major Demos)

Drops and reseeds all demo data. Does not affect non-demo orgs.

```bash
pnpm seed:demo
```

This runs `scripts/seed-demo-canonical.sh` which:
1. Removes existing demo org data
2. Creates canonical demo org with configured users
3. Seeds all product demo data (Lyte signals, Vessels fleet, Terra deals, Aegis threats, PRISM matters)
4. Configures demo workflows in Alloy
5. Sets up PRISM Counsel with sample matters

### Partial Seed (By Product)

```bash
# Lyte demo data only
pnpm --filter scripts run seed -- --product lyte

# Vessels demo data only
pnpm --filter scripts run seed -- --product vessels

# Terra demo data only
pnpm --filter scripts run seed -- --product terra

# PRISM Counsel demo data only
pnpm --filter scripts run seed -- --product prism-counsel
```

---

## Checking Demo State

Verify the demo environment is properly configured:

```bash
node scripts/qa/check-demo-seed.js
```

This script validates:
- Demo org exists in database
- Demo users created with correct roles
- Product-specific demo data present
- Alloy workflows configured
- No production data contamination

---

## Common Demo Reset Scenarios

### "The demo data looks stale / signals are old"

```bash
pnpm seed:demo
```

Refreshes all timestamps and regenerates synthetic signals.

### "A demo user can't log in"

1. Check Replit Auth is running (API server workflow)
2. Verify the demo user exists in the database:
   ```sql
   SELECT * FROM users WHERE email LIKE '%demo%';
   ```
3. If user is missing, run `pnpm seed:demo`

### "The Lyte dashboard shows no data"

```bash
pnpm --filter scripts run seed -- --product lyte
```

### "The demo environment is running production data"

This should never happen. Verify `NODE_ENV=development` and `DATABASE_URL` points to the development database, not production.

```bash
echo $NODE_ENV
echo $DATABASE_URL | grep -o "^[^:]*"  # Should NOT show production host
```

---

## Demo Account Credentials

Demo accounts are configured in `scripts/seed-demo-data.ts`. Because this is a Replit Auth environment, authentication is handled by Replit OAuth.

**Demo org access:** Log in with any Replit account, then use the admin panel to assign the demo org role.

For presentations requiring a specific demo account, create a dedicated Replit account for demo purposes and add it to the demo org via `/admin`.

---

## What NOT to Demo

- `/admin` — internal CMS, not for external audiences
- `/investors/*` — investor data room, NDA required
- `/kpi-dashboard` — internal business metrics
- Actual production contact form submissions (use test data)
- Any real customer data

See [DEMO_GUIDE.md](../../DEMO_GUIDE.md) for the full demo script and what to show.

---

## Demo Environment vs. Production

| Aspect | Demo (Replit Dev) | Production (Azure) |
|--------|------------------|-------------------|
| Database | Replit PostgreSQL | Azure PostgreSQL Flexible |
| Data | Synthetic / seeded | Real customer data |
| Auth | Replit OIDC | Production OAuth |
| Domain | `*.replit.dev` | `szlholdings.com` |
| Secrets | Replit Secrets | Azure Key Vault |
| Performance | Dev mode (HMR) | Production build |

Never use production credentials or data in the demo environment.
