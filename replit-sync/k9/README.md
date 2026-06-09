# K9 — ops UI prototype (Forge, 2026-06-09)

k9s-style operations surface for the SZL fleet: **resource list → drill-in → live status → receipt**.
Real live data where reachable; honest `unreachable` where not. No fabrication.

## Files
- `k9_ops_feeds.py` — stdlib core (zero hard deps) + optional FastAPI router.
  - Mount under FastAPI: exposes `/api/k9/v1/*`.
  - Run standalone: `python3 k9_ops_feeds.py` prints a JSON snapshot.
- `k9_console.html` — k9s-style terminal UI (static; fetches `/api/k9/v1/*`).

## Live sources (verified)
- **HF Spaces** — a11oy + killinchu runtime stage (RUNNING / hardware) via HF API.
- **GitHub Actions** — latest run status per repo (a11oy "Status Page Update", killinchu, lutar-lean lake-build branch, platform/uds).
- **a11oy endpoint** — honest live health probe.

## Honest gaps
- **UDS cluster / CR** — reported `unreachable` (no in-cluster reach from this environment). Not faked.

## Status
Prototype staged for parent/CTO review. Not wired into a production surface.
