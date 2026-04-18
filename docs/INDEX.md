# SZL Holdings — Documentation Index
**Last updated:** April 18, 2026

This is the authoritative map of all documentation in the SZL Holdings platform. Every document listed here is real — nothing is aspirational or placeholder.

---

## Start Here

| Document | Purpose |
|---|---|
| [docs/audit/2026-04/README.md](./audit/2026-04/README.md) | **Operational audit executive summary — read this first** |
| [docs/doctrine/szl-doctrine.md](./doctrine/szl-doctrine.md) | The SZL platform doctrine: four pillars, voice rules, anti-patterns |
| [docs/APP_STATUS.md](./APP_STATUS.md) | Artifact readiness register (GA / Beta / Partial / Internal / Archived) |
| [docs/known-gaps.md](./known-gaps.md) | Honest technical debt inventory with remediation paths |

---

## April 2026 Audit (`docs/audit/2026-04/`)

| Document | Contents |
|---|---|
| [README.md](./audit/2026-04/README.md) | Executive summary — what's real, what needs fixing, next actions |
| [system-inventory.md](./audit/2026-04/system-inventory.md) | Every artifact, package, API, job, table, env var, integration tagged real/demo/stub/dead |
| [mock-and-gap-report.md](./audit/2026-04/mock-and-gap-report.md) | All mocks, placeholders, dead buttons, fake metrics — prioritized P0–P3 |
| [public-claims-registry.md](./audit/2026-04/public-claims-registry.md) | Every public number and capability claim with truth value (verified/demo/aspirational) |
| [demo-readiness-scorecard.md](./audit/2026-04/demo-readiness-scorecard.md) | A–F grades for all artifacts across seven gates |
| [task-reconciliation.md](./audit/2026-04/task-reconciliation.md) | Open tasks cross-referenced against audit findings; prune list and new task recommendations |

**Source of truth module:** [packages/config/](../packages/config/) — platform registry, public claims, feature flags, env contract  
**Proof-point migration:** [artifacts/szl-holdings/src/lib/claims.ts](../artifacts/szl-holdings/src/lib/claims.ts) — szl-holdings reads claims from registry  
**Smoke test:** `pnpm tsx scripts/smoke-claims-registry.ts` — 108 checks, fails CI if registry structure breaks

---

## Doctrine (`docs/doctrine/`)

| Document | Contents |
|---|---|
| [szl-doctrine.md](./doctrine/szl-doctrine.md) | Four pillars, voice rules, "no mock theater" principle, visual signatures (~1,900 words) |
| [inspiration-research.md](./doctrine/inspiration-research.md) | Research sources: LangSmith, OpenFeature, OTel GenAI, Palantir, Datadog, demo discipline |

---

## Architecture

| Document | Contents |
|---|---|
| [architecture.md](./architecture.md) | Technical stack, intelligence model, entity definitions |
| [platform-core.md](./platform-core.md) | Six platform primitives |
| [PLATFORM_OVERVIEW.md](./PLATFORM_OVERVIEW.md) | Product portfolio overview |
| [PRODUCT_MATRIX.md](./PRODUCT_MATRIX.md) | Product-to-domain-pack matrix |
| [STATE_MODEL.md](./STATE_MODEL.md) | Entity state machine definitions |

---

## Security and Access

| Document | Contents |
|---|---|
| [ACCESS_CONTROL.md](./ACCESS_CONTROL.md) | 11-role RBAC, multi-tenancy isolation, session management |
| [DATA_CLASSIFICATION.md](./DATA_CLASSIFICATION.md) | Tier 1–4 data classification and handling requirements |
| [SECRETS_POLICY.md](./SECRETS_POLICY.md) | Secret management policy |
| [SECURITY_BASELINE.md](./SECURITY_BASELINE.md) | Security baseline requirements |
| [trust/trust-center.md](./trust/trust-center.md) | Public trust center document |

---

## Operations and Release

| Document | Contents |
|---|---|
| [DEMO_DATA_POLICY.md](./DEMO_DATA_POLICY.md) | Rules for trustworthy demo environments and data labeling |
| [DECISION_LEDGER.md](./DECISION_LEDGER.md) | Immutable proof chain specification |
| [RELEASE_GATES.md](./RELEASE_GATES.md) | Seven release gates and pass/fail criteria |
| [DEPLOYMENT_MODEL.md](./DEPLOYMENT_MODEL.md) | Deployment architecture and environment model |
| [ENVIRONMENT_SEPARATION.md](./ENVIRONMENT_SEPARATION.md) | Environment separation policy |
| [LAUNCH_READINESS_SCORECARD.md](./LAUNCH_READINESS_SCORECARD.md) | 8-dimension readiness scorecard (before Q4 2025 → after Q2 2026) |
| [PRODUCTION_READINESS_CHECKLIST.md](./PRODUCTION_READINESS_CHECKLIST.md) | Pre-production readiness checklist |
| [disaster-recovery.md](./disaster-recovery.md) | DR runbook |
| [ops-runbook.md](./ops-runbook.md) | Operational runbook |

---

## Investor and Strategic

| Document | Contents |
|---|---|
| [investor/platform-thesis.md](./investor/platform-thesis.md) | Platform thesis for investors |
| [FOUNDER_EXEC_SUMMARY.md](./FOUNDER_EXEC_SUMMARY.md) | Founder executive summary |
| [TECHNICAL_DUE_DILIGENCE_PACKET.md](./TECHNICAL_DUE_DILIGENCE_PACKET.md) | Technical DD packet |
| [WHAT_THIS_PROVES.md](./WHAT_THIS_PROVES.md) | What the platform proves at current stage |

---

## Prior Audits (reference only)

These are historical — the April 2026 audit above supersedes them for current state.

| Document | Notes |
|---|---|
| [audit/omega-audit-findings.md](./audit/omega-audit-findings.md) | Prior comprehensive audit |
| [audit/series-a-full-audit.md](./audit/series-a-full-audit.md) | Series A cleanup audit |
| [audit/LAUNCH_READINESS_SCORECARD.md](./LAUNCH_READINESS_SCORECARD.md) | Launch readiness (April 2026) |
| [audit/known-gaps.md](./known-gaps.md) | Living technical debt register |

---

*This index is maintained manually. Update it after adding significant new documentation.*
