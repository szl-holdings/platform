# SZL Holdings — Repository Cleanup Matrix

**Date:** April 2026  
**Inventory source:** GitHub API — `GET /user/repos` authenticated as `stephenlutar2-hash` (April 2, 2026)  
**Status:** Complete enumeration — all 4 confirmed repos classified

---

## Navigation

[← Org Setup Package](org-setup-package.md) | [Pinned Repos Strategy →](pinned-repos-strategy.md) | [README Standard →](readme-standard.md) | [README Index](README.md)

---

## Complete Repo Inventory — All Repos Classified

This table contains every repository found on the account. No repos are deferred or unclassified.

| # | Repository | Visibility | Archived | Fork | Disposition | Action | Priority |
|---|------------|-----------|----------|------|-------------|--------|----------|
| 1 | `stephenlutar2-hash/szl-holdings-platform` | Public | No | No | **Keep — Transfer to org** | Transfer to `szl-holdings/szl-holdings-platform`, pin as slot 1 | **Immediate** |
| 2 | `stephenlutar2-hash/szl-holdings` | Public | Yes | No | **Archive confirmed** | Already archived. Verify description says "consolidated into platform." No further action needed. | Done |
| 3 | `stephenlutar2-hash/stephenlutar2-hash` | Public | Yes | No | **Archive confirmed** | Already archived. Personal profile README repo. No further action needed. | Done |
| 4 | `stephenlutar2-hash/inca-intelligence-platform` | Public | Yes | No | **Archive confirmed** | Already archived. Previous project, absorbed into platform. No further action needed. | Done |

**Total repos:** 4  
**Active (not archived):** 1 (`szl-holdings-platform`)  
**Already archived:** 3  
**Forks:** 0  
**Private repos:** 0

---

## Detailed Disposition — Repo by Repo

### Repo 1: `stephenlutar2-hash/szl-holdings-platform` — Transfer to Org

**Current state:** Public, active, not archived. Contains the full SZL Holdings monorepo (16 artifacts, 120+ tables, full CI/CD, CodeQL, release pipeline).

**Disposition:** Transfer to `szl-holdings/szl-holdings-platform`

**Actions at execution:**
1. Ensure `szl-holdings` GitHub org exists (see org-setup-package.md)
2. Navigate to: `github.com/stephenlutar2-hash/szl-holdings-platform` → Settings → Danger Zone → Transfer
3. Target: `szl-holdings`
4. After transfer: update any local git remotes to `git@github.com:szl-holdings/szl-holdings-platform.git`
5. After transfer: pin as slot 1 on `szl-holdings` org profile
6. Verify `.github/profile/README.md` links all resolve under `szl-holdings/`

**Branches / PRs / Issues:** Review open items before transfer. GitHub automatically redirects the old URL for 1 year.

**Secrets:** `AZURE_CREDENTIALS`, `REGISTRY_USERNAME`, `REGISTRY_PASSWORD` — re-add under the new org repo after transfer (secrets do not transfer automatically).

---

### Repo 2: `stephenlutar2-hash/szl-holdings` — Already Archived

**Current state:** Public, archived, description set to "[ARCHIVED] Code consolidated into the Replit SZL Holdings Platform workspace. This repo is read-only."

**Disposition:** No further action required. Archive is already in place with correct description. The repo serves as a permanent redirect signal for any external links that pointed to this repo before the platform consolidation.

**Retention:** Indefinite. GitHub archived repos are read-only, do not accept PRs or issues, and do not appear in contributor activity. Cost: $0. Risk: none.

---

### Repo 3: `stephenlutar2-hash/stephenlutar2-hash` — Already Archived

**Current state:** Public, archived, description set to "[ARCHIVED] Code consolidated into the Replit SZL Holdings Platform workspace. This repo is read-only."

**Disposition:** No further action required. This was the personal profile README repo (the README.md in this repo auto-renders on `github.com/stephenlutar2-hash`). Because it is archived, the personal profile README is still displayed but cannot be updated. If a personal profile README update is ever needed, unarchive, edit, and re-archive.

**Note:** The org profile README is now the primary showcase surface — see `.github/profile/README.md` in the org's `.github` repo.

---

### Repo 4: `stephenlutar2-hash/inca-intelligence-platform` — Already Archived

**Current state:** Public, archived, description set to "[ARCHIVED] Code consolidated into the Replit SZL Holdings Platform workspace. This repo is read-only."

**Disposition:** No further action required. Previous product project, fully absorbed into the `szl-holdings-platform` monorepo. Archive is correct and permanent.

---

## Future Repos — Classification at Creation Time

When new repos are created (see pinned-repos-strategy.md slots 2–6), apply the following classification at creation:

| Planned Repo | Target Namespace | Type | Disposition |
|-------------|-----------------|------|-------------|
| `szl-docs` | `szl-holdings` | Docs site | Active — pin when docs site deploys |
| `szl-design-system` | `szl-holdings` | npm package | Active — pin when package publishes |
| `szl-infra` | `szl-holdings` | IaC templates | Active — pin when templates are sanitized |
| _(OSS utility — TBD)_ | `szl-holdings` | Open source | Active — pin when tool is released |
| _(Product standalone — TBD)_ | `szl-holdings` | Product | Active — evaluate individually |

---

## Archive Procedure (Reference)

When a repo needs to be archived:

1. Set repo description to: `[ARCHIVED] Code consolidated into the Replit SZL Holdings Platform workspace. This repo is read-only.`
2. Navigate to: repo → Settings → Danger Zone → Archive this repository
3. Confirm
4. Log the archive in the **Archive Registry** below

---

## Archive Registry

| Repo | Archived Date | Reason | Archived By |
|------|--------------|--------|-------------|
| `stephenlutar2-hash/szl-holdings` | March 2026 | Consolidated into platform monorepo | Stephen Lutar |
| `stephenlutar2-hash/stephenlutar2-hash` | March 2026 | Personal README — profile replaced by org | Stephen Lutar |
| `stephenlutar2-hash/inca-intelligence-platform` | March 2026 | Absorbed into platform monorepo | Stephen Lutar |

---

## Summary

| Status | Count | Repos |
|--------|-------|-------|
| Active — transfer to org | 1 | `szl-holdings-platform` |
| Already archived — no action | 3 | `szl-holdings`, `stephenlutar2-hash`, `inca-intelligence-platform` |
| **Total classified** | **4** | **All repos enumerated** |
