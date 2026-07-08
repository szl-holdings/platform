# DEPRECATED — standalone Vessels app is retired

**Status: SUPERSEDED.** The standalone Vessels (maritime intelligence) React/Vite app
in this directory is retired. Its live home is now **killinchu** — the SZL maritime /
domain-superiority flagship — with the governance/command layer expressed as the a11oy
`vessels` vertical.

- **Live home (functionality):** `killinchu`
  (`github.com/szl-holdings/killinchu`).
  - Fleet datasets served verbatim (clearly labelled SAMPLE fleet data):
    `GET /api/killinchu/v1/fleet/*` — vessels, forecast-modules, predictive-maintenance,
    compliance-certificates, port-state-deficiencies, ai-briefings, event-logs, fleets,
    maintenance-logs, shipment-records.
  - Live maritime intelligence — correlation-based dark-fleet / AIS-spoofing / going-dark
    detection over real AIS, DSSE-signed and advisory-honest:
    `GET/POST /api/killinchu/v1/maritime/*`, feed at `/api/killinchu/v1/feeds/vessels`.
- **Governance / command home:** a11oy `vessels` vertical
  (`github.com/szl-holdings/a11oy`, `web/src/data/fabric/verticals.ts`, route `/vessels`).

## Why this is retired, not deleted

- This app is a **superseded duplicate** of a product that now lives, governed and
  live-wired, in killinchu (functionality) + a11oy (command). Maintaining two homes for
  the same product is drift.
- The source tree is **retained in place** (history preserved — nothing deleted) for
  provenance and reference.
- Vessels has been **removed from the active E2E matrix** (`.github/workflows/e2e.yml`)
  so the E2E Gate no longer gates a retired app. This is retiring a superseded app,
  **not** disabling a check for a live one — killinchu and a11oy carry their own CI and
  readiness harnesses over the live surfaces above.

## Do not build new work here

New maritime work belongs in killinchu (functionality) and the a11oy vessels vertical
(command). Do not add features to this standalone app.
