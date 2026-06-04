# RUNBOOK — sentra (Immune System)

**Doctrine v11 — 749 / 14 / 163 — replay hash c7c0ba17**
**Maintained by:** Yachay (yachay@szlholdings.dev)
**Last updated:** 2026-06-02

---

## Overview

`sentra` is the **policy immune system**: deny by default, allow with proof. Eight gates evaluate every action. Egress inspector + tripwires live. Wire B live to a11oy.

HF Space: <https://huggingface.co/spaces/SZLHOLDINGS/sentra>
GitHub: <https://github.com/szl-holdings/sentra>

---

## Incident: Service Is Down

**Symptoms:** HF Space shows "Building" or "Error"; `/healthz` times out or returns 5xx.

**Debug steps (in order):**

1. **Check HF Space stage**
   - Go to <https://huggingface.co/spaces/SZLHOLDINGS/sentra> → "Logs" tab.
   - `building`: wait up to 10 min. Check for Python import errors or missing dependencies.
   - `runtime error`: look for gate initialization failure (sentra loads 8 gate modules at startup).

2. **Check Docker build logs**
   - `Step N/M` lines in the build log.
   - Gate modules (`gate_0` through `gate_7`) must be importable. A missing `__init__.py` in a gate subdirectory causes `ModuleNotFoundError`.

3. **Check Dockerfile COPY lines**
   - Confirm:
     ```dockerfile
     COPY --chown=user:user gates/ /app/gates/
     COPY --chown=user:user serve.py /app/serve.py
     ```
   - If `gates/` is not copied, all 8 gate imports fail at startup.

4. **Check gate initialization order**
   - Gates are initialized sequentially at startup. If gate_3 (policy eval) fails, gates 4–7 may not load. Check the log for the first `FAILED to load gate_N`.

5. **Escalate** — Page oncall if unresolved in 30 min.

---

## Incident: `/healthz` Returning Wrong Doctrine Numbers

**Symptoms:** `/healthz` shows values other than `declarations: 749, axioms: 14, sorries: 163`.

**Fix steps:**

1. Locate the doctrine constant in `serve.py` or `app/health.py`.
2. Set exactly:
   ```python
   DOCTRINE = {"declarations": 749, "axioms": 14, "sorries": 163, "replay_hash": "c7c0ba17"}
   ```
3. PR: `fix(healthz): doctrine numbers 749/14/163 — Doctrine v11`.
4. After merge verify: `curl https://SZLHOLDINGS-sentra.hf.space/healthz | jq .doctrine`.

---

## Incident: Signing Endpoint Returning PLACEHOLDER

**Symptoms:** `POST /sign` returns `{"receipt": "PLACEHOLDER"}` or an empty envelope.

**What to check:**

1. **Key env var** — HF Space Settings → "Variables and secrets": confirm `WIRE_D_SIGNING_KEY` is set.
2. **`szl_dsse` module** — Build log: `import szl_dsse` must succeed. Add `szl-dsse` to `requirements.txt` if missing.
3. **Wire B link to a11oy** — sentra's signing may delegate to a11oy via Wire B. If `A11OY_ENDPOINT` env is not set or a11oy is down, signing falls to stub. Set `A11OY_ENDPOINT=https://SZLHOLDINGS-a11oy.hf.space`.
4. **Key format** — Ed25519 private key, base64-encoded, no trailing newline.

---

## Incident: Wire D Verification Failing

**Symptoms:** Receipts from sentra rejected by downstream with "pubkey mismatch" or "chain replay invalid".

**Debug:**

1. **Pubkey fingerprint**:
   ```bash
   echo "$WIRE_D_PUBKEY" | base64 -d | sha256sum
   ```
   Compare to `packages/wire-d/pubkeys/sentra.pub.sha256`.

2. **Chain replay** — After redeploy, re-anchor chain: set `CHAIN_ANCHOR_HASH` to last known-good receipt hash.

3. **Gate tripwire false-positive** — sentra's egress inspector may block its own outbound signing call. Check the tripwire allowlist includes `127.0.0.1` and the Wire D endpoint. Add:
   ```python
   EGRESS_ALLOWLIST = ["127.0.0.1", "SZLHOLDINGS-a11oy.hf.space"]
   ```

---

## Incident: `/viz/*` Returning SPA Shell (Blank Page)

**Debug:**

1. **Dockerfile COPY**:
   ```dockerfile
   COPY --chown=user:user apps/sentra-ui/dist /app/static
   ```
2. **Route order** — Static mount after API routes.
3. **Gate status panel** — If `/viz/gates` is blank, check that gate status telemetry endpoint `/api/gates/status` is returning JSON (not 404).

---

## Incident: Unay LMDB Persistence Broken

**Symptoms:** Immune memory (denials, allow-proofs) lost after restart.

**Debug:**

1. **Persistent storage** — Enable in HF Space Settings. Set `LMDB_PATH=/data/sentra.lmdb`.
2. **Single-writer** — Run `--workers 1`; LMDB does not allow concurrent writers.
3. **Map size** — sentra stores more data than other flagships (all 8 gate verdicts per request). Start at 8 GB:
   ```python
   env = lmdb.open(path, map_size=8 * 1024 ** 3)
   ```

---

## Common HF Space Build Errors

| Error | Fix |
|---|---|
| `ModuleNotFoundError: No module named 'gates.gate_N'` | Ensure `gates/__init__.py` exists and Dockerfile copies `gates/` |
| `ImportError: cannot import name 'szl_dsse'` | Add to `requirements.txt`; check private index URL |
| Space stuck in "Building" >15 min | Push empty commit to trigger rebuild |
| `Permission denied /app/gates` | Add `--chown=user:user` or `RUN chmod -R 755 /app/gates` |
| Wire B to a11oy failing (connection refused) | Check `A11OY_ENDPOINT` env; a11oy Space may be down or cold-starting |

---

*Co-Authored-By: Perplexity Computer Agent*
*Doctrine v11 — 749/14/163 — c7c0ba17*
