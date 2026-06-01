# A11OY_ORCHESTRATION_PATCHES — a11oy.code orchestrates both flagships

**Layer:** PURIQ v12 → `sentra_killinchu_bridge/` (a11oy top of the C4; orchestrates Sentra +
Killinchu)
**Author:** Yachay, under CTO authority · 2026-06-01
**Honesty:** a11oy reads + reasons + cites; it does NOT write the ledger (RUWAY only) and does
NOT command drones. Composed summaries always carry Khipu citations. DSSE PLACEHOLDER. v11
LOCKED numbers preserved.

---

## 0 — Role

a11oy.code sits at the top of the bridge C4 (BRIDGE_ARCHITECTURE.md). On a natural-language
question about drone cyber posture it:

1. Calls **Sentra** `/api/sentra/v1/drone-cyber/events` (live, additive endpoint from D2).
2. **Enriches** each event by calling **Killinchu** `/api/killinchu/v1/drones/{id}/twin`.
3. **Composes** a summary whose every claim is backed by a **Khipu receipt citation**
   (`flagship_origin` + `receipt_id` + shared `event_id`, per UNIFIED_KHIPU_DAG.md).

It is read-mostly. The only write path it can *propose* is a quarantine — which it cannot
execute itself; it hands the user the 2-person Yuyay-gated action on the Sentra tab.

---

## 1 — Orchestration logic (pseudocode)

```python
async def answer_drone_cyber_question(q: str) -> Answer:
    # 1. pull live cyber events from Sentra
    events = await GET("https://szlholdings-sentra.hf.space"
                       "/api/sentra/v1/drone-cyber/events?window=30d")
    # 2. enrich each suspected drone with its Killinchu twin
    enriched = []
    for e in events["events"]:
        if e["verdict"] == "TAMPER-SUSPECTED":
            twin = await GET("https://szlholdings-killinchu.hf.space"
                             f"/api/killinchu/v1/drones/{e['drone']['id']}/twin")
            enriched.append({"event": e, "twin": twin})
    # 3. compose summary — EVERY sentence cites a Khipu receipt
    return compose_with_khipu_citations(q, events, enriched)
```

`compose_with_khipu_citations` routes through the unified 5-tier LLM router (immune/structured
work floors to tier 2, per Sentra `/brain`). It never asserts a fact without a
`(flagship_origin, receipt_id, event_id)` triple it can point at.

---

## 2 — Conversational example flows

### Flow A — "Are any of our drones compromised right now?"

> **a11oy.code:** Yes — **1 of 12** drones is flagged.
> **KIL-114** (recon-m, allied side) tripped **T16 gps-spoof** at 06:30Z; Λ dropped to
> **0.842**, below the 0.90 floor.
> Detector: embedded `szl-sentra-detect/detect_gps_spoof` (HDOP jump 7.4 vs ≤2.0, sat-count
> drop 9, GNSS-vs-IMU divergence).
> Sentra mapped it to signature **DSIG-06**.
> *Cited Khipu:* killinchu `kr_001` → sentra `sr_007` → (shared `event_id: evt_42`).
> No quarantine has been executed. To isolate it you'll need the **2-person Yuyay** action on
> Sentra `/drone-cyber` (cyber isolation = RTL + link isolation under signed Sentra cert —
> **not kinetic**). Want me to open the proposal?

### Flow B — "Why was KIL-114 flagged and is it serious?"

> **a11oy.code:** KIL-114's twin shows `tamperFlags.T16 = true`; the prior tick was
> ATTESTED-CLEAN, so this is a fresh deviation, severity **high**.
> The GNSS solution diverged from the IMU dead-reckoning beyond threshold while sat count
> collapsed — the classic spoof signature. Λ = 0.842 (axes hit: provenance, freshness,
> authority).
> It is serious enough to warrant isolation but the legal boundary holds: Killinchu only
> isolates its **own** fleet (allied side), never third-party kinetic action ("WE SENSE, WE
> EVIDENCE").
> *Cited Khipu:* killinchu `kr_001` (twin snapshot), sentra `sr_007` (ingest). `event_id: evt_42`.

### Flow C — "Show me the supply-chain side too."

> **a11oy.code:** Across the fleet, all 12 drones report a pinned `szl-sentra-detect` build
> (commit + sha256 in each SBOM; SLSA **L1 honest**, Sigstore **PLACEHOLDER**). No firmware
> merkle mismatch (T12) or unexpected OTA (T17) in the last 30 days.
> The one open item is the GPS-spoof on KIL-114 — a runtime sensor event, not a supply-chain
> tamper.
> *Cited Khipu:* sentra `/drone-cyber/events` 30-day window + killinchu `/receipt/ledger`. All
> signatures **DSSE PLACEHOLDER** (honest).

---

## 3 — Patch surface (a11oy side, additive)

a11oy.code gains two tool bindings (additive, behind try/except like every other a11oy tool):

| tool | calls | returns |
|------|-------|---------|
| `drone_cyber_events(window)` | Sentra `GET /api/sentra/v1/drone-cyber/events` | event list (D3 shape) |
| `drone_twin(id)` | Killinchu `GET /api/killinchu/v1/drones/{id}/twin` | twin snapshot |

No new write tool. The quarantine proposal is surfaced as a **deep-link** to the Sentra tab's
2-person Yuyay action, never auto-executed.

**Honesty rules baked into the composer:**
- Never claim a quarantine happened unless a `drone.cyber.quarantine.executed` receipt exists.
- Always disclose the DSSE PLACEHOLDER signature status when asked about provenance.
- Always state Λ value + floor when reporting a verdict.
- Cite `flagship_origin` + `receipt_id` for every factual claim.

---

*— Yachay, 2026-06-01. ADDITIVE. NO BANDAID. a11oy reads/reasons/cites only — no ledger write
(RUWAY only), no drone command. DSSE PLACEHOLDER. v11 LOCKED numbers preserved.*
