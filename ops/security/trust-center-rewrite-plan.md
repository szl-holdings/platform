# Trust Center Rewrite Plan

Last updated: 2026-04-16

## Problem Statement

The current trust center contains some claims that require tightening:
- "SOC 2 Type II" certification is listed without the "in progress" qualifier in some places
- "ISO 27001 aligned" vs "certified" needs consistent language
- Some feature claims need to be tied to verifiable implementation

## Audit Findings

### Claims That Need to Change

| Current Claim | Issue | Corrected Language |
|--------------|-------|-------------------|
| "SOC 2 Type II certified" (if present) | Not certified yet | "SOC 2 Type II audit in progress; target Q3 2026" |
| "ISO 27001 certified" (if present) | Not certified | "ISO 27001 aligned architecture; formal certification on 2027 roadmap" |
| Any claim about "zero breaches" | Unverifiable | Remove or replace with specific hardening claims |
| Uptime guarantees without SLA | Unverifiable | Replace with SLO targets from `/ops/observability/slo-sli-catalog.md` |

### Claims That Are Accurate and Should Be Retained

| Claim | Verification |
|-------|-------------|
| Human-in-the-loop required on all consequential actions | Enforced via `requireApproval` middleware |
| Source attribution on all AI outputs | Architecture-level requirement |
| Proof chain audit trail | Implemented in `lib/proof-chain` |
| No autonomous execution | Enforced by approval gate architecture |
| HTTPS encryption in transit | Replit proxy enforces TLS |
| AES-256-GCM field encryption | Implemented in `field-encryption.ts` |
| HttpOnly, Secure session cookies | Enforced in `session-policy.ts` |
| Rate limiting on all endpoints | Enforced in `rate-limiters.ts` |
| CORS allowlist, not wildcard | Enforced in `app.ts` |
| OWASP security headers | Helmet.js in `app.ts` |

## Trust Center Content Architecture

### Required Pages

```
/trust                          — Trust hub landing
/trust/security                 — Security architecture and controls
/trust/compliance               — Compliance status (honest, qualified)
/trust/ai-governance            — AI trust, HITL, proof chain
/trust/architecture             — Technical architecture overview
/trust/approvals                — Approval workflow transparency
/trust/exports                  — Audit export capabilities
/trust/governance               — Governance and policy framework
```

### Per-Page Integrity Checklist

**`/trust/security`**
- [ ] Remove any "SOC 2 certified" without "in progress" qualifier
- [ ] Add link to security disclosure policy
- [ ] Add penetration testing status ("scheduled Q3 2026")
- [ ] Add bug bounty status ("planned post-SOC 2")
- [ ] Verify all listed controls have code-level implementations

**`/trust/compliance`**
- [ ] Table of frameworks with honest status column
- [ ] Add "in progress" for SOC 2 Type II
- [ ] Add "aligned" not "certified" for ISO 27001
- [ ] Add GDPR/CCPA compliance with DPA availability note
- [ ] Remove or qualify any StateRAMP claims

**`/trust/ai-governance`**
- [ ] Document HITL requirements (where enforced, which actions require approval)
- [ ] Document proof chain structure (what's logged, how long retained)
- [ ] Document AI provider agreements (no training on customer data)
- [ ] Document fallback behavior when AI is unavailable
- [ ] Document hallucination handling and confidence scoring

## Implementation Plan

### Phase 1: Audit (Week 1)
1. Read every trust center page
2. Flag any non-compliant claims against the checklist above
3. Cross-reference each claim against `artifacts/api-server/src/` to confirm implementation

### Phase 2: Rewrite (Week 2)
1. Update compliance table on `/trust/compliance` with qualified status
2. Rewrite any AI claims to be implementation-specific
3. Replace uptime guarantees with SLO targets (link to ops/observability/slo-sli-catalog.md)
4. Add penetration testing and bug bounty status

### Phase 3: Review (Week 3)
1. Legal review of all compliance claims
2. CTO sign-off on technical claims
3. Founder review of overall trust posture messaging

## Non-Negotiable Constraints

1. Never claim a certification that has not been completed and reported.
2. Use "in progress" or "planned" for anything not complete.
3. Every security control claim must be traceable to working code.
4. "Aligned" ≠ "certified" — these are different and must not be conflated.
5. "SOC 2 Type II" requires a completed audit by an accredited firm. Do not use this phrase without the status qualifier until the audit is complete.

## Admin/Internal Surface Isolation

Internal and admin surfaces must **not** appear in public navigation or the trust center:
- `/admin/*` — requires `super_admin` or `ops` role; enforced by `adminGuard` middleware
- `/kpi-dashboard`, `/forge`, `/nexus`, `/oracle`, `/control-tower`, `/analyst` — internal only
- These paths are correctly blocked in `robots.txt`; verify no links to them exist in public pages

Verify: search all public-facing page components for links to `/admin`, `/forge`, `/nexus`, `/oracle`, `/control-tower`.
