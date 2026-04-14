# SZL Holdings — Pinned Repositories Strategy

**Date:** April 2026  
**Inventory source:** GitHub API — `GET /user/repos` authenticated as `stephenlutar2-hash` (April 2, 2026)  
**Status:** Canonical — based on confirmed repo inventory

---

## Navigation

[← Org Setup Package](org-setup-package.md) | [Repo Cleanup Matrix →](repo-cleanup-matrix.md) | [README Index](README.md)

---

## Principle

Pinned repos are the GitHub profile's storefront. A single outstanding repo is more credible than six mediocre ones. Every pinned repo must pass the readiness gate before it is added. Empty slots are preferable to weak repos.

---

## Confirmed Repo Inventory (April 2026)

Based on a live API query of all repos under `stephenlutar2-hash`:

| Repo | Visibility | Archived | Eligible to Pin? | Reason |
|------|-----------|----------|-----------------|--------|
| `szl-holdings-platform` | Public | No | **Yes** | Active, complete, all readiness gate criteria met |
| `szl-holdings` | Public | Yes | **No** | Archived — signals consolidation only, not a showcase |
| `stephenlutar2-hash` | Public | Yes | **No** | Archived personal README repo |
| `inca-intelligence-platform` | Public | Yes | **No** | Archived legacy project |

**Pinnable repos today: 1** (`szl-holdings-platform`)

---

## Six-Slot Pin Selection — Current State

This is the definitive selection for all 6 pin slots on both the personal profile (`stephenlutar2-hash`) and the org profile (`szl-holdings`).

| Slot | Repo | Decision | Rationale |
|------|------|----------|-----------|
| **1** | `szl-holdings/szl-holdings-platform` | **Pin — immediate** | Only repo meeting all readiness gate criteria. Flagship monorepo: 16 artifacts, 120+ DB tables, TypeScript, full CI/CD, CodeQL, SHA-pinned supply chain. Always slot 1. |
| **2** | _(empty)_ | **Do not fill** | `szl-holdings`, `stephenlutar2-hash`, and `inca-intelligence-platform` are all archived — they must not be pinned. No other repo exists to fill this slot. Empty is correct. |
| **3** | _(empty)_ | **Do not fill** | Same as slot 2 — no eligible repo exists. Candidate for `szl-docs` when created and deployed. |
| **4** | _(empty)_ | **Do not fill** | Candidate for `szl-design-system` when published to npm. |
| **5** | _(empty)_ | **Do not fill** | Candidate for `szl-infra` when IaC templates are sanitized as a standalone repo. |
| **6** | _(empty)_ | **Do not fill** | Reserved for a verified OSS utility or product standalone. Must meet readiness gate. |

**Result: 1 of 6 slots pinned (slot 1 only).** Slots 2–6 are empty because the only remaining repos are archived and must not be pinned. This is the correct state — not a gap.

---

## Repos Evaluated and Excluded

| Repo | Reason Not Pinned |
|------|------------------|
| `stephenlutar2-hash/szl-holdings` | Archived. Pinning an archived repo signals stale work, not an active enterprise. |
| `stephenlutar2-hash/stephenlutar2-hash` | Archived personal profile README. Not a product showcase. |
| `stephenlutar2-hash/inca-intelligence-platform` | Archived legacy project absorbed into platform. Would undermine the consolidated brand signal. |

---

## Readiness Gate — Required Before Any Repo Is Pinned

All items must be checked before pinning a repo:

- [ ] README complete per `readme-standard.md` — all required sections, no placeholder text
- [ ] GitHub repo Description field is set (non-empty, max 350 characters)
- [ ] At least 5 relevant GitHub Topics applied
- [ ] Homepage URL set (if repo has a live deployment or docs site)
- [ ] At least one meaningful commit within the last 3 months — OR explicit `maintained` badge in README
- [ ] `SECURITY.md` exists or links to the platform security policy
- [ ] No empty directories, placeholder files, or draft content visible at repo root
- [ ] Builds cleanly if repo contains buildable code (CI passing)
- [ ] Repo is not archived

---

## Slot Promotion — Future Repos

When a new repo is created and reaches readiness, it advances into the first empty slot in priority order:

| Priority Order | Candidate | Trigger for Pinning |
|----------------|-----------|-------------------|
| Slot 2 | `szl-holdings/szl-docs` | Docs site live and published |
| Slot 3 | `szl-holdings/szl-design-system` | npm package published |
| Slot 4 | `szl-holdings/szl-infra` | Bicep templates sanitized and published |
| Slot 5 | _(OSS utility — TBD)_ | First public release tagged |
| Slot 6 | _(Product standalone — TBD)_ | Passes readiness gate review |

Slot 1 (`szl-holdings-platform`) is permanent and does not rotate.

---

## How to Apply Pins

### Org Profile (`szl-holdings`)

1. Navigate to: `github.com/szl-holdings`
2. Click **Edit pinned repositories** (org owners only)
3. Select `szl-holdings-platform` → drag to slot 1
4. Save — leave all other slots empty

### Personal Profile (`stephenlutar2-hash`)

1. Navigate to: `github.com/stephenlutar2-hash`
2. Click **Customize your pins**
3. Select `szl-holdings/szl-holdings-platform` (org repos appear when you are a member)
4. Save — leave all other slots empty

---

## Review Cadence

Review before each enterprise evaluation session and after any new repo reaches readiness. Apply the readiness gate rigorously and advance from the slot promotion table above, in order, as each repo becomes eligible.
