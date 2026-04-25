# Investor Proof Summary — SZL Holdings Platform

**Date:** 2026-04-25  
**Prepared for:** Series A due diligence / investor evaluation  
**Platform:** SZL Holdings — Governed Autonomy Infrastructure  

---

## What This Document Is

This is an honest, no-overclaiming inventory of the SZL Holdings platform as of April 25, 2026. It distinguishes what is built and running today from what is demo-mode from what is on the roadmap. Investors conducting technical due diligence should use this alongside the live demo at the deployed URL.

---

## What Exists Today (Production-Grade, Running Code)

| Capability | Evidence |
|------------|----------|
| **9 domain-specific AI command surfaces** — KORA, TENAX, Counsel, SEXTANT, DOMAINE, LUMINA, PARAGON, Carlota Jo, SZL Holdings Dashboard | Running on Replit Reserved VM; buildable from source |
| **A11oy Brand Orchestration Layer** (Phase 1) | Artifact at `/a11oy`; builds cleanly (dependency wiring fixed in this audit pass); all 36 UI routes functional with seed data |
| **Centralized API server** with 357+ route files | Express + Drizzle ORM; type-safe via OpenAPI codegen |
| **PostgreSQL database** with 132 migrations, 170 schema files | Drizzle ORM; schema-driven multi-tenant data model |
| **Multi-tenant RBAC** — 11-role hierarchy, org_id scoping | Enforced at middleware level; `globalAuthEnforcer` deny-by-default |
| **OIDC/PKCE authentication** | Cookie-based sessions; no password storage |
| **AEF (Alloy Execution Fabric)** packages — 8 packages, 227 unit tests passing | `packages/aef-*`; contracts, policy-guard, evidence-ledger, retrieval-core, workflow-runtime, evals, domain-profiles, storage-adapters |
| **Proof Chain** — immutable audit event system | Every consequential action generates actor-attributed events |
| **Covenant Policy** — human-in-the-loop gate enforcement | AI agents cannot execute consequential actions without human approval |
| **CI/CD** — 23 GitHub Actions workflows | Build, lint, typecheck, test, security scan, E2E, deploy gates |
| **Secret scanning** — gitleaks + CodeQL + dependency audit | 0 live credentials in source; scheduled full-history scans |
| **Mobile application** (CORTEX/APEX) | Expo React Native; connected to same API server |

---

## What Is Demo-Mode (Real Code, Synthetic Data)

| Capability | Demo Details |
|------------|-------------|
| **A11oy agent execution** | Workcells, signals, outcomes are seed data (in-memory); mutation endpoints return 501 Not Implemented in Phase 1 |
| **Intelligence feeds** — AIS vessel positions, legal feed, sanctions, STIX | Feed adapters exist; live data requires API keys configured in production secrets |
| **Email notifications** | Nodemailer + Resend adapter; falls back to silent drop in demo mode |
| **Stripe billing** | Integration complete; requires Stripe keys; demo surfaces show UI without processing real payments |
| **Azure enterprise integrations** — Key Vault, Storage, Redis, Document Intelligence | Adapters built; require Azure credentials in production |
| **Real-time WebSocket** | HMAC-signed ticket system built; requires running API server + database |
| **Proof screenshot captures** | 95 A11oy screenshots captured; all show demo seed data |

---

## What Is Roadmap (Not Yet Built)

| Item | Status |
|------|--------|
| A11oy write paths (workcell approval, execution, proof signing) | Phase 2 — covenant policy gates for mutating endpoints |
| Public production deployment of all 9 surfaces | Currently Replit Reserved VM; cloud (Azure Bicep templates exist) |
| RevenueCat mobile billing | Integrated in mobile; requires production credentials |
| SCIM 2.0 provisioning | Designed; not yet implemented |
| MLS real data integration (DOMAINE) | RESO MLS adapter built; requires MLS data access agreement |
| Branch protection enforcement on GitHub | Rules documented; requires GitHub UI configuration |

---

## Why It Matters

The SZL Holdings platform demonstrates:
1. **Architectural clarity** — clear separation of domain surfaces, shared libraries, and platform primitives
2. **Security-first design** — no secrets in source, deny-by-default auth, immutable audit trail, AI governance enforcement
3. **Enterprise-grade code quality** — TypeScript strict mode, 227 unit tests passing, 23 CI workflows, multi-tenant isolation
4. **Realistic scope management** — honest about what's demo vs. production, documented gaps, no fake claims
5. **Investment in observability** — Proof Chain, Covenant Policy, and Evidence Ledger give operators real-time visibility into AI decisions

---

## What Screenshots Prove

Screenshots in `docs/assets/screenshots/current/` (95 A11oy captures + domain surfaces) demonstrate:
- All 9 domain surfaces render correctly with seed data
- A11oy command surface, workcell views, signal mesh, PCE contracts, and boardroom mode are functional UI
- Dark premium aesthetic is consistent across all surfaces
- Demo mode labeling is visible where appropriate

**What screenshots do NOT prove:** That live data is flowing, that write paths work end-to-end, or that the system is under production load.

---

## What Still Needs Hardening

| Item | Priority | Timeline |
|------|----------|----------|
| Resolve terra / vessels / sentra pre-existing build failures | Medium | Dedicated sprint |
| Full workspace typecheck (requires DATABASE_URL in CI) | Low | Already runs in CI; local env constraint only |
| Branch protection rules applied in GitHub UI | Medium | Manual step; 30 minutes |
| Org profile pushed to `szl-holdings/.github` | Low | Manual step; 15 minutes |
| Social preview image uploaded to GitHub | Low | Manual step; 5 minutes |

---

*Prepared by SZL Holdings engineering — Task #3474 — 2026-04-25*  
*Contact: inquiries@szlholdings.com | Stephen Lutar, Founder*
