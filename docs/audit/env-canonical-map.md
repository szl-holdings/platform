# SZL Holdings — Environment Variable Canonical Map

**Date:** April 16, 2026
**Source:** Codebase-wide `process.env.*` scan (156 distinct vars), `.env.example`, `lib/config/src/index.ts`, `artifacts/api-server/src/lib/env-config.ts`, `.replit` `[userenv]` blocks
**Purpose:** Single authoritative reference for every environment variable — owner, tier, and current state

---

## Tier Definitions

| Tier | Meaning |
|---|---|
| **Required** | Platform will not start or core feature will fail if absent |
| **Required-for-feature** | Feature is silently disabled or degraded if absent; platform still starts |
| **Optional** | Configuration tuning only; has safe defaults |
| **Dev-only** | Only relevant in development; not used in production |
| **Platform-provided** | Injected automatically by Replit; never set manually |
| **Deprecated** | Should be removed; replaced by a canonical alternative |

---

## Group 1: Core Server

| Variable | Tier | Owner | Current State | Notes |
|---|---|---|---|---|
| `NODE_ENV` | Required | Platform | Set via Replit `[userenv]` (`production` in prod, `development` in dev) | Do not override manually |
| `PORT` | Required | Platform | Auto-assigned per artifact by Replit | Never hardcode |
| `LOG_LEVEL` | Optional | Ops | Default: `info`; set to `debug` for dev tracing | Set in `[userenv.production]` |
| `REPL_ID` | Platform-provided | Replit | Injected by Replit runtime | Unique identifier for this Repl instance |
| `REPLIT_DEV_DOMAIN` | Platform-provided | Replit | Injected by Replit runtime | Hostname for the Replit dev proxy |

---

## Group 2: Database

| Variable | Tier | Owner | Current State | Notes |
|---|---|---|---|---|
| `DATABASE_URL` | **Required** | Ops / Replit | Stored in Replit Secrets | Primary — use this over individual PG_ vars |
| `PGHOST` | Platform-provided | Replit | Auto-provided alongside DATABASE_URL | Fallback only |
| `PGPORT` | Platform-provided | Replit | Auto-provided | Fallback only |
| `PGUSER` | Platform-provided | Replit | Auto-provided | Fallback only |
| `PGPASSWORD` | Platform-provided | Replit | Stored in Replit Secrets | Fallback only |
| `PGDATABASE` | Platform-provided | Replit | Auto-provided | Fallback only |
| `DB_POOL_MIN` | Optional | Ops | Default: 2 | Connection pool tuning |
| `DB_POOL_MAX` | Optional | Ops | Default: 10 | Connection pool tuning |
| `DB_CONNECT_TIMEOUT_MS` | Optional | Ops | Default: 5000 | |
| `DB_IDLE_TIMEOUT_MS` | Optional | Ops | Default: 30000 | |
| `DB_STATEMENT_TIMEOUT_MS` | Optional | Ops | Default: 10000 | |
| `SLOW_QUERY_THRESHOLD_MS` | Optional | Ops | Default: 500 | Slow query log threshold |

---

## Group 3: Authentication

| Variable | Tier | Owner | Current State | Notes |
|---|---|---|---|---|
| `SESSION_SECRET` | **Required** | Ops | Stored in Replit Secrets | Must be ≥32 random bytes; rotate periodically |
| `ISSUER_URL` | Required | Ops | Default: `https://replit.com/oidc` | OIDC provider URL; auto-configured for Replit Auth |
| `OAUTH_STATE_SECRET` | Required | Ops | Stored in Replit Secrets | PKCE state signing; generate with `openssl rand -hex 32` |
| `SESSION_TTL_MS` | Optional | Ops | Default: 7 days (604800000 ms) | Consider shorter for high-security apps |
| `ALLOY_INTERNAL_TOKEN` | **Required** | Ops | Stored in Replit Secrets | Grants `super_admin` for internal service-to-service calls; **high risk if leaked** |
| `ADMIN_PIN` | Required-for-feature | Ops | Not configured | Admin PIN gate for sensitive operations |
| `ALLOY_EMAIL_INGEST_SECRET` | Required-for-feature | Ops | Not configured | Validates incoming Alloy email webhook HMAC signature |

---

## Group 4: CORS / Networking

| Variable | Tier | Owner | Current State | Notes |
|---|---|---|---|---|
| `CORS_ORIGINS` | **Required for production** | Ops | Set in `.replit` `[userenv.production]` to `https://*.replit.app,...` | Must be explicitly set before first external deployment |
| `PUBLIC_APP_URL` | Required | Ops | Set in `.replit` `[userenv.production]` as `https://szlholdings.replit.app` | Used for link generation, OAuth redirects |
| `BASE_URL` | Optional | Ops | Not set; derived from `PUBLIC_APP_URL` at runtime | Canonical root URL for internal link generation |
| `SZL_API_BASE` | Optional | Ops | Not set; defaults to relative URL in dev | Base URL for API calls from frontend artifacts |
| `PROXY_PORT` | Optional | Dev | Not set | Internal proxy port override; rarely needed |
| `VITE_APP_URL` | Optional | Dev | Not set; dev uses auto-detected base URL | Frontend base URL override |
| `VITE_PORT` | Dev-only | Dev | Not set | Vite dev server port override |

---

## Group 5: AI Integrations (Canonical — Replit Proxy)

| Variable | Tier | Owner | Current State | Notes |
|---|---|---|---|---|
| `AI_INTEGRATIONS_OPENAI_API_KEY` | **Required** | Replit AI Integration | Stored in Replit Secrets | **Canonical** — routes through Replit AI proxy |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | **Required** | Replit AI Integration | Stored in Replit Secrets | Replit proxy URL |
| `AI_INTEGRATIONS_ANTHROPIC_API_KEY` | **Required** | Replit AI Integration | Stored in Replit Secrets | **Canonical** |
| `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` | **Required** | Replit AI Integration | Stored in Replit Secrets | Replit proxy URL |
| `AI_INTEGRATIONS_GEMINI_API_KEY` | Required-for-feature | Replit AI Integration | Stored in Replit Secrets | |
| `AI_INTEGRATIONS_GEMINI_BASE_URL` | Required-for-feature | Replit AI Integration | Stored in Replit Secrets | |
| `GEMINI_API_KEY` | **Deprecated** | — | Not configured in production | Direct Gemini key; superseded by `AI_INTEGRATIONS_GEMINI_API_KEY`; remove |
| `OPENAI_API_KEY` | **Deprecated** | — | Not configured in production | Superseded by `AI_INTEGRATIONS_OPENAI_API_KEY`; remove |
| `ANTHROPIC_API_KEY` | **Deprecated** | — | Not configured in production | Superseded by `AI_INTEGRATIONS_ANTHROPIC_API_KEY`; remove |
| `HF_TOKEN` | Required-for-feature | Ops | Not configured | HuggingFace API token (same credential as `HUGGINGFACE_API_KEY`) |
| `HUGGINGFACE_API_KEY` | Required-for-feature | Ops | Not configured | HuggingFace Inference API key; use one of HF_TOKEN/HUGGINGFACE_API_KEY |
| `AI_EXECUTION_MODE` | Optional | Ops | Default: `live` | Set to `mock` to disable live AI calls globally for testing |

---

## Group 6: Email Delivery

| Variable | Tier | Owner | Current State | Notes |
|---|---|---|---|---|
| `RESEND_API_KEY` | Required-for-feature | Ops | **Not configured** — graceful silent fallback | Primary email provider |
| `EMAIL_PROVIDER` | Optional | Ops | Not set; defaults to `resend` | Override email provider: `resend`, `sendgrid`, or `smtp` |
| `SZL_INTERNAL_EMAIL` | Optional | Ops | Default: `team@szlholdings.com` | Admin notification address |
| `STEPHEN_ADMIN_EMAIL` | Optional | Ops | Not set | Per-app admin email |
| `CARLOTA_ADMIN_EMAIL` | Optional | Ops | Not set | Per-app admin email |
| `SENDGRID_API_KEY` | Required-for-feature | Ops | **Not configured** | Alternative to Resend; only one should be active |
| `SMTP_HOST` | Optional | Ops | Not set | SMTP fallback |
| `SMTP_PORT` | Optional | Ops | Default: 587 | |
| `SMTP_USER` | Optional | Ops | Not set | |
| `SMTP_PASS` | Optional | Ops | Not set | |
| `SMTP_FROM` | Optional | Ops | Not set | |

**Note:** Multiple email delivery paths (Resend, SendGrid, SMTP) exist. Only one should be configured. Resend is the canonical choice.

---

## Group 7: Stripe / Billing

| Variable | Tier | Owner | Current State | Notes |
|---|---|---|---|---|
| `STRIPE_SECRET_KEY` | Required-for-feature | Ops | **Not configured** — demo mode only | Use live key (`sk_live_...`) in production |
| `STRIPE_PUBLISHABLE_KEY` | Required-for-feature | Ops | **Not configured** | Frontend Stripe.js key |
| `STRIPE_WEBHOOK_SECRET` | Required-for-feature | Ops | **Not configured** | Webhook signature verification |
| `STRIPE_PRICE_STRATEGY_SESSION` | Required-for-feature | Ops | Not configured | Carlota Jo service price ID |
| `STRIPE_PRICE_ADVISORY_RETAINER` | Required-for-feature | Ops | Not configured | |
| `STRIPE_PRICE_PORTFOLIO_REVIEW` | Required-for-feature | Ops | Not configured | |
| `STRIPE_PRICE_TERRA_STARTER` | Required-for-feature | Ops | Not configured | |
| `STRIPE_PRICE_TERRA_PRO` | Required-for-feature | Ops | Not configured | |
| `STRIPE_PRICE_FIRESTORM_ENTERPRISE` | Required-for-feature | Ops | Not configured | |
| `STRIPE_PRICE_LYTE_STARTER` | Required-for-feature | Ops | Not configured | |
| `STRIPE_PRICE_LYTE_PRO` | Required-for-feature | Ops | Not configured | |
| `STRIPE_PRICE_VESSELS_FLEET` | Required-for-feature | Ops | Not configured | |

---

## Group 8: Feature Flags

| Variable | Tier | Default | Owner | Notes |
|---|---|---|---|---|
| `FEATURE_ALLOY_ORCHESTRATION` | Optional | `true` | Ops | Disable to turn off Alloy orchestration |
| `FEATURE_ALLOY_GOVERNANCE` | Optional | `true` | Ops | |
| `FEATURE_ALLOY_WEBHOOKS` | Optional | `true` | Ops | |
| `FEATURE_AUDIT_LOGGING` | Optional | `true` | Ops | |
| `ALLOY_WORKFLOW_AUTO_RUN` | Optional | `true` | Ops | Auto-run workflows on startup |
| `ALLOY_REQUIRE_APPROVAL_CRITICAL` | Optional | `true` | Ops | Human-in-the-loop gate for critical operations |
| `ALLOY_MAX_BATCH_SIZE` | Optional | `100` | Ops | Max batch processing size |
| `DEMO_MODE` | Optional | `false` | Ops | Enables demo mode with synthetic data and disabled writes |
| `AIS_FEED_ENABLED` | Optional | `true` | Ops | Enable live AIS maritime feed ingestion |
| `LEGAL_FEED_ENABLED` | Optional | `true` | Ops | Enable CourtListener legal case feed |
| `SANCTIONS_FEED_ENABLED` | Optional | `true` | Ops | Enable OFAC/UN/EU sanctions feed ingestion |
| `STIX_FEED_ENABLED` | Optional | `true` | Ops | Enable STIX/TAXII threat intelligence feed |
| `SYNTHETIC_ALERTS` | Optional | `false` | Dev | Generate synthetic alerts for demo/testing |

---

## Group 9: Maps & Geospatial

| Variable | Tier | Owner | Current State | Notes |
|---|---|---|---|---|
| `MAPBOX_ACCESS_TOKEN` | Required-for-feature | Ops | **Not configured** | Required for map views in Terra and Vessels |
| `GOOGLE_MAPS_API_KEY` | Required-for-feature | Ops | **Not configured** | Google Maps alternative for Terra address geocoding |
| `MARINE_TRAFFIC_API_KEY` | Required-for-feature | Ops | **Not configured** | Live AIS vessel tracking (paid subscription) |
| `WEATHER_API_KEY` | Required-for-feature | Ops | **Not configured** | Weather API for Vessels; Open-Meteo is free fallback |

---

## Group 10: Communications / Notifications

| Variable | Tier | Owner | Current State | Notes |
|---|---|---|---|---|
| `SLACK_WEBHOOK_URL` | Required-for-feature | Ops | Not configured | Slack alert channel webhook |
| `SLACK_BOT_TOKEN` | Required-for-feature | Ops | Not configured | Slack bot API token |
| `SLACK_ALERT_CHANNEL` | Optional | Ops | Not configured | Channel ID for alerts |
| `SLACK_SIGNING_SECRET` | Required-for-feature | Ops | Not configured | Validates incoming Slack event webhooks |
| `ALLOY_DIGEST_SLACK_CHANNEL` | Optional | Ops | Not configured | Slack channel for Alloy governance digest messages |
| `MICROSOFT_TEAMS_WEBHOOK_URL` | Required-for-feature | Ops | Not configured | Teams webhook for Alloy notifications |
| `TWILIO_ACCOUNT_SID` | Required-for-feature | Ops | Not configured | SMS notifications |
| `TWILIO_AUTH_TOKEN` | Required-for-feature | Ops | Not configured | |
| `TWILIO_PHONE_NUMBER` | Required-for-feature | Ops | Not configured | |

---

## Group 11: Google Identity

| Variable | Tier | Owner | Current State | Notes |
|---|---|---|---|---|
| `GOOGLE_CLIENT_ID` | Required-for-feature | Ops | Not configured | Google OAuth for Carlota Jo / calendar integration |
| `GOOGLE_CLIENT_SECRET` | Required-for-feature | Ops | Not configured | |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Required-for-feature | Ops | Not configured | Service account for Google Workspace API |
| `GOOGLE_PROJECT_ID` | Required-for-feature | Ops | Not configured | |
| `NOTION_API_KEY` | Required-for-feature | Ops | Not configured | Notion integration for Aegis |

---

## Group 11b: Microsoft Identity

| Variable | Tier | Owner | Current State | Notes |
|---|---|---|---|---|
| `MICROSOFT_CLIENT_ID` | Required-for-feature | Ops | Not configured | Microsoft OAuth app client ID |
| `MICROSOFT_CLIENT_SECRET` | Required-for-feature | Ops | Not configured | Microsoft OAuth app client secret |
| `MICROSOFT_TENANT_ID` | Required-for-feature | Ops | Not configured | Azure tenant for Microsoft SSO |
| `MICROSOFT_GRAPH_TOKEN` | Required-for-feature | Ops | Not configured | Microsoft Graph API bearer token (service account) |
| `AZURE_AD_CLIENT_ID` | Required-for-feature | Ops | Not configured | Azure AD application client ID (enterprise SSO) |
| `AZURE_AD_CLIENT_SECRET` | Required-for-feature | Ops | Not configured | Azure AD client secret |
| `AZURE_AD_TENANT_ID` | Required-for-feature | Ops | Not configured | Azure AD tenant ID |

---

## Group 12: Observability & Error Tracking

| Variable | Tier | Owner | Current State | Notes |
|---|---|---|---|---|
| `SENTRY_DSN` | Required-for-feature | Ops | **Not configured** | Error tracking; errors log to console only without this |
| `VITE_PLAUSIBLE_DOMAIN` | Dev-only | Dev | Not configured | Plausible analytics domain |
| `AZURE_APP_INSIGHTS_CONNECTION_STRING` | Required-for-feature | Ops | Not configured | Azure APM (enterprise deployment only) |
| `NEW_RELIC_LICENSE_KEY` | Required-for-feature | Ops | Not configured | New Relic APM agent license key |
| `OTEL_SERVICE_NAME` | Optional | Ops | Not configured | OpenTelemetry service name label |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Required-for-feature | Ops | Not configured | OTLP gRPC/HTTP endpoint for trace/metric export |
| `OTLP_ENDPOINT` | Optional | Ops | Not configured | Alias for `OTEL_EXPORTER_OTLP_ENDPOINT` (legacy) |
| `OTEL_CONSOLE_EXPORT` | Dev-only | Dev | Not configured | Set to `true` to export OTEL spans to console (dev only) |

---

## Group 13: Object Storage

| Variable | Tier | Owner | Current State | Notes |
|---|---|---|---|---|
| `OBJECT_STORAGE_BUCKET_ID` | Required-for-feature | Replit | Stored in Replit Secrets | **Primary** — Replit GCS-backed App Storage bucket ID |
| `OBJECT_STORE_BUCKET` | Required-for-feature | Ops | Not configured | Alternative bucket identifier (same credential) |
| `PRIVATE_OBJECT_DIR` | Optional | Ops | Default: `private/` | Root path for private object storage |
| `PUBLIC_OBJECT_SEARCH_PATHS` | Optional | Ops | Not configured | Comma-separated list of public object path prefixes |
| `DEFAULT_ORG_STORAGE_QUOTA_BYTES` | Optional | Ops | Default: 5GB | Per-org storage quota cap |
| `BACKUP_DIR` | Optional | Ops | Not configured | Local filesystem path for database backup dumps |
| `STORAGE_ACCESS_KEY` | Required-for-feature | Ops | Not configured | S3-compatible access key (fallback for non-Replit deploy) |
| `STORAGE_SECRET_KEY` | Required-for-feature | Ops | Not configured | |
| `STORAGE_BUCKET` | Required-for-feature | Ops | Not configured | |
| `STORAGE_ENDPOINT` | Required-for-feature | Ops | Not configured | |

---

## Group 14: Azure (Enterprise Deployment)

| Variable | Tier | Owner | Current State | Notes |
|---|---|---|---|---|
| `AZURE_KEY_VAULT_URL` | Required-for-feature | Ops | Not configured | Azure Key Vault for enterprise secrets |
| `AZURE_STORAGE_CONNECTION_STRING` | Required-for-feature | Ops | Not configured | Azure Blob Storage |
| `AZURE_REDIS_CONNECTION_STRING` | Required-for-feature | Ops | Not configured | Redis for session store at scale |
| `AZURE_PG_CONNECTION_STRING` | Required-for-feature | Ops | Not configured | Azure PostgreSQL Flexible Server |
| `AZURE_DOC_INTEL_ENDPOINT` | Required-for-feature | Ops | Not configured | Azure AI Document Intelligence endpoint URL |
| `AZURE_DOC_INTEL_KEY` | Required-for-feature | Ops | Not configured | Azure Document Intelligence API key |
| `PURVIEW_ENABLED` | Optional | Ops | Default: `false` | Enable Microsoft Purview data governance integration |

---

## Group 15: CRM & Third-Party Integrations

| Variable | Tier | Owner | Current State | Notes |
|---|---|---|---|---|
| `SALESFORCE_ACCESS_TOKEN` | Required-for-feature | Ops | Not configured | Salesforce OAuth access token |
| `SALESFORCE_INSTANCE_URL` | Required-for-feature | Ops | Not configured | Salesforce instance base URL |
| `SALESFORCE_CLIENT_ID` | Required-for-feature | Ops | Not configured | Salesforce connected app client ID (for token refresh) |
| `SALESFORCE_CLIENT_SECRET` | Required-for-feature | Ops | Not configured | Salesforce connected app client secret |
| `HUBSPOT_ACCESS_TOKEN` | Required-for-feature | Ops | Not configured | HubSpot private app access token |
| `ATLASSIAN_APP_KEY` | Required-for-feature | Ops | Not configured | Jira/Confluence integration |

---

## Group 16: Push Notifications / VAPID

| Variable | Tier | Owner | Current State | Notes |
|---|---|---|---|---|
| `VAPID_PUBLIC_KEY` | Required-for-feature | Ops | Set in `.replit` `[userenv.shared]` | Web push notification public key |
| `VAPID_PRIVATE_KEY` | **Required** | Ops | Stored in Replit Secrets | VAPID private key; must match public key |
| `VAPID_SUBJECT` | Required-for-feature | Ops | Set to `mailto:platform@szlholdings.com` in `.replit` | VAPID email contact |

---

## Group 17: Security / Encryption

| Variable | Tier | Owner | Current State | Notes |
|---|---|---|---|---|
| `CONNECTOR_ENCRYPTION_KEY` | **Required** | Ops | Stored in Replit Secrets | AES-256 key for encrypting connector credentials at rest |
| `FIELD_ENCRYPTION_KEY` | **Required** | Ops | Stored in Replit Secrets | AES-256 key for encrypting sensitive database fields |
| `FEDERATION_API_TOKENS` | Required-for-feature | Ops | Not configured | Comma-separated bearer tokens for federated API access |
| `SERVICE_ROLE_KEY` | Required-for-feature | Ops | Not configured | Internal service role secret for privileged operations |
| `SZL_INTERNAL_TOKEN` | Required-for-feature | Ops | Stored in Replit Secrets | Internal token for SZL service-to-service API calls |
| `SZL_WEBHOOK_SECRET` | Required-for-feature | Ops | Stored in Replit Secrets | HMAC secret for validating incoming SZL webhooks |

---

## Group 18: Redis / Cache

| Variable | Tier | Owner | Current State | Notes |
|---|---|---|---|---|
| `REDIS_URL` | Required-for-feature | Ops | Not configured | Redis connection URL (used when available; falls back to in-memory) |
| `REDIS_HOST` | Optional | Ops | Not configured | Redis host override (superseded by `REDIS_URL`) |

---

## Group 19: Threat Intelligence Feeds

| Variable | Tier | Owner | Current State | Notes |
|---|---|---|---|---|
| `OTX_API_KEY` | Required-for-feature | Ops | Not configured | AlienVault OTX threat intelligence API key |
| `TAXII_SERVER_URL` | Required-for-feature | Ops | Not configured | STIX/TAXII 2.1 server URL |
| `TAXII_COLLECTION` | Required-for-feature | Ops | Not configured | TAXII collection ID to subscribe to |
| `TAXII_API_KEY` | Required-for-feature | Ops | Not configured | TAXII authentication API key |

---

## Group 20: DocuSign

| Variable | Tier | Owner | Current State | Notes |
|---|---|---|---|---|
| `DOCUSIGN_ACCOUNT_ID` | Required-for-feature | Ops | Not configured | DocuSign account ID |
| `DOCUSIGN_CLIENT_ID` | Required-for-feature | Ops | Not configured | DocuSign OAuth application client ID |
| `DOCUSIGN_USER_ID` | Required-for-feature | Ops | Not configured | DocuSign service account user ID |
| `DOCUSIGN_PRIVATE_KEY` | Required-for-feature | Ops | Not configured | DocuSign RSA private key (JWT grant) |
| `DOCUSIGN_BASE_URL` | Required-for-feature | Ops | Not configured | DocuSign REST API base URL |
| `DOCUSIGN_AUTH_URL` | Required-for-feature | Ops | Not configured | DocuSign OAuth authorization URL |
| `DOCUSIGN_CONNECT_HMAC_KEY` | Required-for-feature | Ops | Not configured | HMAC key for validating DocuSign Connect webhook events |

---

## Group 21: Microsoft Dataverse

| Variable | Tier | Owner | Current State | Notes |
|---|---|---|---|---|
| `DATAVERSE_ORG_URL` | Required-for-feature | Ops | Not configured | Dataverse organization URL |
| `DATAVERSE_TENANT_ID` | Required-for-feature | Ops | Not configured | Azure tenant ID for Dataverse |
| `DATAVERSE_CLIENT_ID` | Required-for-feature | Ops | Not configured | Azure app registration client ID |
| `DATAVERSE_CLIENT_SECRET` | Required-for-feature | Ops | Not configured | Azure app registration client secret |

---

## Group 22: GitHub / Legal / Alerting

| Variable | Tier | Owner | Current State | Notes |
|---|---|---|---|---|
| `GITHUB_TOKEN` | Required-for-feature | Ops | Stored in Replit Secrets (via GitHub integration) | GitHub API access token |
| `COURT_LISTENER_API_KEY` | Required-for-feature | Ops | Not configured | CourtListener REST API key for legal case data |
| `PAGERDUTY_API_KEY` | Required-for-feature | Ops | Not configured | PagerDuty REST API key for incident alerting |

---

## Group 23: Build Metadata (Runtime-Injected)

| Variable | Tier | Owner | Current State | Notes |
|---|---|---|---|---|
| `BUILD_TIMESTAMP` | Platform-provided | CI/CD | Injected at build time | ISO 8601 timestamp of the build |
| `BUILD_VERSION` | Platform-provided | CI/CD | Injected at build time | Semantic version from `package.json` |
| `COMMIT_SHA` | Platform-provided | CI/CD | Injected at build time | Git commit SHA for the deployed build |

---

## Group 24: Dev / CI Tools

| Variable | Tier | Owner | Current State | Notes |
|---|---|---|---|---|
| `EXPO_ACCESS_TOKEN` | Dev-only | Dev | Not configured | Expo EAS build service token for `szl-holdings-mobile` CI builds |
| `__FAST_START_SERVER` | Dev-only | Dev | Not configured | Internal flag to skip slow initialization during dev restarts |

---

## Summary

| Tier | Count (approx.) |
|---|---|
| Platform-provided (auto) | 9 (`NODE_ENV`, `PORT`, `REPL_ID`, `REPLIT_DEV_DOMAIN`, `PGHOST/PORT/USER/PASSWORD/DATABASE`, `BUILD_TIMESTAMP/VERSION`, `COMMIT_SHA`) |
| Required (platform always needs) | 7 |
| Required-for-feature (feature fails gracefully) | ~110 |
| Optional (tuning / defaults) | ~22 |
| Dev-only | 5 |
| Deprecated (should remove) | 3 (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`) |
| **Total documented** | **~156** (from codebase-wide `process.env.*` scan, April 2026) |

### Pre-Launch Critical Configuration Gaps

Before any commercial customer deployment:
1. `STRIPE_SECRET_KEY` (live) + `STRIPE_WEBHOOK_SECRET` — payments dead without these
2. `CORS_ORIGINS` — set to production domains (already configured in `.replit [userenv.production]`)
3. `RESEND_API_KEY` — email silently dropped
4. `SENTRY_DSN` — errors invisible in production
5. `MAPBOX_ACCESS_TOKEN` — map views dead in Terra and Vessels
6. Remove deprecated `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` from `.env.example`

---

*Part of Series A Cleanup — Phase 1 audit. April 2026.*
