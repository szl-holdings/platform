#!/usr/bin/env bash
# =============================================================================
# SZL Holdings — GitHub CLI Commands
# Automates GitHub repository settings via the GitHub CLI (gh).
# Prerequisites: gh CLI installed and authenticated (gh auth login)
# =============================================================================

REPO="stephenlutar2-hash/szl-holdings-platform"
USERNAME="stephenlutar2-hash"

echo "================================================================"
echo "  SZL Holdings — GitHub Repository Setup"
echo "  Repo: $REPO"
echo "================================================================"
echo ""

# Verify authentication
echo "[1/7] Verifying GitHub CLI authentication..."
gh auth status || { echo "ERROR: Not authenticated. Run: gh auth login"; exit 1; }
echo ""

# =============================================================================
# Repository Description, Homepage, and Features
# =============================================================================
echo "[2/7] Updating repository metadata..."
gh repo edit "$REPO" \
  --description "Governed operational intelligence software — Lyte · Alloy · Aegis · Vessels · Terra" \
  --homepage "https://szlholdings.com" \
  --enable-issues \
  --enable-wiki \
  --disable-projects

echo "  ✓ Description, homepage, and feature settings updated"
echo ""

# =============================================================================
# Repository Topics
# =============================================================================
echo "[3/7] Setting repository topics..."

# Remove old topics first (via API since gh CLI doesn't support topic removal cleanly)
# Topics are replaced wholesale by the update-topics.ts script
# Here we add the new canonical set

gh repo edit "$REPO" \
  --add-topic szl-holdings \
  --add-topic lyte \
  --add-topic alloy \
  --add-topic business-observability \
  --add-topic ai-orchestration \
  --add-topic secure-operations \
  --add-topic enterprise-platform \
  --add-topic typescript \
  --add-topic react \
  --add-topic azure \
  --add-topic vessels

echo "  ✓ Topics set"
echo "  NOTE: Use scripts/github/update-topics.ts for atomic topic replacement"
echo ""

# =============================================================================
# Enable Wiki (required before first wiki sync)
# =============================================================================
echo "[4/7] Wiki status..."
echo "  Wiki is enabled via the repo edit above (--enable-wiki)"
echo "  First-time wiki setup requires manual steps:"
echo "  1. Go to: https://github.com/$REPO/wiki"
echo "  2. Create the first page manually (GitHub requires this to initialize the wiki repo)"
echo "  3. Clone: git clone https://github.com/$REPO.wiki.git ../szl-holdings-platform.wiki"
echo "  4. Run: npx tsx scripts/wiki/prepare-wiki-pages.ts"
echo "  5. Run: npx tsx scripts/wiki/export-docs-to-wiki.ts"
echo "  6. Run: bash scripts/wiki/wiki-commit.sh \"Initial wiki publish\""
echo "  See: ops/github/wiki-manual-steps.md"
echo ""

# =============================================================================
# Create Release v0.1.0
# =============================================================================
echo "[5/7] Creating release v0.1.0..."
gh release create v0.1.0 \
  --repo "$REPO" \
  --title "v0.1.0 — Initial Public Platform Release" \
  --notes-file "docs/releases/v0.1.0.md" \
  --latest 2>/dev/null || echo "  NOTE: Release v0.1.0 may already exist"

echo "  ✓ Release v0.1.0 done"
echo ""

# =============================================================================
# Bootstrap Issue Labels
# =============================================================================
echo "[6/7] Bootstrapping issue labels..."

gh label create "lyte" --color "0ea5e9" --description "Lyte Business Observability platform" --repo "$REPO" --force
gh label create "aegis" --color "ef4444" --description "Aegis Defense & Intelligence platform" --repo "$REPO" --force
gh label create "vessels" --color "06b6d4" --description "Vessels Maritime Intelligence platform" --repo "$REPO" --force
gh label create "terra" --color "10b981" --description "Terra Real Estate Intelligence platform" --repo "$REPO" --force
gh label create "carlota-jo" --color "8b5cf6" --description "Carlota Jo Advisory platform" --repo "$REPO" --force
gh label create "alloy" --color "f97316" --description "Alloy Execution Fabric" --repo "$REPO" --force
gh label create "mobile" --color "14b8a6" --description "Mobile applications (Expo/React Native)" --repo "$REPO" --force
gh label create "api" --color "6366f1" --description "API server" --repo "$REPO" --force
gh label create "infrastructure" --color "7c3aed" --description "IaC, CI/CD, deployment" --repo "$REPO" --force
gh label create "design" --color "f59e0b" --description "UI/UX changes" --repo "$REPO" --force
gh label create "security" --color "e11d48" --description "Security issue — use responsible disclosure for vulnerabilities" --repo "$REPO" --force
gh label create "breaking-change" --color "b91c1c" --description "Breaking change requiring major version increment" --repo "$REPO" --force
gh label create "needs-triage" --color "94a3b8" --description "Awaiting prioritization" --repo "$REPO" --force

echo "  ✓ Labels bootstrapped"
echo ""

# =============================================================================
# Summary
# =============================================================================
echo "[7/7] Verification..."
echo ""
echo "  Repository:    https://github.com/$REPO"
echo "  Releases:      https://github.com/$REPO/releases"
echo "  Labels:        https://github.com/$REPO/labels"
echo "  Wiki:          https://github.com/$REPO/wiki"
echo ""
echo "================================================================"
echo "  COMPLETE — Verify the above URLs in your browser"
echo "================================================================"
echo ""
echo "Manual steps remaining:"
echo "  1. Update profile settings:       github.com/settings/profile"
echo "  2. Create profile README repo:    github.com/new → name: $USERNAME"
echo "  3. Add profile README content:    profile-readme/README.md"
echo "  4. Set branch protection rules:   github.com/$REPO/settings/branches"
echo "  5. Upload social preview:         github.com/$REPO/settings (see social-preview-spec.md)"
echo "  6. Publish wiki pages:            ops/github/wiki-manual-steps.md"
echo "  7. Apply topics (atomic):         GITHUB_TOKEN=<token> npx tsx scripts/github/update-topics.ts"
echo ""
