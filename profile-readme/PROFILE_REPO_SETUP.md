# GitHub Profile README — Setup Instructions

## What This Is

The `profile-readme/` directory contains the complete GitHub profile README package for the `stephenlutar2-hash` repo. Copy this content to your GitHub username repo to display it on your profile page.

## Setup Steps

### 1. Create the Profile Repo (if it doesn't exist)

Go to [github.com/new](https://github.com/new) and create a repo named exactly `stephenlutar2-hash` (must match your GitHub username). Make it **public** with a README.

### 2. Clone and Replace

```bash
git clone https://github.com/stephenlutar2-hash/stephenlutar2-hash.git
cd stephenlutar2-hash
cp /path/to/workspace/profile-readme/README.md ./README.md
mkdir -p assets
cp /path/to/workspace/profile-readme/assets/* ./assets/ 2>/dev/null || true
git add -A
git commit -m "Premium profile README — Lyte + Alloy focused"
git push origin main
```

### 3. Verify

Visit [github.com/stephenlutar2-hash](https://github.com/stephenlutar2-hash) — the profile README should display immediately.

### 4. Visual Assets

If `profile-readme/assets/` contains generated images, they display inline. If not yet generated, the README works without them — text-only is clean and professional.

## Updating

Edit `profile-readme/README.md` in the Replit workspace, then copy to the profile repo and push. The workspace is the source of truth.
