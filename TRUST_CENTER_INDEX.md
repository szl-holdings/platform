# Trust Center — SZL Holdings Platform

> The SZL Holdings Trust Center is the buyer-facing hub for all security, governance, compliance, and AI oversight documentation. Enterprise evaluators, procurement teams, and compliance officers should start here.

**Live Trust Center:** `/trust-center` on the SZL Holdings platform  
**Security contact:** [security@szlholdings.com](mailto:security@szlholdings.com)  
**Last reviewed:** 2026-04-16 · **Next scheduled review:** 2026-07-01

---

## Trust Summary

| Concern | How It Is Addressed |
|---------|---------------------|
| AI without oversight | Covenant Policy enforces approval gates — AI cannot execute consequential actions without human confirmation. Enforced at the library layer, not the UI. |
| Opaque AI outputs | All recommendations include source citations, model identity, confidence scores, and retrieval provenance via Proof Chain. |
| Audit accountability | Every action generates an immutable audit event with actor attribution, role context, and timestamp. Proof Chain is cryptographically verifiable. |
| Access control | 11-role RBAC with org-scoped tenant isolation. Deny-by-default global auth enforcer on all `/api/*` routes. |
| Multi-tenancy | All queries scoped by `org_id`. Cross-org access returns 404 to prevent information leakage. AI/RAG retrieval is tenant-isolated at the library layer. |
| Data in transit | TLS 1.3 for all connections. WebSocket uses HMAC-signed tickets with 5-minute TTL. |
| Secrets management | All credentials injected via environment variables. No secrets in source control. Azure Key Vault in production. |
| Compliance posture | GDPR/CCPA privacy frameworks in place. **SOC 2 Type II audit engagement signed with A-LIGN on 2026-04-19; observation period in progress (2026-05-01 → 2026-10-31).** Type I bridge report targeted 2026-07-31; Type II report targeted 2027-01-31. See [SOC2_AUDIT_ENGAGEMENT.md](SOC2_AUDIT_ENGAGEMENT.md). |

---

## Section 1: Security

### Security Architecture

| Document | Audience | Summary |
|----------|----------|---------|
| [SECURITY.md](SECURITY.md) | All | Security policy, responsible disclosure, scope, controls summary |
| [SECURITY-CHECKLIST.md](SECURITY-CHECKLIST.md) | Technical | Security controls checklist mapped to actual implementation |
| [docs/trust/security-posture.md](docs/trust/security-posture.md) | Technical / CISO | Security architecture deep-dive: auth, encryption, network, monitoring |
| [KNOWN-GAPS.md](KNOWN-GAPS.md) | Technical / Investors | Honest gap register with severity, status, and remediation owners |

### Authentication and Authorization

| Document | Summary |
|----------|---------|
| [ACCESS-CONTROL-MATRIX.md](ACCESS-CONTROL-MATRIX.md) | Full 11-role RBAC matrix with per-artifact and per-route permission mappings |
| [docs/ACCESS_CONTROL.md](docs/ACCESS_CONTROL.md) | Access control policy — source document |
| [docs/SECRETS_POLICY.md](docs/SECRETS_POLICY.md) | How secrets are managed, stored, and rotated |

### Key Security Properties

**Authentication:**
- OpenID Connect (PKCE) — no password storage in platform systems
- Email/password fallback with PBKDF2 (SHA-512, 100K iterations)
- Session cookies: HttpOnly, Secure (unconditional), SameSite=Lax
- CSRF double-submit cookie on all mutating requests
- WebSocket: HMAC-signed tickets, 5-minute TTL

**Authorization:**
- 11-role platform hierarchy: `founder_admin` → `anonymous_visitor`
- Organization-scoped: every user belongs to an org, all queries scoped by `org_id`
- Global deny-by-default enforcer: all `/api/*` routes require authentication unless explicitly allowlisted
- `super_admin` role cannot be granted through the UI — database write required

**Multi-Tenant Isolation (four enforcement layers):**
1. Database queries always include `WHERE org_id = ?`
2. Drizzle ORM query builders enforce org scope
3. `tenantScope` middleware verifies org membership at the route level
4. WebSocket channels include `org_id` prefix in channel name

---

## Section 2: AI Governance

| Document | Summary |
|----------|---------|
| [PLATFORM_PRIMITIVES.md](PLATFORM_PRIMITIVES.md) | Six governance primitives — Proof Chain, Covenant Policy, Outcome Graph, Monte Carlo, Workflow Engine, Event Fabric |
| [PROOF_AND_POLICY_MODEL.md](PROOF_AND_POLICY_MODEL.md) | How AI outputs are tagged, reviewed, and governed before export |
| [AI_EVALUATION_STRATEGY.md](AI_EVALUATION_STRATEGY.md) | INCA evaluation framework — confidence calibration, output scoring, drift detection |
| [AI_GOVERNANCE.md](AI_GOVERNANCE.md) | Buyer-facing AI governance posture — advisory-only model, human-in-the-loop enforcement, override attribution |

### AI Governance Properties

**Advisory-only agents:** All AI agents are advisory. No agent can execute a consequential action without explicit human confirmation. This is enforced at the Alloy workflow layer (not the UI layer) via the Covenant Policy engine.

**Evidence attribution:** All AI recommendations carry:
- Model identity and version
- Source citations with retrieval provenance
- Confidence score (calibrated from historical Outcome Graph data)
- Source classification: `llm_generated`, `human_authored`, `system_computed`, `external_ingested`, or `hybrid`
- Export safety status: `safe`, `restricted`, `pending_review`, or `blocked`

**Export guard:** The `assertExportSafe()` guard in `proof-chain` blocks any AI output not cleared by human review from reaching client-facing document generation.

**Human-in-the-loop:** Covenant Policy evaluates every agent recommendation against role, org context, and regulatory constraints. If approval is required, the action enters a queue. The agent cannot proceed without an explicit `approved` status from an authorized human reviewer.

**Closed-loop learning:** The Outcome Graph records the result of every governed decision. This data calibrates future AI confidence scores and Monte Carlo simulations — ensuring the AI gets more accurate with real outcomes, not just more frequent.

**Model transparency:** Multi-provider AI stack — OpenAI, Anthropic (Claude), and Google Gemini, accessed via Replit AI proxy. No single "primary" model; model selection is agent-type-specific and context-dependent. The active model provider and version are always disclosed in the Proof Chain entry for every AI-generated recommendation.

---

## Section 3: Access Control

See [ACCESS-CONTROL-MATRIX.md](ACCESS-CONTROL-MATRIX.md) for the complete per-artifact and per-route access matrix.

### Role Summary

| Role | Level | Description |
|------|-------|-------------|
| `founder_admin` | Platform | Founder only — full access |
| `platform_admin` | Platform | Platform administration |
| `operator` | Org | Standard operations |
| `ops_manager` | Org | Operations management |
| `analyst` | Org | Read-only analytical access |
| `executive_viewer` | Org | Executive read-only |
| `sales_delivery_user` | Org | Sales and delivery |
| `maritime_ops_user` | Org | Maritime-specific |
| `service_coordinator` | Org | Service coordination |
| `pilot_customer_user` | Org | Early access / pilot |
| `anonymous_visitor` | Platform | No platform access |

### Enterprise Provisioning

SCIM 2.0 is implemented for automated user lifecycle management:
- Azure AD integration for SSO + automated user provisioning
- Role mapping from Azure AD groups to platform roles
- Automated deprovisioning on user offboarding
- Audit log entry for every provisioning action

---

## Section 4: Data Handling

| Document | Summary |
|----------|---------|
| [DATA-RETENTION.md](DATA-RETENTION.md) | Retention periods, deletion procedures, legal holds |
| [docs/DATA_CLASSIFICATION.md](docs/DATA_CLASSIFICATION.md) | Data sensitivity tiers |
| [docs/THIRD_PARTY_REGISTER.md](docs/THIRD_PARTY_REGISTER.md) | All third-party services and their data access |
| [docs/trust/privacy-boundaries.md](docs/trust/privacy-boundaries.md) | Data privacy model and jurisdictional commitments |
| [docs/LOGGING_AND_RETENTION.md](docs/LOGGING_AND_RETENTION.md) | What is logged, for how long, and how it is protected |
| [docs/ENVIRONMENT_SEPARATION.md](docs/ENVIRONMENT_SEPARATION.md) | Dev/staging/production isolation |
| [docs/DEPENDENCY_POLICY.md](docs/DEPENDENCY_POLICY.md) | Package management and vetting policy |

### Shared Responsibility

See [SHARED_RESPONSIBILITY_MODEL.md](SHARED_RESPONSIBILITY_MODEL.md) for the clear delineation of what SZL Holdings is responsible for versus what the customer organization is responsible for, covering infrastructure, identity, access control, data, AI governance, and compliance.

### Data Privacy

- **GDPR:** Privacy framework in place. Data subject rights requests: support@szlholdings.com
- **CCPA:** Privacy framework in place. California resident requests honored within 45 days
- **Data residency:** Primary US (Azure East US 2). EU deployment available via contract
- See [PRIVACY_OVERVIEW.md](PRIVACY_OVERVIEW.md) for a full privacy overview covering data collection, rights requests, sub-processors, AI and privacy, and breach notification.

---

## Section 5: Operational Trust

| Document | Summary |
|----------|---------|
| [SUPPORT_OPERATIONS.md](SUPPORT_OPERATIONS.md) | Support channels, tiers, triage workflow, SLAs, escalation path, and response templates |
| [INCIDENT_COMMAND_PLAYBOOK.md](INCIDENT_COMMAND_PLAYBOOK.md) | Full incident command lifecycle: detection, declaration, response, communication, post-mortem |
| [SEVERITY_MODEL.md](SEVERITY_MODEL.md) | P0–P3 severity definitions, response targets, escalation, and classification decision tree |
| [CUSTOMER_ESCALATION_MATRIX.md](CUSTOMER_ESCALATION_MATRIX.md) | Escalation paths by issue type: outage, breach, access issue, feature request, billing |
| [STATUSPAGE_PLAN.md](STATUSPAGE_PLAN.md) | Status page implementation plan, component monitoring, incident update templates |
| [RUNBOOK_COMMON_FAILURES.md](RUNBOOK_COMMON_FAILURES.md) | Step-by-step runbooks for 10 common failure scenarios |
| [SUPPORT_HANDOFF_GUIDE.md](SUPPORT_HANDOFF_GUIDE.md) | Incident Commander transfer, support ticket handoff, end-of-day procedures |
| [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md) | Incident handling procedures (legacy reference) |
| [INCIDENT_SEVERITY_MATRIX.md](INCIDENT_SEVERITY_MATRIX.md) | Incident classification matrix (legacy reference; superseded by SEVERITY_MODEL.md) |
| [BACKUP-RESTORE.md](BACKUP-RESTORE.md) | Buyer-facing backup & restore commitments — RPO/RTO targets, restore drill cadence, data residency |
| [ops/infra/recovery-and-backup-model.md](ops/infra/recovery-and-backup-model.md) | Backup model detail |
| [OPERATIONS-RUNBOOK.md](OPERATIONS-RUNBOOK.md) | Operational procedures and failure modes |
| [docs/trust/deployment-model.md](docs/trust/deployment-model.md) | Infrastructure and deployment approach |

### Operational Commitments

| Metric | Target |
|--------|--------|
| API availability | 99.5% (target at GA) |
| p95 API latency | < 500ms |
| RTO (recovery time) | 4 hours |
| RPO (recovery point) | 1 hour |
| Security acknowledgement | 48 hours |
| P0 incident response | < 1 hour |

---

## Section 6: Trust UI Surfaces

Live trust surfaces in each product application:

| Product | Trust Center Page | Key Features |
|---------|------------------|-------------|
| Aegis | `/aegis/trust-provenance` | Proof chains, policy governance, decision audit trail, incident simulation cockpit |
| Terra | `/terra/trust-provenance` | AI valuation provenance, deal policy governance, simulation cockpit |
| Vessels | `/vessels/trust-provenance` | Sanctions assessment proofs, voyage P&L simulation, compliance audit trail |

Solution-specific trust pages (public):

| Page | URL |
|------|-----|
| Aegis Trust | `/solutions/aegis/trust` |
| Vessels Trust | `/solutions/vessels/trust` |
| Terra Trust | `/solutions/terra/trust` |
| PRISM Counsel Trust | `/solutions/prism-counsel/trust` |
| Lyte Trust | `/solutions/lyte/trust` |

### Shared Trust UI Components

All trust surfaces use reusable React components from `lib/shared-ui`:

| Component | Purpose |
|-----------|---------|
| `ProofPanel` | Renders proof chain metadata, source lineage, confidence, review state |
| `PolicyResult` | Shows policy evaluation results, escalation paths, approval history |
| `SimulationCockpit` | Decision cockpit with best/base/worst ranges, sensitivity analysis |
| `AdminAuditTrail` | Immutable decision timeline with filtering, search, and hash verification |

---

## Section 7: Certifications and Standards (Target)

| Standard | Status | Target |
|----------|--------|--------|
| SOC 2 Type II | **Audit engagement signed (A-LIGN, 2026-04-19) — observation period 2026-05-01 → 2026-10-31** | Type I bridge report 2026-07-31; Type II report 2027-01-31 |
| ISO 27001 | Not yet initiated | Phase 3 |
| GDPR Compliance | Privacy framework in place | Ongoing |
| CCPA Compliance | Privacy framework in place | Ongoing |
| HIPAA Business Associate | Evaluated per contract | As customer need arises |

For the engagement scope, observation window, evidence sources, and per-criterion readiness, see [SOC2_AUDIT_ENGAGEMENT.md](SOC2_AUDIT_ENGAGEMENT.md). Enterprise evaluators may request the engagement letter and current bridge letter under NDA at security@szlholdings.com.

---

## Section 8: Diligence Documents

For enterprise evaluators completing a formal security or technical review:

| Document | Purpose |
|----------|---------|
| [TECHNICAL_DILIGENCE_PACKET.md](TECHNICAL_DILIGENCE_PACKET.md) | Single-document technical diligence reference — architecture, tenancy, governance, AI, observability, known gaps |
| [SECURITY_QUESTIONNAIRE_PACK.md](SECURITY_QUESTIONNAIRE_PACK.md) | Pre-answered responses to common enterprise security questionnaire topics |
| [SHARED_RESPONSIBILITY_MODEL.md](SHARED_RESPONSIBILITY_MODEL.md) | Platform vs customer responsibility across infrastructure, identity, data, AI, and compliance |
| [PRIVACY_OVERVIEW.md](PRIVACY_OVERVIEW.md) | Privacy framework: data collection, rights, sub-processors, AI handling, breach notification |
| [ACCESS-CONTROL-MATRIX.md](ACCESS-CONTROL-MATRIX.md) | Full RBAC and permission documentation |
| [SECURITY-CHECKLIST.md](SECURITY-CHECKLIST.md) | Security controls mapped to implementation |
| [KNOWN-GAPS.md](KNOWN-GAPS.md) | Transparent gap register with severity and remediation status |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture — topology, stack, design principles |
| [DATA-MODEL.md](DATA-MODEL.md) | Database schema overview |
| [API-SPEC.md](API-SPEC.md) | API surface: routes, auth, rate limiting |
| [PROOF_AND_POLICY_MODEL.md](PROOF_AND_POLICY_MODEL.md) | Trust recording and enforcement model |

For investor diligence:

| Document | Purpose |
|----------|---------|
| [INVESTOR_NARRATIVE.md](INVESTOR_NARRATIVE.md) | Governed decision infrastructure thesis — why now, why this architecture |
| [MOAT_MAP.md](MOAT_MAP.md) | Eight structural moats with codebase evidence |
| [PRODUCT_ROADMAP.md](PRODUCT_ROADMAP.md) | 30-day and 90-day priorities |
| [docs/investor/platform-thesis.md](docs/investor/platform-thesis.md) | Platform thesis in detail |
| [docs/investor/data-room-index.md](docs/investor/data-room-index.md) | Data room index |

---

## Security Contact

**Responsible disclosure:** [security@szlholdings.com](mailto:security@szlholdings.com)  
**Subject line format:** `[SECURITY] Brief description`  
**Response commitment:** Acknowledgment within 48 hours, severity classification within 5 business days  
**Do not:** Open a public GitHub issue for security vulnerabilities  

See [SECURITY.md](SECURITY.md) for the full responsible disclosure policy.

---

*Trust Center documentation last reviewed: **2026-04-16** · Next scheduled review: **2026-07-01***
