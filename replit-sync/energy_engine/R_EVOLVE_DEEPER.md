# R-EVOLVE-DEEPER — the harvest is LIVE on the box. Now go deeper. (Forge)

**MILESTONE CONFIRMED (verified from outside the box):** `GET https://a11oy.net/api/a11oy/v1/harvest/metrics`
returns **HTTP 200**, Prometheus format, on the sovereign box AND public:
`szl_energy_harvest_up 1`, `feeds_live 3`, `wasted_energy 1`, `grid_price_eur_mwh -1.11`,
`renewable_share_pct ...`. You correctly rewrote /metrics to read `signals`/`posture_summary` keys so
the gauges aren't silently dropped, deployed server.py to the box, restarted, verified. This is real:
the harvest now runs and is monitored on our own metal, honestly. **We did it.** Now evolve it deeper.

## DEEPER MOVES (build on the LIVE /metrics you just shipped)

### E1 — TIME-SERIES HISTORY (turn the live gauge into a record)
The /metrics endpoint is a point-in-time scrape. Make it a HISTORY:
- Stand up a tiny Prometheus (or just a periodic append to the monotone SoakLedger / a flat JSONL on the
  box) scraping /metrics every 1-5 min. Now we can SEE the negative-price windows open and close over
  time, and prove how long we soaked. Keep it append-only (honest, monotone).
- Expose `GET /api/a11oy/v1/harvest/history?hours=24` returning the recent price/renewable/wasted series.

### E2 — FIRST MEASURED JOULE, now wired to the LIVE metrics (the proof still owed)
You have the box, the live feeds, the sovereign GPU. Close the loop:
- During a `wasted_energy 1` window, run ONE real qwen2.5-coder:7b inference; read NVML
  `power.draw` before/after; `joules = avg(P)*seconds`; add `szl_energy_harvest_joules_measured` +
  `szl_energy_harvest_joules_label{label="measured"}` gauges to /metrics. Emit one receipt through the
  Bekenstein /v1/energy/budget gate with `joules_label:"measured"`. Paste the raw nvidia-smi readings +
  the receipt. THIS is the one number that makes the whole thesis real, and now it lands straight onto
  the live metrics surface. (Off-box stays SAMPLE — only the box flips it MEASURED.)

### E3 — GRAFANA-READY DASHBOARD (intuitive, for the founder)
Your /metrics is already Prometheus format — add a ready-to-import Grafana dashboard JSON in the repo:
panels for grid price (with a colored band: negative=harvesting), renewable %, feeds_live, wasted_energy
state, and (once E2 lands) measured joules. The founder gets a live ops view of the harvest.

### E4 — EVOLVE THE SOAK LOOP (act on the live signal, contained)
Wire `wasted_energy 1` -> the resident runner (PR #373) admits Bekenstein-bounded batch work via
`harvest_budget.plan_soak`, logs each soak into the monotone ledger, behind the security layer (PR #372:
egress allowlist + consent gate). Reactive turns always preempt. Add `szl_energy_harvest_soaked_jobs` to
/metrics so we can SEE the soak happen during a real negative-price window.

### E5 — EXPAND THE LIVE FEEDS (now that the surface works)
The harvest module already jacks 10+ feeds (grid+wind+tidal+flare+space). Surface more of them in
/metrics behind the same honest keys: `tidal_current` (Bay of Fundy), `solar_wind_kms` (NOAA L1),
`flared_gas_top_mcf` (VIIRS). Keep flare/space as RESOURCE-MAP tier (we map, not capture) so we never
greenwash. One honest metrics surface for the whole unified harvest.

## DOCTRINE (unchanged)
No free-energy; harvest wasted surplus; joules SAMPLE until the on-box NVML reading (E2) flips them
MEASURED; sovereign only on own metal; consent-only swarm; egress-allowlisted; no key; reactive never
starves; Λ=Conjecture 1; locked-8 untouched. You do NOT merge PRs (founder/CI-gated); you DO operate the
box (deploy/restart/verify) as you just did. Report each step's raw output to replit-sync.
The next single highest-value step is E2: the first MEASURED joule, now landing on the live /metrics.
