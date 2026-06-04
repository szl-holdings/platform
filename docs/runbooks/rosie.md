# RUNBOOK — rosie (Cross-Session Memory / Aide)

**Doctrine v11 — 749 / 14 / 163 — replay hash c7c0ba17**
**Maintained by:** Yachay (yachay@szlholdings.dev)
**Last updated:** 2026-06-02

---

## Overview

`rosie` is the **cross-session memory + operator console**: human-facing UI for verdicts and the live receipt stream; persistent memory carries provenance across sessions. Wire C live to a11oy. Also exposes the Chaski escalation endpoint and GDPR Article 17 erasure surface.

HF Space: <https://huggingface.co/spaces/SZLHOLDINGS/rosie>
GitHub: <https://github.com/szl-holdings/rosie>

---

## Incident: Service Is Down

**Symptoms:** HF Space shows "Building" or "Error"; `/healthz` or the operator UI times out.

**Debug steps (in order):**

1. **Check HF Space stage**
   - Go to <https://huggingface.co/spaces/SZLHOLDINGS/rosie> → "Logs" tab.
   - `building`: check Docker build log; rosie may fail if the UI bundle is missing.
   - `runtime error`: look for LMDB open failure or Wire C connection error at startup.

2. **Check Docker build logs**
   - Confirm the UI build step ran (`pnpm build` or `npm run build`) before the Docker COPY.
   - Confirm `COPY --chown=user:user dist/ /app/static/`.

3. **Check Dockerfile COPY lines**
   - rosie serves both the API (`/api/*`) and the SPA console (`/viz/*` or `/`).
   - Both `serve.py` and `static/` must be copied:
     ```dockerfile
     COPY --chown=user:user . /app
     COPY --chown=user:user apps/rosie-ui/dist /app/static
     ```
   - Duplicate or missing COPY lines cause silent partial failures.

4. **Wire C to a11oy** — If `A11OY_ENDPOINT` is not set, rosie starts but receipt streaming fails silently. Confirm the env var is set in HF Secrets.

5. **Escalate** — Page oncall.

---

## Incident: `/healthz` Returning Wrong Doctrine Numbers

**Fix steps:**

1. Locate the doctrine constant in `serve.py`.
2. Set exactly:
   ```python
   DOCTRINE = {"declarations": 749, "axioms": 14, "sorries": 163, "replay_hash": "c7c0ba17"}
   ```
3. PR: `fix(healthz): doctrine numbers 749/14/163 — Doctrine v11`.
4. Verify: `curl https://SZLHOLDINGS-rosie.hf.space/healthz | jq .doctrine`.

---

## Incident: Signing Endpoint Returning PLACEHOLDER

**Symptoms:** `POST /sign` or `/api/rosie/v2/unay/erase` returns `{"receipt": "PLACEHOLDER"}`.

**What to check:**

1. **Key env var** — HF Secrets: `WIRE_D_SIGNING_KEY` set and non-empty.
2. **`szl_dsse` module** — Build log: `import szl_dsse` must succeed.
3. **Chaski endpoint** — `POST /api/rosie/v2/chaski/escalate` also signs receipts. If it returns PLACEHOLDER, same root cause.
4. **GDPR erase handler** — `/api/rosie/v2/unay/erase` must sign the deletion acknowledgement receipt even when no data exists to erase. If signing is broken, the erase endpoint returns an unsigned receipt — this is a compliance gap. Fix signing key first.

---

## Incident: Wire D Verification Failing

**Symptoms:** a11oy or sentra rejects rosie receipts.

**Debug:**

1. **Pubkey fingerprint**:
   ```bash
   echo "$WIRE_D_PUBKEY" | base64 -d | sha256sum
   ```
   Compare to `packages/wire-d/pubkeys/rosie.pub.sha256`.

2. **Chain replay** — Re-anchor with `CHAIN_ANCHOR_HASH` after redeploy.

3. **Wire C link** — rosie uses Wire C (not Wire D directly) for a11oy communication. Confirm `WIRE_C_ENDPOINT` env is set to the a11oy Wire C ingress URL.

---

## Incident: `/viz/*` Returning SPA Shell (Blank Page)

**Debug:**

1. **Dockerfile COPY**:
   ```dockerfile
   COPY --chown=user:user apps/rosie-ui/dist /app/static
   ```
2. **Route order** — In `serve.py`, `/api` routes before static mount.
3. **Receipt stream** — If the console loads but receipt feed is empty, check that the WebSocket or SSE endpoint `/api/receipts/stream` is running. It requires `A11OY_ENDPOINT` to be set.

---

## Incident: Unay LMDB Persistence Broken

**Symptoms:** Cross-session memory lost after restart; or GDPR erase writes fail.

**Debug:**

1. **Persistent storage** — Enable in HF Settings. `LMDB_PATH=/data/rosie.lmdb`.
2. **Single-writer** — `--workers 1`.
3. **GDPR erase path** — The erase handler writes a deletion receipt to LMDB. If LMDB is broken, the erase returns 500. Fix LMDB first; the receipt must be persisted for GDPR Article 17 compliance.
4. **Map size** — Rosie stores operator session memory; start at 4 GB:
   ```python
   env = lmdb.open(path, map_size=4 * 1024 ** 3)
   ```

---

## Common HF Space Build Errors

| Error | Fix |
|---|---|
| `COPY failed: dist/ not found` | Run `pnpm build` in CI before docker build; check `.dockerignore` doesn't exclude `dist/` |
| `ModuleNotFoundError: No module named 'szl_dsse'` | Add `szl-dsse` to `requirements.txt` |
| Wire C connection refused | Confirm `A11OY_ENDPOINT` secret; a11oy may be cold-starting |
| WebSocket handshake timeout | HF free Spaces have 60s timeout; ensure SSE stream keepalive is sent every 30s |
| Space stuck in "Building" >15 min | Push empty commit to trigger rebuild |

---

*Co-Authored-By: Perplexity Computer Agent*
*Doctrine v11 — 749/14/163 — c7c0ba17*
