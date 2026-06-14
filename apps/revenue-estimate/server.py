"""
SZL Verified Sovereign Compute — Revenue ESTIMATE API (standalone microservice).

Additive deploy (doctrine v11): a separate FastAPI service behind nginx at
/api/a11oy/v1/revenue/ . Does NOT touch the locked serve.py. No key. CORS * so
the public site / auditors can read the honest estimates.

Endpoints:
  GET /healthz   -> liveness + which harvest source it reads
  GET /estimate  -> 4 honest revenue ESTIMATE streams (arbitrage uses LIVE price)
  GET /thesis    -> market comparables + the SZL differentiator (context, not a promise)
  GET /          -> human landing page
"""
from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse

import engine

# the already-deployed harvest service (live wholesale grid price)
HARVEST_URL = os.environ.get(
    "REVENUE_HARVEST_URL", "http://127.0.0.1:8082/posture"
)

app = FastAPI(title="SZL Verified Sovereign Compute — Revenue Estimate", version="1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/healthz")
def healthz():
    return {
        "ok": True,
        "service": "szl-revenue-estimate",
        "harvest_source": HARVEST_URL,
        "doctrine": "v11: figures are ESTIMATES not promises; joules SAMPLE; "
                    "sovereign untouched; locked-8 untouched; Lambda=Conjecture 1.",
    }


@app.get("/estimate")
def estimate():
    posture = engine.fetch_posture(HARVEST_URL)
    return JSONResponse(engine.build_estimates(posture))


@app.get("/marketplace")
def marketplace():
    posture = engine.fetch_posture(HARVEST_URL)
    return JSONResponse(engine.build_marketplace(posture))


@app.get("/thesis")
def thesis():
    return JSONResponse(engine.build_thesis())


@app.get("/", response_class=HTMLResponse)
def landing():
    return HTMLResponse(_LANDING)


_LANDING = """<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SZL — Verified Sovereign Compute · Revenue Estimate</title>
<style>
:root{color-scheme:dark}
body{margin:0;font:15px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;
background:#0a0e12;color:#cfe;padding:2rem;max-width:860px;margin:0 auto}
h1{font-size:1.4rem;color:#7ef9c0;margin:0 0 .2rem}
.sub{color:#7a8;margin:0 0 1.4rem}
a{color:#7ef9c0}
.card{border:1px solid #1c2a33;border-radius:10px;padding:1rem 1.2rem;margin:.8rem 0;background:#0d141a}
.lab{display:inline-block;font-size:.7rem;border:1px solid #2a4;border-radius:4px;
padding:1px 6px;color:#7ef9c0;margin-left:.4rem}
.warn{color:#ffd479}
code{background:#111b22;padding:1px 5px;border-radius:4px;color:#9fe}
</style></head><body>
<h1>Verified Sovereign Compute — Revenue Estimate <span class="lab">ESTIMATE</span></h1>
<p class="sub">Honest revenue estimates from live + published inputs. Not booked revenue. Not a promise.</p>
<div class="card">
<p>The energy-arbitrage stream reads the <b>live</b> wholesale grid price from the
deployed harvest feed. Demand-response, flare-carbon and verified-compute-premium
are <b>published market comparables</b>, scaled by clearly-stated assumptions.</p>
<p class="warn">Realising any of this needs founder hardware at a stranded-energy
site <b>and</b> a paying customer. SZL's defensible margin is proven governance, not cheap watts.</p>
</div>
<div class="card">
<p><b>API</b></p>
<p>· <a href="estimate">/estimate</a> — 4 honest revenue ESTIMATE streams (JSON)</p>
<p>· <a href="marketplace">/marketplace</a> — GPU-rental ESTIMATE (settle to count; not mining) (JSON)</p>
<p>· <a href="thesis">/thesis</a> — market comparables + SZL differentiator (JSON)</p>
<p>· <a href="healthz">/healthz</a> — liveness (JSON)</p>
</div>
<p class="sub">Doctrine v11 · joules SAMPLE · sovereign untouched · locked-8 untouched · Λ = Conjecture 1 · no key.</p>
</body></html>"""
