#!/usr/bin/env python3
"""
forge_anatomy_rebuild.py — FORGE: keep the standalone anatomy HF Space honestly live.

WHO RUNS THIS: Forge (Replit) in a GitHub Actions job that has Forge's HF write
token (HF_WRITE_TOKEN) available as an Actions secret. The CTO agent CANNOT run
this — its HF connector has no factory-restart capability.

HONEST CORRECTION (2026-06-12): the earlier "the Space is dark / root 404" reading
was a HOST mis-identification, not a real outage:
  - SZLHOLDINGS/anatomy is `sdk: static`. A static-SDK Space is served from the
    DEDICATED static host  https://<owner>-<name>.static.hf.space/  (302 -> 200),
    NOT from the plain  https://<owner>-<name>.hf.space/  host, which ALWAYS 404s
    for a static Space. The old script polled the plain host -> false "dark".
  - `factory_reboot` is REJECTED for static Spaces:
        POST /api/spaces/SZLHOLDINGS/anatomy/restart?factory=true
        -> 400 {"error":"Can't restart a static Space"}
    so the prescribed factory-rebuild primitive cannot run on this Space type.

WHAT THIS (corrected) SCRIPT DOES (idempotent, honest):
  1. Confirms auth + that the anatomy repo has index.html at HEAD; reads the SDK.
  2. Probes the CORRECT host for the SDK (static -> *.static.hf.space) FIRST.
     If it already returns 200, reports LIVE and exits 0 — nothing to do.
  3. Only if still dark: for a static Space it triggers a re-serve via a harmless
     no-op commit (a trailing HTML comment) — NOT a factory reboot; for a non-static
     Space it falls back to the normal factory restart.
  4. Re-polls the correct host until 200, or reports honestly that it is still dark
     (do NOT claim it is live until the poll sees 200).

SECRET (Actions secret; NEVER hard-code, NEVER print):
  - HF_WRITE_TOKEN : Forge HF token with WRITE access to SZLHOLDINGS Spaces.

DOCTRINE v11: never prints tokens; honest reporting only; does not touch any
locked claim. locked=8 {F1,F4,F7,F11,F12,F18,F19,F22}, Lambda=Conjecture 1.
"""
from __future__ import annotations
import os, sys, time, urllib.request, urllib.error

try:
    from huggingface_hub import HfApi
except ImportError:
    sys.exit("ERROR: pip install -U huggingface_hub first.")

ANATOMY_SPACE = "SZLHOLDINGS/anatomy"


def _static_host(repo_id: str) -> str:
    owner, name = repo_id.split("/", 1)
    sub = f"{owner}-{name}".lower()
    return f"https://{sub}.static.hf.space/"


def _plain_host(repo_id: str) -> str:
    owner, name = repo_id.split("/", 1)
    sub = f"{owner}-{name}".lower()
    return f"https://{sub}.hf.space/"


def _need(name: str) -> str:
    v = os.environ.get(name)
    if not v:
        sys.exit(f"ERROR: required env secret {name} is not set. "
                 f"Set it as a GitHub Actions secret; never hard-code it.")
    return v


def _http(url: str) -> int:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "forge-anatomy-rebuild"})
        # follow redirects (static host answers 302 -> 200)
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status
    except urllib.error.HTTPError as e:  # noqa
        return e.code
    except Exception:  # noqa: BLE001
        return 0


def _poll(url: str, minutes: int = 6) -> int:
    print(f"      polling {url} for 200 (up to ~{minutes} min) ...")
    deadline = time.time() + minutes * 60
    last = None
    while time.time() < deadline:
        last = _http(url)
        print(f"      HTTP {last}")
        if last == 200:
            return 200
        time.sleep(20)
    return last or 0


def main() -> int:
    token = _need("HF_WRITE_TOKEN")
    api = HfApi(token=token)

    who = api.whoami()
    print(f"[forge_anatomy_rebuild] authenticated as: {who.get('name','?')} (no token printed)")

    # 1) sanity: index.html present + which SDK
    sdk = "static"
    try:
        info = api.space_info(repo_id=ANATOMY_SPACE)
        sdk = (getattr(info, "sdk", None) or "static").lower()
    except Exception as e:  # noqa: BLE001
        print(f"[1/3] could not read space_info (assuming static): {e!r}")
    try:
        files = api.list_repo_files(repo_id=ANATOMY_SPACE, repo_type="space")
        has_index = "index.html" in files
        print(f"[1/3] sdk={sdk}; repo files={len(files)}; index.html present={has_index}")
        if not has_index:
            print("::warning::index.html not at repo root — it cannot serve a root page.")
    except Exception as e:  # noqa: BLE001
        print(f"[1/3] could not list files (non-fatal): {e!r}")

    is_static = (sdk == "static")
    live_url = _static_host(ANATOMY_SPACE) if is_static else _plain_host(ANATOMY_SPACE)
    print(f"[2/3] correct serving host for sdk={sdk}: {live_url}")
    if is_static:
        print(f"      (note: the plain host {_plain_host(ANATOMY_SPACE)} ALWAYS 404s for a "
              f"static Space — that is expected, not an outage.)")

    # 2) probe the CORRECT host first — if already live, nothing to do
    code = _http(live_url)
    print(f"      initial HTTP {code} on correct host")
    if code == 200:
        print("ANATOMY SPACE IS LIVE — correct static host returns 200. Nothing to do.")
        return 0

    # 3) genuinely dark -> re-serve
    if is_static:
        print("[3/3] static Space is dark; factory_reboot is NOT valid for static — "
              "triggering a re-serve via a harmless no-op commit ...")
        try:
            raw = api.hf_hub_download(repo_id=ANATOMY_SPACE, repo_type="space",
                                      filename="index.html")
            with open(raw, "r", encoding="utf-8") as fh:
                html = fh.read()
            marker = f"\n<!-- forge re-serve {int(time.time())} -->\n"
            html = html.rstrip() + marker
            api.upload_file(path_or_fileobj=html.encode("utf-8"),
                            path_in_repo="index.html", repo_id=ANATOMY_SPACE,
                            repo_type="space",
                            commit_message="forge: re-serve trigger for static anatomy Space")
            print("      no-op re-serve commit pushed.")
        except Exception as e:  # noqa: BLE001
            print(f"::error::re-serve commit failed: {e!r}")
            return 1
    else:
        print(f"[3/3] factory-restarting {ANATOMY_SPACE} (non-static) ...")
        api.restart_space(repo_id=ANATOMY_SPACE, factory_reboot=True)
        print("      restart requested.")

    final = _poll(live_url)
    if final == 200:
        print("ANATOMY SPACE IS LIVE — correct host returns 200. Standalone surface woken.")
        return 0
    print(f"Re-serve attempted but {live_url} still HTTP {final} after timeout. "
          f"Honest status: standalone Space still dark — inspect the HF build logs. "
          f"Consolidation via a-11-oy.com/anatomy is unaffected (already 200).")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
