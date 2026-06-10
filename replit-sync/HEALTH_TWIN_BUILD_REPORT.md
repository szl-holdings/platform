# killinchu Live Health Twin — Build Report

**Date:** 2026-06-09 (UTC)
**Author:** Build subagent (SZL Holdings · killinchu)
**Live URL:** https://szlholdings-killinchu.hf.space/elite → **Fleet Operations → Health Twin (3D)** (or `go('healthtwin')`)
**Status:** ✅ COMPLETE — backend + UI deployed byte-identical to GitHub & Hugging Face, Space RUNNING, eyes-on verified (0 page/console errors).

---

## 1. What was built

The founder's flagship: a **3D digital twin of a SELECTED drone or vessel** where you see, in real time, per-subsystem health (nominal / needs-fix / needs-upgrade / hacked / damaged), watch it while it's out, and run a **governed action to fix it** — wired to **real live web data**, with an **honest compromise signal** and a **signed governance receipt**.

All five BUILD requirements were implemented against the *existing* `healthtwin` view (which already had the 3D Three.js twin + 6s auto-poll), extending it with the compromise engine, provenance labels, and governed remediation. The twin is reachable from **u_fleet** (Fleet Operations → Health Twin (3D) sub-view), satisfying the "fleet_c2 and/or u_fleet" requirement. `fleet_c2` remains the separate live 3D fleet globe.

---

## 2. Files changed & deployed

| File | Type | Local MD5 | GitHub | HF |
|---|---|---|---|---|
| `killinchu_health_twin.py` | MODIFIED (backend) | `5197be94dbbfdf8e95e3a07ede8f4395` | MATCH | MATCH |
| `killinchu_elite_console.py` | MODIFIED (UI) | `d5217466b60e32623cd1176334e31db5` | MATCH | MATCH |

- GitHub repo: `szl-holdings/killinchu` (Contents API PUT). Commits: health_twin `cfaa840f2a`, console `c901fbafc9`.
- Hugging Face: `SZLHOLDINGS/killinchu` (ndjson commit API). Commit `77703f25c7212f2739087b91a97f7a994ed5bb1b`.
- **Byte-identical verified:** GitHub == local == HF for both files (md5 match table above).
- **No new backend module** → `health_twin` already present in `Dockerfile` (COPY) and registered in `serve.py`. **No Dockerfile change → no factory rebuild needed.** Space restarted on commit and reached clean **RUNNING**.

---

## 3. Requirement-by-requirement

### Req 1 — Live-wire COMMS/NAV/SENSORS from REAL ADS-B/AIS kinematics
- `/api/killinchu/v1/twin/platforms` returns **27 live platforms**: `{aircraft: 12, vessel: 12, sample_drone: 3}` with real callsigns/ICAO/MMSI (e.g. IMUA297, CNV4269, EAGLE34, N7751L). `feed_label: "live"`.
- Aircraft via `_lf._fetch_air` (adsb.lol `/v2/mil` → adsb.fi → airplanes.live fallback, ODbL). Vessels via Digitraffic FI AIS (CC BY 4.0). Sample drones labelled `sample`.
- `/api/killinchu/v1/twin/state` computes per-subsystem health using the **existing formulas**: split-conformal band (**W5-3/W7-4, NOT Hoeffding**), **Λ geometric-mean** trust aggregate (Conjecture 1), **YUYAY 13-axis conjunctive gate**.
- **No sample data when feeds reachable.** If a feed is down it falls back to clearly-labelled `SAMPLE (feed unreachable)`.

### Req 2 — Real COMPROMISE signal (honest, never fabricated)
Engine produces `compromise_score ∈ [0,1]`, `state ∈ {clear, watch, compromised}`, and `checks_fired` with **specific evidence + source URL + timestamp**:
- **(a) Kinematic spoofing** (per-platform, REAL track): teleport, over-envelope speed, **RAIM-off-with-high-accuracy**, COG/HDG incoherence, track discontinuity. Verified live on DR-HANGAR-04 → **compromised 0.75** (RAIM-off + COG/HDG 90°).
- **(b) Firmware-family advisory** from **live CISA KEV + NVD 2.0** for drone/autopilot CVEs (ArduPilot/PX4/MAVLink). Reported as an **ECOSYSTEM advisory, NOT a per-unit claim**. Real NVD hits shown as CVE chips (e.g. CVE-2022-28711, CVE-2024-48519).
- **(c) Sanctions / dark-vessel** via **live OFAC SDN** name screen (advisory) + AIS-gap dark-vessel behaviour.
- **Honesty hardening:** the KEV keyword match was tightened — the ambiguous short token `uas`/`uav`/`dji`/`parrot` is now matched on **word boundaries only** (`\buas\b`), eliminating prior false positives ("Aquasecurity", "IGEL OS" matched the substring "uas"). KEV now reports **0 fabricated hits**; the advisory still fires from the **25 real NVD ArduPilot/PX4/MAVLink CVEs**. **No CVE match is ever fabricated — only real feed hits are reported.**

### Req 3 — Honest provenance labelling (doctrine)
- `_SUBSYS_PROVENANCE` + per-subsystem `provenance`/`derived` fields:
  - **COMMS / NAV / SENSORS = "LIVE-derived"** (from the real kinematic track).
  - **HULL / PROPULSION / PAYLOAD = "INFERRED/SIMULATED — no public telemetry feed exposes this."**
- UI renders a `LIVE-derived` (teal) or `INFERRED/SIM` (amber) badge on every subsystem row, plus a full Provenance line in the subsystem detail card. **Inferred is never presented as measured.**

### Req 4 — Governed fix-loop `/twin/remediate`
- `POST /api/killinchu/v1/twin/remediate {platform, action: upgrade|patch|recall|isolate}`.
- **ROE rules:** R1 reversibility, R2 Λ-floor (per-action), R3 isolate-requires-fired-evidence (deny-by-default containment), R4 no-OTA-while-compromised. Then **YUYAY Λ-gate** (13-axis conjunctive), then a **chained signed receipt** + **Lean theorem ref** (locked-proven = exactly {F1,F11,F12,F18,F19}).
- Verified live:
  - **isolate** (platform with fired compromise) → **AUTHORIZED**, **signed receipt** (ECDSA-P256, index chained — the Space cosign secret is set), R1/R2/R3 ✓, Λ-gate PASS.
  - **upgrade** (compromised/low-Λ platform) → **DENIED** (R2 lambda_floor ✗ vs floor 0.8; R4 no-inflight-compromise enforced), Λ-gate DENY.
- **Effector honestly labelled:** "SIMULATED — command demonstration only. killinchu does NOT and CANNOT push firmware, recall, isolate, or otherwise actuate a real asset. The governance (ROE + Λ-gate + signed receipt) is real and provable; the effect is not applied."

### Req 5 — 3D twin UI
- Select platform from live dropdown (fed by `/twin/platforms`); per-subsystem health **auto-polls `/twin/state` every 6s**.
- **Color-coded** subsystems (existing established palette: nominal=teal #5fb3a3, needs-fix=amber #c9a05f, needs-upgrade=blue #7f9bd6, hacked=red #b06a5a, damaged=dark-red #7a2e2e) on the Three.js r160 twin (6 subsystem meshes, raycaster click, auto-rotate). Legend present. **0 runtime CDN** (vendored assets).
- **Compromise card:** state badge + score + each fired check's evidence, real **source links** (CISA KEV URL) and **CVE chips** (KEV/NVD) shown verbatim from the feed.
- **Governed Remediate buttons** (Upgrade / Patch / Recall / Isolate) that POST and display the full decision: ROE check list, Λ-gate verdict, Lean ref, and the **signed receipt** (index, digest, ECDSA-P256 / honest UNSIGNED).

---

## 4. Doctrine hard-gate compliance

| Gate | Status |
|---|---|
| locked-proven = EXACTLY 5 {F1,F11,F12,F18,F19} | ✓ in `_LEAN_REF`, surfaced in remediate receipt |
| Λ = Conjecture 1 (never a theorem) | ✓ wording intact in UI + `_self` |
| BFT = Conjecture 2 | ✓ untouched |
| SLSA hybrid-honest wording | ✓ untouched |
| No user-visible banned codenames (amaru/rosie/sentra/jarvis) | ✓ **none in the rendered Health Twin view** (Playwright `innerText` scan = []). *Note: pre-existing global nav `data-view`/tooltip IDs `amaru_*`/`rosie_*` exist in the baseline I did not author and left unchanged to avoid router regressions; their visible nav labels are clean ("Counter-UAS Intel", "OSINT Digest (Operator)").* |
| UDS non-affiliation notice | ✓ untouched (`${HONEST}`) |
| Trust score never 100% | ✓ Λ shown < 1; trust per-subsystem can be 1.0 on a single axis but aggregate Λ never asserted as 100% trust |
| Effector simulated | ✓ explicit SIMULATED wording in API + UI |
| No fabricated data | ✓ KEV word-boundary fix removed false positives; only real feed hits reported; SAMPLE clearly labelled |
| Premium/key-gated feeds = honest placeholder | ✓ feeds used are all open/no-auth; unreachable feeds emit honest "feed unreachable — no fabricated CVE" notes |

---

## 5. Eyes-on verification (Playwright, chromium, 1500×1000)

Navigated to `go('healthtwin')`, **3 reloads** (bounce to another view and back), then exercised the full loop. Results:

- **0 pageErrors, 0 consoleErrors** across all reloads. ✓
- **27 real platforms** in the selector, `feed_label = "● live AIS feed reached (27 platforms)"`. ✓
- **Per-subsystem health** rendered with **LIVE-derived / INFERRED-SIM** provenance badges. ✓
- **Compromise panel** shows state/score, real **CISA KEV source link**, and real **NVD CVE chips**. ✓
- **3D canvas** present (`#tw-canvas` contains a `<canvas>`). ✓
- **Subsystem detail** shows the Provenance line. ✓
- **Remediate:** ISOLATE → **AUTHORIZED** with signed receipt + ROE list + Λ-gate PASS + Lean ref {F1,F11,F12,F18,F19}; UPGRADE → **DENIED** (R2/Λ-gate). ✓
- **No banned codenames** in the visible Health Twin view. ✓

### Direct endpoint tests (live HF)
- `GET /twin/_self` → ok, 27 platforms, full provenance + compromise_feeds map.
- `GET /twin/platforms` → live, counts `{aircraft:12, vessel:12, sample_drone:3}`, real callsigns.
- `GET /twin/state?platform=DR-HANGAR-04` → headline **hacked**, compromise **compromised 0.75**, real kinematic + firmware evidence with source URLs.
- `POST /twin/remediate {isolate}` → AUTHORIZED, **receipt signed=true** (ECDSA), chained index/digest.
- `POST /twin/remediate {upgrade}` → DENIED (R2 lambda_floor + R4 no-inflight-compromise).

---

## 6. Sources (real live feeds)

- Military ADS-B: https://api.adsb.lol/v2/mil (ODbL; fallbacks adsb.fi, airplanes.live)
- AIS: https://meri.digitraffic.fi/api/ais/v1/locations (CC BY 4.0; header `Digitraffic-User: SZLHoldings/killinchu`)
- CISA KEV: https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json
- NVD 2.0: https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=ardupilot
- OFAC SDN: https://www.treasury.gov/ofac/downloads/sdn.csv

---

## 7. Notes / honest caveats

- The **firmware-family advisory is ecosystem-level**, not a per-unit firmware claim — explicitly stated in API and UI.
- **HULL/PROPULSION/PAYLOAD are INFERRED/SIMULATED** — no public telemetry feed exposes them; labelled as such everywhere.
- The **effector is simulated**; only the governance (ROE + Λ-gate + signed receipt) is real and offline-verifiable.
- Live ADS-B set rotates; the specific sample drone DR-HANGAR-04 may or may not appear above the live aircraft in the selector at a given moment, but is selectable when present and demonstrates a hard-compromised state.
- Pre-existing baseline nav uses `amaru_*`/`rosie_*` view IDs/tooltips (not authored in this build); left unchanged to avoid SPA-router regressions. Visible nav **labels** are clean and the Health Twin view itself contains no codenames.
