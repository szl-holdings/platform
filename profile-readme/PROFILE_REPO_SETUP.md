# GitHub Profile README — Setup Instructions

## What This Is

The `profile-readme/README.md` file in this repository contains the content for Stephen Lutar's GitHub profile README — the document that appears at `github.com/stephenlutar2-hash`.

GitHub displays the README from a repository named `{username}/{username}` (i.e., `stephenlutar2-hash/stephenlutar2-hash`) as the profile README.

---

## Setup Steps

### Step 1: Create the Profile Repository

1. Go to [github.com/new](https://github.com/new)
2. Set repository name to: `stephenlutar2-hash` (exactly matching the GitHub username)
3. Set to **Public**
4. Initialize with a README (or we'll replace it in the next step)
5. Click "Create repository"

### Step 2: Add the Profile README

Option A — via GitHub UI:
1. Open the new `stephenlutar2-hash/stephenlutar2-hash` repository
2. Click "Edit file" on the README.md
3. Copy the contents of `profile-readme/README.md` from this repository
4. Paste and commit

Option B — via Git:
```bash
git clone https://github.com/stephenlutar2-hash/stephenlutar2-hash.git
cd stephenlutar2-hash

# Copy the content
cp /path/to/szl-holdings-platform/profile-readme/README.md ./README.md

git add README.md
git commit -m "Add founder profile README"
git push origin main
```

### Step 3: Verify

Navigate to `github.com/stephenlutar2-hash` — the profile README should now be visible.

---

## Updating the Profile README

When the profile README needs updating:
1. Edit `profile-readme/README.md` in this repository (the source of truth)
2. Copy the updated content to `stephenlutar2-hash/stephenlutar2-hash/README.md`
3. Commit and push to the profile repository

---

## Visual Assets

If adding images or badges to the profile README:
- Store image files in `profile-readme/assets/`
- Reference them with raw GitHub URLs: `https://raw.githubusercontent.com/stephenlutar2-hash/stephenlutar2-hash/main/assets/filename.png`
- Or use absolute URLs to hosted images

---

## GitHub Profile Settings (Recommended)

In addition to the profile README, update these GitHub profile settings:

| Field | Recommended Value |
|-------|------------------|
| Name | Stephen Lutar |
| Bio | Building premium command-grade platforms — SZL Holdings |
| Company | SZL Holdings |
| Location | (your location) |
| Website | https://szlholdings.com |
| LinkedIn | linkedin.com/in/stephen-l-279315240 |
| Twitter/X | (if applicable) |

---

## Profile README Update Frequency

Update the profile README when:
- A new platform vertical is added to the ecosystem
- The flagship repo description changes significantly
- Contact or positioning information changes
- Major milestones are reached (v1.0, first commercial customer, etc.)
