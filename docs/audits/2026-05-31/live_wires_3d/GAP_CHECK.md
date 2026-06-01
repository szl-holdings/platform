# GAP_CHECK — Live 3D Wires (honest ceilings, NO BANDAID)

Signed: **Yachay** · 2026-06-01 · Doctrine v12 (PURIQ)

This is the honest accounting of what is GREEN (real, working), AMBER (real but limited), and
RED (not yet wired — labeled honestly in-product, never faked).

---

## GREEN — real and working on all 5 flagships

- ✅ `/live-wires` serves a **real Three.js (r160) 3D page** on a11oy, amaru, sentra,
  killinchu, rosie — HTTP 200, `id="scene"`, `live_wires_3d.js`, 5× KaTeX. NOT the SPA shell.
- ✅ **Organ-specific cortex** renders per flagship (brain / immune shield / drone hex /
  nervous particle-field / orchestrator icosahedron) — confirmed in screenshots.
- ✅ **Real SSE** `/api/{ns}/v1/wires/stream` — `text/event-stream`, unbuffered. amaru/sentra/
  rosie emit **real Wire D pulses** with distinct receipt_hashes and rising `throughput_eps`.
- ✅ Pulses derived **only from real in-process buffers** (`recent_traces`, `cortex_events`,
  `khipu_nodes`, `szl_jack`); empty buffer ⇒ idle (no fabrication).
- ✅ **CatmullRom wires + animated `getPointAt(t)` pulses** (YAWAR recipe #2) carry live events.
- ✅ **KaTeX math labels** per wire (master-formula factors B…H).
- ✅ **Click → BoE modal**: real `GET /api/{ns}/v1/wires/boe/{hash}` returns
  `szl.body_of_evidence/v1` with Khipu inclusion proof, Yuyay-13 axes, HUKLLA log, master-
  formula eval, and Doctrine v11 LOCKED numbers.
- ✅ **HUKLLA T01–T20** tripwire field surfaced in the BoE bundle / modal.
- ✅ **Phase 4 inject** `POST /api/{ns}/v1/wires/inject` validates 3DWPP schema and the H-pulse
  appears on the **same Space's** stream (in-process fan-out works).
- ✅ ADDITIVE only; Doctrine v11 LOCKED numbers preserved; IP-HOLD PRs untouched.

## AMBER — real but limited (honestly labeled)

- 🟡 **Wire coverage is mostly D today.** Wire D (W3C traceparent) is always live because the
  middleware records every HTTP request. Wires **C/E** (cortex publish/broadcast), **F** (Khipu
  ingest), **G** (brain-jack), **B** (ledger root) only emit pulses when that real cross-organ
  traffic occurs. They are wired and will pulse when driven, but organic traffic was sparse at
  capture time → mostly Wire D + heartbeat. Not faked; just quiet.
- 🟡 **a11oy & killinchu showed heartbeat-only** in the capture window. a11oy: gate/orchestrator
  buffers were idle (heartbeat confirmed flushing after the async fix). killinchu: **lacks
  `szl_wire.py`/`szl_jack.py`**, so its wires are structurally idle (`0.0`) — the 3D cortex
  still renders. Honest, not broken.
- 🟡 **Khipu DAG is in-memory / non-persistent** per Space (ring buffer). Each pulse carries
  `honesty:"Khipu DAG in-memory; signature=PLACEHOLDER (Sigstore CI not wired)"`. The BoE
  `khipu_inclusion_proof.status` is `PLACEHOLDER` when a node isn't resolved in-memory.

## RED — NOT yet wired (labeled honestly in-product, never bandaged)

- 🔴 **Cross-Space event broker is NOT wired.** HF Spaces are isolated containers. The "a11oy
  hub fan-out" is **in-process per-Space only**. Verified: an H-event injected into a11oy does
  **NOT** propagate to amaru's stream (grep count = 0). True cross-flagship sync requires an
  external broker (Redis/NATS/SSE relay) that is **not deployed**. The UI/stream label this
  honestly (`honesty:"cross-Space fan-out from a11oy hub; signature=PLACEHOLDER"`).
- 🔴 **DSSE / COSE signatures are PLACEHOLDER.** Sigstore CI signing is **not yet wired**;
  `keyid:PENDING`. Surfaced in every BoE bundle: `"PLACEHOLDER — Sigstore CI signing not yet
  wired (keyid:PENDING)"`. No fake signatures are presented as real.
- 🔴 **Yuyay-13 scores & Λ are often null on raw Wire D** pulses (a trace carries no decision),
  so those pulses render neutral/grey rather than a fabricated red/amber/green band.

## Concurrency hazard (operational, honest)

- ⚠️ a11oy (and to a lesser extent rosie) are **actively edited by concurrent agents**. My
  Dockerfile COPY fix and app.py registration were reverted and re-applied multiple times.
  Final verified-working SHAs are recorded in `HF_PUSH_LOG.md`. If a future concurrent commit
  drops the per-file `COPY szl_live_wires.py …` lines again, `/live-wires` will silently revert
  to the SPA shell — **re-add the COPY lines** (the documented "a11oy gotcha").

## Recommended next steps to turn AMBER/RED → GREEN

1. Deploy an external broker (e.g. a tiny SSE relay Space) and point each `inject` hub at it →
   real cross-Space sync (closes the 🔴 cross-Space ceiling).
2. Wire Sigstore/Cosign in CI and replace the PLACEHOLDER `cose_sign1`/`dsse.sig` → real
   court-admissible signatures (closes the 🔴 DSSE ceiling).
3. Add `szl_wire.py`/`szl_jack.py` to killinchu (or accept honest idle) for B/C/E/F/G traffic.
4. Drive periodic synthetic-but-real cortex/khipu/jack calls (or rely on organic load) to keep
   B/C/E/F/G pulsing, not just Wire D.
5. Persist the Khipu DAG (durable store) to make inclusion proofs resolvable beyond memory.

*Honest by construction. Real wires. Real data. Math-labeled. — Yachay*
