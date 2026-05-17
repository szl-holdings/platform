# Command — Unified Operations: Frontend Audit

> **Task #5090 consolidation note (May 17, 2026):** This audit is historical.
> The Command operator console has been consolidated into the A11oy artifact;
> the live operator surface is now `/a11oy/command/*` (with `/command/*` kept as
> a legacy alias). The former `artifacts/command/` directory has been moved to
> `archive/command/`.


**Phase:** 2 + 10  
**Date:** April 19, 2026  
**Auditor:** growth capital Launch Readiness Program (Task #2068)

---

## Summary

| Dimension | Status |
|---|---|
| Workflow | ✅ RUNNING (port 5000) |
| Build | ✅ PASS |
| Auth model | OIDC required |
| Demo score | 9.0/10 |

---

## Screen Inventory (Key Surfaces)

| Route | Screen | CTA Wired | Data | Auth | Status |
|---|---|---|---|---|---|
| `/command/` | Overview / Command Center | ✅ | Seeded | ✅ | ✅ Working |
| `/command/signals` | Signal Feed | ✅ | Seeded | ✅ | ✅ Working |
| `/command/operations/alloy/canvas` | Workflow Canvas | ✅ | Seeded | ✅ | ✅ Working |
| `/command/operations/alloy/policy-compiler` | Policy Compiler (1252 lines) | ✅ | Seeded | ✅ | ✅ Working |
| `/command/operations/alloy/approvals` | Approval Gates | ✅ | Seeded | ✅ | ✅ Working |
| `/command/operations/agents` | Agent Monitor | ✅ | Seeded | ✅ | ✅ Working |
| `/command/governance/*` | Governance surfaces | ✅ | Seeded | ✅ | ✅ Working |
| `/command/cognitive/command-center` | Cognitive Command Center | ✅ | Seeded | ✅ | ✅ Working |
| `/command/cognitive/self-model` | Self Model Console | ✅ | Seeded | ✅ | ✅ Working |
| `/command/cognitive/world-model` | World Model Graph | ✅ | Seeded | ✅ | ✅ Working |
| `/command/demo` | Demo Launchpad | ✅ | Live reset | ✅ | ✅ Working |

---

## Issues Found

| Issue | Severity | Action |
|---|---|---|
| Badge counts not wired to live API | P2 | Wire to /api/command/badge-counts or remove numeric badges |
| New module KPIs not wired | P2 | Wire to /api/command/overview-kpis or add "Demo Values" |

---

## Verdict

**Status: ✅ Fully demo-ready | Policy Compiler and Demo Launchpad are showcases**
