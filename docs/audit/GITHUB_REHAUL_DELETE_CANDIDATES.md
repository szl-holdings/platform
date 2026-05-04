# GitHub Rehaul — Delete/Remove Candidates

> growth capital readiness audit · April 2026 · Phase 1 output

These are files and directories evaluated for removal, archival, or gitignore enforcement. No core product code is touched. Owner approval is flagged where destructive action is uncertain.

---

## Category A — Already Handled (gitignored or deleted)

| Path | Action | Status |
|------|--------|--------|
| `nohup.out` | Deleted from working tree | ✅ Done — was empty |
| `01-thursday-intro.zip` | In `.gitignore` | ✅ Blocked from tracking |
| `02-sunday-deep-dive.zip` | In `.gitignore` | ✅ Blocked from tracking |
| `03-monday-operator-lens.zip` | In `.gitignore` | ✅ Blocked from tracking |
| `LINKEDIN-LAUNCH.zip` | In `.gitignore` | ✅ Blocked from tracking |
| `attached_assets/` | In `.gitignore` | ✅ Blocked from tracking |
| `deliverables/` | In `.gitignore` | ✅ Blocked from tracking |
| `output/` | In `.gitignore` | ✅ Blocked from tracking |
| `backups/` | In `.gitignore` | ✅ Blocked from tracking |
| `playwright-report/` | In `.gitignore` | ✅ Blocked from tracking |
| `.archive/` | In `.gitignore` | ✅ Blocked from tracking |
| `.mirror-staging-test/` | In `.gitignore` | ✅ Blocked from tracking |

---

## Category B — Needs Owner Decision (do not auto-execute)

| Path | Recommendation | Risk | Reason | Owner Approval Needed |
|------|---------------|------|--------|----------------------|
| `LINKEDIN-LAUNCH/` | Archive to `archive/social-launch/` | Low | LinkedIn marketing assets; not product code | Yes — verify content is non-sensitive before public exposure |
| `launch-shots/` | Move to `docs/assets/screenshots/archive/launch-2026/` | Low | Superseded by current screenshots | Yes — confirm nothing proprietary |
| `docker-compose.yml` | Move to `ops/local/docker-compose.yml` | Low | Root-level developer utility | Yes — confirm not used by CI |
| `build_carousel.py` | Move to `scripts/media/build_carousel.py` | Low | Python image builder script | Yes — confirm no active CI dependency |
| `build_video.sh` | Move to `scripts/media/build_video.sh` | Low | Shell video builder script | Yes — confirm no active CI dependency |
| `pyproject.toml` | Move to `scripts/media/pyproject.toml` or delete | Low | Only needed for Python media scripts | Yes — verify scope |
| `GITHUB_SETTINGS_APPLIED.json` | Move to `docs/github/GITHUB_SETTINGS_APPLIED.json` | None | Metadata file, not product code | No — safe move |
| `elite-layer/` | Investigate and evaluate | Unknown | Unknown purpose | Yes |
| `content/` | Investigate and evaluate | Unknown | May contain brand/marketing content | Yes |
| `media/` | Investigate and evaluate | Low | Media assets — check for large binaries | Yes |
| `analytics/` | Keep or move to `scripts/analytics/` | None | Analytics scripts | No — safe move |
| `integrations/` | Keep or document | None | Integration configs | No |
| `profile-readme/` | Keep — feeds `.github/profile/README.md` | None | Active use | No |
| `deliverables/` | Remove from root, enforce gitignore | Low | Generated output — already gitignored | No |
| `audit/` (root-level) | Move content to `docs/audit/` | Low | Misplaced — audit docs belong in docs/ | Yes — verify content |

---

## Category C — Safe to Leave (monitor)

| Path | Reason |
|------|--------|
| `ACCESS-CONTROL-MATRIX.md` | Redirect stub to canonical location — harmless |
| `DEPLOYMENT-GUIDE.md` | Redirect stub — harmless |
| `KNOWN-GAPS.md` | Redirect stub — harmless |
| `PLATFORM_PRIMITIVES.md` | Redirect stub — harmless |
| `OPERATIONS-RUNBOOK.md` | Redirect stub — harmless |
| `INCIDENT_RESPONSE.md` | Redirect stub — harmless |
| `archive/` | Source-retained archived artifacts — not product code |
| `demo-assets/` | Some gitignored; remainder is public-safe demo content |
| `exports/` | Gitignored — no tracked content |

---

*Generated: April 21, 2026 — growth capital GitHub Rehaul*
