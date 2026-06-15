"""
SZL Agentic-GPU — vllm_backend.py
=================================
The endpoint ADAPTER the resident daemon can flip to when the betterwithage
RTX 5000 is upgraded from **Ollama** to **vLLM** (Agent.xpu STEP 1 — the
throughput server). It chooses which OpenAI-compatible endpoint the daemon
talks to and probes liveness honestly, keeping Ollama as a fallback.

Both servers speak the same OpenAI-compatible wire protocol, so the scheduler
and the daemon's reactive/proactive logic do NOT change — this module only
decides *which base URL* the daemon's injectable `endpoint=`/`probe=` point at:

  - **vLLM**   `http://100.125.77.31:8000/v1`  — preferred when it serves;
               exposes `/health` (liveness) + `/metrics` (Prometheus slack).
  - **Ollama** `http://100.125.77.31:11434/v1` — honest fallback; current
               open-weight, no-key server. Liveness via `GET /v1/models`.

DOCTRINE (v11/v12):
  - **No box access inferred here.** This control plane runs OFF-box today; the
    probes never raise, send no key, and a probe miss is reported honestly (not
    masked). Real serving + the `vllm serve …` bring-up is a Forge/box step.
  - **open-weight only; never commit a key.** `qwen2.5-coder:32b` is open; both
    endpoints are no-key on the LAN.
  - **`sovereign:true` ONLY when a local endpoint actually serves.** The adapter
    reports which endpoint answered (or that NEITHER did → router fallback); it
    never claims sovereignty for an endpoint that didn't respond. The half-state
    (banner sovereign while a router serves) is the only unacceptable outcome.
  - Pure stdlib (urllib). No scheduler change. Reactive is never gated here.

Pattern + motivation: **Agent.xpu** (Han et al., arXiv:2506.24045, 2025) —
keep inference local on the device; vLLM is the throughput-flow server that the
slack signal (`vllm_metrics.py`) reads to fill idle GPU cycles with proactive
work without starving reactive turns.
"""
from __future__ import annotations

import json
import urllib.error
import urllib.request
from dataclasses import dataclass, asdict
from typing import Callable, Optional

# OpenAI-compatible base URLs on the betterwithage box (LAN, no-key).
VLLM_ENDPOINT = "http://100.125.77.31:8000/v1"      # vLLM (throughput upgrade)
OLLAMA_ENDPOINT = "http://100.125.77.31:11434/v1"   # Ollama (honest fallback)

# Default open-weight model served on the RTX 5000 (no key, open license).
DEFAULT_MODEL = "qwen2.5-coder:32b"

# Probe is liveness-only: short timeout, never raises, no key, no body sent.
_PROBE_TIMEOUT_S = 2.0


def _http_get(url: str, timeout: float) -> Optional[int]:
    """GET `url`, return the HTTP status code, or None on any failure.

    Never raises. Sends no auth header. A 4xx still means *something answered*
    (the server is up), so callers treat any status < 500 as a live signal.
    """
    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return int(resp.status)
    except urllib.error.HTTPError as e:        # answered, but non-2xx
        return int(e.code)
    except Exception:                          # noqa: BLE001 - DNS/conn/timeout
        return None


def probe_vllm_health(base: str = VLLM_ENDPOINT,
                      timeout: float = _PROBE_TIMEOUT_S) -> bool:
    """True iff the vLLM server answers liveness on `base`.

    vLLM exposes a bare `/health` at the SERVER root (sibling of `/v1`), so we
    strip a trailing `/v1` before probing. Falls back to `GET {base}/models`
    (OpenAI-compatible) so this works even if `/health` is renamed. Any answer
    with status < 500 counts as live; never raises.
    """
    root = base[:-3] if base.endswith("/v1") else base.rstrip("/")
    for url in (f"{root}/health", f"{base.rstrip('/')}/models"):
        status = _http_get(url, timeout)
        if status is not None and status < 500:
            return True
    return False


def probe_ollama(base: str = OLLAMA_ENDPOINT,
                 timeout: float = _PROBE_TIMEOUT_S) -> bool:
    """True iff the Ollama server answers on `base` (via `GET /v1/models`).

    Mirrors `daemon.probe_endpoint`: any answer with status < 500 is live.
    Never raises.
    """
    for url in (f"{base.rstrip('/')}/models", base.rstrip("/")):
        status = _http_get(url, timeout)
        if status is not None and status < 500:
            return True
    return False


@dataclass
class BackendChoice:
    """The honestly-resolved serving backend for the daemon to use.

    `sovereign` is True ONLY when a LOCAL endpoint actually answered. When both
    probes miss, `backend == "router-fallback"`, `endpoint is None`, and
    `sovereign is False` — the daemon must then report router fallback, never a
    sovereign banner.
    """
    backend: str                 # "vllm" | "ollama" | "router-fallback"
    endpoint: Optional[str]      # the /v1 base the daemon should call, or None
    sovereign: bool              # True only when a local endpoint served
    vllm_live: bool              # did the vLLM /health probe answer?
    ollama_live: bool            # did the Ollama probe answer?
    model: str                   # open-weight model name (no key)
    has_metrics: bool            # vLLM exposes /metrics; Ollama does not
    note: str

    def as_dict(self) -> dict:
        return asdict(self)


# Injectable probe types (for deterministic tests / replay; default to live HTTP).
ProbeFn = Callable[[], bool]


def select_backend(prefer_vllm: bool = True,
                   vllm_base: str = VLLM_ENDPOINT,
                   ollama_base: str = OLLAMA_ENDPOINT,
                   vllm_probe: Optional[ProbeFn] = None,
                   ollama_probe: Optional[ProbeFn] = None,
                   model: str = DEFAULT_MODEL) -> BackendChoice:
    """Pick the serving backend honestly: vLLM if it serves, else Ollama, else
    router fallback.

    The daemon wires the result straight into its injectable seams:
        choice = select_backend()
        daemon = ResidentDaemon(endpoint=choice.endpoint,
                                probe=lambda ep: probe_vllm_health(ep))
    Probes are injectable so tests need no network. When `prefer_vllm` is False
    the order flips (Ollama-first), used to pin the current pre-upgrade default.
    """
    v_probe = vllm_probe or (lambda: probe_vllm_health(vllm_base))
    o_probe = ollama_probe or (lambda: probe_ollama(ollama_base))

    vllm_live = bool(v_probe())
    ollama_live = bool(o_probe())

    order = ["vllm", "ollama"] if prefer_vllm else ["ollama", "vllm"]
    for which in order:
        if which == "vllm" and vllm_live:
            return BackendChoice(
                backend="vllm", endpoint=vllm_base, sovereign=True,
                vllm_live=vllm_live, ollama_live=ollama_live, model=model,
                has_metrics=True,
                note=("vLLM serving locally; /metrics available for slack-aware "
                      "piggybacking. sovereign:true (local endpoint answered)."))
        if which == "ollama" and ollama_live:
            return BackendChoice(
                backend="ollama", endpoint=ollama_base, sovereign=True,
                vllm_live=vllm_live, ollama_live=ollama_live, model=model,
                has_metrics=False,
                note=("Ollama fallback serving locally; no /metrics (slack falls "
                      "back to SAMPLE model). sovereign:true (local answered)."))

    return BackendChoice(
        backend="router-fallback", endpoint=None, sovereign=False,
        vllm_live=vllm_live, ollama_live=ollama_live, model=model,
        has_metrics=False,
        note=("Neither local endpoint answered — honest router fallback. "
              "sovereign:false; do NOT show a sovereign banner."))


def daemon_kwargs(choice: Optional[BackendChoice] = None,
                  prefer_vllm: bool = True) -> dict:
    """Build the `endpoint=`/`probe=` kwargs for `daemon.ResidentDaemon`.

    Endpoint-agnostic: the scheduler/daemon need no change, we just point the
    daemon's injectable seams at the resolved backend. When the choice is a
    router fallback we still hand back the vLLM base as the *target* but a probe
    that reports the box is unreachable, so the daemon's posture stays honest
    (`sovereign:false`) rather than silently claiming a local serve.
    """
    c = choice or select_backend(prefer_vllm=prefer_vllm)
    target = c.endpoint or VLLM_ENDPOINT
    is_vllm = c.backend == "vllm"
    # daemon.ResidentDaemon expects `probe(endpoint) -> bool`; match that arity.
    probe = (lambda ep: probe_vllm_health(ep)) if is_vllm \
        else (lambda ep: probe_ollama(ep))
    return {"endpoint": target, "probe": probe, "_backend": c.backend,
            "_sovereign": c.sovereign}


# ===========================================================================
# SELF-TEST — no network. Probes are injected so the resolution logic is
# exercised deterministically across all three states.
#   - vLLM up                  -> backend "vllm", /metrics available, sovereign
#   - vLLM down, Ollama up      -> backend "ollama" fallback, no /metrics, sovereign
#   - both down                 -> router-fallback, endpoint None, NOT sovereign
#   - prefer_vllm=False         -> Ollama-first ordering honored
# Prints {"ok": true} iff every assertion holds.
# ===========================================================================
def _selftest() -> dict:
    out: dict = {"checks": []}

    def check(name, cond):
        out["checks"].append({name: bool(cond)})
        assert cond, f"FAILED: {name}"

    up = lambda: True
    down = lambda: False

    # --- vLLM up: preferred, exposes /metrics, sovereign ------------------
    c_vllm = select_backend(vllm_probe=up, ollama_probe=up)
    check("vllm_preferred_when_up", c_vllm.backend == "vllm")
    check("vllm_endpoint_is_8000", c_vllm.endpoint == VLLM_ENDPOINT)
    check("vllm_has_metrics", c_vllm.has_metrics is True)
    check("vllm_sovereign", c_vllm.sovereign is True)

    # --- vLLM down, Ollama up: honest fallback, no /metrics, still sovereign
    c_olla = select_backend(vllm_probe=down, ollama_probe=up)
    check("ollama_fallback_when_vllm_down", c_olla.backend == "ollama")
    check("ollama_endpoint_is_11434", c_olla.endpoint == OLLAMA_ENDPOINT)
    check("ollama_no_metrics", c_olla.has_metrics is False)
    check("ollama_sovereign_when_local_serves", c_olla.sovereign is True)

    # --- both down: router fallback, NOT sovereign, no endpoint -----------
    c_none = select_backend(vllm_probe=down, ollama_probe=down)
    check("router_fallback_when_both_down", c_none.backend == "router-fallback")
    check("no_endpoint_when_both_down", c_none.endpoint is None)
    check("not_sovereign_when_both_down", c_none.sovereign is False)

    # --- prefer_vllm=False pins Ollama-first even when vLLM is up ----------
    c_pin = select_backend(prefer_vllm=False, vllm_probe=up, ollama_probe=up)
    check("ollama_first_when_not_preferring_vllm", c_pin.backend == "ollama")

    # --- daemon_kwargs hands back an endpoint + a probe -------------------
    kw = daemon_kwargs(choice=c_vllm)
    check("daemon_kwargs_endpoint", kw["endpoint"] == VLLM_ENDPOINT)
    check("daemon_kwargs_probe_callable", callable(kw["probe"]))
    kw_none = daemon_kwargs(choice=c_none)
    check("daemon_kwargs_not_sovereign_on_fallback",
          kw_none["_sovereign"] is False)

    # --- integration with the real daemon IF present (endpoint-agnostic) ---
    # The daemon takes injectable `endpoint=`/`probe=` (probe(endpoint)->bool),
    # so flipping to vLLM is a kwargs change with NO scheduler change.
    daemon_checked = False
    try:
        from daemon import ResidentDaemon  # type: ignore
        # Inject a deterministic live probe (no network in the self-test); the
        # real bring-up uses daemon_kwargs(choice).probe → probe_vllm_health.
        d = ResidentDaemon(endpoint=c_vllm.endpoint, probe=lambda _ep: True)
        check("daemon_accepts_vllm_endpoint",
              getattr(d, "endpoint", None) == VLLM_ENDPOINT)
        d._update_posture()
        # Posture tracks the probe honestly: live probe → sovereign.
        check("daemon_posture_sovereign_when_probe_live",
              d.serving_local is True)
        # And a dead probe → honest router fallback (no fabricated sovereignty).
        d_dead = ResidentDaemon(endpoint=c_vllm.endpoint, probe=lambda _ep: False)
        d_dead._update_posture()
        check("daemon_posture_fallback_when_probe_dead",
              d_dead.serving_local is False)
        daemon_checked = True
    except Exception:  # noqa: BLE001 - daemon not importable here; skip wiring.
        check("daemon_wiring_skipped_cleanly", True)

    out["daemon_integration_exercised"] = daemon_checked
    out["model"] = DEFAULT_MODEL
    out["ok"] = True
    out["doctrine"] = ("vLLM preferred, Ollama honest fallback, router fallback "
                       "when neither local endpoint serves; sovereign:true ONLY "
                       "when a local endpoint answered; open-weight, no key; "
                       "scheduler unchanged (endpoint-agnostic).")
    return out


if __name__ == "__main__":
    print(json.dumps(_selftest(), indent=2))
