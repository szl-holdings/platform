# DEPRECATED — standalone Counsel app is retired

**Status: SUPERSEDED.** The standalone Counsel (legal matter command) React/Vite app in
this directory is retired. Its live home is now the **a11oy `legal` vertical**.

- **Live home:** a11oy `legal` vertical
  (`github.com/szl-holdings/a11oy`, `a11oy_vertical_feeds.py`).
- **Verify:** `GET /api/a11oy/v1/vert/legal` →
  `{"consolidated_from":"Counsel","live":true}`.
- **Live data sources (unchanged intent):** Federal Register, CourtListener.

## Why this is retired, not deleted

- This app is a **superseded duplicate** of intelligence that now lives, governed and
  live-wired, in the a11oy legal vertical. Two homes for one product is drift.
- The source tree is **retained in place** (history preserved — nothing deleted) for
  provenance and reference.
- Counsel has been **removed from the active E2E matrix** (`.github/workflows/e2e.yml`)
  so the E2E Gate no longer gates a retired app. This is retiring a superseded app,
  **not** disabling a check for a live one — the live legal surface is governed and
  verified in a11oy at the URL above.

## Do not build new work here

New legal work belongs in the a11oy legal vertical. Do not add features to this
standalone app.
