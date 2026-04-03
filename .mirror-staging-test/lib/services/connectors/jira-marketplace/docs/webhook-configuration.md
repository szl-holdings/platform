# SZL Holdings Alloy — Jira Webhook Configuration

## Overview

The Forge app uses Atlassian Forge's native **event trigger system** (not traditional webhooks) to receive Jira events. This means there is no public webhook URL to configure — Atlassian's Forge platform handles event routing directly to your deployed Forge functions.

---

## Event Triggers

The following Jira events are handled by the Forge app. These are declared in `manifest.yml`:

| Event | Forge Trigger Key | Handler | Description |
|---|---|---|---|
| Issue status change | `jira:issue_updated` | `issue-status-sync` | Posts an Alloy signal when a Jira issue status changes |
| Run completion | `avi:forge:alloy:run-completed` | `webhook-receiver` | Adds a Jira comment when an Alloy workflow run completes |

---

## Issue Status Change Trigger

### Trigger Configuration (manifest.yml)

```yaml
triggers:
  - key: jira-issue-updated
    function: issue-status-sync
    events:
      - jira:issue_updated
```

### Event Payload

When a Jira issue is updated, Forge delivers this payload to the `issue-status-sync` handler:

```typescript
{
  issue: {
    id: string;           // Jira issue ID (e.g., "10042")
    key: string;          // Issue key (e.g., "PROJ-123")
    fields: {
      status: { name: string };         // Current status
      summary: string;                  // Issue title
      assignee?: { accountId: string; displayName: string };
      priority?: { name: string };
    };
  };
  changelog: {
    items: Array<{
      field: string;        // "status" for status changes
      fromString?: string;  // Previous status name
      toString?: string;    // New status name
    }>;
  };
}
```

### Alloy Signal Payload

On status change, the handler posts to `/api/alloy/ingest/signal` with an `x-internal-token` header:

```json
{
  "source": "jira_forge",
  "sourceType": "webhook",
  "title": "Jira issue PROJ-123 status changed: In Progress → Done",
  "severity": "info",
  "body": "{...JSON string with full change context...}",
  "metadata": {
    "issueKey": "PROJ-123",
    "fromStatus": "In Progress",
    "toStatus": "Done"
  }
}
```

### Filtering

The handler only processes events where the `changelog` contains an item with `field === "status"`. All other issue updates (field edits, label changes, comments) are silently ignored.

---

## Run Completion Webhook (Forge Web Trigger)

The `webhook-receiver` handler receives notifications from the SZL Alloy platform when a workflow run completes. This uses a **Forge Web Trigger** — a public HTTPS endpoint managed by Atlassian.

### Web Trigger Configuration (manifest.yml)

```yaml
triggers:
  - key: alloy-run-completed
    function: webhook-receiver
    type: webtrigger
```

### Obtaining the Web Trigger URL

After deploying the Forge app, run:

```bash
forge webtrigger --environment production
```

This outputs a URL in the format:
```
https://webhook.atlassian.com/webtrigger/<unique-id>
```

### Registering with SZL Alloy

1. In the Lyte Command Center, navigate to **Settings → Integrations → Jira**
2. Paste the web trigger URL into the **Webhook URL** field
3. Set the **Event** to `run.completed`
4. Click **Save**

Alloy will POST to this URL when any workflow run completes (state: `completed`, `failed`, or `canceled`).

### Payload Schema

SZL Alloy sends the following JSON payload to the web trigger:

```json
{
  "runId": 42,
  "workflowId": 7,
  "workflowName": "Enterprise Deal Approval",
  "state": "completed",
  "durationMs": 3200,
  "output": {
    "summary": "All approvals received. Contract routed to DocuSign."
  },
  "metadata": {
    "jiraIssueKey": "PROJ-123",
    "jiraIssueId": "10042"
  }
}
```

The `metadata.jiraIssueKey` field is required for the handler to add a comment to the issue. Workflow runs without this field are silently skipped.

### Comment Format

When a run completes, the handler adds an Atlassian Document Format (ADF) comment to the linked Jira issue:

- **Completed:** `✅ Alloy workflow "Enterprise Deal Approval" completed in 3s (Run #42)`
- **Failed:** `❌ Alloy workflow "Enterprise Deal Approval" failed in 3s (Run #42)`
- **Canceled:** `⚠️ Alloy workflow "Enterprise Deal Approval" canceled in 3s (Run #42)`

If `output.summary` is present, it is appended as a second paragraph.

---

## Security

- **Issue Updated Trigger**: Delivered by Atlassian's internal event bus — no external network exposure. Authentication is handled by Forge's sandbox isolation. The handler uses `x-internal-token` to authenticate with the SZL API.
- **Web Trigger**: The URL is public but obscured (UUID-based). Optionally configure a `X-Forge-Webhook-Secret` header in Alloy and validate it in the handler for HMAC verification.
- **Egress**: All outbound calls from Forge handlers to `api.szlholdings.com` are declared in the manifest `permissions.external.fetch.backend` allow-list.

---

## Troubleshooting

| Symptom | Check |
|---|---|
| Status changes not triggering Alloy signals | Confirm `jira:issue_updated` trigger is active in installed manifest version |
| 401 from SZL API in Forge logs | Rotate `SZL_INTERNAL_TOKEN` and update via `forge variables set` |
| Run completion comments not appearing | Verify web trigger URL is registered in Lyte Command Center; check `metadata.jiraIssueKey` is set on the run |
| Web trigger returns 500 | Check Forge function logs: `forge logs --environment production --function webhook-receiver` |
