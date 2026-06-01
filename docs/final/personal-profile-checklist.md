# Personal Profile Checklist

**Context:** GitHub personal profile setup for `stephenlutar2-hash`  
**Estimated time:** 20–30 minutes  
**Date:** April 2026

---

## Pre-Flight

- [ ] Confirm GitHub username: `stephenlutar2-hash`
- [ ] Have profile values ready from `ops/github/profile-values.md`
- [ ] Have `profile-readme/README.md` ready to paste

---

## Step 1: Ensure Profile README Repo Exists

The profile README requires a **public** repo named exactly the same as your username.

1. Go to: `https://github.com/new`
2. Repository name: `stephenlutar2-hash` (must match username exactly)
3. Visibility: **Public** ← critical
4. Initialize: **Add a README file**
5. Create repository

---

## Step 2: Push Profile README

1. Navigate to: `https://github.com/stephenlutar2-hash/stephenlutar2-hash`
2. Click the README.md pencil edit icon
3. Replace content with the full content from `profile-readme/README.md`
4. Commit directly to `main`

**Or via CLI:**
```bash
git clone https://github.com/stephenlutar2-hash/stephenlutar2-hash
cp profile-readme/README.md stephenlutar2-hash/README.md
cd stephenlutar2-hash
git add . && git commit -m "feat: profile README — SZL Holdings platform positioning"
git push origin main
```

---

## Step 3: Verify Profile README Renders

1. Go to: `https://github.com/stephenlutar2-hash`
2. The README should appear at the top of your profile page
3. Check:
   - [ ] Positioning line renders correctly
   - [ ] Section headers visible: About, Current Build, Platforms, Focus Areas, Featured Repo, Connect
   - [ ] Links are clickable
   - [ ] Images load (if any are referenced)

---

## Step 4: Update Profile Settings

Go to: `https://github.com/settings/profile`

| Field | Value |
|-------|-------|
| Name | `Stephen Lutar` |
| Bio | `Founder building Lyte, Alloy, and Vessels at SZL Holdings. Business observability, AI systems, and secure operations.` |
| Company | `SZL Holdings` |
| Location | `New York, NY` |
| Website | `https://szlholdings.com` |
| LinkedIn | `linkedin.com/in/stephen-l-279315240` |

Save changes.

---

## Step 5: Profile Appearance Toggles

Go to: `https://github.com/settings/profile` (same page, scroll down) or `https://github.com/settings/appearance`

| Toggle | Setting |
|--------|---------|
| Display current local time | **ON** |
| Show achievements | **ON** |
| Include private contributions in graph | **ON** |
| Make profile private | **OFF** |

---

## Step 6: Unpin Archived/Weak Repos

1. Go to: `https://github.com/stephenlutar2-hash`
2. Click **Customize your pins**
3. Uncheck any archived, empty, or unrelated repos
4. Pin only: `szl-holdings-platform` + 1–2 others at most

---

## Step 7: Pin Strongest Repos

| Priority | Repo | Reason |
|----------|------|--------|
| 1 | `szl-holdings-platform` | Flagship — investor-grade README |
| 2 | `stephenlutar2-hash` | Profile README repo |
| 3 | Any domain-specific demo | Optional |

---

## Step 8: Verify Links and Screenshots

1. Open `https://github.com/stephenlutar2-hash` in incognito
2. Check:
   - [ ] Name shows `Stephen Lutar`
   - [ ] Bio is correct
   - [ ] Location: New York, NY
   - [ ] Website links to szlholdings.com
   - [ ] Profile README renders correctly
   - [ ] Pinned repos show `szl-holdings-platform` as first
   - [ ] Contribution graph visible
   - [ ] Achievements visible

---

## Step 9: Share a Test

Share `https://github.com/stephenlutar2-hash` in Slack/iMessage to see the OG preview. Confirm it shows the correct social preview image (not a generic GitHub card).

---

## Notes

- The profile README only appears if the repo is **public** and named **exactly** the username
- Bio is limited to 160 characters — the value above is ~120 chars (within limit)
- The profile link at `szlholdings.com` in the website field should be live or at least not 404
