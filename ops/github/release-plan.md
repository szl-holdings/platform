# Release Plan — GitHub Releases

> **Superseded by [`ops/github/release-governance.md`](./release-governance.md)** — Canonical release governance reference including pre-release process, hotfix policy, deprecation standards, and release workflow details. This file is retained for historical reference only.

Defines the strategy, tagging convention, and publishing workflow for GitHub Releases on `szl-holdings-platform`.

---

## Release Philosophy

GitHub Releases serve two audiences simultaneously:
1. **Technical reviewers** — who want to understand what changed and when
2. **Investors/buyers** — who use releases to gauge development velocity and platform maturity

Release notes must be substantive, honest, and demonstrate progress without claiming commercial milestones not yet achieved.

---

## Versioning Convention

Semantic Versioning (SemVer): `MAJOR.MINOR.PATCH`

| Increment | When |
|-----------|------|
| MAJOR | Breaking architecture change; platform-wide structural shift |
| MINOR | New feature, new domain pack, new product capability |
| PATCH | Bug fix, documentation update, performance improvement |

Current version: `v0.1.0`

Full versioning policy: `docs/releases/versioning-policy.md`

---

## Release Tag Format

```
v{MAJOR}.{MINOR}.{PATCH}
```

Examples: `v0.1.0`, `v0.2.0`, `v1.0.0`

Tag against the `main` branch. No branch-specific release tags.

---

## Release Notes Template

```markdown
## {Title}

{One-paragraph summary of what this release represents}

### Added
- {Feature or capability}

### Changed
- {Update or improvement}

### Fixed
- {Bug fix}

### Infrastructure
- {Deployment or ops change}

### Documentation
- {Doc update}

---

See [CHANGELOG.md](CHANGELOG.md) for the full change log.
```

---

## Publishing Steps

### Via GitHub CLI

```bash
# Create release from a notes file
gh release create v0.2.0 \
  --repo szl-holdings/platform \
  --title "v0.2.0 — Production Readiness & Revenue Activation" \
  --notes-file docs/releases/v0.2.0.md \
  --latest
```

### Via GitHub Web Interface

1. Go to: `https://github.com/szl-holdings/platform/releases/new`
2. Click **Choose a tag** → type `v0.2.0` → click **Create new tag: v0.2.0 on publish**
3. Target: `main`
4. Enter title and paste release notes from `docs/releases/v0.2.0.md`
5. Check **Set as the latest release**
6. Click **Publish release**

---

## Pre-Release vs Release

For alpha/beta milestones, use GitHub's pre-release flag:

```bash
gh release create v0.2.0-alpha \
  --repo szl-holdings/platform \
  --title "v0.2.0-alpha — Production Infrastructure" \
  --notes-file docs/releases/v0.2.0-alpha.md \
  --prerelease
```

The current `v0.1.0` is labeled as the latest release (not pre-release) because it represents a stable, substantive public milestone even at alpha stage.

---

## Release Checklist

Before publishing each release:

- [ ] `docs/releases/v{X}.{Y}.{Z}.md` exists with substantive release notes
- [ ] `CHANGELOG.md` entry added for this version
- [ ] Version tag is accurate to SemVer policy
- [ ] No internal tooling paths, secrets, or unfinished features referenced in release notes
- [ ] Wiki sync completed if documentation changed significantly (see `ops/github/wiki-manual-steps.md`)

---

## Published Releases

| Version | Date | Title |
|---------|------|-------|
| v0.1.0 | 2026-04-01 | Initial Public Platform Release |

Future releases will be added to this table on publication.
