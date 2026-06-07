# CI Pipeline Reference

This document describes the CI jobs that run on every pull request targeting
`main` / `master`, why they exist, and how to fix common failures.

---

## Jobs overview

| Job | Blocking | Purpose |
|-----|----------|---------|
| `lint` | Yes | ESLint across all workspace packages |
| `typecheck` | Yes | TypeScript type-check across all workspace packages |
| `test` | Yes | Unit test suite (Vitest) |
| `build` | Yes | Full monorepo build + per-artifact smoke build |
| `integration-test` | Yes | API integration tests against a live Postgres service |
| `docs-claims-check` | Yes | Documented claims (roles, CSRF, routes, tables) match the codebase |
| `secret-scan` | Yes | Gitleaks diff scan for accidentally committed secrets |
| `readiness-gate` | Yes | Product-mode smoke tests against a running API server |
| `proof-chain-checks` | Yes | Policy-engine, action-engine, trace, connector, telemetry unit tests |
| `route-security-matrix` | Yes | Every API route must have a documented auth classification |
| `brand-strings` | Yes | Banned trademark strings must not appear in source |
| `cortex-security-tests` | Yes | Multi-tenant org-scoping security regression tests |
| `env-coverage` | Yes | Every `process.env.*` / `VITE_*` reference has an `.env.example` entry |
| `design-token-drift` | Yes | Raw hex/rgb values below the compliance threshold |
| `api-spec-drift` | Yes | All route files reflected in the OpenAPI spec |
| `pin-check` | Yes | All GitHub Actions `uses:` refs must be SHA-pinned |
| `docs-sync-check` | No (advisory) | Canonical doc numbers match codebase metrics |
| `docs-catalogue-check` | No (advisory) | `API-CATALOGUE.md` matches the OpenAPI spec |

---

## GitHub Actions SHA pinning (`pin-check`)

### Why this check exists

Floating version tags (e.g. `uses: actions/checkout@v4`) are mutable — the
tag owner can point them at a different commit at any time, including one that
contains malicious code. This is a real supply-chain attack vector.

All `uses:` references in this repository must be pinned to a **full 40-character
commit SHA**. The human-readable tag is preserved in a trailing comment so the
intent is still clear:

```yaml
- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
```

### What the check does

The `pin-check` job runs a grep-based scan over every file in
`.github/workflows/`. For each `uses:` line it finds, it:

1. Skips local composite actions that start with `./` (they are always safe).
2. Extracts the ref — the part after the `@` in `owner/repo@<ref>`.
3. Fails if the ref is **not** exactly 40 lowercase hexadecimal characters.

### Fixing a failure

Find the SHA for the tag you want to use:

```bash
# Using the GitHub CLI
gh api repos/actions/checkout/commits/refs/tags/v4.2.2 --jq '.sha'

# Or look it up on the releases page and copy the full commit SHA
```

Replace the floating ref in your workflow file:

```yaml
# Before (will fail pin-check)
- uses: actions/checkout@v4

# After (will pass pin-check)
- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
```

### Keeping pins up to date

Use [Dependabot](https://docs.github.com/en/code-security/dependabot) or
[Renovate](https://docs.renovatebot.com/) to automatically open PRs when a
new release is published. Both tools understand SHA pinning and will update
the SHA **and** the trailing comment together.

---

## Adding a new CI job

1. Add the job definition to `.github/workflows/ci.yml`.
2. Add the job name to the `needs:` list in the `ci-gate` job.
3. Add a matching `[[ "${{ needs.<job-id>.result }}" != "success" ]]` check
   inside the gate's `run:` block.
4. Document the job in the table at the top of this file.
5. Make sure any `uses:` lines in your new job are SHA-pinned — the
   `pin-check` job scans every workflow file, including `ci.yml` itself.
