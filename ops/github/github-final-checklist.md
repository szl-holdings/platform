# GitHub Final Checklist

Generated: 2026-04-15

## Repository Settings

### General
- [x] Repository name: `szl-holdings-platform`
- [x] Description: Updated with accurate platform description
- [x] Topics: enterprise-platform, saas, series-a, ai-governance, security, maritime, real-estate, typescript, business-intelligence, multi-domain
- [ ] Social preview image: Upload from `docs/media/social-preview/` (requires GitHub web UI)
- [x] Default branch: `main`

### Branch Protection (main)
- [ ] Require pull request reviews (1 reviewer minimum)
- [ ] Require status checks: `ci / lint`, `ci / typecheck`, `ci / build-web`, `ci / test-api`
- [ ] Require conversation resolution
- [ ] Require signed commits (optional, recommended)
- [ ] Include administrators
- [ ] Auto-delete head branches after merge

### Merge Settings
- [ ] Allow squash merging only (recommended for clean history)
- [ ] Auto-delete head branches: Enabled

## Files Present
- [x] README.md — comprehensive, badge-rich
- [x] CONTRIBUTING.md — with Code of Conduct reference
- [x] CODE_OF_CONDUCT.md — Contributor Covenant
- [x] SECURITY.md — disclosure policy, scope list
- [x] LICENSE.md — present
- [x] CHANGELOG.md — present
- [x] .github/CODEOWNERS — comprehensive coverage
- [x] .github/PULL_REQUEST_TEMPLATE.md — app checklist, type labels
- [x] .github/ISSUE_TEMPLATE/bug_report.yml — YAML form
- [x] .github/ISSUE_TEMPLATE/feature_request.yml — YAML form

## CI/CD Workflows
- [x] ci.yml — lint, typecheck, build, test
- [x] codeql.yml — code scanning
- [x] security.yml — dependency audit
- [x] dependency-review.yml — PR dependency review
- [x] deploy-staging.yml — auto-deploy on push to main
- [x] deploy-production.yml — deploy on release publish
- [x] deploy.yml — deprecated (no-op)
- [x] release.yml — release automation
- [x] e2e.yml — Playwright tests
- [x] lighthouse.yml — performance audits

## GitHub Actions Secrets Required
See `ops/github/actions-secrets-matrix.md`

## Manual Steps (GitHub Web UI)
1. Set social preview image
2. Pin repositories on org profile
3. Configure branch protection rules
4. Create staging and production environments
5. Set environment protection rules (production requires reviewer)
6. Enable Dependabot alerts and security updates
7. Enable secret scanning
