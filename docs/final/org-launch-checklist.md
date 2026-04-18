# Org Launch Checklist

**Context:** SZL Holdings GitHub organization setup  
**Estimated time:** 45–60 minutes (one session)  
**Date:** April 2026

---

## Pre-Flight

- [ ] Confirm GitHub account is `stephenlutar2-hash`
- [ ] Confirm flagship repo `szl-holdings-platform` exists and is not archived
- [ ] Have org name ready: `szl-holdings` (or `szlholdings` if taken)
- [ ] Have org logo/avatar ready from `profile-readme/assets/`

---

## Step 1: Create the Organization

1. Go to: `https://github.com/organizations/plan`
2. Choose: **Free** plan (or upgrade later)
3. Organization name: `szl-holdings` (preferred) or `szlholdings`
4. Contact email: your primary email
5. Choose: **My personal account**
6. Complete setup

**Verification:** `https://github.com/szl-holdings` should load

---

## Step 2: Upload Org Avatar

1. Go to: `https://github.com/organizations/szl-holdings/settings/profile`
2. Click the avatar placeholder
3. Upload: logo from `profile-readme/assets/` or `docs/media/`
4. Crop to square — ensure it's readable at small sizes
5. Save

---

## Step 3: Create Org Profile README

The org profile README appears on `https://github.com/szl-holdings` when visitors view the org.

1. Go to: `https://github.com/new`
2. Owner: `szl-holdings` (org)
3. Repository name: `.github`
4. Visibility: **Public**
5. Initialize with README: **Yes**
6. Create repository
7. Navigate to `szl-holdings/.github`
8. Create folder `profile/`
9. Create `profile/README.md` with org-level content:

```markdown
# SZL Holdings

Governed decision infrastructure software — built for operators who need signal to become action.

**Products:** Lyte · Alloy · Aegis · Vessels · Terra · Carlota Jo

[szlholdings.com](https://szlholdings.com) · [Platform →](https://github.com/szl-holdings/szl-holdings-platform)
```

---

## Step 4: Pin Flagship Repo

1. Go to: `https://github.com/szl-holdings`
2. Click **Customize your pins**
3. Pin: `szl-holdings-platform`
4. Optional: pin `szl-holdings-mobile` if it exists

---

## Step 5: Transfer Repos (Optional — Plan Carefully)

Transferring repos moves them from personal account to org. This changes all URLs.

**Repos to consider transferring:**
- `szl-holdings-platform` (flagship)
- Any product-specific repos

**Before transferring:**
- [ ] Set up redirects (GitHub auto-redirects for 1 year)
- [ ] Update all internal documentation URLs
- [ ] Update any CI/CD pipeline references
- [ ] Notify any collaborators

**Transfer process:**
1. Go to repo Settings → General → Danger Zone → Transfer
2. Type repo name to confirm
3. Select org as destination

---

## Step 6: Set Org Settings

Go to: `https://github.com/organizations/szl-holdings/settings`

- [ ] **Org name:** SZL Holdings
- [ ] **Bio/Description:** "Governed decision infrastructure software"
- [ ] **URL:** `https://szlholdings.com`
- [ ] **Location:** New York, NY
- [ ] **Member privileges:** Review defaults
- [ ] **Repository defaults:** Private by default (safer for a company org)

---

## Step 7: Verify Rendering

1. Open `https://github.com/szl-holdings` in incognito
2. Confirm:
   - [ ] Org avatar shows correctly
   - [ ] Description and URL visible
   - [ ] Profile README renders (if created)
   - [ ] Pinned repos visible
3. Check on mobile viewport too

---

## Step 8: Final QA

| Check | Expected | Status |
|-------|---------|--------|
| Org page loads | `https://github.com/szl-holdings` accessible | — |
| Avatar visible | Logo shows, readable at small sizes | — |
| Profile README | Renders with correct content | — |
| Flagship repo pinned | `szl-holdings-platform` visible in pins | — |
| Social preview | OG image shows when shared | — |
| Bio/URL/Location | All populated | — |

---

## Notes

- The org name `szl-holdings` may not be available — have a backup: `szlholdings`, `szl-holdings-co`
- Do not rush repo transfers — they have DNS-level implications
- The `.github/profile/README.md` file is what shows on the org page (not the `.github` README.md)
