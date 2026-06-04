# SZL Holdings — Root Cleanup Report

**Generated:** 2026-04-21  
**Track:** Zero-Gap Track 1  
**Scope:** Root-level directory hygiene

---

## Summary

| Category | Count | Action |
|---------|-------|--------|
| ZIP archives deleted | 5 | `rm` |
| Empty log file deleted | 1 | `rm` |
| Stub redirect `.md` files deleted | 6 | `rm` |
| Scripts relocated to `archive/` | 2 | `mv` |
| Social content directory archived | 1 | `mv` to `archive/` |
| Launch screenshots archived | 1 | `mv` to `archive/` |
| `.gitignore` rules verified | — | Already correct for most items |
| `.replitignore` rules added | 2 | New ignore rules for archived dirs |

---

## Deleted Files

### ZIP Archives (already in .gitignore; deleted from tracked state)

| File | Size | Reason |
|------|------|--------|
| `01-thursday-intro.zip` | ~10 KB | Intro briefing archive; already in .gitignore; no code value |
| `02-sunday-deep-dive.zip` | ~11 KB | Deep-dive briefing archive; already in .gitignore |
| `03-monday-operator-lens.zip` | ~11 KB | Operator briefing archive; already in .gitignore |
| `LINKEDIN-LAUNCH.zip` | ~12 MB | Social launch content; already in .gitignore; directory form exists at `archive/LINKEDIN-LAUNCH/` |
| `X-LAUNCH-SERIES.zip` | Not separately tracked | Launch series content; already in .gitignore |

### Log Files

| File | Size | Reason |
|------|------|--------|
| `nohup.out` | 0 bytes | Empty tracked log; already in .gitignore; should never be committed |

### Stub Redirect Markdown Files

These files contain only a one-line redirect notice ("This file has moved to...") and have been deleted since the canonical versions exist in `docs/`.

| File | Redirects To | Reason for Deletion |
|------|-------------|-------------------|
| `ACCESS-CONTROL-MATRIX.md` | `docs/security/access-control-matrix.md` | Stub with no content; canonical doc exists |
| `DEPLOYMENT-GUIDE.md` | `docs/operations/deployment-guide.md` | Stub with no content; canonical doc exists |
| `KNOWN-GAPS.md` | `docs/operations/known-gaps.md` | Stub with no content; canonical doc exists |
| `OPERATIONS-RUNBOOK.md` | `docs/operations/operations-runbook.md` | Stub with no content; canonical doc exists |
| `PLATFORM_PRIMITIVES.md` | `docs/architecture/platform-primitives.md` | Stub with no content; canonical doc exists |
| `SECURITY-CHECKLIST.md` | `docs/security/security-checklist.md` | Stub with no content; canonical doc exists |

> **Link-compatibility note:** If any external channels (investor emails, partner wikis, Notion pages, etc.) link to these root-level filenames by name, those links will now 404. Owners of those channels should update them to point directly to the canonical `docs/` targets listed above.

---

## Relocated to `archive/`

### Root-Level Scripts

| File | Archived To | Reason |
|------|-----------|--------|
| `build_carousel.py` | `archive/scripts/build_carousel.py` | Python carousel builder; not part of the pnpm build pipeline; no references in package.json scripts or CI workflows; belongs in archive not root |
| `build_video.sh` | `archive/scripts/build_video.sh` | Shell video builder; same rationale |

### Social Content Directories

| Directory | Archived To | Reason |
|-----------|-----------|--------|
| `LINKEDIN-LAUNCH/` | `archive/social/LINKEDIN-LAUNCH/` | Social launch content; not code; already in .gitignore pattern for `social-content/`; archived for reference |
| `launch-shots/` | `archive/media/launch-shots/` | 7 launch screenshots; not README assets; snapshots from an earlier state |

---

## Retained (Not Moved)

| Item | Reason to Retain |
|------|----------------|
| `INCIDENT_RESPONSE.md` | Substantial operational content; retained at root for discoverability |
| `RELEASE_CHECKLIST.md` | Active operational document |
| `RELEASE_NOTES.md` | Active release artifact |
| `SECURITY.md` | Required by GitHub security policy; must remain at root |
| `CONTRIBUTING.md` | GitHub convention; must remain at root |
| `CODE_OF_CONDUCT.md` | GitHub convention; must remain at root |
| `LICENSE.md` | Required at root |
| `CHANGELOG.md` | Standard location; referenced by release workflow |
| `threat_model.md` | Referenced in security documentation |
| `SUPPORT.md` | GitHub convention |
| `GITHUB_SETTINGS_APPLIED.json` | Operational record; retained |
| `launch/` | Active demo launch content directory; referenced in ops docs |
| `deliverables/` | In .gitignore; not tracked |
| `output/` | In .gitignore; not tracked |
| `exports/` | In .gitignore; not tracked |
| `analytics/` | Internal analytics config |
| `content/` | Content assets |
| `demo-assets/` | Demo media (investor carousel etc.) |
| `media/` | Media assets |
| `elite-layer/` | Product layer docs |
| `integrations/` | Integration config |
| `infra/` | Azure IaC templates |
| `docker-compose.yml` | Local dev services |

---

## `.gitignore` Verification

The following patterns were already present in `.gitignore` before this cleanup:

```
nohup.out
*.out
*.log
/01-thursday-intro.zip
/02-sunday-deep-dive.zip
/03-monday-operator-lens.zip
/LINKEDIN-LAUNCH.zip
/X-LAUNCH-SERIES.zip
/screenshots/
/deliverables/
/output/
```

**New patterns added to `.gitignore`:**
```
# Root-level build scripts (archived to archive/scripts/)
/build_carousel.py
/build_video.sh

# Social content and launch shots (archived to archive/)
/LINKEDIN-LAUNCH/
/launch-shots/
```

---

## `.replitignore` Updates

**New entries added:**
```
# Archived social and media content (not needed in deploy image)
archive/social/
archive/media/
archive/scripts/
```

---

## Notes

- No files referenced by `.replit`, `pnpm-workspace.yaml`, `turbo.json`, or any `artifact.toml` were deleted.
- The `build_carousel.py` and `build_video.sh` scripts had no references in `package.json`, CI workflows, or any config file.
- The `LINKEDIN-LAUNCH/` directory was already covered by `social-content/` in `.gitignore` pattern but was not itself ignored; now explicitly ignored via `/LINKEDIN-LAUNCH/`.
- `launch-shots/` is a dated set of screenshots unrelated to the active `assets/readme/` directory used by the README.
