# SZL Holdings — GitHub Enterprise Maturity Path

**Date:** April 2026  
**Status:** Canonical

---

## Overview

The enterprise maturity path transforms the SZL Holdings GitHub presence from founder-managed personal account to a professional, auditable, enterprise-grade organizational surface. Progress happens in three phases, each with clear milestone gates before proceeding to the next.

---

## Phase 1 — Foundation (Current Sprint)

**Goal:** Establish the org, secure the baseline, enforce governance on the flagship repo.  
**Timeline:** Complete before first enterprise evaluation.  
**Plan tier required:** Free org.

### Milestones

#### Org & Identity
- [x] Create `szl-holdings` GitHub organization
- [x] Apply org profile: display name, bio, website, email, profile picture
- [x] Create `szl-holdings/.github` repo with org profile README
- [x] Transfer `szl-holdings-platform` from personal account to org
- [x] Update all docs and README links to new org URL
- [ ] Update personal profile (`stephenlutar2-hash`) to reflect org relationship *(requires manual update — OAuth lacks write scope)*
- [ ] Pin flagship repo on org profile *(requires manual UI — no API endpoint)*

#### Repo Governance
- [x] Apply canonical description, topics, homepage URL to flagship repo
- [x] Enable issues; disable wiki, projects, discussions on flagship
- [x] Apply branch protection to `master` (PR required, status checks required, no force push, no deletion)
- [x] CODEOWNERS deployed to `.github/CODEOWNERS`
- [x] SECURITY.md deployed to root
- [x] CONTRIBUTING.md deployed to root
- [x] Issue templates: bug report, feature request, security report
- [x] PR template updated with security gate section
- [x] Release created: `v0.1.0`
- [x] Issue labels bootstrapped

#### README & Surface
- [x] Flagship README updated to premium standard (all required sections)
- [x] Org profile README deployed with company statement, platform architecture, demo path
- [ ] Personal profile README updated with org link *(requires manual update)*
- [ ] All archive repos annotated with archived annotation template

#### Actions / CI
- [ ] All workflows have explicit `permissions` blocks *(OAuth lacks `workflow` scope — cannot push workflow files)*
- [ ] Third-party actions pinned to SHA
- [ ] CI gate job added as single status check for branch protection
- [ ] `deploy.yml` clarified (implement real trigger or document as placeholder)
- [ ] `prism-counsel-ci.yml` audited — remove if not needed

#### Gists
- [ ] Gist audit complete
- [ ] Non-compliant gists made private or deleted
- [ ] Retained gists registry updated

### Phase 1 Gate

Phase 1 is complete when:
- Org exists with correct profile
- Flagship repo is under org
- Branch protection is active
- README is premium-grade
- SECURITY.md + CODEOWNERS + CONTRIBUTING.md are deployed
- CI workflows have permissions and pinning
- All archive repos are annotated
- Manual UI checklist items are checked off

---

## Phase 2 — Trust & Verification

**Goal:** Add domain verification, expand security coverage, formalize access control.  
**Prerequisite:** Phase 1 complete. DNS admin access available.  
**Plan tier:** Free (most features) to Team (org-wide rulesets, required reviewers).

### Milestones

#### Domain Verification
- [ ] Verify `szlholdings.com` domain on GitHub org
  - Navigate to: `github.com/organizations/szl-holdings/settings/domains`
  - Add `szlholdings.com` and follow DNS TXT record verification
  - Enables: verified badge on org profile, approved domains for org members
- [ ] Verify email domain `@szlholdings.com` (for org member emails)

#### Expanded Security
- [x] Enable push protection for secret scanning (org-level)
- [x] Enable vulnerability alerts and automated security fixes
- [ ] Configure Dependabot version updates (not just security alerts)
  - Update `dependabot.yml` with version update schedules
- [ ] Schedule quarterly dependency audit
- [ ] Configure security advisory notifications (org settings)
- [ ] Add `docs-validate.yml` workflow (link checking, docs build)
- [ ] Add `secret-scan.yml` workflow (Trufflehog or gitleaks on PRs)

#### Access Control
- [x] Create formal teams: `platform`, `security` (even if single-member)
- [ ] Assign repos to teams with explicit permissions
- [ ] Document onboarding procedure for future contributors
- [ ] Set member base permissions to `Read` (org settings)
- [ ] Enable 2FA requirement for org members

#### Rulesets (Team plan)
- [ ] Upgrade to Team plan when org has 2+ active contributors
- [ ] Implement org-wide rulesets replacing per-repo branch protection
- [ ] Configure `flagship-production` ruleset
- [ ] Configure `docs-content` ruleset

#### Environments
- [ ] Create `production` environment in flagship repo settings
- [ ] Scope deploy secrets to `production` environment
- [ ] Add required reviewers to production environment (optional)

### Phase 2 Gate

Phase 2 is complete when:
- Domain is verified on GitHub
- Push protection is active
- Dependabot version updates are running
- Formal teams exist with explicit permissions
- 2FA is required for all org members
- Secret scanning with push protection is active
- Docs validation workflow exists

---

## Phase 3 — Enterprise Discipline

**Goal:** Match enterprise buyer expectations for governance, auditability, and security.  
**Prerequisite:** Phase 2 complete. Active enterprise prospects or revenue.  
**Plan tier:** Team (minimum), Enterprise Cloud (for SAML, audit log export, advanced policies).

### Milestones

#### Identity & SSO
- [ ] Evaluate GitHub Enterprise Cloud for SAML SSO
  - Enables: SAML identity linkage, org-managed accounts, org-enforced 2FA
- [ ] If Enterprise Cloud: configure SSO with chosen IdP (Azure AD, Okta)
- [ ] Document SSO onboarding process for contributors

#### Audit & Compliance
- [ ] Enable org audit log review (Settings → Logs)
  - Enterprise Cloud: export audit log to SIEM for retention
- [ ] Quarterly GitHub security review ritual:
  - Review Dependabot alerts
  - Review CodeQL findings
  - Review secret scanning alerts
  - Audit org membership and access
  - Verify branch protection and ruleset configs haven't drifted
- [ ] Document security incident response playbook using GitHub
- [ ] Add GitHub to SOC2/compliance evidence package

#### Release Maturity
- [ ] Implement signed releases (GPG-signed tags)
- [ ] Formal CHANGELOG discipline (keep-a-changelog format)
- [ ] Release notes generated from conventional commits
- [ ] SBOMs (Software Bill of Materials) for major releases
  - GitHub can generate SBOMs from dependency graph

#### Contributor Model
- [ ] Written contributor onboarding guide
- [ ] Security acknowledgment for new contributors
- [ ] Code review standards documented in CONTRIBUTING.md
- [ ] PR labels and milestone discipline established
- [ ] Contributor code of conduct (`CODE_OF_CONDUCT.md`)

#### Enterprise Governance
- [ ] Monthly repo health check (stale branches, open PRs, issue triage)
- [ ] Ruleset drift detection (verify configs match canonical docs)
- [ ] Dependency update policy (when to merge Dependabot PRs)
- [ ] Third-party action review policy (quarterly SHA refresh)
- [ ] Annual security policy review (SECURITY.md, disclosure process)

### Phase 3 Gate

Phase 3 is complete when:
- Org audit log is retained and reviewed quarterly
- Release process includes signed tags and SBOMs
- Contributor model is documented and applied
- SAML SSO is configured (if Enterprise Cloud)
- Quarterly security review is a recurring operational ritual

---

## Maturity Summary

| Dimension | Phase 1 | Phase 2 | Phase 3 |
|-----------|---------|---------|---------|
| Org identity | Created, branded | Verified domain | SSO / enterprise accounts |
| Repo governance | Branch protection + CODEOWNERS | Org-wide rulesets | Drift detection + enforcement |
| Security | SECURITY.md + CodeQL | Push protection + secret scanning | Audit log + SIEM + SBOM |
| Access control | Founder only | Teams + 2FA | SAML + policy enforcement |
| CI/CD | Hardened workflows | Docs validation + secret scan | Signed releases + SBOM generation |
| Release discipline | v0.1.0 tag | Conventional commits | Signed tags + SBOM |
| Contributor model | Solo founder | Documented process | Full onboarding + code of conduct |
| Audit | Ad hoc | Quarterly review | Recurring ritual + compliance evidence |
