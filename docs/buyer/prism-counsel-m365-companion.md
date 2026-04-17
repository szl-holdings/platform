# Prism Counsel — Microsoft 365 Companion Overview

> **DEPRECATED:** PRISM Counsel has been retired. Legal capabilities are now available in the **Aegis legal workspace** (`/aegis/`). This document is preserved for historical reference only.

**Audience:** M365 Administrators, Legal IT Teams, Decision Makers  
**Date:** April 2026

---

## Overview

Prism Counsel connects natively to Microsoft 365 — the platform most law firms already run on. This document describes what the M365 integration does, how attorneys experience it, and what IT administrators need to know.

---

## What Attorneys Experience

### In Microsoft Teams

With the Custom Engine Agent (Path 2 deployment), attorneys interact with Prism Counsel directly inside Teams:

**Matter status at a glance:**
Type "What changed on Matter 2025-047 this week?" in the Prism Counsel bot channel. The agent returns a structured summary grounded in the Matter Twin: pressure changes, new documents, deadline proximity, outstanding approvals.

**Communication analysis:**
"What did the adjuster say last month on the Anderson matter?" — Copilot analyzes synced communications, extracts the relevant exchange, and surfaces silence windows, offers, and commitments.

**Deadline triage:**
"Which matters have deadlines in the next 10 days?" — Returns a structured deadline list with risk flags.

**Approval workflow in adaptive cards:**
When an AI output requires attorney sign-off, a Teams adaptive card is sent. The attorney reviews the summary, sees the confidence score and source references, and approves or requests revision — without leaving Teams.

**With the Declarative Agent (Path 1 deployment)**, Copilot in Teams and Outlook can answer matter status questions using Prism Counsel action endpoints. Lighter capability, faster to deploy, no full Alloy context.

### In Outlook

Matter status briefings can be delivered as structured digests to attorney inboxes via the M365 connector. Communication syncing means that emails tagged as carrier correspondence are automatically captured in the Prism Counsel communication log — without manual entry.

### In SharePoint

Documents stored in designated SharePoint libraries are automatically synced into Prism Counsel via delta sync. When a new document arrives in the "Matter 2025-047" folder, it is extracted, classified, embedded, and added to the matter's document stack — without any manual upload step.

---

## What IT Administrators Need to Know

### What Prism Counsel Requests from Your Tenant

| Permission | Scope | What it enables |
|-----------|-------|----------------|
| `Files.Read.All` | Application | SharePoint document library sync |
| `Sites.Read.All` | Application | SharePoint site discovery |
| `Mail.Read` | Delegated | Opted-in mailbox communication sync |
| `User.Read` | Delegated | User identity for session mapping |

**Prism Counsel does not request write permissions.** It reads from your tenant — it does not create, modify, or delete M365 content.

### How Consent Works

1. A Prism Counsel administrator initiates the connector setup
2. The setup flow provides an Azure AD admin consent URL
3. Your Global Admin or Application Administrator grants consent
4. App-only permissions are active for background sync
5. Attorneys complete OAuth for their delegated permissions (one-time per user)

### What Stays in Your Tenant, What Is Synced

| Data | Stays in M365 | Synced to Prism Counsel |
|------|--------------|------------------------|
| Matter documents (case files) | YES | YES — with ACL mapping |
| Carrier correspondence (opted-in) | YES | YES — with classification |
| Sensitivity-labeled documents | YES | YES — privilege state preserved |
| Attorney personal emails | YES | NO — unless explicitly opted in |
| HR/payroll/billing documents | YES | NO — excluded from sync scope |
| Legal hold content | YES | NO — federated query only |

You control which SharePoint sites and document libraries are included in sync scope during connector configuration.

### ACL and Permission Mapping

When documents sync from SharePoint:
- SharePoint item permissions are read at sync time
- SharePoint users are matched to Prism Counsel users by UPN (email address)
- SharePoint group membership is mapped to Prism Counsel roles (configurable)
- Sensitivity labels on items are mapped to `privilegeState` in Prism Counsel
- Permission changes in SharePoint propagate to Prism Counsel on the next delta sync cycle

### Token Storage and Security

- OAuth refresh tokens for M365 are stored encrypted in Prism Counsel's database
- Tokens are never logged or exported
- Graph subscription notifications are validated using per-subscription `clientState` secrets
- All connector operations are logged as audit events in Prism Counsel

---

## Deployment Options

### Option A: Connector Only (Sync)

Deploy the M365 connector to sync documents and communications. Attorneys use Prism Counsel's own interface. M365 is the source of truth for documents — Prism Counsel adds intelligence on top.

**Deployment time:** 1-2 hours (admin consent + connector configuration + initial sync).

### Option B: Connector + Declarative Agent (Teams/Copilot light)

Add the Declarative Agent for quick matter status lookups in Teams and Outlook Copilot. No full Alloy context — answers come from action endpoints. Suitable for quick lookups, not full analysis.

**Deployment time:** Additional 1-2 hours (Teams app upload + agent testing).

### Option C: Connector + Custom Engine Agent (Full Prism Counsel in Teams)

Full Prism Counsel capability surfaced in Teams. All 5 Copilot modes available in Teams chat. Adaptive card approval workflows. Full Alloy context, proof chain anchoring, review workflow. This is the full integration experience.

**Deployment time:** Additional 4-8 hours (Bot Framework channel, Teams app package, end-to-end testing).

---

## Requirements

| Requirement | Details |
|------------|---------|
| M365 licensing | Microsoft 365 Business or Enterprise plan (Graph API access required) |
| Admin role | Global Admin or Application Administrator for consent grant |
| Teams licensing | Microsoft Teams included in most M365 plans |
| Network | Outbound HTTPS from Prism Counsel to graph.microsoft.com |
| Mailbox sync | Exchange Online (Office 365 licensing) |
| DLP policies | Review existing DLP policies for potential conflict with API access |

---

## Known Limitations

| Limitation | Notes |
|-----------|-------|
| Graph subscription lifetime: 3 days | Auto-renewal managed by Prism Counsel; monitor in ops dashboard |
| Sync latency | Delta sync is scheduled — not instant. Webhook notifications provide faster updates for supported resource types |
| Sensitivity label mapping | Automated if labels follow standard Microsoft taxonomy; custom label mapping may require configuration |
| Teams message read | Teams chat/channel messages are not synced by default — only meeting transcripts with explicit opt-in |
| No write-back | Prism Counsel does not write back to SharePoint or Outlook |

---

*See also:*
- *[M365 Integration Strategy](../architecture/prism-counsel-m365-integration.md)*
- *[Trust Center](../trust/prism-counsel-trust-center.md)*
- *[M365 Integration Scaffold Files](../../integrations/m365/)*
