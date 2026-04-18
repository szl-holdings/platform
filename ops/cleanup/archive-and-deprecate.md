# Archive and Deprecate Register

Updated: 2026-04-18

## Purpose

This document tracks every app, document, and script that has been identified as stale, duplicate, or superseded, along with its disposition status and the canonical replacement.

---

## App Disposition

### Archive / Deprecate Immediately

Five artifact directories (see `ops/frontier/disposition-matrix.md` for the full per-artifact record) were identified as stale, duplicate, or superseded. All have been deregistered from the artifact registry as of 2026-04-18.

**Summary of dispositions:**
- Duplicate security entry point → deregistered; superseded by `artifacts/aegis`
- Unbuilt infrastructure tool stub → deregistered; merged into `artifacts/command`
- Legacy ops command surface → deregistered; merged into `artifacts/command`
- Legal matter management platform → deregistered; backend data retained in api-server
- Founder portfolio site → deregistered; content at `/founder` in `szl-holdings`

### Mobile App Stubs (Archive)

The following mobile app directories exist as empty stubs and should be archived or deleted:

| Directory | Status |
|-----------|--------|
| `aegis-mobile` (if exists) | Empty stub — archive |
| `alloy-mobile` (if exists) | Empty stub — archive |
| `carlota-jo-mobile` (if exists) | Empty stub — archive |
| `forge` (if exists) | Empty stub — archive |
| `inca-lab` (if exists) | Empty stub — archive |
| `lyte-mobile` (if exists) | Empty stub — archive |
| `nexus` (if exists) | Empty stub — archive |
| `partner-portal` (if exists) | Empty stub — archive |
| `stephen-mobile` (if exists) | Empty stub — archive |
| `terra-mobile` (if exists) | Empty stub — archive |
| `vessels-mobile` (if exists) | Empty stub — archive |

> Note: Only `artifacts/cortex-mobile` and `artifacts/szl-holdings-mobile` are retained. All others are archived.

### Deferred (Not Deprecated)

| App | Status | Resume Trigger |
|-----|--------|----------------|
| `artifacts/szl-holdings-mobile` | Deferred until CORTEX ships | CORTEX Alpha release |
| `artifacts/mockup-sandbox` | Internal dev tool, keep running | Always |

---

## Document Deprecations

### Root-Level Docs Superseded by Canonical Ops Files

| Deprecated File | Superseded By | Action |
|----------------|--------------|--------|
| `BACKUP_AND_RECOVERY.md` | `ops/infra/recovery-and-backup-model.md` | Add deprecation notice at top |
| `docs/disaster-recovery.md` | `ops/infra/recovery-and-backup-model.md` | Add deprecation notice at top |
| `DEPLOYMENT_READINESS.md` | `ops/infra/target-production-architecture.md` + `ops/frontier/launch-readiness-scorecard.md` | Add deprecation notice |
| `ENV_MATRIX.md` | `ops/infra/environment-matrix.md` | Add deprecation notice |
| `ops/mobile/eas-secrets-matrix.md` | `ops/mobile/eas-and-store-secrets-matrix.md` | Add deprecation notice |
| `ops/mobile/store-assets-checklist.md` | `ops/mobile/store-asset-inventory.md` | Add deprecation notice |
| `ops/replit-agent/target-architecture.md` | `ops/infra/target-production-architecture.md` | Add deprecation notice |

### Deprecation Notice Template

Add the following to the top of each deprecated file:

```markdown
> **DEPRECATED** — This document has been superseded by [`<canonical file>`](<path>).
> This file is retained for historical reference only. Do not update it.
```

---

## Script and Workflow Cleanup

### Obsolete Scripts

| Script | Reason | Action |
|--------|--------|--------|
| Any script that seeds with test data that remains in DB | Test data leaks | Add cleanup step or mark as "run in dry-run only" |
| Duplicate seed scripts for deprecated apps | Dead code | Remove after confirming no references |

### Obsolete Workflows

No active workflows are marked for removal at this time. If workflows for deprecated apps exist, remove via workflow management.

---

## Deprecation Execution Checklist

- [ ] Add deprecation notices to all root-level docs listed above
- [x] Remove duplicate artifact registration — **Done 2026-04-18**
- [x] Remove deprecated artifact registrations from artifact registry — **Confirmed not registered (2026-04-18)**
- [x] Audit all `import` and cross-link references to deprecated apps — **Done 2026-04-18** (README.md artifact inventory table and PRODUCT-SURFACES.md updated)
- [x] Update `README.md` to remove references to deprecated apps — **Done 2026-04-18** (removed stale artifact rows from inventory table)
- [x] Update `PRODUCT_SURFACE_MAP.md` and `PRODUCT-SURFACES.md` to reflect current state — **Done 2026-04-18** (PRODUCT-SURFACES.md updated; PRODUCT_SURFACE_MAP.md had no references)
- [x] Verify no CI jobs reference deprecated app directories — **Done 2026-04-18** (removed stale entries from build.yml and e2e.yml; legacy archived CI workflow already disabled)

---

*Maintain this document as the single register of what is deprecated and what replaces it.*
