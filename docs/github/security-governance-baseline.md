# SZL Holdings — Security & Governance Baseline

**Date:** April 2026  
**Status:** Canonical  
**Applies to:** All material repos in `szl-holdings` org

---

## 1. SECURITY.md Template

Deploy this to every material repo as `SECURITY.md`:

```markdown
# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest (`master`) | ✅ Active support |
| Previous minor | ⚠️ Critical fixes only (90 days) |
| Older | ❌ Not supported |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Report security issues to: **security@szlholdings.com**

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Affected component (platform name, endpoint, feature)
- Potential impact assessment
- Any suggested mitigation (optional)

### What to Expect

| Milestone | Timeline |
|-----------|----------|
| Initial acknowledgment | Within 48 hours |
| Status update | Within 7 days |
| Resolution target | Within 30 days for critical, 90 days for high |
| Disclosure coordination | We will coordinate timing with you |

We follow responsible disclosure. We do not pursue legal action against good-faith security researchers.

## Scope

In scope:
- All applications at `szlholdings.com` and subdomains
- The `szl-holdings-platform` codebase
- API endpoints and authentication flows
- Data handling and privacy boundaries

Out of scope:
- Denial of service attacks
- Social engineering
- Physical security
- Third-party services not under our control

## Security Contact

**Email:** security@szlholdings.com  
**Response PGP key:** Available on request  
**Backup contact:** inquiries@szlholdings.com
```

---

## 2. CODEOWNERS Template

Deploy this to every material repo as `.github/CODEOWNERS` or `CODEOWNERS` at root:

```
# SZL Holdings — Code Owners
# Format: pattern    @owner-or-team

# Global owner — all files
* @szl-holdings/platform

# Core platform
artifacts/api-server/       @szl-holdings/platform
artifacts/szl-holdings/     @szl-holdings/platform
artifacts/aegis/            @szl-holdings/platform
artifacts/command/          @szl-holdings/platform
artifacts/terra/            @szl-holdings/platform
artifacts/vessels/          @szl-holdings/platform
artifacts/carlota-jo/       @szl-holdings/platform
# Mobile applications
artifacts/*-mobile/         @szl-holdings/platform

# Shared libraries
lib/                        @szl-holdings/platform
lib/ai-engine/              @szl-holdings/platform
lib/db/                     @szl-holdings/platform
lib/shared-ui/              @szl-holdings/platform

# Packages
packages/                   @szl-holdings/platform

# Infrastructure
infra/                      @szl-holdings/platform

# Documentation and governance
docs/                       @szl-holdings/docs
.github/                    @szl-holdings/platform

# Security-sensitive files — require explicit review
SECURITY.md                 @szl-holdings/security
docs/trust/                 @szl-holdings/security
.github/workflows/          @szl-holdings/platform
```

**Phase 1 note:** With a single owner, all teams resolve to `stephenlutar2-hash`. Teams are created for structural readiness, not current need. When contributors are added, assign them to the appropriate team and CODEOWNERS automatically routes review requests.

---

## 3. CONTRIBUTING.md Template

Deploy to flagship and active product repos:

```markdown
# Contributing to SZL Holdings Platform

## Current Status

This platform is in active development by a focused founding team. **Direct external contributions are not currently accepted** via pull request.

## How to Engage

### Enterprise Evaluation

If you are evaluating the platform for enterprise deployment:
- Contact: inquiries@szlholdings.com
- We can arrange technical review, architecture walkthrough, and integration scoping

### Security Issues

Do not report security issues via pull request or public issue.
See [SECURITY.md](../../SECURITY.md) for the responsible disclosure process.

### Bug Reports

Use the [Bug Report template](../../.github/ISSUE_TEMPLATE/bug_report.md) to report reproducible defects.

### Feature Requests

Use the [Feature Request template](../../.github/ISSUE_TEMPLATE/feature_request.md) for capability suggestions.

## Engineering Standards (For Internal Reference)

### Code Style

- TypeScript strict mode — no `any` without explicit justification
- ESLint + Prettier enforced via CI
- All components must use the shared design system (`@workspace/shared-ui`)

### Commit Convention

```
feat(scope): description
fix(scope): description  
docs(scope): description
infra(scope): description
breaking(scope)!: description
```

### Pull Request Requirements

- All PRs require review approval
- CI must pass (lint, typecheck, test, build)
- Code Owner review required for critical paths
- CHANGELOG entry required for features and breaking changes
- No plaintext secrets in any committed file

### Architecture Principles

- Audit trail first — all consequential actions are logged
- Explicit over implicit — status, state, and access must be declared
- No silent fallbacks — failures must surface, not hide
- Human-in-the-loop for AI-assisted decisions
- RBAC enforced at the API layer, not just the UI

## Contact

**inquiries@szlholdings.com**
```

---

## 4. Issue Template — Security Report

Create `.github/ISSUE_TEMPLATE/security_report.md`:

```markdown
---
name: Security Report
about: DO NOT USE FOR VULNERABILITIES — use security@szlholdings.com instead
title: '[SECURITY] '
labels: security
assignees: stephenlutar2-hash
---

> **STOP:** If this is a security vulnerability, do NOT open a public issue.
> Email **security@szlholdings.com** instead.
> 
> See [SECURITY.md](../../SECURITY.md) for the responsible disclosure process.

---

Use this template only for non-sensitive security process questions or policy feedback.
```

---

## 5. PR Template Enhancement

Update `.github/PULL_REQUEST_TEMPLATE.md` to include a security gate:

```markdown
## Security Review

- [ ] No secrets, credentials, or tokens committed
- [ ] No new external API calls without documented auth pattern
- [ ] New endpoints have RBAC checks
- [ ] Audit trail entries added for consequential actions
- [ ] Data returned does not include fields not required by the consumer
```

(This section is added to the existing PR template — see `.github/PULL_REQUEST_TEMPLATE.md`)

---

## 6. Deployment Status — All Material Repos

### szl-holdings-platform (Flagship) — Rollout Complete

All governance files are deployed and enforced in this repository:

| File | Status | Location | Notes |
|------|--------|----------|-------|
| `SECURITY.md` | ✅ **Deployed** | `/SECURITY.md` | Full disclosure policy, severity table, scope, security architecture |
| `CODEOWNERS` | ✅ **Deployed** | `/.github/CODEOWNERS` | Full directory mapping to `@szl-holdings/platform` and sub-teams |
| `CONTRIBUTING.md` | ✅ **Deployed** | `/CONTRIBUTING.md` | Proprietary model, engineering standards, commit convention, PR rules |
| `PULL_REQUEST_TEMPLATE.md` | ✅ **Deployed** | `/.github/PULL_REQUEST_TEMPLATE.md` | Type, affected artifacts, security gate checklist |
| `ISSUE_TEMPLATE/bug_report.md` | ✅ **Deployed** | `/.github/ISSUE_TEMPLATE/bug_report.md` | Platform-scoped bug report with environment fields |
| `ISSUE_TEMPLATE/feature_request.md` | ✅ **Deployed** | `/.github/ISSUE_TEMPLATE/feature_request.md` | Operational need, proposed solution, priority |
| `ISSUE_TEMPLATE/security_report.md` | ✅ **Deployed** | `/.github/ISSUE_TEMPLATE/security_report.md` | Redirects to email; blocks public vuln disclosure |
| `ISSUE_TEMPLATE/config.yml` | ✅ **Deployed** | `/.github/ISSUE_TEMPLATE/config.yml` | Template config |
| Navigation bar (README standard) | ✅ **Applied** | `/README.md` | Demo → Security → Architecture → Investor → Trust |
| Navigation bar (../../SECURITY.md) | ✅ **Applied** | `/SECURITY.md` | Platform repo → Architecture → Trust → Contact |
| Navigation bar (CONTRIBUTING.md) | ✅ **Applied** | `/CONTRIBUTING.md` | Platform repo → Security → Architecture → Contact |

### Future Repos — Planned Rollout

| Repo | SECURITY.md | CODEOWNERS | CONTRIBUTING.md | Nav Bar |
|------|------------|-----------|----------------|---------|
| `szl-holdings/szl-docs` (when created) | ✅ Deploy per template | ✅ Deploy | Link to platform | ✅ Apply |
| `szl-holdings/szl-design-system` (when created) | ✅ Deploy per template | ✅ Deploy | ✅ Deploy | ✅ Apply |
| `szl-holdings/szl-infra` (when created) | ✅ Deploy per template | ✅ Deploy | Link to platform | ✅ Apply |
| `szl-holdings/.github` (org README repo) | ❌ Not needed | ❌ Not needed | ❌ Not needed | N/A |
| `stephenlutar2-hash` (personal profile repo) | ❌ Not needed | ❌ Not needed | ❌ Not needed | N/A |
| Archive repos | Add link to platform SECURITY.md | ❌ Not needed | ❌ Not needed | N/A |
