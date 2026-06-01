# SZL Holdings — Manual Actions Remaining

**Date:** April 2026 (Updated — Phase 3 Complete)  
**Context:** All documentation, scripts, code, screenshots, and media pipeline are complete. Phase 3 is done. The following items require manual execution by the founder (Stephen Lutar) on GitHub — these are UI clicks only, no further development work needed.

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
- [ ] Bio: `Founder building Lyte, Alloy, and Vessels at SZL Holdings. Business observability, AI systems, and secure operations.`
- [ ] Company: `SZL Holdings`
- [ ] Location: `New York, NY`
- [ ] Website: `https://szlholdings.com`
- [ ] LinkedIn: `linkedin.com/in/stephen-l-279315240`

**Profile Toggles (same page or github.com/settings/appearance):**
- [ ] Display current local time: ON
- [ ] Show achievements: ON
- [ ] Include private contributions in contribution graph: ON
- [ ] Make profile private: OFF

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
| Profile settings + toggles | 5 min |
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

---

## Phase 3 Additions — New Actions

These actions were identified or created during Phase 3 of the GitHub overhaul.

### Upload Social Preview Image

1. Go to: `https://github.com/stephenlutar2-hash/szl-holdings-platform/settings`
2. Scroll to **Social preview**
3. Upload: `docs/media/social-preview/org-social-preview.jpg`
4. Verify preview renders

*Estimated time: 2 minutes*

---

### Push Wiki Seed Pages

See `docs/final/wiki-launch-checklist.md` for full steps.

```bash
git clone https://github.com/stephenlutar2-hash/szl-holdings-platform.wiki.git wiki-staging
cd wiki-staging
cp /path/to/docs/wiki/*.md .
mkdir -p assets && cp /path/to/docs/wiki/assets/* assets/
git add -A && git commit -m "feat: wiki seed"
git push origin master
```

*Estimated time: 15 minutes*

---

### Create GitHub Organization

See `docs/final/org-launch-checklist.md` for full steps.

1. Go to: `https://github.com/organizations/plan`
2. Create org: `szl-holdings`
3. Upload avatar, create `.github` profile repo, pin flagship repo

*Estimated time: 45–60 minutes*

---

### Create GitHub Stars Lists

See `docs/final/stars-system-summary.md` for full list recommendations.

1. Go to: `https://github.com/stars`
2. Create 5 lists: Observability & Ops, AI Systems, Maritime, TypeScript Platform, Security Ops
3. Star 5+ repos per list

*Estimated time: 30 minutes*

---

## Updated Total Estimated Time

| Action | Time |
|--------|------|
| Repository settings + topics | 15 min |
| Create release v0.1.0 | 5 min |
| Bootstrap labels | 10 min |
| Profile README repo | 15 min |
| Profile settings + toggles | 5 min |
| Branch protection | 5 min |
| Upload social preview | 2 min |
| Enable wiki + push seed | 15 min |
| Create GitHub org | 45 min |
| Create stars lists | 30 min |
| **Total** | **~2.5 hours** |
