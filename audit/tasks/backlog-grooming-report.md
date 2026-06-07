# Backlog Grooming Report
**Date:** April 20, 2026
**Task:** #2674 — Series A gap: groom the 940+ task backlog

---

## Summary Counts

| Metric | Count |
|--------|-------|
| PROPOSED tasks at start of grooming | 93 |
| Tasks kept as-is (no changes made) | 81 |
| Tasks kept (survivors, description updated to absorb merged scope) | 4 |
| Tasks cancelled (duplicates — scope absorbed by survivor) | 4 |
| Tasks cancelled (manual/business — no code deliverable possible) | 4 |
| **Total cancellations** | **8** |
| **Remaining open PROPOSED tasks** | **85** |

Arithmetic check: 81 + 4 + 8 = 93 ✓ · remaining open = 81 + 4 = 85 ✓

---

## Merges

The following tasks had scope from duplicates absorbed into them. The
cancelled duplicates reference these survivors.

| Survivor | Absorbed From | Rationale |
|----------|---------------|-----------|
| **#1264** — Extend the cleanup helper to cover all POST-creating tests | #1280 (Auto clean up test records) | Both describe the same goal: ensure all POST-creating integration tests register created records for automatic deletion. #1264 is more specific about the mechanism. |
| **#1290** — Update Lyte-branded references inside Command + SZL Holdings dashboard | #1291 (Update Ecosystem Map to reflect Command instead of Lyte) | Both are part of the same Lyte→Command rebranding pass across two artifact directories. Consolidating keeps the rename in one coherent task. |
| **#1310** — Automatically write back corrected numbers into docs when they drift | #1295 (Script that auto-updates docs when metrics change) | Both describe adding an automated fix mode to the doc-sync script. #1310 already names the specific mechanism (`--fix` flag); #1295 describes the same at a higher level. |
| **#1323** — Replace mythology terminology in the Agent Orchestration UI | #1322 (Rename the remaining Inca-named source file) | The file rename (chasqui-relay.tsx → signal-routing.tsx) is a one-step sub-task of the broader mythology cleanup. Keeping them separate creates unnecessary overhead. |

---

## Cancellations

### Cancelled — duplicates (scope absorbed by survivor)

| Task | Merged Into |
|------|-------------|
| **#1280** — Automatically clean up test records created by integration tests | #1264 |
| **#1291** — Update the Ecosystem Map visual to reflect Command instead of Lyte | #1290 |
| **#1295** — Add a script that auto-updates docs whenever platform metrics change | #1310 |
| **#1322** — Rename the remaining Inca-named source file to match its display label | #1323 |

### Cancelled — manual web UI tasks (not automatable by a code agent)

| Task | Reason |
|------|--------|
| **#1297** — Upload branded social preview images to both GitHub repos | GitHub provides no API for setting repo social preview images; requires a human admin to upload via the GitHub web UI. The images already exist in the codebase. |
| **#1298** — Pin the platform monorepo on the GitHub org profile page | GitHub provides no API for repo pinning on an org profile; requires a human admin action in the web UI. |
| **#1302** — Capture CORTEX mobile app screenshots on a real device | Expo dev server requires a physical device or emulator via QR code; automated screenshot tooling cannot reach it. Purely operational / manual task. |

### Cancelled — external business decision (not a code task)

| Task | Reason |
|------|--------|
| **#1303** — Upgrade to GitHub Team plan to enable deployment approval gates | This is a billing/account upgrade that must be taken by an org owner through the GitHub billing UI. The codebase work is already done; only the plan upgrade is pending. |

---

## All Cancelled Tasks — Full Appendix

| Task Ref | Title | Category | Merged Into / Reason |
|----------|-------|----------|----------------------|
| #1280 | Automatically clean up test records created by integration tests | Duplicate | Merged into #1264 |
| #1291 | Update the Ecosystem Map visual to reflect Command instead of Lyte | Duplicate | Merged into #1290 |
| #1295 | Add a script that auto-updates docs whenever platform metrics change | Duplicate | Merged into #1310 |
| #1322 | Rename the remaining Inca-named source file to match its display label | Duplicate | Merged into #1323 |
| #1297 | Upload branded social preview images to both GitHub repos | Manual web UI | GitHub has no API for this; requires human admin action |
| #1298 | Pin the platform monorepo on the GitHub org profile page | Manual web UI | GitHub has no API for pinning; requires human admin action |
| #1302 | Capture CORTEX mobile app screenshots on a real device | Manual device | Expo QR-code flow requires physical device; not automatable |
| #1303 | Upgrade to GitHub Team plan to enable deployment approval gates | Business decision | Billing upgrade by org owner; no code deliverable |

---

## Themes That Survived (top clusters among 85 remaining tasks)

| Theme | Approx. Tasks | Representative Tasks |
|-------|--------------|---------------------|
| **CI / Testing / QA** | 14 | #1262–#1266, #1270–#1271, #1281, #1308, #1316–#1317, #1327, #1357–#1358 |
| **Terra / Real Estate** | 13 | #1267–#1269, #1272–#1277, #1336–#1343 |
| **AI / Governance / Signal** | 12 | #1285–#1289, #1312–#1314, #1341–#1343, #1349–#1351 |
| **Signal Chain / Directives** | 5 | #1344–#1348 |
| **Mobile / CORTEX** | 4 | #1278–#1279, #1363–#1364 |
| **Security** | 5 | #1315–#1316, #1324–#1326 |
| **GitHub / Docs / Release** | 7 | #1284, #1296, #1301, #1309–#1311, #1320–#1321 |
| **Aegis / Investor / Deal** | 7 | #1299–#1300, #1305–#1306, #1352–#1356 |
| **Geospatial Map** | 3 | #1292–#1294 |
| **Branding / Naming** | 3 | #1290, #1323 |
| **Command / Convergence** | 3 | #1361–#1362, #1365 |
| **Misc / single-item** | ~9 | #1282–#1283, #1304, #1315, #1326, etc. |

---

## Gap Themes Noticed (no current task covers these)

The following gaps were observed during grooming. No new feature tasks were
created per task instructions; two were surfaced as follow-up proposals
(#2681, #2682).

1. **Accessibility (a11y)** — No task covers keyboard navigation, screen
   reader support, or WCAG compliance across any artifact.
   → Proposed as follow-up #2681.
2. **Error-boundary / graceful degradation** — No task addresses what users
   see when an AI service or live data feed is unavailable.
   → Proposed as follow-up #2682.
3. **Onboarding / first-run UX** — No task covers a "getting started" flow
   for new users or a product tour. Not proposed (lower urgency pre-launch).

---

## Notes

- Starting count of 93 (not 940+) suggests prior grooming rounds already
  reduced the backlog significantly before this task ran. The report title
  referenced "940+" which may have reflected a peak count at an earlier
  point in the project lifecycle.
- All 8 cancellations were either clear duplicates (scope fully absorbed by
  a survivor) or tasks that explicitly require manual human action and have
  no code deliverable. No tasks were cancelled due to staleness alone.
- The 85 remaining tasks are distinct in scope and represent genuine
  implementation work. No further deduplication was possible without
  ambiguity.
