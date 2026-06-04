# Admin Setup Guide — SZL Holdings Platform

**Version:** 1.0 · **Date:** April 2026
**Audience:** Org admins, platform administrators, enterprise IT leads

---

## Purpose

This guide covers the complete setup process for a new organization admin on the SZL Holdings platform — from initial tenant provisioning through production-ready configuration. It is the reference document for the admin track of the onboarding journey.

---

## Prerequisites

Before starting setup, you need:

- [ ] Organization admin account (owner or admin role)
- [ ] Your organization's primary email domain
- [ ] For enterprise SSO: Azure AD tenant ID and OIDC configuration
- [ ] For SCIM provisioning: Azure AD SCIM endpoint and bearer token
- [ ] List of initial users and their intended roles

---

## Phase 1: Organization Configuration

### 1.1 Organization Profile

**Location:** Settings → Organization → Profile

Configure the following:

| Field | Description | Required |
|-------|-------------|----------|
| Organization name | Full legal or display name | Yes |
| Slug | URL-safe identifier (used in API paths) | Yes |
| Primary domain | Your organization's email domain | Yes |
| Industry vertical | Determines default signal templates | Yes |
| Timezone | Controls report and notification timing | Yes |
| Logo | PNG or SVG, used in the platform header | Optional |

The slug is set at creation and cannot be changed without contacting support. Choose carefully.

---

### 1.2 Notification Settings

**Location:** Settings → Organization → Notifications

| Setting | Description | Default |
|---------|-------------|---------|
| Admin email | Receives billing, security, and admin alerts | Org owner email |
| Digest frequency | Daily or weekly operational summary | Weekly |
| Slack webhook | Posts platform alerts to a Slack channel | None |
| PagerDuty key | Routes high-severity platform alerts | None |

---

### 1.3 Feature Flags

**Location:** Settings → Organization → Features

Feature flags control access to capabilities that are in limited release or being rolled out progressively. As an org admin, you can enable or disable flags for your organization.

Flags are documented at `/docs/feature-flags`. Some flags require plan entitlements to activate.

---

## Phase 2: User Management

### 2.1 Invite Users

**Location:** Settings → Team → Invite

**Process:**
1. Click "Invite user"
2. Enter email address
3. Select role (see role reference below)
4. Set domain pack access (optional — defaults to all enabled packs)
5. Send invitation

Invitations expire after 7 days. Resend from the pending invitations list.

**Bulk invite:** Upload a CSV with columns `email`, `role`, `name` to invite multiple users at once.

### 2.2 Role Reference

| Role | What They Can Do |
|------|-----------------|
| `owner` | Full access including billing. One per org. |
| `admin` | Full access except billing. Can manage users and settings. |
| `member` | Create/edit records, run workflows, approve actions. |
| `viewer` | Read-only access to dashboards and reports. |

**Principle of least privilege:** Start users at `viewer` and elevate to `member` or `admin` based on operational need. Reserve `owner` for the person responsible for billing.

### 2.3 Managing Existing Users

**Location:** Settings → Team → Members

From the members list you can:
- Change a user's role
- Revoke access (immediately invalidates their session)
- Transfer org ownership (requires confirmation by both parties)
- View last login and role history in the audit trail

### 2.4 Pending Invitations

**Location:** Settings → Team → Pending

Monitor pending invitations. Resend or revoke from this view. Accepted invitations move to the Members list.

---

## Phase 3: Authentication Configuration

### 3.1 Standard Authentication (Default)

Out of the box, the platform uses:
- Email + password with PBKDF2 password hashing
- OIDC with PKCE for SSO providers (Google, Microsoft)
- Session cookies (HttpOnly, Secure, SameSite=Lax)
- 30-day session lifetime (credential login)
- 7-day session lifetime (OIDC login)

No configuration required for standard authentication.

### 3.2 Enterprise SSO (Azure AD)

**Location:** Settings → Security → SSO

**Requirements:**
- Azure AD tenant with admin access
- Application registration in Azure AD
- OIDC endpoint URLs from Azure

**Configuration steps:**

1. In Azure AD: Register a new application
   - Redirect URI: `https://your-domain/api/auth/oidc/callback`
   - Grant: `openid`, `profile`, `email`, `offline_access`
   - Copy: Client ID, Client Secret, Tenant ID

2. In SZL Holdings settings:
   - Enter Client ID, Client Secret, Tenant ID
   - Set claim mappings (email, name, groups)
   - Map Azure AD groups to platform roles
   - Test SSO connection

3. Activate SSO:
   - "Enforce SSO" option disables email/password login for org members
   - Users will be redirected to Azure AD on next login

### 3.3 SCIM Provisioning

**Location:** Settings → Security → Provisioning

SCIM 2.0 for automated user lifecycle management:

1. Generate a SCIM bearer token in platform settings
2. In Azure AD: Add a new enterprise application
   - SCIM endpoint: `https://your-domain/api/scim/v2/`
   - Bearer token: from step 1
3. Configure attribute mapping:
   - `userName` → platform email
   - `displayName` → platform display name
   - `groups` → platform roles (via claim mapping)
4. Test provisioning with a single user before enabling full sync

With SCIM active, users are automatically provisioned on Azure AD assignment and deprovisioned on removal.

---

## Phase 4: Data Sources and Integrations

### 4.1 Signal Sources

**Location:** Settings → Integrations → Signal Sources

Signal sources feed operational data into the platform. Connect sources relevant to your vertical:

| Vertical | Recommended Sources |
|----------|-------------------|
| Business Operations | Slack, Jira, Salesforce, GitHub |
| Security (Aegis) | SIEM connector, STIX/TAXII feed, Splunk |
| Maritime (Vessels) | AIS feed (MarineTraffic API), Port authority feeds |
| Real Estate (Terra) | NYC public records (auto-configured), MLS feed |
| Legal (PRISM Counsel) | Court filing APIs, document management system |

### 4.2 Integration Health

**Location:** Settings → Integrations → Health

Monitor integration status:
- Last sync timestamp
- Sync error rate
- Signal volume
- Connector version

Integration errors appear in the audit trail with resolution guidance.

### 4.3 AI Model Configuration

**Location:** Settings → AI → Models

Configure which AI providers power platform intelligence:

| Setting | Options | Default |
|---------|---------|---------|
| Primary LLM | OpenAI GPT-4o, Anthropic Claude 3.5 | GPT-4o |
| Embedding model | text-embedding-3-large | text-embedding-3-large |
| Data residency | US, EU (enterprise) | US |
| Trace retention | 30, 90, 365 days | 30 days |

---

## Phase 5: Billing and Entitlements

### 5.1 Plan Overview

**Location:** Settings → Billing → Plan

View current plan, usage, and billing cycle. See `PLAN_MATRIX.md` for the full plan comparison.

### 5.2 Upgrading Plans

**Location:** Settings → Billing → Upgrade

Upgrades take effect immediately. A prorated charge is applied for the remainder of the current billing period. Plan details are confirmed before charge.

### 5.3 Adding Domain Packs

**Location:** Settings → Billing → Domain Packs

Domain packs are activated per-org. Once activated:
1. Domain pack surfaces become accessible to all org members (subject to their role)
2. Domain-specific signal sources are enabled
3. Domain pack workflow templates are available in Alloy

### 5.4 Usage Monitoring

**Location:** Settings → Billing → Usage

Monitor usage against plan limits:

| Metric | Description |
|--------|-------------|
| Active seats | Users who logged in this billing period |
| Workflow executions | Alloy workflow runs |
| AI agent calls | LLM API calls through the platform |
| Signal events | Signals ingested from connected sources |
| Storage | Files and documents stored |

Limit alerts are sent when usage reaches 80% and 95% of each limit.

---

## Phase 6: Governance and Approval Chains

### 6.1 Approval Chains

The governed decision loop requires human approvers for consequential actions. Configure approval chains to define who approves what.

1. Go to **Admin → Governance → Approval Chains**
2. Create a chain for each action type (e.g., "Fleet Reroute", "Security Escalation")
3. Define the approvers in order (e.g., Operator → Manager → CFO for high-value actions)
4. Set thresholds that trigger multi-level approval (e.g., actions >$50K require finance sign-off)
5. Configure notification settings for each approver role

### 6.2 Covenant Policies

Covenant Policies enforce organizational rules on AI-assisted actions.

1. Go to **Admin → Governance → Covenant Policies**
2. Review the default policy set
3. Add organization-specific rules:
   - Financial thresholds
   - Regulatory compliance gates
   - Cross-domain sign-off requirements
   - Time-window restrictions
4. Test policies against sample actions using the **Policy Simulator**
5. Publish — policies are enforced immediately on all new workflows

---

## Phase 7: Security and Compliance

### 7.1 Audit Trail

**Location:** Audit → All Events

All admin actions are logged in the immutable audit trail (Proof Chain). The admin cannot edit or delete audit entries.

Filter by: user, action type, resource, date range.

Export: CSV or JSON for compliance reporting.

### 7.2 Session Management

**Location:** Settings → Security → Sessions

View all active sessions for your organization. Force-terminate suspicious sessions. Sessions are invalidated automatically on role change (next login).

### 7.3 API Keys

**Location:** Settings → Security → API Keys

For machine-to-machine integrations:
1. Generate a named API key
2. Assign a role (minimum required for the integration's function)
3. Set an expiry date (required — maximum 1 year)
4. Note the key immediately — it is not shown again

Rotate keys regularly. Compromised keys can be revoked instantly.

### 7.4 IP Allowlisting (Enterprise)

**Location:** Settings → Security → Network

Restrict platform access to approved IP ranges. Applies to all users in the organization.

---

## Phase 8: Admin Health Check

Before declaring the tenant production-ready, verify:

- [ ] Organization profile complete
- [ ] All users invited with correct roles
- [ ] SSO configured and tested (if required)
- [ ] SCIM provisioning active and tested (enterprise)
- [ ] At least one signal source connected
- [ ] Admin email notifications configured
- [ ] Billing plan confirmed and payment method on file
- [ ] API keys created for any machine-to-machine integrations
- [ ] Audit trail reviewed for any provisioning errors
- [ ] First workflow deployed and tested
- [ ] Approval chains configured for key action types
- [ ] Covenant Policies reviewed and customized

This checklist maps directly to the `CUSTOMER_SETUP_CHECKLIST.md` — share that with design partners to track their own progress.

---

## Troubleshooting

| Issue | Resolution |
|-------|-----------|
| SSO login fails | Check redirect URI matches exactly, including trailing slash |
| SCIM provisioning not syncing | Verify bearer token is active and not expired |
| Users not receiving invitations | Check spam, verify email domain is not blocked |
| Integration sync errors | Review integration health panel, check API credentials |
| Usage limit warnings | Contact support for temporary limit increase during evaluation |
| Audit trail gaps | Review audit export — gaps indicate a session or integration error |

---

## Getting Help

| Need | Contact |
|------|---------|
| Setup questions | Direct Slack channel (design partner) or `inquiries@szlholdings.com` |
| SSO / SCIM issues | `inquiries@szlholdings.com` with "ENTERPRISE SETUP" in subject |
| Security concerns | `security@szlholdings.com` |
| Billing issues | `inquiries@szlholdings.com` with "BILLING" in subject |

---

## Related Documents

| Document | Path |
|----------|------|
| Onboarding strategy | `ONBOARDING_STRATEGY.md` |
| Customer setup checklist | `CUSTOMER_SETUP_CHECKLIST.md` |
| Access control matrix | `ACCESS-CONTROL-MATRIX.md` |
| Tenancy model | `TENANCY-MODEL.md` |
| Support model | `SUPPORT_MODEL.md` |
| Plan matrix | `PLAN_MATRIX.md` |
| Authentication & Roles | `content/docs/auth-and-roles.md` |
| Trust Center | `TRUST_CENTER_INDEX.md` |
