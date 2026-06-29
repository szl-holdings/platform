"""
k9_ops_feeds.py — K9 cluster-ops backend (real live data).

K9 is a k9s-inspired ops surface for the SZL fleet: resource list -> drill-in ->
live status -> signed-action receipt. The PATTERN is reimplemented from k9s
(github.com/derailed/k9s, Apache-2.0) as our own; NO k9s code is copied.

Every route below is wired to a REAL live source:
  - Spaces : Hugging Face Space runtime stage API (public)
  - Fleet  : GitHub Actions latest-run per repo (public; token used only for rate-limit)
  - UDS    : in-cluster UDS Package CR status — probed ONLY if K9_UDS_STATUS_URL is set,
             otherwise honestly reported "unreachable" (never fabricated)
  - Receipts: a11oy live honest/receipts endpoint (public)

Doctrine: real live data only. Anything not reachable is labelled
source:"unreachable" with a reason. Action receipts are labelled
status:"SIMULATED" (command demonstration) — K9 does not hold a signing key,
so it shows the receipt the governed backend WOULD emit, never a forged signature.

Stdlib-only core (urllib) so it runs anywhere; the FastAPI router is built only
if fastapi is importable, mirroring a11oy serve.py composition.
"""
from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.request

__all__ = [
    "fetch_spaces",
    "fetch_fleet",
    "fetch_uds",
    "fetch_receipts",
    "k9_snapshot",
    "build_router",
]

USER_AGENT = "szl-k9-ops/0.1 (+https://a-11-oy.com)"
DEFAULT_TIMEOUT = 12

# Default fleet (override via env CSV). Real szl-holdings repos / SZLHOLDINGS Spaces.
DEFAULT_SPACES = [s.strip() for s in os.environ.get(
    "K9_SPACES", "SZLHOLDINGS/a11oy,SZLHOLDINGS/killinchu"
).split(",") if s.strip()]
DEFAULT_REPOS = [r.strip() for r in os.environ.get(
    "K9_REPOS",
    "szl-holdings/a11oy,szl-holdings/killinchu,szl-holdings/lutar-lean,"
    "szl-holdings/platform,szl-holdings/szl-uds-deployment",
).split(",") if r.strip()]


def _get_json(url: str, headers: dict | None = None, timeout: int = DEFAULT_TIMEOUT):
    """GET url -> (json, error). Never raises; honest error string on failure."""
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, **(headers or {})})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8")), None
    except urllib.error.HTTPError as e:
        return None, f"http {e.code}"
    except urllib.error.URLError as e:
        return None, f"unreachable: {getattr(e, 'reason', e)}"
    except (TimeoutError, ValueError) as e:
        return None, f"error: {e}"


def fetch_spaces(spaces: list[str] | None = None) -> list[dict]:
    """Live HF Space runtime stage. Real source: huggingface.co/api/spaces/<id>."""
    out = []
    for sid in (spaces or DEFAULT_SPACES):
        data, err = _get_json(f"https://huggingface.co/api/spaces/{sid}")
        if err or not data:
            out.append({"id": sid, "kind": "Space", "source": "unreachable", "reason": err})
            continue
        rt = data.get("runtime", {}) or {}
        stage = rt.get("stage")
        out.append({
            "id": sid,
            "kind": "Space",
            "stage": stage,
            "healthy": stage == "RUNNING",
            "hardware": (rt.get("hardware") or {}).get("current"),
            "sdk": data.get("sdk"),
            "url": f"https://huggingface.co/spaces/{sid}",
            "source": "live",
        })
    return out


def fetch_fleet(repos: list[str] | None = None, token: str | None = None) -> list[dict]:
    """Live GitHub Actions latest-run per repo. Real source: api.github.com."""
    token = token or os.environ.get("SZL_GITHUB_TOKEN") or os.environ.get("GITHUB_TOKEN")
    headers = {"Accept": "application/vnd.github+json"}
    if token:
        headers["Authorization"] = f"token {token}"
    out = []
    for repo in (repos or DEFAULT_REPOS):
        data, err = _get_json(
            f"https://api.github.com/repos/{repo}/actions/runs?per_page=1", headers=headers
        )
        if err or not data:
            out.append({"id": repo, "kind": "Repo", "source": "unreachable", "reason": err})
            continue
        runs = data.get("workflow_runs") or []
        if not runs:
            out.append({"id": repo, "kind": "Repo", "source": "live", "status": "no-runs"})
            continue
        r = runs[0]
        concl = r.get("conclusion")
        out.append({
            "id": repo,
            "kind": "Repo",
            "workflow": r.get("name"),
            "status": r.get("status"),
            "conclusion": concl,
            "healthy": concl == "success",
            "branch": r.get("head_branch"),
            "url": r.get("html_url"),
            "source": "live",
        })
    return out


def fetch_uds(status_url: str | None = None) -> list[dict]:
    """UDS Package CR status. Only LIVE if K9_UDS_STATUS_URL is provided (in-cluster
    kube-API proxy or a published status JSON). Otherwise honest 'unreachable' —
    the prototype host has no path to the k3d cluster, and we never fabricate."""
    status_url = status_url or os.environ.get("K9_UDS_STATUS_URL")
    if not status_url:
        return [{
            "id": "uds-core",
            "kind": "UDSPackage",
            "source": "unreachable",
            "reason": "no K9_UDS_STATUS_URL set; in-cluster CR status not reachable from prototype host",
        }]
    data, err = _get_json(status_url)
    if err or not data:
        return [{"id": "uds-core", "kind": "UDSPackage", "source": "unreachable", "reason": err}]
    items = data if isinstance(data, list) else data.get("packages", [data])
    out = []
    for it in items:
        phase = it.get("phase") or it.get("status")
        out.append({
            "id": it.get("name", "package"),
            "kind": "UDSPackage",
            "namespace": it.get("namespace"),
            "phase": phase,
            "healthy": phase in ("Ready", "Succeeded"),
            "source": "live",
        })
    return out


def fetch_receipts(base: str | None = None) -> dict:
    """Live a11oy honest posture / receipt head. Real source: a11oy Space."""
    base = (base or os.environ.get(
        "K9_A11OY_BASE", "https://szlholdings-a11oy.hf.space")).rstrip("/")
    data, err = _get_json(f"{base}/api/a11oy/v1/honest")
    if err or not data:
        return {"source": "unreachable", "reason": err, "base": base}
    return {"source": "live", "base": base, "doctrine_lock": data.get("doctrine_lock"),
            "honest_labels": data.get("honest_labels"), "organ": data.get("organ")}


def simulate_action_receipt(kind: str, resource_id: str, action: str) -> dict:
    """Show the receipt the GOVERNED backend WOULD emit for an ops action.
    Labelled SIMULATED — K9 holds no signing key, so this is a command
    demonstration, never a forged signature (doctrine)."""
    return {
        "status": "SIMULATED",
        "note": "command demonstration — K9 holds no signing key; the governed "
                "backend (a11oy receipts server, ECDSA-P256) emits the real signed receipt",
        "would_emit": {
            "kind": kind,
            "resource": resource_id,
            "action": action,
            "ts": int(time.time()),
            "signer": "a11oy-receipts (ECDSA-P256)",
            "envelope": "DSSE / SHA-256 hash-chained",
        },
    }


def k9_snapshot() -> dict:
    """One real-data snapshot across all resource kinds."""
    return {
        "ts": int(time.time()),
        "spaces": fetch_spaces(),
        "fleet": fetch_fleet(),
        "uds": fetch_uds(),
        "receipts": fetch_receipts(),
        "doctrine": {
            "locked_proven": 8,
            "locked_set": ["F1", "F4", "F7", "F11", "F12", "F18", "F19", "F22"],
            "locked_commit": "c7c0ba17",
            "lambda": "Conjecture 1 (unconditional uniqueness machine-checked false; conditional holds)",
            "khipu_bft_safety": "Conjecture 2 (Wave23 conditional safety theorem; unconditional open)",
            "real_data_only": True,
        },
    }


def build_router():
    """Return a FastAPI APIRouter if fastapi is available, else None.
    Mirrors a11oy serve.py: app.include_router(build_router())."""
    try:
        from fastapi import APIRouter, Query
    except Exception:
        return None

    router = APIRouter(prefix="/api/k9/v1", tags=["k9-ops"])

    @router.get("/snapshot")
    def _snapshot():
        return k9_snapshot()

    @router.get("/spaces")
    def _spaces():
        return {"items": fetch_spaces(), "kind": "Space"}

    @router.get("/fleet")
    def _fleet():
        return {"items": fetch_fleet(), "kind": "Repo"}

    @router.get("/uds")
    def _uds():
        return {"items": fetch_uds(), "kind": "UDSPackage"}

    @router.get("/receipts")
    def _receipts():
        return fetch_receipts()

    @router.get("/action")
    def _action(kind: str = Query(...), id: str = Query(...), action: str = Query(...)):
        return simulate_action_receipt(kind, id, action)

    return router


if __name__ == "__main__":
    snap = k9_snapshot()
    print(json.dumps(snap, indent=2))
