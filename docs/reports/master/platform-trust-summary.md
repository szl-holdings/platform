# Platform Trust Summary — SZL Holdings
**Date:** April 3, 2026  
**Status:** Current  
**Audience:** Internal leadership, design partners, investors

---

## What This Document Is

A single-page summary of where trust is visible, where it is still missing, and what evidence backs every claim in this platform. Written for someone who wants to verify, not just believe.

---

## Trust Principles We Operate By

1. **Explicit data state** — every surface that shows data marks whether it is live, seeded, or simulated. No invisible mocking.
2. **Audit on every decision** — every AI action and every approval event is logged immutably with actor, timestamp, and rationale.
3. **Ownership visible at all times** — every operational entity shows who owns it. "Unassigned" is a valid and explicit state.
4. **Maturity honesty** — every platform is labeled at its actual stage (Design-partner, Prototype, Expansion lane). No premature production claims.
5. **Evidence before claim** — every external claim in marketing, investor, and partner materials has a corresponding evidence source in this document set.

---

## Trust Layer in the Product

### Reusable Trust UI Components (in @workspace/shared-ui)

| Component | Purpose | Adoption |
|-----------|---------|----------|
| `DataStateBadge` / `DataStateBanner` | Marks data as Live / Seeded / Simulated | Available; partial adoption |
| `OperationalStatusBadge` | Explicit lifecycle state at a glance | Lyte + Alloy: full; Terra, Aegis, Vessels: partial |
| `OperationalOwnerChip` | Who owns this entity, always visible | Lyte: integrated; others: partial |
| `OperationalEvidencePanel` | Shows evidence and rationale behind decisions | Alloy decisions: full; domain surfaces: partial |
| `OperationalAuditTimeline` | Chronological history of all entity state changes | Alloy: full; domain surfaces: partial |
| `OperationalEscalationPanel` | Shows active escalation path and target | Lyte: integrated; others: roadmap |
| `OperationalDetailPane` | Canonical detail view with all trust fields | Lyte: full; others: partial |
| `OperationalQueueRow` | Queue row with status, risk, owner, next action | Lyte: full; others: partial |
| `ApprovalBadge` / `OperationalApprovalBadge` | Approval state visible without opening detail | Lyte/Alloy: integrated |
| `AuditTrailDrawer` | Slide-in audit history for any entity | Alloy decision cards: full |
| `EvidencePanel` (Alloy) | Alloy-specific evidence with confidence scores | Alloy: full |
| `ConfidenceBand` | Visual confidence indicator for AI outputs | Alloy: full |
| `DemoModeProvider` | App-wide demo/live mode indicator and switcher | Available across apps |
| `EnvironmentLabel` | Shows dev/staging/prod environment | Lyte: integrated |

### Trust Patterns Required per Surface

Each operational surface must display:

1. **Data freshness badge** — live indicator or simulation warning
2. **Owner chip** — assigned owner or "Unassigned"
3. **Status lifecycle** — current operational status
4. **Next action** — what needs to happen and who needs to do it
5. **Evidence / rationale** — why the system made this decision
6. **Role-aware controls** — buttons and actions gated by user role
7. **Escalation path** — who gets notified if this is not resolved
8. **History / timeline** — complete audit of all state changes
9. **Export / report controls** — ability to export the entity record

---

## Hype Copy Audit (Completed April 2026)

The following claims were removed or tightened because they were not backed by operational reality:

| App | Removed / Tightened Claim | Replacement |
|-----|--------------------------|-------------|
| SZL Holdings | "$180M in assets under influence" | Removed — no live AUM |
| SZL Holdings | "6 platforms live" | "Design-partner stage — Lyte + Alloy are the active wedge" |
| SZL Holdings | "3 continents" | Removed from hero — kept in context sections |
| Carlota Jo | "94% repeat client rate" | Removed — no verified tracking |
| Carlota Jo | "14+ countries" | "4 Continents" (accurate) |
| Carlota Jo | "Institutional-grade AI platform" | "Advisory that shows its reasoning" |
| All expansion apps | Marketing-style "live" language | "Prototype" / "Expansion lane" badges added |

---

## Evidence Backing Our Real Claims

| Claim | Evidence Source |
|-------|----------------|
| AI decisions are traceable | `lib/ai-engine/` — 9 validated decision schemas with audit logging |
| Evidence-backed retrieval | `lib/ai-engine/src/retrieval/alloy-retrieval.ts` — hybrid search, BGE embeddings, reranking |
| Policy-gated execution | `lib/ai-engine/src/tools/` — 9 tools, propose_only default, approval gates |
| Immutable audit trail | `lib/audit/` — all decisions, approvals, and state changes persisted |
| 1,166 API endpoints | `artifacts/api-server/` — auto-counted, auth coverage documented |
| Live data integrations | Census Bureau API, HUD API, FEMA NRI, NYC Open Data — all in Terra |
| RBAC and auth | `lib/auth/` — JWT, session, RBAC middleware across all apps |
| Human-in-the-loop | Approval center pages in Lyte, HITL gates in Alloy schema |
| Real workflow engine | `lib/workflow-engine/` — state machine, step execution, conditions |

---

## Current Trust Gaps (Honest Accounting)

| Gap | Risk Level | Mitigation |
|-----|-----------|------------|
| DataStateBadge not shown on all seeded data surfaces | High | Required on all Aegis, Vessels, Terra queue pages |
| Cross-tenant retrieval isolation not enforced | High | tenantId must be added to all Alloy retrieval queries |
| Many Aegis pages are decorative (no live data) | Medium | Pages labeled as "Expansion / Roadmap" in design |
| No E2E test suite | Medium | Playwright suite planned post-pilot |
| Tenant isolation UI not visible | Medium | TenantBrandProvider exists but not wired everywhere |

---

## Maturity Labels (Per App)

| App | Honest Stage | Meaning |
|-----|-------------|---------|
| Lyte | Design-partner | Core workflows operational; not broadly available |
| Alloy | Design-partner | AI engine operational; production hardening in progress |
| SZL Holdings | Live | Web presence and investor content live |
| Carlota Jo | Live — accepting clients | Advisory practice operational |
| Aegis | Prototype | Architecture built; not active go-to-market |
| Terra | Prototype | Architecture built; not active go-to-market |
| Vessels | Prototype | Architecture built; not active go-to-market |
| Mobile Suite | Internal | All 7 apps operational for internal use |

---

## Trust Verification Checklist (For Reviewers)

To verify the platform's trust claims, reviewers can:

- [ ] Open Lyte → create a signal → observe audit trail update automatically
- [ ] Open Alloy decision card → see evidence panel and confidence scores
- [ ] Check DataStateBadge presence on any seeded data surface
- [ ] Review `lib/audit/` for immutable log persistence
- [ ] Review `lib/ai-engine/src/schemas/` for all 9 decision schemas
- [ ] Open GitHub → CI workflows → confirm CodeQL, dependency-review, release workflows
- [ ] Review `docs/reports/master/claim-vs-capability-audit.md` for full claim inventory

---

*See also: [design-standard.md](design-standard.md) · [claim-vs-capability-audit.md](claim-vs-capability-audit.md) · [executive-audit-summary.md](executive-audit-summary.md)*
