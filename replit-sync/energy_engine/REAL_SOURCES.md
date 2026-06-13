# Real energy data sources — MEASURED joules + live grid price

Turns the `energy_signal` aggregator (#356, SAMPLE-only) into one that ingests
**REAL** sources, with an **honest SAMPLE fallback** whenever a source is absent
or a fetch fails. This closes the *"no real signals"* gap from
`energy_engine/DATA_SOURCES_WIRING.md` (TIER A + TIER B).

> **Doctrine floor (v11/v12):** a figure is `MEASURED` **only** when a real
> source feeds it; otherwise it is a clearly-labelled `SAMPLE/ESTIMATE`. Source
> claims must match the signal (no greenwashing). No key is committed (none of
> these sources needs one). open-weight. Λ = Conjecture 1. The half-state —
> claiming more real/cheap energy than was measured — is the only unacceptable
> outcome, and the aggregator refuses it by construction.

## The four new modules (all disjoint, additive to #356)

### 1. `nvml_provider.py` — the FIRST MEASURED number (TIER A, no key)
Reads the RTX 5000's **real instantaneous power draw** via:

```
nvidia-smi --query-gpu=power.draw,power.limit,temperature.gpu,utilization.gpu --format=csv,noheader,nounits
```

- `parse_nvidia_smi_csv(raw)` — **pure** parser, CSV row → `GpuPower`
  (`measured=True`). Multi-GPU output uses the first device line.
- `GpuPower.joules_for(task_seconds)` → **REAL joules = power_draw_W × seconds**
  — the first true number on a receipt.
- `read_gpu_power()` — shells out to `nvidia-smi`; **off-box** (binary absent,
  non-zero exit, timeout, unparseable) it degrades to a `measured=False`
  `SAMPLE/ESTIMATE` reading and **never raises**.

### 2. `awattar_provider.py` — live EUR/MWh spot price (TIER B, **no key**)
Public aWATTar DE/AT endpoint — **no registration, no key**:
`https://api.awattar.de/v1/marketdata`.

- `parse_awattar_marketdata(payload, pick="first"|"min")` — pure parser →
  `AwattarPrice` (`measured=True`). `marketprice` is EUR/MWh; `price_signal` is
  the EUR/kWh proxy.
- `classify_price`: `< 0` → `negative-price`/`cheap` (the grid pays you);
  `< 30 EUR/MWh` → `curtailed-renewable`/`cheap`; else `grid`/`normal`.
- `fetch_awattar()` — live HTTP (no key/header), honest SAMPLE fallback on any
  failure; **never** fabricates a negative-price claim from a failed fetch.

### 3. `caiso_provider.py` — 5-min nodal LMP (TIER B, public)
CAISO OASIS public endpoint (`PRC_INTVL_LMP`, no key). LMP **< ~$2/MWh** ⇒
curtailment likely (arXiv 2405.18526); **< 0** ⇒ negative-price.

- `parse_caiso_lmp_rows(rows, pick="min"|"first")` — pure parser over
  already-extracted `{node, lmp}` rows → `CaisoLmp` (`measured=True`). (The
  OASIS zip/CSV extraction is a thin client's job; this module owns the honest
  mapping, keeping the self-test offline.)
- `fetch_caiso(rows=…)` — parses provided rows to a MEASURED LMP; with no rows
  it probes reachability and returns an honest SAMPLE (no zip parser shipped
  here), **never** a fabricated curtailment claim.

### 4. `real_aggregator.py` — fuse it all into ONE honest posture
`fuse_posture(gpu, task_seconds, awattar=…, caiso=…, now=…)` →
`RealPowerPosture`:

```json
{
  "window": "cheap | normal | dear",
  "source": "off-peak | curtailed-renewable | negative-price | grid",
  "price_signal": -0.012,
  "joules_measured": 600.0,        // set iff NVML on-box; else null
  "joules_sample": null,           // set iff NVML off-box; else null
  "measured": true,                // iff BOTH price AND joules are real meters
  "measured_price": true,
  "measured_joules": true,
  "ts": "2026-06-13T…Z",
  "price_label": "MEASURED",
  "joules_label": "MEASURED",
  "estimate_label": "MEASURED"
}
```

**Fusion is honest by construction:**
- **Window/price** = most-favourable *trusted* window across aWATTar, CAISO, and
  the off-peak clock. A provider may push a `cheap`/`negative-price` window only
  if its window is **trusted** — a *measured* live price, **or** the verifiable
  off-peak clock fact (whose price stays a SAMPLE). A sampled price with an
  untrusted window is **clamped to `normal`** so it can never upgrade the posture.
- **Joules** come from NVML. Measured (on-box) → `joules_measured`; off-box →
  the same number lands in `joules_sample`. The two slots are mutually exclusive.
- **Overall `measured`** is `True` **iff** the chosen price window *and* the
  NVML joules are both real meters. A measured label is never put on a sampled
  figure.

`current_real_posture(task_seconds)` is the live wrapper (fetches NVML +
aWATTar, optionally CAISO) and never raises.

## Self-tests (each prints `{"ok": true}`)

```bash
python3 nvml_provider.py      # parses a sample CSV → watts → joules; off-box SAMPLE
python3 awattar_provider.py   # parses sample marketdata → price; negative-price path
python3 caiso_provider.py     # parses sample LMP rows → curtailed/negative
python3 real_aggregator.py    # fuses NVML + price + clock; honest labelling
```

All four are deterministic and offline (the pure parsers run against captured
sample payloads). `nvidia-smi`, aWATTar, and CAISO are **not** contacted by the
self-tests; the live `fetch_*`/`read_*` paths degrade honestly when run off-box.

## Keys

**None required** — NVML (on-box), aWATTar (public DE/AT), and CAISO OASIS
(public) all work without a key. Optional **URL overrides** (never keys) via env:
`AWATTAR_URL` (DE↔AT), `CAISO_OASIS_URL`. No secret is ever read or committed.

## Where it wires
- NVML joules → the energy-budget receipt (#328/#331) `joules` field — the first
  MEASURED number.
- aWATTar/CAISO posture → the scheduler / batch-sponge / energy-proportional
  admission (#357/#359/#360) cheap-window gate.
- Builds on `energy_signal.py` (#356): same posture vocabulary, additive — the
  off-peak clock provider is reused as the always-real window floor.
