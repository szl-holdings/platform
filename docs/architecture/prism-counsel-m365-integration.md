# Prism Counsel — Microsoft 365 Copilot Integration Strategy

> **DEPRECATED:** PRISM Counsel has been retired and consolidated into the Aegis legal workspace. This document is preserved for historical reference only.

**Version:** 1.0  
**Date:** April 2026  
**Scope:** Engineering + product strategy

---

## Overview

Prism Counsel integrates with Microsoft 365 through two complementary paths. Law firms and legal departments that run on M365 can connect Prism Counsel directly into their existing workflow — without requiring attorneys to adopt a new tool from scratch.

This document covers the dual-path integration architecture, connector strategy, security and permissions model, and deployment checklist.

**What is not covered here:** Actually deploying to a Microsoft tenant (requires external auth and tenant admin access — this is a customer deployment operation, not a development task).

---

## Dual-Path Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  PATH 1: DECLARATIVE AGENT                                          │
│  Quick M365 entry — low friction, limited depth                     │
│                                                                      │
│  Microsoft 365 Copilot (Teams, Outlook, Word, SharePoint)           │
│       ↓                                                              │
│  Declarative Agent (manifest-declared, plugin-style)                │
│       ↓                                                              │
│  Prism Counsel API actions (read-only matter summaries,             │
│  deadline alerts, pressure scores via action endpoints)             │
│                                                                      │
│  Capability: Copilot can answer "What is the status of Matter X?"  │
│  in Teams or Outlook. No full Alloy context. No reasoning output.  │
│  No write actions. No proof chain. Advisory only.                  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  PATH 2: CUSTOM ENGINE AGENT                                        │
│  Full Alloy control — complete Prism Counsel capability             │
│                                                                      │
│  Teams / Outlook / SharePoint (entry surface)                       │
│       ↓                                                              │
│  Custom Engine Agent (Bot Framework + Teams AI Library)             │
│       ↓                                                              │
│  Prism Counsel API (full Alloy context, model mesh,                 │
│  matter twin, proof chain, copilot workbench)                       │
│       ↓                                                              │
│  All 5 copilot modes available in Teams                             │
│  Full proof chain anchoring on all AI outputs                       │
│  Review and approval workflow accessible in Teams cards             │
│  Matter Twin summary cards in channel posts                         │
└─────────────────────────────────────────────────────────────────────┘
```

### When to deploy which path

| Use case | Path |
|----------|------|
| Quick status lookup in Teams | Path 1 (Declarative) |
| Deadline alerts in Outlook | Path 1 (Declarative) |
| Full matter analysis in Teams | Path 2 (Custom Engine) |
| Document review with Alloy reasoning | Path 2 (Custom Engine) |
| Approval workflow in Teams adaptive cards | Path 2 (Custom Engine) |
| Pressure score digest in Teams channel | Path 1 or Path 2 |
| Export-ready document production | Path 2 only |

Path 1 and Path 2 can coexist. Most enterprise deployments start with Path 1 for quick adoption, then migrate to Path 2 as the firm deepens its Prism Counsel usage.

---

## Connector Strategy

### Synced Retrieval (Pull-based)

The Microsoft 365 Graph connector syncs legal matter materials from tenant-approved M365 services into the Prism Counsel retrieval index:

| Source | What is synced | ACL mapping |
|--------|---------------|-------------|
| SharePoint document libraries | Matter documents, templates, filings | SharePoint folder permissions → Prism Counsel matter access |
| OneDrive for Business | Attorney work files (if opted in) | Owner-only → attorney role |
| Exchange Online (mailbox) | Carrier communications, demand correspondences | Per-mailbox opt-in → communication log |
| Teams channels (legal team) | Internal discussion context | Channel member list → matter team members |

**Sync behavior:**
- Delta sync via Microsoft Graph `$deltaToken` — only new/changed items are re-synced
- Webhook subscriptions for real-time change notifications (Graph subscription lifecycle: renew before 3-day expiry)
- SHA-256 dedup at Prism Counsel ingestion — duplicate content is not re-extracted
- All synced items receive `sourceConnector: "microsoft_365"` in their document record

### Federated / MCP-Style Retrieval

For data that should not be copied into Prism Counsel's index, federated retrieval queries the source system at search time:

| Source | Retrieval method | Notes |
|--------|-----------------|-------|
| SharePoint pages | On-demand Graph API call | Read-only, user-delegated permission |
| Legal hold content | Query only — never ingested | Content stays in tenant, queried via Graph Search API |
| External client portal | Federated query via API key | No data leaves client system |

Federated retrieval is slower and requires active session tokens — it is appropriate for sensitive or compliance-restricted content.

### Data Domains: Index vs. Never Index

| Data Domain | Index into Prism Counsel | Reason |
|-------------|------------------------|--------|
| Matter documents (case files) | YES — with matter-level ACL | Core retrieval use case |
| Carrier correspondence | YES — with `communication_type` classification | Pressure and silence analysis |
| Medical records | YES — with `privilegeState=work_product` | Extraction and chronology |
| Client identity documents | NO | PII — federated access only if needed |
| Billing records | NO | Out of scope for legal reasoning |
| HR/payroll documents | NO | Never — no legal matter relevance |
| Attorney personal emails | NO | Not in scope unless explicitly opted in |
| Unstructured Teams chats | NO — Teams meeting transcripts only if opted in | Consent and relevance concerns |

---

## Security and Permissions Model

### Authentication

| Method | Use case |
|--------|----------|
| OAuth 2.0 (delegated) | Attorney-facing actions — permission scoped to their access |
| OAuth 2.0 (app-only) | Background sync jobs — tenant admin consent required |
| PKCE flow | Any interactive user-facing connector auth |

**Required Microsoft 365 permissions:**

| Permission | Scope | Purpose |
|------------|-------|---------|
| `Files.Read.All` | Application | Read document libraries for sync |
| `Mail.Read` | Delegated | Read opted-in mailboxes for communications |
| `Sites.Read.All` | Application | SharePoint document sync |
| `User.Read` | Delegated | Identify authenticated user |
| `ChannelMessage.Read.All` | Application (if Teams enabled) | Teams channel content (requires Teams admin) |

No write permissions to M365 are requested. Prism Counsel does not modify M365 content.

### ACL Mapping

When documents are synced from SharePoint, their SharePoint permission metadata is preserved:

1. SharePoint user → matched to Prism Counsel user by UPN (email)
2. SharePoint group membership → mapped to Prism Counsel role (attorneys → `attorney`, legal ops → `paralegal`, etc.)
3. Item-level permissions → converted to per-document `orgId + matterId` access scope
4. Sensitivity labels (if configured in tenant) → mapped to `privilegeState`

ACL mapping is re-evaluated on each delta sync. Permission changes in SharePoint propagate to Prism Counsel on next sync cycle.

### Tenant Boundaries

- Prism Counsel never shares data between tenants
- Each law firm has an isolated `orgId` — all queries filter by `orgId`
- Tenant admin grants one-time app-only consent via Azure AD admin consent flow
- Token storage: refresh tokens stored encrypted in Prism Counsel database, never in source control
- Graph subscription notifications arrive at a dedicated Prism Counsel webhook endpoint, validated with Graph `clientState` secret

---

## Deployment Checklist

### Pre-deployment (Customer Side)

- [ ] Azure AD Global Admin or Application Administrator role available for consent grant
- [ ] Identify SharePoint site(s) / document libraries to sync
- [ ] Identify mailboxes to include in communication sync (attorney opt-in)
- [ ] Confirm M365 licensing includes Microsoft Graph API access (Business or Enterprise plans)
- [ ] Confirm no DLP policies that would block API access to matter documents
- [ ] Designate a technical contact for connector configuration

### Prism Counsel Setup

- [ ] Create connector account in Prism Counsel admin UI (`POST /api/prism-counsel/connectors`)
- [ ] Configure `tenantId`, `clientId`, `scopes`, `syncFolders`, `syncMailboxes` in connector config
- [ ] Complete OAuth flow (delegated) for initial auth
- [ ] Grant app-only consent via Azure AD admin consent URL (provided in UI)
- [ ] Trigger initial full sync and verify record count
- [ ] Register Graph subscriptions for delta notifications
- [ ] Confirm ACL mapping for at least one attorney and one test matter
- [ ] Verify retrieval returns expected documents for a test query

### If Deploying Declarative Agent (Path 1)

- [ ] Upload agent manifest to Microsoft 365 Admin Center (Teams App)
- [ ] Configure action endpoints in manifest (see `integrations/m365/declarative-agent-manifest.json`)
- [ ] Test Copilot responses for matter status queries in Teams
- [ ] Confirm read-only boundary is respected (no write actions triggered)

### If Deploying Custom Engine Agent (Path 2)

- [ ] Register Bot Framework channel in Azure
- [ ] Configure Bot token in Prism Counsel secrets
- [ ] Deploy Teams app package (see `integrations/m365/teams-app-manifest.json`)
- [ ] Test all 5 copilot modes via Teams chat interface
- [ ] Confirm proof chain entries are created for all agent responses
- [ ] Test adaptive card approval workflow end-to-end

### Post-deployment Monitoring

- [ ] Graph subscription expiry monitoring is active (auto-renew configured)
- [ ] Sync lag monitoring: alert if `syncLagMs > 4 hours`
- [ ] Connector health visible in Prism Counsel ops dashboard
- [ ] Escalation path documented for connector auth failures

---

## Known Limitations and Boundaries

| Limitation | Notes |
|-----------|-------|
| Graph subscription max lifetime: 3 days | Auto-renewal required — monitor `pc_graph_subscription_state` |
| Teams message content: read-only | Prism Counsel cannot post to Teams without explicit user action |
| SharePoint sensitivity labels: not always preserved | Manual `privilegeState` classification may be needed for highly sensitive items |
| App-only permissions require Global Admin consent | Customer must provide admin; cannot self-serve |
| Delegated token expiry | Attorney must re-auth periodically — token refresh is handled automatically when refresh token is valid |
| No real-time sync | Delta sync runs on schedule; real-time notifications via Graph webhooks (best-effort) |

---

*See also:*
- *[M365 Integration Scaffold Files](../../integrations/m365/)*
- *[Alloy Control Plane Architecture](prism-counsel-alloy-control-plane.md)*
- *[Trust Center](../trust/prism-counsel-trust-center.md)*
- *[Ops Runbook](../../infra/runbooks/prism-counsel-ops.md)*
