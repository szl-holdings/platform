# SZL Holdings — Release Strategy

**Date:** April 2026

---

## Philosophy

SZL Holdings follows release discipline that reflects the professional standards of an enterprise software platform — not the informality of a personal project. Every release is documented, versioned, tagged, and communicated.

Release discipline serves two purposes:
1. **Internal:** Forces a deliberate checkpoint — "is this release-worthy?" — before pushing updates to the public mirror.
2. **External:** Demonstrates active, structured development to investors, evaluators, and technical reviewers.

---

## Versioning Policy

SZL Holdings follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html):

```
MAJOR.MINOR.PATCH
```

| Increment | When |
|-----------|------|
| **MAJOR** | Breaking changes to public API contracts, major architectural shifts, or significant platform redesigns that require migration |
| **MINOR** | New features, new platform capabilities, new integrations — backward-compatible |
| **PATCH** | Bug fixes, documentation updates, small improvements — backward-compatible |

### Pre-Release Labels

| Label | Format | Usage |
|-------|--------|-------|
| Alpha | `v0.1.0-alpha.1` | Internal only — not for public evaluation |
| Beta | `v0.1.0-beta.1` | Limited external access — design partners |
| RC | `v0.1.0-rc.1` | Release candidate — final validation before GA |

### Release Stages

| Range | Description |
|-------|-------------|
| `v0.x.x` | Pre-commercial — platform is built and demonstrable, not commercially deployed |
| `v1.x.x` | First commercial release — first paying customer deployed |
| `v2.x.x` | Major platform evolution — significant architecture or product change |

---

## Release Process

### Step 1: Pre-Release Validation

Before tagging a release:
- [ ] Run `scripts/public-mirror/validate-mirror.sh` — no errors
- [ ] Verify all platforms build cleanly (`pnpm -r build`)
- [ ] Update `CHANGELOG.md` with release notes
- [ ] Review `README.md` for accuracy
- [ ] Verify screenshots are current
- [ ] Run release checklist from `/docs/releases/release-checklist.md`

### Step 2: Tag the Release

```bash
git tag -a v0.1.0 -m "v0.1.0 — Initial public platform release"
git push origin v0.1.0
```

### Step 3: Create GitHub Release

Create a GitHub Release from the tag via the GitHub UI or API:
- Title: `v0.1.0 — Platform title`
- Body: Contents of the corresponding release notes file
- Mark as latest release (for GA releases)
- For pre-releases, check the "pre-release" box

### Step 4: Update Repository Metadata

After each significant release:
- Update GitHub repository description if the platform scope has changed
- Update homepage URL if the canonical URL has changed
- Add/update repository topics if new verticals or capabilities have been added

---

## Release Cadence

| Type | Cadence | Notes |
|------|---------|-------|
| Patch releases | As needed | Bug fixes and small improvements |
| Minor releases | Monthly (while in active development) | Feature milestones |
| Major releases | Per major commercial milestone | v1.0 = first commercial deployment |

Releases are not scheduled — they are tied to meaningful milestones. We do not release for the sake of a calendar.

---

## Branch Strategy

```
master — always the current release (public mirror)
No feature branches are published
All development happens in Replit workspace
```

Every push to `master` represents a publishable state of the platform.

---

*See also: [Versioning Policy](versioning-policy.md) · [Release Checklist](release-checklist.md) · [v0.1.0 Release Notes](v0.1.0.md)*
