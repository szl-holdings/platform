# `elite-layer/` — Release Governance & Feedback Schemas

This directory holds the canonical, paths-stable governance contracts that the rest of the platform links to:

- `release-governance/` — go/no-go criteria, release checklist, launch council agenda, post-release review template
- `feedback/` — feedback type schema and status model used by the in-product feedback system

## Why it lives at the repo root

These files are referenced by **stable path** from documents and dashboards that gate releases:

- `docs/RELEASE_GATES.md` cites `elite-layer/release-governance/go-no-go-criteria.md` and `release-checklist.md` as the M-01 / M-02 detail sources for the release-gate matrix.
- `docs/reports/elite/release/post-launch-review-system.md` and `docs/reports/elite/15-final-deliverables.md` link here as the source of truth for the launch-council operating model.
- `docs/operations/surface-area-decisions.md` records the explicit decision to keep this folder at the root.

Moving these files into `docs/` would break those links and the release-gate dashboard. The folder is intentionally small and read-only outside of governance updates.

## Layout

| Path | Purpose |
|------|---------|
| `release-governance/release-checklist.md` | Pre-release / release / post-release checklist (M-02) |
| `release-governance/go-no-go-criteria.md` | Go/no-go gate criteria (M-01) |
| `release-governance/launch-council-agenda.md` | Standing agenda for the launch council |
| `release-governance/post-release-review.md` | Post-release review template |
| `feedback/schema.md` | Feedback intake type schema |
| `feedback/status-model.md` | Feedback lifecycle status model |

## Editing notes

- Do not rename or move these files without updating the `docs/RELEASE_GATES.md` matrix and the elite reports under `docs/reports/elite/`.
- Treat changes here as policy changes — they affect what "ready to ship" means.
