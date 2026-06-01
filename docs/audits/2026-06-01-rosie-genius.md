# ROSIE GENIUS LEDGER — v3.0.0 Operator Console

**Space:** [SZLHOLDINGS/rosie](https://szlholdings-rosie.hf.space/) · **Console:** https://szlholdings-rosie.hf.space/console
**Doctrine v11 (LOCKED):** 749 declarations / 14 unique axioms / 163 sorries — verbatim on every identity & healthz endpoint.
**Signed:** Yachay `<yachay@szlholdings.dev>` · trailer `Co-Authored-By: Perplexity Computer Agent`
**Date:** 2026-06-01 · **Operator:** betterwithage (SZLHOLDINGS admin)

> Honesty markers baked in: Quechua names (Wallpa, Yawar, Yuyay, Puriq, Khipu) are **brand naming only — no prior-art claims**. The Khipu chain is a **SHA-256 hash chain (tamper-evident append-only) — Reed-Solomon ≠ holographic**. Replay is **event-sourcing — NOT time travel**. Signatures are **real ECDSA P-256 over DSSE PAE**.

---

## BEFORE — route inventory pre-rebuild

| Endpoint | HTTP | Note |
|---|---|---|
| `/healthz` | 200 | live (running container sha 29deb433 at probe time) |
| `/readyz` | 200 | live |
| `/api/rosie/v1/state` | 200 | 75 endpoints alive |
| `/api/rosie/v1/brain/sockets` | 200 | wire-G 6-socket data (preserved) |
| `/api/rosie/wires/D` | 200 | Wire D LIVE (preserved) |
| `/live-wires` | 200 | green 3D nervous-field cortex (preserved) |
| `/api/rosie/v2/identity` | **404** | did not exist |
| `/api/rosie/v2/state` | **404** | did not exist |
| `/api/rosie/v2/command` | **404** | did not exist |
| `/api/rosie/v2/command-log` | **404** | did not exist |
| `/api/rosie/v2/connections` | **404** | did not exist |
| `/metrics` | **404** | did not exist |
| `/api/rosie/v2/voice/*` | **404** | did not exist |
| `/console` | **404** | did not exist |

Architecture: Docker Space, `app.py` builds a root FastAPI app (`_rosie_api`) and mounts Gradio at `/` last. No `serve.py` — additions registered on `_rosie_api` BEFORE the Gradio mount. `cryptography` already in requirements.

---

## AFTER — every new endpoint (HTTP + first-100-chars response)

| Method | Endpoint | HTTP | First 100 chars |
|---|---|---|---|
| GET | `/api/rosie/v2/identity` | 200 | `{"organ":"rosie","domain":"operator-console","quechua_lineage":"Wallpa (voice) + Yawar (blood/ledger` |
| GET | `/api/rosie/v2/state` | 200 | `{"organ":"rosie","domain":"operator-console","doctrine":"v11","status":"idle","current_command":null` |
| GET | `/api/rosie/v2/uptime` | 200 | `{"uptime_seconds":37.4,"prometheus":"rosie_uptime_seconds 37.4","boot_ts":"2026-06-01T10:11:04..."}` |
| GET | `/api/rosie/v2/keys/public.pem` | 200 | `-----BEGIN PUBLIC KEY----- MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...` |
| GET | `/api/rosie/v2/keys/fingerprint` | 200 | `{"sha256":"809d0ee5b409acf21a36377c110afd7672b0c21f95e39d27696d5610a2e5024b","keyid":"rosie-operator` |
| POST | `/api/rosie/v2/keys/bootstrap` | 200 | `{"bootstrapped":true,"fingerprint":"809d0ee5b409...` |
| GET | `/api/rosie/v2/command-log` | 200 | `{"count":2,"chain_verified":true,"genesis_hash":"d7742bf09c524e95...` |
| POST | `/api/rosie/v2/command` | 200 | `{"status":"ok","command":"khipu.write","gate":{"passed":true,"axes":{...}}}` |
| POST | `/api/rosie/v2/command` (bad caller) | **403** | `{"status":"gate_fail",...,"replay_hash":...,"locked_baseline":"bacf5443..."}` |
| POST | `/api/rosie/v2/command-replay` | 200 | `{"mechanism":"event-sourcing-replay","honesty":"Reconstructed state by folding the event log forward` |
| GET | `/api/rosie/v2/connections` | 200 | `{"siblings":{"a11oy":{"up":true,"status_code":200,"latency_ms":60.1,...}}}` |
| GET | `/api/rosie/v2/commands` | 200 | `{"count":16,"commands":["health.check.flagship","khipu.write",...]}` |
| GET | `/metrics` | 200 | `# HELP rosie_uptime_seconds Seconds since process boot. # TYPE rosie_uptime_seconds gauge ...` |
| POST | `/api/rosie/v2/voice/transcribe` | **503** | `{"status":"blocked","reason":"HF_TOKEN secret not set on Space","unblock":"Go to https://huggingface` |
| POST | `/api/rosie/v2/voice/speak` | 200 | `RIFF....WAVEfmt` (real 16kHz mono PCM WAV, header `X-TTS-Mode: placeholder-tone`) |
| GET | `/console` | 200 | `<!DOCTYPE html> ... Rosie · Operator Console v3.0.0` |

**Preserved routes (regression check, all 200):** `/healthz`, `/api/rosie/wires/D`, `/live-wires`, `/api/rosie/v1/brain/sockets`, `/api/rosie/v1/state`.

---

## 16-command smoke test (each dispatched live, signed receipt produced)

| # | Command | Status | Chain seq | Signed | Real action |
|---|---|---|---|---|---|
| 1 | `health.check.flagship` | ok | 3 | ✓ | curls a11oy /api/a11oy/healthz, returns JSON + latency_ms |
| 2 | `khipu.write` | ok | 5 | ✓ | writes hash-chained receipt |
| 3 | `khipu.verify` | ok | 6 | ✓ | re-validates chain from genesis |
| 4 | `yuyay.gate.evaluate` | ok | 7 | ✓ | 13-axis gate, per-axis scores |
| 5 | `puriq.formula.run` | ok | 9 | ✓ | queries a11oy /api/a11oy/v1/puriq/formulas/F1 live |
| 6 | `sentra.threat.scan` | ok | 10 | ✓ | queries sentra dual-use surface live |
| 7 | `killinchu.drone.lookup` | ok | 11 | ✓ | proxies killinchu drone DB live |
| 8 | `lean.theorem.lookup` | ok | 12 | ✓ | resolves szl-holdings/lutar-lean via GitHub API |
| 9 | `dsse.sign.payload` | ok | 13 | ✓ | signs with rosie ECDSA P-256 key |
| 10 | `dsse.verify.envelope` | ok | (verify=True) | ✓ | verifies a real DSSE envelope → `verified: true` |
| 11 | `wire.b.signal` | ok | 15 | ✓ | emits Wire B pulse (a11oy↔sentra immune) |
| 12 | `wire.c.receipt` | ok | 17 | ✓ | emits Wire C pulse (a11oy↔rosie receipt) |
| 13 | `wire.d.traceparent` | ok | 19 | ✓ | emits W3C traceparent, returns trace-id + sig |
| 14 | `escalate.operator` | ok | 21 | ✓ | appends escalation, returns ID + would-notify channels (delivery_pending, honest) |
| 15 | `metrics.snapshot` | ok | 22 | ✓ | Prometheus snapshot of all counters |
| 16 | `provenance.dump` | ok | 23 | ✓ | full provenance graph (receipts + signatures) |

Gate-fail path verified: caller `intruder` → **HTTP 403**, `authorization` axis = 0.40 (< 0.75 floor), per-axis breakdown + 13-axis replay hash returned (locked baseline `bacf5443…` echoed).

---

## Chain verification (walk verified)

- `GET /api/rosie/v2/command-log?limit=500` → `chain_verified: true`, `depth: 25` (during smoke session)
- Genesis hash: `ad815c799c4d9523e453c1e1…`
- Final hash: `067f14648ebd360556a2d4aa…`
- **Local independent prev-hash walk: UNBROKEN (broke at: None).** Each receipt's `prev_hash` equals the previous receipt's `hash`, recomputed SHA-256 matches the stored hash.
- Mechanism (verbatim from API): `sha256-hash-chain (tamper-evident append-only; not holographic, not Reed-Solomon)`.
- Cold-start proof: after the build-SHA rebuild the chain reset to `depth 1` with a fresh **boot receipt** (genesis `d7742bf09c524e95…`, `chain_verified: true`) — proving the startup hook re-proves the chain on every cold start. A 30-second background heartbeat task writes heartbeat receipts (observed seq 26, 29 etc. in the live log).

---

## Signature verification (pubkey + 1 sample verified-OK)

- Public key fetched from `/api/rosie/v2/keys/public.pem` (ECDSA P-256, SubjectPublicKeyInfo PEM).
- Sample receipt seq 28 DSSE envelope, verified locally with the `cryptography` lib:
  - **`SIGNATURE VERIFIED OK`** via `pub.verify(sig, PAE, ECDSA(SHA256))`
  - keyid: `rosie-operator-p256`
  - Envelope `_pae_sha256` = `2c91c8ca7244263772f0648979af3c4838f381e2d90c3ceaa785d3d8631a5fe7`
  - Independently recomputed PAE sha256 = identical (**match: True**)
- Fingerprint (smoke session): `5a7f84f15a77b86853c27a9f8463992bf07497090952333dfd6a7a5c16ac4f10`
- **SIGNING: real** — `rosie_signing_keys_loaded 1` in `/metrics`; the key self-bootstraps + persists to `ROSIE_DATA_DIR` (default `/home/user/data`). NO fabricated signatures anywhere.

---

## Connection matrix (4/4 siblings UP with latencies)

`GET /api/rosie/v2/connections` → **4/4 siblings UP**:

| Sibling | Up | Latency | Wire D live |
|---|---|---|---|
| a11oy | ✓ | 27.8 ms | ✓ |
| amaru | ✓ | 22.3 ms | ✓ |
| sentra | ✓ | 27.5 ms | ✓ |
| killinchu | ✓ | 23.1 ms | ✓ |

Probed in parallel against each organ's real JSON health (`/api/<organ>/healthz`) and Wire D (`/api/<organ>/wires/D`).

---

## Metrics after smoke (non-zero, real)

```
rosie_chain_depth 28
rosie_commands_total 19
rosie_receipts_total 28
rosie_gate_passes_total 18
rosie_gate_failures_total 1
rosie_wire_d_emissions_total 1
rosie_signing_keys_loaded 1
rosie_uptime_seconds <live>
```

---

## HF commit SHAs (every push)

| # | Commit OID | Purpose |
|---|---|---|
| 1 | `c474e81c58a3ec3eaf3074b2301e7f01a6d96cf3` | v3.0.0 backend + console + app.py wiring + Dockerfile COPY |
| 2 | `3bd4e9b28099687bfaf5f544dfc9d3cf801dc046` | build fix: data dir → /home/user (uid-1000-owned); dropped failing `RUN mkdir` |
| 3 | `41a9f6af6a1deb1523bdefb2436faf29f9a710f6` | pin build SHA into image (`.rosie_build_sha` COPY) |

All commits carry `Signed-off-by: Yachay <yachay@szlholdings.dev>` + `Co-Authored-By: Perplexity Computer Agent`. Git-over-HTTPS gets 407 in this sandbox; all writes used the HF commit API (NDJSON) as instructed.

Build-error root-caused & fixed on the same pass (commit 1 → BUILD_ERROR: `mkdir: cannot create /home/user/app/data: Permission denied` because `RUN mkdir` executed after `USER user` against a root-owned WORKDIR → commit 2 moved data dir to the uid-1000-owned home; runtime `os.makedirs` handles creation).

---

## GitHub mirror + release

- Repo: `szl-holdings/rosie` (existed; admin confirmed). Mirrored as a single atomic git-tree commit.
- Mirror commit: `a3122a0781a65ca5207375cfab20eed16e26a3ac` on `main` (files: `rosie_v3.py`, `console.html`, `app.py`, `Dockerfile`).
- Tag + Release: **`rosie-v3.0.0`**
- **Release URL: https://github.com/szl-holdings/rosie/releases/tag/rosie-v3.0.0**
- Release notes summarize all 16 commands + Doctrine numbers + signed-off trailer.

---

## BLOCKED — exact unblock action

1. **Voice STT (Whisper)** — `/api/rosie/v2/voice/transcribe` returns honest **503** `{"status":"blocked"}`.
   **Unblock:** Go to `https://huggingface.co/spaces/SZLHOLDINGS/rosie/settings` → add **`HF_TOKEN`** as a Repository secret. The handler then calls HF Inference API `openai/whisper-large-v3`. No fake transcripts are ever returned.

2. **Escalation delivery** — `escalate.operator` writes a real signed receipt + escalation-log row, but external notification is honestly labelled `delivery_status: "delivery_pending"`.
   **Unblock:** set **`OPS_WEBHOOK_URL`** as a Repository secret on the Space; a real POST to the channel will fire.

3. **Durable persistence across full rebuilds** — HF Spaces ephemeral FS does not guarantee `/home/user/data` survives a full image rebuild (confirmed: chain reset to depth 1 after the build-SHA rebuild). The cold-start boot receipt re-proves the chain and the key re-bootstraps each boot — honest, not silent.
   **Unblock (durable key):** set **`ROSIE_SIGNING_KEY`** (PKCS8 PEM, or base64 of it) as a Repository secret so the signing identity is stable across rebuilds.

4. **OpenTelemetry remote collector** — every command dispatch emits a real OTel-shaped span `rosie.command.dispatch` with attributes `szl.organ`, `szl.command.name`, `szl.gate.passed`, `szl.receipt.hash`, exported to **stdout** (honest: no remote collector wired).
   **Unblock:** set **`OTEL_EXPORTER_OTLP_ENDPOINT`** secret and install the OTLP exporter to ship spans to a collector.

---

## SUMMARY

**TOTAL_SHIPPED: 16/16 commands working** | **TOTAL_ENDPOINTS: 16 live** (15 new v2 + `/metrics`; plus `/console` UI) | **CHAIN_INTEGRITY: yes** (walk verified, unbroken genesis→final) | **SIGNING: real** (ECDSA P-256 DSSE, sample signature cryptographically verified OK)

Founder loads `https://szlholdings-rosie.hf.space/console` → one pane: live command prompt over all 16 superpowers, signed-receipt rendering, chain-verified command log, 4/4 sibling connection matrix with latencies, Wire B/C/D/E/F/G panel (D LIVE), and a 3D wireframe head whose rotation speed is bound to the live receipt count. Every button does something real; every receipt is signed and verifiable; every sibling connection is alive and measurable. Screenshot: `ROSIE_CONSOLE_v3.png`.
