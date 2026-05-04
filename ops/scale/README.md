# SZL Scale, Close, and Operate Pass

Authority: Task #793 — operational documentation grounded in real repo state
Updated: 2026-04-16

This directory converts the SZL Holdings platform from a "growth capital-grade
asset" into an operable, closable, scalable company system. No code
changes; no new product surfaces; no reopening of canon decisions
(flagship app assignments, mobile disposition, archived artifacts).

All claims are grounded in the live repo and prior operational audits:

- `ops/frontier/disposition-matrix.md` — canonical artifact classifications
- `ops/frontier/repo-truth-audit.md` — verified file/table/endpoint counts
- `ops/frontier/product-surface-census.md` — per-product surface inventory
- `ops/security/secret-inventory.md` — credential locations
- `ops/observability/otel-plan.md` — telemetry plan
- `ops/mobile/phase-k-mobile-honest-pass.md` — mobile disposition

## Phase Index

| Phase | Theme | Files |
|------|-------|-------|
| A | Design partner onboarding | design-partner-onboarding · demo-to-pilot-flow · partner-first-14-days · customer-launch-pack |
| B | Staging and production model | environment-promotion-model · deploy-and-rollback-runbook · production-cutover-checklist |
| C | Observability and supportability | staging-and-prod-smoke-tests · incident-triage-model · support-troubleshooting-guide · telemetry-priority-matrix |
| D | Conversion and GTM | conversion-ops-map · founder-pipeline-dashboard-spec · inbound-routing-and-response-sla |
| E | Enterprise diligence and close pack | enterprise-evaluation-flow · buyer-faq · one-page-evaluator-brief · diligence-fast-path |
| F | Founder operating system | founder-operating-rhythm · founder-control-room-checklist · pre-demo-pre-release-checklists |
| G | Beta discipline | internal-beta-ops · mobile-beta-ops · manual-console-actions-master |
| H | Release management | release-train-model · release-blocker-policy · founder-release-approval |
| I | Risk register and scale constraints | risk-register · scale-constraints-memo · next-hires-or-outsourcing |
| J | Founder closeout package | executive-summary · what-changed · manual-actions-left · founder-next-30-days · go-live-readiness-verdict |

Start with `executive-summary.md` (Phase J) for the top-down view.
Operators should start with `founder-control-room-checklist.md` (Phase F).
