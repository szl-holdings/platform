# Production Secret Checklist

Generated: 2026-04-15

## Workspace Secrets (Development)

These are set in the Replit Secrets panel for the development workspace.

| Secret | Required | Category | Notes |
|--------|----------|----------|-------|
| `DATABASE_URL` | Yes | Core | Auto-provisioned by Replit |
| `SESSION_SECRET` | Yes | Core | 64-char hex |
| `ALLOY_INTERNAL_TOKEN` | Yes | Core | Service-to-service auth |
| `FIELD_ENCRYPTION_KEY` | Yes | Security | 64-char hex for PII encryption |
| `CONNECTOR_ENCRYPTION_KEY` | Yes | Security | 64-char hex for connector creds |
| `OPENAI_API_KEY` | Optional | AI | For AI features |
| `ANTHROPIC_API_KEY` | Optional | AI | For AI features |
| `GEMINI_API_KEY` | Optional | AI | For AI features |
| `STRIPE_SECRET_KEY` | Optional | Payments | sk_test_* for dev |
| `SENDGRID_API_KEY` | Optional | Email | For transactional email |
| `MAPBOX_ACCESS_TOKEN` | Optional | Maps | For map features |

## Deployment Secrets (Staging)

These are set in the Replit deployment configuration for staging.

| Secret | Required | Notes |
|--------|----------|-------|
| `NODE_ENV` | Yes | Set to `staging` |
| `DATABASE_URL` | Yes | Staging database URL |
| `SESSION_SECRET` | Yes | Different from dev |
| `ALLOY_INTERNAL_TOKEN` | Yes | Different from dev |
| `FIELD_ENCRYPTION_KEY` | Yes | Different from dev |
| `CONNECTOR_ENCRYPTION_KEY` | Yes | Different from dev |
| `CORS_ORIGINS` | Yes | Staging domain |

## Deployment Secrets (Production)

These are set in the Replit deployment configuration for production.

| Secret | Required | Notes |
|--------|----------|-------|
| `NODE_ENV` | Yes | Set to `production` |
| `DATABASE_URL` | Yes | Production database URL |
| `SESSION_SECRET` | Yes | Unique production value, rotated quarterly |
| `ALLOY_INTERNAL_TOKEN` | Yes | Unique production value |
| `FIELD_ENCRYPTION_KEY` | Yes | Unique production value, rotated quarterly |
| `CONNECTOR_ENCRYPTION_KEY` | Yes | Unique production value |
| `CORS_ORIGINS` | Yes | Production domain only |
| `OPENAI_API_KEY` | Yes | Production key with usage limits |
| `ANTHROPIC_API_KEY` | Yes | Production key |
| `STRIPE_SECRET_KEY` | Yes | sk_live_* with restricted permissions |

## GitHub Actions Secrets

| Secret | Required | Used By |
|--------|----------|---------|
| `REPLIT_STAGING_DEPLOY_TOKEN` | Yes | deploy-staging.yml |
| `REPLIT_STAGING_APP_ID` | Yes | deploy-staging.yml |
| `REPLIT_PROD_DEPLOY_TOKEN` | Yes | deploy-production.yml |
| `REPLIT_PROD_APP_ID` | Yes | deploy-production.yml |

## Verification

After setting secrets, verify:

1. API health check returns 200: `curl /api/health`
2. No secrets in client bundles: `grep -r "sk-\|sk_live" dist/`
3. Encryption works: Try creating an encrypted field via API
4. Auth works: Try login flow
5. AI features work: Try an AI-powered feature (if keys set)
