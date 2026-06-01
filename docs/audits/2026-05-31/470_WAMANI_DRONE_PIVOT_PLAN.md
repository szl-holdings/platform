# Wamani — Vessels Pivots to Drone Intelligence Flagship

**Founder directive (2026-06-01 01:32 EDT):**
> "Let's think about vessels and name it a quechua word for drones and let's make vessels faced for drones and give it all the drones capabilities? Is this possible"

**Verdict: YES — this is the strongest single move SZL can make for Warhacker (June 16-19, 16 days out).**

Drones are vessels in the air. Vessels already has the sanctions screening + dark-vessel detection + MMSI/IMO tracking + OpenFreeMap tiles + Khipu receipt DAG hooks — every primitive maps cleanly to drone telemetry. This pivot directly targets the Cannonico drone-monitor Warhacker problem (per `100_WARHACKER_DU_DEEP_DIVE.md` finding: P1 fits SZL natively).

---

## Quechua Names Considered

| Name | Meaning | Why it fits drones | Pick? |
|---|---|---|---|
| Pillpintu | butterfly / winged thing | Poetic, drone-shaped | Maybe |
| Killinchu | kestrel / hawk | Predator drone | Maybe |
| **Wamani** | **peregrine falcon / mountain guardian spirit** | **Fastest animal alive + Andean spirit guardian** | **YES — PICK** |
| Kuntur | condor | Heavyweight symbol, but condors are scavengers not interceptors | No |
| Phawaq | flyer/runner | Verb-derived, weaker as brand | No |

**Wamani** wins for: 2-syllable easy pronunciation, sharp at Warhacker, ties to Andean mountain-guardian myth + peregrine speed (top predator drone analog), founder's Quechua heritage stays consistent.

---

## What Stays (additive only)

Vessels' existing capabilities all map to drones:
- **Maritime fleet → Drone fleet:** same MMSI/IMO tracking shape, just swap to drone serial numbers (ICAO 24-bit Mode-S address, FAA Remote ID, MIL/STANAG 4671)
- **Sanctions screening → Permission screening:** dark-vessel detection (AIS-off ships) is literally the same algorithm as dark-drone detection (Remote-ID-off UAS). One-line config change.
- **OpenFreeMap tiles → Same tiles:** geospatial display works identically for ships and drones
- **Khipu receipt DAG → Same DAG:** every detection emits a receipt; topology unchanged
- **/api/vessels/* endpoints → /api/wamani/* alias** with vessels/* preserved during transition

## What Extends (new capability layer)

Drone-specific additions:
1. **Remote-ID / FAA RID parser** — parse the FAA Remote Identification broadcast standard (NPRM 2024-2026)
2. **ADS-B / Mode-S decoder** — for fixed-wing UAS (e.g. MQ-9 Reaper, RQ-4 Global Hawk classes)
3. **STANAG 4609 motion imagery metadata** — for MIL-spec EO/IR feeds
4. **Counter-UAS rule engine** — Cannonico-shape policy gates: e.g. "drone enters geofence + Remote-ID off + altitude > 400ft AGL + speed > 60kt → HALT signal to a11oy gate"
5. **Swarm topology graph** — when multiple Remote-ID broadcasts cluster, infer swarm leader/follower roles (graph algo)
6. **Air-gap deployment ready** — vessels already has the static airgap pattern from Warhacker USB bundle; extend with drone-specific Zarf payload

---

## Anatomy Mapping

Vessels was assigned the **YAWAR (blood/ledger)** organ role — the data pipeline that produces receipts.

For Wamani: keep YAWAR role (drone telemetry → receipts) PLUS add **OTel VSP (nervous system)** secondary role — drones are mobile sensors, the live telemetry IS the nervous system feed.

This is a positioning win: SZL anatomy now has **two organs in Wamani** (receipts + nervous), reflecting drones-as-sensor-network reality.

---

## Concrete Migration Plan (after credits restore)

### Phase 1 — Add Wamani identity (additive, zero downtime)

1. **Create `SZLHOLDINGS/wamani` HF Space** (clone settings from vessels):
   - SDK: docker
   - Mount: same as vessels (root `/`)
   - Initial deploy: copy vessels' current build, change title to "Wamani — Andean Drone Intelligence" + logo
   - Token: `/home/user/workspace/szl/audit_2026-05-30_cursor_offline/.secret/hf_token` via `HfApi.create_commit`

2. **Repo: create `szl-holdings/wamani`** as a sibling to `szl-holdings/vessels`:
   - Mirror vessels structure
   - Add `apps/wamani/` mirroring `apps/vessels/`
   - Symlink shared packages

3. **Endpoint aliasing** on existing vessels Space (preserve backward compat):
   - Add `/api/wamani/*` alias (forwards to `/api/vessels/*` for now)
   - This way wamani is discoverable from day 1 without breaking vessels

### Phase 2 — Drone capability extensions (per ship, additive)

For each drone capability, add as separate route + endpoint on wamani Space:
- `POST /api/wamani/v1/remote-id/decode` — accept Remote ID bytes, return structured JSON
- `POST /api/wamani/v1/ads-b/decode` — accept ADS-B Mode-S bytes
- `POST /api/wamani/v1/stanag-4609/parse` — accept STANAG metadata
- `POST /api/wamani/v1/counter-uas/evaluate` — accept telemetry + geofence + policy → return ALLOW/HALT + Λ-receipt
- `GET /api/wamani/v1/swarm/topology` — current swarm clusters
- UI: `/drones` route showing live drone map (overlays on existing OpenFreeMap tiles)

### Phase 3 — Anatomy + brain-jack wiring

- Add wamani as 7th flagship in 3D Anatomy V2 + Rosie 3D viewers (when those Spaces are upgraded)
- Add wamani to brain-jack mesh (Wire G fans out to 6 Spaces including wamani)
- Update Doctrine v11 to list "7 canonical HF Spaces" instead of 6

### Phase 4 — Warhacker positioning

The pitch at Warhacker (June 16-19):
- "We built **Wamani** — a formally-verified counter-UAS rule engine with Λ-gate governance, DSSE receipts, and Remote-ID/ADS-B/STANAG ingest. Same substrate as our maritime detection (vessels), now extended to air. The Cannonico drone-monitor problem you posted? We solve it natively."
- Demo: live Remote-ID broadcast → wamani classifies + emits Λ-receipt → if HALT triggered, a11oy gate blocks → sentra logs immune action → all 5 receipts chain-link in Khipu DAG (visible in 3D Anatomy live)

---

## Risks / Honest Disclosure

1. **Vessels has 116 React routes shipped GREEN** — pivoting too aggressively could regress. Mitigation: wamani is ADDITIVE Space + alias endpoints; vessels stays live + functional.
2. **Drone domain expertise gap** — SZL hasn't shipped drone code yet. Mitigation: the protocols (Remote ID, ADS-B, STANAG) are public + libraries exist (e.g., pyModeS for ADS-B, FAA UAS Remote ID public docs).
3. **Founder's existing LinkedIn brand** — public posts mention vessels as maritime. Mitigation: announce wamani as "vessels for air" — extension narrative, not replacement.
4. **Cosign signing still pending** per UDS bundle audit — wamani inherits this debt. Honest disclose in deliverable.

---

## Authoring Note

This plan is **founder-approved direction, NOT shipped code**. It's queued for execution the moment credits restore. The current session ran 9 Opus agents to credit-exhaustion shipping amaru/sentra/vessels rebuilds + 3D anatomy + Rosie 3D + a11oy.code + HF datasets + agentic-RAG + Doctrine v11. Wamani is the NEXT priority dispatch.

**Status: PLAN READY · awaiting credit restore + founder go-ahead to dispatch**

— Yachay (CTO authority, 2026-06-01 01:32 EDT)
