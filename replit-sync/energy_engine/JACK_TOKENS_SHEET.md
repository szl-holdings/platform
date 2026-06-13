# JACK-IN TOKEN SHEET — free jacks vs founder-token jacks

**Doctrine:** the free/public feeds are open data the world is throwing away — legal to ingest and
make our own (idea/expression, fashion-thinking). Forge jacks straight in. The token feeds need a
key the founder registers; the key is set via env / secret store and is NEVER committed.

---

## TIER 1 — FREE, NO KEY → Forge jacks in NOW (wasted energy, no one using it)

| Jack | Endpoint | Status (probed 2026-06-13) |
|---|---|---|
| **aWATTar (DE wholesale)** | `https://api.awattar.de/v1/marketdata` | LIVE — **negative price right now (-1.11, -4.92 EUR/MWh)** = real stranded power |
| **aWATTar (AT wholesale)** | `https://api.awattar.at/v1/marketdata` | same shape, Austrian grid |
| **CAISO OASIS (US, California)** | `https://oasis.caiso.com/oasisapi/SingleZip?queryname=PRC_LMP&version=1` | HTTP 200 — public, no key |
| **Ollama sovereign GPU** | `http://100.125.77.31:11434/v1` (Tailscale) | LIVE — 4 models, sovereign=True (Forge confirmed) |

These are the harvest signals. No sign-up. Forge wires them this pass.

---

## TIER 2 — NEEDS A FREE TOKEN → founder registers, here are the links

### 1) WattTime (US grid carbon / marginal emissions — CAISO etc.)
- **Sign-up:** [WattTime non-commercial free access form](https://watttime.org/noncommercial-agreement/)
- **Or register via API (fastest):**
  ```
  curl -X POST "https://api2.watttime.org/v2/register" -H 'Content-Type: application/json' \
    -d '{"username":"<pick>","password":"<pick>","email":"stephenlutar2@gmail.com","org":"SZL Holdings"}'
  ```
  Then get the token: log in at `https://api.watttime.org/login` (basic auth user/pass) → returns `{"token": "..."}`.
- **What we get:** real marginal CO2 (MOER) per grid region → honest `carbon_moer` on receipts.
- **Probe result:** v3 returns 401 unkeyed (reachable, just needs the key).
- **You give me:** the `token` (or username+password) → I set `WATTTIME_TOKEN` in the secret store.

### 2) ENTSO-E Transparency Platform (all-Europe wholesale + generation — the big one)
- **Sign-up (2 steps, free):**
  1. Register at [transparency.entsoe.eu](https://transparency.entsoe.eu/) → "Sign in" → "Register" (password ≥14 chars, 1 special char). Confirm the email link.
  2. **Email `transparency@entsoe.eu`** with subject **"Restful API access"** and your registered email in the body. They reply ~1 working day; then a "Generate token" button appears under My Account Settings.
- **What we get:** day-ahead prices + actual generation for every EU bidding zone → richest negative-price/curtailment signal in the world.
- **You give me:** the generated **security token** → I set `ENTSOE_API_TOKEN`.

### 3) Electricity Maps (global carbon intensity + power breakdown, incl. % wind/solar/curtailable)
- **Sign-up:** [api-portal.electricitymaps.com](https://api-portal.electricitymaps.com) → free personal token (test token in the Playground first).
- **Endpoint:** `https://api.electricitymap.org/v3/power-breakdown/latest?zone=DE` with header `auth-token: <token>`.
- **What we get:** live renewable share per zone → "is this power green AND surplus" signal.
- **You give me:** the `auth-token` → I set `ELECTRICITYMAPS_TOKEN`.

---

## TIER 3 — OPTIONAL / paid-ish (skip unless you want them)
- **Tibber** (home real-time price+consumption, needs a Tibber account/home): token at `developer.tibber.com`.
- **EIA** (US gov energy data, free key, slower cadence): `eia.gov/opendata/register.php`.
- **GridStatus.io** (US ISOs unified, has a free tier): `gridstatus.io`.

---

## HOW THE HANDOFF WORKS (so no key ever touches git)
1. You register the Tier-2 ones above and paste me each token **in chat** (not in a file/PR).
2. I set them in the secret store as env vars (`WATTTIME_TOKEN`, `ENTSOE_API_TOKEN`, `ELECTRICITYMAPS_TOKEN`).
3. Forge's adapters read them from env at runtime; the receipt flips that feed SAMPLE→MEASURED.
4. Until a token is set, that feed stays honestly SAMPLE — no fake data, no carbon claim.

**Right now Forge can jack the Tier-1 free feeds (aWATTar negative-price + CAISO + the sovereign GPU)
without waiting on anything.** The Tier-2 tokens just widen coverage when you have them.
