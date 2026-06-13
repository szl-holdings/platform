# Energy-source signal feed (`energy_signal`)

Tells the SZL agentic-GPU scheduler **WHEN power is cheap / free / wasted**, so
heavy or proactive work (batch inference, model pulls, RAG re-index) runs in
those windows and idles when power is dear.

This is the **[Forge now]** scheduler-signal item from
`STRANDED_ENERGY_SOVEREIGN_COMPUTE.md`: *"a curtailment/negative-price signal
feed (grid API or a simple off-peak time window) that gates heavy/batch
inference + model pulls to cheap-power hours; log the energy window used."*

## Doctrine (honest by design)

- **NO free-energy / perpetual-motion claims.** We schedule against an honest
  signal of when *wasted* energy is available; we do not invent energy.
- **Every price / joule figure is SAMPLE/ESTIMATE and labelled** (`sample=True`,
  `estimate_label="SAMPLE/ESTIMATE"`). Nothing here is a meter reading.
- **A stranded source is claimed only when a real signal verifies it.** The
  off-peak provider claims only the clock fact `off-peak` (locally verifiable).
  The wholesale provider is a **stub** that returns `grid`/`normal`/`sample` and
  **never fabricates** a `curtailed-renewable` or `negative-price` claim until a
  real keyed feed is wired.
- **open-weight only; never commit a key.** API keys come from the env / secret
  store (e.g. `GRIDSTATUS_API_KEY`), never from source.

The half-state — claiming more cheap/free energy than is real — is the only
unacceptable outcome.

## What it returns — the power posture

```json
{
  "window": "cheap | normal | dear",
  "source": "grid | curtailed-renewable | negative-price | off-peak | solar | ambient",
  "price_signal": 0.04,
  "ts": "2026-06-13T05:46:44+00:00",
  "sample": true,
  "provider": "off_peak_time_window",
  "estimate_label": "SAMPLE/ESTIMATE"
}
```

`window` is the scheduling gate: run heavy work on `cheap`, throttle on `dear`.

## Providers

### (a) `OffPeakProvider` — REAL signal, zero deps, works NOW
Off-peak local hours **00:00–08:00** and **20:00–24:00** are flagged `cheap`
with source `off-peak`; all other hours are `normal`/`grid`. The **window is a
real, locally-verifiable clock fact**; the `price_signal` is an explicit SAMPLE
proxy. This provider deliberately does **not** assert curtailment or a negative
price — that needs a real wholesale feed.

### (b) `WholesaleStubProvider` — documented stub, honest SAMPLE until keyed
A placeholder for a real wholesale / negative-price API. Real candidates
(wire when a key exists; key via env, never committed):

| API | Coverage | Env var |
|-----|----------|---------|
| [GridStatus.io](https://www.gridstatus.io/api) | US ISOs (CAISO, ERCOT, MISO, PJM, SPP) real-time LMP / fuel mix; curtailment + negative price visible in LMP | `GRIDSTATUS_API_KEY` |
| [ENTSO-E Transparency](https://transparency.entsoe.eu/) | EU day-ahead prices incl. negative | `ENTSOE_API_TOKEN` |
| [CAISO OASIS](http://oasis.caiso.com/oasisapi/) | California LMP / curtailment (free) | — |
| Awattar / Tibber | EU consumer hourly/negative spot | provider key |

With no key (or no live fetch wired) the stub returns `grid`/`normal`/`sample`
and a note saying it is **not live** — it never upgrades the posture spuriously.

## Which real wasted-energy source maps to which window

Cited from `STRANDED_ENERGY_SOVEREIGN_COMPUTE.md`:

| Wasted-energy source | Maps to `source` | Typical `window` | How it's verified (real signal) |
|----------------------|------------------|------------------|----------------------------------|
| **Curtailed wind/solar** (30–40% of US renewables curtailed) [PCIM/Soluna] | `curtailed-renewable` | `cheap` | Behind-the-meter telemetry or ISO curtailment report (GridStatus/CAISO) |
| **Negative-price power** (wind oversupply, off-peak, spot < 0) [diva-portal; arxiv] | `negative-price` | `cheap` | Wholesale LMP < 0 from GridStatus/ENTSO-E |
| **Off-peak hours** (00–08, 20–24 — when oversupply drives prices down) | `off-peak` | `cheap` | **Local clock (this module, provider a)** |
| **Flared / stranded gas** (Crusoe, Canaan) [keepcool; cryptorank] | `grid`→on-site gen | `cheap` | On-site generation meter (future hardware) |
| **Micro-hydro / surplus hydro** (Greensparc/Cordova 170kW) [PCIM Alaska] | `solar`/site gen | `cheap` | Site generation surplus telemetry |
| **Biogas / landfill methane** (~$0.07/kWh, 24/7) [EcoEngineers] | site gen | `normal` | On-site meter |
| **Ambient / waste heat** (server exhaust → district heat) [EESI; WEF] | `ambient` | `normal` | Double-use; not a price signal |
| **Grid (default)** | `grid` | `normal`/`dear` | Honest fallback when nothing better verifies |

Today, only **off-peak** (provider a, clock-verifiable) and **grid** (honest
default) are emitted. The richer stranded sources light up as real feeds /
behind-the-meter telemetry are wired (Tier 1→3 in the spec).

## Provenance helper (for the energy-budget receipt — Dev B)

`energy_provenance(posture=..., joules_est=...)` returns the block to merge into
Dev B's receipt, coordinating the shape (`energy_source`, `joules_est` SAMPLE):

```json
{
  "energy_source": "off-peak",
  "window": "cheap",
  "price_signal": 0.04,
  "joules_est": null,
  "joules_est_label": "SAMPLE/ESTIMATE",
  "signal_provider": "off_peak_time_window",
  "ts": "2026-06-13T05:46:44+00:00",
  "honest_note": "..."
}
```

It merges alongside Dev B's `{bytes, shannon_bits, bekenstein_bound}` so each
proactive task's receipt records **both** the Bekenstein-bounded information
work and the energy window/source that powered it.

## Run it

```bash
python3 energy_signal.py
```

Prints the current posture + the receipt provenance block, then runs the
self-test (asserts off-peak logic, stub honesty, aggregator, provenance shape)
and prints `{"...","ok": true}`.

## Sources

PCIM 2026 (curtailment 30–40%, Alaska micro-hydro), Soluna+Siemens, WinDC, Rune
RELIC, IREN Childress, diva-portal (negative prices), arxiv curtailed-wind
storage, Crusoe/keepcool, Canaan/cryptorank, BTC+Aurora/morningstar,
Greensparc+Cordova, EcoEngineers (biogas), EESI/WEF/reimagineappalachia (waste
heat). See `energy_engine/shared/STRANDED_ENERGY_SOVEREIGN_COMPUTE.md`.
