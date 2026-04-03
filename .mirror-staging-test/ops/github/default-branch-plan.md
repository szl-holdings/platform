# SZL Holdings — Default Branch Plan

**Version:** 1.0  
**Date:** April 2026  
**Authority:** Stephen Lutar, Founder

---

## 1. Current Branch State

| Repository | Current Default Branch | Intended Default Branch | Action Required |
|------------|------------------------|-------------------------|-----------------|
| `szl-holdings-platform` | `master` | `master` | No change — already correct |
| `stephenlutar2-hash` (profile README) | `main` | `main` | No change — already correct |

**Assessment:** The default branch configuration is already aligned with the intended strategy. No migration is needed.

---

## 2. Branch Strategy Declaration

### 2.1 Flagship Platform Repo (`szl-holdings-platform`)

**Default branch:** `master`

**Rationale:**
- `master` was the chosen branch at project inception and is already in use
- Changing to `main` would require updating all documentation references, mirror scripts, and automation — unnecessary churn
- The branch name `master` has no bearing on credibility for investors or technical evaluators
- Consistency within the project is more important than convention alignment

**Branch policy:**
```
master (single published branch — always clean and buildable)
  └── No feature branches are published
  └── No draft/WIP branches are exposed publicly
  └── All development happens in Replit workspace
  └── Mirror pushes are atomic — not incremental syncs
```

### 2.2 Profile README Repo (`stephenlutar2-hash`)

**Default branch:** `main`

**Rationale:**
- GitHub creates new repos with `main` as default
- The profile README repo is a simple single-file repo — no branching complexity
- `main` is appropriate for this use case

---

## 3. Branch Protection Configuration

### For `szl-holdings-platform` (Master)

Apply the following branch protection rules at:  
`https://github.com/stephenlutar2-hash/szl-holdings-platform/settings/branches`

| Rule | Setting | Rationale |
|------|---------|-----------|
| **Target branch** | `master` | Protect the published mirror branch |
| **Require pull request** | ✅ Enable | No direct pushes — all changes via PR |
| **Required approvals** | 1 (self-review OK for solo founder) | Enforce deliberate review |
| **Require status checks** | Enable if CI is active | Block broken builds |
| **Include administrators** | ✅ Enable | No bypass — even for founder |
| **No force pushes** | ✅ Enable | Prevent history rewriting on public branch |
| **No deletions** | ✅ Enable | Prevent accidental branch deletion |

**Note:** For a founder-run monorepo with mirror pushes, branch protection rules primarily protect against accidental force pushes and deletions rather than enforcing PR-based workflows. Direct mirror push (`git push -f origin master`) is acceptable for the initial setup but should transition to PR-based updates as the team grows.

**CLI command (requires `gh auth login`):**
```bash
gh api repos/stephenlutar2-hash/szl-holdings-platform/branches/master/protection \
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

## 5. Migration Steps (If Default Branch Change Is Ever Needed)

If a decision is made to rename `master` to `main` in the future, follow these steps:

### Step 1: Rename via GitHub UI
```
Settings → Branches → Default branch → Rename
```

### Step 2: Update Local/Replit References
```bash
# In Replit workspace
git branch -m master main
git fetch origin
git branch -u origin/main main
git remote set-head origin -a
```

### Step 3: Update All Script References

Files that reference `master`:
- `scripts/github/create-release.sh`
- `ops/github/commands.sh`
- `ops/github/commands.ps1`
- `docs/public/public-mirror-policy.md`
- `docs/audit/repo-canonicalization-plan.md`
- `ops/github/manual-checklist.md`

### Step 4: Update GitHub Actions

Any workflow YAML files in `.github/workflows/` that specify `branches: [master]` must be updated to `branches: [main]`.

### Step 5: Verify

```bash
gh repo view stephenlutar2-hash/szl-holdings-platform --json defaultBranchRef
```

---

## 6. Current Decision: No Change Required

**Decision:** Keep `master` as the default branch for `szl-holdings-platform`.

**Reviewed by:** Stephen Lutar  
**Date:** April 2026  
**Next review:** Before v1.0.0 release

---

*Maintained by: Stephen Lutar, Founder — SZL Holdings*  
*See also: [Manual Checklist](manual-checklist.md) | [Repo Canonicalization Plan](../../docs/audit/repo-canonicalization-plan.md)*
