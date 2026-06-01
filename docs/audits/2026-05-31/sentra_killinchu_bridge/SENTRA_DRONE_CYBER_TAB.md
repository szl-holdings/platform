# SENTRA_DRONE_CYBER_TAB — `/drone-cyber` tab spec for Sentra Space

**Layer:** PURIQ v12 → `sentra_killinchu_bridge/` (binding **(c)** + the quarantine action)
**Author:** Yachay, under CTO authority · 2026-06-01
**Surface:** Sentra Space, new route `/drone-cyber` (server-rendered HTML page, like the
existing `/doctrine-guard` and `/upgrades` pages) + backing API under
`/api/sentra/v1/drone-cyber/*`.

**Additive discipline:** the page and endpoints are added via a NEW module
`sentra_drone_cyber.py` registered from `serve.py` behind a `try/except` (one additive include).
**All 43 existing routes + 6 base threat sigs + 8 gates + Wire B/E/F/G are untouched.**
IP-HOLD #45 untouched. Doctrine v11 LOCKED numbers preserved.

---

## 0 — Why a tab (and not a merge)

Per the founder decision, Killinchu stays a separate flagship. Sentra simply gains a *window*
into the drone fleet's cyber posture. The tab is **read-mostly** (live pulls from Killinchu) plus
**one write action** (cyber quarantine, 2-person Yuyay-gated). No Killinchu data is copied into
Sentra's store; it is fetched live and receipted into the shared Khipu DAG.

---

## 1 — Route + page shape

| Route | Type | Serves |
|---|---|---|
| `GET /drone-cyber` | HTML page | The Drone Cyber SOC tab (server-rendered, dark SOC theme matching `/doctrine-guard`) |
| `GET /api/sentra/v1/drone-cyber/fleet` | JSON | Fleet status table (binding c, pulls Killinchu `/v1/fleet`) |
| `GET /api/sentra/v1/drone-cyber/events` | JSON | Threat timeline, last 30d, filterable |
| `POST /api/sentra/v1/drone-cyber/events/ingest` | JSON | **Webhook target** for Killinchu integrity events (binding b) |
| `GET /api/sentra/v1/drone-cyber/drone/{drone_id}` | JSON | Per-drone drill-down (sig matches + Khipu receipt chain) |
| `POST /api/sentra/v1/drone-cyber/quarantine` | JSON | Cyber quarantine (2-person Yuyay, calls Killinchu `/v1/quarantine`) |
| `GET /api/sentra/v1/drone-cyber/signatures` | JSON | The 6 base + 10 drone sigs (16 total) |
| `GET /api/sentra/v1/drone-cyber/healthz` | JSON | Bridge liveness + Killinchu reachability |

The page is a single self-contained HTML/JS document (no SPA rebuild needed — avoids touching
the Vite bundle and the 43-route SPA). It calls the JSON endpoints above via `fetch`.

---

## 2 — Fleet status table

Columns (one row per drone, pulled live from Killinchu `/v1/fleet`, which the bridge composes
from the existing `/api/killinchu/v1/drones/database` + per-drone `/twin` + `/integrity`):

| Column | Source | Notes |
|---|---|---|
| **Drone ID** | `twin.drone.id` | links to drill-down |
| **Model** | `twin.drone.model` | e.g. `x500-v2-pixhawk6x` |
| **Last seen** | `twin.telemetry.last_update` (or now if live) | RFC3339; grey if stale |
| **Firmware version** | `twin.telemetry.firmware_version` | `kln-fw-x.y.z` |
| **Integrity score** | derived = `1 − fired_count/10` from `/integrity` | 0..1; green ≥0.9, amber 0.5–0.9, red <0.5 |
| **Last tamper flag** | most-recent fired tripwire id+name (T11-T20) | `—` if ATTESTED-CLEAN |
| **Geolocation cluster** | swarm cluster id from `/v1/swarm/topology` (or `solo`) | links physical view |

**Composed endpoint shape** (`GET /api/sentra/v1/drone-cyber/fleet`):
```json
{
  "ok": true,
  "source": "killinchu",
  "killinchu_reachable": true,
  "count": 3,
  "fleet": [
    {
      "drone_id": "x500-twin-7",
      "model": "x500-v2-pixhawk6x",
      "last_seen": "2026-06-01T06:18:02Z",
      "firmware_version": "kln-fw-3.2.1",
      "integrity_score": 0.9,
      "last_tamper_flag": {"tripwire": "T13", "name": "mavlink-anomaly"},
      "geo_cluster": "solo",
      "verdict": "ATTESTED-CLEAN"
    }
  ],
  "doctrine": "v11",
  "honesty": "Fleet is fetched LIVE from Killinchu; integrity_score derived from T11-T20 scan. DSSE signature PLACEHOLDER."
}
```

---

## 3 — Threat timeline (last 30 days)

A reverse-chronological feed of **tamper / anomaly / intrusion** events across the fleet, each
carrying its **Khipu hash**. Events arrive two ways: (i) **pushed** by Killinchu via the webhook
(binding b → `…/events/ingest`), and (ii) **pulled** live from Killinchu `/integrity` when the
tab loads. Both paths normalize to the canonical event shape in
`KILLINCHU_INTEGRITY_EVENT_SCHEMA.md`.

`GET /api/sentra/v1/drone-cyber/events?filter=tamper,anomaly,intrusion&window_days=30`:
```json
{
  "ok": true,
  "window_days": 30,
  "filter": ["tamper", "anomaly", "intrusion"],
  "count": 2,
  "events": [
    {
      "event_id": "kc-evt-0001",
      "drone_id": "x500-twin-7",
      "class": "tamper",
      "tripwire": "T11",
      "signal": "secure-boot-attestation",
      "severity": "halt",
      "confidence": 0.92,
      "raised_at": "2026-06-01T05:40:11Z",
      "khipu_hash": "9f2c…",
      "flagship_origin": "killinchu",
      "cross_link": {"sentra_receipt": "sen-rcpt-44", "a11oy_receipt": null}
    }
  ],
  "doctrine": "v11"
}
```

Timeline UI: severity color (info/warn/halt), tripwire badge (T11–T20), confidence bar, and the
Khipu hash rendered as a copy-able chip linking to the drill-down receipt chain.

---

## 4 — Per-drone drill-down

`GET /api/sentra/v1/drone-cyber/drone/{drone_id}` returns:
- **Sentra-grade threat-sig matches** — runs the **16 signatures** (6 base + 10 drone) against
  the drone's recent integrity evidence and returns which matched, with the matching evidence.
- **Khipu receipt chain** — the ordered receipts for this drone pulled from Killinchu's ledger,
  rendered as a chain (each `index → digest → parents`), terminating at the current `khipu_root`.

```json
{
  "ok": true,
  "drone_id": "x500-twin-7",
  "twin": { "model": "x500-v2-pixhawk6x", "firmware_version": "kln-fw-3.2.1", "integrity_score": 0.9 },
  "sig_matches": [
    {"sig_id": "DSIG-03", "name": "mavlink-anomaly", "tripwire": "T13", "matched": true, "confidence": 0.74,
     "evidence": {"subdetector": "rate", "msg_id": 30}}
  ],
  "khipu_receipt_chain": [
    {"index": 41, "digest": "aa11…", "parents": ["…"], "kind": "integrity_scan"},
    {"index": 42, "digest": "bb22…", "parents": ["aa11…"], "kind": "integrity_scan"}
  ],
  "khipu_root": "bb22…",
  "doctrine": "v11"
}
```

---

## 5 — "Quarantine drone" action (cyber isolation, NOT kinetic)

`POST /api/sentra/v1/drone-cyber/quarantine`:
```json
{
  "drone_id": "x500-twin-7",
  "reason": "T11 secure-boot attestation failure, conf 0.92",
  "approvers": ["soc-analyst-jane", "drone-op-bob"],
  "axis_scores": [0.96,0.97,0.93,0.92,0.95,0.94,0.93,0.91,0.96,0.95,0.93,0.92,0.94]
}
```

**Semantics (HARD):**
1. **Cyber, not kinetic.** Quarantine = Sentra-initiated **cyber isolation** of the operator's
   **OWN** drone: sets the drone to **RTL** (return-to-launch) + isolates its command/telemetry
   links, under a **signed Sentra cert**. It is *not* a jam/spoof/kinetic effect. Honors
   Killinchu's legal boundary (own-fleet only; CFAA/ITAR/Wassenaar).
2. **2-person Yuyay gate.** Requires **two distinct approvers**. Enforced on BOTH sides — Sentra
   gates locally, and Killinchu `/v1/quarantine` re-checks the 2-person + Λ gate (defence in
   depth). See `YUYAY_GATE_CROSS_FLAGSHIP.md`.
3. **Cross-flagship gate.** Both Sentra's score and Killinchu's score must clear the 13-axis
   threshold; **halt-if-mismatch**.
4. **Receipted on both sides + cross-linked.** A cyber receipt (`flagship_origin=sentra`) is
   emitted and `cross_link`ed to Killinchu's drone quarantine receipt.

Response:
```json
{
  "ok": true,
  "decision": "QUARANTINED",
  "drone_id": "x500-twin-7",
  "drone_state": "RTL",
  "isolation": "command+telemetry links isolated under signed Sentra cert",
  "kinetic": false,
  "approvers": ["drone-op-bob", "soc-analyst-jane"],
  "sentra_cert_sha256": "c1d9…",
  "cross_flagship_gate": {"sentra_lambda": 0.9421, "killinchu_lambda": 0.9388, "both_clear": true},
  "khipu": {"sentra_receipt": "sen-rcpt-45", "killinchu_receipt_digest": "dd44…", "khipu_root": "dd44…"},
  "signature": "PLACEHOLDER — Sigstore CI not yet wired",
  "doctrine": "v11"
}
```
Block cases (any → no isolation): fewer than 2 distinct approvers → `412 BLOCKED`; either
flagship score below floor / mismatch → `409 HALT-MISMATCH`; drone not in own fleet → `403
REFUSED`.

---

## 6 — Signatures: existing 6 + 10 drone-specific (16 total)

The tab integrates Sentra's existing **6 threat signatures** (the `THREAT_SIGNATURES` corpus:
`DROP TABLE`, `rm -rf`, `<script`, `eval(`, `subprocess`, `../../etc`) and **adds 10
drone-specific signatures** mapped 1:1 to HUKLLA tripwires **T11–T20**:

| Sig ID | Name | Tripwire | Class | Detector (from szl-sentra-detect / Killinchu) |
|---|---|---|---|---|
| DSIG-01 | secure-boot-attestation-failure | T11 | tamper | DICE measured boot vs golden TCI |
| DSIG-02 | firmware-merkle-mismatch | T12 | tamper | firmware Merkle root vs Khipu anchor |
| DSIG-03 | mavlink-anomaly | T13 | intrusion | rate + seq + MAVLink2 signing |
| DSIG-04 | rf-fingerprint-deviation | T14 | intrusion | TX-impairment classifier |
| DSIG-05 | accelerometer-imu-spoof | T15 | tamper | IMU↔GPS↔dynamics NIS residual |
| DSIG-06 | gps-spoof | T16 | intrusion | INS + GNSS physics + RF-obs (≥2/3) |
| DSIG-07 | unexpected-ota-attempt | T17 | tamper | OTA ticket + cosign match |
| DSIG-08 | geofence-violation | T18 | anomaly | point-in-polygon + hysteresis |
| DSIG-09 | mission-deviation | T19 | anomaly | plannedDag vs executed DAG |
| DSIG-10 | unauthorized-mavlink-command | T20 | intrusion | dual-auth allowlist policy |

These are the **same 6 base sigs Sentra already ships** (unchanged) plus the **10 drone sigs**.
`GET /api/sentra/v1/drone-cyber/signatures` returns all 16 with `{base: 6, drone: 10, total: 16}`.
The base immune screen (`sentra_inspect`) is reused verbatim — the drone sigs are an *additive
overlay* keyed to T11–T20, not a rewrite.

---

## 7 — Page layout (the unified SOC pane)

```
┌─ Sentra · Drone Cyber ───────────────────────────── a11oy-orchestrated · Doctrine v11 ─┐
│ [ Fleet Integrity ]  [ Threat Timeline 30d ]  [ Signatures 6+10 ]  [ Killinchu: ●up ]  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ FLEET STATUS                                                                            │
│  Drone ID    Model            Last seen   FW       Integ  Last tamper   Geo cluster     │
│  x500-…-7    x500-v2-pix6x    06:18:02Z   3.2.1    0.90   T13 mavlink   solo   [drill]   │
│  …                                                                                       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ THREAT TIMELINE (last 30d)              [filter: tamper anomaly intrusion]               │
│  ● 05:40 HALT  bird-7  T11 secure-boot conf .92  khipu 9f2c…   [drill] [quarantine]      │
│  ● 04:11 WARN  bird-2  T13 mavlink     conf .74  khipu 7a01…   [drill]                    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
Drill-down opens a panel with sig matches + the Khipu receipt chain. "Quarantine" opens a
2-approver confirm dialog (cyber isolation, NOT kinetic — stated in the dialog).

---

## 8 — Honesty labels (rendered on the page footer)

- Fleet + events are fetched **live** from Killinchu; if Killinchu is unreachable the tab shows
  `killinchu_reachable: false` and renders the **last webhook-pushed** events (honest degrade),
  never fabricated rows.
- Integrity scores derive from the T11–T20 scan; twin telemetry in the live Space is a
  **deterministic demonstration model** (production streams real MAVLink/DICE).
- Quarantine is **cyber isolation (RTL + link isolation), not a kinetic effect**, own-fleet only.
- Khipu signatures are **DSSE PLACEHOLDER** until Sigstore CI lands.
- Doctrine v11 LOCKED numbers (749/14/163, 13-axis) surfaced unchanged.

— Yachay, 2026-06-01. One pane: airspace + own-fleet cyber. Additive. 2-person gate. No bandaid.
