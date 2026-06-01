# pending_patches/ — collision-safe, NOT pushed to HF

**Why this exists:** the Killinchu Space (`SZLHOLDINGS/killinchu`) `serve.py` and
`killinchu_expansion.py` are owned by the in-flight build agent
`opus_killinchu_drone_flagship_build_mpus8anv`. To honor the HARD RULE *"collision risk → write
to pending_patches/, DO NOT push that one"*, the Killinchu-side bridge module is staged here and
was **NOT** pushed to the Space.

## File

- `killinchu_bridge.py` — adds `POST /api/killinchu/v1/integrity-stream` (binding b webhook,
  emits Sentra-compatible `szl.integrity.event/v1` + cross Khipu receipt + forwards to Sentra)
  and `POST /api/killinchu/v1/quarantine` (cyber isolation, NOT kinetic, own-fleet only,
  2-person Yuyay + Λ floor re-check). Validated: parses + registers both routes against a stub
  app.

## How the build agent applies it (one-line, additive)

Add the file to the Killinchu Space repo and, inside the existing `try/except` in `serve.py`
right after the `killinchu_expansion.register_expansion(...)` call, add:

```python
import killinchu_bridge
killinchu_bridge.register_killinchu_bridge(
    app, drones=_DRONES, emit_receipt=_emit_receipt,
    lambda_aggregate=_lambda_aggregate, lambda_floor=_LAMBDA_FLOOR,
    doctrine=DOCTRINE, json_body=_json_body,
    signature_placeholder=SIGNATURE_PLACEHOLDER,
    sentra_base="https://szlholdings-sentra.hf.space",
)
```

The injected dependencies (`_DRONES`, `_emit_receipt`, `_lambda_aggregate`, `_LAMBDA_FLOOR`,
`DOCTRINE`, `_json_body`, `SIGNATURE_PLACEHOLDER`) are the same ones already passed to
`register_expansion` — verified present in the live `serve.py`. No existing endpoint, receipt
schema, or Doctrine v11 LOCKED number is changed. ADDITIVE only.

## Bridge status while pending

The **Sentra side is LIVE and self-sufficient**: `/drone-cyber` and
`/api/sentra/v1/drone-cyber/*` pull the Killinchu fleet directly from the existing live Killinchu
endpoints (`/drones/database`, `/drones/{id}/twin`, `/drones/{id}/integrity`,
`/receipt/ledger`). The unified SOC pane is demoable **today** without this Killinchu patch.

What this patch *adds* once applied: Killinchu **push** of integrity events to Sentra (vs the
current Sentra **pull**), and a first-class `/v1/quarantine` defence-in-depth re-check endpoint.
Until then, Sentra's quarantine endpoint runs the full gate itself (own-fleet check via live
`/drones/database`, 2-person, cross-flagship Λ) and records the cyber-isolation receipt.

— Yachay, 2026-06-01. Collision-safe. NOT pushed. ADDITIVE when applied. v11 LOCKED preserved.
