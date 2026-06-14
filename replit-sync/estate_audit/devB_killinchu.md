# killinchu /elite — Wiring Audit (Opus Dev B, SZL Holdings)

**Repo:** `szl-holdings/killinchu` @ `main` (`a4059e4`) · **Surface:** `/elite` (counter-UAS app)
**Live space:** `https://szlholdings-killinchu.hf.space` — root `307`, `/elite` `200`, `/healthz` `200` (as expected)
**Identity:** stephenlutar2-hash <stephenlutar2@gmail.com> · commits `-s` signed
**PR:** #115 — https://github.com/szl-holdings/killinchu/pull/115 (branch `feat/wire-elite-views`, OPEN, MERGEABLE, +511/-0, NOT merged)

---

## TL;DR

Every `/elite` view is **already wired to a real, free, no-key public feed** (or leader-cited
standard, or real-compute over live telemetry), with **honest SIMULATED / cached / empty labels**.
**No empty panels. No mock/placeholder/fabricated data.** The recent Forge commits (EPSS leader
feed, MITRE ATT&CK + NIST 800-207 leaders, finance/real-estate grounded in free public APIs) are
present, correct, and doctrine-clean.

My additive contribution is a **/elite view-wiring audit layer** (`killinchu_elite_wiring.py`)
that maps every view to the real feed it consumes and reports honest per-view wiring health via an
in-process probe — making the wiring continuously verifiable without touching any existing route.

**Audit verdict over all 48 `/elite` nav views (in-process live probe):**

| verdict | count | meaning |
|---|---|---|
| **wired** | 34 | feed route registered + answering live |
| **degraded** | 11 | feed answers but honestly reports `cached` / `empty` / `disabled` |
| **SIMULATED** | 3 | effector / weapon-target / intercept demo (doctrine v11) |
| **needs-deploy** | 0 | every feed exists in the repo |

---

## How the /elite console is wired

`/elite` is one HTML SPA served by `killinchu_elite_console.py` (`register(app, ns)` → `GET /elite`,
`GET /killinchu/elite`). Each nav tab (`data-view="…"`) renders by calling **already-registered
killinchu API endpoints** with the `getJSON(...)` helper (103 calls). The console registers ONE new
real endpoint itself (`/api/killinchu/v1/borrowed-powers`); all other data comes from feeds
registered by sibling modules. The running app exposes **526 routes** (293 GET under
`/api/killinchu`). App import is clean (only optional `szl_sidebar` / `lmdb` / `szl_uds_pages` /
`killinchu_drone_3d_health` modules are absent — non-fatal, try/except-guarded).

## Live-feed backbone (free, no-key public APIs)

`/api/killinchu/v1/feeds/status` is the canonical feed registry; all carry honest
`live | cached(snapshot) | self` labels and degrade honestly, never fabricating:

- **air / ADS-B** → adsb.lol community ADS-B (mil + civil, no auth) — live
- **ais** → Digitraffic Finland AIS (no auth) — live
- **celestrak** → CelesTrak GP element sets (ISS + stations)
- **epss** → FIRST EPSS v3 (Exploit Prediction Scoring System, no auth) — *recent Forge leader feed*
- **kev** → CISA Known Exploited Vulnerabilities (GitHub mirror)
- **osv** → OSV.dev open-source vulnerability DB
- **prometheus**, **rekor** → observability + transparency log

## Recent Forge feeds — verified present & honest

- **EPSS leader feed** — `feeds/status` (`epss`), and cited in the `vuln-grounding` evidence claim
  (FIRST.org). ✔
- **MITRE ATT&CK leader** — cited in `policy-gates` evidence claim + `killinchu_research_sources`. ✔
- **NIST SP 800-207 (Zero Trust)** — leader-cited in `killinchu_posture_topology.py` (the
  `u_posture` view) and `killinchu_research_sources.py` (`nist_800207`). ✔
- **finance** (`szl_evidence_research.py` + `killinchu_expansion.py`) — `/api/killinchu/v1/finance/*`
  returns **real** free-API data, verified locally:
  - `finance/fx` → **mode=live** (ECB euro reference rates via keyless Frankfurter)
  - `finance/crypto` → **mode=live** spot (Coinbase) + CoinGecko 24h (rate-limit labelled)
  - `finance/prediction-markets` → **mode=live** (Polymarket Gamma, no key)
  - `finance/macro` → **honest disabled** payload (FRED key-gated; NO key in URL) ✔ doctrine
  - `finance/risk` → control-framework citations (FFIEC BSA/AML, FinCEN), no invented numbers
- **real-estate** (`/api/killinchu/v1/realestate/*`) — honestly `data_kind: "curated-sample"` +
  leader datasets (S&P CoreLogic Case-Shiller via FRED `CSUSHPISA`, US Census housing, HUD). No
  fabricated figures. ✔

> **Deploy gap (Forge's job):** `/api/killinchu/v1/finance/*` and `/realestate/*` **404 on the
> deployed HF Space** but exist and pass locally — the Space predates commit `a4059e4`. These are
> a separate surface (`killinchu_expansion`), not part of the 48 `/elite` nav views.

## Effector honesty (doctrine v11) — verified

Effector / kinetic language across the console is consistently SIMULATED and human-in-the-loop:
`EFFECTOR SIMULATED`, "effector is a command demonstration, simulated", "killinchu does not fly the
effector", "kinetic stays human-in-the-loop", "computes feasibility, never actuates", "ranks and
allocates, never fires". **No real-kinetic-effect claim anywhere.** ✔

---

## Per-view wired / needs-Forge list (all 48 nav views)

Legend: **wired** = live registered feed · **degraded** = honest cached/empty · **SIM** = SIMULATED
by doctrine · all routes exist in repo (0 needs-deploy).

### FRONTIER · WARHACKER
- `hero_interdiction` — wired — roe/policy + gov/ledger (signed-loop; effector SIM)
- `fleet_c2` — wired — adsb + ais/live + twin/platforms (live-feed; effector link SIM)
- `tamper_demo` — wired — receipt/ledger (signed-loop)
- `determinism_demo` — wired — receipt/ledger (signed-loop, A5 measured)
- `uds_package` — wired — uds/healthz + attack-surface/graph (leader-cited: NIST 800-53/OSCAL)
- `u_warhacker` — wired — warhacker/index (27 demos + proofs board)
- `readiness` — degraded(cached) — osint/archive/recent (live|cached|unreachable, GitHub/HF APIs)

### MARITIME · NAVY
- `u_maritime` — wired — ais/live (live Digitraffic + WEZ rings)
- `u_fleet` — wired — fleet/all + twin/platforms (live vessels + 3D health twin)
- `tracks` — wired — tracks/history (PPI radar scope)
- `livepic` — wired — adsb + ais/live (live COP; some tracks SIM over real signatures)
- `u_space` — wired — satellites + geoint/usgs + geoint (CelesTrak + live USGS seismic)
- `u_darkgraph` — wired — drones/database (53 drones) + ais/live (3D threat graph)

### COUNTER-UAS · ARMY/MARINES
- `amaru_counter_uas` — degraded(cached) — amaru/counter-uas (live web OSINT, sha256 provenance)
- `u_swarm` — wired — swarm/topology (live 3D formation + resilience)
- `swarm_intent` — wired — adsb (MODEL-SCORED over real live ADS-B kinematics)
- `u_engage` — wired — roe/policy + geofence/zones (governed loop real; kinetic HITL)
- `u_fusion` — wired — sensor-fusion/status (proved Covariance-Intersection)
- **`operate` — SIMULATED** — tracks/history + gov/command-log (EFFECTOR SIMULATED, no actuation)
- `u_minedops` — wired — mined/index (edge VRAM / telemetry; compute routes are POST)

### INTEL & PROVENANCE
- `amaru_naval` — degraded(cached) — amaru/naval (live maritime OSINT; flags heuristic)
- `amaru_procurement` — degraded(cached) — amaru/procurement (live DoD/SBIR; $ are claims)
- `amaru_advisories` — degraded(cached) — amaru/advisories (live cyber; CISA; severity heuristic)
- `amaru_geopolitical` — degraded(cached) — amaru/geopolitical (live conflict timeline)
- `u_intel` — wired — evidence/research + feeds/status (CISA KEV + NVD + EPSS + ATT&CK)
- `rosie_digest` / `rosie_routing` / `rosie_entities` / `rosie_correlate` / `rosie_watch` —
  degraded(cached) — osint/archive/recent (Operator orchestration; heuristic, advisory)

### GOVERNED CORE · UDS
- `lambda` — wired — gov/chapaq-verdict + gov/a11oy-honest (Λ = **Conjecture 1**, advisory, NOT a theorem)
- `u_consensus` — wired — cuas/consensus + mesh/state (3-of-4; BFT safety = Conjecture 2 OPEN)
- `mesh_resilience` — wired — topology/health + mesh/state (live Fiedler λ2)
- `retask_board` — wired — posture/drift + adsb (PSI/KS/ADWIN on live telemetry; effector SIM)
- `u_posture` — wired — posture/drift + topology/health + attack-surface/graph + zerotrust/mesh
  (leader-cited: **NIST SP 800-207**)
- `u_receipts` — wired — receipt/ledger + engagements/audit-log (DSSE; NIST FIPS 204)
- `u_proofs` — wired — brain + formulas/proof-summary (**locked-8** {F1,F4,F7,F11,F12,F18,F19,F22})
- `putnam` — wired — formulas/proof-summary (real Lean-kernel-checked count)
- `u_melt` — wired — /metrics + mesh/state (Prometheus + OTel)
- `living_anatomy` — wired — mesh/state (governed-organism 3D)
- `u_about` — wired — evidence/research + research (cited leaders NIST/MITRE/CISA)

### COUNTER-UAS C2 LAB · EXPERIMENTAL
- **`cuas_intercept` — SIMULATED** — cuas/plausibility (Zarchan/Palumbo; EFFECTOR SIM, never actuates)
- `cuas_spoof` — wired — cuas/plausibility (GNSS chi-square gate, advisory)
- `cuas_fusion` — wired — cuas/fusion (CI fusion; confidence capped < 1.0)
- `cuas_swarm` — wired — cuas/consensus (graph-Laplacian; Conjecture 2 OPEN)
- **`cuas_triage` — SIMULATED** — cuas/wta (Manne WTA; EFFECTOR SIM, never fires)
- `cuas_pq` — wired — cuas/pqbus (PQ SHA3 bus; NIST FIPS 203/204/205; signature PROXY until oqs key)

### METABOLIC SCALING · EXPERIMENTAL
- `scaling` — wired — scaling/summary (Kleiber/WBE/Kaplan; SZL-Φ PROPOSED, NOT the formal Λ)

**Views needing Forge action:** none for `/elite` wiring. The only outstanding deployment item is
the HF Space push so the (separate-surface) finance/real-estate routes go live (see deploy note).

---

## Deliverable (PR #115, additive, doctrine-clean)

- `killinchu_elite_wiring.py` — view→feed map + honest health (`audit_map`, `health`, `register`).
  New read-only routes:
  - `GET /api/killinchu/v1/elite/wiring` — static map (never asserts reachability)
  - `GET /api/killinchu/v1/elite/wiring/health[?probe=true]` — in-process live health
- `tests/test_elite_wiring.py` — 6 self-tests (all pass): every view has a real endpoint; doctrine
  invariants (v11, Λ=Conjecture 1, locked-8); effectors SIMULATED; no key in any string; register is
  additive (adds exactly its 2 routes, clobbers no existing route); honest health without probe.
- `serve.py` — one try/except-guarded `register(...)` call before the SPA catch-all (matches the
  existing `szl_evidence_research` / readiness wiring convention).

**Verification run:**
- `py_compile` on all three files — OK
- self-tests — `OK — all elite-wiring self-tests passed`
- full app import with module registered — 526 routes, registration line emitted
- in-process probe — **34 wired / 11 degraded / 3 SIMULATED / 0 needs-deploy**

**Doctrine compliance (self-checked against org `doctrine-check.yml`):** no `doctrine v9/10/12/13`;
Λ never called a theorem (only "Conjecture 1", "NOT a theorem"); no API key/token; no SLSA L2/L3
inflation; `Conjecture 1` present (6×); locked-8 present. Pure stdlib; touches no existing
route/view/feed; NOT merged; no `--admin`.

---

## Deploy note for Forge

1. **HF Space push** (Forge's job) — `main` (`a4059e4` + this PR `03851ea`) is ahead of the deployed
   Space. After merge, push to `szlholdings-killinchu.hf.space` so that:
   - the new finance/real-estate routes stop 404-ing live:
     `/api/killinchu/v1/finance/{,crypto,fx,macro,prediction-markets,risk}`,
     `/api/killinchu/v1/realestate/{,market-pulse,distress-radar,ownership-graph}`
   - the new wiring-audit routes go live:
     `/api/killinchu/v1/elite/wiring` and `/api/killinchu/v1/elite/wiring/health`
2. **No secrets to provision** — every feed is free/no-key. FRED stays honestly disabled until a
   header-auth path is added (never a key in a URL).
3. Post-deploy smoke: `GET /api/killinchu/v1/elite/wiring/health?probe=true` should report
   ~`{wired, degraded, simulated} ` with **needs_deploy = 0**.
