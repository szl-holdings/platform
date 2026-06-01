# Release Governance Model

## Principles
1. Every release has an owner
2. Every release has a risk summary
3. Every release has a rollback plan
4. Every release has docs/support/trust review
5. Every release has post-launch analytics check

## Release Types

| Type | Scope | Governance | Example |
|------|-------|-----------|---------|
| Patch | Bug fix, minor change | Owner approval | Fix typo, fix enum |
| Minor | New feature, enhancement | Launch checklist | New dashboard page |
| Major | Architecture change, breaking | Launch council | New product domain |
| Emergency | Critical fix | Owner + escalation | Security patch |

## Process

### Patch Release
1. Code change with tests
2. CI passes
3. Code review
4. Merge and deploy
5. Verify

### Minor Release
1. Complete release checklist
2. CI passes
3. Code review via CODEOWNERS
4. Feature flag configured (if applicable)
5. Documentation updated
6. Support briefed (if user-facing)
7. Merge and deploy
8. Monitor for 30 minutes
9. Schedule post-release review

### Major Release
1. Launch council meeting (go/no-go)
2. Complete full release checklist
3. All CI checks pass
4. Security review
5. Feature flags configured
6. Gradual rollout plan
7. Documentation, support, trust all updated
8. Deploy to staging (if available)
9. Deploy to production
10. Monitor for 24 hours
11. Post-release review within 72 hours

## Current State
- Release checklist documented
- Go/no-go criteria defined
- Launch council agenda template ready
- Post-release review template ready
- **Process is manual** — automation planned for future
