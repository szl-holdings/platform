"""
SZL verified-compute marketplace agent (R-MONEY-NOW A).

Sell the RTX-class sovereign node's WASTED-WINDOW capacity on a consumer GPU
marketplace (Vast.ai / RunPod / io.net / Akash) for REAL, useful, attestable AI
work — NOT mining (proof-of-work waste is doctrine-forbidden). Every job that
runs ships a DSSE receipt + a kernel-checked Lean bound (Bekenstein #239,
Landauer #240): that proof is the +25% verified-compute premium over commodity
FLOPs, and it persists to the provenance chain (the containment loop).

HONEST by construction (Doctrine v11):
  * The agent NEVER fabricates a listing, a rental, or a settled dollar. A dollar
    is real only once a rental SETTLES; until then the projection is an ESTIMATE
    and settled_usd_to_date is exactly 0.0.
  * Listing requires a founder host account + payout method (KYC) and a venue API
    key. That step is FOUNDER-only. The key is read from the environment and is
    NEVER committed or logged. With no key present the agent returns
    `needs_founder_input` with the exact steps — it does not pretend to list.
  * Energy-gated: jobs are biased to cheap/negative grid-price windows (reuse the
    live aWATTar posture) so marginal power cost approaches zero. joules SAMPLE
    until on-GPU NVML. crypto = payment rail only, never speculate the box.
  * sovereign only on own metal; locked-8 untouched; Lambda = Conjecture 1.

Pure stdlib (lazy estimate import) so the workflow logic is unit-testable offline
and runs anywhere. The live ESTIMATE surface is served at
a11oy.net/api/a11oy/v1/revenue/marketplace by the revenue-estimate microservice
(this agent shares its estimate maths via apps/revenue-estimate/engine.py).
"""
from __future__ import annotations

import os
import time

# Venue env-var names. PRESENCE of a value is the only thing that unblocks
# listing; the value itself is a secret and is never read into any output.
VENUE_KEYS = {
    "vast": "VAST_API_KEY",
    "runpod": "RUNPOD_API_KEY",
    "ionet": "IONET_API_KEY",
    "akash": "AKASH_WALLET_FUNDED",
}

FOUNDER_STEPS = [
    "Create a host account on a candidate venue (Vast.ai is email-only to start).",
    "Set a payout method: Wise/PayPal/Stripe for USD, or BTC/IO/USDC for crypto.",
    "Paste the venue API key into the secret store under its env var "
    "(VAST_API_KEY / RUNPOD_API_KEY / IONET_API_KEY / AKASH_WALLET_FUNDED). "
    "NEVER commit it.",
]


def _have_credentials() -> dict:
    """Return which venues have a (non-empty) credential present in the env.

    Reads only presence/emptiness — never the secret value into output.
    """
    return {v: bool(os.environ.get(env, "").strip()) for v, env in VENUE_KEYS.items()}


def _projection() -> dict:
    """Honest monthly ESTIMATE, shared with the live /marketplace endpoint."""
    try:
        import engine  # apps/revenue-estimate/engine.py (same maths, single source)

        return engine.estimate_marketplace()
    except Exception:  # noqa: BLE001 - offline / agent-only path: degrade honestly
        return {
            "label": "ESTIMATE",
            "basis": "published-comparable",
            "note": "projection unavailable offline; see /api/a11oy/v1/revenue/marketplace",
        }


def list_and_earn() -> dict:
    """Plan the list-and-earn workflow. Refuses to fabricate when not credentialed."""
    have = _have_credentials()
    ready = [v for v, ok in have.items() if ok]
    result = {
        "ok": True,
        "agent": "compute_marketplace_agent",
        "mining": False,
        "verified_premium": "+25% via DSSE receipt + Lean bound (#239 Bekenstein, #240 Landauer)",
        "energy_gate": "accept/run jobs only in cheap/negative grid-price windows",
        "credentialed_venues": ready,
        "projection": _projection(),
        "settled_usd_to_date": 0.0,
        "doctrine": "v11: ESTIMATE not revenue (settle to count); NO mining/PoW; "
                    "crypto = payment rail only; joules SAMPLE; sovereign untouched; "
                    "locked-8 untouched; Lambda=Conjecture 1; no key committed.",
        "ts": time.time(),
    }
    if not ready:
        result["status"] = "needs_founder_input"
        result["founder_required"] = FOUNDER_STEPS
        result["message"] = (
            "No venue credential present. Listing is a founder step (account + "
            "payout/KYC + API key). The agent will NOT fabricate a listing or a "
            "settled dollar; the honest projection above is an ESTIMATE only."
        )
    else:
        # A credential is present, but a real listing/settlement still requires the
        # live venue API call + an actual cleared rental. We never assert revenue
        # before settlement, so this remains a planned (not booked) state.
        result["status"] = "ready_to_list"
        result["next_action"] = (
            "Install the one-line host agent on the RTX node and register on: "
            + ", ".join(ready)
            + ". Count a dollar ONLY when a rental settles."
        )
    return result


if __name__ == "__main__":
    import json

    print(json.dumps(list_and_earn(), indent=2))
