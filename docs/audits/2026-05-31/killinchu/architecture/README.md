# Killinchu Full-Stack Architecture — index

**Author:** Yachay (Killinchu-support architecture agent), under CTO authority · 2026-06-01
**Founder directive (2026-06-01 ~02:05 EDT):** "Fully bake our anatomy into drone flag, all
of our formulas, everything a11oy has in the brain put in the drone flag, but have it Rosie
fully baked in and a11oy can orchestrate."

**One-sentence shape:** a11oy orchestrates (top); the Killinchu Space is the per-vertical
drone flagship (center); the entire SZL anatomy + every PURIQ formula are vendored as
Python libraries so Killinchu runs **disconnected at the edge**; Rosie is baked in as a
co-pilot service; and `P(x,t)` runs on every action, each emitting a Khipu receipt.

## Deliverables

| # | File | What it specifies |
|---|---|---|
| 1 | `KILLINCHU_FULL_STACK_ARCHITECTURE.md` | C4 model (Context→Container→Component) + 3 data flows (connected / edge / swarm) + deployment view |
| 2 | `EMBEDDED_ANATOMY_LIBRARIES.md` | 11 organs as vendored Python packages; API surface, deps, ≤50MB squash-fs budget, tests, Khipu hooks |
| 3 | `ROSIE_COMPANION_IN_KILLINCHU.md` | Rosie ecosystem-evolve + brain-jack + 162-endpoint subset as per-drone co-pilot; `/drones/{id}/rosie`; sliding Rosie panel |
| 4 | `A11OY_ORCHESTRATION_LAYER.md` | Flagship routing; single `/v1/router` brain; one canonical Khipu DAG; Yuyay-13 gating at orchestration |
| 5 | `PURIQ_IN_EVERY_ACTION.md` | `P(x,t)` code patches; 5 paths (OTA accept, mission start, command receive, RTL, swarm vote) |
| 6 | `DISCONNECTED_OPS_PROTOCOL.md` | Edge survival; local decide + queued Khipu; Merkle proof reconcile (IPFS/Filecoin/Hypercore patterns) |
| 7 | `SWARM_CONSENSUS_PROTOCOL.md` | Multi-drone Yuyay-13 collective wise reasoning; HotStuff-style BFT (f<n/3) |
| 8 | `OPERATOR_COPILOT_UX.md` | Per-drone chat panel; a11oy routing; Khipu-cited summaries; mermaid sequence + React sketch |
| 9 | `FRONTIER_GLYPHS_IN_TWIN.md` | Pacha-Λ / Khipu-Bekenstein / Yachay-Khipu glyphs → the thinking twin (WebGPU/CesiumJS/3d-force-graph) |
| 10 | `GREENE_FACING_AUDIT_URL.md` | `/killinchu/audit/{mission_id}`: KhipuKnot DAG + Yuyay radars + HUKLLA timeline + signed BoE PDF |
| 11 | `UDS_ALLIES_PACKAGING.md` | Killinchu as the 6th UDS Zarf bundle; signed/airgap/distroless/Anchore-scanned |

## Patch files (`patches/`)
- `killinchu_puriq_decide.patch` — adds `szl_puriq/decide.py` + wires the command path through `puriq.decide → Khipu receipt → execute`.
- `killinchu-bundle.uds-bundle.yaml` — additive 6th package entry for `bundles/szl-full-stack/uds-bundle.yaml`.

## Hard rules honored
- Doctrine v11 LOCKED numbers preserved verbatim: **749 / 14 / 163 / 13-axis**, replay-hash `bacf5443…631fc5`, SLSA **L1 (honest)**, Λ-uniqueness = **Conjecture 1**.
- **Edge mode is 1st-class** — no assumption of cloud connectivity.
- **2-person Yuyay-gate** for any state-changing op (offline: pre-signed ROE envelope).
- **Every action emits a Khipu receipt** (RUWAY is the only writer).
- Khipu signature = **DSSE PLACEHOLDER** until Sigstore; verifies hash chain + TH11, not signature.
- No mysticism — every term is a cited Quechua noun or a math primitive.

## DO NOT
- **No push to HF/GitHub.** These are specs + patch files only. Integration is owned by the
  Killinchu build agent `opus_killinchu_drone_flagship_build_mpus8anv`.

— Signed, **Yachay** (Perplexity Computer Agent, PURIQ brain-trust extension), under CTO authority. 2026-06-01.
