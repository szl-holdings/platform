# Canonical Source Map

Updated: 2026-04-16

## Purpose

One-stop reference for where to find the authoritative (canonical) version of every major topic in this codebase. Eliminates confusion when the same topic appears in multiple places.

---

## Architecture & Infrastructure

| Topic | Canonical Location | Deprecated Alternatives |
|-------|-------------------|------------------------|
| Production architecture | `ops/infra/target-production-architecture.md` | `ops/replit-agent/target-architecture.md`, `ARCHITECTURE.md` |
| Environment matrix | `ops/infra/environment-matrix.md` | `ENV_MATRIX.md`, `docs/ENVIRONMENT_SEPARATION.md` |
| Deployment strategy | `docs/deployment.md` | `DEPLOYMENT-GUIDE.md`, `DEPLOYMENT_READINESS.md` |
| Backup and recovery | `ops/infra/recovery-and-backup-model.md` | `BACKUP_AND_RECOVERY.md`, `docs/disaster-recovery.md` |
| Infrastructure cost notes | `ops/infra/cost-and-complexity-notes.md` | None |
| Bicep templates | `infra/main.bicep`, `infra/parameters.json` | None |

---

## Mobile

| Topic | Canonical Location | Deprecated Alternatives |
|-------|-------------------|------------------------|
| Flagship mobile release plan | `ops/mobile/flagship-release-readiness.md` | `ops/mobile/flagship-mobile-release-plan.md` |
| EAS profiles and secrets | `ops/mobile/eas-and-store-secrets-matrix.md` | `ops/mobile/eas-secrets-matrix.md` |
| Store asset inventory | `ops/mobile/store-asset-inventory.md` | `ops/mobile/store-assets-checklist.md` |
| Reviewer notes and test accounts | `ops/mobile/reviewer-notes-and-test-accounts.md` | `APP_STORE_SUBMISSION_CHECKLIST.md` (Phase 7) |
| TestFlight / Play runbook | `ops/mobile/testflight-play-internal-runbook.md` | None (keep as-is) |
| Full submission checklist | `APP_STORE_SUBMISSION_CHECKLIST.md` | None (keep as reference) |

---

## App Inventory and Topology

| Topic | Canonical Location | Deprecated Alternatives |
|-------|-------------------|------------------------|
| App inventory | `ops/replit-agent/target-architecture.md` (App Disposition Matrix) | `PRODUCT_SURFACE_MAP.md`, `PRODUCT-SURFACES.md` |
| Archive register | `ops/cleanup/archive-and-deprecate.md` | None |
| Route inventory | `ROUTE_INVENTORY.md` | `API-SPEC.md` (partial) |

---

## Security and Access Control

| Topic | Canonical Location | Deprecated Alternatives |
|-------|-------------------|------------------------|
| Security overview | `SECURITY.md` | `SECURITY-CHECKLIST.md` (checklist format) |
| Access control matrix | `ACCESS-CONTROL-MATRIX.md` | None |
| Incident response | `INCIDENT_RESPONSE.md` | None |
| Security disclosure | `SECURITY_DISCLOSURE.md` | None |

---

## Product and Brand

| Topic | Canonical Location | Deprecated Alternatives |
|-------|-------------------|------------------------|
| Brand guidelines | `BRAND_GUIDELINES.md` | None |
| Product surfaces | `PRODUCT_SURFACE_MAP.md` | `PRODUCT-SURFACES.md` (older version) |
| Company fact sheet | `COMPANY_FACT_SHEET.md` | None |
| Category positioning | `CATEGORY_POSITIONING.md` | None |

---

## Operations and Processes

| Topic | Canonical Location | Deprecated Alternatives |
|-------|-------------------|------------------------|
| Release checklist | `RELEASE_CHECKLIST.md` | `RELEASE_PROCESS.md` |
| Operations runbook | `OPERATIONS-RUNBOOK.md` | None |
| Known gaps | `KNOWN-GAPS.md` | None |
| QA summary | `QA_SUMMARY.md` | None |
| Workspace guide | `WORKSPACE_GUIDE.md` | None |

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
