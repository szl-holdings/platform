# Integrations & Secrets Map

## Overview

SZL Holdings integrates with external services across payments, AI, email, maps, notifications, and enterprise marketplaces. All integrations degrade gracefully — services run in mock/demo mode when keys are not configured.

## Integration Matrix

### Core Infrastructure

| Integration | Env Variable | Required | Fallback |
|-------------|-------------|----------|----------|
| PostgreSQL | `DATABASE_URL` | Yes | None — required for operation |
| Session signing | `SESSION_SECRET` | Yes | None — required for auth |
| OIDC Provider | `ISSUER_URL` | Yes (production) | Demo mode with mock users |
| Internal auth | `ALLOY_INTERNAL_TOKEN` | Recommended | Ephemeral random secret (not persistent across restarts) |
| OAuth state | `OAUTH_STATE_SECRET` | Yes (production) | Throws at startup if missing |

### Payments — Stripe

| Env Variable | Purpose |
|-------------|---------|
| `STRIPE_SECRET_KEY` | Server-side API access |
| `STRIPE_PUBLISHABLE_KEY` | Client-side Stripe.js |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification |
| `STRIPE_PRICE_*` | Per-product price IDs (10 price slots) |

Without Stripe keys: billing endpoints return mock acknowledgments, checkout redirects are simulated.

### Email

| Provider | Env Variable | Priority |
|----------|-------------|----------|
| Resend | `RESEND_API_KEY` | Primary |
| SendGrid | `SENDGRID_API_KEY` | Secondary |
| SMTP | `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | Tertiary |

Routing: system tries Resend first, falls back to SendGrid, then SMTP. If none configured, email delivery is silently skipped with a warning log.

Admin targets: `SZL_INTERNAL_EMAIL`, `STEPHEN_ADMIN_EMAIL`, `CARLOTA_ADMIN_EMAIL`.

### AI

| Provider | Env Variable | Usage |
|----------|-------------|-------|
| OpenAI | `OPENAI_API_KEY` / `AI_INTEGRATIONS_OPENAI_API_KEY` | Dreamscape scoring, INCA experiments, chat |
| Anthropic | `ANTHROPIC_API_KEY` / `AI_INTEGRATIONS_ANTHROPIC_API_KEY` | Analysis, reasoning |
| Google Gemini | `AI_INTEGRATIONS_GEMINI_API_KEY` | Multimodal analysis |

AI features are disabled without keys. The platform uses Replit AI Integration proxies when available.

### Maps

| Service | Env Variable | Apps |
|---------|-------------|------|
| Mapbox GL | `MAPBOX_ACCESS_TOKEN` | Terra (property maps), Vessels (fleet tracking) |

Without Mapbox token: maps fall back to styled SVG representations.

### Notifications

| Channel | Env Variable | Trigger |
|---------|-------------|---------|
| Slack Webhook | `SLACK_WEBHOOK_URL` | Warning+ severity alerts |
| Slack Bot | `SLACK_BOT_TOKEN` | Warning+ severity alerts (richer formatting) |
| Teams Webhook | `MICROSOFT_TEAMS_WEBHOOK_URL` | Warning+ severity alerts |
| WebSocket | Automatic | All real-time events to connected clients |

### Maritime

| Service | Env Variable | Usage |
|---------|-------------|-------|
| MarineTraffic AIS | `MARINE_TRAFFIC_API_KEY` | Live vessel positions in Vessels app |

### Monitoring

| Service | Env Variable | Usage |
|---------|-------------|-------|
| Sentry | `SENTRY_DSN` | Error reporting and performance monitoring |
| Azure App Insights | `AZURE_APP_INSIGHTS_CONNECTION_STRING` | APM for Azure deployments |
| Plausible | `VITE_PLAUSIBLE_DOMAIN` | Privacy-friendly web analytics |

### Enterprise

| Integration | Env Variables | Purpose |
|-------------|--------------|---------|
| Salesforce | `SALESFORCE_CLIENT_ID`, `SALESFORCE_CLIENT_SECRET` | AppExchange bidirectional sync |
| Jira | `ATLASSIAN_APP_KEY` | Connect app, issue panel integration |
| Azure AD | Via tenant config | Enterprise SSO, multi-tenant auth |
| Power BI | Per-tenant encrypted config | Embedded analytics with RLS |

## Connector Architecture

The `lib/data-connectors/` package provides adapter interfaces for external data sources. Each connector implements a standard interface for authentication, data fetching, and webhook handling.

The API server's `/api/integrations/` routes handle OAuth callbacks, webhook ingestion, and sync triggers for all marketplace integrations.
