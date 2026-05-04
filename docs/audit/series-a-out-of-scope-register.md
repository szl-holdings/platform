# growth capital Out-of-Scope Register

**Date:** April 16, 2026  
**Scope:** Items explicitly evaluated and excluded from the growth capital Wave 1–2 audit scope  
**Purpose:** Prevent scope creep and provide a clear record of what is intentionally deferred

---

## Out-of-Scope Items

### OOS-001 — Code-Level Refactoring of Apps or Libraries

**Decision:** Out of scope for Waves 1–2.  
**Reason:** Waves 1–2 are strictly inventory, documentation, and secrets hardening. No code changes to app logic, component structure, or library internals.  
**Deferred to:** Wave 3–4 (Surface Area Reduction) and later waves.

---

### OOS-002 — Demo / Production Mode Separation at Runtime Level

**Decision:** Out of scope for Waves 1–2.  
**Reason:** Separating demo and production modes at the code level (environment-gated mock data, feature flags, demo org isolation) requires runtime code changes. This is Wave 3–4 work.  
**Deferred to:** Wave 3–4.

---

### OOS-003 — Testing Framework Changes

**Decision:** Out of scope for Waves 1–2.  
**Reason:** Adding new test files, expanding E2E coverage, or changing test infrastructure requires code changes and is not documentation/inventory work.  
**Deferred to:** Wave 5–6 (Testing Framework & Observability).

---

### OOS-004 — Frontend UI Cleanup

**Decision:** Out of scope for Waves 1–2.  
**Reason:** UI refactors, design system consolidation, and visual improvements are not security or inventory concerns.  
**Deferred to:** Later waves (Wave 7+).

---

### OOS-005 — Backend Route Hardening (Zod Coverage Expansion)

**Decision:** Out of scope for Waves 1–2 (documentation only).  
**Reason:** While GAP-001 and GAP-002 document the Zod validation gap and route security matrix gap, actually expanding Zod coverage to additional routes requires code changes. Waves 1–2 document the gap; Wave 3–4 closes it.  
**Deferred to:** Wave 3–4.  
**Note:** This gap is tracked as GAP-001 and GAP-002 in `series-a-gap-register.md`.

---

### OOS-006 — Azure Feature Integration Implementation

**Decision:** Out of scope.  
**Reason:** Azure AD SSO, Power BI embed, and SCIM provisioning are enterprise feature integrations, not security gaps. They work correctly in their current state (functional alpha with demo data). Activating them requires enterprise tenant admin consent, not code changes.  
**Status:** Intentionally deferred until first enterprise tenant onboarding.

---

### OOS-007 — Custom Domain DNS Configuration

**Decision:** Out of scope.  
**Reason:** DNS configuration for `szlholdings.com` is an infrastructure operation, not a security or audit task.  
**Deferred to:** Infrastructure team when custom domain launch is scheduled.

---

### OOS-008 — Stripe Live Key Configuration

**Decision:** Out of scope.  
**Reason:** Configuring live Stripe keys is a business/finance decision, not an audit remediation. The integration is fully implemented and ready for a live key.  
**Deferred to:** Founder / Finance when first billing is required.

---

### OOS-009 — Mobile App Store Publishing

**Decision:** Out of scope.  
**Reason:** Publishing CORTEX Mobile to the App Store or Google Play is a separate product milestone, not part of this audit.  
**Deferred to:** Mobile team milestone.

---

### OOS-010 — Database Schema Review for 569 Tables

**Decision:** Out of scope for Waves 1–2.  
**Reason:** A full schema audit (relationships, normalization, performance) is a significant technical undertaking requiring hands-on database analysis. Not a security or inventory concern in the growth capital context.  
**Deferred to:** Post-growth capital technical deep-dive if required by investors.

---

### OOS-011 — Penetration Testing

**Decision:** Out of scope for Waves 1–2.  
**Reason:** External penetration testing is not a documentation/inventory task. It is recommended before the first paying tenant but requires a separate engagement.  
**Deferred to:** Before first enterprise customer handles sensitive data.

---

### OOS-012 — Content / Copy Review of All App Pages

**Decision:** Out of scope for Waves 1–2.  
**Reason:** Reviewing all app page copy for accuracy, tone, and investor readiness is editorial work, not a security audit task. Some investor-facing content notes were made in `omega-audit-findings.md`.  
**Deferred to:** Product / Marketing.

---

### OOS-013 — `lib/integrations/*` Package Audit

**Decision:** Out of scope for Waves 1–2 (no dedicated subdirectory — note: these packages are under `lib/` but referenced in pnpm-workspace.yaml as `lib/integrations/*`).  
**Reason:** These are third-party integration adapters. A full review of each adapter's implementation is a code-level task deferred to later waves.  
**Deferred to:** Wave 3–4.

---

### OOS-014 — Performance / Lighthouse Optimization

**Decision:** Out of scope.  
**Reason:** Performance optimization is not a security audit concern.  
**Deferred to:** Pre-launch performance pass.

---

### OOS-015 — Incident Response Simulation / Runbook Testing

**Decision:** Out of scope.  
**Reason:** Testing incident response runbooks (OPERATIONS-RUNBOOK.md, RUNBOOK_ROLLBACK.md) requires a tabletop exercise or simulation, not documentation work.  
**Deferred to:** Before first production customer.

---

## Items Evaluated and Confirmed Not a Gap

These items were initially flagged as potential concerns but were confirmed clean during the audit. They are recorded here to prevent re-investigation:

| Item | Evaluated | Verdict |
|------|-----------|---------|
| Real secrets in source-controlled files | April 16, 2026 | Clean — no real secrets found |
| VAPID_PUBLIC_KEY in `.replit` | April 16, 2026 | Not a secret — public key is intentionally distributable |
| `.env.example` credential values | April 16, 2026 | Clean — all safe placeholder patterns |
| GitHub Actions SHA pinning | April 16, 2026 | Clean — all 13 workflows fully pinned |
| Workflow permissions | April 16, 2026 | Clean — all workflows at least-privilege |
| maven/nuget/rubygems publish workflows | April 16, 2026 | Do not exist — no action needed |
| Demo credentials embedded in `replit.md` | April 16, 2026 | Clean — only references to SECRETS_SETUP.md |
| Deployment doctrine ambiguity | April 16, 2026 | Resolved — canonical-deployment-model.md is authoritative |

---

_This register is maintained by Platform Engineering. Add items here when they are explicitly deferred from audit scope rather than left undocumented._
