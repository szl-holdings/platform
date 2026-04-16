# SZL Holdings — Runtime Version Policy

**Date:** April 16, 2026
**Status:** Authoritative
**Enforced by:** `.replit` modules, `pnpm-workspace.yaml` catalog, and CI configuration

---

## Policy Statement

All environments — development, staging, and production — must run the same major versions of Node.js, pnpm, and PostgreSQL. Version drift between CI and production is a Class-1 operational risk and must be remediated in Phase 2.

---

## Canonical Runtime Versions

| Runtime | Canonical Version | Pinning Mechanism | Replit Dev | CI / Docker | Gap? |
|---|---|---|---|---|---|
| **Node.js** | **22 LTS** | Dockerfiles (`node:22-alpine`); CI (`node-version: '22'`) | v24.x (platform constraint) | v22 ✅ | Note below |
| **pnpm** | **10.x (10.26.1)** | `package.json` `packageManager` field | 10.26.1 ✅ | 10 ✅ | None |
| **PostgreSQL** | **16** | `.replit` → `modules = ["postgresql-16"]` | 16 ✅ | Not explicitly set | Monitor |
| **TypeScript** | **5.x** | `pnpm-workspace.yaml` catalog | 5.x ✅ | 5.x (via build) ✅ | None |
| **Drizzle ORM** | **0.45.1** | `pnpm-workspace.yaml` catalog | 0.45.1 ✅ | Same ✅ | None |
| **React** | **19.1.0** | `pnpm-workspace.yaml` catalog | 19.1.0 ✅ | Same ✅ | None |
| **Vite** | **7.x** | `pnpm-workspace.yaml` catalog | 7.x ✅ | Same ✅ | None |
| **Zod** | **3.25.76** | `pnpm-workspace.yaml` catalog | 3.25.76 ✅ | Same ✅ | None |

---

## Version Pinning Strategy

### Node.js

- **Canonical version:** Node.js 22 LTS (Active LTS as of April 2026)
- **Mechanism:** Dockerfiles use `node:22-alpine`; CI uses `node-version: '22'`; `engines.node` in root `package.json` enforces `>=22.0.0`
- **Replit dev environment:** Node 24 (the `.replit` modules field is platform-managed and cannot be changed by agents; Node 24 is backwards-compatible with Node 22)
- **Policy:** Track Node.js Active LTS. Upgrade when a new Active LTS is released and stable. Never run on Current (odd-numbered) releases in production.
- **Phase 2 status:** ✅ Complete — all CI workflows and Dockerfiles now use Node 22

### pnpm

- **Canonical version:** pnpm 10.x (pinned as `"packageManager": "pnpm@10.26.1"` in root `package.json`)
- **CI enforcement:** All GitHub Actions `pnpm/action-setup` steps use `version: 10`
- **Policy:** Stay on major version 10. Minor updates are applied as available.
- **Phase 2 status:** ✅ Complete — all workflow files updated from pnpm 9 to pnpm 10

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

## Enforcement Gaps (Resolved in Phase 2)

| Gap | Risk | Status |
|---|---|---|
| CI used Node.js 20; canonical is Node.js 22 | High — build failures masked | ✅ Fixed — all CI and Dockerfiles now use Node 22 |
| CI used pnpm 9; production uses pnpm 10 | Medium — lockfile format differences | ✅ Fixed — all workflow files updated to pnpm 10 |
| No `engines` field in root `package.json` | Low | ✅ Fixed — `engines: { node: ">=22.0.0", pnpm: ">=10.0.0" }` added |
| Replit dev env uses Node 24; CI/Docker use Node 22 | Low — version 24 is backwards-compatible | Residual — `.replit` is platform-managed; acceptable gap |

---

*Update this document whenever any runtime version changes. This is a living policy document.*
