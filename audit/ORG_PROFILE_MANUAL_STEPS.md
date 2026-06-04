# Org Profile Manual Deployment Steps

**Generated:** 2026-04-25

The GitHub org profile for `szl-holdings` lives in a separate repository: `szl-holdings/.github`. The file `profile/README.md` in that repo is what appears at `github.com/szl-holdings`.

This document provides the exact commands to deploy the updated org profile.

---

## Prerequisites

- GitHub CLI (`gh`) authenticated as a member of `szl-holdings` org, OR
- SSH access to `github.com/szl-holdings/.github.git`
- Org admin or member with write access to the `.github` repo

---

## Option A — Using GitHub CLI

```bash
# 1. Clone the org's .github repo (separate from the platform repo)
gh repo clone szl-holdings/.github /tmp/szl-org-profile
cd /tmp/szl-org-profile

# 2. Copy the updated profile
mkdir -p profile
cp /path/to/szl-holdings-platform/org-profile/README.md profile/README.md

# 3. Copy the logo asset (if not already present)
mkdir -p profile/assets
cp /path/to/szl-holdings-platform/.github/profile/assets/szl-holdings-logo.svg profile/assets/szl-holdings-logo.svg

# 4. Commit and push
git add profile/
git commit -m "chore: refresh org profile — A11oy launch, platform rebranding [task-3473]"
git push origin main
```

---

## Option B — Using SSH Git Directly

```bash
# 1. Clone via SSH
git clone git@github.com:szl-holdings/.github.git /tmp/szl-org-profile
cd /tmp/szl-org-profile

# 2. Copy the updated profile
mkdir -p profile
cp /path/to/szl-holdings-platform/org-profile/README.md profile/README.md
cp /path/to/szl-holdings-platform/.github/profile/assets/szl-holdings-logo.svg profile/assets/

# 3. Commit and push
git add profile/
git commit -m "chore: refresh org profile — A11oy launch, platform rebranding [task-3473]"
git push origin main
```

---

## Option C — GitHub Web UI (No CLI Available)

1. Go to `https://github.com/szl-holdings/.github`
2. Navigate to `profile/README.md`
3. Click the pencil (Edit) icon
4. Paste the full contents of `org-profile/README.md` from this repository
5. Write commit message: `chore: refresh org profile — A11oy launch`
6. Commit directly to `main`

---

## Verify Deployment

After pushing:
1. Visit `https://github.com/szl-holdings`
2. The org profile should display within ~30 seconds
3. Confirm the A11oy section is visible and the logo renders

---

## Logo Asset

The logo SVG is at `.github/profile/assets/szl-holdings-logo.svg` in this repository. The org profile README references it via the raw.githubusercontent.com URL:

```
https://raw.githubusercontent.com/szl-holdings/.github/master/profile/assets/szl-holdings-logo.svg
```

This URL requires the logo to already be present in the `szl-holdings/.github` repo. If it is not there, upload it as part of the deployment in step 2c above.

---

## A11oy Hero Screenshot (When Available)

Once `pnpm screenshots:proof` has been run successfully:

1. The Boardroom Mode screenshot will be at:  
   `docs/assets/screenshots/current/a11oy-boardroom-mode-2026-04--desktop-1440.png`

2. Upload this image to the platform repo's `docs/assets/screenshots/current/` path (it should already be there from the capture script).

3. Update the org profile README to reference the screenshot via raw.githubusercontent.com:
   ```
   https://raw.githubusercontent.com/szl-holdings/szl-holdings-platform/main/docs/assets/screenshots/current/a11oy-boardroom-mode-2026-04--desktop-1440.png
   ```

4. Re-deploy the org profile using the steps above.
