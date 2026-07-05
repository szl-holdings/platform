# DEPRECATED — standalone Terra app is retired

**Status: SUPERSEDED.** The standalone Terra React/Vite app in this directory is
retired. Its live home is now the **a11oy `realestate` vertical**, where the Terra
real-estate intelligence has been consolidated and is live-verifiable.

- **Live home:** a11oy `realestate` vertical
  (`github.com/szl-holdings/a11oy`, `a11oy_vertical_feeds.py`).
- **Verify:** `GET /api/a11oy/v1/vert/realestate` →
  `{"consolidated_from":"Terra","live":true}`.
- **Live data sources (unchanged intent):** NYC HPD litigations, NYC DOB violations,
  Treasury rates.

## Why this is retired, not deleted

- This app is a **superseded duplicate** of intelligence that now lives, governed and
  live-wired, in the a11oy realestate vertical. Maintaining two homes for the same
  product is drift.
- The source tree is **retained in place** (history preserved — nothing deleted) for
  provenance and reference.
- Terra has been **removed from the active E2E matrix** (`.github/workflows/e2e.yml`)
  so the E2E Gate no longer gates on a retired app. This is retiring a superseded app,
  **not** disabling a check for a live one — the live realestate surface is governed and
  verified in a11oy at the URL above.

## Do not build new work here

New real-estate work belongs in the a11oy realestate vertical. Do not add features to
this standalone app.
