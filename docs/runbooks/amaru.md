# RUNBOOK — amaru (Cortex Memory / Conduit)

**Doctrine v11 — 749 / 14 / 163 — replay hash c7c0ba17**
**Maintained by:** Yachay (yachay@szlholdings.dev)
**Last updated:** 2026-06-02

---

## Overview

`amaru` is the **cortex memory and reasoner**: every inference cites its source; every memory carries its receipt. It exposes `/healthz`, `/sign`, `/tick`, `/unay/*` (LMDB memory), and `/viz/*` (SPA).

HF Space: <https://huggingface.co/spaces/SZLHOLDINGS/amaru>
GitHub: <https://github.com/szl-holdings/amaru>

---

## Incident: Service Is Down

**Symptoms:** HF Space shows "Building" or "Error"; `/healthz` times out.

**Debug steps (in order):**

1. **Check HF Space stage**
   - Go to <https://huggingface.co/spaces/SZLHOLDINGS/amaru> → "Logs" tab.
   - Stage `building`: wait up to 10 min; review Docker build log for Python errors.
   - Stage `runtime error`: check for LMDB or memory errors; factory restart only if log shows recoverable crash.

2. **Check Docker build logs**
   - Locate `Step N/M` lines.
   - Common failure: `pip install` timeout on large model weights. amaru may download embedding model at build time; ensure `TRANSFORMERS_CACHE` points to a layer-cached path or pre-download weights.

3. **Check Dockerfile COPY lines**
   - `COPY requirements.txt .` must precede `RUN pip install -r requirements.txt`.
   - `COPY . /app` must follow the pip layer to exploit Docker layer caching.
   - Missing COPY of `seed_data/` or `models/` directories causes runtime `FileNotFoundError`.

4. **Check model loading**
   - If amaru loads a local model at startup, confirm the model path is correct and the file exists in the COPY tree. Add `RUN ls -la /app/models/` as a diagnostic Dockerfile step during debugging.

5. **Escalate** — Page oncall if unresolved in 30 min.

---

## Incident: `/healthz` Returning Wrong Doctrine Numbers

**Symptoms:** `/healthz` JSON shows values other than `declarations: 749, axioms: 14, sorries: 163`.

**Fix steps:**

1. Locate the doctrine constant in `serve.py` or `app/health.py`.
2. Set exactly:
   ```python
   DOCTRINE = {"declarations": 749, "axioms": 14, "sorries": 163, "replay_hash": "c7c0ba17"}
   ```
3. Raise PR titled `fix(healthz): doctrine numbers 749/14/163 — Doctrine v11`.
4. After merge, confirm: `curl https://SZLHOLDINGS-amaru.hf.space/healthz | jq .doctrine`.

---

## Incident: Signing Endpoint Returning PLACEHOLDER

**Symptoms:** `POST /sign` or `/tick` returns `{"receipt": "PLACEHOLDER"}`.

**What to check:**

1. **Key env var** — HF Space Settings → "Variables and secrets": confirm `WIRE_D_SIGNING_KEY` is set and non-empty.
2. **`szl_dsse` module loaded** — Check build log. If `import szl_dsse` fails, signing falls back to stub. Add `szl-dsse` to `requirements.txt`.
3. **Key format** — Ed25519 private key, base64-encoded. Truncation or wrong encoding → PLACEHOLDER fallback.
4. **Tick endpoint** — amaru's `/tick` wraps signing; confirm `szl_dsse.sign()` is called and not `_sign_stub()`.

---

## Incident: Wire D Verification Failing

**Symptoms:** Receipts from amaru are rejected by a11oy or sentra with "pubkey mismatch".

**Debug:**

1. **Pubkey fingerprint check**:
   ```bash
   echo "$WIRE_D_PUBKEY" | base64 -d | sha256sum
   ```
   Compare to pinned value in `packages/wire-d/pubkeys/amaru.pub.sha256`.

2. **Chain replay** — amaru receipts carry `prev_hash`. After a redeploy, if the chain counter resets, replay fails. Re-anchor with `CHAIN_ANCHOR_HASH` env pointing to the last known-good receipt hash.

3. **Clock skew** — Check `date -u` in HF terminal; receipts with `ts` >30s from verifier's clock fail. Ensure HF Space NTP is synced (it usually is; if not, factory restart).

---

## Incident: `/viz/*` Returning SPA Shell (Blank Page)

**Debug:**

1. **Dockerfile COPY check** — Confirm the SPA build output is copied:
   ```dockerfile
   COPY --chown=user:user apps/amaru-ui/dist /app/static
   ```
2. **Route order** — Static mount must be after API routes in `serve.py`.
3. **Build step** — Confirm `pnpm build` runs in CI before `docker build`.

---

## Incident: Unay LMDB Persistence Broken

**Symptoms:** Memory stored in `/unay/store` lost after restart; or `MDB_MAP_FULL` error.

**Debug:**

1. **Disk space check** — HF Space Settings → "Persistent storage". Enable if not already. Set `LMDB_PATH=/data/unay.lmdb`.

2. **Environment registry conflict** — Run with `--workers 1` (uvicorn) to prevent multiple writers. LMDB allows multiple readers but only one writer per environment.

3. **Map size** — Increase if `MDB_MAP_FULL`:
   ```python
   env = lmdb.open(path, map_size=4 * 1024 ** 3)  # 4 GB
   ```

4. **Corruption check** — If LMDB is corrupt after unclean shutdown, run:
   ```bash
   python -c "import lmdb; lmdb.open('/data/unay.lmdb').begin().cursor().count()"
   ```
   If this raises `lmdb.Error`, the environment must be deleted and rebuilt from receipts.

---

## Common HF Space Build Errors

| Error | Fix |
|---|---|
| `ERROR: Could not find a version that satisfies the requirement szl_dsse` | Check package name / private index URL |
| `OSError: [Errno 28] No space left on device` | Add `.dockerignore` excluding model weights; use `--no-cache-dir` |
| `CUDA error: no kernel image is available` | amaru runs CPU-only on HF free tier; set `DEVICE=cpu` env |
| `lmdb.Error: mdb_env_open: No such file or directory` | Set `LMDB_PATH` env or create the directory in Dockerfile |
| Space stuck in "Building" >15 min | Push empty commit to force fresh build |
| `uvicorn: command not found` | Add `uvicorn[standard]` to `requirements.txt` |

---

*Co-Authored-By: Perplexity Computer Agent*
*Doctrine v11 — 749/14/163 — c7c0ba17*
