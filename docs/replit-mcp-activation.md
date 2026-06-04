# Replit MCP Activation Guide

## Overview

External MCP servers can be activated in two ways:
1. **API key via environment variable** — for servers that use a static bearer token
2. **OAuth sign-in** — for servers requiring a human authorization flow

## Method 1: API Key Activation

### Step 1: Open Replit Secrets
Navigate to the Replit workspace → Tools → Secrets

### Step 2: Add the relevant secret

| Server | Secret Name | Where to Get It |
|---|---|---|
| Sentry | `SENTRY_MCP_TOKEN` | Sentry Settings → API Keys |
| Linear | `LINEAR_API_KEY` | Linear Settings → API → Personal API Keys |
| PostHog | `POSTHOG_API_KEY` | PostHog Settings → Project API Keys |
| Amplitude | `AMPLITUDE_API_KEY` | Amplitude Settings → Project → API Key |
| PagerDuty | `PAGERDUTY_API_KEY` | PagerDuty Settings → API Access Keys |

### Step 3: Restart the API server workflow
After adding secrets, restart the `artifacts/api-server: api` workflow. The MCP registry reads key presence at startup.

### Step 4: Verify activation
```
GET /api/meridian/mcp-registry
```
The server's `status` field should change from `inactive` to `active`.

---

## Method 2: OAuth Activation (Slack, Notion, full Linear)

OAuth requires a human authorization flow. This cannot be automated by agents.

### Slack
1. Create a Slack app at https://api.slack.com/apps
2. Add bot scopes: `channels:read`, `chat:write`, `files:read`
3. Install to workspace and copy the Bot User OAuth Token
4. Add as `SLACK_BOT_TOKEN` in Replit Secrets

### Notion
1. Go to https://www.notion.so/my-integrations
2. Create a new integration, copy the token
3. Share the relevant Notion pages/databases with the integration
4. Add as `NOTION_TOKEN` in Replit Secrets

### Linear (OAuth flow)
1. Go to Linear → Settings → API → OAuth Applications
2. Create an OAuth app
3. Run the OAuth authorization code flow
4. Store the resulting access token as `LINEAR_OAUTH_TOKEN`

---

## Governance Note

Activating an MCP server does **not** grant agents permission to use it immediately for write operations. The governance layer (Founder Intent doctrine + governance-sentinel) still requires:
- All mutations (create/update/delete/send/publish/payment/permission) to have explicit human approval
- Read operations to be logged in the Flight Recorder
- Rollback paths to be specified before execution is approved

See `docs/mcp-governance.md` for the full governance protocol.
