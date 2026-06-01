# Technical Demo Script — SZL Holdings

**Version:** 1.0 · **Last updated:** April 2026
**Audience:** Demo operator delivering to CISO, head of platform engineering, head of compliance, security architect
**Length:** 60 minutes (45 min demo + 15 min Q&A)
**Companion docs:** [DEMO_STRATEGY.md](demo-strategy.md) · [TECHNICAL_DILIGENCE_PACKET.md](../investor/technical-diligence-packet.md) · [TRUST_CENTER_INDEX.md](../security/trust-center-index.md)

---

## Audience Profile

The technical buyer needs to answer one question to their leadership: *can we deploy this safely?*

They will not be impressed by UI polish. They will press on tenancy, identity, audit, AI governance, encryption, deployment topology, secrets, observability, and incident response. If we are honest about what is real and what is roadmap, we win them. If we hand-wave, we lose them.

---

## What This Demo Must Deliver

| Output | Definition |
|--------|-----------|
| Architecture clarity | They can sketch the platform on a whiteboard after the call |
| Governance proof | They saw the proof chain, the policy engine, the audit export |
| Identity confidence | They understood the 11-role RBAC and tenant isolation model |
| Diligence opened | They left with the diligence packet and a known-gaps document |
| Roadmap honesty | They know what is missing and when it is planned |

---

## Pre-Demo Setup

| Tab | URL | State |
|-----|-----|-------|
| Trust Center | `/trust` | Open |
| Architecture diagram | [architecture.md](../architecture/architecture.md) rendered | Pinned |
| Access Control Matrix | [ACCESS-CONTROL-MATRIX.md](../security/access-control-matrix.md) | Pinned |
| Proof Chain viewer | Linked | Showing today's chain |
| Covenant Policy admin | `/admin/covenant-policy` | Showing template list |
| Audit export tool | `/admin/audit-export` | Ready |
| Known Gaps | [KNOWN-GAPS.md](../operations/known-gaps.md) | Pinned |
| Diligence packet | [TECHNICAL_DILIGENCE_PACKET.md](../investor/technical-diligence-packet.md) | Ready to send |

Pre-flight: confirm a recent OTEL trace, confirm tenant isolation behavior with a test query, confirm the audit export download works.

---

## Script

### 0:00 — Open with the architecture (10 min)

Walk the architecture diagram from [architecture.md](../architecture/architecture.md). Cover:

- The six primitives: Event Fabric (Prism Bus), Outcome Graph, Proof Chain, Covenant Policy, Monte Carlo, Workflow Engine
- The two execution surfaces: Lyte (operator), CORTEX (mobile)
- Alloy as the workflow runtime
- Domain packs as entitlements (Aegis, Vessels, Terra, PRISM Counsel, Carlota Jo)
- The API server and the shared PostgreSQL layer
- Authentication: OIDC primary, password fallback
- Tenant isolation: query-layer `org_id` scoping; bypass requires `super_admin` role with audit logging

Pause for questions. Do not move forward until they have the model.

### 10:00 — Tenant isolation walkthrough (10 min)

Walk [TENANCY-MODEL.md](../architecture/tenancy-model.md).

> "Every database query that touches tenant data includes `WHERE org_id = ?`. The `org_id` is injected from the authenticated session — it is not supplied by the caller. If the session has no org context, the query fails with a 403, not with a default."

Show:

- The `tenantScope` middleware in code (briefly)
- The MCP gateway tenant injection — callers cannot supply `orgId` as a tool parameter
- The shared Drizzle query builders that enforce scoping
- The WebSocket channel naming convention with `org_id` prefix and HMAC-signed tickets

Run a live query in the read-only DB console showing data scoped to a specific tenant.

### 20:00 — Identity and RBAC (8 min)

Walk [ACCESS-CONTROL-MATRIX.md](../security/access-control-matrix.md).

> "11 platform roles. 4 org membership roles. CMS / content roles for the corporate platform. Every API route is access-controlled. The route inventory is published."

Show the per-route classification: PUBLIC, DEMO, PRIVATE, INTERNAL. Show the `globalAuthEnforcer` that rejects unauthenticated requests to non-allowlisted paths with 401.

Show the SCIM 2.0 connector path. Show the Azure AD SSO posture.

### 28:00 — AI governance (10 min)

Walk [AI_GOVERNANCE.md](../architecture/ai-governance.md). Cover:

- Multi-provider AI stack: OpenAI, Anthropic, Gemini (and per-customer model allow-list at Enterprise)
- Every AI output carries a Proof Chain entry with model identity, source citations, confidence score, and review status
- Covenant Policy enforces approval gates at the platform layer; AI cannot execute consequential actions without an approval recorded in the Proof Chain
- AI evaluation traces are stored with `org_id` and only returned to that tenant's authorized users
- The Outcome Graph closes the loop — agent acceptance rates, override frequencies, achievement rates are tracked per agent

Show a live AI recommendation, the proof chain attached, and the policy decision result.

### 38:00 — Audit export (5 min)

Open the audit export tool. Filter by date range and actor. Export. Open the resulting file.

> "Every state-changing action is here. Actor, action, resource, timestamp. The export is org-scoped. You can give this to your auditor on day one."

### 43:00 — Incident response and known gaps (7 min)

Open [INCIDENT_RESPONSE.md](../operations/incident-response.md). Walk the severity matrix and the response timeline.

Open [KNOWN-GAPS.md](../operations/known-gaps.md). Walk the open P1 and P2 items.

> "Here is what is open. SAST not yet in CI. Dependency review not yet in CI. OTEL exporter not yet wired to production. SLI/SLOs not yet defined. We name them, we own them, we have a sprint plan. If we hide them from you now, we will hide them from you after you sign. We don't operate that way."

### 50:00 — Trust Center handoff (5 min)

Walk the Trust Center index. Show:

- [SECURITY.md](../../SECURITY.md)
- [TENANCY-MODEL.md](../architecture/tenancy-model.md)
- [ACCESS-CONTROL-MATRIX.md](../security/access-control-matrix.md)
- [DATA-RETENTION.md](../security/data-retention.md)
- [BACKUP-RESTORE.md](../operations/backup-restore.md)
- [INCIDENT_RESPONSE.md](../operations/incident-response.md)
- [AI_GOVERNANCE.md](../architecture/ai-governance.md)
- [TECHNICAL_DILIGENCE_PACKET.md](../investor/technical-diligence-packet.md)

> "Send this to your team. They can answer most diligence questions without us in the room. We will set up a follow-up call once they have the questions only we can answer."

### 55:00 — The ask

> "Two things I want to leave you with. One — the diligence packet is yours; review with your team. Two — if you want to test the platform against your data and your controls, we run a 90-day proof of value with a defined success metric and a written exit. What feels right?"

---

## Q&A — Common Technical Questions

| Question | Crisp answer |
|----------|--------------|
| Is the audit truly immutable? | The Proof Chain entries are append-only; deletion requires a `super_admin` role with audit logging of the deletion event itself. We do not claim cryptographic anchoring beyond hash chaining today; that is roadmap. |
| What about MFA? | Not yet implemented at the platform level (KG026). Customers using Azure AD SSO inherit MFA from their IdP. Native MFA is on the Sprint 4 roadmap. |
| What about data residency? | US (Replit) for Starter and Pro; Azure region of customer's choice for Enterprise at GA. Sovereign / air-gapped is FY27 roadmap. |
| What about SOC 2? | Aligned to controls; certification is on the post-revenue roadmap. Documentation supports the evidence cycle. |
| How are secrets managed? | All secrets via environment variables. No secrets in source. Secret scanning is being added to CI as part of the open KG011/KG012 work. See [SECRETS_SETUP.md](../security/secrets-setup.md). |
| What about the AI eval pipeline? | Trace capture lives in `lib/ai-engine/src/evals/trace-capture.ts`. Tenant-scoped retrieval; org-scoped dashboard. See [AI_GOVERNANCE.md](../architecture/ai-governance.md). |
| Can we BYO AI model? | Yes at Enterprise; allow-list managed by the customer. |
| Webhook SSRF? | Outgoing webhook URL validation is open (KG020b); on Sprint 3. We disclose this. |
| What about virus scanning on uploads? | Open (KG020c); on Sprint 4. We disclose this. |
| What is your DR posture? | Nightly snapshots, cross-region copy at Pro and Enterprise. See [BACKUP-RESTORE.md](../operations/backup-restore.md). |
| What does production deployment look like? | See [PLATFORM_EDITIONS.md](../product/platform-editions.md) for hosting topology by edition. Production slot for the first commercial tenants is being stood up; status is tracked honestly in the operations docs. |

---

## What Not to Do in the Technical Demo

- Do not claim "non-bypassable" or "architecturally impossible" — use "enforced at [layer] through [mechanism]; bypass requires explicit, attributed override record."
- Do not hide known gaps — the [KNOWN-GAPS.md](../operations/known-gaps.md) file is a deliverable, not a risk
- Do not over-claim certifications we don't hold
- Do not improvise on AI governance; walk [AI_GOVERNANCE.md](../architecture/ai-governance.md)
- Do not show secrets, keys, or credentials on screen
- Do not skip the gaps walk — technical buyers respect honesty and lose trust at any sign of evasion

---

## Post-Demo Actions

| Action | Owner | Due |
|--------|-------|-----|
| Send recording + diligence packet | Demo operator | Same business day |
| Send Trust Center URL with relevant deep links | Demo operator | Same business day |
| Send Known Gaps document | Demo operator | Same business day |
| Schedule technical Q&A round 2 | Demo operator | Within 5 business days |
| Trigger proof-of-value scoping if requested | Founder | Within 3 business days |

---

## Related Documents

| Document | Path |
|----------|------|
| Demo strategy | [DEMO_STRATEGY.md](demo-strategy.md) |
| Executive demo | [EXECUTIVE_DEMO.md](executive-demo.md) |
| Operator demo | [OPERATOR_DEMO.md](operator-demo.md) |
| Technical diligence packet | [TECHNICAL_DILIGENCE_PACKET.md](../investor/technical-diligence-packet.md) |
| Trust Center index | [TRUST_CENTER_INDEX.md](../security/trust-center-index.md) |
| Security policy | [SECURITY.md](../../SECURITY.md) |
| Tenancy model | [TENANCY-MODEL.md](../architecture/tenancy-model.md) |
| Access control matrix | [ACCESS-CONTROL-MATRIX.md](../security/access-control-matrix.md) |
| Data retention | [DATA-RETENTION.md](../security/data-retention.md) |
| Backup & restore | [BACKUP-RESTORE.md](../operations/backup-restore.md) |
| Incident response | [INCIDENT_RESPONSE.md](../operations/incident-response.md) |
| AI governance | [AI_GOVERNANCE.md](../architecture/ai-governance.md) |
| Known gaps | [KNOWN-GAPS.md](../operations/known-gaps.md) |
