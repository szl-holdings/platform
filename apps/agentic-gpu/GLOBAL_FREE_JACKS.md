# GLOBAL FREE WASTED-ENERGY JACKS — no token, no account, no key

All probed live 2026-06-13, all responded. Open data, legal to ingest (idea/expression). These tell
us WHEN and WHERE power is wasted so our own hardware runs at the cheapest/greenest moment.

## Tier-1 — already wired into wasted_energy_harvest.py
| Feed | Endpoint | Signal | Probe |
|---|---|---|---|
| aWATTar DE/AT | `api.awattar.de\|at/v1/marketdata` | wholesale price; negative = wasted | LIVE, −45.87 EUR/MWh |
| CAISO OASIS | `oasis.caiso.com/oasisapi/SingleZip?queryname=PRC_LMP&version=1` | US California LMP | 200 |
| Energy-Charts (Fraunhofer) | `api.energy-charts.info/ren_share?country=de` | renewable share of load | LIVE, up to 107% |
| UK Carbon Intensity | `api.carbonintensity.org.uk/intensity` | clean-surplus index | LIVE, "low" |

## Tier-2 — NEW (found this pass, ready to add — all free/no-key)
| Feed | Endpoint | What it adds | Probe |
|---|---|---|---|
| **Energinet / Energi Data Service (DK)** | `api.energidataservice.dk/dataset/Elspotprices` | spot price for **DE, DK1, DK2** + `Production` by source + `CO2Emis` (5-min realtime) — fully public, no auth | 200, multi-zone |
| **Energinet CO2Emis** | `api.energidataservice.dk/dataset/CO2Emis` | real-time grid carbon (no WattTime token needed for DK/DE) | 200 |
| **Energy-Charts grid frequency** | `api.energy-charts.info/frequency?country=de` | grid Hz — <50.00 = oversupply being dumped (the purest wasted-energy tell) | 200 |
| **Elecz** | `elecz.com/api/spot?zone=DE` | 40+ countries / 100+ zones, MCP-native, `is_negative`/`cheapest_hours` flags | 200 |
| **Open-Meteo** | `api.open-meteo.com/v1/forecast?...&hourly=wind_speed_100m,shortwave_radiation` | FORECAST of future wind/solar surplus → pre-schedule the next soak | 200 |
| **OpenEI (US DOE)** | `developer.nrel.gov/.../openei` utility-rate map | where US rates are lowest (HTTP-only) | listed |

## Tier-3 — free but need a token (founder-gated; NOT now)
ENTSO-E (all-EU), WattTime (US carbon), Electricity Maps (global). See JACK_TOKENS_SHEET.md.

---

## HONEST ANSWER — "is this enough energy?"
**No — and that is the honest truth, but it is the RIGHT design.** The feeds do NOT give us megawatts
or "10 supercomputers." They give us a real, live SIGNAL of when marginal grid power is genuinely
wasted (negative price / oversupply). Concretely: if our RTX 5000 (~230 W SAMPLE) runs flat-out
through today's 10-hour negative-price window, it soaks ~2.3 kWh of power the grid is *paying* to get
rid of. Real, green, near-zero-marginal-cost — but it is ONE GPU's worth, not a data center.

**The scarce resource is the GPU, not the watts.** To reach the founder's scale vision, the lever is
NOT more feeds — it is **more NODES**: a consent-only swarm (BOINC/Folding@home model) of owned/donated
GPUs, each following its OWN local wasted-energy window via these same free feeds. The feeds answer
WHEN/WHERE; the swarm answers HOW-MUCH. That is the honest path from "one sovereign GPU on free wasted
power" to "many nodes harvesting wasted power worldwide" — no over-unity, no greenwash, no fantasy.

Doctrine: no free-energy; joules SAMPLE until on-box NVML; consent-only swarm; open data only; no key.
