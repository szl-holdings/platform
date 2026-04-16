# Trust Center Index — SZL Holdings Platform

> Navigational index for all trust, security, governance, and compliance documentation.

See the live Trust Center at `/trust-center` on the SZL Holdings platform.

---

## Trust Documentation

| Document | Location | Audience | Summary |
|----------|----------|----------|---------|
| Trust Center Overview | [docs/trust/trust-center.md](docs/trust/trust-center.md) | All | Master trust summary |
| Security Posture | [docs/trust/security-posture.md](docs/trust/security-posture.md) | Technical | Security controls and architecture |
| Deployment Model | [docs/trust/deployment-model.md](docs/trust/deployment-model.md) | Technical | Infrastructure and deployment approach |
| Privacy Boundaries | [docs/trust/privacy-boundaries.md](docs/trust/privacy-boundaries.md) | Legal/Compliance | Data privacy model |

---

## Operational Security

| Document | Location | Summary |
|----------|----------|---------|
| Secrets Policy | [docs/SECRETS_POLICY.md](docs/SECRETS_POLICY.md) | How secrets are managed and rotated |
| Access Control | [docs/ACCESS_CONTROL.md](docs/ACCESS_CONTROL.md) | RBAC model and access management |
| Logging & Retention | [docs/LOGGING_AND_RETENTION.md](docs/LOGGING_AND_RETENTION.md) | What is logged and for how long |
| Environment Separation | [docs/ENVIRONMENT_SEPARATION.md](docs/ENVIRONMENT_SEPARATION.md) | Dev/staging/prod isolation |
| Dependency Policy | [docs/DEPENDENCY_POLICY.md](docs/DEPENDENCY_POLICY.md) | Package management and vetting |

---

## Risk & Compliance

| Document | Location | Summary |
|----------|----------|---------|
| Data Classification | [docs/DATA_CLASSIFICATION.md](docs/DATA_CLASSIFICATION.md) | Data sensitivity tiers |
| Third-Party Register | [docs/THIRD_PARTY_REGISTER.md](docs/THIRD_PARTY_REGISTER.md) | All third-party services and data access |
| Backup & Recovery | [BACKUP_AND_RECOVERY.md](BACKUP_AND_RECOVERY.md) | Backup strategy and RTO/RPO |
| Data Retention | [DATA-RETENTION.md](DATA-RETENTION.md) | Retention periods, deletion procedures, legal holds |
| Incident Severity Matrix | [INCIDENT_SEVERITY_MATRIX.md](INCIDENT_SEVERITY_MATRIX.md) | Incident classification and response |
| Incident Response | [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md) | Full incident handling procedures |

---

## Trust & Provenance UI

Live trust surfaces available in each product application:

| Product | Trust Center Page | URL | Key Features |
|---------|------------------|-----|-------------|
| Aegis | Trust & Provenance Center | `/aegis/trust-provenance` | Proof chains, policy governance, decision audit trail, incident simulation cockpit |
| Terra | Trust & Provenance Center | `/terra/trust-provenance` | AI valuation provenance, deal policy governance, deal simulation cockpit |
| Vessels | Trust & Provenance Center | `/vessels/trust-provenance` | Sanctions assessment proofs, voyage P&L simulation cockpit, compliance audit trail |

### Shared UI Components

All trust surfaces use reusable React components from `lib/shared-ui`:

| Component | Purpose | Export |
|-----------|---------|--------|
| `ProofPanel` | Renders proof chain metadata, source lineage, confidence, review state | `"inline" \| "drawer" \| "badge"` |
| `PolicyResult` | Shows policy evaluation results, escalation paths, approval history, remediation guidance | `"card" \| "inline" \| "banner"` |
| `SimulationCockpit` | Decision cockpit with best/base/worst ranges, sensitivity analysis, cost-of-waiting | Full page or embedded |
| `AdminAuditTrail` | Immutable decision timeline with filtering, search, and hash verification | Admin/operator views |

See [PROOF_AND_POLICY_MODEL.md](PROOF_AND_POLICY_MODEL.md) for component usage and integration documentation.

---

## Product-Specific Trust

| Product | Trust Page |
|---------|-----------|
| PRISM Counsel | [/solutions/prism-counsel/trust](../artifacts/szl-holdings/src/pages/solutions-prism-counsel-trust.tsx) |
| Vessels | [/solutions/vessels/trust](../artifacts/szl-holdings/src/pages/solutions-vessels-trust.tsx) |
| Terra | [/solutions/terra/trust](../artifacts/szl-holdings/src/pages/solutions-terra-trust.tsx) |
| Aegis | [/solutions/aegis/trust](../artifacts/szl-holdings/src/pages/solutions-aegis-trust.tsx) |
| Lyte | [/solutions/lyte/trust](../artifacts/szl-holdings/src/pages/solutions-lyte-trust.tsx) |

---

## AI Governance

| Topic | Coverage |
|-------|---------|
| AI agent boundaries | All AI agents are advisory only; no consequential action without human approval |
| Evidence attribution | All AI recommendations include source citations and confidence scores |
| Human-in-the-loop | Enforced at the Alloy workflow layer for all policy-controlled actions |
| Audit trail | All AI-assisted decisions generate immutable audit events |
| Model transparency | HuggingFace Inference (Qwen3-8B primary); model selection disclosed |

See [docs/trust/trust-center.md](docs/trust/trust-center.md) for the full AI governance section.

---

## Certifications & Standards (Target)

| Standard | Status | Timeline |
|----------|--------|----------|
| SOC 2 Type II | Not yet initiated | Phase 3 (post-funding) |
| ISO 27001 | Not yet initiated | Phase 3 |
| HIPAA Business Associate | Evaluated per contract | As customer need arises |
| GDPR Compliance | Privacy framework in place | Ongoing |
| CCPA Compliance | Privacy framework in place | Ongoing |

---

## Security Contact

Security disclosures: [security@szlholdings.com](mailto:security@szlholdings.com)

Response commitment: Acknowledgment within 24 hours, investigation begins immediately.

See [SECURITY.md](SECURITY.md) for responsible disclosure policy.

---

## Last Review

Trust Center documentation last reviewed: **2026-04-03**
Next scheduled review: **2026-07-01**
