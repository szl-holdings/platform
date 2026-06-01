# SZL Holdings — Environment Variables Reference

**Last updated:** 2026-04-16 (Phase 0–1 Audit)
**Owner:** Platform Engineering
**Source:** Extracted from `artifacts/api-server/src/`, `lib/`, and artifact source files

This document is the canonical reference for every environment variable used in the SZL Holdings platform. Copy `.env.example` as a starting point for local development.

For credential rotation procedures, see `SECRETS_SETUP.md`.
For security posture, see `SECURITY-CHECKLIST.md`.

---

## Required vs Optional

| Status | Meaning |
|---|---|
| **Required** | Application will not start or will fail core functionality without this |
| **Required (prod)** | Required in production; may have safe defaults in development |
| **Conditional** | Required only when a specific feature/integration is enabled |
| **Optional** | Enhances functionality; graceful degradation without it |

---

## Section 1 — Core Infrastructure

| Variable | Required | Description | Example |
|---|---|---|---|
| `DATABASE_URL` | Required | PostgreSQL connection string (Replit-managed) | `postgresql://user:pass@host:5432/db` |
| `PORT` | Required | Port the API server listens on (set by Replit) | `3000` |
| `NODE_ENV` | Required | Runtime environment (`development` / `production`) | `production` |
| `SESSION_SECRET` | Required (prod) | Secret for session cookie signing. Min 32 chars. Falls back to per-process ephemeral in dev | `your-long-random-string-here` |
| `IP_HASH_SALT` | Required (prod) | Salt for SHA-256 IP address anonymization (`lib/audit/src/ip-hash.ts`). Without a salt, hashes are precomputable over the IPv4/v6 space. Startup warning emitted if unset outside dev/test. Rotate by updating value — historical hashes become un-correlatable (forward-only). | Random 32+ char string |
| `ISSUER_URL` | Required | OIDC issuer URL for authentication | `https://your-app.replit.app` |
| `PUBLIC_APP_URL` | Required (prod) | Canonical public URL (used in OG tags, emails, canonical links) | `https://szlholdings.com` |
| `CORS_ORIGINS` | Required (prod) | Comma-separated list of allowed CORS origins | `https://szlholdings.com,https://app.szlholdings.com` |
| `ALLOY_INTERNAL_TOKEN` | Required (prod) | Internal service-to-service auth token. Min 32 chars | Random 64-char hex string |
| `CONNECTOR_ENCRYPTION_KEY` | Required | AES-256 key for encrypting stored OAuth tokens and connector credentials | Random 32-char base64 |
| `OAUTH_STATE_SECRET` | Required | Secret for OAUTH state parameter signing | Random 32-char string |

---

## Section 2 — AI / LLM Providers

All AI providers are accessed via the Replit AI proxy integration. At least one provider is required for AI functionality.

| Variable | Required | Description |
|---|---|---|
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Conditional | OpenAI API key (via Replit AI proxy) |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Conditional | OpenAI base URL (set by Replit integration) |
| `AI_INTEGRATIONS_ANTHROPIC_API_KEY` | Conditional | Anthropic API key (via Replit AI proxy) |
| `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` | Conditional | Anthropic base URL (set by Replit integration) |
| `AI_INTEGRATIONS_GEMINI_API_KEY` | Conditional | Gemini API key (via Replit AI proxy) |
| `AI_INTEGRATIONS_GEMINI_BASE_URL` | Conditional | Gemini base URL (set by Replit integration) |
| `AI_INTEGRATIONS_OPENROUTER_API_KEY` | Conditional | OpenRouter API key (via Replit AI proxy) |
| `AI_INTEGRATIONS_OPENROUTER_BASE_URL` | Conditional | OpenRouter base URL (set by Replit integration) |
| `OPENAI_API_KEY` | Conditional | Direct OpenAI API key (legacy / fallback) |
| `ANTHROPIC_API_KEY` | Conditional | Direct Anthropic API key (legacy / fallback) |
| `GEMINI_API_KEY` | Conditional | Direct Gemini API key (legacy / fallback) |
| `AI_EXECUTION_MODE` | Optional | Override AI execution mode (`live` / `demo`) |
| `HF_TOKEN` | Conditional | HuggingFace API token (for fine-tuning / model evals) |
| `HUGGINGFACE_API_KEY` | Conditional | HuggingFace API key (alternative to HF_TOKEN) |

---

## Section 3 — Database Pool Configuration

| Variable | Required | Default | Description |
|---|---|---|---|
| `DB_POOL_MIN` | Optional | `2` | Minimum DB connection pool size |
| `DB_POOL_MAX` | Optional | `10` | Maximum DB connection pool size |
| `DB_IDLE_TIMEOUT_MS` | Optional | `30000` | DB connection idle timeout (ms) |
| `DB_CONNECT_TIMEOUT_MS` | Optional | `10000` | DB connection timeout (ms) |
| `DB_STATEMENT_TIMEOUT_MS` | Optional | `30000` | DB statement timeout (ms) |

---

## Section 4 — Email Providers

One email provider is recommended for transactional email delivery.

| Variable | Required | Description |
|---|---|---|
| `EMAIL_PROVIDER` | Optional | Override email provider selection (`resend`, `sendgrid`, `smtp`). See `artifacts/api-server/src/lib/email.ts` for fallback chain |
| `RESEND_API_KEY` | Conditional | Resend API key — canonical email provider |
| `SENDGRID_API_KEY` | Conditional | SendGrid API key — secondary email provider |
| `SMTP_HOST` | Conditional | SMTP host for fallback email delivery |
| `SMTP_PORT` | Conditional | SMTP port (default `587`) |
| `SMTP_USER` | Conditional | SMTP username |
| `SMTP_PASS` | Conditional | SMTP password |
| `SZL_INTERNAL_EMAIL` | Optional | Internal notification email address |
| `CARLOTA_ADMIN_EMAIL` | Optional | Carlota Jo admin notification email |
| `STEPHEN_ADMIN_EMAIL` | Optional | Stephen (founder) notification email |

---

## Section 5 — Billing (Stripe)

| Variable | Required | Description |
|---|---|---|
| `STRIPE_SECRET_KEY` | Conditional | Stripe secret key — required for live billing (use `sk_live_*` in prod) |
| `STRIPE_WEBHOOK_SECRET` | Conditional | Stripe webhook signing secret for webhook validation |
| `STRIPE_PUBLISHABLE_KEY` | Conditional | Stripe publishable key (frontend use) |

---

## Section 6 — Notifications

### Push Notifications (VAPID / Web Push)
| Variable | Required | Description |
|---|---|---|
| `VAPID_PUBLIC_KEY` | Conditional | VAPID public key for web push notifications |
| `VAPID_PRIVATE_KEY` | Conditional | VAPID private key for web push notifications |
| `VAPID_SUBJECT` | Conditional | VAPID subject (mailto: or URL for web push) |

### Slack
| Variable | Required | Description |
|---|---|---|
| `SLACK_WEBHOOK_URL` | Optional | Slack incoming webhook URL for alert delivery |
| `SLACK_BOT_TOKEN` | Optional | Slack bot token for interactive messaging |
| `SLACK_ALERT_CHANNEL` | Optional | Slack channel for system alerts |
| `ALLOY_DIGEST_SLACK_CHANNEL` | Optional | Slack channel for Alloy workflow digests |

### Microsoft Teams
| Variable | Required | Description |
|---|---|---|
| `MICROSOFT_TEAMS_WEBHOOK_URL` | Optional | Microsoft Teams incoming webhook URL |

### Twilio SMS
| Variable | Required | Description |
|---|---|---|
| `TWILIO_ACCOUNT_SID` | Conditional | Twilio Account SID for SMS |
| `TWILIO_AUTH_TOKEN` | Conditional | Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | Conditional | Twilio sender phone number |

### Expo Push (Mobile)
| Variable | Required | Description |
|---|---|---|
| `EXPO_ACCESS_TOKEN` | Conditional | Expo access token for push notification delivery |

---

## Section 7 — Maps and Geocoding

| Variable | Required | Description |
|---|---|---|
| `MAPBOX_ACCESS_TOKEN` | Conditional | Mapbox access token — required for map views in Vessels and Terra |
| `GOOGLE_MAPS_API_KEY` | Conditional | Google Maps API key for geocoding (fallback to Mapbox) |

---

## Section 8 — Intelligence Feeds

| Variable | Required | Description |
|---|---|---|
| `AIS_API_KEY` | Conditional | API key for live AIS vessel tracking provider |
| `AIS_BASE_URL` | Conditional | Base URL for AIS provider |
| `AIS_FEED_ENABLED` | Optional | Set `true` to enable live AIS feed (default: `false`) |
| `AISHUB_USERNAME` | Conditional | AISHub username for live AIS data |
| `LEGAL_FEED_ENABLED` | Optional | Enable live legal intelligence feeds |
| `LEGAL_FEED_SEARCH_QUERIES` | Optional | Comma-separated legal search query terms |
| `SANCTIONS_FEED_ENABLED` | Optional | Enable live sanctions list updates |
| `STIX_FEED_ENABLED` | Optional | Enable STIX/TAXII threat intelligence feeds |
| `COURT_LISTENER_API_KEY` | Conditional | CourtListener API key for legal data |
| `COURTLISTENER_API_TOKEN` | Conditional | CourtListener API token (alternative to above) |
| `SODA_APP_TOKEN` | Optional | Socrata/NYC Open Data app token for rate-limit bypass |

---

## Section 9 — Azure Integration (Production / Enterprise)

| Variable | Required | Description |
|---|---|---|
| `AZURE_PG_CONNECTION_STRING` | Conditional | Azure PostgreSQL connection string (Azure deployment) |
| `AZURE_REDIS_CONNECTION_STRING` | Conditional | Azure Redis Cache connection string for session persistence |
| `REDIS_URL` | Conditional | Redis URL (alternative to Azure Redis) |
| `AZURE_STORAGE_CONNECTION_STRING` | Conditional | Azure Blob Storage for file uploads |
| `AZURE_KEY_VAULT_URL` | Conditional | Azure Key Vault URL for secrets management |
| `AZURE_APP_INSIGHTS_CONNECTION_STRING` | Conditional | Azure Application Insights for telemetry |
| `AZURE_AD_TENANT_ID` | Conditional | Azure AD tenant ID for SCIM / enterprise SSO |
| `AZURE_AD_CLIENT_ID` | Conditional | Azure AD client ID for SCIM / enterprise SSO |
| `AZURE_AD_CLIENT_SECRET` | Conditional | Azure AD client secret for SCIM / enterprise SSO |
| `AZURE_DOC_INTEL_ENDPOINT` | Conditional | Azure Document Intelligence endpoint |
| `AZURE_DOC_INTEL_KEY` | Conditional | Azure Document Intelligence API key |

---

## Section 10 — Observability

| Variable | Required | Description |
|---|---|---|
| `LOG_LEVEL` | Optional | Pino log level (`debug`, `info`, `warn`, `error`). Default: `info` |
| `OTEL_SERVICE_NAME` | Optional | OpenTelemetry service name |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Required (prod) | OTLP endpoint for production tracing (not set = no prod tracing) |
| `SENTRY_DSN` | Required (prod) | Sentry DSN for error tracking (not set = console-only errors) |
| `BUILD_VERSION` | Optional | Build version string (injected by CI) |
| `BUILD_TIMESTAMP` | Optional | Build timestamp (injected by CI) |
| `COMMIT_SHA` | Optional | Git commit SHA (injected by CI) |

---

## Section 11 — DocuSign Integration

| Variable | Required | Description |
|---|---|---|
| `DOCUSIGN_CLIENT_ID` | Conditional | DocuSign OAuth client ID |
| `DOCUSIGN_ACCOUNT_ID` | Conditional | DocuSign account ID |
| `DOCUSIGN_USER_ID` | Conditional | DocuSign impersonation user ID |
| `DOCUSIGN_PRIVATE_KEY` | Conditional | DocuSign RSA private key (JWT auth) |
| `DOCUSIGN_BASE_URL` | Conditional | DocuSign API base URL |
| `DOCUSIGN_AUTH_URL` | Conditional | DocuSign OAuth auth URL |
| `DOCUSIGN_CONNECT_HMAC_KEY` | Conditional | DocuSign webhook HMAC signing key |

---

## Section 12 — Microsoft Graph / Dynamics

| Variable | Required | Description |
|---|---|---|
| `DYNAMICS_TENANT_ID` | Conditional | Dynamics 365 tenant ID |
| `DYNAMICS_CLIENT_ID` | Conditional | Dynamics 365 client ID |
| `DYNAMICS_CLIENT_SECRET` | Conditional | Dynamics 365 client secret |
| `DYNAMICS_ORG_URL` | Conditional | Dynamics 365 organization URL |
| `DATAVERSE_TENANT_ID` | Conditional | Dataverse tenant ID |
| `DATAVERSE_CLIENT_ID` | Conditional | Dataverse client ID |
| `DATAVERSE_CLIENT_SECRET` | Conditional | Dataverse client secret |
| `DATAVERSE_ORG_URL` | Conditional | Dataverse organization URL |
| `SHAREPOINT_TENANT_ID` | Conditional | SharePoint tenant ID |
| `SHAREPOINT_CLIENT_ID` | Conditional | SharePoint client ID |
| `SHAREPOINT_CLIENT_SECRET` | Conditional | SharePoint client secret |
| `SHAREPOINT_TENANT_URL` | Conditional | SharePoint tenant URL |
| `POWER_AUTOMATE_WEBHOOK_SECRET` | Conditional | Power Automate webhook HMAC secret |

---

## Section 13 — Other Third-Party Integrations

| Variable | Required | Description |
|---|---|---|
| `GITHUB_TOKEN` | Conditional | GitHub API token (for GitHub Trending feed, CI) |
| `HUBSPOT_ACCESS_TOKEN` | Conditional | HubSpot CRM access token |
| `JIRA_BASE_URL` | Conditional | Jira instance base URL |
| `JIRA_API_TOKEN` | Conditional | Jira API token |
| `NOTION_API_KEY` | Conditional | Notion integration token |
| `CLERK_SECRET_KEY` | Conditional | Clerk auth secret key (if using Clerk instead of custom OIDC) |
| `GOOGLE_CLIENT_ID` | Conditional | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Conditional | Google OAuth client secret |
| `SERVICE_ROLE_KEY` | Conditional | Supabase/Replit service role key for admin DB access |
| `NIM_API_BASE_URL` | Conditional | NVIDIA NIM endpoint for ATLAS spatial inference |
| `NIM_API_KEY` | Conditional | NVIDIA NIM API key |
| `FEDERATION_API_TOKENS` | Conditional | Comma-separated bearer tokens for agent federation |
| `FIELD_ENCRYPTION_KEY` | Conditional | Field-level encryption key for sensitive DB columns |
| `SECRET_ENCRYPTION_KEY` | Conditional | General encryption key (falls back to SESSION_SECRET) |

---

## Section 14 — Alloy Workflow Engine

| Variable | Required | Description |
|---|---|---|
| `ALLOY_MAX_BATCH_SIZE` | Optional | Maximum workflow batch size (default: `100`) |
| `ALLOY_WORKFLOW_AUTO_RUN` | Optional | Set `true` to auto-execute workflows (default: `false` — human approval required) |
| `ALLOY_REQUIRE_APPROVAL_CRITICAL` | Optional | Set `true` to require approval for critical workflows |
| `ALLOY_EMAIL_INGEST_SECRET` | Conditional | Secret for authenticating email ingestion webhooks |

---

## Section 15 — Feature Flags

| Variable | Required | Description |
|---|---|---|
| `FEATURE_ALLOY_GOVERNANCE` | Optional | Enable Alloy governance flows (`true`/`false`) |
| `FEATURE_ALLOY_ORCHESTRATION` | Optional | Enable Alloy orchestration (`true`/`false`) |
| `FEATURE_ALLOY_WEBHOOKS` | Optional | Enable Alloy webhook delivery (`true`/`false`) |
| `FEATURE_AUDIT_LOGGING` | Optional | Enable audit logging (`true`/`false`) |

---

## Section 16 — Mobile (Expo / CORTEX)

| Variable | Required | Description |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | Required | API server base URL for Expo mobile app |
| `EXPO_PUBLIC_API_BASE_URL` | Required | API base URL (alternative form) |
| `EXPO_PUBLIC_ISSUER_URL` | Required | OIDC issuer URL for mobile auth |
| `EXPO_PUBLIC_DOMAIN` | Required | App domain |
| `EXPO_PUBLIC_REPL_ID` | Optional | Replit repl ID for mobile config |

---

## Section 17 — Platform / Routing

| Variable | Required | Description |
|---|---|---|
| `BASE_URL` | Required | API server base URL |
| `BASE_PATH` | Optional | API base path prefix |
| `API_BASE_URL` | Required | API URL for frontend consumption |
| `REPL_ID` | Optional | Replit repl ID (injected by Replit) |
| `REPLIT_DEV_DOMAIN` | Optional | Replit dev domain (injected by Replit) |
| `VITE_APP_URL` | Optional | App URL for Vite builds |
| `EMBED_API_SERVER` | Optional | API URL for embedded contexts |
| `CI` | Optional | Set by CI environments — enables CI mode |
| `ADMIN_PIN` | Conditional | Admin PIN for protected admin operations |

---

## Section 18 — Storage

| Variable | Required | Description |
|---|---|---|
| `PRIVATE_OBJECT_DIR` | Optional | Directory for private object storage |
| `PUBLIC_OBJECT_SEARCH_PATHS` | Optional | Comma-separated paths for public object lookup |
| `DEFAULT_ORG_STORAGE_QUOTA_BYTES` | Optional | Default per-org storage quota (default: `10737418240` = 10GB) |
| `BACKUP_DIR` | Optional | Local backup directory path |

---

## Section 19 — Advanced / Internal

| Variable | Required | Description |
|---|---|---|
| `ATLAS_SCHEMA_VERSION` | Optional | Atlas schema version pin |
| `CONSCIOUSNESS_PREFLIGHT_BLOCKING` | Optional | Block requests until consciousness preflight passes |
| `SYNTHETIC_ALERTS` | Optional | Enable synthetic alert generation for testing |
| `SESSION_TTL_MS` | Optional | Session TTL override (default: `604800000` = 7 days, as set in `artifacts/api-server/src/lib/env-config.ts`) |
| `INNGEST_PORT` | Optional | Inngest job queue port |
| `GOMAXPROCS` | Optional | Max Go processes (Node.js native addon config) |
| `__FAST_START_SERVER` | Optional | Internal flag to skip initialization steps in dev |

---

## Env Var Count Summary

| Category | Count |
|---|---|
| Core infrastructure | 10 |
| AI/LLM providers | 14 |
| Database pool | 5 |
| Email | 9 |
| Stripe | 3 |
| Push/Slack/Teams/Twilio/Expo | 12 |
| Maps/Geocoding | 2 |
| Intelligence feeds | 10 |
| Azure | 11 |
| Observability | 7 |
| DocuSign | 7 |
| Microsoft Graph/Dynamics | 10 |
| Other third-party | 14 |
| Alloy | 4 |
| Feature flags | 4 |
| Mobile | 5 |
| Platform/routing | 10 |
| Storage | 4 |
| Advanced/internal | 9 |
| **Total** | **~150** |

---

*Related: `SECRETS_SETUP.md` · `SECURITY-CHECKLIST.md` · `.env.example` · `KNOWN-GAPS.md` (KG018)*

*Last verified against source code: 2026-04-16*
