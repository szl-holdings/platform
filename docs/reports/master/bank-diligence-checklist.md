# Bank Diligence Checklist — SZL Holdings
**Date:** April 3, 2026  
**Status:** Current  
**Audience:** Commercial banking relationships, credit facilities, institutional lenders

---

## Purpose

This document addresses the standard questions a commercial bank or institutional lender would ask during relationship establishment or credit review. All answers reflect the honest current state of the company.

---

## 1. Legal Entity and Structure

| Item | Status | Notes |
|------|--------|-------|
| Legal entity established | Yes | SZL Holdings — confirm jurisdiction with counsel |
| Parent / subsidiary structure documented | Yes | SZL Holdings → 6 operating divisions | 
| Operating agreements in place | Yes — verify with legal | Division structure documented; formal agreements recommended |
| Registered agent / business address | Confirm with legal | |
| EIN / tax registration | Confirm with finance | |
| Ownership structure | Founder-owned; no outside equity at current stage | |

---

## 2. Business Operations

| Item | Status | Notes |
|------|--------|-------|
| Active business operations | Yes | Lyte + Alloy: design-partner stage; Carlota Jo advisory: client-active |
| Revenue | Design-partner stage; pre-SaaS revenue | Advisory (Carlota Jo) revenue possible; Lyte/Alloy not yet paid |
| Client relationships | Design partners active; names available under NDA | |
| Contracts with clients | Available on request | |
| Business continuity plan | Draft; `docs/disaster-recovery.md` | |
| Insurance coverage | Recommend E&O, cyber, professional liability | Confirm with insurance broker |

---

## 3. Technology Assets

| Item | Status | Notes |
|------|--------|-------|
| Proprietary technology | Yes — 18 shared packages, AI engine, platform suite | `lib/` — all proprietary code |
| Codebase ownership | Yes — private repository | GitHub private repo under SZL Holdings |
| Third-party licenses reviewed | CI dependency-review in place | `.github/workflows/` |
| Data security posture | RBAC, JWT auth, audit logging | `lib/auth/`, `lib/audit/` |
| Vulnerability scanning | CodeQL in CI, dependency-review | `.github/workflows/security.yml` |
| Backup and disaster recovery | Documented in `docs/disaster-recovery.md` | Recommend offsite backup policy |
| Cloud infrastructure | Replit (development + hosting); recommend cloud provider for production | |

---

## 4. Financial Controls

| Item | Status | Notes |
|------|--------|-------|
| Separate business banking | Recommend if not already done | |
| Accounting software | Recommend QuickBooks or Xero | |
| Revenue recognition policy | Services: on delivery; SaaS: subscription-based | |
| Financial statements | Available on request | Management accounts at current stage |
| Burn rate documentation | Available for investor/lender conversations | |
| Accounts receivable | Minimal at this stage; consulting-type model | |

---

## 5. Intellectual Property

| Item | Status | Notes |
|------|--------|-------|
| Core IP: AI engine schemas | 9 validated schemas — proprietary | `lib/ai-engine/src/schemas/` |
| Core IP: Workflow engine | State machine, step execution engine | `lib/workflow-engine/` |
| Core IP: Shared UI system | 18 shared packages, design system | `lib/shared-ui/`, `lib/shared-ui/` |
| Trade secrets documented | Recommend formal trade secret policy | |
| Domain names registered | szlholdings.com and others — confirm registrar | |
| Trademark status | Recommend trademark search and filing | |
| Patent considerations | AI inference architecture worth IP counsel review | |

---

## 6. Compliance and Regulatory

| Item | Status | Notes |
|------|--------|-------|
| Data privacy (GDPR/CCPA) | Privacy-by-design; `lib/auth/` with consent flows | Cookie consent, session management in place |
| Financial regulations | Not currently regulated; advisory is not licensed financial advice | |
| Security compliance | SOC 2 Type II not yet certified; in roadmap | |
| AI governance policy | propose_only default; human approval required for all AI actions | `lib/ai-engine/src/` |
| Export controls | No defense-related exports at this stage | Review if Aegis is commercialized |
| Terms of service | Legal docs available on request | Recommend counsel review |

---

## 7. Key Risks Disclosed

| Risk | Mitigation |
|------|-----------|
| Pre-revenue technology company | Advisory revenue active; Lyte/Alloy entering commercial phase |
| Single founder | Documented; hire plan for engineering lead is priority |
| No E2E test suite | Playwright suite planned post-pilot |
| Tenant isolation partial | Remediation in progress |
| Technology concentration in one platform | Multi-lane architecture reduces lock-in |

---

## Documentation Available for Lenders

| Document | Location |
|----------|---------|
| Platform architecture brief | `docs/architecture.md` |
| Executive audit summary | `docs/reports/master/executive-audit-summary.md` |
| Production readiness scorecard | `docs/reports/master/production-readiness-scorecard.md` |
| Investor narrative | `docs/investor-narrative.md` |
| Trust center documentation | `docs/trust-center.md` |
| Risk register | `docs/reports/master/02-risk-register.md` |

---

*See also: [investor-confidence-checklist.md](investor-confidence-checklist.md) · [executive-audit-summary.md](executive-audit-summary.md)*
