# Repository Signal Summary

> SZL Holdings · Series A · April 2026

A concise summary of the signals an investor or technical evaluator will observe when reviewing this GitHub repository. Intended as a quick-reference supplement to the Technical Due Diligence Index.

---

## At-a-Glance Signals

| Signal | Value | Location |
|--------|-------|----------|
| CI status | ✅ Green | CI badge in README |
| Security analysis (CodeQL) | ✅ Green | CodeQL badge in README |
| Security audit | ✅ Green | Security badge in README |
| License | Proprietary (UNLICENSED) | LICENSE badge; `LICENSE.md` |
| Stack | TypeScript 5.x, React 19, PostgreSQL 16, Expo SDK 53 | Stack badges; README |
| Monorepo manager | pnpm | pnpm badge |
| Branch protection | Documented | `.github/BRANCH_PROTECTION.md` |
| Secret scanning | Configured | `.gitleaks.toml`; `BRANCH_PROTECTION.md` |
| Dependabot | Active — weekly, grouped | `.github/dependabot.yml` |
| CodeQL | Active — push + PR | `.github/workflows/codeql.yml` |
| CODEOWNERS | Full path coverage | `.github/CODEOWNERS` |
| PR template | Comprehensive | `.github/PULL_REQUEST_TEMPLATE.md` |
| Issue templates | Bug, Feature, Security | `.github/ISSUE_TEMPLATE/` |
| SECURITY.md | Present — responsible disclosure | `SECURITY.md` |
| CONTRIBUTING.md | Present — proprietary framing | `CONTRIBUTING.md` |
| CODE_OF_CONDUCT.md | Present — professional | `CODE_OF_CONDUCT.md` |
| SUPPORT.md | Present | `SUPPORT.md` |
| CHANGELOG.md | Present — conventional commits | `CHANGELOG.md` |
| Platform facts (metrics) | Auto-generated from filesystem | `docs/platform-facts.md` |
| Known gaps | Honestly documented | `docs/operations/known-gaps.md` |
| Architecture docs | Comprehensive | `docs/architecture/` |
| Investor docs | Present | `docs/investor/` |
| Governance docs | Present | `docs/governance/` |

---

## What This Signals

### Engineering Rigor
- CI/CD pipeline with multiple quality gates (lint, typecheck, test, smoke, E2E, Lighthouse, CodeQL)
- Branch protection with required reviews and code owner approval
- TypeScript throughout with strict typing policy
- Automated dependency management and vulnerability scanning

### Security Maturity
- Multi-layer secret scanning (gitleaks CI + GitHub native + push protection)
- 11-role RBAC with deny-by-default enforcement
- Org-scoped multi-tenancy
- Immutable audit trail (Proof Chain platform primitive)
- AI advisory-only with enforced human approval gates (Covenant Policy)

### Governance Readiness
- CODEOWNERS with full path coverage
- PR template with comprehensive security and quality checklist
- Issue templates for bugs, features, and security
- Responsible disclosure policy
- Release discipline with checklist and automated gate

### Documentation Quality
- Canonical architecture documentation with platform primitives specification
- Honest known-gaps documentation
- Comprehensive investor and due diligence package
- Auto-generated, validated platform metrics

---

## What An Investor Should Ask

1. "Walk me through the Proof Chain audit trail in a live demo."
2. "Show me how the Covenant Policy approval gate blocks an AI recommendation."
3. "Where is the known technical debt documented?" → `docs/operations/known-gaps.md`
4. "How do I verify the CI is actually green?" → README badges link to live GitHub Actions
5. "What happens when a vessel gets a sanctions hit?" → Live demo: cross-domain event surfacing

---

*SZL Holdings · Series A Repository Signal Summary · April 2026*
