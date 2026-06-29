#!/usr/bin/env python3
"""
forge_hf_activate.py — FORGE: run this in GitHub Actions to make Chaski LIVE + wake dark Spaces.

WHO RUNS THIS: Forge (Replit), in a GitHub Actions job that has Forge's own
Hugging Face write token available as an Actions secret. The CTO agent CANNOT
run this — its HF connector has no set-secret capability. This is the honest,
reproducible way to do the one step only Forge can do.

WHAT IT DOES (idempotent):
  1. Sets the inference secret HF_TOKEN on the a11oy Space (Chaski's brain).
  2. Factory-restarts the a11oy Space so it picks up a11oy main, which now
     includes PR #308 (runtime token resolution) — without that the orchestrator
     stays stub even with the token.
  3. Restarts the anatomy Space (currently 404 dark) to wake it.
  4. Polls /api/a11oy/v1/code/health until the brain is live (inference hf-router,
     mode generative/live), or reports honestly.

SECRETS THIS SCRIPT READS FROM THE ENVIRONMENT (set as Actions secrets,
NEVER hard-code, NEVER print):
  - HF_WRITE_TOKEN   : Forge's HF token with WRITE access to the SZLHOLDINGS
                       Spaces (authenticates the management calls below).
  - CHASKI_HF_TOKEN  : the HF Router INFERENCE token to INSTALL as the Space's
                       HF_TOKEN secret (may equal HF_WRITE_TOKEN if it also has
                       inference scope; prefer a scoped inference token).

DOCTRINE v11: never prints any token; the no-key path stays an honest stub;
Lambda = Conjecture 1; locked-proven = 8; SLSA L1 honest. Open-weight self-run
brain (router.huggingface.co, Qwen/Qwen2.5-Coder-32B-Instruct) — matches the moat.
"""
from __future__ import annotations
import os, sys, time, json, urllib.request

try:
    from huggingface_hub import HfApi
except ImportError:
    sys.exit("ERROR: pip install -U huggingface_hub first.")

A11OY_SPACE   = "SZLHOLDINGS/a11oy"
ANATOMY_SPACE = "SZLHOLDINGS/anatomy"
HEALTH_URL    = "https://a-11-oy.com/api/a11oy/v1/code/health"
SECRET_NAME   = "HF_TOKEN"  # Chaski also accepts HUGGING_FACE_HUB_TOKEN / HF_ROUTER_TOKEN / etc.


def _need(name: str) -> str:
    v = os.environ.get(name)
    if not v:
        sys.exit(f"ERROR: required env secret {name} is not set. "
                 f"Set it as a GitHub Actions secret; never hard-code it.")
    return v


def main() -> int:
    write_token   = _need("HF_WRITE_TOKEN")     # authenticates management calls
    inference_tok = _need("CHASKI_HF_TOKEN")    # installed as the Space's HF_TOKEN
    api = HfApi(token=write_token)

    who = api.whoami()
    print(f"[forge_hf_activate] authenticated as: {who.get('name','?')} (no token printed)")

    print(f"[1/4] setting secret {SECRET_NAME} on {A11OY_SPACE} (value hidden) ...")
    api.add_space_secret(
        repo_id=A11OY_SPACE,
        key=SECRET_NAME,
        value=inference_tok,
        description="HF Router inference token for a11oy Code (Chaski). Open-weight self-run brain.",
    )
    print("      done.")

    print(f"[2/4] factory-restarting {A11OY_SPACE} (pull main incl. PR #308) ...")
    api.restart_space(repo_id=A11OY_SPACE, factory_reboot=True)
    print("      restart requested.")

    print(f"[3/4] restarting {ANATOMY_SPACE} (waking dark Space) ...")
    try:
        api.restart_space(repo_id=ANATOMY_SPACE, factory_reboot=True)
        print("      restart requested.")
    except Exception as e:  # noqa: BLE001
        print(f"      anatomy restart skipped/failed (non-fatal): {e!r}")

    print("[4/4] polling Chaski health for live brain "
          "(inference:hf-router, mode generative/live; up to ~8 min for rebuild) ...")
    deadline = time.time() + 8 * 60
    last = None
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(HEALTH_URL, timeout=20) as r:
                d = json.loads(r.read().decode("utf-8", "replace"))
            last = (d.get("mode"), d.get("inference"))
            print(f"      mode={last[0]} inference={last[1]}")
            if last[1] == "hf-router" and last[0] in ("live", "generative"):
                print(f"CHASKI IS LIVE -- mode:{last[0]} inference:hf-router, brain wired. "
                      "Run one coding turn to confirm a real model answer + signed receipt.")
                return 0
        except Exception as e:  # noqa: BLE001
            print(f"      (health not ready yet: {e!r})")
        time.sleep(20)

    print(f"Secret set + restarts requested, but health still shows {last} after timeout. "
          f"Honest status: NOT yet live -- check the a11oy Space build logs on HF. "
          f"Do NOT claim live until /code/health reports inference:hf-router "
          f"with mode generative or live.")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
