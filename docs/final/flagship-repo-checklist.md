# Flagship Repo Checklist

**Repo:** `stephenlutar2-hash/szl-holdings-platform`  
**Date:** April 2026  
**Estimated time:** 30–40 minutes

---

## Pre-Flight

- [ ] Confirm repo URL: `https://github.com/stephenlutar2-hash/szl-holdings-platform`
- [ ] Confirm repo is **not archived** (if archived, go to Settings → General → Danger Zone → Unarchive)
- [ ] Confirm `README.md` is current (Phase 2 rewrite is in place)
- [ ] Have `docs/releases/v0.1.0.md` ready for the release notes

---

## Step 1: Unarchive (If Needed)

If the repo is archived:
1. Go to: `https://github.com/stephenlutar2-hash/szl-holdings-platform/settings`
2. Scroll to **Danger Zone**
3. Click **Unarchive this repository**
4. Type the repo name to confirm

---

## Step 2: Update About / Description

1. Go to: `https://github.com/stephenlutar2-hash/szl-holdings-platform`
2. Click the gear icon next to "About" (top right of repo page)
3. Set:

| Field | Value |
|-------|-------|
| Description | `Platform ecosystem for business observability, AI orchestration, maritime intelligence, and secure execution — built by Stephen Lutar.` |
| Website | `https://szlholdings.com` |
| Topics | `typescript`, `react`, `nodejs`, `postgresql`, `drizzle-orm`, `expo`, `monorepo`, `pnpm`, `azure`, `ai-orchestration`, `business-observability`, `maritime-intelligence`, `saas` |

4. Check: **Releases**, **Packages** (show releases when created)
5. Save changes

**Or via script:**
```bash
gh auth login
bash scripts/github/update-repo-metadata.sh
```

---

## Step 3: Switch Default Branch to `main` (If Needed)

If the default branch is `master`:
1. Go to: Settings → Branches
2. Change default branch to `main` (if `main` exists)
3. If `main` doesn't exist, rename `master`:
   ```bash
   git checkout master
   git checkout -b main
   git push origin main
   gh repo edit --default-branch main
   ```

---

## Step 4: Publish First Release (v0.1.0)

1. Go to: `https://github.com/stephenlutar2-hash/szl-holdings-platform/releases/new`
2. Tag: `v0.1.0`
3. Target: `master` or `main` (whichever is default)
4. Title: `v0.1.0 — Initial Public Platform Release`
5. Description: Copy content from `docs/releases/v0.1.0.md`
6. Check: **Set as the latest release**
7. Publish release

**Or via script:**
```bash
bash scripts/github/create-release.sh v0.1.0
```

---

## Step 5: Upload Social Preview

1. Go to: Settings → General → Social preview
2. Upload: `docs/media/social-preview/org-social-preview.jpg` (or `landing-hero-new.jpg`)
3. Verify it shows in preview

---

## Step 6: Enable Issues

1. Go to: Settings → Features
2. Enable: **Issues**
3. Disable: **Projects**, **Wikis** (unless pushing wiki — then enable)
4. Disable: **Discussions** (unless wanted)

---

## Step 7: Enable Wiki (If Pushing Wiki Content)

1. Go to: Settings → Features → Enable Wiki
2. Navigate to the Wiki tab
3. Create the Home page (paste from `docs/wiki/Home.md`)
4. For additional pages, use the GitHub Wiki editor or push via git:
   ```bash
   git clone https://github.com/stephenlutar2-hash/szl-holdings-platform.wiki.git
   cp docs/wiki/*.md szl-holdings-platform.wiki/
   cd szl-holdings-platform.wiki
   git add -A && git commit -m "feat: wiki seed — platform documentation"
   git push origin master
   ```

---

## Step 8: Apply Branch Protection

1. Go to: Settings → Branches → Add branch protection rule
2. Pattern: `main` (or `master`)
3. Enable:
   - [ ] Require pull request before merging (recommended: 1 approval)
   - [ ] Require status checks to pass (add: `ci`, `build` if active)
   - [ ] Include administrators
   - [ ] Do not allow force pushes
   - [ ] Do not allow deletions

---

## Step 9: Verify README Images Render

1. Open `https://github.com/stephenlutar2-hash/szl-holdings-platform` in incognito
2. Check each image in the README:
   - [ ] `docs/media/screenshots/landing-hero.jpg` loads
   - [ ] `docs/media/screenshots/lyte-overview.jpg` loads
   - [ ] `docs/media/diagrams/signal-to-action-flow.svg` loads
   - [ ] `docs/media/diagrams/ecosystem-map.svg` loads

If images don't load, they need to be committed and pushed to the remote repo.

---

## Step 10: Final QA

| Check | Expected | Status |
|-------|---------|--------|
| Repo is public | Not archived, publicly visible | — |
| Description/URL/Topics | All populated | — |
| Default branch | `main` or `master` (consistent) | — |
| Release v0.1.0 | Published and marked as latest | — |
| Social preview | Loads on share | — |
| README images | All load without 404 | — |
| Wiki (if enabled) | Home page renders | — |
| Issues enabled | Tab visible | — |
| Branch protection | Applied | — |

---

## Time Estimates

| Step | Time |
|------|------|
| About/description/topics | 5 min |
| Branch rename (if needed) | 10 min |
| Create release | 5 min |
| Social preview upload | 2 min |
| Features toggle | 2 min |
| Wiki seed push | 10–15 min |
| Branch protection | 5 min |
| QA | 5 min |
| **Total** | **~45 min** |
