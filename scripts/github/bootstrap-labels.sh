#!/usr/bin/env bash
# =============================================================================
# SZL Holdings — Bootstrap GitHub Labels Script
# Creates the canonical set of issue labels for the flagship repository.
# Prerequisites: gh CLI installed and authenticated
# =============================================================================

set -e

REPO="stephenlutar2-hash/szl-holdings-platform"

echo "================================================================"
echo "  Bootstrapping GitHub Issue Labels"
echo "  Repository: $REPO"
echo "================================================================"
echo ""

gh auth status || { echo "ERROR: Run 'gh auth login' first"; exit 1; }

echo "Creating labels..."

gh label create "lyte"          --color "0ea5e9" --description "Lyte Business Observability platform"      --repo "$REPO" --force
gh label create "aegis"         --color "ef4444" --description "Aegis Defense & Intelligence platform"    --repo "$REPO" --force
gh label create "vessels"       --color "06b6d4" --description "Vessels Maritime Intelligence platform"   --repo "$REPO" --force
gh label create "terra"         --color "10b981" --description "Terra Real Estate Intelligence platform"  --repo "$REPO" --force
gh label create "carlota-jo"    --color "8b5cf6" --description "Carlota Jo Advisory platform"             --repo "$REPO" --force
gh label create "alloy"         --color "f97316" --description "Alloy Execution Fabric"                   --repo "$REPO" --force
gh label create "mobile"        --color "14b8a6" --description "Mobile applications (Expo/React Native)"  --repo "$REPO" --force
gh label create "api"           --color "6366f1" --description "API server"                               --repo "$REPO" --force
gh label create "infrastructure" --color "7c3aed" --description "IaC, CI/CD, deployment"                 --repo "$REPO" --force
gh label create "design"        --color "f59e0b" --description "UI/UX changes"                            --repo "$REPO" --force
gh label create "security"      --color "e11d48" --description "Security issue — use responsible disclosure" --repo "$REPO" --force
gh label create "breaking-change" --color "b91c1c" --description "Breaking change — major version"       --repo "$REPO" --force
gh label create "needs-triage"  --color "94a3b8" --description "Awaiting prioritization"                  --repo "$REPO" --force

echo ""
echo "  ✓ Labels bootstrapped"
echo ""
echo "View labels: https://github.com/$REPO/labels"
