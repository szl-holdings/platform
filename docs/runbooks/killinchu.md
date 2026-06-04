# RUNBOOK — killinchu (Drone Intelligence / Counter-UAS Defense)

**Doctrine v11 — 749 / 14 / 163 — replay hash c7c0ba17**
**Maintained by:** Yachay (yachay@szlholdings.dev)
**Last updated:** 2026-06-02

---

## Overview

`killinchu` is the **counter-UAS rule engine**: FAA Remote ID, ADS-B Mode-S, MAVLink, and STANAG 4609 decoders. Decoded telemetry is scored as a claim against geofence + policy, emitting a Λ-receipt. Defense flagship.

HF Space: <https://huggingface.co/spaces/SZLHOLDINGS/killinchu>
GitHub: <https://github.com/szl-holdings/killinchu>

---

## Incident: Service Is Down

**Symptoms:** HF Space shows "Building" or "Error"; `/healthz` times out.

**Debug steps (in order):**

1. **Check HF Space stage**
   - Go to <https://huggingface.co/spaces/SZLHOLDINGS/killinchu> → "Logs" tab.
   - `building`: check for decoder library compilation errors (MAVLink or ADS-B native libraries may require build deps).
   - `runtime error`: look for geofence data load failure.

2. **Check Docker build logs**
   - killinchu may compile native decoders at build time. Look for `make` or `gcc` errors.
   - Add `apt-get install -y build-essential` if native compilation is required.

3. **Check Dockerfile COPY lines**
   - Decoder configs and geofence data must be copied:
     ```dockerfile
     COPY --chown=user:user decoders/ /app/decoders/
     COPY --chown=user:user geofences/ /app/geofences/
     COPY --chown=user:user serve.py /app/serve.py
     ```
   - Missing `geofences/` causes `FileNotFoundError` at startup.

4. **Geofence data check** — killinchu loads geofence polygons at startup. If the data file is corrupt or missing, the service fails to start. Restore from `data/geofences.geojson` in the repo.

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
4. Verify: `curl https://SZLHOLDINGS-killinchu.hf.space/healthz | jq .doctrine`.

---

## Incident: Signing Endpoint Returning PLACEHOLDER

**Symptoms:** `POST /sign` or the claim-verdict endpoint returns `{"receipt": "PLACEHOLDER"}`.

**What to check:**

1. **Key env var** — HF Secrets: `WIRE_D_SIGNING_KEY` set and non-empty.
2. **`szl_dsse` module** — Build log: `import szl_dsse` must succeed.
3. **Claim-verdict path** — killinchu's verdict endpoint wraps signing. Confirm `szl_dsse.sign(verdict, key)` is called and not `_sign_stub()`. The verdict payload includes the decoded telemetry, geofence match result, and policy decision.
4. **Decoder output format** — If a decoder returns a malformed telemetry dict, the signing step may fail silently. Add a schema validation step before signing.

---

## Incident: Wire D Verification Failing

**Symptoms:** Downstream or a11oy rejects killinchu verdicts with "pubkey mismatch".

**Debug:**

1. **Pubkey fingerprint**:
   ```bash
   echo "$WIRE_D_PUBKEY" | base64 -d | sha256sum
   ```
   Compare to `packages/wire-d/pubkeys/killinchu.pub.sha256`.

2. **Chain replay** — Re-anchor with `CHAIN_ANCHOR_HASH` after redeploy.

3. **Decoder protocol mismatch** — If a FAA Remote ID packet is decoded with the wrong protocol version, the claim hash changes and replay verification fails. Confirm decoder version matches the pinned version in `decoders/versions.lock`.

---

## Incident: `/viz/*` Returning SPA Shell (Blank Page)

**Debug:**

1. **Dockerfile COPY**:
   ```dockerfile
   COPY --chown=user:user apps/killinchu-ui/dist /app/static
   ```
2. **Route order** — Static mount after API routes.
3. **Map panel** — If `/viz/map` is blank, check that the geofence GeoJSON endpoint `/api/geofences` returns data. A missing geofence file causes 404 here too.

---

## Incident: Unay LMDB Persistence Broken

**Symptoms:** Decoded telemetry history lost after restart; or threat log fails to persist.

**Debug:**

1. **Persistent storage** — Enable in HF Settings. `LMDB_PATH=/data/killinchu.lmdb`.
2. **Single-writer** — `--workers 1`; decoders may spawn threads but LMDB writes must be serialized.
3. **Map size** — Telemetry volume can be high; start at 16 GB:
   ```python
   env = lmdb.open(path, map_size=16 * 1024 ** 3)
   ```
4. **Truncation policy** — Implement a rolling window: evict entries older than 90 days to prevent map overflow.

---

## Common HF Space Build Errors

| Error | Fix |
|---|---|
| `gcc: command not found` | Add `apt-get install -y build-essential` to Dockerfile |
| `FileNotFoundError: geofences/base.geojson` | Confirm `COPY geofences/ /app/geofences/` in Dockerfile |
| `mavlink: unsupported message ID` | Update MAVLink dialect file in `decoders/mavlink/` |
| `ImportError: No module named 'pyModeS'` | Add `pyModeS` to `requirements.txt` |
| Space stuck in "Building" >15 min | Native compile may time out; pre-compile and COPY binary, or switch to pure-Python decoder |
| `MDB_MAP_FULL` | Increase `map_size` or implement 90-day truncation |

---

*Co-Authored-By: Perplexity Computer Agent*
*Doctrine v11 — 749/14/163 — c7c0ba17*
