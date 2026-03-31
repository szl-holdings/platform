# SZL Platform Connector — Setup Guide

## Prerequisites

- Salesforce org (Professional, Enterprise, Unlimited, or Developer edition)
- SZL Holdings account (contact sales@szlholdings.com if you don't have one)
- System Administrator profile or the `SZL_Platform_Connector_Access` Permission Set

---

## Step 1 — Install the Managed Package

1. Click the **Get It Now** button on the AppExchange listing.
2. Choose **Install for Admins Only** (recommended) or **Install for All Users**.
3. Approve the third-party access request — this allows the package to call `api.szlholdings.com`.
4. Wait for the installation email confirmation.

---

## Step 2 — Authorize the Connected App

After installation, navigate to:

**Setup → App Manager → SZL Platform Connector → View**

1. Click **Edit Policies** → set **OAuth Policies → Permitted Users** to **Admin approved users are pre-authorized**.
2. Assign the **SZL_Platform_Connector_Access** Permission Set to the integration user (or System Admin).

---

## Step 3 — Complete the OAuth Flow

Open your SZL Holdings portal and navigate to:

**Settings → Integrations → Salesforce**

1. Click **Connect Salesforce Org**.
2. You will be redirected to your Salesforce login page.
3. After authorizing, the access token and refresh token are automatically stored in the `SZL_Config__mdt` Custom Metadata record.

> **Manual alternative:** If OAuth auto-configuration is not available, copy your access token from the Salesforce API and update the `SZL_Config.Default` Custom Metadata record manually in **Setup → Custom Metadata Types → SZL Config → Manage Records**.

---

## Step 4 — Configure Salesforce Outbound Messages (optional)

For real-time event delivery (instead of polling), configure an Outbound Message in Salesforce Workflow Rules or Process Builder:

1. **Setup → Workflow Rules → New Rule** (or use Process Builder / Flow)
2. Object: **Opportunity** (or Case, Lead)
3. Trigger: when record is **created or edited**
4. Action: **New Outbound Message**
   - Endpoint URL: `https://api.szlholdings.com/api/integrations/salesforce/webhook`
   - Fields to send: `Id`, `Name`, `StageName`, `Amount`, `CloseDate`, `Probability`

---

## Step 5 — Verify the Connection

In your SZL Holdings portal:

**Settings → Integrations → Salesforce → Test Connection**

You should see a green status badge with your org ID and instance URL confirmed.

---

## Step 6 — Run Your First Sync

From the SZL portal or via the Salesforce Invocable Method:

- **SZL Portal:** Settings → Integrations → Salesforce → Sync Now
- **Salesforce Flow:** Call the Invocable Method **"Trigger SZL Platform Sync"**

Your pipeline data, cases, and leads will appear in the SZL Alloy Signal Feed within 30–60 seconds.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `INVALID_SESSION_ID` in logs | Access token expired | Re-run OAuth flow in SZL portal |
| Callout fails with `UNABLE_TO_LOCK_ROW` | Mixed DML in trigger | Confirm `@future` annotation is present on `sendSignal` |
| No signals appearing in SZL | Sync flag disabled | Enable `salesforce_sync_enabled` feature flag in SZL Admin |
| Remote site error | Remote Site Setting missing | Verify `SZL_Platform_API` Remote Site Setting is Active |

---

## Uninstalling

1. Remove the scheduled job: **Setup → Scheduled Jobs → SZL Platform Hourly Sync → Delete**
2. Disconnect in SZL portal: **Settings → Integrations → Salesforce → Disconnect**
3. Uninstall the package: **Setup → Installed Packages → SZL Platform Connector → Uninstall**

---

## Support

**Email:** support@szlholdings.com  
**Documentation:** https://szlholdings.com/integrations/salesforce  
**Status page:** https://status.szlholdings.com
