# SZL Platform Connector for Jira — Setup Guide

## Prerequisites

- Jira Cloud instance (Software or Service Management)
- SZL Holdings account — contact sales@szlholdings.com
- Jira site admin privileges

---

## Step 1 — Install from Atlassian Marketplace

1. Log into your Jira Cloud instance.
2. Go to **Settings → Apps → Find new apps**.
3. Search for **"SZL Platform Connector"**.
4. Click **Get app** → **Get it now**.
5. After installation completes, Jira will redirect you to the **SZL Platform Setup** page.

---

## Step 2 — Authorize SZL (Post-Install Wizard)

The post-install wizard opens automatically. If it doesn't:

1. Go to **Settings → Apps → SZL Platform Connector → Connect to SZL Platform**.

In the wizard:

1. Click **Authorize SZL Platform**.
2. You'll be redirected to your SZL Holdings portal login.
3. After login, approve the Jira connection.
4. You are redirected back to Jira with a success confirmation.

> **What happens during authorization?**  
> The SZL platform stores your Atlassian tenant's `clientKey` and `sharedSecret` (provided by Atlassian during the `installed` lifecycle callback). These are used to verify JWT tokens on subsequent webhook requests — no Jira API keys are stored by SZL.

---

## Step 3 — Configure Projects and Sync Settings

1. Go to **Settings → Apps → SZL Platform Settings**.
2. Choose your preferred sync interval (default: every hour).
3. Confirm webhook events are enabled.
4. Click **Save Settings**.

---

## Step 4 — Verify the Connection

In your SZL Holdings portal:

**Settings → Integrations → Jira → Test Connection**

You should see:
- Status: Connected
- Jira instance: `your-org.atlassian.net`
- Projects discovered: (list of your Jira projects)

---

## Step 5 — View Signals in SZL

Navigate to **SZL Alloy → Signal Feed** and filter by `source: jira`.

You'll see:
- Sprint burndown risk signals for active sprints
- Blocked issue alerts
- SLA breach detections
- Overdue item summaries

---

## Configuring Outbound Issue Creation

To push issues from SZL back into Jira:

1. In the SZL portal, go to **Alloy → Signals → [any signal] → Create Jira Issue**.
2. Select the target project and issue type.
3. The issue appears in Jira with a reference back to the originating SZL signal.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Setup wizard doesn't appear | Browser blocked redirect | Open Setup page manually via Jira Apps menu |
| No signals in SZL after install | `jira_sync_enabled` flag off | Enable flag in SZL Admin → Feature Flags |
| Webhook deliveries failing | Base URL misconfigured | Verify `CONNECT_BASE_URL` env var on SZL API server |
| 401 on webhook endpoints | JWT verification failure | Check tenant `sharedSecret` stored correctly on install |
| Issue panel blank | Jira iframe sandbox policy | Ensure SZL domain is on Jira's CSP allowlist |

---

## Uninstalling

1. Go to **Settings → Apps → Manage apps → SZL Platform Connector**.
2. Click **Uninstall**.
3. Jira automatically calls the `uninstalled` lifecycle endpoint — the tenant record is removed from SZL.
4. Disconnect in SZL portal: **Settings → Integrations → Jira → Disconnect**.

---

## Support

**Email:** support@szlholdings.com  
**Documentation:** https://szlholdings.com/integrations/jira  
**Status page:** https://status.szlholdings.com
