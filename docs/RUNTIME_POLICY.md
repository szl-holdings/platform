# SZL Holdings — Runtime Version Policy

**Date:** October 6, 2026
**Status:** Authoritative
**Enforced by:** `.replit` modules, `pnpm-workspace.yaml` catalog, and CI configuration

---

## Policy Statement

All environments must satisfy the root runtime contract: Node.js 24 or newer,
pnpm 10.26.1 exactly, the committed lockfile, and PostgreSQL 16 where a database
is present. CI and interactive development use Node 24; digest-pinned container
builders use Node 26. That deliberate supported-version matrix is contract-tested
and must not turn into accidental toolchain drift.

---

## Canonical Runtime Versions

| Runtime | Canonical Version | Pinning Mechanism | Replit Dev | CI / Docker | Gap? |
|---|---|---|---|---|---|
| **Node.js** | **>=24** | Root `engines`; Node 24 CI/devcontainer; digest-pinned Node 26 container builders | v24.x | CI 24 / Docker 26 | Deliberate tested matrix |
| **pnpm** | **10.26.1 exactly** | Root `packageManager` and `engines`, preinstall guard, bootstrap contract | 10.26.1 | 10.26.1 | None |
| **PostgreSQL** | **16** | `.replit` → `modules = ["postgresql-16"]` | 16 ✅ | Not explicitly set | Monitor |

---

## Version Pinning Strategy

### Node.js

- **Supported contract:** Node.js 24 or newer, enforced by root `engines` and bootstrap checks.
- **Mechanism:** GitHub/CircleCI and the devcontainer use Node 24; the reviewed Node service Dockerfiles use digest-pinned Node 26 images.
- **Policy:** Keep CI on an LTS release and production builders on a reviewed, digest-pinned even-numbered release. Validate every supported major; do not infer compatibility from the range alone.
- **Corepack boundary:** Node 25+ may omit Corepack. `scripts/activate-pnpm.sh` prefers Corepack and otherwise installs the exact pnpm pin into a user-writable toolchain directory through an exact, script-disabled npm bootstrap.

### pnpm

- **Canonical version:** pnpm 10.26.1 exactly, pinned by both `packageManager` and `engines.pnpm`.
- **Enforcement:** The preinstall guard, bootstrap helper, clean-clone contract, workflows, devcontainer, CircleCI, and Node container builders reject a different effective version.
- **Policy:** Upgrade only as one reviewed change that updates the root pins, lockfile, bootstrap contract, workflows, containers, and tests together.

### Package Catalog (Shared Dependency Pinning)

The `pnpm-workspace.yaml` `catalog:` section is the machine-readable source of
truth for shared package versions. Do not duplicate its moving application
dependency list in this runtime policy. Workspace packages should use `catalog:`
specifiers for dependencies governed there.

### Dependency Peer Handling

- `autoInstallPeers: false` — peer dependencies are managed explicitly
- `minimumReleaseAge: 1440` — new package versions must be ≥24 hours old before they can be installed
- The complete, reviewed exception list is `minimumReleaseAgeExclude` in
  `pnpm-workspace.yaml`; this document does not maintain a second copy.

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
| CI/runtime package-manager drift | High — implicit installs and lockfile reinterpretation | ✅ Fixed — effective bare pnpm must equal 10.26.1 |
| Node 25+ does not bundle Corepack | High — bootstrap failure on an allowed Node release | ✅ Fixed — exact, user-writable fallback in `scripts/activate-pnpm.sh` |
| No root runtime enforcement | High — unsupported builds could proceed | ✅ Fixed — Node >=24 and exact pnpm 10.26.1 are enforced |
| CI Node 24 and container-builder Node 26 differ | Compatibility risk | Deliberate matrix; both satisfy root engines and remain independently pinned/tested |

---

*Update this document whenever any runtime version changes. This is a living policy document.*
