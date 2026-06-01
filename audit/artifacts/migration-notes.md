# Migration Notes — Duplicate Artifact Cleanup
**Task:** #2669 — Resolve duplicate artifacts (counsel vs prism-counsel)  
**Date:** April 20, 2026

---

## What Changed

### Archived
- `artifacts/prism-counsel` moved to `archive/duplicate-artifacts/prism-counsel/`
- Artifact registration (`artifact.toml`) removed — workflow `artifacts/prism-counsel: web` deregistered
- Preview path `/prism-counsel/` is now dead — any bookmarks to it will 404

### Canonical Legal App
- **`artifacts/counsel`** at `/counsel/` is the single source of truth for the Legal domain
- All Command Portal surfaces (launcher, sidebar nav, domain packs, ecosystem grid) now point exclusively to `/counsel/`

### Command Portal Updates (`artifacts/command`)
| File | Change |
|---|---|
| `src/components/command-bar.tsx` | Removed PRISM Counsel entry from `PLATFORM_APPS` (counsel already present as Domain) |
| `src/components/ecosystem-apps-grid.tsx` | Removed PRISM Counsel card from `ECOSYSTEM_APPS`; cleaned up unused `Scale` import |
| `src/components/unified-layout.tsx` | Updated `ECOSYSTEM_APPS_NAV` entry to `/counsel/`; updated Domain Packs quick-link from `PRISM → /prism-counsel/` to `COUNSEL → /counsel/` |

---

## For Future Contributors

- Do not recreate `artifacts/prism-counsel`. The archived copy in `archive/duplicate-artifacts/prism-counsel/` is for historical reference only.
- The `counsel` artifact owns all legal domain functionality going forward.
- Legacy `/api/prism-counsel/*` API routes in `artifacts/api-server` are not yet removed (they were out of scope). A future task should deprecate them cleanly to avoid confusion.
- References to `prism-counsel` in `artifacts/command/src/pages/competitive-atlas.tsx` and `artifacts/command/src/operations/pages/atlas-execute.tsx` are metadata/documentation strings — they do not affect routing but should be updated in a future cleanup pass.
