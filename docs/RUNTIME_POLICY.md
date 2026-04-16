# SZL Holdings — Runtime Version Policy

**Date:** April 16, 2026
**Status:** Authoritative
**Enforced by:** `.replit` modules, `pnpm-workspace.yaml` catalog, and CI configuration

---

## Policy Statement

All environments — development, staging, and production — must run the same major versions of Node.js, pnpm, and PostgreSQL. Version drift between CI and production is a Class-1 operational risk and must be remediated in Phase 2.

---

## Canonical Runtime Versions

| Runtime | Canonical Version | Pinning Mechanism | Current Production | Current CI | Gap? |
|---|---|---|---|---|---|
| **Node.js** | **24 LTS** | `.replit` → `modules = ["nodejs-24"]` | v24.13.0 ✅ | v20 ❌ | **YES — fix in Phase 2** |
| **pnpm** | **10.x** | Verified at runtime (10.26.1) | 10.26.1 ✅ | v9 ❌ | **YES — fix in Phase 2** |
| **PostgreSQL** | **16** | `.replit` → `modules = ["postgresql-16"]` | 16 ✅ | Not explicitly set | Monitor |
| **TypeScript** | **5.x** | `pnpm-workspace.yaml` catalog | 5.x ✅ | 5.x (via build) ✅ | None |
| **Drizzle ORM** | **0.45.1** | `pnpm-workspace.yaml` catalog | 0.45.1 ✅ | Same ✅ | None |
| **React** | **19.1.0** | `pnpm-workspace.yaml` catalog | 19.1.0 ✅ | Same ✅ | None |
| **Vite** | **7.x** | `pnpm-workspace.yaml` catalog | 7.x ✅ | Same ✅ | None |
| **Zod** | **3.25.76** | `pnpm-workspace.yaml` catalog | 3.25.76 ✅ | Same ✅ | None |

---

## Version Pinning Strategy

### Node.js

- **Mechanism:** Replit `.replit` file module declaration (`nodejs-24`)
- **CI enforcement:** Must be set to `node-version: '24'` in all GitHub Actions workflow `setup-node` steps
- **Policy:** Track Node.js Active LTS. Upgrade when a new Active LTS is released and stable. Never run on Current (odd-numbered) releases in production.
- **Required Phase 2 action:** Update `ci.yml`, `build.yml`, `deploy-staging.yml`, `deploy-production.yml` to use `node-version: '24'`

### pnpm

- **Mechanism:** Automatically version-matched by Replit environment
- **CI enforcement:** Must be `version: 10` in all GitHub Actions `pnpm/action-setup` steps
- **Policy:** Stay on major version 10. Minor updates are applied as available.
- **Required Phase 2 action:** Update all workflow files from `version: 9` to `version: 10`

### Package Catalog (Shared Dependency Pinning)

The `pnpm-workspace.yaml` `catalog:` section is the single source of truth for shared package versions across all workspace packages. All packages must reference catalog versions using `catalog:` specifiers rather than specifying their own version ranges.

Key pinned packages and their versions:

```yaml
catalog:
  react: 19.1.0
  react-dom: 19.1.0
  vite: ^7.3.0
  drizzle-orm: 0.45.1
  zod: 3.25.76
  tailwindcss: ^4.1.14
  framer-motion: 12.35.1
  recharts: 2.15.4
  lucide-react: 0.545.0
  tsx: 4.21.0
  '@tanstack/react-query': 5.99.0
```

### Dependency Peer Handling

- `autoInstallPeers: false` — peer dependencies are managed explicitly
- `minimumReleaseAge: 1440` — new package versions must be ≥24 hours old before they can be installed
- Exceptions: `@replit/*` packages and `stripe-replit-sync` have no release age requirement

---

## Upgrade Procedure

### Routine Dependency Updates (non-breaking minor/patch)

1. Create a task with scope "dependency update"
2. Update the version in `pnpm-workspace.yaml` catalog
3. Run `pnpm install` — verify lockfile updates
4. Run `pnpm build && pnpm typecheck && pnpm test`
5. If all pass, merge

### Major Version Upgrades (Node.js, pnpm, React, Drizzle, etc.)

1. Update `.replit` module declaration or catalog entry
2. Update all CI workflow files to match
3. Run full build and test suite
4. Update this document and `docs/PLATFORM_CANONICAL.md`
5. Note the upgrade in `CHANGELOG.md`

### Security Vulnerability Response

- `pnpm audit` — identifies vulnerabilities in installed packages
- `pnpm audit --fix` — auto-upgrades where safe
- Critical vulnerabilities (CVSS ≥9): fix within 24 hours
- High vulnerabilities (CVSS ≥7): fix within 7 days
- Use `pnpm why <package>` to trace transitive dependency paths

---

## Enforcement Gaps (Current)

| Gap | Risk | Resolution |
|---|---|---|
| CI uses Node.js 20; production uses Node.js 24 | **High** — build failures masked | Phase 2: Update all CI workflows to Node.js 24 |
| CI uses pnpm 9; production uses pnpm 10 | **Medium** — lockfile format differences | Phase 2: Update all CI workflows to pnpm 10 |
| No `engines` field in root `package.json` | Low | Phase 2: Add `engines: { node: ">=24" }` to root package.json |
| No `.nvmrc` or `.node-version` file | Low | Phase 2: Add `.nvmrc` with `24` for local dev without Replit |

---

*Update this document whenever any runtime version changes. This is a living policy document.*
