# SZL Holdings Alloy — Jira Marketplace Installation Guide

## Overview

The SZL Holdings Alloy Forge app connects your Jira Cloud instance to the Alloy workflow automation platform. It surfaces PRISM risk scores, Alloy workflow run status, and Jira issue intelligence directly inside Jira issues and project pages.

---

## Prerequisites

- Jira Cloud (Business, Software, or Service Management plan)
- Access to the Atlassian Marketplace (Site Admin role)
- An SZL Holdings account with Alloy enabled
- An `SZL_INTERNAL_TOKEN` generated from your SZL admin console

---

## Step 1: Install from the Atlassian Marketplace

1. Go to **Jira Settings → Apps → Explore more apps**
2. Search for **SZL Holdings Alloy**
3. Click **Get it now**
4. Select your Jira site and click **Install**
5. Accept the requested scopes (see [OAuth & Data Mapping](./oauth-data-mapping.md))

---

## Step 2: Generate an Internal API Token

In your SZL Holdings admin console:

1. Navigate to **Settings → Integrations → API Tokens**
2. Click **Create Token**
3. Name the token (e.g., `jira-forge-integration`)
4. Set expiry to **365 days** (or per your security policy)
5. Copy the token — it will only be shown once

---

## Step 3: Configure Forge Variables

Using the Atlassian Forge CLI, set the required environment variables for your Forge app:

```bash
forge variables set SZL_API_BASE https://api.szlholdings.com
forge variables set SZL_INTERNAL_TOKEN <your-token-from-step-2>
```

For staging/development environments:

```bash
forge variables set --environment development SZL_API_BASE https://api-staging.szlholdings.com
forge variables set --environment development SZL_INTERNAL_TOKEN <staging-token>
```

> **Security note:** The `SZL_INTERNAL_TOKEN` is stored encrypted in Forge's environment and is never exposed to end users or the Jira frontend. It is only accessible to server-side Forge function handlers.

---

## Step 4: Enable Issue Webhooks

To enable automatic Alloy signal ingestion when Jira issues change status:

1. In your Jira project, go to **Project Settings → Integrations → Webhooks**
2. Enable the **Issue Updated** event type
3. The Forge app automatically registers the `jira:issue_updated` event trigger from its manifest — no manual webhook URL configuration is needed

For details on the payload and data mapping, see [Webhook Configuration](./webhook-configuration.md).

---

## Step 5: Verify the Integration

1. Open any Jira issue
2. You should see the **SZL Alloy** panel in the right sidebar showing PRISM risk scores and recent Alloy run status
3. Click **Actions → Trigger Alloy Workflow** to manually trigger a workflow from the issue
4. Navigate to a project page and click **Alloy Workflows** to view all active workflows

---

## Step 6: Configure Project-Level Workflow Mapping (Optional)

To associate specific Alloy workflows with specific Jira projects:

1. In Lyte Command Center, navigate to **Settings → Integrations → Jira**
2. Map Alloy workflow IDs to Jira project keys
3. When an issue in a mapped project changes status, the corresponding workflow is automatically triggered

---

## Troubleshooting

| Symptom | Resolution |
|---|---|
| SZL panel shows "No PRISM data" | Verify `SZL_INTERNAL_TOKEN` is set and valid |
| "Trigger Alloy Workflow" shows no workflows | Ensure at least one workflow is active in Alloy |
| Webhook events not appearing in Alloy | Confirm the Forge app is installed and `jira:issue_updated` trigger is active in manifest |
| 401 errors in Forge logs | Regenerate the API token and update the Forge variable |

---

## Uninstalling

1. Go to **Jira Settings → Apps → Manage apps**
2. Find **SZL Holdings Alloy** and click **Uninstall**
3. Revoke the API token in your SZL admin console
4. Run `forge variables delete SZL_INTERNAL_TOKEN` to remove stored credentials

---

## Support

- Documentation: https://docs.szlholdings.com/integrations/jira
- Support: support@szlholdings.com
- Atlassian Marketplace listing: https://marketplace.atlassian.com/apps/szl-alloy
