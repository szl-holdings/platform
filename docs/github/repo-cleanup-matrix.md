# SZL Holdings — Repository Cleanup Matrix

**Date:** April 2026  
**Last updated:** April 25, 2026 (post-transfer audit)  
**Inventory source:** GitHub API — `GET /user/repos` authenticated as `stephenlutar2-hash` (April 2, 2026); confirmed via `GET /orgs/szl-holdings/repos` (April 25, 2026)  
**Status:** Complete enumeration — all repos classified. Transfer complete.

---

## Navigation

[← Org Setup Package](org-setup-package.md) | [Pinned Repos Strategy →](pinned-repos-strategy.md) | [README Standard →](readme-standard.md) | [README Index](README.md)

---

## Complete Repo Inventory — All Repos Classified

This table contains every repository found on the account. No repos are deferred or unclassified.

| # | Repository | Visibility | Archived | Fork | Disposition | Action | Priority |
|---|------------|-----------|----------|------|-------------|--------|----------|
| 1 | `szl-holdings/szl-holdings-platform` | Public | No | No | **Active — transferred ✅** | Transfer complete. Live at `szl-holdings/szl-holdings-platform`. Org profile links confirmed. | **Done** |
| 2 | `stephenlutar2-hash/szl-holdings` | Public | Yes | No | **Archive confirmed** | Already archived. Verify description says "consolidated into platform." No further action needed. | Done |
| 3 | `stephenlutar2-hash/stephenlutar2-hash` | Public | Yes | No | **Archive confirmed** | Already archived. Personal profile README repo. No further action needed. | Done |
| 4 | `stephenlutar2-hash/inca-intelligence-platform` | Public | Yes | No | **Archive confirmed** | Already archived. Previous project, absorbed into platform. No further action needed. | Done |
| 5 | `szl-holdings/.github` | Public | No | No | **Active — org profile ✅** | Org profile README live. Updated April 25, 2026. | Done |

**Total repos (under `szl-holdings` org):** 2 (`szl-holdings-platform`, `.github`)  
**Active (not archived):** 2  
**Archived:** 3 (under `stephenlutar2-hash/` personal account — retained as permanent redirect)  
**Forks:** 0  
**Private repos:** 0

---

## Detailed Disposition — Repo by Repo

### Repo 1: `szl-holdings/szl-holdings-platform` — Transfer Complete ✅

**Current state:** Public, active, not archived. Now live at `szl-holdings/szl-holdings-platform`. Contains the full SZL Holdings monorepo (14 registered artifacts, 798 tables, full CI/CD, CodeQL, release pipeline).

**Disposition:** ✅ Transfer complete. No further action required.

**Post-transfer checklist:**
- [x] Repo lives at `szl-holdings/szl-holdings-platform`
- [x] Org profile README links resolve correctly under `szl-holdings/`
- [x] Description updated to reflect 15 artifacts (was 14; A11oy added)
- [ ] Secrets (`AZURE_CREDENTIALS`, `REGISTRY_USERNAME`, `REGISTRY_PASSWORD`) — verify these have been re-added in Settings → Secrets (secrets do not transfer automatically)
- [ ] Pin as slot 1 on `szl-holdings` org profile (requires org admin access in GitHub UI)

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
| Active under `szl-holdings` org | 2 | `szl-holdings-platform`, `.github` |
| Archived — no action | 3 | `szl-holdings`, `stephenlutar2-hash`, `inca-intelligence-platform` |
| **Total classified** | **5** | **All repos enumerated (updated April 25, 2026)** |
