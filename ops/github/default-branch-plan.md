# SZL Holdings — Default Branch Plan

**Version:** 2.0
**Date:** May 2026
**Authority:** Stephen Lutar, Founder

---

## 1. Current Branch State

| Repository | Default Branch | Notes |
|------------|----------------|-------|
| `szl-holdings-platform` | `main` | Renamed from `master` on 2026-05-16 to unify with the rest of the org |
| `stephenlutar2-hash` (profile README) | `main` | Unchanged |
| All other `szl-holdings/*` repos | `main` | Unchanged |

**Assessment:** All repositories in the `szl-holdings` GitHub org now use `main` as the default branch. There is no remaining branch-name drift.

---

## 2. Branch Strategy Declaration

### 2.1 Flagship Platform Repo (`szl-holdings-platform`)

**Default branch:** `main`

**Rationale:**
- `main` is the org-wide convention used by every other `szl-holdings/*` repo.
- Aligning on a single branch name removes a small but visible inconsistency for outside reviewers and simplifies org-wide tooling/scripts that assume one branch name.
- The historical name `master` carried no functional meaning — the rename is a cosmetic / consistency change only.

**Branch policy:**
```
main (single published branch — always clean and buildable)
  └── No feature branches are published
  └── No draft/WIP branches are exposed publicly
  └── All development happens in Replit workspace
  └── Mirror pushes are atomic — not incremental syncs
```

### 2.2 Profile README Repo (`stephenlutar2-hash`)

**Default branch:** `main`

**Rationale:**
- GitHub creates new repos with `main` as default.
- The profile README repo is a simple single-file repo — no branching complexity.

---

## 3. Branch Protection Configuration

### For `szl-holdings-platform` (Main)

Apply the following branch protection rules at:
`https://github.com/szl-holdings/szl-holdings-platform/settings/branches`

| Rule | Setting | Rationale |
|------|---------|-----------|
| **Target branch** | `main` | Protect the published mirror branch |
| **Require pull request** | ✅ Enable | No direct pushes — all changes via PR |
| **Required approvals** | 1 (self-review OK for solo founder) | Enforce deliberate review |
| **Require status checks** | Enable if CI is active | Block broken builds |
| **Include administrators** | ✅ Enable | No bypass — even for founder |
| **No force pushes** | ✅ Enable | Prevent history rewriting on public branch |
| **No deletions** | ✅ Enable | Prevent accidental branch deletion |

**CLI command (requires `gh auth login`):**
```bash
gh api repos/szl-holdings/szl-holdings-platform/branches/main/protection \
  --method PUT \
  --field required_status_checks=null \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false
```

### For `stephenlutar2-hash` (Main)

Simple protection — no PR requirement needed for a profile README repo:

| Rule | Setting |
|------|---------|
| **No force pushes** | ✅ Enable |
| **No deletions** | ✅ Enable |
| **Require pull request** | Optional — skip for simplicity |

---

## 4. Branch Naming Convention (Future)

If additional branches are ever created (for staging, hotfixes, or documentation):

| Branch Type | Pattern | Example |
|-------------|---------|---------|
| Mirror releases | `release/v{version}` | `release/v0.2.0` |
| Documentation updates | `docs/{topic}` | `docs/trust-center-update` |
| Hotfix | `hotfix/{issue}` | `hotfix/security-disclosure` |

**Important:** These naming conventions are for future reference only. Currently, no secondary branches are published. All branching happens in the Replit workspace before mirror push.

---

## 5. Rename History — `master` → `main` (2026-05-16)

The platform repo was renamed from `master` to `main` to unify naming across the org.

### Step 1: Rename via GitHub UI
```
Settings → Branches → Default branch → Rename master → main
```
GitHub automatically retargets open PRs and creates a permanent `master → main` redirect.

### Step 2: Update local clones
```bash
git branch -m master main
git fetch origin
git branch -u origin/main main
git remote set-head origin -a
```

### Step 3: In-repo references updated in the same task
- `.github/workflows/*.yml` — all push/pull-request triggers now target `branches: [main]` only.
- `ops/github/repo-settings.json`, `ops/github/repo-metadata.json` — `branch_protection.branch` set to `main`.
- `ops/github/push-workflows.sh` — pushes to `main` only.
- `ops/github/configure-branch-protection.sh` — applies protection to `main` only.
- `ops/github/manual-checklist.md` — UI checklist now uses `main`.
- `ops/github/wiki-manual-steps.md` — raw image URL updated to `/main/`.
- `ops/github/github-operating-model.md` — branch table simplified to `main`.
- `profile-readme/README.md` — featured-repo links updated to `/main/`.
- `docs/audits/github-org.md`, `docs/audits/github-audit-v9.md` — audit entries updated.

### Step 4: Verify
```bash
gh repo view szl-holdings/szl-holdings-platform --json defaultBranchRef
```

---

## 6. Current Decision

**Decision:** `main` is the default and only published branch for `szl-holdings-platform`. The `master` branch has been retired.

### 6.1 Operator script — fully retire the remote `master` ref

GitHub keeps a `master → main` redirect after a default-branch rename, but the
old `master` branch ref itself is *not* deleted automatically. To finish the
retirement on the remote, run:

```bash
# Dry-run — verifies default branch, checks for the stale ref,
# refuses to act if any open PRs still target master,
# and prints the exact gh / curl delete commands.
GH_TOKEN=<pat> bash ops/github/retire-master-branch.sh

# Apply — actually deletes the ref.
GH_TOKEN=<pat> bash ops/github/retire-master-branch.sh --apply
```

The script is idempotent (exits 0 if `master` is already gone) and refuses
to delete if any open PR is still based on `master`.

**Reviewed by:** Stephen Lutar
**Date:** May 2026
**Next review:** Before v1.0.0 release

---

*Maintained by: Stephen Lutar, Founder — SZL Holdings*
*See also: [Manual Checklist](manual-checklist.md) | [Repo Canonicalization Plan](../../docs/audit/repo-canonicalization-plan.md)*
