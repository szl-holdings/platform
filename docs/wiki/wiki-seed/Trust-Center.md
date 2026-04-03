# Trust Center

An AI-assisted operations platform carries a distinct trust burden: if the AI layer fails, produces bad recommendations, or executes without authorization, the consequences are operational, financial, or regulatory. The SZL Holdings platform is engineered to make that failure mode visible and controllable.

---

## Trust Principles

**1. Human-in-the-loop is not a feature — it is a structural constraint.**
Advisory agents cannot execute consequential actions without explicit human confirmation. This is enforced at the Alloy workflow layer, not the UI. The AI engine does not have direct access to action execution primitives.

**2. Evidence-backed decisions.**
All AI recommendations include source citations, confidence scores, and retrieval provenance. No opaque outputs. If the platform cannot explain a recommendation, it does not present it.

**3. Immutable audit trail.**
Every action, approval, and decision is logged with actor attribution, role context, and timestamp. Audit records are append-only. No retrospective modification.

**4. Explicit failure over silent fallback.**
When the platform cannot resolve a signal or complete an action, it surfaces the failure explicitly. Silent degradation is not acceptable in an operations-critical system.

---

## Human-in-the-Loop Architecture

```
AI Recommendation (Compass / Sentinel / Helmsman)
        │
        ▼
  Alloy Routing
        │
   ┌────┴──────────────────────────┐
   ▼                               ▼
Auto-Execute Policy          Approval Gate Required
(policy-approved actions)    (consequential actions)
   │                               │
   │                        Human Confirms
   │                               │
   └───────────────┬───────────────┘
                   ▼
           Action Execution
                   │
                   ▼
          Audit Event Generated
```

---

## Access Control

**RBAC:** 11 roles with org-scoped tenant isolation. Every API route and WebSocket channel is access-controlled.

**SCIM 2.0:** Automated user provisioning and deprovisioning via enterprise IdP. User access is revoked immediately on deprovisioning.

**Multi-tenancy:** All database queries include org_id scoping. Cross-tenant data access is architecturally prevented.

---

## Compliance Templates

Alloy includes pre-configured compliance workflow templates for regulated industries:

| Industry | Template |
|----------|----------|
| Financial services | 4-eye approval, trade execution, audit documentation |
| Healthcare | HIPAA-aligned access controls, PHI handling policies |
| Security operations | SOC workflow governance, escalation chains |
| Government | FedRAMP-aligned controls (Aegis, Phase 2 roadmap) |

---

## Data Handling

**In transit:** TLS 1.3 for all connections. HMAC-signed WebSocket tickets.

**At rest:** PostgreSQL encryption at rest on managed deployments.

**Retention:** Audit records are retained indefinitely (configurable per org). Operational data retention is configurable by enterprise clients.

**Residency:** Production deployment on Azure (configurable region). On-premises and private cloud deployment available for enterprise clients.

---

## Reporting and Visibility

Enterprise clients receive:
- Audit log export (JSON, CSV)
- Role activity reports
- AI recommendation review logs with approval/rejection history
- Compliance posture dashboard (Alloy)

---

## Security Disclosure

Vulnerabilities are handled via coordinated responsible disclosure.

**Contact:** [security@szlholdings.com](mailto:security@szlholdings.com)

See [SECURITY.md](../../SECURITY.md) for the full policy.

---

## Trust Assessment

For enterprise trust assessments, security review packages, or compliance documentation:

**Contact:** [inquiries@szlholdings.com](mailto:inquiries@szlholdings.com)

---

## Further Reference

- [Trust Center doc](../../docs/trust/trust-center.md)
- [[Security-Posture]]
- [[Deployment-Model]]
- [Privacy Boundaries](../../docs/trust/privacy-boundaries.md)
