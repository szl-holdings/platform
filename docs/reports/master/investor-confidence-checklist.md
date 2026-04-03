# Investor Confidence Checklist — SZL Holdings
**Date:** April 3, 2026  
**Status:** Current  
**Audience:** Series A / seed-stage investors, family offices, strategic partners

---

## How to Use This Document

Each item below represents a question a serious investor would ask. The answer column gives the honest current state. Items marked **Evidence** can be verified directly in the codebase, documentation, or a live demo.

---

## 1. Company Foundation

| Question | Answer | Evidence |
|----------|--------|---------|
| Is the company legally incorporated? | Yes — SZL Holdings as parent entity | Legal docs available on request |
| Is there a clear founder story? | Yes — Stephen Lutar, documented at stephen-site | `/stephen-site` — resume, background, narrative |
| Is there a defined holding structure? | Yes — SZL Holdings → Lyte, Alloy, Aegis, Terra, Vessels, Carlota Jo | `docs/PLATFORM_OVERVIEW.md` |
| Is the market defined clearly? | Yes — AI-native operational intelligence, wedge in workflow observability | `docs/investor-narrative.md` |
| Are expansion lanes documented honestly? | Yes — post-wedge, not current GTM | `docs/reports/master/product/live-vs-roadmap-summary.md` |

---

## 2. Product Reality

| Question | Answer | Evidence |
|----------|--------|---------|
| Is Lyte + Alloy actually built? | Yes — functional, running, demonstrable | Demo available on request |
| Can I see an audit trail in the product? | Yes — every AI decision is logged with actor, timestamp, rationale | Open Lyte → any AI decision card |
| Is the AI genuine or wrappers? | Genuine — 9 validated decision schemas, hybrid retrieval, BGE embeddings | `lib/ai-engine/src/schemas/` |
| Is data state labeled honestly? | Partially — DataStateBadge deployed; not yet on all surfaces | `lib/shared-ui/src/data-state-badge.tsx` |
| Are there live data integrations? | Yes — Census, HUD, FEMA NRI, NYC Open Data (Terra) | `artifacts/terra/src/` — confirmed API calls |
| Is ownership tracked per entity? | Yes — OperationalOwnerChip on all Lyte entities | `lib/shared-ui/src/operational-primitives.tsx` |
| Are approval gates real? | Partial — schema and UI exist; not fully wired for all entity types | Approval center in Lyte |

---

## 3. Technology Quality

| Question | Answer | Evidence |
|----------|--------|---------|
| Does it build without errors? | Yes — all 8 web apps build cleanly | `docs/reports/master/build-report.md` |
| Are there automated tests? | Partial — eval harness for AI (25+ scenarios); no E2E test suite | `lib/ai-engine/src/evals/` |
| Is there CI/CD? | Yes — 6 GitHub workflows: CI matrix, CodeQL, dependency review, release | `.github/workflows/` |
| Is the codebase well-structured? | Yes — pnpm monorepo, 18 shared packages, clear separation of concerns | Root `package.json`, `pnpm-workspace.yaml` |
| Are dependencies audited? | Yes — CodeQL + dependency-review in CI | `.github/workflows/security.yml` |
| Is auth implemented? | Yes — JWT, session management, RBAC across all apps | `lib/auth/` |
| Are there 1,000+ API endpoints? | Yes — 1,166 documented endpoints | `artifacts/api-server/` |
| Is there a shared design system? | Yes — 18 shared packages including `@workspace/shared-ui` | `lib/shared-ui/` |

---

## 4. Business Model

| Question | Answer | Evidence |
|----------|--------|---------|
| Is there a defined go-to-market? | Yes — design-partner stage, founder-led sales | `docs/investor-narrative.md` |
| Are design partners active? | Yes — design-partner application page is live | `szlholdings.com/design-partners` |
| Is there SaaS pricing? | Architecture exists; not yet publicly marketed | `docs/reports/master/product/` |
| Is there commercial revenue? | Design-partner stage; no paid SaaS revenue yet | Disclosed honestly in all investor materials |
| What is the unit economics model? | Subscription + usage-based for Lyte/Alloy; advisory retainer for Carlota Jo | `docs/investor-narrative.md` |
| Are expansion lanes a distraction risk? | No — they share the same Alloy spine; optionality, not obligation | `docs/investor-narrative.md` |

---

## 5. Risk Profile

| Question | Answer | Evidence |
|----------|--------|---------|
| What are the key risks? | E2E test coverage, tenant isolation, bundle size, pre-revenue | `docs/reports/master/02-risk-register.md` |
| Is tenant isolation enforced? | Partial — auth per tenant; retrieval not yet partitioned | Known gap; in remediation plan |
| Are there named customers? | None publicly disclosed at this stage | N/A |
| Is the founder sole dependent? | Currently yes; documented as a key risk | Risk register |
| Is the platform audit-ready? | Partial — AI audit is full; operational audit gaps remain | `docs/reports/master/02-risk-register.md` |

---

## 6. Capital Readiness

| Question | Answer | Evidence |
|----------|--------|---------|
| Are financial models available? | Yes — capital readiness artifacts on request | SZL Holdings `/capital` |
| Is there a data room? | Yes — docs, architecture, diligence materials | `docs/investor/` |
| Is the IP protected? | Codebase is private; trademark/IP counsel recommended | Recommend legal counsel |
| Are there any outstanding liabilities disclosed? | None known | N/A |
| Is the team documented? | Yes — founder documented; advisors documented where applicable | `stephen-site` |

---

## Overall Investor Confidence Score

| Dimension | Score (1-10) | Notes |
|-----------|-------------|-------|
| Product Reality | 7.5 | Core Lyte + Alloy genuinely built; expansion prototypes |
| Technology Quality | 7.0 | Strong architecture; E2E tests missing |
| Business Model Clarity | 7.0 | Clear; pre-revenue by design at this stage |
| Risk Transparency | 8.5 | Risks documented and disclosed honestly |
| Capital Readiness | 7.0 | Materials exist; data room well-organized |
| Founder Credibility | 8.0 | Documented background, demonstrated execution |
| **Overall** | **7.5** | Design-partner stage; appropriate for seed/early A |

---

## What a Smart Investor Should Ask For

1. Live demo of Lyte signal → decision → audit trail flow
2. Review of `lib/ai-engine/src/schemas/` — the 9 decision schemas; eval scenarios in `lib/ai-engine/src/evals/`
3. Live data pull from Census or FEMA APIs in Terra
4. Review of GitHub CI workflows and CodeQL results
5. Design-partner reference conversation (available on request)
6. Review of this claim-vs-capability audit

---

*See also: [executive-audit-summary.md](executive-audit-summary.md) · [claim-vs-capability-audit.md](claim-vs-capability-audit.md) · [bank-diligence-checklist.md](bank-diligence-checklist.md)*
