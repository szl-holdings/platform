# Repository Ruleset

> SZL Holdings Platform Governance · April 2026

GitHub repository rulesets provide a more granular and auditable alternative to classic branch protection rules. This document specifies the recommended ruleset configuration for the SZL Holdings platform repository.

---

## Recommended Ruleset: `Platform Master Protection`

Navigate to **Settings → Rules → Rulesets → New ruleset** and configure:

### Scope
- **Enforcement status:** Active
- **Target branches:** Default branch (`master`)

### Rules

| Rule | Setting |
|------|---------|
| Restrict creations | Disabled — branches can be created |
| Restrict updates | **Enabled** — only via pull request |
| Restrict deletions | **Enabled** — default branch cannot be deleted |
| Require linear history | **Enabled** — no merge commits |
| Require signed commits | Recommended — enable when team has GPG keys set up |
| Require a pull request before merging | **Enabled** |
| — Required approvals | 1 |
| — Dismiss stale approvals on push | **Enabled** |
| — Require code owner review | **Enabled** |
| — Require last push approval | **Enabled** |
| — Require conversation resolution | **Enabled** |
| Require status checks to pass | **Enabled** |
| — Required checks | `CI Gate`, `E2E Gate`, `Lighthouse Gate`, `dependency-review`, `analyze` |
| — Require up-to-date branch | **Enabled** |
| Block force pushes | **Enabled** |
| Require deployments to succeed | Optional — enable when staging deployment is stable |

### Bypass Actors

No bypass actors recommended for a single-founder team. The goal is that even the admin must go through the PR process.

---

## Ruleset vs. Branch Protection

GitHub rulesets (introduced 2023) supersede classic branch protection rules and offer:
- Better audit trail (ruleset evaluations are logged)
- Multi-branch targeting via patterns
- Organization-level inheritance
- REST API management

**Recommendation:** Migrate from classic branch protection to rulesets during the next GitHub settings review.

---

*SZL Holdings Platform Governance · April 2026*
