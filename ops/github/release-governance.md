# Release Governance — SZL Holdings Platform

Last updated: 2026-04-16

This document defines the release process, versioning strategy, changelog discipline, and governance rules for all platform releases.

---

## Versioning Strategy

We follow [Semantic Versioning 2.0.0](https://semver.org/):

```
MAJOR.MINOR.PATCH  →  e.g., v1.3.2
```

| Change type | Version bump | Example |
|-------------|-------------|---------|
| Breaking API or behavior change | **MAJOR** | `v1.0.0 → v2.0.0` |
| New backward-compatible feature | **MINOR** | `v1.2.0 → v1.3.0` |
| Bug fix, chore, or patch | **PATCH** | `v1.3.1 → v1.3.2` |

Version bump is determined automatically by the `release.yml` workflow from Conventional Commits in the commit history since the last tag. Manual override is available via `workflow_dispatch`.

---

## Release Workflow

### Automated path (default)

```
1. Engineer merges PR to main with Conventional Commits
2. release.yml triggers automatically
3. Workflow inspects commits since last tag:
   - feat! or BREAKING CHANGE → major bump
   - feat → minor bump
   - everything else → patch bump
4. New SemVer tag is pushed (e.g., v1.4.0)
5. GitHub Release is published with auto-generated changelog
6. Published release triggers deploy-production.yml
7. Production deployment runs (requires environment approval)
```

### Manual release

For emergency or out-of-band releases:

```bash
# Via GitHub UI: Actions → Release → Run workflow
# Select version_bump: patch | minor | major
```

Or via CLI:

```bash
gh workflow run release.yml \
  --repo szl-holdings/szl-holdings-platform \
  --field version_bump=minor
```

---

## Changelog Discipline

### CHANGELOG.md format

```markdown
# Changelog

## [Unreleased]

### Features
- (new features not yet released)

## [v1.4.0] — 2026-04-16

### Features
- feat(vessels): freight rate benchmarking on voyage P&L page

### Bug Fixes
- fix(api-server): correct multi-tenant org_id scoping in route handler

### Other Changes
- chore(deps): update pnpm to 9.15.0
```

### Rules

- Every PR with user-visible changes must include a CHANGELOG entry
- Entries go under `[Unreleased]` until the release workflow promotes them
- Format: `- <type>(<scope>): <description>` matching the commit message
- Breaking changes must include a migration note under a `### Breaking Changes` section

---

## Release Checklist (Pre-publish)

Before a release is marked as the latest:

- [ ] All CI checks pass on the commit being released
- [ ] E2E tests pass (or known failures are documented)
- [ ] `CHANGELOG.md` entry exists for this version with substantive notes
- [ ] No internal tooling paths, secrets, or unfinished features referenced in release notes
- [ ] Staging deployment has been validated (smoke tests pass)
- [ ] Database migrations (if any) have been tested on staging data
- [ ] Breaking changes are documented with migration instructions

---

## Release Notes Authoring

GitHub Releases use auto-generated notes from `release.yml` combined with the `softprops/action-gh-release` action's `generate_release_notes: true` feature.

For major releases, supplement the auto-generated notes with a human-authored summary:

1. Create `docs/releases/v<version>.md`
2. Structure:
   - **Summary paragraph** — 2–3 sentences on what changed and why it matters
   - **Highlights** — bullet list of the most important changes
   - **Breaking changes** — migration guide if applicable
   - **What's next** — brief preview of next milestone

---

## Pre-release Tags

For alpha/beta milestones use GitHub's pre-release flag:

```bash
gh release create v1.4.0-alpha \
  --repo szl-holdings/szl-holdings-platform \
  --title "v1.4.0-alpha — Vessels Commercial Launch" \
  --notes-file docs/releases/v1.4.0-alpha.md \
  --prerelease
```

Pre-releases do **not** trigger production deployment. Only releases marked as **latest** trigger `deploy-production.yml`.

---

## Hotfix Process

For critical production issues requiring an out-of-cycle fix:

```
1. Branch off the current production tag:
   git checkout -b fix/critical-issue v1.3.2

2. Apply the minimal targeted fix
3. Open a PR to main (not to the tag branch)
4. After CI passes and review is approved, merge to main
5. Trigger a manual release with version_bump=patch
6. Monitor staging, then approve production deployment
```

Do not maintain long-lived hotfix branches. All fixes flow through `main`.

---

## Published Releases Record

| Version | Date | Highlight |
|---------|------|-----------|
| v0.1.0 | 2026-04-01 | Initial Public Platform Release |

Future releases will be added to this table on publication.

---

## Deprecation Policy

- APIs and features scheduled for removal must be deprecated for at least **one minor version** before removal
- Deprecation notices must appear in the CHANGELOG and in code (using `@deprecated` JSDoc)
- Breaking changes that cannot wait for a deprecation cycle must be documented in release notes with a migration guide
