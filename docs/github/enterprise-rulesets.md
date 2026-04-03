# SZL Holdings — Enterprise-Style Rulesets & Branch Protection

**Date:** April 2026  
**Status:** Canonical  
**Applies to:** All repos in `szl-holdings` org

---

## Overview

GitHub rulesets (available on Free and Pro for personal accounts, org-level on Team+) define enforceable branch and tag protection policies. This document specifies the ruleset configuration for each repo tier.

---

## Tier 1 — Flagship / Production Repos

**Applies to:** `szl-holdings-platform`, any future production product repos

### Ruleset: `flagship-production`

**Target branches:** `master`, `main`  
**Enforcement status:** Active

| Rule | Setting | Rationale |
|------|---------|-----------|
| Require pull request | Enabled | No direct pushes to production branch |
| Required approvals | 1 minimum | At least one explicit review |
| Dismiss stale reviews | Enabled | New commits invalidate old approvals |
| Require code owner review | Enabled | CODEOWNERS paths must approve |
| Require status checks | Enabled | CI must pass before merge |
| Required checks | `CI`, `Build Check`, `CodeQL Analysis`, `Dependency Review` | All critical gates |
| Require branches up to date | Enabled | Run checks against latest base |
| Require conversation resolution | Enabled | No unresolved review threads |
| Block force pushes | Enabled | Prevent history rewriting |
| Block deletions | Enabled | Branch cannot be deleted |
| Require linear history | Enabled | Squash or rebase merges only |
| Restrict push access | Enabled | Only org owners can push directly (emergency) |
| Bypass list | Org owners only | Break-glass: founder only, audited |

### Branch Strategy

```
master (protected — production branch)
  → All changes via PR only
  → Squash merge (linear history)
  → No WIP commits on master
  → Tags: v0.x.x for releases
```

### Tag Protection

| Rule | Setting |
|------|---------|
| Protect `v*` tags | Enabled |
| Require signed commits for tags | Recommended (Phase 2) |
| Only owners can create release tags | Enabled |

---

## Tier 2 — Docs / Public Content Repos

**Applies to:** `szl-docs`, org README repo, documentation-only repos

### Ruleset: `docs-content`

**Target branches:** `main`  
**Enforcement status:** Active

| Rule | Setting | Rationale |
|------|---------|-----------|
| Require pull request | Enabled | Track all changes |
| Required approvals | 0 (or 1 if contributors) | Can self-merge for docs |
| Require status checks | Enabled | Basic validation (link checks, build) |
| Required checks | `Docs Validate` | Lighter gate than production |
| Block force pushes | Enabled | Maintain clean history |
| Block deletions | Enabled | No accidental branch deletion |
| Require linear history | Enabled | Clean commit trail |

---

## Tier 3 — Sandbox / Experiment Repos

**Applies to:** Any experiment, prototype, or isolated research repo

### Ruleset: `experiment-sandbox`

**Target branches:** `main`, `master`  
**Enforcement status:** Active (but looser)

| Rule | Setting | Rationale |
|------|---------|-----------|
| Require pull request | Disabled | Fast iteration allowed |
| Require status checks | Optional | May not have CI configured |
| Block force pushes | Enabled | Still prevent rebase chaos |
| Block deletions | Disabled | Can clean up freely |

**Labeling requirement:** Every sandbox repo must have:
- Topic: `experiment` or `sandbox`
- README must state: "This is an experiment/prototype. Not for production use."

---

## Bypass Policy

### Who Can Bypass Rules

| Role | Bypass Scope | Audit Required |
|------|-------------|---------------|
| Org Owner (Stephen Lutar) | All rules — emergency only | Yes — document in commit message |
| GitHub Support | N/A — contact for platform issues | N/A |
| No other roles | — | — |

**Policy:** Bypasses are break-glass only. Any bypass must be documented in the commit or PR message with reason. Regular use of bypass is a governance failure.

---

## Manual Configuration Steps (GitHub Web UI)

### Repository Rulesets (GitHub Pro / Team tier)

1. Navigate to: `github.com/szl-holdings/szl-holdings-platform/settings/rules`
2. Click **New ruleset**
3. Name: `flagship-production`
4. Enforcement status: Active
5. Target: Include by pattern → `master`, `main`
6. Apply rules per Tier 1 table above

### Branch Protection (Free tier fallback)

If rulesets are not available on the current plan, use branch protection rules:

1. Navigate to: `github.com/szl-holdings/szl-holdings-platform/settings/branches`
2. Click **Add rule**
3. Branch name pattern: `master`
4. Apply settings per Tier 1 table above (note: bypass settings differ from rulesets)

### Plan Considerations

| Feature | Free | Pro | Team | Enterprise Cloud |
|---------|------|-----|------|-----------------|
| Branch protection | ✅ | ✅ | ✅ | ✅ |
| Repository rulesets | ✅ (limited) | ✅ | ✅ | ✅ (org-wide) |
| Required status checks | ✅ | ✅ | ✅ | ✅ |
| Code owner review | ✅ | ✅ | ✅ | ✅ |
| Org-wide rulesets | ❌ | ❌ | ✅ | ✅ |
| Require signed commits | ✅ | ✅ | ✅ | ✅ |

**Phase 1 recommendation:** Free org plan with branch protection rules. Upgrade to Team when org has 2+ members.
