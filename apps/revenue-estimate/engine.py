"""
SZL Verified Sovereign Compute — Revenue ESTIMATE engine (R-REVENUE).

Doctrine v11. HONEST by construction:
  * Every dollar/euro/credit figure is an ESTIMATE, never booked revenue and
    never a promise. Each carries its `basis` (live | published-comparable),
    its `inputs`, its stated `assumptions`, and a `source` citation.
  * The ONLY live-input stream is energy arbitrage (it reads the live wholesale
    grid price from the already-deployed harvest service). Everything else is a
    published market comparable, scaled by clearly-stated assumptions.
  * Two scales are shown per stream: `market_reference` (the documented
    opportunity, e.g. per 100 MW node) and `our_current_node` (the same maths
    scaled to SZL's REAL present asset — a single sub-kW sovereign GPU). The gap
    between them is the honest truth: the money is the hardware play (founder
    capital), the moat is proven governance (software, ours today).
  * No free-energy: arbitrage values ALREADY-WASTED energy (negative price),
    bounded by Landauer (#240) / Bekenstein (#239). joules stay SAMPLE until an
    on-box NVML meter. sovereign untouched. locked-8 untouched. Lambda=Conj1.

Pure-stdlib so the maths is unit-testable offline.
"""
from __future__ import annotations

import json
import time
import urllib.request

# --- SZL real present asset (honest) -----------------------------------------
# One RTX-class sovereign GPU node reachable as Ollama over Tailscale.
OUR_NODE_KW = 0.30          # ~300 W draw of a single workstation GPU node
HOURS_PER_YEAR = 8760
HOURS_PER_MONTH = 730

# --- Stated assumptions (all configurable, all disclosed) --------------------
ASSUMPTIONS = {
    "our_node_kw": OUR_NODE_KW,
    "market_reference_node_mw": 100.0,   # the documented Crusoe-scale node
    "demand_response_capacity_usd_per_mw_per_yr": 5.0 * HOURS_PER_YEAR,  # ~$5/MWh availability
    "verified_compute_premium_fraction": 0.30,   # premium of proven over commodity FLOPs
    "commodity_gpu_usd_per_gpu_hour": 1.20,      # published cloud spot reference
    "flare_credit_usd_per_tonne_co2e": 8.0,      # voluntary VM0049 reference price
    "flare_tco2e_per_mw_node_per_yr": 9000.0,    # documented avoided-flare per 100MW-class site (order-of-magnitude)
}

# --- Cited market comparables (documented, NOT our numbers) -------------------
COMPARABLES = {
    "crusoe_valuation_usd": "~$3B (stranded-energy -> compute; 250+ wellhead data centers)",
    "global_flared_gas_value_usd_per_yr": "~$16B/yr (World Bank GGFR)",
    "node_100mw_demand_response_usd_per_yr": "$8-15M/yr (capacity + arbitrage)",
    "capacity_payment_usd_per_mwh": "~$5/MWh (pay-for-availability)",
    "carbon_methodology": "Verra VM0049 (flare-gas reduction credits)",
}

DISCLAIMER = (
    "Every figure is an ESTIMATE derived from live or published inputs. It is "
    "NOT booked revenue, NOT a forecast, and NOT a promise. Realising it needs "
    "founder hardware at a stranded-energy site AND a paying customer. SZL's "
    "defensible margin is VERIFIED SOVEREIGN COMPUTE (kernel-checked + DSSE-"
    "signed governance), not cheap watts."
)


def fetch_posture(url: str, timeout: float = 6.0) -> dict:
    """Read the live grid price from the deployed harvest service. Honest on failure."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "szl-revenue-estimate"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            if r.status != 200:
                return {"status": "unreachable", "http": r.status}
            data = json.loads(r.read().decode("utf-8"))
            data["status"] = data.get("status", "live")
            return data
    except Exception as exc:  # noqa: BLE001 - honest degraded path
        return {"status": "unreachable", "error": str(exc.__class__.__name__)}


def _round(x: float, n: int = 2) -> float:
    return round(float(x), n)


def estimate_arbitrage(price_eur_mwh, our_node_kw=OUR_NODE_KW):
    """LIVE-input stream: value of soaking already-wasted energy at the live price.

    When the wholesale price is NEGATIVE the grid PAYS to offload; running real
    compute then turns that paid-to-consume energy into useful work. Value is the
    avoided/negative energy cost over the node's draw, NOT captured cash.
    """
    if price_eur_mwh is None:
        return None
    node_mwh_per_h = our_node_kw / 1000.0
    ref_mwh_per_h = ASSUMPTIONS["market_reference_node_mw"]
    # only a negative price yields a positive "paid-to-soak" value; clamp at 0 otherwise
    paid = max(0.0, -float(price_eur_mwh))
    return {
        "stream": "energy_arbitrage",
        "label": "ESTIMATE",
        "basis": "live",
        "currency": "EUR",
        "inputs": {"grid_price_eur_mwh": price_eur_mwh},
        "assumptions": {"our_node_kw": our_node_kw, "market_reference_node_mw": ref_mwh_per_h},
        "our_current_node": {"value_eur_per_h": _round(paid * node_mwh_per_h, 6), "unit": "EUR/hour"},
        "market_reference": {"value_eur_per_h": _round(paid * ref_mwh_per_h, 2),
                             "unit": "EUR/hour @ 100MW"},
        "note": ("Positive only while price is negative (grid paying to offload). "
                 "This is the value of ALREADY-WASTED energy turned into useful work, "
                 "not booked cash. joules SAMPLE until on-box NVML."),
        "source": COMPARABLES["capacity_payment_usd_per_mwh"],
    }


def estimate_demand_response():
    """Published-comparable: capacity payment for being available as flexible load."""
    cap = ASSUMPTIONS["demand_response_capacity_usd_per_mw_per_yr"]
    our_mw = OUR_NODE_KW / 1000.0
    ref_mw = ASSUMPTIONS["market_reference_node_mw"]
    return {
        "stream": "demand_response_floor",
        "label": "ESTIMATE",
        "basis": "published-comparable",
        "currency": "USD",
        "assumptions": {"capacity_usd_per_mw_per_yr": cap, "our_node_mw": our_mw,
                        "market_reference_node_mw": ref_mw},
        "our_current_node": {"value_usd_per_yr": _round(cap * our_mw),
                             "unit": "USD/yr",
                             "note": "sub-kW node is far below DR market minimums (MW-scale)"},
        "market_reference": {"value_usd_per_yr": _round(cap * ref_mw), "unit": "USD/yr @ 100MW"},
        "source": COMPARABLES["node_100mw_demand_response_usd_per_yr"],
    }


def estimate_flare_carbon():
    """Published-comparable: Verra VM0049 flare-reduction credits for a wellhead node."""
    price = ASSUMPTIONS["flare_credit_usd_per_tonne_co2e"]
    tco2e_per_mw = ASSUMPTIONS["flare_tco2e_per_mw_node_per_yr"]
    our_mw = OUR_NODE_KW / 1000.0
    ref_mw = ASSUMPTIONS["market_reference_node_mw"]
    return {
        "stream": "flare_carbon_credit",
        "label": "ESTIMATE",
        "basis": "published-comparable",
        "currency": "USD",
        "assumptions": {"usd_per_tonne_co2e": price, "tco2e_per_mw_node_per_yr": tco2e_per_mw,
                        "our_node_mw": our_mw},
        "our_current_node": {"value_usd_per_yr": _round(price * tco2e_per_mw * our_mw),
                             "unit": "USD/yr",
                             "note": "requires a real flaring wellhead + VIIRS-measured volume; "
                                     "software-only node flares nothing"},
        "market_reference": {"value_usd_per_yr": _round(price * tco2e_per_mw * ref_mw),
                             "unit": "USD/yr @ 100MW wellhead"},
        "source": COMPARABLES["carbon_methodology"],
    }


def estimate_verified_compute_premium():
    """Published-comparable: the margin proven governance can add over commodity FLOPs."""
    base = ASSUMPTIONS["commodity_gpu_usd_per_gpu_hour"]
    frac = ASSUMPTIONS["verified_compute_premium_fraction"]
    premium_per_h = base * frac
    return {
        "stream": "verified_compute_premium",
        "label": "ESTIMATE",
        "basis": "published-comparable",
        "currency": "USD",
        "assumptions": {"commodity_gpu_usd_per_gpu_hour": base, "premium_fraction": frac},
        "our_current_node": {"value_usd_per_gpu_hour": _round(premium_per_h),
                             "unit": "USD/GPU-hour premium",
                             "annualised_usd_per_yr": _round(premium_per_h * HOURS_PER_YEAR)},
        "note": ("THE moat: each joule + each AI decision carries a kernel-checked "
                 "(Bekenstein #239, Landauer #240) DSSE-signed receipt. This premium is "
                 "what nobody selling raw FLOPs can claim."),
        "source": "SZL differentiator (proven governance); base rate = published cloud spot",
    }


# --- GPU marketplace (R-MONEY-NOW A) ----------------------------------------
# Published consumer-tier GPU-rental rates. We sell the RTX-class node's
# wasted-window capacity for REAL useful AI work (NOT mining). A dollar is only
# real once a rental SETTLES; until the founder creates the host account + payout
# this is an ESTIMATE and settled_usd_to_date is exactly 0.0.
MARKETPLACE = {
    "price_low_usd_per_gpu_hr": 0.20,    # published consumer-tier floor
    "price_high_usd_per_gpu_hr": 0.45,   # published consumer-tier ceiling
    "uptime_fraction": 0.70,             # realistic energy-gated availability
    "marketplace_fee_fraction": 0.15,    # platform take (~15%) -> net 0.85
    "verified_premium_fraction": 0.25,   # +25% for DSSE + Lean-bounded proof
    "candidate_venues": [
        {"name": "Vast.ai", "start": "email-only", "payout": "Wise/PayPal/Stripe or crypto",
         "note": "fastest consumer-tier start; one-line Linux host agent"},
        {"name": "RunPod", "start": "account", "payout": "USD/crypto",
         "note": "community-cloud GPU listing"},
        {"name": "io.net", "start": "account", "payout": "IO (crypto rail only)",
         "note": "decentralized; crypto = payment rail, never speculate the box"},
        {"name": "Akash", "start": "fund provider wallet ~5+ AKT", "payout": "USDC",
         "note": "ride existing k3s; provider-services + nvidia device plugin"},
    ],
}


def estimate_marketplace():
    """Published-comparable: monthly revenue from renting the node's wasted-window
    capacity on a consumer GPU marketplace, with the +25% verified-compute premium.

    HONEST: nothing is listed yet (no founder account/payout) so settled = $0.0.
    Energy-gated: the estimate assumes jobs run in cheap/negative-price windows so
    marginal power cost approaches zero. NOT mining — proven, attestable compute.
    """
    m = MARKETPLACE
    net = 1.0 - m["marketplace_fee_fraction"]
    hrs = HOURS_PER_MONTH * m["uptime_fraction"]
    base_low = m["price_low_usd_per_gpu_hr"] * hrs * net
    base_high = m["price_high_usd_per_gpu_hr"] * hrs * net
    prem = 1.0 + m["verified_premium_fraction"]
    return {
        "stream": "gpu_marketplace_rental",
        "label": "ESTIMATE",
        "basis": "published-comparable",
        "currency": "USD",
        "assumptions": {
            "price_usd_per_gpu_hr": [m["price_low_usd_per_gpu_hr"], m["price_high_usd_per_gpu_hr"]],
            "uptime_fraction": m["uptime_fraction"],
            "marketplace_fee_fraction": m["marketplace_fee_fraction"],
            "verified_premium_fraction": m["verified_premium_fraction"],
            "hours_per_month": HOURS_PER_MONTH,
        },
        "our_current_node": {
            "commodity_usd_per_mo": [_round(base_low), _round(base_high)],
            "with_verified_premium_usd_per_mo": [_round(base_low * prem), _round(base_high * prem)],
            "unit": "USD/month per RTX-class card",
            "settled_usd_to_date": 0.0,
            "status": "not_listed",
        },
        "energy_gate": ("count value only in cheap/negative-price windows (reuse live "
                        "harvest posture); marginal power cost -> ~0 then."),
        "verified_premium_basis": ("+25% over commodity FLOPs because every job ships a "
                                   "DSSE receipt + kernel-checked Lean bound (Bekenstein "
                                   "#239, Landauer #240) -> provenance chain. NOT mining."),
        "founder_required": [
            "create a host account on a candidate venue (Vast.ai is email-only to start)",
            "set a payout method (Wise/PayPal/Stripe for USD, or BTC/IO/USDC for crypto)",
            "paste the venue API key to the secret store (NEVER commit it)",
        ],
        "candidate_venues": m["candidate_venues"],
        "note": ("A dollar is real only when a rental SETTLES; until listed this stays "
                 "ESTIMATE with settled_usd_to_date = 0.0. Crypto = payment rail only."),
        "source": "published consumer GPU-marketplace rates (Vast.ai/RunPod/io.net/Akash)",
    }


def build_marketplace(posture: dict) -> dict:
    price = posture.get("price_now_eur_mwh") if isinstance(posture, dict) else None
    return {
        "ok": True,
        "product": "Verified Sovereign Compute — GPU marketplace",
        "posture": {
            "status": posture.get("status") if isinstance(posture, dict) else "unknown",
            "grid_price_eur_mwh": price,
            "wasted_energy_available": posture.get("wasted_energy_available") if isinstance(posture, dict) else None,
            "energy_gated": True,
        },
        "estimate": estimate_marketplace(),
        "disclaimer": DISCLAIMER,
        "doctrine": "v11: ESTIMATE not revenue (settle to count); NO mining/PoW; "
                    "crypto = payment rail only; joules SAMPLE; sovereign untouched; "
                    "locked-8 untouched; Lambda=Conjecture 1; no key committed.",
        "ts": time.time(),
    }


def build_estimates(posture: dict) -> dict:
    price = posture.get("price_now_eur_mwh") if isinstance(posture, dict) else None
    streams = [
        estimate_arbitrage(price),
        estimate_demand_response(),
        estimate_flare_carbon(),
        estimate_verified_compute_premium(),
    ]
    streams = [s for s in streams if s is not None]
    return {
        "ok": True,
        "product": "Verified Sovereign Compute",
        "posture": {
            "status": posture.get("status") if isinstance(posture, dict) else "unknown",
            "grid_price_eur_mwh": price,
            "wasted_energy_available": posture.get("wasted_energy_available") if isinstance(posture, dict) else None,
            "joules_label": posture.get("joules_label", "sample") if isinstance(posture, dict) else "sample",
            "sovereign": posture.get("sovereign", False) if isinstance(posture, dict) else False,
        },
        "streams": streams,
        "disclaimer": DISCLAIMER,
        "doctrine": "v11: no free-energy; figures are ESTIMATES not promises; "
                    "joules SAMPLE; sovereign untouched; locked-8 untouched; Lambda=Conjecture 1.",
        "ts": time.time(),
    }


def build_thesis() -> dict:
    return {
        "ok": True,
        "question": "Is stranded-energy -> compute groundbreaking, and how does SZL make money?",
        "honest_answer": (
            "The stranded-energy->compute idea is NOT novel — Crusoe Energy already "
            "proved it at ~$3B. Cheap FLOPs alone will not make us rich; the capital "
            "play is HARDWARE at the energy source (founder step). What IS ours and "
            "defensible is PROVEN GOVERNANCE: Verified Sovereign Compute where every "
            "joule and every AI decision carries a kernel-checked, DSSE-signed receipt "
            "— green/carbon-eligible, auditable, defense-grade. That is the premium "
            "nobody selling raw compute can claim."
        ),
        "market_comparables": COMPARABLES,
        "recommendation_priority": [
            "1. Sell the PROOF not the watts — 'Verified Sovereign Compute' product.",
            "2. Demand-response = cash floor: register sovereign nodes as flexible load (~$5/MWh availability).",
            "3. Flare carbon credits (Verra VM0049) off real VIIRS flared-gas volumes.",
            "4. Land ONE wellhead / curtailed-wind pilot node (founder + capital).",
        ],
        "what_agent_can_do": "Build + operate + PROVE the software that runs and governs the node.",
        "what_needs_founder": "Hardware at a stranded-energy site + a paying customer.",
        "disclaimer": DISCLAIMER,
        "doctrine": "v11: market context, never a promise. locked-8 untouched; Lambda=Conjecture 1.",
        "ts": time.time(),
    }
