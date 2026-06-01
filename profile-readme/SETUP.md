# Profile README — Setup

## Quick Setup

### 1. Create the Repo
Go to [github.com/new](https://github.com/new). Create a repo named **`stephenlutar2-hash`** (must match your GitHub username exactly). Make it **public**. Initialize with a README.

### 2. Replace the Content
```bash
git clone https://github.com/stephenlutar2-hash/stephenlutar2-hash.git
cd stephenlutar2-hash

# Copy from workspace
cp /path/to/workspace/profile-readme/README.md ./README.md
mkdir -p assets
cp /path/to/workspace/profile-readme/assets/* ./assets/

git add -A
git commit -m "Premium profile README — KORA + A11oy focused"
git push origin main
```

### 3. Verify
Visit [github.com/stephenlutar2-hash](https://github.com/stephenlutar2-hash) — the profile README displays automatically.

## What's Included
- `README.md` — Founder-grade profile with platform overview and links
- `assets/platform-map.svg` — Architecture diagram
- `assets/ecosystem-map.svg` — Ecosystem overview
- `assets/founder-card.svg` — Visual founder card

## Updating
Edit files in the Replit workspace (`profile-readme/`), then copy and push to the GitHub repo. The workspace is always the source of truth.
