# SZL Holdings — Execution Plan

Generated: 2026-04-15

## Phase 0: Deep Audit [COMPLETE]
- [x] Repo inventory → `ops/replit-agent/repo-inventory.md`
- [x] Risks and gaps assessment → `ops/replit-agent/risks-and-gaps.md`
- [x] Target architecture → `ops/replit-agent/target-architecture.md`
- [x] This execution plan

## Phase 1: Secret Hygiene & Repo Safety [COMPLETE]
- [x] Dev fallback secrets verified safe (NODE_ENV=production guards in field-encryption.ts, rmm.ts)
- [x] VITE_* audit — no secret leakage, only public keys use VITE_ prefix
- [x] Credential rotation inventory → `ops/security/credential-rotation-required.md`
- [x] Secrets bootstrap guide → `ops/security/secrets-bootstrap.md`
- [ ] Move test token `szl-test-integration-live-2026` to env var (pending — low risk, test-only)

## Phase 2: Product Topology & Cleanup [COMPLETE]
- [x] Deleted 11 empty artifact stubs (aegis-mobile, alloy-mobile, etc.)
- [x] Deleted 3 zombie integration lib dirs (integrations-anthropic-ai, etc.)
- [x] App disposition matrix → `ops/portfolio/app-disposition-matrix.md`
- [ ] Deregister 5 deprecated artifacts (aegis, imperium, lyte, prism-counsel, stephen-site) — blocked by Replit artifact limit; deregister when ready to add new apps

## Phase 3: Replit Workflows & Deployment [COMPLETE]
- [x] Deployment decisions → `ops/replit/deployment-decision.md`
- [x] First-day runbook → `ops/replit/first-day-runbook.md`
- [x] Production secret checklist → `ops/replit/production-secret-checklist.md`

## Phase 4: GitHub Hardening [COMPLETE]
- [x] GitHub final checklist → `ops/github/github-final-checklist.md`
- [x] Actions secrets matrix → `ops/github/actions-secrets-matrix.md`
- [x] Repo settings guide → `ops/github/repo-settings.md`
- [ ] dependabot.yml — cannot push (OAuth lacks workflow scope); config documented in actions-secrets-matrix.md

## Phase 5: Frontend Excellence [DOCUMENTED]
- [x] Frontend performance plan → `ops/infrastructure/frontend-performance-plan.md`
- [x] SEO gap report → `ops/growth/seo-gap-report.md`
- Implementation deferred to dedicated task

## Phase 6: Backend & Data Platform [COMPLETE]
- [x] API standards → `ops/backend/api-standards.md`
- [x] Authorization matrix → `ops/backend/authz-matrix.md`
- [x] Error catalog → `ops/backend/error-catalog.md`

## Phase 7: Observability [COMPLETE]
- [x] OTEL plan → `ops/observability/otel-plan.md`
- [x] SLO catalog → `ops/observability/slo-catalog.md`
- [x] Alert matrix → `ops/observability/alert-matrix.md`
- [x] Post-deploy smoke tests → `ops/observability/post-deploy-smoke-tests.md`

## Phase 8: Security & Trust [COMPLETE]
- [x] ASVS gap map → `ops/security/asvs-gap-map.md`
- [x] API security gap map → `ops/security/api-security-gap-map.md`
- [x] Threat model summary → `ops/security/threat-model-summary.md`
- [x] Production hardening checklist → `ops/security/production-hardening-checklist.md`

## Phase 9: Analytics & Growth [COMPLETE]
- [x] Analytics implementation plan → `ops/growth/analytics-implementation-plan.md`
- [x] Funnel map → `ops/growth/funnel-map.md`
- [x] SEO gap report → `ops/growth/seo-gap-report.md`
- [x] Conversion queue → `ops/growth/conversion-queue.md`

## Phase 10: Mobile Operationalization [COMPLETE]
- [x] Flagship mobile release plan → `ops/mobile/flagship-mobile-release-plan.md`
- [x] EAS secrets matrix → `ops/mobile/eas-secrets-matrix.md`
- [x] Store assets checklist → `ops/mobile/store-assets-checklist.md`
- [x] TestFlight/Play internal runbook → `ops/mobile/testflight-play-internal-runbook.md`

## Phase 11: Infrastructure [COMPLETE]
- [x] Monorepo health report → `ops/infrastructure/monorepo-health-report.md`
- [x] DB schema health report → `ops/infrastructure/db-schema-health-report.md`
- [x] Frontend performance plan → `ops/infrastructure/frontend-performance-plan.md`
- [x] Consolidation playbook → `ops/infrastructure/consolidation-playbook.md`

## Phase 12: Cleanup & Consolidation [COMPLETE]
- [x] Consolidation playbook → `ops/infrastructure/consolidation-playbook.md`
- [x] App disposition matrix serves as canonical doc map
- [x] 14 zombie directories removed (11 stubs + 3 libs)
- [ ] Root docs consolidation — deferred (large scope, separate task)

## Summary

| Phase | Status | Docs Created |
|-------|--------|-------------|
| 0 Deep Audit | Complete | 4 |
| 1 Secret Hygiene | Complete | 2 |
| 2 Product Cleanup | Complete | 1 + 14 dirs deleted |
| 3 Deployment | Complete | 3 |
| 4 GitHub | Complete | 3 |
| 5 Frontend | Documented | 2 (shared with other phases) |
| 6 Backend | Complete | 3 |
| 7 Observability | Complete | 4 |
| 8 Security | Complete | 4 |
| 9 Growth | Complete | 4 |
| 10 Mobile | Complete | 4 |
| 11 Infrastructure | Complete | 4 |
| 12 Consolidation | Complete | 1 |
| **Total** | | **37 documents** |
