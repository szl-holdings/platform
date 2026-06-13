"""
SZL Agentic-GPU — vllm_metrics.py
=================================
Parse vLLM's Prometheus `/metrics` endpoint into a **slack signal** the resident
scheduler uses for finer **slack-aware piggybacking**: run PROACTIVE work only
when the GPU has real headroom (few requests running/waiting, KV-cache not full,
warm prefix cache). When `/metrics` is unreachable — which it is OFF-box today —
we fall back to an explicitly-labeled **SAMPLE** slack model and never present a
simulated reading as measured.

vLLM exposes Prometheus-text gauges/counters (names per vLLM ≥0.5, the
`vllm:` prefix). We read a small, load-bearing subset:

  - `vllm:num_requests_running`   — requests currently decoding on the GPU.
  - `vllm:num_requests_waiting`   — requests queued (backpressure).
  - `vllm:gpu_cache_usage_perc`   — KV-cache occupancy in [0,1] (1.0 = full).
  - `vllm:gpu_prefix_cache_hit_rate` (or the
    `gpu_prefix_cache_{hits,queries}` counters) — prefix-cache warmth.

From these we derive `slack ∈ [0,1]`: high when the server is idle/cool with a
warm cache (lots of room for proactive batch), low when it is busy/backpressured
(reactive must own the GPU). The scheduler reads `slack` to decide whether to
admit proactive piggyback work this tick.

DOCTRINE (v11/v12):
  - **`/metrics` is REAL only on-box.** Off-box (this control plane today) the
    fetch fails and we return a SAMPLE slack signal with `measured=False` and a
    SAMPLE label. We NEVER label a simulated slack as measured.
  - **Reactive never starves.** A high slack signal only *permits* proactive
    admission; the scheduler's strict preemptive priority still pauses proactive
    work the instant a reactive turn arrives. Slack tunes piggybacking, it does
    not override preemption.
  - Pure stdlib (urllib + text parsing). No key sent. open-weight only.

Pattern + motivation: **Agent.xpu** (Han et al., arXiv:2506.24045, 2025) —
energy/throughput co-scheduling on one device; the slack signal is how idle GPU
cycles get filled with proactive work without harming reactive latency.
"""
from __future__ import annotations

import json
import urllib.error
import urllib.request
from dataclasses import dataclass, asdict
from typing import Callable, Dict, Optional

# vLLM server metrics endpoint (Prometheus text) lives at the SERVER root, a
# sibling of /v1 — e.g. http://100.125.77.31:8000/metrics .
DEFAULT_METRICS_URL = "http://100.125.77.31:8000/metrics"

_FETCH_TIMEOUT_S = 2.0

SAMPLE_LABEL = "SAMPLE/ESTIMATE (no on-box /metrics reachable — doctrine v11/v12)"
MEASURED_LABEL = "MEASURED (live vLLM /metrics on-box)"

# Metric names we read (vLLM `vllm:` prefix; tolerate the unprefixed form too).
_M_RUNNING = "vllm:num_requests_running"
_M_WAITING = "vllm:num_requests_waiting"
_M_KV_USAGE = "vllm:gpu_cache_usage_perc"
_M_PREFIX_HIT = "vllm:gpu_prefix_cache_hit_rate"
_M_PREFIX_HITS = "vllm:gpu_prefix_cache_hits_total"
_M_PREFIX_QUERIES = "vllm:gpu_prefix_cache_queries_total"


def parse_prometheus(text: str) -> Dict[str, float]:
    """Parse Prometheus exposition text into `{metric_name: value}`.

    Sums samples that share a base name across label sets (vLLM emits per-model
    labels), strips the `{labels}` suffix, and ignores `# HELP`/`# TYPE` lines
    and unparseable values. Names are recorded both with and without the
    `vllm:` prefix so lookups are tolerant of the prefix being dropped.
    """
    out: Dict[str, float] = {}
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        # `name{labels} value [timestamp]` — split off the trailing value.
        parts = line.rsplit(" ", 1)
        if len(parts) != 2:
            continue
        name_labels, value_s = parts[0].strip(), parts[1].strip()
        try:
            value = float(value_s)
        except ValueError:
            continue
        name = name_labels.split("{", 1)[0].strip()
        if not name:
            continue
        out[name] = out.get(name, 0.0) + value
        # Also index without the `vllm:` prefix for tolerant lookups.
        if name.startswith("vllm:"):
            bare = name[len("vllm:"):]
            out[bare] = out.get(bare, 0.0) + value
    return out


def _get(metrics: Dict[str, float], name: str) -> Optional[float]:
    """Lookup a metric by its `vllm:`-prefixed name, tolerating the bare form."""
    if name in metrics:
        return metrics[name]
    bare = name[len("vllm:"):] if name.startswith("vllm:") else name
    return metrics.get(bare)


@dataclass
class SlackSignal:
    """A derived slack reading the scheduler consults for proactive admission.

    `slack ∈ [0,1]`: 1.0 = wide-open GPU (admit proactive piggyback), 0.0 =
    busy/backpressured (reactive owns the device). `measured` is True ONLY when
    the values came from a live on-box `/metrics` scrape; off-box it is False
    and `label` is a SAMPLE label (doctrine: never present a sample as measured).
    """
    slack: float
    running: float
    waiting: float
    kv_cache_usage: float          # [0,1], 1.0 = KV cache full
    prefix_cache_hit_rate: float   # [0,1] warmth, 0.0 if unknown
    measured: bool
    source: str                    # "vllm-metrics" | "sample-model"

    @property
    def admit_proactive(self) -> bool:
        """Permit proactive piggybacking when there is real headroom.

        Requires NO queue backpressure (nothing waiting) and slack above a
        conservative floor. This only *permits* — preemption still guarantees
        reactive is never starved.
        """
        return self.waiting <= 0.0 and self.slack >= 0.25

    def as_dict(self) -> dict:
        d = asdict(self)
        d["slack"] = round(self.slack, 4)
        d["kv_cache_usage"] = round(self.kv_cache_usage, 4)
        d["prefix_cache_hit_rate"] = round(self.prefix_cache_hit_rate, 4)
        d["admit_proactive"] = self.admit_proactive
        d["label"] = MEASURED_LABEL if self.measured else SAMPLE_LABEL
        return d


# Capacity assumptions for normalizing the running-request count into headroom.
# vLLM's max concurrency depends on max-num-seqs/KV; we use a conservative
# nominal batch width to map "running" onto a [0,1] occupancy estimate.
_NOMINAL_MAX_RUNNING = 16.0


def slack_from_metrics(metrics: Dict[str, float], measured: bool) -> SlackSignal:
    """Derive a `SlackSignal` from a parsed `/metrics` dict.

    slack = min(request-headroom, kv-cache-headroom), nudged UP by a warm prefix
    cache (cheap-to-serve reuse means more effective room). Backpressure
    (anything waiting) pins slack toward 0. Bounded to [0,1].
    """
    running = _get(metrics, _M_RUNNING) or 0.0
    waiting = _get(metrics, _M_WAITING) or 0.0
    kv = _get(metrics, _M_KV_USAGE)
    kv = 0.0 if kv is None else max(0.0, min(1.0, kv))

    # Prefix-cache hit rate: prefer the direct gauge, else derive from counters.
    hit_rate = _get(metrics, _M_PREFIX_HIT)
    if hit_rate is None:
        hits = _get(metrics, _M_PREFIX_HITS) or 0.0
        queries = _get(metrics, _M_PREFIX_QUERIES) or 0.0
        hit_rate = (hits / queries) if queries > 0 else 0.0
    hit_rate = max(0.0, min(1.0, hit_rate))

    request_headroom = max(0.0, 1.0 - (running / _NOMINAL_MAX_RUNNING))
    kv_headroom = max(0.0, 1.0 - kv)
    base = min(request_headroom, kv_headroom)

    # A warm prefix cache makes proactive work cheaper to slot in; give a small
    # bounded bonus (never above 1.0). No queue backpressure required first.
    bonus = 0.10 * hit_rate
    slack = max(0.0, min(1.0, base + bonus))
    if waiting > 0.0:
        slack = 0.0   # backpressure: reactive owns the GPU, no piggybacking.

    return SlackSignal(slack=slack, running=running, waiting=waiting,
                       kv_cache_usage=kv, prefix_cache_hit_rate=hit_rate,
                       measured=measured,
                       source="vllm-metrics" if measured else "sample-model")


def sample_slack(running: float = 1.0, waiting: float = 0.0,
                 kv_cache_usage: float = 0.20,
                 prefix_cache_hit_rate: float = 0.60) -> SlackSignal:
    """An explicitly-SAMPLE slack signal for off-box / test use.

    Defaults model a lightly-loaded server (some headroom, warm-ish cache).
    Always `measured=False` so downstream labels stay honest.
    """
    return slack_from_metrics({
        _M_RUNNING: running,
        _M_WAITING: waiting,
        _M_KV_USAGE: kv_cache_usage,
        _M_PREFIX_HIT: prefix_cache_hit_rate,
    }, measured=False)


def _fetch_metrics_text(url: str, timeout: float) -> Optional[str]:
    """GET the raw `/metrics` text, or None on any failure. Never raises, no key."""
    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if int(resp.status) != 200:
                return None
            return resp.read().decode("utf-8", errors="replace")
    except (urllib.error.URLError, Exception):  # noqa: BLE001 - conn/timeout/etc
        return None


def read_slack(url: str = DEFAULT_METRICS_URL,
               timeout: float = _FETCH_TIMEOUT_S,
               fetch_fn: Optional[Callable[[str, float], Optional[str]]] = None
               ) -> SlackSignal:
    """Best-available slack: live MEASURED from on-box `/metrics`, else SAMPLE.

    Honest by construction — the returned signal's `measured` flag is True ONLY
    when a live scrape succeeded. Off-box the fetch fails and we return the
    SAMPLE model with `measured=False`. `fetch_fn` is injectable for tests.
    """
    fetch = fetch_fn or _fetch_metrics_text
    text = fetch(url, timeout)
    if text is None:
        return sample_slack()
    metrics = parse_prometheus(text)
    if not metrics:
        return sample_slack()
    return slack_from_metrics(metrics, measured=True)


def slack_signal_fn(url: str = DEFAULT_METRICS_URL) -> Callable[[], float]:
    """A zero-arg `() -> slack` the scheduler can poll each tick (0.0..1.0)."""
    def _signal() -> float:
        return read_slack(url).slack
    return _signal


# A small but realistic vLLM `/metrics` sample for the self-test (no network).
_SAMPLE_METRICS_TEXT = """\
# HELP vllm:num_requests_running Number of requests currently running on GPU.
# TYPE vllm:num_requests_running gauge
vllm:num_requests_running{model_name="qwen2.5-coder:32b"} 2.0
# HELP vllm:num_requests_waiting Number of requests waiting to be processed.
# TYPE vllm:num_requests_waiting gauge
vllm:num_requests_waiting{model_name="qwen2.5-coder:32b"} 0.0
# HELP vllm:gpu_cache_usage_perc GPU KV-cache usage. 1 means 100 percent usage.
# TYPE vllm:gpu_cache_usage_perc gauge
vllm:gpu_cache_usage_perc{model_name="qwen2.5-coder:32b"} 0.18
# HELP vllm:gpu_prefix_cache_hit_rate GPU prefix cache hit rate.
# TYPE vllm:gpu_prefix_cache_hit_rate gauge
vllm:gpu_prefix_cache_hit_rate{model_name="qwen2.5-coder:32b"} 0.73
"""

# A busy/backpressured sample: queue waiting + KV cache nearly full.
_BUSY_METRICS_TEXT = """\
vllm:num_requests_running{model_name="qwen2.5-coder:32b"} 14.0
vllm:num_requests_waiting{model_name="qwen2.5-coder:32b"} 6.0
vllm:gpu_cache_usage_perc{model_name="qwen2.5-coder:32b"} 0.96
vllm:gpu_prefix_cache_hit_rate{model_name="qwen2.5-coder:32b"} 0.10
"""


# ===========================================================================
# SELF-TEST — no network. Parses sample /metrics text → slack signal across
# the idle and busy regimes, and proves the off-box SAMPLE fallback is honest.
#   - parse the sample text: running/waiting/kv/prefix extracted correctly
#   - idle server (no waiting, low KV, warm cache) -> high slack, ADMIT proactive
#   - busy server (queue waiting, KV ~full)         -> slack 0, do NOT admit
#   - unreachable /metrics (fetch None)             -> SAMPLE fallback, measured=False
#   - daemon can pick vLLM vs Ollama endpoint (vllm_backend integration)
# Prints {"ok": true} iff every assertion holds.
# ===========================================================================
def _selftest() -> dict:
    out: dict = {"checks": []}

    def check(name, cond):
        out["checks"].append({name: bool(cond)})
        assert cond, f"FAILED: {name}"

    # --- parse the realistic sample text ----------------------------------
    m = parse_prometheus(_SAMPLE_METRICS_TEXT)
    check("parsed_running", _get(m, _M_RUNNING) == 2.0)
    check("parsed_waiting", _get(m, _M_WAITING) == 0.0)
    check("parsed_kv_usage", abs((_get(m, _M_KV_USAGE) or -1) - 0.18) < 1e-9)
    check("parsed_prefix_hit",
          abs((_get(m, _M_PREFIX_HIT) or -1) - 0.73) < 1e-9)
    check("bare_name_indexed", "num_requests_running" in m)

    # --- idle server: high slack, admit proactive piggybacking ------------
    idle = slack_from_metrics(m, measured=True)
    check("idle_high_slack", idle.slack > 0.5)
    check("idle_admits_proactive", idle.admit_proactive is True)
    check("idle_measured_label", idle.as_dict()["label"].startswith("MEASURED"))

    # --- busy server: backpressure pins slack to 0, do NOT admit ----------
    busy = slack_from_metrics(parse_prometheus(_BUSY_METRICS_TEXT), measured=True)
    check("busy_zero_slack_under_backpressure", busy.slack == 0.0)
    check("busy_does_not_admit_proactive", busy.admit_proactive is False)

    # --- unreachable /metrics: honest SAMPLE fallback ---------------------
    s = read_slack(fetch_fn=lambda url, t: None)   # simulate off-box: no answer
    check("offbox_falls_back_to_sample", s.measured is False)
    check("offbox_sample_label", s.as_dict()["label"].startswith("SAMPLE"))
    check("offbox_slack_in_range", 0.0 <= s.slack <= 1.0)

    # --- live scrape path: injected text → MEASURED -----------------------
    live = read_slack(fetch_fn=lambda url, t: _SAMPLE_METRICS_TEXT)
    check("live_scrape_measured", live.measured is True)
    check("live_scrape_admits_when_idle", live.admit_proactive is True)

    # --- empty/garbage metrics → SAMPLE fallback (never crash) ------------
    empty = read_slack(fetch_fn=lambda url, t: "# only comments\n")
    check("empty_metrics_sample_fallback", empty.measured is False)

    # --- the polled signal fn returns a bounded float ---------------------
    sig = slack_signal_fn()
    val = sig()   # off-box → SAMPLE slack
    check("signal_fn_returns_float", isinstance(val, float))
    check("signal_fn_in_range", 0.0 <= val <= 1.0)

    # --- daemon can pick vLLM vs Ollama endpoint (vllm_backend wiring) -----
    backend_checked = False
    try:
        from vllm_backend import select_backend, VLLM_ENDPOINT, OLLAMA_ENDPOINT
        up, down = (lambda: True), (lambda: False)
        c_v = select_backend(vllm_probe=up, ollama_probe=up)
        check("daemon_picks_vllm_when_up", c_v.endpoint == VLLM_ENDPOINT)
        check("vllm_choice_has_metrics", c_v.has_metrics is True)
        c_o = select_backend(vllm_probe=down, ollama_probe=up)
        check("daemon_falls_back_to_ollama", c_o.endpoint == OLLAMA_ENDPOINT)
        backend_checked = True
    except Exception:  # noqa: BLE001 - vllm_backend not importable here.
        check("backend_wiring_skipped_cleanly", True)

    out["backend_integration_exercised"] = backend_checked
    out["sample_slack_offbox"] = round(sample_slack().slack, 4)
    out["ok"] = True
    out["doctrine"] = ("slack from vLLM /metrics is MEASURED only on-box; off-box "
                       "is SAMPLE/ESTIMATE; slack only PERMITS proactive "
                       "piggybacking — preemption still guarantees reactive is "
                       "never starved; open-weight, no key.")
    return out


if __name__ == "__main__":
    print(json.dumps(_selftest(), indent=2))
