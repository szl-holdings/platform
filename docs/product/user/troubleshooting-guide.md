# Troubleshooting Guide — SZL Holdings

**Version:** 1.0 · **Last updated:** April 2026  
**Audience:** All users — operators, admins, developers

This guide covers the most common issues across all platform surfaces and how to resolve them. For issues not covered here, contact support at support@szlholdings.com.

---

## Quick Diagnostics

Before diving into specific issues, run through this 60-second checklist:

1. **API health:** Visit `/api/health` — a healthy response returns `{ "status": "ok", "timestamp": "..." }`. If this fails, there is a service-level issue — contact support.
2. **Auth status:** Visit `/auth/me` — if you get a 401, your session has expired. Sign in again.
3. **Browser console:** Open DevTools (F12) and check the Console tab for errors.
4. **Network tab:** Check the Network tab for failed API requests (red status codes).
5. **Cache:** Try a hard refresh (`Ctrl+Shift+R` / `Cmd+Shift+R`) or open an incognito window.

---

## Authentication Issues

### Cannot sign in

**Symptom:** Login button does not work, or you see an error after auth redirect.

**Steps:**
1. Clear browser cookies and cache for the site domain
2. Try incognito/private browsing mode
3. Check that your identity provider (Replit Auth, Azure AD, Okta) is accessible
4. Verify your account exists — ask your admin to confirm you are provisioned
5. If using SSO: confirm your IdP application is configured correctly (redirect URI, scopes)
6. If the issue persists: contact support with the error message and your email

---

### Session expires too quickly

**Symptom:** You are logged out after a short period of inactivity.

**Steps:**
1. Check your session timeout settings under **Settings → Security**
2. Ensure your browser allows cookies for the site (check browser cookie settings)
3. If using SSO: session duration may be controlled by your IdP — check IdP session policies
4. Admins: review session configuration in the platform admin panel

---

### Wrong role or missing domain access

**Symptom:** You can sign in but cannot see expected domain packs or features.

**Steps:**
1. Sign out and sign back in (role assignment takes effect on next login)
2. Ask your admin to confirm your role and domain pack assignments under **Admin → Users**
3. If using SCIM provisioning: confirm your IdP group mappings are configured correctly
4. If you just joined the organization: provisioning may take up to 5 minutes via SCIM

---

## Dashboard and Data Issues

### Dashboard shows a blank screen or perpetual loading spinner

**Symptom:** After login, the dashboard loads but shows nothing.

**Steps:**
1. Hard refresh (`Ctrl+Shift+R` / `Cmd+Shift+R`)
2. Check the browser console for JavaScript errors
3. Check `/api/health` — confirm the API server is responding
4. Verify your role has access to the page (check with admin)
5. If using a VPN: try without VPN — the reverse proxy may be blocking the connection
6. If the issue is on a specific route: note the exact URL and error, then contact support

---

### No data appears in lists, tables, or feeds

**Symptom:** Dashboard loads but shows empty tables or "no results" across all filters.

**Steps:**
1. Confirm you are in the correct organization context — check the org switcher
2. Clear all active filters — look for filter chips or "Active filters" indicators
3. Check if demo data seeding is needed: ask your admin to run `pnpm seed:demo`
4. Verify your domain pack has real or seeded data loaded
5. For Vessels: confirm AIS integration is configured under **Admin → Integrations**
6. For Terra: confirm NYC data sync is running under **Admin → Data Sync**
7. For Aegis: confirm threat feed is connected under **Admin → Integrations**

---

### Data is stale or not refreshing

**Symptom:** You know something changed but the display shows old values.

**Steps:**
1. Hard refresh the page
2. For AIS data (Vessels): AIS feed refreshes every 6 minutes — wait for the next cycle
3. For Terra distress data: property records sync weekly from county sources
4. For real-time signals (Lyte): check **Signal Feed** for incoming signals — if none appear in 15+ minutes, check the Event Fabric health under **Admin → System**
5. If data freshness is consistently wrong, contact support with the affected data type and time range

---

## Signal and Recommendation Issues

### Signals not appearing in the feed

**Symptom:** The signal feed is empty even though you expect signals to be present.

**Steps:**
1. Check active filters — ensure you are not filtering to a severity tier or date range with no data
2. Check **Admin → System → Event Fabric** — confirm signal ingestion is running
3. Confirm integrations are connected: **Admin → Integrations** — all active integrations should show "Connected"
4. If using demo mode: run `pnpm seed:demo` to reseed signal data
5. If you recently onboarded to a new domain pack: signals may take up to 24 hours to populate from integrated sources

---

### Recommendation confidence score seems wrong

**Symptom:** The AI recommendation has a confidence score that seems too high or too low given the evidence.

**Steps:**
1. Review the evidence links — check source quality and recency (hover over each link for metadata)
2. Check the model attribution — note the model ID and version
3. If the recommendation conflicts with your domain knowledge: reject it and document the reason — this feeds the learning loop
4. If you believe the model has a systematic bias in your domain: report it to support with examples

---

### Approval action not responding

**Symptom:** You click Approve or Reject but nothing happens, or you see an error.

**Steps:**
1. Check your internet connection — approval actions require a live API connection
2. Hard refresh the page — the workflow may have already been approved by another approver
3. Check whether the approval window has expired (some workflows have a timeout)
4. Check the Proof Chain for the signal — it will show the current approval state
5. If the approval is stuck: contact support with the workflow ID (visible in the URL or approval panel)

---

## Policy and Governance Issues

### Action blocked by Covenant Policy

**Symptom:** You try to approve an action and see a policy block message.

**Steps:**
1. Read the policy block message carefully — it will specify which policy failed and why
2. Check if you have the authority to override: only admins can waive policy blocks
3. Use the escalation workflow to route to the appropriate authority
4. If the policy block seems incorrect: document the case and contact your admin
5. Admins: review and adjust the policy rule under **Admin → Governance → Covenant Policies**

---

### Approval chain stuck — missing approver

**Symptom:** A workflow is waiting for an approval but the approver is unavailable.

**Steps:**
1. Check the approval chain status in the **Approvals Center**
2. Escalate to the next authority in the chain
3. Admins: add a backup approver or re-assign under **Admin → Governance → Approval Chains**
4. For urgent actions: use the **Emergency Override** workflow (requires admin authority and is permanently recorded in Proof Chain)

---

## Mobile (CORTEX) Issues

### CORTEX app not connecting

**Symptom:** The mobile app shows an error or cannot load workspaces.

**Steps:**
1. Check device network connectivity
2. Force close the app and reopen
3. Sign out and sign back in via the app
4. Clear app cache: **Settings → CORTEX → Clear Cache**
5. Ensure the API server is reachable — try `/api/health` in your mobile browser
6. If the issue persists: uninstall and reinstall the app, then sign in again

---

### Push notifications not arriving

**Symptom:** You approved notifications but critical alerts are not pushing to your device.

**Steps:**
1. Check device notification permissions: **Device Settings → CORTEX → Notifications → Allow**
2. Check in-app notification settings: **CORTEX → Settings → Notifications**
3. Confirm your push token is registered: **Admin → Users → [Your user] → Devices**
4. Test with a low-priority signal to confirm delivery
5. If notifications are delayed: this can occur during app background state — ensure CORTEX is allowed to run in the background on your device

---

## Admin Issues

### SCIM provisioning not working

**Symptom:** Users created in your IdP are not appearing in the SZL admin panel.

**Steps:**
1. Confirm the SCIM endpoint URL and Bearer token are correctly entered in your IdP
2. Verify the SCIM endpoint is reachable: `GET /api/scim/v2/Users` with your Bearer token
3. Check your IdP's provisioning logs for error messages
4. Ensure your IdP is configured to provision the `email`, `displayName`, and `groups` attributes
5. Test by manually triggering provisioning in your IdP admin panel
6. If provisioning fails: contact support with your IdP type and the error message from IdP logs

---

### Integration connection failing

**Symptom:** An integration shows "Disconnected" or "Error" under **Admin → Integrations**.

**Steps:**
1. Click the integration to see the error detail
2. Verify the API key or credentials are still valid — rotate if expired
3. Check the third-party service's status page
4. Re-enter credentials and test the connection
5. Check firewall/IP allowlist settings on the third-party side — SZL Holdings egress IPs may need to be allowlisted

---

## Performance Issues

### Platform feels slow

**Symptom:** Pages load slowly, API responses are delayed.

**Steps:**
1. Check `/api/health` — response time above 500ms may indicate load on the API server
2. Check your network speed — platform requires a stable connection (>5 Mbps recommended)
3. Try a different browser or incognito mode — browser extensions can cause slowness
4. If the issue is consistent and widespread, check the platform status at /status

---

## Getting Help

| Issue severity | Contact method |
|---|---|
| Service outage / data loss | security@szlholdings.com — mark as urgent |
| Bug or functional issue | support@szlholdings.com |
| Account and access | support@szlholdings.com |
| Security disclosure | security@szlholdings.com |
| General help | /help or support@szlholdings.com |

When contacting support, include:
- Your email and organization name
- The URL or route where the issue occurs
- What you expected to happen vs. what actually happened
- Any error messages (copy the exact text)
- Browser and OS version
- Steps to reproduce the issue
