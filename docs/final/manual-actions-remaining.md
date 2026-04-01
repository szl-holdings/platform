# SZL Holdings — Manual Actions Remaining

**Date:** April 2026  
**Context:** All documentation, scripts, and code are complete. The following items require manual execution by the founder (Stephen Lutar) on GitHub.

---

## Priority 1: Repository Settings (15 minutes)

These are configuration changes to the existing GitHub repository.

**Navigate to:** `https://github.com/stephenlutar2-hash/szl-holdings-platform/settings`

- [ ] **Description:** Set to:
  ```
  Platform ecosystem for business observability, AI orchestration, maritime intelligence, and secure execution — built by Stephen Lutar.
  ```
- [ ] **Website:** `https://szlholdings.com`
- [ ] **Topics:** Add: `typescript`, `react`, `nodejs`, `postgresql`, `drizzle-orm`, `expo`, `monorepo`, `pnpm`, `azure`, `ai-orchestration`, `business-observability`, `maritime-intelligence`, `saas`
- [ ] **Issues:** Enable
- [ ] **Wiki/Projects/Discussions:** Disable

*Or run: `scripts/github/update-repo-metadata.sh` (requires `gh auth login`)*

---

## Priority 2: Create Release v0.1.0 (5 minutes)

**Navigate to:** `https://github.com/stephenlutar2-hash/szl-holdings-platform/releases/new`

- [ ] Tag: `v0.1.0`
- [ ] Target: `master`
- [ ] Title: `v0.1.0 — Initial Public Platform Release`
- [ ] Description: Copy from `docs/releases/v0.1.0.md`
- [ ] Mark as latest release: ✅

*Or run: `scripts/github/create-release.sh v0.1.0` (requires `gh auth login`)*

---

## Priority 3: Bootstrap Issue Labels (10 minutes)

**Navigate to:** `https://github.com/stephenlutar2-hash/szl-holdings-platform/labels`

Create all labels from `ops/github/manual-checklist.md` section 6.

*Or run: `scripts/github/bootstrap-labels.sh` (requires `gh auth login`)*

---

## Priority 4: Create Profile README Repository (15 minutes)

- [ ] Create repo: `https://github.com/new` → name: `stephenlutar2-hash`
- [ ] Set to Public
- [ ] Add `profile-readme/README.md` content as the `README.md`

See `profile-readme/PROFILE_REPO_SETUP.md` for step-by-step instructions.

---

## Priority 5: Update GitHub Profile Settings (5 minutes)

**Navigate to:** `https://github.com/settings/profile`

Values from `ops/github/profile-values.md`:

- [ ] Name: `Stephen Lutar`
- [ ] Bio: `Building premium command-grade platforms — SZL Holdings`
- [ ] Company: `SZL Holdings`
- [ ] Website: `https://szlholdings.com`
- [ ] LinkedIn: `linkedin.com/in/stephen-l-279315240`

---

## Priority 6: Branch Protection (5 minutes)

**Navigate to:** `https://github.com/stephenlutar2-hash/szl-holdings-platform/settings/branches`

- [ ] Add rule for `master` branch
- [ ] Require pull request: ✅ (recommended)
- [ ] Require status checks: `ci`, `build` (if CI is active)
- [ ] Include administrators: ✅
- [ ] No force pushes: ✅
- [ ] No deletions: ✅

---

## Total Estimated Time

| Action | Time |
|--------|------|
| Repository settings + topics | 15 min |
| Create release v0.1.0 | 5 min |
| Bootstrap labels | 10 min |
| Profile README repo | 15 min |
| Profile settings | 5 min |
| Branch protection | 5 min |
| **Total** | **~55 minutes** |

---

## Using the GitHub CLI (Faster)

If you have the GitHub CLI installed:

```bash
# Authenticate once
gh auth login

# Apply all repository settings and create release
./scripts/github/update-repo-metadata.sh
./scripts/github/create-release.sh v0.1.0
./scripts/github/bootstrap-labels.sh
```

Profile repo creation and profile settings still require manual steps (GitHub CLI does not support profile README repo creation directly).
