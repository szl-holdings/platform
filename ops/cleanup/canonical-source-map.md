# Canonical Source Map

Updated: 2026-04-20

## Purpose

One-stop reference for where to find the authoritative (canonical) version of every major topic in this codebase. Eliminates confusion when the same topic appears in multiple places.

> **Note:** As of 2026-04-20, 153 root-level markdown files were consolidated into `docs/` (see `audit/docs/consolidation-report.md`). Canonical Locations below have been updated to the new `docs/` paths. The Deprecated Alternatives column preserves the historical root filenames for discoverability.

---

## Architecture & Infrastructure

| Topic | Canonical Location | Deprecated Alternatives |
|-------|-------------------|------------------------|
| Production architecture | `ops/infra/target-production-architecture.md` | `ops/replit-agent/target-architecture.md`, `ARCHITECTURE.md` (deleted) |
| Environment matrix | `ops/infra/environment-matrix.md` | `ENV_MATRIX.md` (root, removed), `docs/ENVIRONMENT_SEPARATION.md` |
| Deployment strategy | `docs/deployment.md` | `DEPLOYMENT-GUIDE.md` → `docs/operations/deployment-guide.md`, `DEPLOYMENT_READINESS.md` (root, removed) |
| Backup and recovery | `ops/infra/recovery-and-backup-model.md` | `BACKUP_AND_RECOVERY.md` (root, removed), `BACKUP-RESTORE.md` → `docs/operations/backup-restore.md` |
| Infrastructure cost notes | `ops/infra/cost-and-complexity-notes.md` | None |
| Bicep templates | `infra/main.bicep`, `infra/parameters.json` | None |

---

## Mobile

| Topic | Canonical Location | Deprecated Alternatives |
|-------|-------------------|------------------------|
| Flagship mobile release plan | `ops/mobile/flagship-release-readiness.md` | `ops/mobile/flagship-mobile-release-plan.md` |
| EAS profiles and secrets | `ops/mobile/eas-and-store-secrets-matrix.md` | `ops/mobile/eas-secrets-matrix.md` |
| Store asset inventory | `ops/mobile/store-asset-inventory.md` | `ops/mobile/store-assets-checklist.md` |
| Reviewer notes and test accounts | `ops/mobile/reviewer-notes-and-test-accounts.md` | `APP_STORE_SUBMISSION_CHECKLIST.md` → `docs/product/app-store-checklist.md` (Phase 7) |
| TestFlight / Play runbook | `ops/mobile/testflight-play-internal-runbook.md` | None (keep as-is) |
| Full submission checklist | `docs/product/app-store-checklist.md` | `APP_STORE_SUBMISSION_CHECKLIST.md` (root, moved) |

---

## App Inventory and Topology

| Topic | Canonical Location | Deprecated Alternatives |
|-------|-------------------|------------------------|
| App inventory | `ops/replit-agent/target-architecture.md` (App Disposition Matrix) | `PRODUCT_SURFACE_MAP.md` → `docs/product/product-surface-map.md`, `PRODUCT-SURFACES.md` → `docs/product/product-surfaces.md` |
| Archive register | `ops/cleanup/archive-and-deprecate.md` | None |
| Route inventory | `docs/architecture/route-inventory.md` | `ROUTE_INVENTORY.md` (root, moved), `API-SPEC.md` → `docs/architecture/api-spec.md` (partial) |

---

## Security and Access Control

| Topic | Canonical Location | Deprecated Alternatives |
|-------|-------------------|------------------------|
| Security overview | `SECURITY.md` | `SECURITY-CHECKLIST.md` → `docs/security/security-checklist.md` (checklist format) |
| Access control matrix | `docs/security/access-control-matrix.md` | `ACCESS-CONTROL-MATRIX.md` (root, moved) |
| Incident response | `docs/operations/incident-response.md` | `INCIDENT_RESPONSE.md` (root, moved) |
| Security disclosure | `docs/security/security-disclosure.md` | `SECURITY_DISCLOSURE.md` (root, moved) |

---

## Product and Brand

| Topic | Canonical Location | Deprecated Alternatives |
|-------|-------------------|------------------------|
| Brand guidelines | `docs/sales/brand-guidelines.md` | `BRAND_GUIDELINES.md` (root, moved) |
| Product surfaces | `docs/product/product-surface-map.md` | `PRODUCT_SURFACE_MAP.md` (root, moved), `PRODUCT-SURFACES.md` → `docs/product/product-surfaces.md` (older version) |
| Company fact sheet | `docs/sales/company-fact-sheet.md` | `COMPANY_FACT_SHEET.md` (root, moved) |
| Category positioning | `docs/sales/category-positioning.md` | `CATEGORY_POSITIONING.md` (root, moved) |

---

## Operations and Processes

| Topic | Canonical Location | Deprecated Alternatives |
|-------|-------------------|------------------------|
| Release checklist | `docs/operations/release-checklist.md` | `RELEASE_CHECKLIST.md` (root, moved), `RELEASE_PROCESS.md` → `docs/operations/release-process.md` |
| Operations runbook | `docs/operations/operations-runbook.md` | `OPERATIONS-RUNBOOK.md` (root, moved) |
| Known gaps | `docs/operations/known-gaps.md` | `KNOWN-GAPS.md` (root, moved) |
| QA summary | `docs/operations/qa-summary.md` | `QA_SUMMARY.md` (root, moved) |
| Workspace guide | `docs/operations/workspace-guide.md` | `WORKSPACE_GUIDE.md` (root, moved) |

---

## Final Deliverables (Frontier)

| Document | Location |
|----------|----------|
| Final frontier report | `ops/frontier/final-frontier-report.md` |
| Executive summary | `ops/frontier/executive-summary.md` |
| Manual actions remaining | `ops/frontier/manual-actions-remaining.md` |
| Launch readiness scorecard | `ops/frontier/launch-readiness-scorecard.md` |
| Next 10 founder actions | `ops/frontier/next-10-founder-actions.md` |

---

## Conflict Resolution Rules

When two documents conflict:
1. The document listed as "Canonical Location" above wins.
2. If both conflict and neither is listed, the file in `ops/` wins over a root-level file.
3. If both are in `ops/`, the more recently dated file wins.
4. All conflicts should be resolved by updating the canonical file and adding a deprecation notice to the superseded file.

---

*Update this map whenever a new canonical document is created or an old one is deprecated.*
