# SZL Holdings — Repository Cleanup Report

**Audit date:** 2026-04-21  
**Scope:** Every junk file, orphan directory, stale screenshot, contradictory claim, and vanity metric that must be removed or corrected in the next task.

**Truth Label Key (applies to all factual findings in this document):**
- **VERIFIED** — confirmed from filesystem, grep, or direct file inspection
- **PARTIALLY VERIFIED** — partially confirmed; runtime or integration behavior not checked
- **UNVERIFIED** — asserted but not checked in this audit
- **BROKEN** — claim is contradicted by primary-source evidence

**Canonical metrics reference:** See `audit/counting-methodology.md` for exact reproducible shell commands for all counts used in this document.

---

## Orphan Directories — Slated for Deletion

| Directory | Status | Contents | Action | Audit Status |
|-----------|--------|----------|--------|--------------|
| `artifacts/firestorm/` | ARCHIVED (deregistered) | `ARCHIVED.md` only | **DELETE** — archive marker file only; no content | **VERIFIED** |
| `artifacts/imperium/` | Orphaned | `node_modules/` only; no `package.json` | **DELETE** — no package.json; node_modules orphan | **VERIFIED** |
| `artifacts/cortex-mobile/` | Concept stub | Expo `app/` directory; no `package.json` | **DECIDE** — scaffold or delete; current state misleads contributors | **VERIFIED** |

---

## Directories Misplaced in `artifacts/`

| Directory | Issue | Action | Audit Status |
|-----------|-------|--------|--------------|
| `artifacts/audit/` | Operational tooling output, not a deployable artifact | **MOVE** to `ops/audit/` or project root `audit/` | **VERIFIED** |
| `artifacts/internal-audit/` | 12 ops markdown files + capability manifest | **MOVE** to `ops/internal-audit/` | **VERIFIED** |

---

## Phase A Quarantine (Already Done)

These were quarantined to `archive/phase-a/` in Phase A — do not remove from archive:
- `01-thursday-intro.zip`
- `02-sunday-deep-dive.zip`
- `03-monday-operator-lens.zip`
- `LINKEDIN-LAUNCH.zip`
- `X-LAUNCH-SERIES.zip`

---

## Directories Deferred from Phase A (Pending Review)

| Directory | Files | Contents | Action |
|-----------|-------|----------|--------|
| `deliverables/` | 4 | PDFs, zips, launch plans | Review and remove or move to `archive/` |
| `output/` | 121 | Social kit content | Remove or move to `archive/` |
| `screenshots/` | 346 | Portfolio zip + screenshots | Remove stale; generate fresh after redesign |
| `backups/` | Several | SQL dump (`.gitignore`-covered), manifest | Retain `backup_manifest.json`; confirm SQL dump excluded from git |

---

## Contradictory Claims — Must Remove from All Public Surfaces

The following specific claims appear in README, org profile, landing pages, dashboards, or release notes and are contradicted by audit findings. Each must be corrected or removed before any investor review.

| Claim | Location(s) | What to Change | Audit Status |
|-------|-------------|----------------|--------------|
| "906 database tables" | `platform-facts.md`, any dashboard widget | Change to 915 (direct `pgTable(` definitions) or replace with qualitative description | **BROKEN** — VERIFIED: `grep -r "pgTable(" lib/db/src/schema/ --include="*.ts" \| wc -l` = 915 |
| "Active registered artifacts: 2" | `platform-facts.md` | Change to 15 registered artifacts | **BROKEN** — VERIFIED: workspace registry = 15; `.replit [[artifacts]]` = 2 (separate systems) |
| All platforms listed as "Live" | `PRODUCT_MATRIX.md` | Assign honest lifecycle states per artifact | **BROKEN** — VERIFIED: all 18 workflows NOT STARTED (system log) |
| "182 route files" | `APP_STATUS.md` | Change to 268 route groups / 382 files | **BROKEN** — VERIFIED: `find artifacts/api-server/src/routes -name "*.ts" \| wc -l` = 382 |
| "Domain packages: 77" | `platform-facts.md` | Change to 81 package directories (82 ls entries includes `packages/proxy-routes.ts`) | **BROKEN** — VERIFIED: `find packages -maxdepth 1 -mindepth 1 -type d \| wc -l` = 81 |
| "Total packages: 118" | `platform-facts.md` | Change to 122 (81 package dirs + 41 lib dirs) | **BROKEN** — VERIFIED: 81 + 41 = 122 |
| "RBAC roles: 7 (super_admin, exec, ops, compliance, maintenance, analyst, viewer)" | `PLATFORM_CANONICAL.md` | These 7 names don't exist in the schema; replace with actual enum values | **BROKEN** — VERIFIED: enum in `lib/db/src/schema/auth.ts` has 12 different values |
| "Authentication providers: Replit Auth, Clerk" | `platform-facts.md` | Remove Clerk unless it is actively wired | **BROKEN** — PARTIALLY VERIFIED: Clerk not found in active auth flow |
| "40+ connector integrations" | `PRODUCT_MATRIX.md` (Lyte) | Remove — unverified claim | **UNVERIFIED** — not confirmed in any audit scan |
| "Session store: Redis (enterprise production)" | `PLATFORM_CANONICAL.md` | Change to: "In-memory (all environments); Redis not yet activated" | **BROKEN** — PARTIALLY VERIFIED: Redis not activated per `OPEN_RISKS_AND_NEXT_10.md` |
| "FedRAMP readiness track" | `PRODUCT_MATRIX.md` (Aegis) | Remove or qualify as "roadmap" | **UNVERIFIED** — no FedRAMP work found in codebase |
| "STIX/TAXII protocol layer" | `PRODUCT_MATRIX.md` | Move to "PARTIALLY VERIFIED" language | **UNVERIFIED** — code pattern not confirmed in this audit |
| "MITRE ATT&CK v14 detection coverage" | `PRODUCT_MATRIX.md` | Qualify — coverage claim unverified | **UNVERIFIED** — routes present; coverage not measured |
| "AIS telemetry integration" | `PRODUCT_MATRIX.md` (Vessels) | Add disclosure: AIS is simulated; weather/NOAA real | **PARTIALLY VERIFIED** — simulation noted in `OPEN_RISKS_AND_NEXT_10.md`; NOAA/GDELT routes present |
| "Live NYC distress data pipeline" | `PRODUCT_MATRIX.md` (Terra) | Qualify — live polling unverified | **UNVERIFIED** — route exists; live-ness not confirmed (server not running) |

---

## Stale / Out-of-Date Documents

| Document | Issue | Action | Audit Status |
|----------|-------|--------|--------------|
| `docs/APP_STATUS.md` | Route count wrong; Lyte and PRISM marked archived but registered; lifecycle stale | Regenerate from verified facts | **BROKEN** — VERIFIED |
| `docs/platform-facts.md` | Multiple wrong counts (see above) | Update all wrong counts | **BROKEN** — VERIFIED |
| `launch/01_ability_matrix.json` | All `live_state` fields empty | Backfill from audit findings | **BROKEN** — VERIFIED (fields empty) |
| `docs/PLATFORM_CANONICAL.md` | RBAC role names wrong; session store claim wrong | Correct both | **BROKEN** — PARTIALLY VERIFIED |
| `docs/CANONICAL_INDEX.md` | Generally accurate but some referenced files may have moved | Verify all links |
| `docs/known-gaps.md` | Redirect file; target at `docs/operations/known-gaps.md` | Verify target is current |

---

## Competing Capability Manifest Files — Pick One

Three competing manifests, none referenced by CI:

| File | Status | Action |
|------|--------|--------|
| `artifacts/audit/platform-capability-manifest.json` | Stale | **DELETE** after audit/internal-audit move |
| `artifacts/internal-audit/capability-manifest.json` | Stale | **DELETE** after directory move |
| `docs/audit/capability-inventory.json` | Unknown | **REVIEW** — if current, retain as `audit/capability-inventory.json`; wire to CI |

---

## Architecture / Naming Inconsistencies

| Issue | Locations | Action |
|-------|-----------|--------|
| `Aegis` labeled both "Investor Pitch Deck" and "Cyber Resilience Command" | Artifact registry title vs. product matrix | Standardize to one name per artifact |
| `Sentra` overlaps with `Aegis` function (cyber defense) | Both serve security intelligence | See `audit/03-ui-ux-decisions.md` D-07 — merge Sentra into Aegis |
| `prism-counsel` registered AND `counsel` registered — two legal artifacts | Both at separate preview paths | Decide which is authoritative; deregister the other |
| `Lyte Command Center` and `Command` both running — two CORTEX surfaces | `/lyte/` and `/command/` | See `audit/03-ui-ux-decisions.md` D-04 — consolidate |

---

## Files That Should Never Have Been in Root

| Pattern | Files | Status |
|---------|-------|--------|
| `nohup.out` | Deleted in Phase A | DONE |
| `*.log` | Added to `.gitignore` in Phase A | DONE |
| ZIP archives at root | 5 quarantined to `archive/phase-a/` in Phase A | DONE |
| `GOMAXPROCS` references in 24 TypeScript/JavaScript files | Orphan from archived Go service | Remove in next code cleanup pass |

---

## Summary: Cleanup Priority Order

1. **Immediate (pre-investor review):** Correct all contradictory metric claims in docs (section above)
2. **Next task:** Delete `artifacts/firestorm/`, `artifacts/imperium/`; move `artifacts/audit/` and `artifacts/internal-audit/`
3. **Next sprint:** Decide on `artifacts/cortex-mobile/` (scaffold or delete); decide on `counsel` vs. `prism-counsel` consolidation
4. **Ongoing:** Review and archive `deliverables/`, `output/`, `screenshots/` directories
