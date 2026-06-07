# Environment Separation — SZL Holdings Platform

> Documentation of how development, staging, and production environments are isolated.

---

## Environment Overview

| Environment | Purpose | Infrastructure | Data |
|-------------|---------|---------------|------|
| **Development** (Replit) | Active development, internal preview | Replit managed | Synthetic demo data |
| **Staging** | Pre-production validation | Azure (staging slot) | Anonymized/synthetic data |
| **Production** | Customer-facing live service | Azure (production) | Real customer data |

---

## Infrastructure Separation

### Development

- **Host:** Replit workspace container
- **Database:** Replit-managed PostgreSQL (separate instance from production)
- **Secrets:** Replit Secrets (isolated from production)
- **Auth:** Replit OIDC (dev-mode)
- **Domain:** `*.replit.dev`
- **Accessible:** Only to authorized Replit workspace collaborators

### Staging

- **Host:** Azure App Service (staging deployment slot)
- **Database:** Azure PostgreSQL Flexible (dedicated staging instance, separate from production)
- **Secrets:** Azure Key Vault (staging vault, different from production vault)
- **Auth:** Azure AD (staging tenant or same tenant, non-production users)
- **Domain:** `staging.szlholdings.com` (internal use only)
- **Accessible:** Internal team only; not publicly accessible

### Production

- **Host:** Azure App Service (production slot)
- **Database:** Azure PostgreSQL Flexible (production instance)
- **Secrets:** Azure Key Vault (production vault)
- **Auth:** Azure AD (production tenant)
- **Domain:** `szlholdings.com`
- **Accessible:** Public

---

## Data Isolation

**Development database** contains only:
- Synthetic demo data (seeded via `pnpm seed:demo`)
- Test user accounts
- No real customer data — ever

**Production database** contains:
- Real customer data
- Real contact form submissions
- Real audit trail
- Real user accounts

**Cross-environment data flow:** No production data is ever copied to development or staging. Migrations move schema changes, never data.

---

## Secret Isolation

Each environment uses completely separate secrets:

| Secret | Dev | Staging | Production |
|--------|-----|---------|-----------|
| `DATABASE_URL` | Replit dev database | Staging Azure PostgreSQL | Production Azure PostgreSQL |
| `SESSION_SECRET` | Dev-only value | Staging-only value | Production-only value |
| `STRIPE_SECRET_KEY` | Stripe test key | Stripe test key | Stripe live key |

Secrets are never shared across environments. The production secret is never known to the development environment.

---

## Code Promotion

Code flows from development → staging → production:

```
Developer (Replit workspace)
        │
        ▼
Merge to main branch
        │
        ▼
Automated tests pass
        │
        ▼
Deploy to staging (Azure staging slot)
        │
        ▼
QA validation in staging
        │
        ▼
Slot swap to production
```

No direct deployment to production from development.

---

## Network Isolation

| Environment | Publicly Accessible | Database Access |
|-------------|--------------------|-----------------| 
| Development | Via Replit proxy only | From Replit container only |
| Staging | Internal IP list only | From staging App Service only |
| Production | Public | From production App Service + admin VPN |

Production database does not accept connections from development or staging environments.

---

## Environment Variables

The `NODE_ENV` variable controls environment-specific behavior:
- `development` — Debug logging, HMR, non-minified builds, Replit Auth
- `production` — Compressed logging, production builds, full security headers

Never set `NODE_ENV=production` in the Replit development environment.

---

## Verifying Environment Isolation

To confirm which environment a running service is using:

```bash
# Check environment
echo $NODE_ENV

# Check database host (should match expected environment)
echo $DATABASE_URL | sed 's/:[^@]*@/@/g'  # Redacts password

# Health check (shows version and environment)
curl /api/health
```

---

*Last updated: 2026-04-03*
