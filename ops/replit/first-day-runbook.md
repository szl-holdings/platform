# First Day Runbook — SZL Holdings Platform

Generated: 2026-04-15

## 1. Clone & Install

```bash
# Clone the monorepo
git clone https://github.com/szl-holdings/szl-holdings-platform.git
cd szl-holdings-platform

# Install dependencies (pnpm only)
pnpm install
```

## 2. Set Required Secrets

In the Replit Secrets panel (or `.env` for local dev), set:

### Minimum Required
```
DATABASE_URL              # Auto-set by Replit PostgreSQL
SESSION_SECRET            # Run: openssl rand -hex 32
ALLOY_INTERNAL_TOKEN      # Run: openssl rand -base64 48
FIELD_ENCRYPTION_KEY      # Run: openssl rand -hex 32
CONNECTOR_ENCRYPTION_KEY  # Run: openssl rand -hex 32
```

### For AI Features (optional in dev)
```
OPENAI_API_KEY
ANTHROPIC_API_KEY
GEMINI_API_KEY
```

## 3. Database Setup

The database is automatically provisioned by Replit. To sync the schema:

```bash
pnpm --filter @szl-holdings/db run push
```

To seed demo data:
```bash
pnpm seed:demo
```

## 4. Start Development

### All apps at once
```bash
pnpm dev
```

### Individual apps
```bash
# API server
pnpm --filter @workspace/api-server run dev

# Flagship web
pnpm --filter @workspace/szl-holdings run dev

# Specific domain app
pnpm --filter @workspace/terra run dev
```

## 5. Verify Everything Works

### Quick health checks
```bash
# API server
curl http://localhost:8080/api/health

# Web apps (via Replit proxy)
curl http://localhost:80/szl-holdings/
curl http://localhost:80/firestorm/
curl http://localhost:80/terra/
curl http://localhost:80/vessels/
```

### Run tests
```bash
# Unit + API tests
pnpm test

# Integration tests
pnpm test:integration

# QA suite
pnpm qa:site
```

## 6. Key URLs (Development)

| App | Local URL |
|-----|-----------|
| SZL Holdings | `$REPLIT_DEV_DOMAIN/szl-holdings/` |
| Aegis | `$REPLIT_DEV_DOMAIN/firestorm/` |
| Terra | `$REPLIT_DEV_DOMAIN/terra/` |
| Vessels | `$REPLIT_DEV_DOMAIN/vessels/` |
| Carlota Jo | `$REPLIT_DEV_DOMAIN/carlota-jo/` |
| Command | `$REPLIT_DEV_DOMAIN/command/` |
| API Docs | `$REPLIT_DEV_DOMAIN/api/docs` |
| API Health | `$REPLIT_DEV_DOMAIN/api/health` |

## 7. Build & Deploy

```bash
# Full build (typecheck + all artifacts)
pnpm build

# Deploy to staging
# Push to main branch triggers deploy-staging.yml

# Deploy to production
# Create a GitHub Release triggers deploy-production.yml
```

## 8. Common Issues

| Issue | Fix |
|-------|-----|
| Port conflict | Each app has a unique port in artifact.toml |
| Preview blank | Restart the workflow, check logs |
| drizzle-kit push timeout | Non-fatal, retry manually |
| pnpm install fails | Delete node_modules, run `pnpm install --force` |
| API 401 | Check ALLOY_INTERNAL_TOKEN is set |
