# Archive / Delete / Privatize Matrix

> growth capital GitHub Rehaul · April 2026

Every path evaluated for action during the rehaul pass. Actions marked **NEEDS OWNER APPROVAL** are not auto-executed.

Columns: Path · Action · Risk · Reason · Owner Approval Needed

---

## Executed Automatically (Safe, No Owner Approval Required)

| Path | Action | Risk | Reason |
|------|--------|------|--------|
| `nohup.out` | Deleted | None | Empty runtime artifact; in `.gitignore`; no content lost |
| `docs/governance/` | Created | None | Required governance documentation |
| `docs/assets/screenshots/current/` | Created | None | Canonical screenshot directory |
| `docs/assets/screenshots/archive/` | Created | None | Screenshot archive directory |
| `SUPPORT.md` | Created | None | Missing GitHub-native trust file |
| `RELEASE_CHECKLIST.md` | Created | None | Release discipline scaffolding |
| `docs/investor/DEMO_PATHS.md` | Created | None | Investor credibility documentation |
| `docs/investor/TECHNICAL_DUE_DILIGENCE_INDEX.md` | Created | None | Investor credibility documentation |
| `docs/investor/REPOSITORY_SIGNAL_SUMMARY.md` | Created | None | Investor credibility documentation |
| `docs/github/ORG_SETTINGS_CHECKLIST.md` | Created | None | GitHub ops output |
| `docs/github/REPOSITORY_SETTINGS_CHECKLIST.md` | Created | None | GitHub ops output |
| `docs/github/PUBLIC_REPO_PORTFOLIO_STRATEGY.md` | Created | None | GitHub ops output |
| `docs/github/SOCIAL_PROOF_PLAN.md` | Created | None | GitHub ops output |
| All Phase 1 audit docs | Created | None | Required audit documentation |
| All governance docs | Created | None | Required governance documentation |
| All brand audit docs | Created | None | Required brand documentation |

---

## Needs Owner Approval Before Action

| Path | Recommended Action | Risk | Reason | Owner Approval Needed |
|------|-------------------|------|--------|-----------------------|
| `LINKEDIN-LAUNCH/` | Archive to `archive/social-launch/LINKEDIN-LAUNCH/` | Low | Social marketing content at repo root; not product code; may contain sensitive business context | **Yes — owner must verify content before archiving** |
| `launch-shots/` | Move to `docs/assets/screenshots/archive/launch-2026/` | None | Old launch screenshots superseded by current shots | **Yes — confirm these are fully superseded** |
| `docker-compose.yml` | Move to `ops/local/docker-compose.yml` | Low | Developer utility at root; cleaner in `ops/local/` | **Yes — confirm no CI workflow references root path** |
| `build_carousel.py` | Move to `scripts/media/build_carousel.py` | Low | Python image builder at root; belongs in `scripts/media/` | **Yes — confirm no active reference** |
| `build_video.sh` | Move to `scripts/media/build_video.sh` | Low | Shell video builder at root; belongs in `scripts/media/` | **Yes — confirm no active reference** |
| `pyproject.toml` | Move to `scripts/media/` or delete if unused | Low | Only serves Python media scripts | **Yes — confirm scope** |
| `GITHUB_SETTINGS_APPLIED.json` | Move to `docs/github/GITHUB_SETTINGS_APPLIED.json` | None | Metadata JSON; not product code | **Yes — confirm no tooling reads root path** |
| `elite-layer/` | ✅ Documented in place (Task #2900) | None | Holds release-governance contracts (`release-governance/`) and feedback schemas (`feedback/`) referenced by stable path from `docs/RELEASE_GATES.md` and elite reports — see `elite-layer/README.md` | **No — resolved** |
| `content/` | ✅ Documented in place (Task #2900) | None | Source markdown for public-facing surfaces (Academy, help, demos, integrations catalog, trust center, changelog, launch series) consumed by in-product viewers and the launch publishing pipeline — see `content/README.md` | **No — resolved** |
| `audit/` (root-level) | ✅ Documented in place (Task #2900) | None | Frozen Zero-Gap audit artifact referenced by automation in `scripts/audit/`, `scripts/public-mirror/`, `audit/verify.sh`, and `audit/source-of-truth.json`; intentionally distinct from the growth capital rehaul narrative under `docs/audit/` — see updated `audit/README.md` | **No — resolved** |
| `01-thursday-intro.zip` | Remove from tracking (if tracked) | None | Large binary archive; already in `.gitignore` | **No — safe; `git rm --cached` if tracked** |
| `02-sunday-deep-dive.zip` | Remove from tracking (if tracked) | None | Large binary archive; already in `.gitignore` | **No — safe; `git rm --cached` if tracked** |
| `03-monday-operator-lens.zip` | Remove from tracking (if tracked) | None | Large binary archive; already in `.gitignore` | **No — safe; `git rm --cached` if tracked** |
| `LINKEDIN-LAUNCH.zip` | Remove from tracking (if tracked) | Low | 12 MB binary; already in `.gitignore` | **No — safe; `git rm --cached` if tracked** |

---

## Keep As-Is (No Action)

| Path | Reason |
|------|--------|
| `artifacts/firestorm/` | Intentionally archived per Task #920; source retained; API routes active |
| `artifacts/imperium/` | Intentionally archived per Task #920; merged into Command |
| `artifacts/lyte-command-center/` | Intentionally archived per Task #920; merged into Command |
| `ACCESS-CONTROL-MATRIX.md` (root) | Redirect stub; harmless and useful for navigators |
| `DEPLOYMENT-GUIDE.md` (root) | Redirect stub |
| `KNOWN-GAPS.md` (root) | Redirect stub |
| `PLATFORM_PRIMITIVES.md` (root) | Redirect stub |
| `OPERATIONS-RUNBOOK.md` (root) | Redirect stub |
| `INCIDENT_RESPONSE.md` (root) | Redirect stub |
| `archive/` | Archived deliverables; retention per policy |
| `demo-assets/` | Demo content; sensitive PDFs gitignored |
| `backups/` | Gitignored; no tracked content |
| `deliverables/` | Gitignored; no tracked content |
| `output/` | Gitignored; no tracked content |
| `.archive/` | Gitignored |
| `.mirror-staging-test/` | Gitignored |
| `.github-private/` | Gitignored |
| `attached_assets/` | Gitignored |

---

## Privatize / Visibility Change (GitHub UI Required)

| Path / Repo | Action | Rationale |
|-------------|--------|-----------|
| Entire repository | Keep public (current state) | growth capital investor access; see `docs/governance/PUBLIC_PRIVATE_STRATEGY.md` |
| Any test/stale org repos | Review and archive | Owner must audit org repo list |

---

*Generated: April 21, 2026 — growth capital GitHub Rehaul*
