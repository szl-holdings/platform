# Identity & Access Management — Buyer Summary

**Document:** SZL Platform — IAM Overview  
**Audience:** Procurement, Security, IT Leadership  
**Classification:** Buyer-Facing  
**Updated:** April 2026

---

## Overview

The SZL Platform is built for multi-tenant enterprise deployments. Every organization operates in a fully isolated tenant boundary. No data is shared between organizations unless explicitly configured. This document summarizes the identity and access management (IAM) capabilities available to enterprise buyers.

---

## Authentication Methods

### Replit OIDC (Platform Default)
The platform ships with built-in OpenID Connect (OIDC) authentication. Users sign in via the platform identity provider. Sessions are cryptographically signed, stored server-side, and expire after 7 days with sliding renewal.

### Microsoft Entra ID (Azure AD) SSO
Enterprise customers can connect their Microsoft Entra ID tenant via OAuth 2.0 / OIDC federation. Users authenticate with their corporate credentials. The platform maps Azure AD app roles to platform roles at login time.

**How to activate:**
- Provide your Azure AD Tenant ID, Client ID, and Client Secret to your account team.
- Grant admin consent for the platform application in your Azure AD portal.
- The platform maps group membership or app role assignments to platform roles automatically.

---

## Automated Provisioning — SCIM 2.0

The platform supports the SCIM 2.0 protocol (RFC 7643 / RFC 7644) for automated user provisioning and deprovisioning directly from your identity provider.

**Capabilities:**
- Automatically provision users when they are added to your IdP group.
- Automatically deprovision (deactivate) users when removed from your IdP.
- Sync group membership to platform roles.
- All SCIM operations are logged in a tamper-evident audit trail.

**Supported SCIM operations:** Create User, Update User, Deactivate User, Create Group, Update Group, Delete Group.

**Authentication:** SCIM API access uses bearer tokens issued per tenant. Tokens are hashed at rest and can be rotated at any time.

---

## Role-Based Access Control (RBAC)

The platform enforces a role hierarchy. Every user is assigned one or more roles, and all API operations are gated by role requirements enforced server-side.

| Role | Description |
|---|---|
| `super_admin` | Full platform access; internal use only |
| `admin` | Full organization management |
| `exec` | Read-all within org; write restricted |
| `ops` | Operational actions (signal ACK, workflow execution) |
| `analyst` | Read-only dashboards and analytics |
| `editor` | Content creation and editing |
| `viewer` | Read-only; no write operations permitted |
| `operator` | Operational read and limited write |
| `client_viewer` | External client portal access |

**Role hierarchy:** Higher roles automatically inherit the permissions of all lower roles. Role assignment is enforced server-side on every API request; the frontend display reflects the same permissions.

**Custom role mapping:** Azure AD app roles or group names are mapped to platform roles via a configurable table. Your IT team can define which Azure AD groups map to which platform roles.

---

## Tenant Isolation

All data in the platform is scoped to your organization. The following guarantees apply:

1. **API-layer isolation**: Every API route enforces org-scoping. A user belonging to your organization cannot retrieve or modify data belonging to a different organization.
2. **Database-layer isolation**: All sensitive domain tables carry an `org_id` foreign key. Queries always filter by the authenticated user's org membership.
3. **File isolation**: Uploaded files are tagged with an `org_id` at upload time and are never accessible to users in other organizations.
4. **Action isolation**: Workflow executions, approvals, and AI-generated actions are scoped to your organization and cannot be triggered by users outside it.

---

## Session Management

| Feature | Details |
|---|---|
| Session TTL | 7 days (configurable by platform admins) |
| Session refresh | Sliding window — sessions refresh on active use |
| Session storage | Server-side only; no secrets stored in browser |
| Logout | Immediate server-side invalidation |
| Admin force-logout | Platform admins can terminate all sessions for a user |
| Multi-device | Sessions are device/browser independent; each login creates a separate session |

---

## User Onboarding via Invitation

Platform admins and org owners can invite new users via email invitation links. The invitation flow:
1. Admin sends invite via platform UI or API.
2. Invitee receives a single-use, time-limited token.
3. Invitee clicks the link, authenticates (via SSO or platform auth), and is added to the organization.
4. All invitation actions are audit-logged.

---

## Admin Impersonation

Platform administrators can temporarily impersonate any user for support and debugging purposes. Impersonation is:
- Restricted to users with `super_admin` or `admin` role.
- Time-limited (1-hour session).
- Fully audit-logged — every impersonation start and end event is recorded with the impersonator's identity, target user, timestamp, and reason.
- Cannot grant permissions the impersonating admin does not hold.

---

## Audit Trail

Every identity and access event produces an entry in the platform audit log:

| Event | Logged |
|---|---|
| User login | Yes — includes IP address and user agent |
| Login failure | Yes |
| Role assignment | Yes |
| SCIM provisioning | Yes — every operation |
| Invitation sent / accepted | Yes |
| Admin impersonation start / end | Yes |
| Admin force-logout | Yes |
| Permission denial (403) | Yes |

Audit logs are immutable append-only records. Platform admins can query the audit log via the admin panel or API.

---

## Compliance Posture

| Requirement | Status |
|---|---|
| RBAC enforcement | Server-side on all routes |
| Audit logging | Comprehensive — all auth and access events |
| Session expiry | Enforced at token validation |
| MFA | Delegated to IdP (Azure AD MFA policies respected) |
| SCIM lifecycle management | Full provisioning and deprovisioning |
| Data residency | Configurable per deployment |
| Encryption in transit | TLS 1.3 required |
| Secrets at rest | All tokens stored as SHA-256 hashes |

---

## Contact

For IAM configuration, SSO setup, or security questions, contact your SZL account team or open a support ticket.
