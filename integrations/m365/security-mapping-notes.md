# Prism Counsel M365 Integration — Security Mapping Notes

**Version:** 1.0  
**Date:** April 2026  
**Scope:** Internal security and implementation reference

---

## Overview

This document captures the security considerations, permission mapping decisions, and known risks associated with the Prism Counsel Microsoft 365 integration. It is for internal engineering and security review, not for end-customer distribution.

---

## Permission Scope Decisions

### Why Each Permission Is Requested

| Permission | Scope | Justification | Could Be Reduced? |
|------------|-------|--------------|-------------------|
| `Files.Read.All` | Application | Background delta sync of SharePoint document libraries across all configured sites | No — needs cross-site access for matter folders |
| `Sites.Read.All` | Application | SharePoint site discovery during connector setup | Possibly — could be narrowed to specific site IDs post-setup |
| `Mail.Read` | Delegated | Carrier communication ingestion from opted-in attorney mailboxes | Could be reduced to specific folder/mailbox if Exchange folder permissions allow |
| `User.Read` | Delegated | UPN matching for ACL mapping during sync | No — needed for identity mapping |
| `offline_access` | Delegated | Refresh token for background sync after initial OAuth | No — required for background operations |
| `ChannelMessage.Read.All` | Application | Teams channel message ingestion (explicit tenant opt-in) | Yes — should only be requested if Teams sync is configured |
| `User.Read.All` | Application | Enumerating users for ACL mapping | Possibly — could be replaced with group-membership queries |

### Principle of Least Privilege Notes

- `ChannelMessage.Read.All` should NOT be requested unless the tenant has explicitly configured Teams sync. Remove from app registration if Teams sync is not enabled.
- `Files.Read.All` vs. `Sites.Selected` — `Sites.Selected` would be more restrictive but requires individual site permission grants by site admin. For initial deployment, `Files.Read.All` with explicit sync folder configuration is more practical. Revisit for high-security tenants.
- Delegated permissions are used for user-facing actions (identity, mailbox). App-only permissions are used for background sync.

---

## Token Storage

| Token Type | Storage | Encryption | Notes |
|-----------|---------|-----------|-------|
| Access token | In-memory only (session) | N/A | Short-lived (1 hour); never persisted |
| Refresh token | Database (`pc_connector_accounts.config`) | AES-256 at-rest encryption via DB | Never logged; never exported; rotation on each use |
| App client secret | Environment variable (`AZURE_AD_CLIENT_SECRET`) | Injection at runtime; never in source | Rotation: manually triggered; alert if older than 90 days |

**Token logging prohibition:** Refresh tokens must NEVER appear in application logs. `prism-connectors.ts` and any token exchange code must not log token values. This must be checked in code review.

---

## Graph Webhook Security

| Control | Implementation |
|---------|---------------|
| Notification URL | Must be HTTPS. No HTTP. |
| `clientState` validation | Every incoming notification is validated against the subscription's `clientState` secret |
| Subscription ID validation | Incoming notifications are cross-referenced against `pc_graph_subscription_state` before processing |
| Replay protection | Notification timestamps are checked — notifications older than 5 minutes are discarded |
| IP allowlisting | Optional: Microsoft Graph sends notifications from known IP ranges (documented in Graph docs). Consider allowlisting in production. |

**Known risk:** If `clientState` validation is bypassed or skipped in code, a malicious actor could send fabricated notifications. Validation must be enforced in `POST /api/prism-counsel/connectors/graph-notifications`.

---

## ACL Mapping Risks

| Risk | Mitigation |
|------|-----------|
| SharePoint permissions change after sync | Delta sync re-evaluates permissions on every cycle. Worst case: up to sync interval of stale permission (default: daily sync + webhook for changes) |
| UPN mismatch | Attorney uses different email in M365 vs. Prism Counsel. Mitigation: UPN fallback matching + manual mapping configuration |
| Sensitivity label not present | Default to conservative privilege state (e.g., `work_product`) when label is absent on legal matter documents |
| Guest accounts in SharePoint | M365 guest accounts must not be auto-mapped to Prism Counsel roles. Guest UPNs are identified by `#EXT#` in UPN string — map to `client_viewer` max. |
| Overshared SharePoint libraries | If a document library is overshared in M365, synced documents may appear accessible to more users than intended in Prism Counsel. Mitigation: require explicit sync folder configuration; do not default to syncing entire SharePoint. |

---

## Data Not to Index

The following data types must never be synced to Prism Counsel regardless of connector configuration:

- HR, payroll, or benefits documents
- Non-matter financial records (billing, invoicing, accounts payable)
- Personal attorney emails (outside opted-in carrier/legal correspondence mailboxes)
- Legal hold custodian documents (should remain in compliance boundary)
- M365 audit logs (these are the tenant's own security data)
- Any document classified with Microsoft sensitivity label "Highly Confidential - All Employees" or equivalent non-matter label

This is enforced at the sync configuration level — only explicitly configured sync folders and mailboxes are included. The connector does not discover and sync all SharePoint content by default.

---

## Tenant Isolation in the Integration

- Each connector account is scoped to a single `orgId` in Prism Counsel
- Graph API tokens are associated with the connector account's `orgId`
- Background sync jobs carry `orgId` and process only that tenant's configured resources
- Graph subscription `clientState` secrets are unique per connector account — cross-tenant notification injection is not possible even with a valid `clientState` (subscriptions are also validated by `subscriptionId` against the org's subscription state table)

---

## Deployment Security Checklist

Before enabling M365 integration in a customer tenant:

- [ ] Verify `AZURE_AD_CLIENT_ID` and `AZURE_AD_CLIENT_SECRET` are set via environment injection (not hardcoded)
- [ ] Verify refresh token storage is using encrypted DB field
- [ ] Verify Graph notification endpoint enforces `clientState` validation
- [ ] Verify sync folder configuration is explicit — no wildcard SharePoint sync
- [ ] Verify `ChannelMessage.Read.All` is not requested unless Teams sync is configured
- [ ] Confirm token logging prohibition in connector code (code review)
- [ ] Document which SharePoint sites and folders are in sync scope (per customer)
- [ ] Confirm ACL mapping configuration matches customer's intended role mapping
- [ ] Test ACL mapping with at least one attorney and one non-attorney user before enabling production sync

---

## Known Gaps

| Gap | Impact | Plan |
|----|--------|------|
| No fine-grained permission audit | Difficult to verify exact permissions granted by tenant admin | Add admin consent verification step that reads and displays granted permissions |
| Token rotation not automated | Refresh token does not auto-rotate on schedule | Monitor token age; alert if refresh token older than 60 days without re-auth |
| No per-document ACL re-check at retrieval time | ACL is checked at sync time and cached — not re-verified at query time | Future: real-time ACL validation for high-security tenants using `Sites.Selected` + per-item permission check |
| M365 DLP policy conflicts not detected | If tenant DLP blocks API access, sync fails without clear error | Improve error logging to distinguish DLP blocks from auth failures |

---

*See also:*
- *[M365 Integration Strategy](../../docs/architecture/prism-counsel-m365-integration.md)*
- *[Trust Center](../../docs/trust/prism-counsel-trust-center.md)*
- *[Connector Implementation](../../artifacts/api-server/src/services/prism-connectors.ts)*
