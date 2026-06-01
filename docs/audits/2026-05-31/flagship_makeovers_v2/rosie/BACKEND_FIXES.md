# rosie — Backend Fix (THE real root-cause fix)

## Smoke test result: BROKEN — whole Space was down (RUNTIME_ERROR)
rosie was the **only** flagship whose smoke test revealed a genuinely broken endpoint: the entire
Space was in **RUNTIME_ERROR** (the app crashed on boot, so `/` and all `/api/rosie/*` and `/v1/*`
routes were unreachable).

## Root cause (not a bandaid)
Two compounding defects in the boot path:

1. **Missing module in the image.** `app.py` (~line 1133) did `import szl_provenance`. The
   Dockerfile never `COPY`-ed `szl_provenance.py` (nor its dependency `szl_dsse.py`) into the
   image, so the import failed at runtime.
2. **NameError masking the real error.** The `except` handler for that import did
   `print(..., file=sys.stderr)` — but `sys` was **never imported at module scope**. So the
   handler itself raised `NameError`, the process exited 1, and the Space stayed in RUNTIME_ERROR
   with a misleading trace.

## Fix (root-cause, additive)
1. Added module-level `import sys` to `app.py` (so the error path can no longer raise NameError).
2. Added `COPY szl_provenance.py szl_dsse.py` to the Dockerfile so the modules exist in the image.
   (`cryptography`, their dependency, was already in `requirements.txt` — no new dep added.)

A sibling agent independently applied the same Dockerfile `COPY` fix (reordered); the two are
compatible and additive.

## Result
rosie now boots and is **RUNNING** with no error. Routes verified GREEN after the fix:
- `GET /` → HTTP 200 (Gradio console)
- `GET /api/rosie/healthz` → 200
- `GET /api/a11oy/healthz` → 200 (cross-organ helper preserved)

### Honest note on `/v1/gates`
- `GET /v1/gates` → 404 on rosie. This route **never existed** on rosie (it is an a11oy route) —
  not a regression from this fix. Listed for an unambiguous diff.

File-count delta from the fix: net additive (modules now present); zero deletions.
