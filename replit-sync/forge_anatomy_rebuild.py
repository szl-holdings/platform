#!/usr/bin/env python3
"""
forge_anatomy_rebuild.py — FORGE: wake the dark standalone anatomy HF Space.

WHO RUNS THIS: Forge (Replit) in a GitHub Actions job that has Forge's HF write
token (HF_WRITE_TOKEN) available as an Actions secret. The CTO agent CANNOT run
this — its HF connector has no factory-restart capability.

THE PROBLEM (honest):
  - The standalone Space SZLHOLDINGS/anatomy is RUNNING (runtime stage=RUNNING,
    sdk=static) and the repo DOES contain index.html + app.js + data.js + style.css,
    but the root returns 404 — a static-serve glitch where the running build is not
    actually serving the committed files. A factory rebuild forces it to re-pull and
    re-serve from the repo HEAD.
  - NOTE: the anatomy *consolidation* is already LIVE — https://a11oy.net/anatomy
    returns 200 (anatomy instilled into a11oy, as designed). The standalone Space is
    a secondary/redundant surface; this script just makes it stop being dark.

WHAT IT DOES (idempotent):
  1. Confirms auth + that the anatomy repo has an index.html at HEAD.
  2. Factory-restarts SZLHOLDINGS/anatomy.
  3. Polls the Space root until it returns 200, or reports honestly that it is
     still dark (do NOT claim it is live until the poll sees 200).

SECRET (Actions secret; NEVER hard-code, NEVER print):
  - HF_WRITE_TOKEN : Forge HF token with WRITE access to SZLHOLDINGS Spaces.

DOCTRINE v11: never prints tokens; honest reporting only; does not touch any
locked claim. locked=8, Lambda=Conjecture 1.
"""
from __future__ import annotations
import os, sys, time, urllib.request

try:
    from huggingface_hub import HfApi
except ImportError:
    sys.exit("ERROR: pip install -U huggingface_hub first.")

ANATOMY_SPACE = "SZLHOLDINGS/anatomy"
ROOT_URL = "https://szlholdings-anatomy.hf.space/"


def _need(name: str) -> str:
    v = os.environ.get(name)
    if not v:
        sys.exit(f"ERROR: required env secret {name} is not set. "
                 f"Set it as a GitHub Actions secret; never hard-code it.")
    return v


def _http(url: str) -> int:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "forge-anatomy-rebuild"})
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status
    except urllib.error.HTTPError as e:  # noqa
        return e.code
    except Exception:  # noqa: BLE001
        return 0


def main() -> int:
    token = _need("HF_WRITE_TOKEN")
    api = HfApi(token=token)

    who = api.whoami()
    print(f"[forge_anatomy_rebuild] authenticated as: {who.get('name','?')} (no token printed)")

    # 1) sanity: index.html present at HEAD
    try:
        files = api.list_repo_files(repo_id=ANATOMY_SPACE, repo_type="space")
        has_index = "index.html" in files
        print(f"[1/3] anatomy repo files: {len(files)} found; index.html present={has_index}")
        if not has_index:
            print("::warning::index.html not at repo root — a rebuild won't serve a root page. "
                  "Check the Space's app_file / static layout before claiming it serves.")
    except Exception as e:  # noqa: BLE001
        print(f"[1/3] could not list files (non-fatal): {e!r}")

    # 2) factory rebuild
    print(f"[2/3] factory-restarting {ANATOMY_SPACE} ...")
    api.restart_space(repo_id=ANATOMY_SPACE, factory_reboot=True)
    print("      restart requested.")

    # 3) poll root for 200
    print("[3/3] polling anatomy Space root for 200 (up to ~6 min for static rebuild) ...")
    deadline = time.time() + 6 * 60
    last = None
    while time.time() < deadline:
        last = _http(ROOT_URL)
        print(f"      root HTTP {last}")
        if last == 200:
            print("ANATOMY SPACE IS LIVE — root returns 200. Standalone surface woken.")
            return 0
        time.sleep(20)
    print(f"Restart requested but root still HTTP {last} after timeout. "
          f"Honest status: standalone Space still dark — inspect the HF build logs "
          f"(it may need app_file set or the static SDK config corrected). "
          f"Consolidation via a11oy.net/anatomy is unaffected (already 200).")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
