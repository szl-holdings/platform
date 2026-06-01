# SZL Holdings — Versioning Policy

**Date:** April 2026

---

## Platform Version

The platform version (`MAJOR.MINOR.PATCH`) represents the state of the **entire SZL Holdings ecosystem** — not individual applications. A version increment reflects a meaningful change to the platform, not a change to a single artifact.

Individual artifact versioning is managed in each artifact's `package.json`, but public releases are cut at the monorepo level.

---

## What Triggers a Version Increment

### MAJOR (`x.0.0`)

- Breaking change to the public API specification (`lib/api-spec/`)
- Database migration that requires data transformation (destructive migration)
- Removal or rename of a public-facing platform or product
- Architectural change that requires consumer code updates (e.g., auth model change)

### MINOR (`0.x.0`)

- New platform feature (new PRISM dimension, new Alloy capability, etc.)
- New platform vertical added to the ecosystem
- New integration added to the connector library
- New mobile application released
- New marketplace package published
- Non-breaking API additions

### PATCH (`0.0.x`)

- Bug fixes (UI, API, data processing)
- Documentation improvements
- Dependency updates without behavioral change
- Configuration improvements
- Performance improvements without API change

---

## Special Milestones

| Milestone | Version | Description |
|-----------|---------|-------------|
| Current public mirror | v0.1.0 | Full platform implemented, pre-revenue |
| Revenue activation | v0.2.0 | Stripe billing active, first paid plan |
| First commercial deployment | v1.0.0 | First enterprise customer deployed |
| SOC 2 Type I | v1.1.0 (estimated) | Compliance certification achieved |
| FedRAMP Moderate (Aegis) | v2.0.0 (estimated) | Government sector readiness |

---

## Package Versions

Individual packages (`lib/*`, `artifacts/*`) use independent versioning in their `package.json`. These are not published to npm — they are internal workspace packages using `workspace:*` dependency references.

The monorepo release version is the canonical public version of the platform.

---

## Changelog Requirements

Every release requires a `CHANGELOG.md` entry with:
- Version number and date
- What's new (Added)
- What changed (Changed)
- What was deprecated (Deprecated)
- What was removed (Removed)
- What was fixed (Fixed)
- Security improvements (Security)

A release without a changelog entry is not a complete release.
