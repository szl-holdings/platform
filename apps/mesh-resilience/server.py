"""
SZL Mesh Resilience — operational backend (FastAPI), cache-backed.
Doctrine v11: MEASURED/SIMULATED data, NOT a proven law. "Topology shapes mesh
resilience" is an OPEN hypothesis. BFT safety = Conjecture 2 (open).

Loads the precomputed sweep from cache.json at startup (instant — no compute),
so the service is robust and starts fast. Live scoring of arbitrary topologies
is computed on demand via engine.py.

Endpoints:
  GET /healthz                 liveness
  GET /resilience              full study summary (C/L/R1/R2 + SZL mesh + corr)
  GET /resilience/sweep?limit  sample of swept topologies
  GET /resilience/score?edges= score an arbitrary 5-organ topology live
"""
import json, os
from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
import engine

app = FastAPI(title="SZL Mesh Resilience", version="1.0.0")

DOCTRINE_NOTE = (
    "MEASURED/SIMULATED data on a defined corroboration-quorum-survival metric. "
    "'Topology shapes mesh resilience' is an OPEN hypothesis, NOT a theorem, "
    "NOT one of the locked-8. BFT safety = Conjecture 2 (open). Lambda = "
    "Conjecture 1. Inspired by arXiv:2007.06559; original SZL work."
)

_CACHE_PATH = os.path.join(os.path.dirname(__file__), "cache.json")
with open(_CACHE_PATH) as fh:
    _CACHE = json.load(fh)
_RECS = _CACHE["records"]
_SZL = _CACHE["szl"]


@app.get("/health")
@app.get("/healthz")
def healthz():
    return {"status": "ok", "service": "szl-mesh-resilience", "doctrine": "v11",
            "n_topologies": _CACHE["n"], "kind": "measured-simulation",
            "honesty": DOCTRINE_NOTE}


@app.get("/resilience")
def resilience():
    return {
        "doctrine": "v11", "honesty": DOCTRINE_NOTE,
        "inspired_by": "arXiv:2007.06559",
        "n_connected_topologies": _CACHE["n"],
        "szl_canonical_mesh": _SZL,
        "correlations": _CACHE["correlations"],
        "perfect_R2_count": _CACHE["perfect_R2_count"],
        "metric_defs": {
            "C": "avg local clustering coefficient [0,1]",
            "L": "avg shortest-path length over organ pairs",
            "R1": "resilience to 1 Byzantine organ (honest super-majority reachable)",
            "R2": "resilience to 2 Byzantine organs",
        },
    }


@app.get("/resilience/sweep")
def sweep(limit: int = Query(100, le=728)):
    return {"doctrine": "v11", "kind": "measured-simulation",
            "n": _CACHE["n"], "records": _RECS[:limit]}


@app.get("/resilience/score")
def score(edges: str = Query(..., description="comma list like 4-0,4-1,0-1")):
    try:
        E = []
        for tok in edges.split(","):
            a, b = tok.strip().split("-")
            E.append((int(a), int(b)))
    except Exception:
        return JSONResponse({"error": "bad edges format; use 'a-b,c-d'"}, status_code=400)
    n = 5
    if not engine.is_connected(n, E):
        return {"connected": False, "note": "disconnected topology — no quorum"}
    return {
        "doctrine": "v11", "kind": "measured-simulation", "connected": True,
        "edges": E,
        "C": round(engine.clustering_coefficient(n, E), 4),
        "L": round(engine.avg_path_length(n, E), 4),
        "R1": round(engine.resilience_score(n, E, 1), 4),
        "R2": round(engine.resilience_score(n, E, 2), 4),
        "honesty": DOCTRINE_NOTE,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8081)
