# RUNBOOK — a11oy (Brand Orchestration / Governance Layer)

**Doctrine v11 — 749 / 14 / 163 — replay hash c7c0ba17**
**Maintained by:** Yachay (yachay@szlholdings.dev)
**Last updated:** 2026-06-02

---

## Overview

`a11oy` is the **governance layer**: every action in the SZL mesh is signed, gated through the Λ-aggregator, and emits a DSSE-enveloped receipt. It exposes `/healthz`, `/sign`, `/viz/*` (SPA), and Wire D endpoints.

HF Space: <https://huggingface.co/spaces/SZLHOLDINGS/a11oy>
GitHub: <https://github.com/szl-holdings/a11oy>

---

## Incident: Service Is Down

**Symptoms:** HF Space shows "Building" or "Error" banner; `/healthz` returns 5xx or times out.

**Debug steps (in order):**

1. **Check HF Space stage**
   - Go to <https://huggingface.co/spaces/SZLHOLDINGS/a11oy> → "Logs" tab.
   - If stage is `building`: wait up to 10 min; check Docker build log for Python import errors.
   - If stage is `runtime error`: click "Factory restart" only if the log shows a recoverable crash.

2. **Check Docker build logs**
   - In the HF Logs tab, look for lines beginning `Step N/M`.
   - Common failures: `pip install` network timeout → retry build; missing system library → add `apt-get install` to Dockerfile.

3. **Check Dockerfile COPY lines**
   - Confirm `COPY . /app` appears before `RUN pip install`.
   - Confirm `COPY --chown=user:user . /app` if the Space uses a non-root user.
   - Missing `COPY` of `requirements.txt` before `RUN pip install -r requirements.txt` causes a build cache miss that silently uses a stale layer.

4. **Check `requirements.txt` / `pyproject.toml`**
   - Ensure `szl_dsse`, `wire_d`, and `fastapi` are pinned. Unpinned deps cause non-deterministic failures.

5. **Escalate**
   - If none of the above resolves within 30 min, page oncall via ONCALL.md.

---

## Incident: `/healthz` Returning Wrong Doctrine Numbers

**Symptoms:** `/healthz` JSON shows `declarations`, `axioms`, or `sorries` values that do not match **749 / 14 / 163**.

**Fix steps:**

1. Open `serve.py` (or `app/health.py`). Locate the `DOCTRINE` dict or inline literal.
2. Correct to exactly:
   ```python
   DOCTRINE = {"declarations": 749, "axioms": 14, "sorries": 163, "replay_hash": "c7c0ba17"}
   ```
3. Do **not** change `serve.py` logic in this wave (docs-only wave). File a PR to the `a11oy` repo targeting `main` with commit message:
   `fix(healthz): doctrine numbers 749/14/163 — Doctrine v11`
4. After merge, trigger a Space rebuild (push to `main` or use "Restart Space").
5. Verify: `curl https://SZLHOLDINGS-a11oy.hf.space/healthz | jq .doctrine`.

---

## Incident: Signing Endpoint Returning PLACEHOLDER

**Symptoms:** `POST /sign` returns `{"receipt": "PLACEHOLDER"}` or an empty envelope.

**What to check:**

1. **Key env var** — In HF Space Settings → "Variables and secrets", confirm `WIRE_D_SIGNING_KEY` (or `SZL_DSSE_KEY`) is set and not empty. Do not log the value.
2. **`szl_dsse` module loaded** — Check build log for `import szl_dsse` error. If the import fails silently, signing degrades to a stub. Fix: ensure `szl-dsse` is in `requirements.txt`.
3. **Key format** — The signing key must be a base64-encoded Ed25519 private key. A truncated or mis-encoded key causes silent fallback to the PLACEHOLDER path.
4. Confirm the signing path in `serve.py` calls `szl_dsse.sign(payload, key)` and not the stub `_sign_stub()`.

---

## Incident: Wire D Verification Failing

**Symptoms:** Downstream service (sentra, rosie) rejects a receipt from a11oy with "pubkey mismatch" or "chain replay invalid".

**Debug:**

1. **Pubkey fingerprint check** — Run:
   ```bash
   echo "$WIRE_D_PUBKEY" | base64 -d | sha256sum
   ```
   Compare against the pinned fingerprint in `docs/trust/SENTRA-02-incident-response-runbook.md` and `packages/wire-d/pubkeys/a11oy.pub.sha256`.

2. **Chain replay** — The receipt `prev_hash` must match the `hash` of the prior receipt in sequence. If a deployment reset the sequence counter, receipts will fail replay until the counter is re-anchored.
   - Fix: call `POST /sign/reset-chain` (if exposed) or re-deploy with `CHAIN_ANCHOR_HASH` env set to the last known good hash.

3. **Clock skew** — Wire D receipts include a `ts` field. If server clock is >30s off, verification fails. Check `date -u` on the HF runtime (via the terminal tab).

---

## Incident: `/viz/*` Returning SPA Shell (Blank Page)

**Symptoms:** Navigating to `/viz/receipts` or any sub-route returns the index HTML but with no data rendered; React shows a blank or spinner.

**Debug:**

1. **Dockerfile COPY check** — Confirm:
   ```dockerfile
   COPY --chown=user:user apps/a11oy-ui/dist /app/static
   ```
   If the `dist/` directory was not built before the Docker layer ran, the SPA assets are missing.

2. **Route order check** — In `serve.py` (FastAPI), static mounts must come **after** API routes:
   ```python
   app.mount("/viz", StaticFiles(directory="static", html=True), name="spa")
   ```
   If `/viz` is mounted before `/api`, API calls are intercepted by the static handler.

3. **Build step** — Confirm CI runs `pnpm build` in the UI package before `docker build`. Check `.github/workflows/ci.yml` for the build step.

---

## Incident: Unay LMDB Persistence Broken

**Symptoms:** `POST /unay/store` succeeds but data is lost after Space restart; or LMDB open fails with `MDB_MAP_FULL`.

**Debug:**

1. **Disk space check** — HF Spaces have a persistent disk only if enabled under Space settings. Go to Settings → "Persistent storage". If not enabled, all writes are ephemeral. Enable persistent storage and set `LMDB_PATH` to the persistent mount path (e.g., `/data/unay.lmdb`).

2. **Environment registry conflict** — If two processes open the same LMDB environment, the second gets `MDB_READERS_FULL`. Ensure only one worker process runs: set `--workers 1` in the uvicorn startup command or use `SINGLE_PROCESS=1`.

3. **Map size** — If the LMDB map is full, increase `map_size` in the env constructor:
   ```python
   env = lmdb.open(path, map_size=2 * 1024 ** 3)  # 2 GB
   ```

---

## Common HF Space Build Errors

| Error | Fix |
|---|---|
| `ERROR: Could not find a version that satisfies the requirement szl_dsse` | Add correct package name or private index URL to `requirements.txt` |
| `COPY failed: file not found in build context` | The referenced file/dir doesn't exist at Dockerfile path; check relative path |
| `Permission denied: /app/...` | Add `--chown=user:user` to COPY or run `RUN chmod -R 755 /app` |
| `uvicorn: command not found` | `uvicorn` not in `requirements.txt`; add it |
| `ModuleNotFoundError: No module named 'app'` | `WORKDIR /app` must be set before `CMD ["uvicorn", "app.serve:app"]` |
| Space stuck in "Building" >15 min | Likely a hung pip install; push an empty commit to force rebuild |
| `OSError: [Errno 28] No space left on device` | Reduce Docker image size; use `--no-cache-dir` in pip; add `.dockerignore` |

---

*Co-Authored-By: Perplexity Computer Agent*
*Doctrine v11 — 749/14/163 — c7c0ba17*
