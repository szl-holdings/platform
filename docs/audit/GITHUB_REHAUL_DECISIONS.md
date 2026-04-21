# GitHub Rehaul — Decision Log

> Series A readiness audit · April 2026

This file records every substantive decision made during the rehaul, with rationale. Decisions marked **DEFERRED** require owner action.

---

## Executed Decisions

| # | Decision | Rationale |
|---|---------|-----------|
| D-001 | Delete `nohup.out` | Empty runtime artifact; already in `.gitignore`; no information lost |
| D-002 | Create `docs/governance/` directory and governance docs | Required by task spec; no governance docs existed in that path |
| D-003 | Create `docs/assets/screenshots/current/` and `archive/` | Establish canonical screenshot storage architecture |
| D-004 | Create `SUPPORT.md` | Missing GitHub-native trust file |
| D-005 | Create `RELEASE_CHECKLIST.md` | Required for release discipline scaffolding |
| D-006 | Create `docs/investor/DEMO_PATHS.md` | Required for investor credibility scaffolding |
| D-007 | Create `docs/investor/TECHNICAL_DUE_DILIGENCE_INDEX.md` | Required for investor credibility scaffolding |
| D-008 | Create `docs/investor/REPOSITORY_SIGNAL_SUMMARY.md` | Required for investor credibility scaffolding |
| D-009 | Create `docs/github/ORG_SETTINGS_CHECKLIST.md` | Required GitHub ops output |
| D-010 | Create `docs/github/REPOSITORY_SETTINGS_CHECKLIST.md` | Required GitHub ops output |
| D-011 | Create `docs/github/PUBLIC_REPO_PORTFOLIO_STRATEGY.md` | Required GitHub ops output |
| D-012 | Create `docs/github/SOCIAL_PROOF_PLAN.md` | Required GitHub ops output |
| D-013 | Create `docs/brand/SCREENSHOT_SHOTLIST.md` | Required for screenshot pass |
| D-014 | Create `docs/brand/UI_AUDIT.md` | Required for UI consistency pass |
| D-015 | Create `docs/brand/DESIGN_SYSTEM_DELTA.md` | Required for UI consistency pass |
| D-016 | Create all Phase 1 audit docs | Required by task spec |
| D-017 | Create `docs/audit/ARCHIVE_DELETE_PRIVATIZE_MATRIX.md` | Required for Phase 10 |
| D-018 | Create `docs/audit/FINAL_DELIVERY_REPORT.md` | Required for Phase 11 |
| D-019 | Add `pnpm validate` comprehensive script | `validate` script already exists; enhanced with `pnpm:validate` alias |
| D-020 | Do not touch archived artifact source code | `artifacts/firestorm/`, `artifacts/imperium/`, `artifacts/lyte-command-center/` are intentionally retained on disk per earlier decisions |
| D-021 | Fix broken relative links in TECHNICAL_DUE_DILIGENCE_INDEX.md | Two links referenced `SECURITY_POSTURE_AUDIT.md` and `FINAL_VALIDATION_REPORT.md` without `../audit/` prefix; corrected |
| D-022 | Sanitize `SectionErrorBoundary` error message display | `lib/shared-ui/src/error-boundary.tsx` — changed from exposing raw `error.message` to showing "temporarily unavailable" + opaque reference code; prevents internal implementation details leaking to users |
| D-023 | Revise FINAL_VALIDATION_REPORT.md and FINAL_DELIVERY_REPORT.md to accurately represent completion state | Reports now correctly distinguish: completed phases, partial-completion with follow-up tasks, and pre-existing test failures unrelated to this task |

---

## Deferred Decisions (Owner Approval Required)

| # | Path | Recommended Action | Reason Deferred |
|---|------|-------------------|----------------|
| DD-001 | `LINKEDIN-LAUNCH/` | Archive to `archive/social-launch/` | Content may be sensitive; owner must verify |
| DD-002 | `launch-shots/` | Move to `docs/assets/screenshots/archive/launch-2026/` | Owner must confirm superseded |
| DD-003 | `docker-compose.yml` | Move to `ops/local/` | Owner must confirm no CI dependency |
| DD-004 | `build_carousel.py` + `build_video.sh` + `pyproject.toml` | Move to `scripts/media/` | Owner must confirm no active usage |
| DD-005 | `elite-layer/` | Investigate and document | Unknown purpose — needs owner review |
| DD-006 | `content/` | Investigate and document | Unknown scope — needs owner review |
| DD-007 | `audit/` (root-level) | Move content to `docs/audit/` | Owner must verify no external references |
| DD-008 | `GITHUB_SETTINGS_APPLIED.json` | Move to `docs/github/` | Low risk but owner should approve |

---

## Non-Actions (explicit decisions not to change)

| # | What Was Not Changed | Why |
|---|---------------------|-----|
| N-001 | Core product code in `artifacts/` | Constraint: do not delete core product code |
| N-002 | `lib/` shared libraries | Constraint: do not refactor architecture |
| N-003 | `.github/workflows/` CI definitions | Already comprehensive; no fixes needed |
| N-004 | `CODEOWNERS` GitHub handle | Uses current handle `@stephenlutar2-hash` — owner must update if handle changes |
| N-005 | Branding / naming | Within existing SZL identity — no rebranding |
| N-006 | Environment variables or secrets | Constraint: do not modify env/secrets/production config |
| N-007 | `.gitignore` zip patterns | Already covers all identified large binaries |

---

*Generated: April 21, 2026 — Series A GitHub Rehaul*
