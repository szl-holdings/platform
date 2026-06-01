# SZL Holdings — GitHub Governance Documentation

This directory contains all documentation for the SZL Holdings GitHub presence, governance, security posture, and enterprise maturity strategy.

---

## Documents

| Document | Purpose |
|----------|---------|
| [org-setup-package.md](./org-setup-package.md) | Org creation checklist, canonical org name, profile values, governance model, membership/roles, branding standards |
| [pinned-repos-strategy.md](./pinned-repos-strategy.md) | Pinned repo strategy — which 6 repos, in what order, and the readiness gate for pinning |
| [repo-cleanup-matrix.md](./repo-cleanup-matrix.md) | Complete repo classification matrix — flagship, active product, archive, delete, rename, merge |
| [readme-standard.md](./readme-standard.md) | README standard for all public repos — required sections, flagship premium template, archived annotation template |
| [security-governance-baseline.md](./security-governance-baseline.md) | SECURITY.md template, CODEOWNERS template, CONTRIBUTING.md template, issue templates |
| [enterprise-rulesets.md](./enterprise-rulesets.md) | Enterprise-style ruleset configs — flagship/production tier, docs tier, experiment tier, bypass policy |
| [actions-ci-audit.md](./actions-ci-audit.md) | Actions/CI audit — workflow inventory, security findings, hardened workflow templates, secrets inventory |
| [gist-policy.md](./gist-policy.md) | Gist policy — acceptable use, unacceptable patterns, approval gate, audit protocol |
| [manual-ui-checklist.md](./manual-ui-checklist.md) | Complete manual UI checklist — every GitHub setting requiring the web UI, with exact values and plan tiers |
| [enterprise-maturity-path.md](./enterprise-maturity-path.md) | Three-phase enterprise maturity path — Phase 1 (foundation), Phase 2 (trust & verification), Phase 3 (enterprise discipline) |

---

## Related Files

| Location | Purpose |
|----------|---------|
| `.github/profile/README.md` | Org profile README (deployed to `szl-holdings/.github/profile/README.md`) |
| `.github/CODEOWNERS` | Code ownership declarations |
| `.github/workflows/` | All CI/CD workflow files |
| `.github/ISSUE_TEMPLATE/` | Issue templates |
| `.github/PULL_REQUEST_TEMPLATE.md` | PR template |
| `SECURITY.md` | Root security policy |
| `CONTRIBUTING.md` | Root contributing guidelines |
| `ops/github/` | Operations runbooks (manual checklist, CLI commands, settings) |
| `profile-readme/README.md` | Personal profile README for `stephenlutar2-hash` |

---

## Start Here

**For Phase 1 execution:** Follow [manual-ui-checklist.md](./manual-ui-checklist.md) top to bottom.

**For org setup:** Start with [org-setup-package.md](./org-setup-package.md).

**For repo governance:** Reference [enterprise-rulesets.md](./enterprise-rulesets.md) and [security-governance-baseline.md](./security-governance-baseline.md).

**For README updates:** Use templates in [readme-standard.md](./readme-standard.md).
