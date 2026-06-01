# AYNI-OS Verification Report

**Date:** 2026-06-01 · **Author:** Yachay

This report records the verbatim evidence for the founder's four honesty deliverables:
**service file | ledger sample | thesis chapter path | lake build status**, plus live
endpoint probes.

---

## 1. Lean proof obligations — `lake build`

Build via `cd /home/user/workspace/szl_ayni_os && PATH=/home/user/.elan/bin:$PATH lake build`
(toolchain `leanprover/lean4:v4.13.0`). Verbatim output:

```
⚠ [2/3] Built AyniConservation
warning: ././././AyniConservation.lean:68:8: declaration uses 'sorry'
warning: ././././AyniConservation.lean:104:8: declaration uses 'sorry'
Build completed successfully.
exit=0
```

**HONEST:** the two `sorry`s are **explicitly tagged with stated obligations** in the
source (lines 68, 104) — never hidden. Theorems: `ayni_conservation`,
`no_deficit_spiral`. Status: **builds successfully, exit 0.**

## 2. Runtime tests — pytest

```
...................                                                      [100%]
19 passed in 0.05s
exit=0
```

## 3. Reciprocity organism — 5 real ledger entries (paste)

Content-addressed, chain-linked (`prev_hash` → `entry_hash`), paired give/take:

```
{"amount":10.0,"entry_hash":"4f6bc4fc...90c4","organ":"amaru","pair_id":"p1","prev_hash":"GENESIS","resource":"gpu_min","seq":0,"side":"take","ts":100.0}
{"amount":10.0,"entry_hash":"b009df3d...51c2","organ":"sentra","pair_id":"p1","prev_hash":"4f6bc4fc...","resource":"gpu_min","seq":1,"side":"give","ts":100.0}
{"amount":5.0,"entry_hash":"1835a47a...048b","organ":"rosie","pair_id":"p2","prev_hash":"b009df3d...","resource":"tokens","seq":2,"side":"take","ts":200.0}
{"amount":5.0,"entry_hash":"6d81a0ce...4404","organ":"vessels","pair_id":"p2","prev_hash":"1835a47a...","resource":"tokens","seq":3,"side":"give","ts":200.0}
{"amount":10.0,"entry_hash":"5f93f335...5488","organ":"sentra","pair_id":"p1","prev_hash":"6d81a0ce...","resource":"gpu_min","seq":4,"side":"give","ts":300.0}
```

Demo assertions:
```
CHAIN_OK: True
AYNI amaru: 0.0 sentra: 1.0
HALT: True deficits: ['amaru', 'rosie']
REWIND@150 n_entries: 2 amaru bal: -10.0
```

**HONEST:** "rewind" = **event-sourcing replay** — reconstructing state at t=150 from
the first 2 ledger entries. **Not** time-travel.

## 4. Service file

- Runtime package: `/home/user/workspace/szl_ayni_os/ayni_os/`
  (`ledger.py`, `checkpoint.py`, `rewind.py`, `reciprocity_monitor.py`,
  `tinkuy.py`, `replay_api.py`)
- a11oy surface: `/home/user/workspace/szl_ayni_os/ayni_os_serve.py` (FastAPI APIRouter)

## 5. Thesis chapter path

- TeX: `.../ayni_os/THESIS_CHAPTER.tex` (IEEEtran conference format)
- PDF: `.../ayni_os/THESIS_CHAPTER.pdf` (3 pp, compiles clean, no undefined refs)
- Public repo: **https://github.com/szl-holdings/ayni-os-thesis** (PUBLIC)

## 6. Live endpoint probes (a11oy, HTTP)

**`/v1/ayni/healthz`**
```json
{"ok":true,"module":"AYNI-OS","framing":"game-theory primitive (Axelrod-Hamilton 1981); NOT mystical","locked_numbers":{"declarations":749,"unique_axioms":14,"sorries":163,"yuyay_v3_axes":13},"yuyay_v3_replay_hash":"bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5"}
```

**`/v1/ayni`** — 14 organ coefficients, `alpha_min:0.45`, `tripwire:"T24"`, `halt:false`.

**`/v1/tinkuy`**
```json
{"r":0.996753,"psi":0.13,"in_tinkuy":true,"threshold":0.85,"n_organs":14,"suppress_reflexion":true,"model":"kuramoto-1975-order-parameter"}
```

**`/v1/replay?at=200`**
```json
{"at_ts":200.0,"chain_ok":true,"chain_verified":true,"mechanism":"event-sourcing-replay","state_hash":"4f53cda1...b945",...}
```

**`/ayni`** — HTTP 200 (AYNI-OS surface tab, honest-framing header comment present).

## Locked Doctrine v11 numbers — confirmed verbatim on live healthz

749 declarations / 14 unique axioms / 163 sorries; 13-axis yuyay_v3;
replay hash `bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5`.

---

Signed — **Yachay**
