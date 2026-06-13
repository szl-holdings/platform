# Mosaic → SZL BUILD SPEC — Sovereign Space/Domain-Superiority + Anomaly-Detection Operating Layer

**Author:** CTO + Program Manager, SZL Holdings (org `szl-holdings`).
**Reads first (definitive):** [`estate_audit/mosaic_identification.md`](./mosaic_identification.md) (Mosaic = True Anomaly's proprietary space-superiority platform; clean-room the *capability* from public descriptions + a verified-permissive anomaly lineage) and [`estate_audit/feno_phd_analysis.md`](./feno_phd_analysis.md) (FE-NO physics solver — adjacent capability, already landed as the `szl_mechanics` vertical).
**Executors:** Dev1–Dev4 (full-stack, Opus 4.8 class) + Forge (Replit build/test/deploy agent).
**Posture (binding, Doctrine v11 LOCKED):** Λ = **Conjecture 1** (advisory, never a theorem); locked-proven = **exactly 8** `{F1,F4,F7,F11,F12,F18,F19,F22}` on kernel `c7c0ba17` (749/14/163); Khipu BFT = **Conjecture 2** (open); SLSA **L1 honest / L2 build-attested / L3 roadmap**; sovereign own-metal, 0 CDN; **NO free-energy / no over-claims**; **cite-never-plagiarize** (attribute True Anomaly as *inspiration*, each adopted lib by license); no banned codenames (`amaru`/`sentra`/`rosie`/`jarvis`) in user-visible copy; `szl-router` PRIVATE.

> **One honest sentence up front:** today killinchu does **counter-UAS / drone / vessel** track→classify→evaluate→signed-receipt at the air/maritime edge ([killinchu README](https://github.com/szl-holdings/killinchu)); the **orbital-SDA / Threat-Warning-&-Assessment** extension is **roadmap SZL must build** — this spec sequences exactly that build, reusing `python-sgp4` + the verified-permissive anomaly lineage, and it never claims SZL already flies in orbit.

---

## 1. THE VISION (one page)

### Name (SZL-native, not a banned codename)
**`killinchu SDA` — the Sovereign Domain-Awareness layer**, with the engine itself shipped as **`khipu-sda-core`** (the clean-room anomaly/SDA core organ). Public/user-visible framing: *"killinchu SDA — a sovereign, governed Domain-Superiority operating layer: every track, detection, and threat-call carries a signed provenance receipt and an honest Λ-gated confidence."* (No `amaru`/`sentra`/`rosie`/`jarvis` anywhere in copy.)

### What it is
SZL's sovereign answer to True Anomaly's Mosaic — Mosaic is *"the operating system for space superiority"* fusing space- and ground-based sensors into a dynamic Common Operating Picture, accelerating the OODA loop, supporting SDA + C2 + battle management ([True Anomaly — Mosaic](https://www.trueanomaly.space/mosaic)). SZL builds the **same capability skeleton** — DTID → Characterize → ML Threat-Warning → fuse/forecast into a COP ([Eric Hilmer, True Anomaly, LinkedIn](https://www.linkedin.com/posts/erichilmer_true-anomaly-lands-174m-contract-from-us-activity-7110684034724233216-371t)) — on top of the SZL spine that already exists: killinchu's **44-view threat app** (Live Track Board, Sensor-Fusion, Multi-Track Priority, ROE Editor, Threat Class DB, Maritime Track, Vessel Fusion, Swarm Topology, Mesh) ([killinchu README](https://github.com/szl-holdings/killinchu)), a11oy's **signed-receipt governance substrate** (`receipts.in ≡ receipts.out`) ([a11oy README](https://github.com/szl-holdings/a11oy)), and the **UDS air-gap deployment eco**.

### The moat vs True Anomaly (what they do NOT publicly offer)
1. **Signed provenance per call.** Every detection / track-fusion / threat verdict emits a **DSSE in-toto receipt** on a real SHA-256 Khipu Merkle DAG — *real-DSSE-or-honestly-UNSIGNED, never fabricated* ([killinchu README](https://github.com/szl-holdings/killinchu)). Mosaic's public materials advertise explainable overlays, not independently-verifiable cryptographic receipts.
2. **Honest Λ-gated confidence.** Anomaly/threat scores feed the **13-axis Λ-gate as a new advisory axis** — surfaced as a confidence bound, never as "proven optimal" (Λ = Conjecture 1).
3. **Sovereign + air-gap by construction.** Ships as a **cosign-signed UDS/Zarf bundle**, own-metal, 0 CDN — matching Mosaic's *"installable on classified or air-gapped systems"* claim ([True Anomaly — Mosaic](https://www.trueanomaly.space/mosaic)) and **exceeding it on provenance**.
4. **Clean-room + permissive lineage.** Built only on PyOD (BSD-2), PyGOD (BSD-2), Merlion (BSD-3), TODS (Apache-2.0), tsod (MIT), GDN (MIT), GraGOD (MIT), python-sgp4 (MIT). **alibi-detect is REJECTED** (relicensed to BSL 1.1, 2024-01-22 — no production use without subscription, [Seldon](https://www.seldon.io/strengthening-our-commitment-to-open-core/)).

### The honest roadmap delineation (no over-claim)
- **TODAY (operational):** air + maritime counter-UAS / vessel track, classify, evaluate, sign — live HF Space ([killinchu README](https://github.com/szl-holdings/killinchu)).
- **THIS BUILD (sequenced below):** a clean-room **multivariate + graph anomaly + track-fusion** engine that emits signed receipts and Λ-gated confidence, wired into killinchu's existing fusion views, governed in a11oy, packaged as a UDS bundle.
- **ROADMAP (named, not claimed done):** full **orbital DTID/SDA + ML-TW&A forecasting** — the SDA extension reuses `python-sgp4` orbit propagation on top of the same anomaly core; this is honest future work, not a present capability.

The adjacent **FE-NO solver** ([feno_phd_analysis.md](./feno_phd_analysis.md)) already proves the pattern: it landed as the `szl_mechanics` vertical in `platform/services/verticals/szl_mechanics/`, emitting an in-toto scientific-compute receipt with a bounded-error **ESTIMATE** ([`szl_mechanics/receipt.py`](https://github.com/szl-holdings/platform)). `khipu-sda-core` reuses that exact receipt schema, making "provable structural integrity" and "provable threat verdict" share one provenance path.

---

## 2. CAPABILITY MAP

Each Mosaic capability → the SZL surface that hosts it → the openly-licensed lib(s) to clean-room adopt (with license) → OUR formulas it uses. killinchu modules/views are cited from the real repo (`killinchu_fusion.py`, `killinchu_maritime_*.py`, `killinchu_posture_topology.py`, `szl_khipu_consensus.py`, `szl_dsse.py`, `szl_shared_formulas/`).

| Mosaic capability ([source](https://www.trueanomaly.space/mosaic)) | SZL surface that hosts it (killinchu view · a11oy tab · platform vertical) | Openly-licensed lib(s) to clean-room adopt (license) | OUR formulas it uses |
|---|---|---|---|
| **SDA track custody (DTID — Detect/Track/ID)** | killinchu **Live Track Board** + **Multi-Track Priority** + Threat Class DB (`killinchu_elite_console.py`, `drones_db.json` 53 fingerprints); orbital track = NEW `killinchu SDA` view | `python-sgp4` (MIT) for orbit propagation from TLE/OMM; PyOD (BSD-2) point detectors for the detector bank | **Kalman** constant-velocity track smoothing (`szl_shared_formulas/kalman.py`, Lean `gain_in_unit_interval`); **Welford** online variance gate (`welford.py`) |
| **Sensor fusion → dynamic COP** | killinchu **Sensor-Fusion** + **Maritime Track** + **Vessel Fusion** (`killinchu_fusion.py`, `killinchu_maritime_view.py`); a11oy **Command Center** as the oversight COP | Merlion (BSD-3) + TODS (Apache-2.0) multivariate time-series fusion across track channels; tsod (MIT) lightweight edge rules | **Λ 13-axis gate** (`yuyay_v3`) as the fusion-confidence gate; **DSSE Khipu receipt** per fused track (`szl_dsse.py`, `_lake_receipt` in `killinchu_fusion.py`) |
| **ML Threat Warning & Assessment (predict object change)** | killinchu **13-axis Λ** view + Threat Class DB; NEW anomaly axis feeding the gate | **GDN** (MIT) graph-deviation network — explainable inter-sensor anomaly (which sensor caused it); **GraGOD** (MIT) GNN-TSAD; **PyGOD** (BSD-2) graph outliers | **Λ-gated advisory score** (Conjecture 1) — anomaly score becomes a new conjunctive axis; **PAC-Bayes (Catoni)** high-prob risk bound for honest confidence (`pac_bayes.py`, Lean `pacBayesBound_eq_add_slack`) |
| **C2 / battle management / asset orchestration** | killinchu **Swarm Topology** + **Mesh** (`killinchu_posture_topology.py`); a11oy **Capabilities** + **Services** tabs | (no new lib — orchestration via existing `szl-mesh` CRDT) | **Khipu BFT 3-of-4 quorum** (`szl_khipu_consensus.py`, Lean `faultyCount` / Conjecture 2); **Bloom filter** fast threat-signature membership (`bloom_filter.py`) |
| **OODA acceleration / re-pairing / probability-of-success overlays** | killinchu **Multi-Track Priority** + **ROE Editor** (recommended-action overlays w/ confidence bounds, human approves) | Merlion (BSD-3) forecasting for "what changes next"; PyOD (BSD-2) ensemble scoring | **Λ advisory + confidence bound** surfaced as probability-of-success overlay (honest: advisory only, human-on-the-loop) |
| **Wargaming / training ranges** | a11oy **Warhacker** demo suite (7 live demos) + killinchu **Drone Demo Suite** (7 scripted scenarios) | (replay over existing demo harness) | **YAWAR** append-only receipt bus + deterministic **replay** (Epistemic State Replication — roadmap labeled) |
| **Air-gap / GovCloud deploy** | platform `szl_mechanics`-style vertical pack + UDS bundle (`uds-bundles`, `szl-uds-deployment`) | (Zarf/UDS, cosign — already aligned) | **DSSE in-toto Statement v1** receipt schema (shared with `szl_mechanics/receipt.py`); cosign keyless + Rekor |
| **Structural / engineering adjacency (FE-NO)** | platform **`szl_mechanics`** vertical (already landed) → feeds Vessels hull/structural | FEniCSx/DOLFINx + JAX (clean-room, permissive) — arXiv:2606.08796 method attribution only | **Bounded-error ESTIMATE** receipt + **Λ-gated/conformal band** (see [feno_phd_analysis.md](./feno_phd_analysis.md)) |

**Anomaly engine internal stack (clean-room, by Mosaic stage):** point/univariate = **PyOD** (BSD-2); track-level multivariate = **Merlion** (BSD-3) / **TODS** (Apache-2.0) / **tsod** (MIT); inter-sensor graph = **GDN** (MIT) / **GraGOD** (MIT) / **PyGOD** (BSD-2); orbital = **python-sgp4** (MIT). Method grounding from papers (cite, don't vendor): GDN AAAI'21 ([arXiv 2106.06947](https://www.alphaxiv.org/overview/2106.06947v1)), Graph-TSAD surveys ([arXiv 2302.00058](https://arxiv.org/html/2302.00058v4), [2307.03759](https://arxiv.org/abs/2307.03759)).

---

## 3. THE 4-DEV WORK BREAKDOWN (non-overlapping lanes)

Sequencing: **Dev1 lands the CORE first** (it defines the interface contract). Dev2/Dev3/Dev4 build against the contract in parallel once Dev1's `v0`-interface is frozen (see §3.0). One branch per task, DCO + Conventional Commits + SHA-pinned actions on every PR.

### 3.0 The interface contract (frozen by Dev1, consumed by all)
All lanes speak two shared shapes — identical to the receipt path `szl_mechanics` already uses ([`szl_mechanics/receipt.py`](https://github.com/szl-holdings/platform)):

```jsonc
// SDA verdict envelope (Dev1 emits; Dev2/3 render; Dev4 packages)
{
  "track_id": "TRK-0001",
  "stage": "DTID|CHARACTERIZE|TWA|FUSE",            // Mosaic-derived pipeline stage
  "anomaly_score": 0.0,                              // [0,1] from clean-room engine
  "lambda_axis": { "name": "anomaly_twa", "value": 0.0, "advisory": true },  // Λ = Conjecture 1
  "confidence": { "lo": 0.0, "hi": 0.0, "method": "PAC-Bayes|conformal", "label": "ESTIMATE" },
  "sgp4": { "tle_hash": "sha256:…", "propagated": true },  // null for air/maritime tracks
  "receipt": {                                       // in-toto Statement v1 — SAME schema as szl_mechanics
    "_type": "https://in-toto.io/Statement/v1",
    "predicateType": "https://szlholdings.com/attestations/sda-anomaly/v1",
    "subject": [{ "name": "TRK-0001", "digest": { "sha256": "…" } }],
    "predicate": { "engine":"khipu-sda-core", "model_hash":"…", "seed":0,
                   "lib_lineage":["pyod-BSD2","gdn-MIT","sgp4-MIT","merlion-BSD3"],
                   "verified": false, "sovereign": true }
  },
  "_signing": { "status": "UNSIGNED|SIGNED", "signed_by": "szl_lake/khipu DSSE (Ed25519/P-256)" }
}
```
**Honesty rule on the envelope:** UNSIGNED is STRUCTURAL-ONLY at the a11oy verify-api — never a false "verified/green". No fabricated signatures, ever.

---

### Dev1 — Clean-room anomaly/SDA CORE engine (`khipu-sda-core`)
**Repo:** NEW `szl-holdings/khipu-sda-core` (Apache-2.0, public; clean-room). Mirror the `szl_mechanics` package shape.
**Paths:**
- `khipu_sda_core/detect.py` — PyOD (BSD-2) detector bank (point/univariate).
- `khipu_sda_core/multivariate.py` — Merlion (BSD-3) + TODS (Apache-2.0) + tsod (MIT) track-channel TSAD.
- `khipu_sda_core/graph.py` — GDN (MIT) + GraGOD (MIT) + PyGOD (BSD-2) inter-sensor graph anomaly (explainable: which sensor).
- `khipu_sda_core/orbit.py` — python-sgp4 (MIT) TLE/OMM propagation → orbital track custody.
- `khipu_sda_core/fusion.py` — track-fusion across air/maritime/orbital channels → single fused track store.
- `khipu_sda_core/receipt.py` — emits the §3.0 in-toto Statement v1 (clone `szl_mechanics/receipt.py`; predicate `…/sda-anomaly/v1`); honest UNSIGNED, signer pointer to szl_lake/khipu.
- `khipu_sda_core/confidence.py` — PAC-Bayes (Catoni) + split-conformal band → honest `confidence{lo,hi,label:ESTIMATE}`.
- `ATTRIBUTION.md` + `THIRD_PARTY_NOTICES` (each lib license reproduced; True Anomaly = inspiration only, no code; **alibi-detect excluded**).
- `tests/test_no_mock.py` (grep sources for `mock|fake|stub|dummy`, FAIL if found, mirroring killinchu) + `tests/test_receipt_roundtrip.py`.

**Interface contract (out):** the §3.0 envelope, returned by `khipu_sda_core.evaluate(track) -> envelope` and a thin FastAPI `POST /sda/evaluate`.
**"Done" =** clean-room engine produces a §3.0 envelope for air/maritime/orbital tracks; receipt verifies in-process; `anomaly_axis` ∈ [0,1]; confidence labeled ESTIMATE; `ATTRIBUTION.md` lists every lib+license, alibi-detect absent; CI green for a real reason; **interface `v0` tagged and frozen** so Dev2–4 can build.

---

### Dev2 — ELEVATE killinchu (wire the engine in)
**Repo:** `szl-holdings/killinchu` (Apache-2.0).
**Paths / views to wire (real modules):**
- `killinchu_fusion.py` — call `khipu-sda-core` in `_organ_link` / fusion path; route `anomaly_score` into the existing `_lake_receipt` Khipu append (`_khipu_append`).
- `killinchu_elite_console.py` — wire the engine output into **Live Track Board**, **Sensor-Fusion**, **Multi-Track Priority**, **Threat Class DB**, **ROE Editor** views; add the NEW **`killinchu SDA`** view (orbital track via `orbit.py`), honestly labeled *"SDA — roadmap orbital extension; air/maritime live."*
- `szl_shared_formulas/` — add `anomaly_twa` as the new **Λ-gate axis** feeding `yuyay_v3` (13-axis → keep conjunctive deny-by-default; advisory).
- `killinchu_drone_routes.py` / formula endpoints — expose `POST /api/killinchu/v1/sda/evaluate` returning the §3.0 envelope.
- ROE overlay: probability-of-success + confidence-bound overlay in **ROE Editor**, human approves (human-on-the-loop preserved).

**Interface contract (in):** consumes Dev1's `khipu-sda-core>=v0` envelope; **out:** signed DSSE Khipu receipt per verdict via existing `szl_dsse.py`.
**"Done" =** the four target views render real engine output; new `anomaly_twa` axis is live in the 13-axis gate (count stays 13, advisory); `/sda/evaluate` returns a real envelope with a verifiable receipt; spoofing caveat preserved in `/v1/honest`; mobile/tablet (390/820) verified; 0 console errors; CI green.

---

### Dev3 — ELEVATE a11oy.net (governance-over-anomalies)
**Repo:** `szl-holdings/a11oy` (Apache-2.0).
**Paths / tabs:**
- `pages/console.html` — add a **"Domain Awareness"** tab (the COP/oversight surface): live fused-track stream from killinchu, each row showing Λ-axis value + confidence band + receipt link; mobile-elegant (bottom-sheet/drawer + FAB, 390/820 verified).
- Wire into existing **Command Center** (recent verdicts / receipt stream), **Evidence** (export SDA receipts, replayable), **Capabilities** (register the SDA capability path).
- Policy: route every SDA verdict through `/v1/policy/evaluate` (deny-by-default) and `/v1/verify`; Domain-Jury scoring of the advisory Λ signal — surfaced as advisory, never "proven trust".
- `/api/a11oy/v1/honest` — extend disclosure to state the SDA layer's roadmap delineation (orbital = roadmap).

**Interface contract (in):** consumes killinchu's `/sda/evaluate` envelopes + the DSSE receipts; renders the oversight COP. **out:** governed-run receipts (`receipts.in ≡ receipts.out`).
**"Done" =** Domain Awareness tab renders the live oversight COP; every anomaly verdict is Evidence-backed, Λ-gated, policy-evaluated, receipt-verifiable in-browser; honest disclosure updated; mobile-elegant verified; 0 console errors; CI green.

---

### Dev4 — ELEVATE the full UDS eco (package + align)
**Repos:** `szl-holdings/uds-bundles`, `szl-uds-deployment`, `szl-mesh`/`uds-mesh`, plus the `khipu-sda-core` Zarf packaging.
**Paths / work:**
- Package `khipu-sda-core` as a **UDS capability service**: `deploy/zarf.yaml` (mirror killinchu's), cosign-signed OCI, air-gap-deployable, 0 CDN.
- Add the SDA service to the `szl-uds-bundle` so `uds-cli bundle deploy oci://ghcr.io/szl-holdings/szl-uds-bundle:<ver> --confirm` ships killinchu + a11oy + SDA together.
- **Version-string reconciliation (the audit flagged drift):** across the eco the strings observed are `uds-v0.1.0/0.1.1/0.2.0/0.2.1/0.3.0/0.3.1/0.4.0/0.4.1`. **Pick one canonical next version (`uds-v0.4.0`), bump every README/zarf.yaml/Dockerfile/workflow to it in one PR per repo, and delete stale tags from user-visible docs** (see §4). The 0.3.1 release plans in `a11oy/organs/.../UDS_v0.3.1_RELEASE_PLAN.md` are superseded.
- Receipts: SDA service emits DSSE in-toto receipts into the **Khipu DAG** via `szl-mesh` 3-of-4 quorum (Conjecture 2 labeled).

**Interface contract (in):** consumes Dev1's container + receipt schema; **out:** one cosign-signed, Rekor-anchored, air-gap-deployable bundle at a single canonical version.
**"Done" =** SDA ships in the signed UDS bundle; `gh attestation verify` + `cosign verify-attestation` pass; air-gap deploy tested in k3d; **all UDS repos report ONE canonical version string**; SLSA L1 honest / L2 build-attested labels intact (L3 roadmap); CI green.

---

## 4. GITHUB-ALIGN + DOCTRINE

### Staying GitHub-canonical
- All four lanes live in `szl-holdings` repos; `khipu-sda-core` is the one NEW repo (public, Apache-2.0, clean-room). Everything else is an additive PR to an existing canonical repo. **`szl-router` stays PRIVATE.**
- One branch per task; DCO sign-off; Conventional-Commit titles; SHA-pinned GitHub Actions; gitleaks + SBOM + grype on every repo (mirror the existing small-repo workflow set). GitHub is the source of truth; HF Spaces + Replit mirror from it.
- `ATTRIBUTION.md` in `khipu-sda-core` records clean-room provenance: which capability came from which **public** True Anomaly description ([Mosaic page](https://www.trueanomaly.space/mosaic), [Hilmer LinkedIn](https://www.linkedin.com/posts/erichilmer_true-anomaly-lands-174m-contract-from-us-activity-7110684034724233216-371t)) as **inspiration only**, and each adopted lib by license (PyOD BSD-2, PyGOD BSD-2, Merlion BSD-3, TODS Apache-2.0, tsod MIT, GDN MIT, GraGOD MIT, python-sgp4 MIT). **No upstream proprietary code; alibi-detect excluded (BSL 1.1).**

### Version-string reconciliation (drift fix)
Observed across the eco: `uds-v0.1.0` (×2), `0.1.1` (×3), `0.2.0` (×271), `0.2.1` (×5), `0.3.0` (×96), `0.3.1` (×44), `0.4.0` (×3), `0.4.1` (×4). **Resolution:** adopt **`uds-v0.4.0`** as the single canonical next version for the SDA release; Dev4 runs one bump-PR per repo (`README.md`, `deploy/zarf.yaml`, `Dockerfile`, `.github/workflows/zarf-build-and-sign.yml`), retires the `0.3.1` release plans, and asserts in CI a `make doctrine`-style check that no two user-visible version strings disagree.

### Doctrine v11 (binding, repeated for the build)
- **Λ = Conjecture 1** — the `anomaly_twa` axis and all SDA confidence are **advisory**; never a theorem, never "proven trust".
- **Locked-proven = exactly 8** `{F1,F4,F7,F11,F12,F18,F19,F22}` — the SDA engine is an **engineering capability**, NOT folded into the locked count; no "kernel-verified/proven" badge on anomaly verdicts.
- **Khipu BFT = Conjecture 2** — multi-witness solve/track verification is *proposed agreement*, not proven BFT.
- **SLSA L1 honest / L2 build-attested / L3 roadmap** — never claim L3.
- **Sovereign own-metal, 0 CDN; NO free-energy / over-unity** anywhere; any $/credit = ESTIMATE.
- **cite-never-plagiarize** — True Anomaly attributed as *inspiration*; every adopted lib by its license; method papers by arXiv ID/DOI.
- **No banned codenames** (`amaru`, `sentra`, `rosie`, `jarvis`) in any user-visible copy — internal vertical dirs (e.g. `sentra_cyber`) are not user-visible and unchanged; user-facing surface is "killinchu SDA / Domain Awareness".
- **Honest sensor caveat (inherited):** broadcast Remote-ID/ADS-B/MAVLink are unauthenticated/spoofable — every decoded field is a *claim*; same skepticism applies to fused anomaly inputs ([killinchu README](https://github.com/szl-holdings/killinchu)).

---

## 5. FORGE / REPLIT HANDOFF (outline)

A `platform/replit-sync/FORGE-MOSAIC-SDA-<date>.md` work-order will instruct Forge (mirror the existing work-order format). Outline:

**What Forge BUILDS:**
- `khipu-sda-core` container (Dev1): pip-install lineage libs (PyOD/PyGOD/Merlion/TODS/tsod/GDN/GraGOD/python-sgp4 only — **block alibi-detect in CI**), build cosign-signed OCI image at `ghcr.io/szl-holdings/khipu-sda-core:uds-v0.4.0`.
- Rebuild killinchu + a11oy images with the new SDA wiring (Dev2/Dev3).
- Assemble the unified `szl-uds-bundle:uds-v0.4.0` (Dev4).

**What Forge TESTS:**
- `test_no_mock.py` + `test_receipt_roundtrip.py` (Dev1); the §3.0 envelope round-trips and the DSSE receipt verifies (`cosign verify-blob`).
- killinchu `/api/killinchu/v1/sda/evaluate` returns HTTP 200 with a real envelope; new `anomaly_twa` axis present; `/v1/honest` reflects roadmap delineation.
- a11oy Domain Awareness tab renders; `/v1/policy/evaluate` + `/v1/verify` pass; mobile 390/820, 0 console errors.
- Version-drift CI check: one canonical `uds-v0.4.0` everywhere.
- Air-gap: `uds-cli bundle deploy` in k3d; `gh attestation verify` + `cosign verify-attestation`.

**What Forge DEPLOYS:** the signed bundle to the HF Spaces mirrors (killinchu, a11oy) + GHCR, after gates pass.

**Founder-only gates (Forge must STOP and request approval — never self-approve):**
1. Making `khipu-sda-core` **public** (currently propose public; founder confirms).
2. Any **version bump that re-tags a released artifact** (`uds-v0.4.0` cutover).
3. Any change touching **`szl-router`** (PRIVATE — must not be exposed).
4. Any copy that would name a **banned codename** user-visibly, or any badge implying the SDA engine is locked-proven / Λ-theorem / SLSA L3 — **hard-blocked**, founder review required.
5. Publishing the **orbital-SDA** surface as anything other than "roadmap" — founder confirms honest framing before release.

---

### Source ledger (this spec)
True Anomaly Mosaic — [trueanomaly.space/mosaic](https://www.trueanomaly.space/mosaic); SDA four-function decomposition — [Eric Hilmer, LinkedIn](https://www.linkedin.com/posts/erichilmer_true-anomaly-lands-174m-contract-from-us-activity-7110684034724233216-371t). Open lineage + licenses — PyOD [BSD-2](https://github.com/yzhao062/pyod), PyGOD [BSD-2](https://github.com/pygod-team/pygod), Merlion [BSD-3](https://github.com/salesforce/Merlion), TODS [Apache-2.0](https://github.com/datamllab/tods), tsod [MIT](https://github.com/DHI/tsod), GraGOD [MIT](https://github.com/GraGODs/GraGOD), GDN [MIT](https://github.com/d-ailin/GDN), python-sgp4 [MIT](https://github.com/brandon-rhodes/python-sgp4); alibi-detect REJECT [Seldon BSL 1.1](https://www.seldon.io/strengthening-our-commitment-to-open-core/). SZL eco — [killinchu](https://github.com/szl-holdings/killinchu), [a11oy](https://github.com/szl-holdings/a11oy), [platform](https://github.com/szl-holdings/platform) (`services/verticals/szl_mechanics/`), [uds-bundles](https://github.com/szl-holdings/uds-bundles), [szl-uds-deployment](https://github.com/szl-holdings/szl-uds-deployment), [khipu-consensus](https://github.com/szl-holdings/khipu-consensus), [lutar-lean](https://github.com/szl-holdings/lutar-lean). FE-NO adjacency — [feno_phd_analysis.md](./feno_phd_analysis.md), arXiv:2606.08796 (method attribution only).

*Spec status: COMPLETE. Sequenced: Dev1 freezes the interface → Dev2/3/4 build in parallel → Forge builds/tests/deploys behind founder gates. Clean-room, honest, sovereign.*
