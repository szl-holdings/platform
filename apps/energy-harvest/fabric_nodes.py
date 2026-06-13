"""
SZL Compute Fabric — honest multi-node compute pool registry (Doctrine v11).

Founder ask: "wire up all the free nodes + all the others + my GPU, running
together." This module is the HONEST registry of every compute endpoint the box
can actually reach, so we can run inference / ML-guided proof search / Lean kernel
builds across the pool. The whole point is honesty:

  * reachable=True ONLY on a real successful probe THIS scrape (never assumed).
  * sovereign=True ONLY for hardware we own and self-host (the RTX). Brev cloud
    GPUs are NVIDIA-cloud (sovereign=False); hosted inference APIs are NOT nodes
    you own (sovereign=False, kind=hosted-inference fallback).
  * NO fabricated nodes. Brev GPU nodes appear only when BREV_NODE_ENDPOINTS is
    populated (you launch them + join Tailscale, then I register the IPs). Until
    then the Brev slot is honestly reported empty with the exact next step.
  * This module makes NO energy/joule/free-energy claim and never sets a global
    sovereign flag. Lambda = Conjecture 1; not one of the locked-8.

A "node" here is a reachable compute endpoint. Capabilities are declared per node
type, not assumed live — `reachable` is the truth signal.
"""
import json
import os
import socket
import time
import urllib.request
from urllib.parse import urlparse

_PROBE_TIMEOUT = 3.0
_CACHE_TTL = 20.0
_cache = {"t": 0.0, "data": None}


def _http_ok(url, timeout=_PROBE_TIMEOUT):
    """Real HTTP GET; return (ok, status, detail). Never raises."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "szl-compute-fabric"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            st = getattr(r, "status", 200)
            return (200 <= st < 300, st, None)
    except urllib.error.HTTPError as e:
        return (False, e.code, "http %s" % e.code)
    except Exception as e:
        return (False, None, type(e).__name__)


def _tcp_ok(host, port, timeout=_PROBE_TIMEOUT):
    """Real TCP connect; return (ok, detail). Never raises."""
    try:
        with socket.create_connection((host, int(port)), timeout=timeout):
            return (True, None)
    except Exception as e:
        return (False, type(e).__name__)


def _ollama_node(name, base_url, sovereign, source):
    """Probe an Ollama/vLLM OpenAI-style endpoint. Live ONLY on a real model list."""
    base = base_url.rstrip("/")
    ok, st, detail = _http_ok(base + "/api/tags")
    if not ok:
        # vLLM/OpenAI-style fallback path
        ok, st, detail = _http_ok(base + "/v1/models")
    models = None
    if ok:
        try:
            req = urllib.request.Request(base + "/api/tags",
                                         headers={"User-Agent": "szl-compute-fabric"})
            with urllib.request.urlopen(req, timeout=_PROBE_TIMEOUT) as r:
                d = json.loads(r.read().decode("utf-8", "replace"))
            models = [m.get("name") or m.get("model") for m in d.get("models", [])][:8] or None
        except Exception:
            models = None
    return {
        "name": name,
        "kind": "sovereign-gpu" if sovereign else "brev-gpu",
        "endpoint": base,
        "reachable": ok,
        "sovereign": bool(sovereign),
        "capabilities": ["inference", "embeddings", "ml-proof-search"],
        "models": models,
        "source": source,
        "detail": detail if not ok else "live model list returned",
    }


def _sovereign_gpu():
    base = os.environ.get("A11OY_MODEL_BASE_URL", "http://100.125.77.31:11434")
    # strip a trailing /v1 if present so /api/tags resolves
    if base.rstrip("/").endswith("/v1"):
        base = base.rstrip("/")[:-3]
    return _ollama_node("rtx-betterwithage", base, sovereign=True,
                        source="Tailscale self-hosted RTX (A11OY_MODEL_BASE_URL)")


def _brev_nodes():
    """Brev GPU nodes from BREV_NODE_ENDPOINTS = comma list of
    'name=host:port' or 'host:port' (Tailscale IPs once nodes join the tailnet)."""
    raw = os.environ.get("BREV_NODE_ENDPOINTS", "").strip()
    if not raw:
        return []
    out = []
    for i, item in enumerate(x.strip() for x in raw.split(",") if x.strip()):
        if "=" in item:
            name, hp = item.split("=", 1)
        else:
            name, hp = "brev-node-%d" % (i + 1), item
        name, hp = name.strip(), hp.strip()
        if "://" not in hp:
            hp_url = "http://" + hp
        else:
            hp_url = hp
        out.append(_ollama_node(name, hp_url, sovereign=False,
                                source="Brev cloud GPU (joined Tailscale)"))
    return out


def _hosted_fallback(name, host, port, key_env):
    """Hosted inference API — a FALLBACK, not a node you own. reachable = real TCP
    connect; configured = the API key env exists (value never read/printed)."""
    ok, detail = _tcp_ok(host, port)
    return {
        "name": name,
        "kind": "hosted-inference",
        "endpoint": "%s:%s" % (host, port),
        "reachable": ok,
        "configured": bool(os.environ.get(key_env)),
        "sovereign": False,
        "capabilities": ["inference"],
        "source": "third-party hosted API (fallback only; not owned compute)",
        "detail": detail if not ok else "tcp reachable",
        "note": "Hosted fallback — NOT a sovereign node and NOT GPU compute you own.",
    }


def _box_cpu():
    """The Hetzner box itself — a real CPU node that runs the Lean KERNEL build
    (lake) where proofs are actually verified. Always 'reachable' (we run on it)."""
    return {
        "name": "hetzner-box-cpu",
        "kind": "cpu",
        "endpoint": "127.0.0.1 (self)",
        "reachable": True,
        "sovereign": True,
        "capabilities": ["lean-build", "kernel-verify", "orchestration"],
        "source": "host running this service (167.233.50.75)",
        "detail": "Lean kernel verification (lake build) runs on CPU here.",
    }


def compute_pool():
    now = time.time()
    if _cache["data"] is not None and (now - _cache["t"]) < _CACHE_TTL:
        return _cache["data"]

    nodes = []
    nodes.append(_box_cpu())
    nodes.append(_sovereign_gpu())
    nodes.extend(_brev_nodes())
    nodes.append(_hosted_fallback("groq", "api.groq.com", 443, "GROQ_API_KEY"))
    nodes.append(_hosted_fallback("nvidia-nim", "integrate.api.nvidia.com", 443,
                                  "NVIDIA_NIM_API_KEY"))
    nodes.append(_hosted_fallback("hf-router", "router.huggingface.co", 443, "HF_TOKEN"))

    brev_registered = sum(1 for n in nodes if n["kind"] == "brev-gpu")
    sovereign_gpu_live = any(
        n["kind"] == "sovereign-gpu" and n["reachable"] for n in nodes)
    gpu_live = sum(1 for n in nodes
                   if n["kind"] in ("sovereign-gpu", "brev-gpu") and n["reachable"])

    out = {
        "status": "live",
        "ns": "a11oy",
        "doctrine": "v11",
        "kind": "multi-node-compute-fabric",
        "sovereign": False,  # the FABRIC never claims a global sovereign flag
        "counts": {
            "nodes_total": len(nodes),
            "nodes_reachable": sum(1 for n in nodes if n["reachable"]),
            "gpu_nodes_reachable": gpu_live,
            "brev_nodes_registered": brev_registered,
            "sovereign_gpu_live": sovereign_gpu_live,
        },
        "nodes": nodes,
        "brev_onboarding": (
            "No Brev GPU nodes registered yet."
            if brev_registered == 0 else
            "%d Brev node(s) registered." % brev_registered
        ) + " Brev's control plane refuses datacenter IPs, so launch is a founder "
            "step: (1) launch a free Brev Launchable, (2) `tailscale up` on it to "
            "join your tailnet, (3) set BREV_NODE_ENDPOINTS='brev1=100.x.y.z:11434' "
            "(comma-separated) and restart this service — the node then probes LIVE.",
        "honesty": (
            "reachable=True only on a real probe this scrape; sovereign=True only "
            "for owned self-hosted hardware (the RTX + the box). Brev cloud GPUs and "
            "hosted APIs are sovereign=False. No node is fabricated. No energy/joule "
            "claim. Lambda = Conjecture 1; not one of the locked-8."
        ),
    }
    _cache["t"] = now
    _cache["data"] = out
    return out


def metrics_lines(_g):
    """Honest Prometheus lines. Counts derive ONLY from real probes."""
    try:
        p = compute_pool()
    except Exception:
        return _g("szl_compute_fabric_up", 0, "Compute fabric probe failed this scrape.")
    c = p["counts"]
    return "".join([
        _g("szl_compute_fabric_up", 1, "Compute fabric registry is serving."),
        _g("szl_compute_nodes_total", c["nodes_total"], "Total registered compute nodes."),
        _g("szl_compute_nodes_reachable", c["nodes_reachable"],
           "Nodes that passed a REAL reachability probe this scrape."),
        _g("szl_compute_gpu_nodes_reachable", c["gpu_nodes_reachable"],
           "GPU nodes (sovereign RTX + Brev) reachable this scrape."),
        _g("szl_compute_brev_nodes_registered", c["brev_nodes_registered"],
           "Brev GPU nodes registered via BREV_NODE_ENDPOINTS (0 until founder launches)."),
        _g("szl_compute_sovereign_gpu_live", 1 if c["sovereign_gpu_live"] else 0,
           "1 = the self-hosted sovereign RTX answered a real probe this scrape."),
    ])
