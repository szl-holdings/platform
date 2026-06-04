# Alloy MCP Governance — Command Reference

## Overview

The Alloy MCP governance layer enforces read-first access to external MCP servers and requires explicit human approval for all create/update/delete/send/publish/payment/permission operations. This document covers how to use, check, and manage MCP server connections.

---

## MCP Server Registry

Registered external MCP servers and their activation status:

| Server | Category | Status | Auth |
|---|---|---|---|
| GitHub | project_management | active | GITHUB_TOKEN |
| Sentry | observability | inactive | SENTRY_MCP_TOKEN |
| Linear | project_management | inactive | LINEAR_API_KEY (OAuth) |
| PostHog | analytics | inactive | POSTHOG_API_KEY |
| Amplitude | analytics | inactive | AMPLITUDE_API_KEY |
| Notion | productivity | inactive | NOTION_TOKEN (OAuth) |
| PagerDuty | observability | inactive | PAGERDUTY_API_KEY |
| Slack | communication | inactive | SLACK_BOT_TOKEN (OAuth) |

---

## Activation

### Activate a server (env key-based)
Set the relevant environment variable as a Replit Secret, then restart the API server. The registry re-reads key presence at runtime.

```
SENTRY_MCP_TOKEN=<your-token>
LINEAR_API_KEY=<your-key>
POSTHOG_API_KEY=<your-key>
AMPLITUDE_API_KEY=<your-key>
PAGERDUTY_API_KEY=<your-key>
NOTION_TOKEN=<your-token>
```

### Activate OAuth-based servers (Slack, Linear, Notion)
These require a human OAuth sign-in flow. See `docs/replit-mcp-activation.md` for the activation walkthrough. OAuth tokens cannot be set via environment variables alone.

---

## Governance Check

Before any agent executes an MCP capability, it must pass a governance check:

```
POST /api/meridian/mcp-governance/check
{
  "serverId": "slack",
  "capabilityId": "slack.post_message"
}
```

Response:
```json
{
  "data": {
    "permitted": true,
    "requiresApproval": true,
    "operationType": "send",
    "reason": "Operation 'send' requires explicit approval per governance policy.",
    "checkedAt": "2026-04-25T..."
  }
}
```

---

## Read-First Governance

All agents must **query current state before proposing mutations**. The governance policy enforces:

1. `operator-swarm` calls `read_mcp_server` to fetch current state
2. State is logged to the Flight Recorder
3. Agent drafts a mutation proposal (`propose_mutation`)
4. `governance-sentinel` evaluates against Founder Intent doctrine
5. Human approves or rejects in the Counterfactual Ledger
6. Only after approval does the `operator-swarm` execute the mutation
7. Outcome is logged to the Flight Recorder with rollback path

---

## Supported Capability Operation Types

| Type | Approval Required | Description |
|---|---|---|
| `read` | No | Query, list, search, fetch |
| `write` | Yes | Create, update, upsert |
| `delete` | Yes | Delete, archive, remove |
| `send` | Yes | Send message, email, notification, page |
| `publish` | Yes | Publish content, social post |
| `payment` | Yes | Any financial transaction |
| `permission` | Yes | Grant/revoke access, change roles |

---

## Rollback Protocol

Every proposed mutation must include a rollback path before approval. Standard rollback paths:

- **Linear**: Delete created issue via Linear API
- **Slack**: Archive created channel; cannot delete sent messages
- **GitHub**: Close created issue; revert PR merge via new revert commit
- **Notion**: Delete created page via Notion API
- **PagerDuty**: Resolve created incident

---

## Audit Trail

All MCP operations (read and write) are logged to the Business Flight Recorder at:
```
GET /api/meridian/flight-recorder?type=tool_action
```

Each entry includes: server, capability, operation type, input/output, sources, approval status, and rollback path.
