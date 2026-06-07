# =============================================================================
# SZL Holdings — GitHub CLI Commands (PowerShell)
# Automates GitHub repository settings via the GitHub CLI (gh).
# Prerequisites: gh CLI installed and authenticated (gh auth login)
# =============================================================================

$REPO = "szl-holdings/szl-holdings-platform"
$USERNAME = "stephenlutar2-hash"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  SZL Holdings — GitHub Repository Setup" -ForegroundColor Cyan
Write-Host "  Repo: $REPO" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Verify authentication
Write-Host "[1/6] Verifying GitHub CLI authentication..."
gh auth status
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Not authenticated. Run: gh auth login" -ForegroundColor Red
    exit 1
}
Write-Host ""

# =============================================================================
# Repository Description and Homepage
# =============================================================================
Write-Host "[2/6] Updating repository metadata..."
gh repo edit $REPO `
  --description "Platform ecosystem for business observability, AI orchestration, maritime intelligence, and secure execution — built by Stephen Lutar." `
  --homepage "https://szlholdings.com" `
  --enable-issues `
  --disable-wiki `
  --disable-projects

Write-Host "  ✓ Description, homepage, and feature settings updated" -ForegroundColor Green
Write-Host ""

# =============================================================================
# Repository Topics
# =============================================================================
Write-Host "[3/6] Setting repository topics..."
gh repo edit $REPO `
  --add-topic typescript `
  --add-topic react `
  --add-topic nodejs `
  --add-topic postgresql `
  --add-topic drizzle-orm `
  --add-topic expo `
  --add-topic monorepo `
  --add-topic pnpm `
  --add-topic azure `
  --add-topic "ai-orchestration" `
  --add-topic "business-observability" `
  --add-topic "maritime-intelligence" `
  --add-topic saas

Write-Host "  ✓ Topics set" -ForegroundColor Green
Write-Host ""

# =============================================================================
# Create Release v0.1.0
# =============================================================================
Write-Host "[4/6] Creating release v0.1.0..."
gh release create v0.1.0 `
  --repo $REPO `
  --title "v0.1.0 — Initial Public Platform Release" `
  --notes-file "docs/releases/v0.1.0.md" `
  --latest

Write-Host "  ✓ Release v0.1.0 created" -ForegroundColor Green
Write-Host ""

# =============================================================================
# Bootstrap Issue Labels
# =============================================================================
Write-Host "[5/6] Bootstrapping issue labels..."

$labels = @(
    @{name="lyte"; color="0ea5e9"; description="Lyte Business Observability platform"},
    @{name="aegis"; color="ef4444"; description="Aegis Defense & Intelligence platform"},
    @{name="vessels"; color="06b6d4"; description="Vessels Maritime Intelligence platform"},
    @{name="terra"; color="10b981"; description="Terra Real Estate Intelligence platform"},
    @{name="carlota-jo"; color="8b5cf6"; description="Carlota Jo Advisory platform"},
    @{name="alloy"; color="f97316"; description="Alloy Execution Fabric"},
    @{name="mobile"; color="14b8a6"; description="Mobile applications (Expo/React Native)"},
    @{name="api"; color="6366f1"; description="API server"},
    @{name="infrastructure"; color="7c3aed"; description="IaC, CI/CD, deployment"},
    @{name="design"; color="f59e0b"; description="UI/UX changes"},
    @{name="security"; color="e11d48"; description="Security issue"},
    @{name="breaking-change"; color="b91c1c"; description="Breaking change"},
    @{name="needs-triage"; color="94a3b8"; description="Awaiting prioritization"}
)

foreach ($label in $labels) {
    gh label create $label.name --color $label.color --description $label.description --repo $REPO --force
}

Write-Host "  ✓ Labels bootstrapped" -ForegroundColor Green
Write-Host ""

# =============================================================================
# Summary
# =============================================================================
Write-Host "[6/6] Complete" -ForegroundColor Green
Write-Host ""
Write-Host "  Repository: https://github.com/$REPO"
Write-Host "  Releases:   https://github.com/$REPO/releases"
Write-Host ""
Write-Host "Manual steps remaining:" -ForegroundColor Yellow
Write-Host "  1. Create profile README repo: github.com/new → name: $USERNAME"
Write-Host "  2. Add profile README content from: profile-readme/README.md"
Write-Host "  3. Update GitHub profile settings: github.com/settings/profile"
Write-Host "  4. Set branch protection rules: github.com/$REPO/settings/branches"
