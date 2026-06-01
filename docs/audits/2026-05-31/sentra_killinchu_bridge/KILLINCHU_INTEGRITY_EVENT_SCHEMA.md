# KILLINCHU_INTEGRITY_EVENT_SCHEMA — canonical cross-flagship integrity event

**Layer:** PURIQ v12 → `sentra_killinchu_bridge/` (binding **(b)**: Killinchu `/v1/integrity`
events → Sentra webhook + Khipu)
**Author:** Yachay, under CTO authority · 2026-06-01
**Honesty discipline:** Doctrine v11 LOCKED numbers preserved (749 / 14 / 163 / 13-axis
`yuyay_v3`, replay-hash `bacf5443…631fc5`). SLSA **L1 (honest)**. Signature field carries the
**DSSE PLACEHOLDER** until Sigstore CI lands. ADDITIVE; no Killinchu numbers mutated.

---

## 0 — Purpose

A single canonical **integrity event** shape that Killinchu emits (from its existing
`/api/killinchu/v1/drones/{id}/integrity` evaluator and the new `/v1/integrity-stream`
webhook) and that Sentra consumes (Drone Cyber tab + Sentra Khipu DAG). One shape, two
flagships, one chain. The event is the contract.

The event is **derived from** — never replaces — Killinchu's existing in-Space integrity
verdict (`ATTESTED-CLEAN` / `TAMPER-SUSPECTED`) and its existing `_emit_receipt(kind, payload)`
Khipu writer (schema `szl.killinchu.receipt/v1`, wire F, sha256 hash-chained). The cross-flagship
event simply *wraps* that verdict in a shape Sentra can also chain.

---

## 1 — Canonical event shape (`szl.integrity.event/v1`)

```jsonc
{
  "schema": "szl.integrity.event/v1",
  "event_id": "evt_2026-06-01T06-30-00Z_KIL-114_T16",     // ULID-ish, stable
  "emitted_at": "2026-06-01T06:30:00Z",                    // RFC3339 UTC
  "flagship_origin": "killinchu",                          // emitter flagship
  "drone": {
    "id": "KIL-114",
    "model": "killinchu-recon-m",
    "dice_identity": "did:dice:KIL-114:ek-sha256:9af2…",   // from drone-twin DICE block
    "fleet_side": "allied"                                  // {allied,dual-use,counter-uas}
  },
  "tripwire": {
    "id": "T16",                                            // T11–T20
    "name": "gps-spoof",
    "hukkla": "T16"                                         // HUKLLA tamper-axis map (see §2)
  },
  "verdict": "TAMPER-SUSPECTED",                            // ATTESTED-CLEAN | TAMPER-SUSPECTED
  "severity": "high",                                       // info|low|medium|high|critical
  "sentra_signature": "DSIG-06",                            // Sentra 16-sig map (DSIG-01..10)
  "evidence": {
    "detector": "szl-sentra-detect/detect_gps_spoof",      // embedded lib that fired
    "metric": {"hdop_jump": 7.4, "sat_count_drop": 9, "clock_bias_ms": 412},
    "threshold": {"hdop_jump_max": 2.0, "sat_count_drop_max": 3},
    "raw_ref": "twin://KIL-114/tamperFlags/T16"             // pointer, not a copy
  },
  "lambda": {
    "value": 0.842,                                          // 13-axis geometric mean at event
    "floor": 0.90,                                           // _LAMBDA_FLOOR
    "below_floor": true,
    "axis_names": ["soundness","calibration","robustness","provenance","consent",
                   "reversibility","transparency","fairness","containment",
                   "attestation","freshness","authority","auditability"]
  },
  "khipu": {
    "receipt_id": "kr_…",                                   // Killinchu receipt id (see §3)
    "prev_hash": "sha256:…",                                // hash-chain link
    "this_hash": "sha256:…",
    "cross_link": {                                         // makes it a UNIFIED-DAG node
      "to_flagship": "sentra",
      "relation": "integrity_event_consumed_by_drone_cyber"
    }
  },
  "signature": {
    "mode": "dsse",
    "value": "PLACEHOLDER — Sigstore CI signing not yet wired into CI per Doctrine v11",
    "slsa_level": "L1 (honest)"
  }
}
```

**Invariants (sorry-tagged — not Lean-proven yet):**
- `flagship_origin` is REQUIRED on every event (UNIFIED_KHIPU_DAG depends on it). `-- sorry`
- `tripwire.id ∈ {T11..T20}` and maps 1:1 to a Sentra `DSIG-0x` (§4). `-- sorry`
- `verdict == "TAMPER-SUSPECTED" ⟹ lambda.below_floor == true`. `-- sorry`
- `khipu.this_hash == sha256(canonical_json(event_without_signature) ‖ khipu.prev_hash)`. `-- sorry`

---

## 2 — Tripwire → HUKLLA T11–T20 map

Killinchu tripwires already live under the HUKLLA tamper axes T11–T20 (in
`killinchu_expansion.py`). The integrity event carries the HUKLLA id directly so the unified DAG
and a11oy reasoning can cite the doctrine line, not a free-text label.

| Tripwire | name | HUKLLA | Embedded detector (szl-sentra-detect) | Sentra sig |
|----------|------|--------|----------------------------------------|------------|
| T11 | secure-boot-attestation-failure | T11 | `detect_firmware_tamper` (boot-measure path) | DSIG-01 |
| T12 | firmware-merkle-mismatch        | T12 | `detect_firmware_tamper` (merkle path)       | DSIG-02 |
| T13 | mavlink-anomaly                 | T13 | `detect_mavlink_anomaly`                      | DSIG-03 |
| T14 | rf-fingerprint-deviation        | T14 | `detect_rf_fingerprint_deviation`            | DSIG-04 |
| T15 | accelerometer-spoof             | T15 | `detect_mavlink_anomaly` (IMU cross-check)   | DSIG-05 |
| T16 | gps-spoof                       | T16 | `detect_gps_spoof`                            | DSIG-06 |
| T17 | unexpected-ota-attempt          | T17 | `detect_firmware_tamper` (OTA hook)          | DSIG-07 |
| T18 | geofence-violation              | T18 | `detect_mavlink_anomaly` (geofence cross)    | DSIG-08 |
| T19 | mission-deviation               | T19 | `detect_mavlink_anomaly` (mission cross)     | DSIG-09 |
| T20 | unauthorized-mavlink-command    | T20 | `detect_mavlink_anomaly` (cmd-auth cross)    | DSIG-10 |

*(Algorithms / FP-targets are the existing ones in `…/killinchu/twin/TAMPER_HACK_DETECTION.md`;
this spec does not change them — it only fixes the cross-flagship wire shape.)*

---

## 3 — Khipu receipt template (cross-flagship)

The cross event is recorded by Killinchu's existing `_emit_receipt`, with an added
`cross_link` block. The RUWAY writer remains the **only** ledger writer (per PURIQ charter).

```jsonc
{
  "schema": "szl.killinchu.receipt/v1",
  "kind": "integrity.event.cross",
  "receipt_id": "kr_2026-06-01T06-30-00Z_…",
  "wire": "F",
  "prev_hash": "sha256:…",
  "this_hash": "sha256:…",
  "flagship_origin": "killinchu",
  "cross_link": { "to_flagship": "sentra", "event_id": "evt_…" },
  "payload": { /* the szl.integrity.event/v1 object from §1 */ },
  "lambda": 0.842,
  "signature": "PLACEHOLDER — Sigstore CI signing not yet wired into CI per Doctrine v11"
}
```

When Sentra ingests the event into its own Khipu DAG (wire F via vessels ingest), it writes a
mirror receipt `kind: "drone.cyber.event.ingested"` whose `cross_link.to_flagship = "killinchu"`
and `cross_link.event_id` equals the same `evt_…`. The two receipts share the `event_id` → the
node is **one logical edge** in UNIFIED_KHIPU_DAG.md.

---

## 4 — JSON Schema (Draft 2020-12, abridged)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://szl.holdings/schemas/integrity.event/v1.json",
  "title": "szl.integrity.event/v1",
  "type": "object",
  "required": ["schema","event_id","emitted_at","flagship_origin","drone","tripwire",
               "verdict","sentra_signature","lambda","khipu","signature"],
  "properties": {
    "schema": {"const": "szl.integrity.event/v1"},
    "event_id": {"type": "string"},
    "emitted_at": {"type": "string", "format": "date-time"},
    "flagship_origin": {"enum": ["killinchu","sentra"]},
    "drone": {
      "type": "object",
      "required": ["id","fleet_side"],
      "properties": {
        "id": {"type": "string"},
        "model": {"type": "string"},
        "dice_identity": {"type": "string"},
        "fleet_side": {"enum": ["allied","dual-use","counter-uas"]}
      }
    },
    "tripwire": {
      "type": "object",
      "required": ["id","name","hukkla"],
      "properties": {
        "id": {"pattern": "^T1[1-9]$|^T20$"},
        "name": {"type": "string"},
        "hukkla": {"pattern": "^T1[1-9]$|^T20$"}
      }
    },
    "verdict": {"enum": ["ATTESTED-CLEAN","TAMPER-SUSPECTED"]},
    "severity": {"enum": ["info","low","medium","high","critical"]},
    "sentra_signature": {"pattern": "^DSIG-0[1-9]$|^DSIG-10$"},
    "lambda": {
      "type": "object",
      "required": ["value","floor","below_floor"],
      "properties": {
        "value": {"type": "number", "minimum": 0, "maximum": 1},
        "floor": {"type": "number"},
        "below_floor": {"type": "boolean"}
      }
    },
    "khipu": {
      "type": "object",
      "required": ["this_hash"],
      "properties": {
        "receipt_id": {"type": "string"},
        "prev_hash": {"type": "string"},
        "this_hash": {"type": "string"},
        "cross_link": {"type": "object"}
      }
    },
    "signature": {
      "type": "object",
      "required": ["mode","value","slsa_level"],
      "properties": {
        "mode": {"const": "dsse"},
        "value": {"type": "string"},
        "slsa_level": {"const": "L1 (honest)"}
      }
    }
  }
}
```

---

## 5 — Sigstore signature (honest status)

The `signature.value` is the literal Killinchu `SIGNATURE_PLACEHOLDER` string until Sigstore CI
is wired. The shape is DSSE-envelope-compatible so that when CI lands, the placeholder is
swapped for a real DSSE envelope with **no schema change**. SLSA stays **L1 (honest)** — we do
not claim provenance we cannot prove. This matches Sentra's own `/doctrine-guard` honesty note
and Killinchu's `SIGNATURE_PLACEHOLDER`.

---

*— Yachay, 2026-06-01. ADDITIVE. NO BANDAID. Invariants `-- sorry`-tagged (not proven). DSSE
PLACEHOLDER. v11 LOCKED numbers preserved.*
