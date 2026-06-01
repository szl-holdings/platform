# SZL Holdings — Jira Marketplace OAuth & Data Mapping

## OAuth Flow

The SZL Forge app uses **Forge-managed OAuth 2.0 (3LO)**. Atlassian's Forge platform handles all token issuance, storage, and refresh on behalf of the app. The app never reads raw OAuth tokens.

### Scopes Requested

| Scope | Reason |
|-------|--------|
| `read:jira-work` | Read issue fields (`summary`, `status`, `assignee`) to build trigger payloads |
| `read:jira-user` | Identify the installing user for audit logs |

No write scopes are requested. All data written back to Jira (comments, status updates) is performed via the SZL API, which uses a service account with write scopes managed separately per customer.

## Data Mapping

### Data Read from Jira (Forge context)

| Field | Source | Classification |
|-------|--------|----------------|
| `issueKey` | `useProductContext().issueKey` | Internal identifier |
| `projectKey` | `useProductContext().projectKey` | Internal identifier |
| `cloudId` | `useProductContext().cloudId` | Tenant identifier |
| `accountId` | `context.accountId` | User identifier (for audit) |
| `issue.fields.summary` | `requestJira` GET `/issue/{issueKey}` | Business metadata |
| `issue.fields.status` | `requestJira` GET `/issue/{issueKey}` | Status metadata |

### Data Sent to SZL API

| Field | Source | Classification |
|-------|--------|----------------|
| `issueKey` | Jira context | Internal identifier |
| `projectKey` | Jira context | Internal identifier |
| `cloudId` | Jira context | Tenant identifier |
| `workflowId` | App configuration | Configuration |
| `triggeredBy` | `context.accountId` | User identifier |

### Data Received from SZL API

| Field | Displayed To | Stored | Classification |
|-------|--------------|--------|----------------|
| `runId` | Issue panel UI | No | Internal identifier |
| `status` | Issue panel UI | No | Status metadata |
| `dashboardUrl` | Issue panel link | No | URL |

## Data Retention

- The Forge app stores no data in Forge Storage or any persistent mechanism.
- All run state is maintained by the SZL API (90-day retention, then archived).
- Uninstalling the app removes all Forge-side configuration immediately.

## Webhook Payload Handling

The `jira:webhook` handler (`issue-updated.ts`) receives standard Jira webhook payloads. Only `issue.key`, `issue.fields.status.name`, and `issue.fields.assignee.accountId` are forwarded to the SZL API. Raw webhook payloads are not logged or stored.
