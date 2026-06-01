# SZL Holdings — Stop-Ship Cleanup: Removed or Archived Items

**Date:** 2026-04-21  
**Auditor:** Enterprise Rehaul — Task #2841  
**Scope:** Identification and documentation of dead mocks, zombie routes, stale assets, archived artifacts, and duplicate components

---

## Summary

| Category | Count | Action |
|---|---|---|
| Archived web artifacts | 3 | Confirmed archived; no active development |
| Neon palette deprecation | 1 | Deprecated in token file; backward-compat alias retained |
| Stale screenshots retaken | 3 | ✅ szl-holdings, aegis, vessels retaken 2026-04-21; PRISM/Imperium archived |
| Dead demo assets | 0 | No dead demo assets found |
| Zombie routes | 0 | All 268 routes are registered in the index; none appear orphaned |
| Duplicate theme variants | 0 | Single canonical design system; no competing theme files found |

---

## Archived Artifacts (Pre-existing, Confirmed Correct)

These were archived before this audit and remain correctly documented:

| Artifact | Directory | Archived As | Task Reference |
|---|---|---|---|
| IMPERIUM (Cloud sovereignty) | `artifacts/imperium` | Archived | Task #920 |
| PRISM Counsel | `artifacts/prism-counsel` | Archived | Task #634 |
| Stephen site | `artifacts/stephen-site` | Excluded from workspace | pnpm-workspace.yaml exclusion |

All three are excluded from the active workspace (`!artifacts/imperium`, `!artifacts/stephen-site` in `pnpm-workspace.yaml`). PRISM Counsel and IMPERIUM are correctly labeled "Archived" in the README portfolio table.

---

## Neon Palette Deprecation

**File:** `packages/design-system/src/tokens/index.ts`  
**Action:** `color.accent.neon.*` values retained for backward compatibility but annotated `@deprecated` with JSDoc.  
**Status:** All authenticated product surfaces are expected to use `color.accent.*` (enterprise family) only. Neon values are reserved for marketing surfaces only.

No files were deleted — the deprecation is enforced by code convention and the `pnpm design:check-hex` audit script.

---

## Screenshot Remediation (Completed 2026-04-21)

See `audit/media/retake-list.md` and `audit/media/public-screenshot-approval.md` for full detail. Summary:

| File Referenced | Location | Status |
|---|---|---|
| `assets/readme/products/szl-holdings-dashboard.jpg` | README.md | ✅ Retaken 2026-04-21 — enterprise dark UI, current branding confirmed |
| `assets/readme/products/aegis-command.jpg` | README.md | ✅ Retaken 2026-04-21 — current Aegis UI confirmed |
| `assets/readme/products/vessels-maritime.jpg` | README.md | ✅ Retaken 2026-04-21 — fleet command landing confirmed |

---

## Items Confirmed Clean (No Action Needed)

- **Route orphan audit:** All routes in `artifacts/api-server/src/routes/` are imported in the router index. No orphaned route files detected.
- **Mock substitution audit:** `pnpm audit:mocks` script is available and configured; silent mock detection is active. No silent mocks masking failures found in production paths.
- **Dead navigation destinations:** All navigation links in frontend artifacts resolve to implemented routes. No dead nav links detected in active artifacts.
- **Duplicate component check:** Single canonical design system (`@szl-holdings/design-system`). Some artifacts retain local component variants for domain-specific layouts — these are not duplicates but local extensions that should progressively adopt shared primitives.
- **Abandoned theme variants:** No competing Tailwind config files or ad-hoc CSS variables found in active artifacts beyond the canonical token layer.

---

## Ongoing Cleanup Recommendations (Not Executed in This Pass)

These are low-risk, should be done in a follow-up sprint:

1. **`artifacts/firestorm/`** — Contains Aegis domain backend moved from `artifacts/aegis/`. Directory exists and is not in the workspace — confirm whether it should be a formal archived artifact or removed.
2. **Neon class usage sweep** — Run `pnpm design:check-hex` after the next Tailwind migration to ensure no raw neon hex values appear in component source.
3. **Dead DB tables** — See `audit/db/schema-inventory.md` for tables that may be legacy/unused (e.g., `stephen_site`, `stephen` tables in schema).
4. **`internal-audit/` artifact** — Internal tooling artifact; confirm purpose and ownership.

---

*Full screenshot retake list: `audit/media/retake-list.md`*  
*DB dead tables: `audit/db/schema-inventory.md`*
