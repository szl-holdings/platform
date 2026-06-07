# README Rewrite Plan

Updated: 2026-04-16

## Problem

The root `README.md` and various app-level README files are inconsistent with the current app topology, reference deprecated apps, and do not point engineers or stakeholders to the correct canonical sources.

---

## Root README.md — Target Structure

The root `README.md` should be the single entry point for any new contributor or reviewer. It should be reorganized as follows:

### Proposed Sections

```markdown
# SZL Holdings — Platform

## What Is This?
[3–4 sentence overview of the platform and business]

## Artifact Index
[Table of active apps with preview path, status, and link to app README]

## Quick Start (Development)
[5 commands: clone, install, env setup, DB seed, dev server]

## Architecture
→ ops/infra/target-production-architecture.md

## Mobile (CORTEX)
→ ops/mobile/flagship-release-readiness.md

## Deployment
→ docs/deployment.md

## Security
→ SECURITY.md

## Contributing
→ CONTRIBUTING.md
```

### Artifact Index Table (Target)

| App | Preview Path | Status | README |
|-----|-------------|--------|--------|
| SZL Holdings (web) | `/` | Production | `artifacts/szl-holdings/README.md` |
| API Server | `/api/` | Production | `artifacts/api-server/README.md` |
| Aegis (Firestorm) | `/firestorm/` | Production | `artifacts/firestorm/README.md` |
| Terra | `/terra/` | Production | `artifacts/terra/README.md` |
| Vessels | `/vessels/` | Production | `artifacts/vessels/README.md` |
| Carlota Jo | `/carlota-jo/` | Production | `artifacts/carlota-jo/README.md` |
| Command | `/command/` | Production | `artifacts/command/README.md` |
| CORTEX Mobile | EAS / App Store | Alpha prep | `artifacts/cortex-mobile/README.md` |
| SZL Holdings Mobile | Deferred | — | — |
| Mockup Sandbox | `/__mockup` | Internal only | — |

**Remove from README**: prism-counsel, stephen-site, aegis (duplicate), imperium, lyte-command-center.

---

## App-Level README Rewrites Needed

### `artifacts/firestorm/README.md`
- Update title: "Aegis — Unified Defense & Intelligence Command"
- Add: "This is the canonical Aegis app. The `/aegis/` path is a deprecated duplicate."
- Link to: route inventory, API spec

### `artifacts/command/README.md`
- Add note: "This app merges Lyte Command Center and IMPERIUM functionality."
- Remove any references to those as separate apps

### `artifacts/cortex-mobile/README.md`
- Add: EAS build instructions, link to `ops/mobile/flagship-release-readiness.md`
- Add: test account and reviewer notes link
- Add: environment setup (Firebase placeholder replacement)

### `artifacts/szl-holdings/README.md`
- Add: "This is the primary public-facing web app and SZL Holdings dashboard."
- Link to Nexus, Forge, CORTEX intelligence, Distribution OS sections

---

## Docs to Update with Deprecation Notices

Add this banner to the top of each file:

```markdown
> **DEPRECATED** — This document has been superseded. See [`<replacement>`](<path>) for the current version.
```

| File | Replacement |
|------|------------|
| `BACKUP_AND_RECOVERY.md` | `ops/infra/recovery-and-backup-model.md` |
| `docs/disaster-recovery.md` | `ops/infra/recovery-and-backup-model.md` |
| `DEPLOYMENT_READINESS.md` | `ops/frontier/launch-readiness-scorecard.md` |
| `ENV_MATRIX.md` | `ops/infra/environment-matrix.md` |
| `ops/mobile/eas-secrets-matrix.md` | `ops/mobile/eas-and-store-secrets-matrix.md` |
| `ops/mobile/store-assets-checklist.md` | `ops/mobile/store-asset-inventory.md` |

---

## Execution Priority

| Priority | Item | Effort |
|----------|------|--------|
| P1 | Update root `README.md` artifact index | 30 min |
| P1 | Add deprecation banners to superseded docs | 30 min |
| P2 | Rewrite `artifacts/firestorm/README.md` | 15 min |
| P2 | Rewrite `artifacts/cortex-mobile/README.md` | 20 min |
| P3 | Create missing `artifacts/*/README.md` for each active app | 1 hour |
| P3 | Update `PRODUCT_SURFACE_MAP.md` to reflect current state | 30 min |

---

## Success Criteria

A new engineer should be able to:
1. Clone the repo and find the right app within 2 minutes using only `README.md`
2. Understand which apps are active vs deprecated without reading code
3. Find the canonical doc for any topic via the README → `ops/cleanup/canonical-source-map.md` path

---

*Execute this plan before the next investor demo or external review.*
