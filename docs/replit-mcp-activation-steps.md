# Replit MCP Activation — Human Activation Steps

This document walks through the human-required steps to activate each of the 15
governed external MCP servers in canonical order. No automated agent may complete
sign-in or OAuth on your behalf — these steps must be performed by the human
operator in Replit.

## Prerequisites

- You are logged in to the Replit workspace as the project owner.
- You have read `docs/mcp-read-first-governance.md` before proceeding.
- You have a restricted (read-only) API key or OAuth token for each service.

---

## Step 1 — Sentry

1. Open Replit Integrations → MCP Servers → Sentry.
2. Sign in with your Sentry account.
3. Grant **read-only** scopes: `error:read`, `issue:read`, `project:read`, `event:read`.
4. Verify by running a test query that returns recent issues — no write actions.
5. Mark as **Connected — Read Only** in the MCP Activation dashboard.

---

## Step 2 — Linear

1. Open Replit Integrations → MCP Servers → Linear.
2. Authenticate with your Linear workspace.
3. Grant **read-only** scopes: `issue:read`, `project:read`, `team:read`, `cycle:read`.
4. Confirm you can list open issues without creating or editing any.
5. Mark as **Connected — Read Only** in the dashboard.

---

## Step 3 — PostHog

1. Open Replit Integrations → MCP Servers → PostHog.
2. Enter your PostHog Personal API Key (set to read-only in PostHog settings).
3. Grant scopes: `insight:read`, `event:read`, `person:read`, `feature_flag:read`.
4. Verify by fetching a dashboard — no flag mutation or event capture.
5. Mark as **Connected — Read Only** in the dashboard.

---

## Step 4 — Amplitude

1. Open Replit Integrations → MCP Servers → Amplitude.
2. Enter your Amplitude API Key and Secret Key (read-only project key preferred).
3. Grant scopes: `chart:read`, `dashboard:read`, `cohort:read`.
4. Confirm by fetching a dashboard — no cohort export or event ingestion.
5. Mark as **Connected — Read Only** in the dashboard.

---

## Step 5 — Notion

1. Open Replit Integrations → MCP Servers → Notion.
2. Authenticate with your Notion account via OAuth.
3. Select only the **databases and pages** needed — do not grant workspace-wide access.
4. Scopes: `page:read`, `database:read`, `block:read`.
5. Verify by reading a page — do not create or edit pages.
6. Mark as **Connected — Read Only** in the dashboard.

---

## Step 6 — Granola

1. Open Replit Integrations → MCP Servers → Granola.
2. Sign in with your Granola workspace account.
3. Grant read-only access: `meeting:read`, `transcript:read`, `summary:read`.
4. Verify by fetching a recent meeting summary.
5. Mark as **Connected — Read Only** in the dashboard.
6. Treat all transcripts as confidential — internal use only.

---

## Step 7 — Figma

1. Open Replit Integrations → MCP Servers → Figma.
2. Authenticate with your Figma account via OAuth.
3. Grant read-only scopes: `file:read`, `component:read`, `comment:read`.
4. Verify by reading a file without editing it.
5. Mark as **Connected — Read Only** in the dashboard.

---

## Step 8 — Squidler

1. Open Replit Integrations → MCP Servers → Squidler.
2. Enter your Squidler API token (read-only tier).
3. Grant scopes: `content:read`, `schedule:read`, `analytics:read`.
4. Verify by fetching scheduled content — do not publish or reschedule.
5. Mark as **Connected — Read Only** in the dashboard.

---

## Step 9 — Stripe

1. Open Replit Integrations → MCP Servers → Stripe.
2. Use a **Restricted Key** from the Stripe Dashboard with read-only permissions on:
   Balance, Charges, Customers, Invoices, Payment Intents, Subscriptions.
3. **Do not use** a secret key or a key with write permissions.
4. Verify by reading recent charges — no payment, refund, or subscription actions.
5. Mark as **Connected — Read Only** in the dashboard.

> ⚠️ High risk — double-check the key restriction settings before connecting.

---

## Step 10 — Razorpay

1. Open Replit Integrations → MCP Servers → Razorpay.
2. Use a read-only API key from the Razorpay Dashboard.
3. Grant scopes: `payment:read`, `order:read`, `refund:read`, `settlement:read`.
4. Verify by reading recent payments — no capture, refund, or order creation.
5. Mark as **Connected — Read Only** in the dashboard.

> ⚠️ High risk — same precautions as Stripe.

---

## Step 11 — Google Maps Platform

1. Open Replit Integrations → MCP Servers → Google Maps Platform.
2. Create a **restricted API key** in Google Cloud Console:
   - Restrict to APIs: Geocoding API, Places API, Directions API, Elevation API.
   - Restrict by HTTP referrer or IP address.
3. Enter the restricted key in the integration.
4. Verify by geocoding an address — no data write APIs exist.
5. Mark as **Connected — Read Only** in the dashboard.

---

## Step 12 — Sanity

1. Open Replit Integrations → MCP Servers → Sanity.
2. Generate a **read-only token** in the Sanity management console for your dataset.
3. Grant scopes: `document:read`, `asset:read`.
4. Verify by running a GROQ query — do not patch or create documents.
5. Mark as **Connected — Read Only** in the dashboard.

---

## Step 13 — Wistia

1. Open Replit Integrations → MCP Servers → Wistia.
2. Enter your Wistia API password (read-only access level).
3. Grant scopes: `media:read`, `project:read`, `stats:read`.
4. Verify by fetching media stats — no uploads or project edits.
5. Mark as **Connected — Read Only** in the dashboard.

---

## Step 14 — Atlassian

1. Open Replit Integrations → MCP Servers → Atlassian.
2. Authenticate via Atlassian OAuth (Jira and Confluence).
3. Grant read-only scopes: `issue:read`, `project:read`, `comment:read`, `sprint:read`.
4. Verify by reading open issues — no issue creation, comment, or wiki edits.
5. Mark as **Connected — Read Only** in the dashboard.

> ⚠️ High risk — breadth of internal data. Limit OAuth scopes strictly.

---

## Step 15 — Miro

1. Open Replit Integrations → MCP Servers → Miro.
2. Authenticate via Miro OAuth.
3. Grant read-only scopes: `board:read`, `item:read`, `comment:read`.
4. Verify by listing boards — no item creation or comment writes.
5. Mark as **Connected — Read Only** in the dashboard.

---

## After Completing All Steps

- All 15 servers should show **Connected — Read Only** in the MCP Activation dashboard.
- Navigate to `/meridian/mcp-activation` to review the status at any time.
- Before enabling any write scope, read `docs/mcp-read-first-governance.md` and obtain
  explicit approval from the operator on record.
