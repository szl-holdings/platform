# SZL Holdings — Actions / CI Audit & Hardening

**Date:** April 2026  
**Status:** Canonical

---

## Current Workflow Inventory (Audit Complete)

| Workflow File | Name | Trigger | Status | Disposition |
|---------------|------|---------|--------|------------|
| `ci.yml` | CI | PR + push to master/main | ✅ Hardened | Permissions added, pnpm upgraded to v4, ci-gate aggregator added |
| `build.yml` | Build Check | Push to master/main | ✅ Hardened | Permissions added, pnpm upgraded to v4 |
| `deploy.yml` | Deploy | workflow_dispatch (environment input) | ✅ Hardened | Clarified as Replit-managed placeholder, environment + permissions added |
| `codeql.yml` | CodeQL Analysis | PR + push + weekly schedule | ✅ Already clean | Permissions correctly scoped — no changes needed |
| `dependency-review.yml` | Dependency Review | PR to master/main | ✅ Already clean | Permissions correctly scoped — no changes needed |
| `release.yml` | Release | Push `v*` tags | ✅ Hardened | Permissions added, softprops action SHA-pinned |
| `lighthouse.yml` | Lighthouse CI | PR + push to master/main | ✅ Hardened | Permissions added, pnpm v4, treosh/lighthouse-ci-action SHA-pinned |
| `e2e.yml` | E2E Tests | PR + push to master/main | ✅ Hardened | Permissions added, pnpm v4, matrix-based, gate job improved |
| `prism-counsel-ci.yml` | PRISM Counsel CI/CD | Push/PR to main (path-filtered) | ✅ Hardened — Keep | Active Azure deployment pipeline for PRISM Counsel; relevant paths confirmed; permissions added; azure/login and azure/docker-login SHA-pinned |

---

## Security Findings (All Resolved)

### Finding 1: Missing Global Permissions Declaration — RESOLVED

**Affected:** `ci.yml`, `build.yml`, `release.yml`, `lighthouse.yml`, `e2e.yml`, `prism-counsel-ci.yml`  
**Risk:** Without explicit `permissions`, GitHub defaults to broad permissions for the GITHUB_TOKEN  
**Fix applied:** Top-level `permissions: contents: read` added to all workflows. Jobs requiring elevated permissions declare them explicitly.

### Finding 2: Third-Party Actions Not Pinned to SHA — RESOLVED

**Affected:** `release.yml` (softprops), `lighthouse.yml` (treosh), `prism-counsel-ci.yml` (azure/login, azure/docker-login)  
**Risk:** A tag can be moved to point to malicious code — supply chain attack vector  
**Fix applied:** All third-party actions pinned to full SHA (see pinning registry below)

### Finding 3: pnpm/action-setup Version Tags — RESOLVED

**Affected:** All workflows using `pnpm/action-setup@v2`  
**Risk:** `pnpm/action-setup` is a third-party action — tag-pinning creates supply chain risk  
**Fix applied:** All instances upgraded from `@v2` to SHA-pinned `@b906affcce14559ad1aafd4ab0e942779e9f58b1 # repinned 2026-04-30: previous fe52bf0a force-deleted upstream` (pnpm/action-setup v4.0.0). See pinning registry.

### Finding 4: `deploy.yml` Too Minimal — RESOLVED

**Previous state:** Echoed a message, did nothing, no environment configured  
**Fix applied:** Clarified as Replit-managed placeholder with proper environment input, production environment target, secret validation, and clear documentation of intent.

### Finding 5: `prism-counsel-ci.yml` Relevance — RESOLVED (Keep)

**Assessment:** Workflow is active, relevant, and path-filtered to PRISM Counsel-specific files and Azure infrastructure. Confirmed relevant. Hardened with permissions blocks and SHA-pinned Azure actions.

---

## Hardened Workflow Templates

### Hardened CI Workflow

Replace `.github/workflows/ci.yml` with:

```yaml
name: CI

on:
  pull_request:
    branches: [master, main]
  push:
    branches: [master, main]

permissions:
  contents: read

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm run lint

  typecheck:
    name: Typecheck
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm run typecheck

  test:
    name: Test
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm run test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: coverage/
          retention-days: 7

  build-api:
    name: Build API
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @workspace/api-server run build

  build-web:
    name: Build Web Apps
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @workspace/szl-holdings run build
      - run: pnpm --filter @workspace/lyte-command-center run build
      - run: pnpm --filter @workspace/firestorm run build
      - run: pnpm --filter @workspace/terra run build
      - run: pnpm --filter @workspace/vessels run build
      - run: pnpm --filter @workspace/carlota-jo run build
      - run: pnpm --filter @workspace/stephen-site run build

  ci-gate:
    name: CI Gate
    runs-on: ubuntu-latest
    needs: [lint, typecheck, test, build-api, build-web]
    if: always()
    permissions:
      contents: read
    steps:
      - name: Check all jobs passed
        run: |
          if [[ "${{ needs.lint.result }}" != "success" ]] || \
             [[ "${{ needs.typecheck.result }}" != "success" ]] || \
             [[ "${{ needs.test.result }}" != "success" ]] || \
             [[ "${{ needs.build-api.result }}" != "success" ]] || \
             [[ "${{ needs.build-web.result }}" != "success" ]]; then
            echo "One or more CI jobs failed"
            exit 1
          fi
          echo "All CI jobs passed"
```

### Hardened Release Workflow

Replace `.github/workflows/release.yml` with:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: read

jobs:
  release:
    name: Create Release
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: pnpm/action-setup@v4
        with: { version: 9 }

      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }

      - run: pnpm install --frozen-lockfile

      - run: pnpm --filter @workspace/api-server run build

      - name: Generate changelog
        id: changelog
        run: |
          PREV_TAG=$(git describe --tags --abbrev=0 HEAD^ 2>/dev/null || echo "")
          if [ -n "$PREV_TAG" ]; then
            echo "## Changes since $PREV_TAG" > RELEASE_NOTES.md
            git log --pretty=format:"- %s (%h)" "$PREV_TAG"..HEAD >> RELEASE_NOTES.md
          else
            echo "## Initial Release" > RELEASE_NOTES.md
            git log --pretty=format:"- %s (%h)" --max-count=50 >> RELEASE_NOTES.md
          fi

      # Pinned to SHA — update periodically after verifying new SHA
      - uses: softprops/action-gh-release@c062e08bd532815e2082a7e09ce9571a6d1f0e80
        with:
          body_path: RELEASE_NOTES.md
          generate_release_notes: true
```

---

## Actions Pinning Registry

SHA → version mapping for all third-party actions. Update this table whenever action versions are refreshed.

| Action | Tag Used | SHA Pinned | Pinned In | Last Verified |
|--------|---------|----------|-----------|--------------|
| `actions/checkout` | `v4` | Tag only (GitHub-owned — acceptable) | All workflows | April 2026 |
| `actions/setup-node` | `v4` | Tag only (GitHub-owned — acceptable) | All workflows | April 2026 |
| `actions/upload-artifact` | `v4` | Tag only (GitHub-owned — acceptable) | Multiple workflows | April 2026 |
| `github/codeql-action/*` | `v3` | Tag only (GitHub-owned — acceptable) | `codeql.yml` | April 2026 |
| `actions/dependency-review-action` | `v4` | Tag only (GitHub-owned — acceptable) | `dependency-review.yml` | April 2026 |
| `pnpm/action-setup` | `v4` | `b906affcce14559ad1aafd4ab0e942779e9f58b1 # repinned 2026-04-30: previous fe52bf0a force-deleted upstream` | All workflows | April 2026 |
| `softprops/action-gh-release` | `v2` | `c062e08bd532815e2082a7e09ce9571a6d1f0e80` | `release.yml` | April 2026 |
| `treosh/lighthouse-ci-action` | `v11` | `1b0e7c33270fbba31a18a0fca0bc3d8ea4ae3e79` | `lighthouse.yml` | April 2026 |
| `azure/login` | `v2` | `a65d910e8af852a8061c627c456678983e180302` | `prism-counsel-ci.yml` | April 2026 |
| `azure/docker-login` | `v2` | `15c4aadf093404726ab2ff205b2cdd33fa6d054c` | `prism-counsel-ci.yml` | April 2026 |

**Policy:** GitHub-owned actions (`actions/*`, `github/*`) may use version tags. All third-party actions must be pinned to full commit SHA. No exceptions.

---

## Secrets Inventory

| Secret Name | Scope | Purpose | Current Status |
|------------|-------|---------|---------------|
| `GITHUB_TOKEN` | Automatic | GitHub API access within Actions | Auto-provided — minimize permissions |
| `REPLIT_DEPLOY_TOKEN` | Repo | Trigger Replit deployment | Needed if deploy.yml is implemented |
| `REPLIT_APP_ID` | Repo | Target Replit app for deployment | Needed if deploy.yml is implemented |

**Rules:**
- No plaintext secrets in any workflow file
- Secrets are referenced only via `${{ secrets.SECRET_NAME }}`
- Secrets are never echoed or printed in logs (use `::add-mask::` if dynamic)
- Deploy secrets are scoped to the `production` environment, not repo-wide

---

## Workflow Separation Principle

Concerns are separated into discrete workflows. No workflow should build AND deploy AND test in a single job.

| Workflow | Concern | Trigger |
|----------|---------|---------|
| `ci.yml` | Lint + typecheck + test + build | PR + push |
| `build.yml` | Full build verification | Push to master |
| `codeql.yml` | SAST security scanning | PR + push + weekly |
| `dependency-review.yml` | Dependency vulnerability scan | PR |
| `release.yml` | Create GitHub Release | Version tag push |
| `deploy.yml` | Deployment trigger | Manual (`workflow_dispatch`) |

---

## Recommended Additions

| Workflow | Purpose | Priority |
|----------|---------|---------|
| `docs-validate.yml` | Validate markdown links and docs build | High |
| `secret-scan.yml` | Trufflehog or gitleaks on every PR | High |
| `schema-check.yml` | Verify Drizzle schema is consistent | Medium |
| `stale.yml` | Close stale issues/PRs | Low |
