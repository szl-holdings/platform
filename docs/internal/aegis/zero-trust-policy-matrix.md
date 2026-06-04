# Aegis — Zero-Trust Policy Matrix

## Route Authorization Matrix

This matrix documents the permission class, automation gate, sensitivity label, and retention class for each Aegis platform surface. All routes enforce `authMiddleware` unless marked as public.

### Command Surfaces

| Surface | Min Permission Class | Auth Required | Sensitivity | Automation Gate | Retention | Export Restricted |
|---------|---------------------|---------------|-------------|-----------------|-----------|-------------------|
| Command Home (posture) | `analyst` | Yes | CONFIDENTIAL | N/A | IR-90D | Yes |
| Investigations Board (read) | `analyst` | Yes | CONFIDENTIAL | N/A | IR-90D | Yes |
| Investigations Board (note) | `analyst` | Yes | CONFIDENTIAL | propose_only | IR-90D | Yes |
| Decision Console (read) | `responder` | Yes | RESTRICTED | N/A | IR-90D | Yes |
| Decision Console (approve) | `soc_manager` | Yes + step-up | RESTRICTED | approval_required | COMPLIANCE-7Y | Yes |
| Response Orchestration (playbooks) | `responder` | Yes | CONFIDENTIAL | N/A | IR-90D | Yes |
| Response Orchestration (execute) | `responder` | Yes + step-up | RESTRICTED | approved_execute | IR-90D | Yes |
| Response Orchestration (contain) | `soc_manager` | Yes + step-up | RESTRICTED | approval_required | COMPLIANCE-7Y | Yes |
| Executive/Board View (posture) | `executive` | Yes | EXECUTIVE-ONLY | N/A | BOARD-90D | Yes |
| Executive/Board View (compliance) | `executive` | Yes | EXECUTIVE-ONLY | N/A | BOARD-90D | Yes |

**Notes:**
- `CONFIDENTIAL`: SOC analysts with valid session can access; export restricted
- `RESTRICTED`: Requires `responder` class minimum; step-up for mutations
- `EXECUTIVE-ONLY`: Requires `executive` class; board-level sensitivity; full export restriction
- DB: Firestorm schema is shared-platform (no orgId). Two-layer enforcement on every query:
  - Layer 1: permission class gate via identityAwareRoute() — minimum class enforced per route
  - Layer 2: user-scoped row filtering via buildUserScopeFilter() — analyst/responder/resilience_lead users see only rows where the assignment field (assignedAnalyst, remediationOwner, assignedTo) matches their session identity or is null; soc_manager/executive/platform_admin see all rows
  - Applied to: incidents (assignedAnalyst), cases (assignedAnalyst), findings (remediationOwner), workflow actions (assignedTo), and all aggregate views that query these tables
  - Cross-tenant actions are blocked_by_policy per automation gate rules
- Step-up: Bypassed in development (NODE_ENV=development) and demo environments; enforced in production/pilot. Phase 3 will validate token against MFA/device assertion.

### Security Operations

| Surface | Min Permission Class | Auth Required | Sensitivity | Automation Gate | Retention |
|---------|---------------------|---------------|-------------|-----------------|-----------|
| Incidents (read) | `analyst` | Optional | INTERNAL | N/A | STANDARD-30D |
| Incidents (write) | `analyst` | Yes | CONFIDENTIAL | N/A | IR-90D |
| Incidents (status change P1/P2) | `responder` | Yes | RESTRICTED | approval_required | IR-90D |
| Alerts (read) | `analyst` | Optional | INTERNAL | N/A | STANDARD-30D |
| Alerts (acknowledge) | `analyst` | Yes | INTERNAL | propose_only | STANDARD-30D |
| Cases (read) | `analyst` | Optional | INTERNAL | N/A | IR-90D |
| Cases (write) | `analyst` | Yes | CONFIDENTIAL | N/A | IR-90D |
| Findings (critical/high create) | `analyst` | Yes | CONFIDENTIAL | approval_required | COMPLIANCE-7Y |
| Assets (read) | `analyst` | Optional | INTERNAL | N/A | STANDARD-30D |
| SOAR Playbooks (execute) | `soc_manager` | Yes + step-up | RESTRICTED | approval_required | IR-90D |
| Hardening Controls | `resilience_lead` | Yes | INTERNAL | N/A | COMPLIANCE-7Y |
| Compliance Reports | `resilience_lead` | Yes | CONFIDENTIAL | N/A | COMPLIANCE-7Y |

### Automation Gate Rules

| Action Type | Default Gate | Production Override | Demo Override | Notes |
|-------------|-------------|---------------------|---------------|-------|
| Alert triage suggestion | propose_only | — | — | Never auto-promotes |
| Incident status change | propose_only | approval_required for P1/P2 | propose_only | P1/P2 require named approver |
| Network isolation | approval_required | approval_required | blocked_by_policy | Blast radius control |
| Credential rotation | approval_required | approval_required | blocked_by_policy | IAM actions gated |
| Block/firewall rule | approval_required | approval_required | blocked_by_policy | Network changes gated |
| Evidence collection | approved_execute | approved_execute | propose_only | Pre-approved in playbook context |
| Rollback action | approval_required | approval_required | blocked_by_policy | Always requires named approver |
| Emergency containment | approval_required | approval_required | blocked_by_policy | Hard gate — no exception |
| Cross-tenant action | blocked_by_policy | blocked_by_policy | blocked_by_policy | Super_admin exception only |
| Board export | approved_execute | approved_execute | propose_only | Watermarked + audit logged |

### Data Access by Permission Class

| Data Type | analyst | partner_analyst | responder | resilience_lead | soc_manager | executive |
|-----------|---------|-----------------|-----------|-----------------|-------------|-----------|
| Alert queue | ✓ read | ✓ own-tenant | ✓ read | ✓ read | ✓ read/write | summary |
| Incident details | ✓ read | ✓ own-tenant | ✓ read/write | ✓ read | ✓ full | summary |
| Case timeline | ✓ read | ✓ own-tenant | ✓ read/write | — | ✓ full | — |
| Evidence (RESTRICTED) | ✓ read | ✓ own-tenant | ✓ read/write | — | ✓ full | — |
| Decision objects | ✓ draft | ✓ own-tenant | ✓ read/write | — | ✓ approve | — |
| Response playbooks | view | view (own) | ✓ execute (gate) | — | ✓ approve | — |
| Risk register | ✓ read | ✓ own-tenant | ✓ read | ✓ read/write | ✓ full | summary |
| Control status | ✓ read | ✓ own-tenant | — | ✓ read/write | ✓ read | summary |
| Compliance reports | — | — | — | ✓ export | ✓ read | summary |
| Posture metrics | — | — | — | ✓ read | ✓ read | ✓ read |
| Board view/export | — | — | — | ✓ read | ✓ read | ✓ export |
| Raw signal data | ✓ read | ✓ own-tenant | ✓ read | — | ✓ read | — |

### Session Policy Matrix

| Condition | Flag | Block | Step-Up Required | Classes Affected |
|-----------|------|-------|-----------------|-----------------|
| Session < 6h | None | No | No | All |
| Session 6-24h | `X-Aegis-Session-Warning` | No | No | All |
| Session > 24h, high-privilege | Suspicious | No | Yes | soc_manager, executive, platform_admin |
| Impersonation session | Always suspicious | No | No | All |
| Sensitive action (approve/contain) | — | No | Yes | responder+ |

### Connector Trust Thresholds

| Action | Minimum Trust Level | Minimum Trust Score |
|--------|--------------------|--------------------|
| Automated execution from signal | verified | 0.90 |
| Evidence collection from source | corroborated | 0.70 |
| Hypothesis input from feed | raw | 0.40 |
| Signal display (no auto-action) | untrusted | 0.0 |

### Environment Enforcement Summary

| Policy | Production | Pilot | Demo |
|--------|------------|-------|------|
| All authentication required | Yes | Yes | Optional |
| Tenant boundary enforcement | Hard | Hard | Soft |
| Automation gate enforcement | Full | Full (approval_required min) | Propose-only override |
| Data export restriction | Yes | Yes | No (watermarked) |
| Audit logging | Full | Full | Full |
| Step-up verification | Enforced (Phase 3) | Hook active | Bypassed (logged) |
| Sensitive data labels | All surfaces | All surfaces | Watermark only |
