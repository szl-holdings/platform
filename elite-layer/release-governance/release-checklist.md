# Release Checklist — SZL Holdings

## Pre-Release

### Code Quality
- [ ] All CI checks pass (lint, typecheck, build)
- [ ] CodeQL security scan clean
- [ ] Dependency review clean
- [ ] No critical/high dependency vulnerabilities
- [ ] Code reviewed via CODEOWNERS

### Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass (if applicable)
- [ ] Manual QA on affected areas
- [ ] Mobile app tested (if affected)

### Documentation
- [ ] Changelog updated
- [ ] Release notes written
- [ ] Help center updated (if user-facing change)
- [ ] API docs updated (if API change)
- [ ] Trust center updated (if security change)

### Support Readiness
- [ ] Support team briefed on changes
- [ ] Known issues documented
- [ ] FAQ updated if needed
- [ ] Troubleshooting guide updated if needed

### Rollout Plan
- [ ] Feature flags configured (if applicable)
- [ ] Rollout sequence defined (% or ring)
- [ ] Kill switch tested
- [ ] Rollback plan documented

### Trust & Security
- [ ] Security implications reviewed
- [ ] Privacy implications reviewed
- [ ] Compliance requirements met
- [ ] No new PII exposure

## Release
- [ ] Merge to main
- [ ] Deployment successful
- [ ] Health check passing
- [ ] Smoke test complete

## Post-Release
- [ ] Monitor error rates (30 min)
- [ ] Monitor performance metrics
- [ ] Check user feedback channels
- [ ] Send stakeholder notification
- [ ] Update status page (if applicable)
- [ ] Schedule post-release review (within 72 hours)
