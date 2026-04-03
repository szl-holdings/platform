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
echo "[1/6] Verifying GitHub CLI authentication..."
gh auth status || { echo "ERROR: Not authenticated. Run: gh auth login"; exit 1; }
echo ""

# =============================================================================
# Repository Description and Homepage
# =============================================================================
echo "[2/6] Updating repository metadata..."
gh repo edit "$REPO" \
  --description "Platform ecosystem for business observability, AI orchestration, maritime intelligence, and secure execution — built by Stephen Lutar." \
  --homepage "https://szlholdings.com" \
  --enable-issues \
  --disable-wiki \
  --disable-projects

echo "  ✓ Description, homepage, and feature settings updated"
echo ""

# =============================================================================
# Repository Topics
# =============================================================================
echo "[3/6] Setting repository topics..."
gh repo edit "$REPO" \
  --add-topic typescript \
  --add-topic react \
  --add-topic nodejs \
  --add-topic postgresql \
  --add-topic drizzle-orm \
  --add-topic expo \
  --add-topic monorepo \
  --add-topic pnpm \
  --add-topic azure \
  --add-topic ai-orchestration \
  --add-topic business-observability \
  --add-topic maritime-intelligence \
  --add-topic saas

echo "  ✓ Topics set"
echo ""

# =============================================================================
# Create Release v0.1.0
# =============================================================================
echo "[4/6] Creating release v0.1.0..."
gh release create v0.1.0 \
  --repo "$REPO" \
  --title "v0.1.0 — Initial Public Platform Release" \
  --notes-file "docs/releases/v0.1.0.md" \
  --latest

echo "  ✓ Release v0.1.0 created"
echo ""

# =============================================================================
# Bootstrap Issue Labels
# =============================================================================
echo "[5/6] Bootstrapping issue labels..."

# Delete default labels that don't fit (optional — comment out if you want to keep them)
# gh label delete "good first issue" --repo "$REPO" --yes 2>/dev/null || true
# gh label delete "help wanted" --repo "$REPO" --yes 2>/dev/null || true

# Create canonical labels
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
echo "[6/6] Verification..."
echo ""
echo "  Repository: https://github.com/$REPO"
echo "  Releases:   https://github.com/$REPO/releases"
echo "  Labels:     https://github.com/$REPO/labels"
echo ""
echo "================================================================"
echo "  COMPLETE — Verify the above URLs in your browser"
echo "================================================================"
echo ""
echo "Manual steps remaining:"
echo "  1. Create profile README repo: github.com/new → name: $USERNAME"
echo "  2. Add profile README content from: profile-readme/README.md"
echo "  3. Update GitHub profile settings: github.com/settings/profile"
echo "  4. Set branch protection rules: github.com/$REPO/settings/branches"
echo ""
