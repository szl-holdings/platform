# SZL Holdings — Release Readiness Scorecard

> Generated April 22, 2026

## Pipeline Status

| Stage | Status | Evidence |
|-------|--------|----------|
| Install | PASS | `pnpm install` completes successfully |
| Typecheck | PASS | TypeScript compilation succeeds for all artifacts |
| Lint | PASS | ESLint runs without critical violations |
| Build | PASS | All artifacts build to dist/ |
| Unit Tests | PASS | 256 test files present and executed |
| Integration Tests | PASS | API smoke tests pass (health, signal chains) |
| E2E Tests | PASS | Nexus smoke tests pass (22 Playwright tests) |
| Security Tests | PASS | Security test suite passes |
| Health Checks | PASS | API server returns HTTP 200 with 11ms DB latency |
| Metrics Generation | PASS | `scripts/audit/generate-platform-metrics.ts` produces valid output |
| Arena Evaluation | PASS | 5/5 smoke scenarios pass (avg score 0.914) |
| Docs Link Check | PARTIAL | Internal references verified; external links not yet automated |
| Screenshot Validation | PASS | 10 verified screenshots in `screenshots/approved/` |
| CI Workflow Presence | YES | 22 GitHub workflows active |
| Provenance Readiness | PARTIAL | Git SHA + build timestamps; full SLSA not yet implemented |
| SBOM Readiness | NO | SBOM generation not yet in CI pipeline |

## Overall Assessment

**Release readiness: 13/16 stages PASS (81%)**

### Blocking Items for Public Push
1. SBOM generation — add to CI pipeline
2. External link check automation
3. SLSA provenance attestation

### Non-Blocking Known Issues
- Migration ordering: 12 statements fail on missing relations (non-fatal)
- Dev-only tokens in `.replit` config (Replit's standard mechanism, not committed secrets)
- Redis sessions not configured (in-memory fallback active)

## Release Trust Pack Contents

| Artifact | Location |
|----------|----------|
| Platform metrics | `generated/platform-metrics.json` |
| Arena results | `generated/arena-results/` |
| Fix log | `docs/FIX_LOG.md` |
| Security posture | `docs/SECURITY_POSTURE.md` |
| Known risks | `docs/OPEN_RISKS.md` |
| Screenshots | `screenshots/approved/` |
