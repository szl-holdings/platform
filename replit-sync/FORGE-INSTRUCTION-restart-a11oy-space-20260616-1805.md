# FORGE — FACTORY-RESTART the a11oy HF Space (stuck BUILD_ERROR)

The SZLHOLDINGS/a11oy HF Space is stuck in BUILD_ERROR on the HF builder (transient cache/429/timeout on a ~119-layer per-file COPY image). This is NOT a code problem:
- GitHub Container build + Dockerfile build-file guard are GREEN at main HEAD.
- All Dockerfile COPY source files DO exist in the Space repo (verified via resolve/main/ = 307).
- The box a11oy.net is fully live + current on this HEAD (deploys from GitHub directly, independent of the Space).

ACTION: factory-rebuild the Space so the HF builder retries clean:
  POST https://huggingface.co/api/spaces/SZLHOLDINGS/a11oy/restart?factory=true
  (Authorization: Bearer $CUSTOM_CRED_HUGGINGFACE_CO_TOKEN — Forge has the authed HF session the interactive agent's bash token lacks.)
Then poll runtime.stage until RUNNING (re-try the factory restart ONCE more if it errors again — HF builder flakes on this image). PROVE: GET https://szlholdings-a11oy.hf.space/console -> 200, and /materials + /immune + /api/a11oy/v1/khipu/verify reachable on the Space.

DOCTRINE: recovery restart to last-good build = healing, allowed even near freeze. No code change. Never fake RUNNING — only report done when stage==RUNNING and /console==200.
