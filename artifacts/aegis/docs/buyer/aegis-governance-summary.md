# Aegis — Enterprise Governance Summary

**Document type:** Buyer-facing governance documentation  
**Current status:** Production-ready (pilot)  
**Label:** Demo/Pilot/Production environments labeled in-platform  
**Last updated:** April 2025  

---

## Governance Principles

1. **Human-in-the-loop for high-risk actions.** Every action classified as high-risk requires explicit human approval before execution. Agents cannot bypass approval gates.

2. **Tenant ownership of all credentials.** Integration credentials (Slack, SIEM, ticketing, IdP) belong to and are controlled by each customer tenant. Aegis never shares credentials across tenants.

3. **Honest trust posture.** We publish our AI trust metrics — schema validity, retrieval miss rate, unsupported claim rate, override rate. We do not hide limitations. We do not claim certifications we have not achieved.

4. **Immutable audit trail.** Every action — agent or human — is logged with actor attribution, timestamp, and context. Audit entries cannot be modified after write.

5. **Tenant isolation enforced structurally.** Cross-tenant data access is blocked at the query level, not just in the UI.

---

## Response Orchestration Governance

Aegis implements four execution modes for all agent actions:

| Mode | Description | Human Required? |
|------|-------------|----------------|
| `observe_only` | Agent monitors; no actions taken | No |
| `propose_only` | Agent proposes; no execution without explicit trigger | Human to trigger |
| `approval_required` | Action blocked until approved by designated approver | Yes — before execution |
| `approved_execute` | Action can execute; approval pre-granted for this action class | Policy approval required |

High-risk actions (network isolation, credential rotation, cross-segment firewall changes) are always `approval_required` unless explicitly downgraded by tenant admin policy.

---

## Tool Registry — Governance Coverage

| Tool Class | Audit Event | Approval Gate | Cross-tenant Blocked |
|-----------|-------------|---------------|---------------------|
| notify_team | Yes | No | N/A |
| create_case | Yes | No | Yes |
| update_case | Yes | No | Yes |
| close_case | Yes | Approval required | Yes |
| assign_owner | Yes | No | Yes |
| request_approval | Yes | N/A (creates gate) | Yes |
| add_containment_step | Yes | Approval required | Yes |
| add_recovery_step | Yes | Approval required | Yes |
| append_note | Yes | No | Yes |
| generate_executive_brief | Yes | Approval for delivery | Yes |
| fetch_connector_context | Yes | No | Yes |
| open_workflow | Yes | No | Yes |
| close_workflow | Yes | Approval required | Yes |
| reopen_workflow | Yes | No | Yes |

---

## Approval Governance

- Approvals are created as records in the approval queue, not as in-process holds
- Every approval is attributed to a named human actor (not "system")
- Approval decisions (grant/reject) are timestamped and immutable
- Approval delay is tracked and surfaced in Incident Analytics
- Override rate (approvals that overrode a policy block) is published in Trust Analytics

---

## Retention Policies

| Data Type | Retention | Enforcement |
|-----------|-----------|-------------|
| Audit logs | 2 years | Hard delete after retention period |
| Incident records | 7 years | Archive to cold storage after 1 year |
| Evidence artifacts | 3 years | Encrypted archive, tenant-keyed |
| Model call logs | 90 days | Rolling delete |
| Session tokens | 24 hours | Auto-revoke on expiry |

---

## Export Controls

- All report exports are logged to the audit trail
- Reports containing classified or restricted data require approval before delivery
- Export recipients are recorded and auditable
- Data residency controls: single-region deployment (multi-region planned)

---

## Current Posture vs Planned

### Currently Active
- Approval-aware orchestration (four execution modes)
- Tool registry with per-call audit events
- Cross-tenant isolation (enforced at query level)
- Server-side RBAC (7 role types)
- Immutable audit log with 2-year retention
- SSO/SCIM hook points (SAML 2.0, OIDC)
- Policy templates (5 built-in)
- Integration permission controls (9 connectors)
- Executive report generation (8 report types)
- Trust metrics published in-platform

### Planned (Not Yet Available)
- SOC 2 Type II audit
- ISO 27001 certification
- Full MFA enforcement (TOTP/FIDO2)
- Multi-region deployment with data residency
- Real IdP binding out-of-box (currently requires per-customer config)
- Privileged access management (PAM) integration

---

## Contact

For governance questions, data processing agreements (DPA), or security questionnaires, contact your Aegis account team. We will respond with documented evidence, not generic assurances.
