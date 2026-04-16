# Surface Area Audit — Archive / Quarantine / Delete Decisions

**Status:** Authoritative  
**Date:** April 16, 2026  
**Scope:** `.archive/`, `backups/`, `attached_assets/`, `project-export.zip`, `seed-data/`, `demo-assets/`

This document records explicit keep/quarantine/delete decisions for all non-primary-runtime material found in the monorepo root. These decisions were made as part of the Series A Audit (Waves 3–4) surface area reduction.

---

## Decision Summary

| Path | Decision | Rationale |
|------|----------|-----------|
| `.archive/alloy-archived/` | **Keep — archived** | Intentionally archived historical artifact (pre-rename Alloy project). Not in any active import path. No action needed. |
| `backups/backup_manifest.json` | **Keep — documented** | Runtime backup manifest, referenced by disaster-recovery runbook. Not a product artifact. |
| `backups/daily_20260401T124214Z.sql.gz` | **Keep — quarantined** | Point-in-time SQL dump. Not runtime material. Must not be referenced by any application code. Should be moved to a non-workspace object store in production; acceptable as-is for development environment. |
| `backups/szl-master-20260401-184931/` | **Keep — quarantined** | Historical snapshot of platform pages for a specific date. Contains `.tsx` page files (design-partners, investor-relations, investor-story, landing, portfolio, trust-center, ventures). These are archival snapshots, not active source files. Not in any import path. |
| `backups/szl-master-20260402-134816/` | **Keep — quarantined** | Same rationale as the above backup snapshot. Archival only. |
| `attached_assets/` | **Keep — quarantined** | Contains AI agent payload `.txt`/`.md` files (historical agent output) and `.png` images (screenshots and uploaded references). Not imported by any application. No runtime dependency. Must not be referenced in product code. Acceptable to retain for provenance; production deployment should exclude via `.replitignore`. |
| `project-export.zip` | **Delete** | 187MB binary zip of the full workspace export. No runtime purpose. Not a product artifact. Not importable. Wastes storage and confuses the surface area. **Deleted.** |
| `seed-data/` | **Keep — gated** | Legitimate seed data for demo/development modes. Must only be served when `isSeedDataAllowed()` returns `true` (i.e., non-production modes). All routes consuming seed data must check runtime mode before serving. |
| `demo-assets/` | **Keep — documented** | LinkedIn carousel, long-form posts, and marketing screenshots. Not runtime material — no application imports from here. Acceptable to retain as brand/go-to-market collateral. |

---

## `.archive/` — Detail

### `.archive/alloy-archived/`

**Decision: KEEP — already archived**

This directory contains the archived predecessor of the Alloy execution fabric, preserved before the rename and consolidation. It was intentionally moved here and is structurally isolated:
- No active package imports reference it
- Not included in `pnpm-workspace.yaml` glob patterns
- Has its own `package.json`, `node_modules`, and `dist` (frozen state)

**Action taken:** No changes. Existing archive boundary is correct.

---

## `backups/` — Detail

### `backups/backup_manifest.json`

**Decision: KEEP — operational reference**

Contains the backup schedule and retention policy metadata. Referenced by `docs/BACKUP-RESTORE.md` and `docs/disaster-recovery.md`. Not a runtime dependency.

### `backups/daily_20260401T124214Z.sql.gz`

**Decision: KEEP — quarantined**

A 3.1MB gzipped PostgreSQL dump from April 1, 2026. This is a legitimate backup artifact but it should not travel to production deployments. It is excluded from Docker images via `.dockerignore` and from the Replit production runtime via `.replitignore`.

**Constraint:** No application code may import or reference this file. If automated backup retention is needed, move to object storage (`lib/object-storage-web`) in a future wave.

### `backups/szl-master-20260401-184931/` and `backups/szl-master-20260402-134816/`

**Decision: KEEP — quarantined snapshot**

These directories contain `.tsx` page snapshots (landing, portfolio, investor-relations, etc.) from specific dates. They represent historical design states captured before major refactors. They are:
- Not included in any `pnpm-workspace.yaml` glob
- Not imported by any active artifact
- Not part of any build graph

**Constraint:** These files must not be re-integrated into active artifacts without an explicit decision. If the content is needed, the specific page should be extracted and reviewed before merging.

---

## `attached_assets/` — Detail

**Decision: KEEP — quarantined**

Contains:
- AI agent payload files (`.txt`, `.md`) — historical outputs from early planning sessions
- Platform screenshots (`.png`) — used during design and planning phases

**Status:** These files have no runtime import path and are excluded from production deployments via `.replitignore`. They serve as archival provenance and should remain until an explicit decision is made to delete them.

**Constraint:** No active code may import from `attached_assets/`. If any file is needed as a runtime asset, it must be moved to `public/` within the relevant artifact or to object storage.

---

## `project-export.zip` — Detail

**Decision: DELETE**

This 187MB zip file is a full workspace export snapshot. It:
- Has no runtime import path
- Cannot be required/imported by any module
- Consumes significant storage
- Does not belong in the active product surface

**Action taken:** Deleted. If a workspace export is needed in the future, it should be stored in object storage or a separate backup artifact, not committed to the monorepo root.

---

## `seed-data/` — Detail

**Decision: KEEP — gated behind runtime mode**

Contains JSON files for Vessels (fleet, voyage, AIS records, port deficiencies, etc.) and Lyte (signals, incidents, playbooks, command cards). These are legitimate demo data assets.

**Runtime mode gate:** All application code that reads from `seed-data/` must call `isSeedDataAllowed()` (from `@szl-holdings/config`) before serving the data. In production mode, this returns `false` and the application must surface a real data fetch or a clean "no data" state.

**Labeling requirement:** Any UI surface backed by seed data must display a "Demo" badge or "Simulated" annotation per `docs/operations/runtime-modes.md`.

---

## `demo-assets/` — Detail

**Decision: KEEP — marketing collateral**

Contains LinkedIn posts, carousels, and screenshots used for go-to-market purposes. These are not runtime dependencies and are not imported by any artifact. Acceptable to retain in the monorepo as brand collateral.

---

## Repo Boundary Enforcement

All quarantined directories are excluded from production deployment builds via `.replitignore`
(which doubles as `.dockerignore` per the file header comment). Verified entries:

| Path | `.replitignore` entry | Status |
|------|-----------------------|--------|
| `.archive/` | `.archive/` | ✅ Excluded |
| `backups/` | `backups/` | ✅ Excluded |
| `attached_assets/` | `attached_assets/` | ✅ Excluded |
| `exports/` | `exports/` | ✅ Excluded |
| `project-export.zip` | `project-export.zip` (added this wave) | ✅ Excluded + deleted |

These exclusions ensure no historical, backup, or non-runtime material reaches production
deployment images regardless of future adds to those directories.

---

## Orphaned / Ambiguous Areas Resolved

### `spfx-webparts/`

**Decision: KEEP — active Microsoft integration**

SharePoint Framework web parts for embedding SZL signals in SharePoint. Active integration surface referenced in `packages/atlassian-connect/` and the `sharepoint_spfx_enabled` platform flag. Not dead code.

### `elite-layer/`

**Decision: KEEP — monitoring infra**

Contains monitoring/alerting configuration. Referenced by the observability runbook. Not a product artifact, not dead code.

### `profile-readme/`

**Decision: KEEP — documented**

GitHub profile README generator. Marketing surface, not a runtime dependency. Acceptable to retain.

### `analytics/` and `content/` root directories

**Decision: KEEP — documented**

Analytics event taxonomy and content management configuration files. Non-runtime operational references. Not in any application import path.

---

## Duplicate Utility Code — Findings

A scan of utility patterns across artifacts identified the following:

| Pattern | Finding | Decision |
|---------|---------|----------|
| `cn()` (clsx + tailwind-merge) | Defined in multiple artifact `lib/utils.ts` files | Acceptable — each artifact bundles independently via Vite. No consolidation needed. |
| `formatCurrency()` / `formatDate()` | Scattered across artifact `lib/utils.ts` files | Should migrate to `lib/shared-ui` in a future wave. Noted in KNOWN-GAPS. |
| Runtime mode checks (`process.env.DEMO_MODE`) | Previously scattered across `api-server` routes | Consolidated into `lib/config/src/runtime-mode.ts` in this wave. |
| `getRequiredEnv()` / `getOptionalEnv()` | Defined in `lib/config/src/index.ts`, re-implemented in `api-server` | `api-server` should import from `@szl-holdings/config`. Tracked for future hardening wave. |

---

## Package Scripts Audit — Findings

| Package | build | dev | typecheck | test | Finding |
|---------|-------|-----|-----------|------|---------|
| `artifacts/api-server` | ✅ | ✅ | ✅ | — | Consistent |
| `artifacts/szl-holdings` | ✅ | ✅ | ✅ | — | Consistent |
| `artifacts/aegis` | ✅ | ✅ | ✅ | — | Consistent |
| `artifacts/vessels` | ✅ | ✅ | ✅ | — | Consistent |
| `artifacts/terra` | ✅ | ✅ | ✅ | — | Consistent |
| `artifacts/carlota-jo` | ✅ | ✅ | ✅ | — | Consistent |
| `artifacts/command` | ✅ | ✅ | ✅ | — | Consistent |
| `lib/config` | — | — | ✅ (tsc) | — | No dev/build — library, exports src directly |
| `lib/db` | ✅ | — | ✅ | — | Consistent |
| `lib/shared-ui` | ✅ | — | ✅ | — | Consistent |
| `packages/*` (most) | — | — | — | — | Stub packages without scripts — expected at this stage |

**Finding:** Script patterns are consistent across the deployable artifacts. Library packages (`lib/*`) have fewer scripts because they are consumed via TypeScript project references rather than bundled independently. No remediation needed in this wave.

---

## Ownership and Criticality Register

| Package | Owner | Criticality | Notes |
|---------|-------|-------------|-------|
| `artifacts/api-server` | Engineering | P0 — production | Single backend for all platform domains |
| `lib/db` | Engineering | P0 — production | Drizzle schema, migrations, seed |
| `lib/auth` | Engineering | P0 — production | OIDC session handling |
| `lib/config` | Engineering | P0 — shared | Runtime mode, platform flags, env spec |
| `artifacts/szl-holdings` | Product | P1 — investor-facing | Corporate site |
| `artifacts/aegis` | Product | P1 — customer-facing | Defense & Intelligence command |
| `artifacts/vessels` | Product | P1 — customer-facing | Maritime intelligence |
| `artifacts/terra` | Product | P1 — customer-facing | Real estate intelligence |
| `artifacts/carlota-jo` | Product | P1 — customer-facing | Advisory platform |
| `artifacts/command` | Product | P1 — internal | Unified command dashboard |
| `lib/shared-ui` | Design | P2 — shared | Cross-app component library |
| `lib/ai-engine` | Engineering | P2 — shared | AI inference orchestration |
| `lib/services` | Engineering | P2 — shared | Third-party connector adapters |
| `lib/observability` | Engineering | P2 — shared | APM, logging, metrics |
| `packages/*` | Engineering | P3 — marketplace | Atlassian Connect, Salesforce AppExchange |
| `demo-assets/` | Marketing | P3 — collateral | LinkedIn/marketing content |
| `.archive/` | Engineering | P4 — archival | Historical preserved state |
| `backups/` | Engineering | P4 — backup | Point-in-time SQL/page snapshots |
