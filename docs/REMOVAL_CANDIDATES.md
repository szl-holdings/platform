# REMOVAL CANDIDATES — Phase 1

Captured: 2026-04-23.

## Removed this pass (4 files)

| Path | Size | Reason | Verified non-use |
| --- | --- | --- | --- |
| `nohup.out` | 0 B | Empty leftover from a manual run | YES (zero refs) |
| `docs/reports/master/logs/env-references.txt` | 0 B | Empty log file | YES |
| `artifacts/api-server/src/middlewares/.gitkeep` | 0 B | Directory now non-empty | YES |
| `artifacts/api-server/src/lib/.gitkeep` | 0 B | Directory now non-empty | YES |

## Quarantine candidates (KEEP for now, candidate for removal post-launch)

### Q1. `lib/ontology/` package
- **Status:** Duplicate of `packages/ontology` with only 3 consumers vs 36 for the canonical version.
- **Why not removed now:** Schema between the two packages must be diffed and reconciled before deletion; the 3 consumers must be migrated.
- **Owner action:** Open dedicated task post-launch.

### Q2. `firestorm` brand artefacts
- **Status:** 25 source files + 10 build artifacts still contain the deprecated brand name.
- **Why not removed now:** Tasks #1437 (route rename), #1438 (directory cleanup), #3419 (API path migration) are filed and IN_PROGRESS. Removing manually would conflict with the in-flight tasks.
- **Owner action:** Land the tracked tasks; verify with `rg -i firestorm`.

### Q3. Stale entries in `banned-brand-strings.baseline.json`
- **Status:** 3,892 entries — many likely orphaned by past renames.
- **Why not removed now:** Refresh requires owner approval — rotating blindly could mask a NEW violation that's currently caught by a stale entry happening to match.
- **Owner action:** `pnpm brand:strings -- --update-baseline` after manual scan.

### Q4. 114 skipped / `.todo` tests
- **Status:** Counted via ripgrep; not enumerated by file.
- **Why not removed now:** Each one needs an owner verdict (unskip / delete / file tracking task).
- **Owner action:** Triage sweep, ~half-day.

### Q5. 4 oxlint errors
- **Status:** `oxlint .` reports 4 errors among 842 warnings. Specific rules could not be extracted in this pass (reporter output truncated).
- **Why not removed now:** Need to identify the rule violations first.
- **Owner action:** `pnpm exec oxlint . 2>&1 | rg -B 2 "× error"` on a fresh terminal.

## Removal candidates explicitly DECLINED

| Target | Why kept |
| --- | --- |
| The 14 oversized route files in api-server | Brief forbids rewriting domain logic. Splitting is rewrite-shaped. |
| Express in favour of Hono | Brief explicitly forbids removing Express. Coexistence only. |
| Domain models / business logic anywhere | Brief: "Keep resolver and route-handler business meaning intact." |
| Mobile app code | Brief: "Do NOT make mobile app changes." |
| Visual identity / design system | Brief: "Do NOT change the design system or visual identity." |

## Removal posture

Conservative subtraction. Every deletion this pass was zero-byte / placeholder. Larger consolidations are named with file pointers and owners but deferred — the cost of a wrong deletion right before launch is much higher than the cost of carrying dead weight for one more sprint.
