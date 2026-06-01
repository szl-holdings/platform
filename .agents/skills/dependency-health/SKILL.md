---
name: dependency-health
description: Audit, upgrade, and rationalize npm dependencies across the pnpm monorepo. Use when doing a dependency upgrade sprint, investigating a security advisory, or reducing bundle size. Adapted from Antigravity Awesome Skills and Awesome Claude Code dependency management patterns.
---

# Dependency Health

Keep dependencies current, minimal, and free of known vulnerabilities. This skill covers the full audit-upgrade-verify loop for this pnpm monorepo.

## Step 1 — Audit Current State

```bash
# Security vulnerabilities
pnpm audit --audit-level=moderate

# Outdated packages across all workspaces
pnpm outdated --recursive

# Duplicate versions of the same package (increases bundle size)
pnpm dedupe --check
```

## Step 2 — Triage Findings

For each outdated or vulnerable package, classify:

| Category | Action |
|----------|--------|
| Critical/High CVE with a fix available | Upgrade immediately |
| Moderate CVE — no breaking fix | Pin the affected version and open a follow-up |
| Minor version behind (semver-compatible) | Safe to upgrade in batch |
| Major version behind | Upgrade individually, check CHANGELOG for breaking changes |
| Unused dependency | Remove (see `dead-code-detector` skill) |

## Step 3 — Upgrade Safely

```bash
# Upgrade a single package across all workspaces
pnpm update <package-name> --recursive

# Upgrade to latest (potentially breaking)
pnpm update <package-name>@latest --recursive

# After any upgrade
pnpm install       # regenerate lockfile
pnpm tsc --noEmit  # catch type breakage from new @types/* versions
pnpm lint          # catch API changes surfaced by ESLint rules
```

## Step 4 — Rationalize Duplicates

Check if multiple packages declare the same dependency at different versions:

```bash
# See which packages declare a given dep
grep -r '"react":' packages/*/package.json artifacts/*/package.json

# Hoist a shared dep to the workspace root
# Move it to the root package.json "dependencies" or use pnpm overrides
```

Use `pnpm.overrides` in the root `package.json` to force a single version when a transitive dep has a vulnerability.

## Step 5 — Verify

After all upgrades:
```bash
pnpm install
pnpm tsc --noEmit
pnpm lint
pnpm --filter <key-artifact> build
```

Spot-check the artifact in the browser after build to catch runtime breakage that TypeScript cannot catch (e.g., changed default export, changed behavior).

## Monorepo-Specific Rules

- **Do not add a dependency to a specific artifact** if it is already available as a shared dep — hoist it to the workspace root or `packages/shared`.
- **Prefer exact versions** for internal packages (`"@szl/shared": "workspace:*"`) — use semver ranges only for published external packages.
- **Lock Vite and its plugins at compatible major versions** — Vite plugin APIs break between majors.
- **React and ReactDOM must be the same version** across all workspace packages.

## Commit Format

```
chore: upgrade <package> from <old> to <new>

Security: CVE-XXXX-YYYY / No known CVE
Breaking changes: none / see notes below
```
