# Aegis — Zero-Trust Product Model

## Doctrine

Zero trust in Aegis is a product behavior, not a perimeter configuration. The platform never assumes trust based on network position, session presence, or prior authentication. Every action, data access, and automated response is governed by an explicit policy check that is:

- **Identity-aware**: bound to a verified operator identity with a resolved permission class
- **Tenant-scoped**: restricted to the requesting operator's authorized organization
- **Environment-labeled**: production, pilot, and demo contexts carry different policy enforcement
- **Automation-gated**: no automated response executes without an explicit gate classification
- **Data-labeled**: every data surface carries sensitivity, retention, and export restriction metadata

This model is drawn from publicly available NSA zero-trust pillars adapted into civilian enterprise product behavior. No agency affiliation is claimed.

---

## Pillar 1: Identity-Aware Routing

### Principle
Every action carries a verified operator identity. Trust is not inherited from the network, browser session, or URL prefix. The permission class of the requesting identity gates every route and tool.

### Implementation

**Permission Classes** (least to most privileged):
| Class | Capabilities |
|-------|-------------|
| `analyst` | Read all org data, write triage/notes, propose_only automation |
| `partner_analyst` | Read authorized tenant only, write within scope, propose_only |
| `responder` | Full incident write, execute approval_required actions (with approver) |
| `resilience_lead` | Read compliance/risk/controls, write control status, export compliance reports |
| `soc_manager` | Full operational read/write, approve actions, override SLAs |
| `executive` | Read posture summaries and metrics, export board summaries (restricted) |
| `platform_admin` | Full platform access |

**Route-Level Enforcement**
- `identityAwareRoute()` middleware resolves permission class from session and gates routes
- Responses carry `X-Aegis-Identity` and `X-Aegis-Permission-Class` headers for audit tooling
- Org-scoped escalations route to the correct authority by resolving `req.tenantOrgId`

**Org-Scoped Escalations**
- Escalations cannot cross tenant boundaries without explicit super_admin authorization
- Partner analyst escalations are restricted to their authorized tenant scope

---

## Pillar 2: Session and Device Awareness

### Principle
Sessions are treated as ephemeral grants, not persistent trust tokens. Session age, device posture, and impersonation state are surfaced and gated on sensitive operations.

### Implementation

**Session Policy**
| Condition | Behavior |
|-----------|----------|
| Session < 6h | Normal — no flags |
| Session 6-24h | Suspicious flag set — logged, header `X-Aegis-Session-Warning` surfaced |
| Session > 24h AND high-privilege class | Step-up verification required — hard block |
| Impersonation session | Suspicious flag always set, impersonation TTL = 1h hard limit |

**Step-Up Verification**
- `requireStepUp()` middleware is attached to sensitive action endpoints (approve, abort, containment)
- Phase 1: hook is in place; token validation passes through with audit log
- Phase 3: hook binds to MFA challenge or device assertion

**Suspicious Session Flags**
- Surfaced in `X-Aegis-Session-Warning` header
- Available in `req.ztSuspiciousSession` for downstream handler use
- Logged with operator identity, path, and action class

---

## Pillar 3: Environment Labeling and Source Trust

### Principle
Production, pilot, and demo environments are hard-labeled at the platform layer. Source trust levels and connector trust scores are surfaced on every data element — not buried in metadata.

### Environment Boundaries

| Environment | Automation Gate Default | Data Export | Automation Execution |
|-------------|------------------------|-------------|---------------------|
| `production` | As configured per route | Restricted — identity required | Full gate enforcement |
| `pilot` | `approval_required` minimum | Restricted | No auto-execution |
| `demo` | Override to `propose_only` | Unrestricted (watermarked) | Blocked |

**Environment resolution order:**
1. `AEGIS_ENV` environment variable (internal tooling)
2. Hostname prefix (`demo.`, `staging.`, `pilot.`)
3. Default: `production` (fail-safe — never assume demo/pilot)

### Connector Trust Scores

| Connector | Trust Score | Level | Notes |
|-----------|-------------|-------|-------|
| `internal-db` | 1.0 | verified | First-party, signed write path |
| `edr-crowdstrike` | 0.95 | verified | Authenticated API |
| `siem-splunk` | 0.90 | verified | Event-stream integrity |
| `threat-feed-isac` | 0.78 | corroborated | Cross-referenced with STIX |
| `threat-feed-osint` | 0.55 | raw | Public OSINT — hypothesis input only |
| `email-webhook` | 0.30 | raw | Unauthenticated — spoofing risk |
| `unknown` | 0.0 | untrusted | Treat as adversarial input |

**Trust Levels** (surfaced on every data record from external sources):
- `verified`: First-party or cryptographically validated
- `corroborated`: Cross-referenced with known-good sources
- `raw`: Unverified signal — hypothesis input only
- `untrusted`: Known or suspected tampered/poisoned — quarantine

---

## Pillar 4: Automation Gating

### Principle
No automated action executes without an explicit gate classification. Automation deference is a product feature — operators are always aware of what the system proposes vs. executes.

### Gate Modes

| Gate | Behavior | Human Action Required |
|------|----------|-----------------------|
| `propose_only` | Returns 202 Proposed — no execution | Operator must explicitly initiate |
| `approval_required` | Queues action with approval state | Named approver must confirm |
| `approved_execute` | Executes with full audit log | Pre-approved — no additional gate |
| `blocked_by_policy` | Hard block — 403 returned | Cannot proceed in current context |

### Gate Selection Guidelines

| Action Class | Minimum Gate |
|--------------|-------------|
| Alert triage suggestion | `propose_only` |
| Network block / isolation | `approval_required` |
| Credential rotation | `approval_required` |
| Evidence collection (automated) | `approved_execute` |
| Rollback actions | `approval_required` |
| Emergency containment | `approval_required` |
| Cross-tenant action | `blocked_by_policy` (unless super_admin) |
| Demo environment action | `propose_only` override |

### Phase 1 Implementation
- `automationGate()` middleware enforces gate classification at the route level
- Proposal responses include full action context for operator review
- Approval context attached to `req.ztApprovalContext` for handler persistence
- Phase 2 will implement the approval queue persistence and execution engine

---

## Pillar 5: Data Controls

### Principle
Every data record that operators touch carries explicit labels for sensitivity, tenant ownership, environment origin, retention class, and export restriction. These are not access-control lists — they are visible signals on every surface.

### Sensitivity Labels

| Label | Description | Export |
|-------|-------------|--------|
| `PUBLIC` | Non-sensitive platform data | Unrestricted |
| `INTERNAL` | Operational data — org-internal | Authenticated only |
| `CONFIDENTIAL` | Investigation data — need-to-know | Identity + tenant verified |
| `RESTRICTED` | IR evidence, decision objects | Identity + tenant + audit log |
| `EXECUTIVE-ONLY` | Board summaries, posture metrics | Executive class + watermarked |

### Retention Classes

| Class | Retention | Notes |
|-------|-----------|-------|
| `STANDARD-30D` | 30 days | Standard operational data |
| `IR-90D` | 90 days | Incident response artifacts |
| `COMPLIANCE-7Y` | 7 years | Compliance evidence |
| `BOARD-90D` | 90 days | Executive/board summaries |
| `TRANSIENT` | Session-scoped | No persistence |

### Export Restrictions
- Data with `exportRestricted: true` cannot be extracted without authenticated identity
- Production data is export-restricted by default
- Board exports carry `BOARD-CONFIDENTIAL` and `EXPORT-RESTRICTED` labels
- Export actions are logged with operator identity, timestamp, and record scope

### Headers Surfaced on Every Response
```
X-Aegis-Sensitivity: RESTRICTED
X-Aegis-Tenant: NORTHGATE-CORP
X-Aegis-Environment: production
X-Aegis-Retention: IR-90D
X-Aegis-Export-Restricted: true
X-Aegis-Trust-Level: verified
```

---

## Audit Requirements

All zero-trust control events are logged with:
- Operator identity (`userId`, `displayName`)
- Permission class at time of action
- Action class and gate classification
- Tenant context and environment label
- Outcome (pass / block / propose / queue)
- Timestamp (UTC ISO 8601)

Audit events are immutable. Phase 3 will bind these to the tamper-evident audit chain on decision objects.

---

## Phase Boundaries

| Control | Phase 1 | Phase 2 | Phase 3 |
|---------|---------|---------|---------|
| Identity-aware routing | ✓ Implemented | — | — |
| Session awareness hooks | ✓ Implemented | — | MFA/device binding |
| Environment labeling | ✓ Implemented | — | — |
| Source trust scores | ✓ Implemented | — | — |
| Automation gating | ✓ Middleware | Approval queue persistence | — |
| Data sensitivity labels | ✓ Implemented | — | — |
| Export restrictions | ✓ Implemented | — | DLP integration |
| Step-up verification | ✓ Hook in place | — | MFA enforcement |
| SSO/SCIM | — | — | ✓ Phase 3 |
| RBAC engine | — | — | ✓ Phase 3 |
