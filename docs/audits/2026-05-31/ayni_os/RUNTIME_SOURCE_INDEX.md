# AYNI-OS Runtime — Source Index

**Author:** Yachay (CTO) · **Date:** 2026-06-01
**Root:** `/home/user/workspace/szl_ayni_os/`
**Deps:** Python stdlib only (optional `cryptography` for EC signing, `fastapi` for the
HTTP app; both have honest stdlib fallbacks). All open-source.

## Modules

| file | purpose | honest scope |
|------|---------|--------------|
| `ayni_os/__init__.py` | package + Doctrine v11 LOCKED constants + AYNI additive constants | constants only |
| `ayni_os/ledger.py` | **reciprocity organism**: append-only double-entry give/take KIPU receipt ledger; `alpha_o` coefficient; chain verification | real paired ledger; no mysticism |
| `ayni_os/checkpoint.py` | periodic KIPU snapshot **every 7 minutes**, **DSSE**-signed (EC key, HMAC fallback) | signed snapshotting |
| `ayni_os/rewind.py` | reconstruct state at target timestamp T by **event-sourcing replay** (optionally from nearest checkpoint) | replay, NOT time-travel |
| `ayni_os/reciprocity_monitor.py` | per-organ `alpha_o`; fires **HUKLLA T24** if any organ drains; `yuyay_v4` axis-14 hash + v3 non-disturbance | ratio + threshold alarm |
| `ayni_os/tinkuy.py` | **Kuramoto** order parameter `r` across organ phases; Tinkuy flow at `r>0.85`; suppress Reflexion in flow | coupled-oscillator sync |
| `ayni_os/replay_api.py` | HTTP API: `/v1/ayni`, `/v1/replay?at=<ts>`, `/v1/tinkuy` (FastAPI + stdlib dispatcher) | additive endpoints |
| `tests/test_ayni_os.py` | pytest: rewind, checkpoint cadence + sign/verify, **reciprocity-violation halt**, Tinkuy, yuyay_v3 non-disturbance | 19 tests, all pass |
| `AyniConservation.lean` | Lean stubs `ayni_conservation`, `no_deficit_spiral` (sorry-tagged) | builds; honest obligations |
| `demo_ledger.py` | emits real ledger entries (see `ledger_sample.txt`) | demo |

## Key invariants enforced

- **Double-entry / Ayni conservation:** every internal exchange is a (take, give) pair
  netting to zero across the empire (`record_exchange`).
- **Event-sourcing rewind:** `reconstruct_at(led, T)` is deterministic
  (`verify_rewind_determinism`), content-addressed via sha256 state hash.
- **7-minute checkpoint cadence:** `CHECKPOINT_INTERVAL_SECONDS == 420`.
- **HUKLLA T24 halt:** `enforce()` raises `ReciprocityViolation` when any
  `alpha_o < 0.45`.
- **yuyay_v3 untouched:** axis-14 (`alpha_o`) lives in a separate v4 vector/hash;
  dropping it reproduces the v3 hash byte-for-byte.

## Test result (verbatim)

```
19 passed in 0.05s
exit=0
```

## Doctrine v11 LOCKED numbers (preserved)

749 declarations / 14 unique axioms / 163 sorries; 13-axis yuyay_v3; replay hash
`bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5`. ADDITIVE only.

— Signed, **Yachay**
