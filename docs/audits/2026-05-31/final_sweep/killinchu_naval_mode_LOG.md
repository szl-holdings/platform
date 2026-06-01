# Killinchu Maritime / Naval Mode — HF Push Log

**Agent:** Yachay (Final Sweep) · **Date:** 2026-06-01 · **Doctrine:** v11 (LOCKED 749/14/163/13-axis preserved) · **Method:** HfApi direct `create_commit` (NO GitHub Actions). **ADDITIVE only.**

Closes **Yachay-Dome `WHAT_FOUNDER_IS_MISSING.md` Gap #4 (maritime adjacency)** — uncrewed surface/undersea vessels (USVs/UUVs) are now a primary threat (Houthi Red Sea, Ukraine Black Sea). The same detect → classify → cue pipeline applies to drone boats threatening ports / LNG / cargo; sells to USCG and port authorities.

## What shipped (same module as HAPS: `killinchu_naval_haps.py`)
New endpoints:
- **`GET /api/killinchu/v1/naval-mode`** → maritime drone catalog (6) + AIS integration + cued-engagement pipeline.
- **`POST /api/killinchu/v1/naval-mode/cue`** → surface-track Body-of-Evidence cue (Khipu-receipted, passive); flags `dark_contact` when AIS absent.

### Maritime drone catalog (USVs / UUVs)
| id | platform | side | kinematics | source |
|---|---|---|---|---|
| `saronic_spyglass` | Saronic Spyglass (6') | allied | 35+ kn | [Saronic](https://www.saronic.com/vessels) · [Defense Post](https://thedefensepost.com/2024/10/24/saronic-unmanned-vessel-pentagons/) |
| `saronic_corsair` | Saronic Corsair (24') | allied | 35 kn, 1,000 nm, 1,000 lb | [Naval News](https://www.navalnews.com/naval-news/2025/04/saronic-unveils-two-new-autonomous-surface-vessels-mirage-and-cipher/) |
| `anduril_dive_ld` | Anduril Dive-LD (UUV) | allied | depth 6,000 m, 10-day submerged | [World Defense Show](https://www.worlddefenseshow.com/en/media/news/45) · [Navy Leaders](https://navyleaders.com/news/anduril-selected-to-field-next-generation-autonomous-submarines-for-u-s-navy/) |
| `houthi_toofan` | Houthi Toofan-class USV | adversary | Red Sea attack profile | [Covert Shores](https://www.hisutton.com/Ukrainian-USVs-Russo-Ukraine-War.html) |
| `ukraine_magura_v5` | Magura V5 | adversary-capability model | 42 kn dash, 450 nm, 320 kg payload, 60 h | [Wikipedia](https://en.wikipedia.org/wiki/MAGURA_V5) · [Covert Shores](https://www.hisutton.com/Ukrainian-USVs-Russo-Ukraine-War.html) |
| `ukraine_sea_baby` | Sea Baby | adversary-capability model | 6 m, large payload (SBU) | [Covert Shores](https://www.hisutton.com/Ukrainian-USVs-Russo-Ukraine-War.html) |

### AIS integration (cooperative maritime identity)
Standard **ITU-R M.1371 AIS**, cooperative provider **Spire Global (satellite AIS)** ([Spire Maritime](https://spire.com/maritime/)). A dark contact (no AIS, or AIS inconsistent with radar/RF) raises threat color — the maritime analogue of a Remote-ID-OFF "dark drone." **Honesty:** AIS is an unauthenticated broadcast — a decoded MMSI/position is a claim, not attested truth (same posture as ADS-B/Remote-ID).

### Cued-engagement (legal posture preserved)
detect → classify (four-color) → predict-impact (surface-track haversine kinematics) → Khipu-receipted cue → **authorized customer (USCG / port authority / .mil) acts.** **WE SENSE, WE EVIDENCE** — Killinchu delivers the signed cue, never the kinetic act.

## Commits (HF SHAs)
| SHA | Change |
|---|---|
| `2228803cabcd7db0a354036b2232c2386476cfd8` | Add naval-mode + cue + HAPS (module + serve.py) |
| `d0da31527695a9507b1eac56866605ce99fc5a69` | fix: Dockerfile COPY module (see HAPS log root-cause) |

## Live verification (Space HEAD `d0da3152`)
- `GET /api/killinchu/v1/naval-mode` → **200** (catalog=6, AIS=Spire Global)
- `POST /api/killinchu/v1/naval-mode/cue` → **200** (Khipu receipt `kind=naval_cue`, `dark_contact=true` when AIS absent)
- Local TestClient pre-push: ALL_GREEN (naval catalog=6, cue receipted, existing routes preserved).

*Signed: Yachay — Final Sweep. ADDITIVE, Doctrine v11 LOCKED preserved. Perplexity Computer Agent in git trailers.*
