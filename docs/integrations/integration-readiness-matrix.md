# Integration Readiness Matrix

**Date:** April 16, 2026
**Maintained by:** Platform Engineering
**Source:** `docs/integrations.md`, `artifacts/api-server/src/routes/`, `lib/services/src/adapters/`

---

## Classification Definitions

| Class | Meaning |
|-------|---------|
| **ACTIVE/REQUIRED** | Integration is live, secrets configured, actively used in production flows. Removing it breaks a user-facing feature. |
| **OPTIONAL/INACTIVE** | Integration is implemented and wired but requires a secret not yet configured. Degrades gracefully when absent. |
| **DEMO-BACKED** | Integration adapter is wired but all data is seeded or simulated. No live API calls occur. |
| **ENTERPRISE-ONLY** | Integration is implemented but only activates when an enterprise tenant is provisioned (OOS for launch). |
| **PLANNED/OOS** | Adapter exists but the integration is out of scope for the current launch path. |

---

## Core Infrastructure

| Integration | Env Variable | Class | Notes |
|-------------|-------------|-------|-------|
| PostgreSQL (Replit-managed) | `DATABASE_URL` | ACTIVE/REQUIRED | All DB queries via Drizzle ORM. No operation without this. |
| Session signing | `SESSION_SECRET` | ACTIVE/REQUIRED | OIDC session signing. Required for auth. |
| OIDC Provider (Replit) | `ISSUER_URL` | ACTIVE/REQUIRED | Replit OIDC for development. Azure AD for production. |
| Internal auth token | `ALLOY_INTERNAL_TOKEN` | ACTIVE/REQUIRED | Server-to-server auth bypass. Ephemeral fallback if absent (not persistent). |
| OAuth state signing | `OAUTH_STATE_SECRET` | ACTIVE/REQUIRED | Throws at startup if absent (production). |
| Redis | `REDIS_URL` | OPTIONAL/INACTIVE | Used for sliding-window rate limiter and cache. Falls back to in-memory if absent. |

---

## Payments — Stripe

| Component | Env Variable | Class | Notes |
|-----------|-------------|-------|-------|
| Stripe API (server) | `STRIPE_SECRET_KEY` | OPTIONAL/INACTIVE | Billing endpoint implemented and wired. Returns mock acknowledgments without live key. |
| Stripe (client) | `STRIPE_PUBLISHABLE_KEY` | OPTIONAL/INACTIVE | Client-side checkout. No-ops without key. |
| Stripe Webhooks | `STRIPE_WEBHOOK_SECRET` | OPTIONAL/INACTIVE | HMAC-SHA256 signature verification implemented. Inactive without secret. |
| Stripe Price IDs | `STRIPE_PRICE_*` (10 slots) | OPTIONAL/INACTIVE | Per-product pricing. Required once revenue launch occurs. |

> **Status:** Fully implemented. Live keys not yet configured. No real charges processed. Required before first paid transaction (GAP-005).

---

## AI Providers

| Provider | Env Variable | Class | Notes |
|----------|-------------|-------|-------|
| OpenAI | `AI_INTEGRATIONS_OPENAI_API_KEY` / `OPENAI_API_KEY` | OPTIONAL/INACTIVE | Used for chat, Dreamscape scoring, INCA experiments. Replit AI proxy used when available. Degrades gracefully. |
| Anthropic | `AI_INTEGRATIONS_ANTHROPIC_API_KEY` / `ANTHROPIC_API_KEY` | OPTIONAL/INACTIVE | Analysis and reasoning. Replit AI proxy fallback. |
| Google Gemini | `AI_INTEGRATIONS_GEMINI_API_KEY` | OPTIONAL/INACTIVE | Multimodal analysis. Replit AI proxy fallback. |
| Hugging Face | `HF_API_KEY` | OPTIONAL/INACTIVE | Open-source model inference. Not required for core operation. |

> **Status:** Replit AI Integration proxies are configured for OpenAI, Anthropic, and Gemini. AI features degrade gracefully when keys are absent.

---

## Email

| Provider | Env Variable | Class | Priority | Notes |
|----------|-------------|-------|----------|-------|
| Resend | `RESEND_API_KEY` | OPTIONAL/INACTIVE | Primary | Preferred transactional email provider. |
| SendGrid | `SENDGRID_API_KEY` | OPTIONAL/INACTIVE | Secondary | Fallback if Resend absent. |
| SMTP | `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | OPTIONAL/INACTIVE | Tertiary | Generic SMTP fallback. |

> **Behavior:** Routing tries Resend → SendGrid → SMTP. Silent skip with warning log if none configured. Email targets: `SZL_INTERNAL_EMAIL`, `STEPHEN_ADMIN_EMAIL`, `CARLOTA_ADMIN_EMAIL`.

---

## Communications & Notifications

| Integration | Env Variable | Class | Notes |
|-------------|-------------|-------|-------|
| Slack Webhook | `SLACK_WEBHOOK_URL` | OPTIONAL/INACTIVE | Warning+ severity alerts. Webhook delivery. |
| Slack Bot | `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET` | OPTIONAL/INACTIVE | Richer formatting alerts + Alloy integration registry. |
| Microsoft Teams | `MICROSOFT_TEAMS_WEBHOOK_URL` | OPTIONAL/INACTIVE | Alert delivery via Teams webhook. |
| Twilio | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` | OPTIONAL/INACTIVE | SMS/voice notifications. Not required for core operation. |
| WebSocket | (automatic) | ACTIVE/REQUIRED | Real-time events to connected clients. Built-in. |
| Push Notifications | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | OPTIONAL/INACTIVE | Web push for mobile PWA. |

---

## Maps

| Integration | Env Variable | Class | Notes |
|-------------|-------------|-------|-------|
| Mapbox GL | `MAPBOX_ACCESS_TOKEN` | OPTIONAL/INACTIVE | Property maps (Terra) and fleet tracking (Vessels). Falls back to SVG if absent. |

---

## Maritime

| Integration | Env Variable | Class | Notes |
|-------------|-------------|-------|-------|
| MarineTraffic AIS | `MARINE_TRAFFIC_API_KEY` | OPTIONAL/INACTIVE | Live vessel positions. Simulated AIS data without key. |

---

## Workplace & Productivity (Alloy Integration Registry)

| Integration | Auth Model | Class | Notes |
|-------------|-----------|-------|-------|
| Google Workspace (Gmail, Calendar, Drive) | OAuth2 | OPTIONAL/INACTIVE | Fully wired via Alloy. Requires tenant OAuth setup. |
| Microsoft 365 (Outlook, Teams, OneDrive) | OAuth2 | ACTIVE/REQUIRED | Carlota-Jo booking/calendar live. Other tenants optional. |
| Slack (via Alloy) | OAuth2/Webhook | OPTIONAL/INACTIVE | Alloy integration for channel ops. |
| HubSpot | `HUBSPOT_API_KEY` | OPTIONAL/INACTIVE | CRM integration. Not required for core operation. |
| Salesforce | OAuth2 | ENTERPRISE-ONLY | Adapter wired; enterprise tenant required. |
| Jira | OAuth2 (Atlassian Connect) | OPTIONAL/INACTIVE | Adapter wired; not required for core operation. |
| Confluence | OAuth2 | OPTIONAL/INACTIVE | Knowledge base connector. |
| Notion | API Key | OPTIONAL/INACTIVE | Content integration. |
| Figma | API Key | OPTIONAL/INACTIVE | Design asset connector. |

---

## Security & Intelligence Data Feeds

| Integration | Env Variable | Class | Notes |
|-------------|-------------|-------|-------|
| CISA KEV | Public API | ACTIVE/REQUIRED | Live known exploited vulnerabilities feed. No key required. |
| MITRE ATT&CK | Public API | ACTIVE/REQUIRED | Live attack framework data. No key required. |
| NVD (National Vulnerability Database) | `NVD_API_KEY` | OPTIONAL/INACTIVE | NIST vulnerability data. Rate-limited without key; functional either way. |
| Shodan | `SHODAN_API_KEY` | OPTIONAL/INACTIVE | Asset exposure scanning. Not required for core operation. |
| VirusTotal | `VIRUSTOTAL_API_KEY` | OPTIONAL/INACTIVE | Malware/hash analysis. Not required for core operation. |
| AlienVault OTX | `ALIENVAULT_API_KEY` | OPTIONAL/INACTIVE | Threat intelligence feed. |
| PagerDuty | `PAGERDUTY_API_KEY` | OPTIONAL/INACTIVE | Incident management. |
| New Relic | `NEW_RELIC_LICENSE_KEY` | OPTIONAL/INACTIVE | APM. No external APM currently configured (GAP-006). |

---

## Financial & Market Data

| Integration | Env Variable | Class | Notes |
|-------------|-------------|-------|-------|
| Alpha Vantage | `ALPHA_VANTAGE_API_KEY` | OPTIONAL/INACTIVE | Market data for capital intelligence features. |
| Crunchbase | `CRUNCHBASE_API_KEY` | OPTIONAL/INACTIVE | Venture intelligence data. |
| World Bank API | Public | ACTIVE/REQUIRED | Live economic indicators for Carlota-Jo. No key required. |
| Bureau of Labor Statistics | Public | ACTIVE/REQUIRED | Labor market data for Carlota-Jo. No key required. |

---

## Monitoring & Observability

| Integration | Env Variable | Class | Notes |
|-------------|-------------|-------|-------|
| Sentry | `SENTRY_DSN` | OPTIONAL/INACTIVE | Error reporting. Not configured — production errors log to Pino only (GAP-006). |
| Azure App Insights | `AZURE_APP_INSIGHTS_CONNECTION_STRING` | PLANNED/OOS | For Azure deployment path; not on current launch path. |
| New Relic | `NEW_RELIC_LICENSE_KEY` | OPTIONAL/INACTIVE | APM alternative. Not configured. |

---

## Cloud & Infrastructure

| Integration | Env Variable | Class | Notes |
|-------------|-------------|-------|-------|
| Azure App Service | (deployment config) | PLANNED/OOS | Documented as production target; actual deployment is Replit-hosted. |
| Azure Key Vault | (Azure-side config) | PLANNED/OOS | Secrets management for Azure deployment. Not current. |
| AWS S3 (object storage) | Replit Object Storage | ACTIVE/REQUIRED | File storage via Replit Object Storage API. |
| Microsoft Graph API | `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` | OPTIONAL/INACTIVE | Used by Carlota-Jo for calendar/contacts. |
| SharePoint SPFx | (enterprise config) | ENTERPRISE-ONLY | Enterprise intranet connector. |
| Dynamics 365 | (enterprise config) | ENTERPRISE-ONLY | Enterprise CRM connector. |

---

## Webhook Verification Status

| Webhook Source | Verification Method | Status |
|---------------|--------------------|----|
| Stripe | HMAC-SHA256 (`STRIPE_WEBHOOK_SECRET`) | Implemented — `billing.ts:223` |
| Alloy Generic Webhooks | HMAC-SHA256 (`ALLOY_WEBHOOK_SECRET`) | Implemented — `alloy-integrations.ts:274` |
| GitHub | HMAC-SHA256 (`GITHUB_WEBHOOK_SECRET`) | Implemented — `github.ts:113` |
| Slack | Signing secret verification | Implemented via `SLACK_SIGNING_SECRET` |
| Generic inbound | Endpoint-level token | Varies by endpoint |

> **Idempotency:** Stripe `checkout.session.completed` events are guarded against reprocessing. Generic webhook idempotency is not globally enforced — see route-readiness-matrix for per-route notes.

---

## Summary by Class

| Class | Count |
|-------|-------|
| ACTIVE/REQUIRED | 10 |
| OPTIONAL/INACTIVE | 32 |
| DEMO-BACKED | 3 |
| ENTERPRISE-ONLY | 4 |
| PLANNED/OOS | 4 |
