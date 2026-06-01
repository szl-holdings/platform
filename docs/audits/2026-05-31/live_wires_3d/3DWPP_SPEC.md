# 3DWPP — 3D Wire Pulse Protocol (v1)

**Spec for the live 3D wire visualization baked into each SZL flagship cortex.**
Signed: **Yachay** · Perplexity Computer Agent · Doctrine v12 (PURIQ) · 2026-06-01

> "NO BANDAID. Real wires. Real data. Math-labeled." — Founder directive.

---

## 1. Purpose

`3DWPP` is the on-the-wire JSON contract that connects each flagship's **real, in-process
wire buffers** (B/C/D/E/F/G/H) to the browser-side **Three.js** cortex renderer at `/live-wires`.
It is **additive** — it sits on top of the existing `szl_wire` / `szl_jack` substrate and the
canonical honest status board at `/wires`. No mocks. Every pulse is derived from a real
in-process buffer write (HTTP trace, cortex event, Khipu DAG node, brain-jack receipt, or
ledger root). Where a wire has no live data (e.g. killinchu lacks `szl_wire`/`szl_jack`), the
stream honestly emits a heartbeat with that wire at `0.0` rather than a fabricated pulse.

## 2. Transport

| Channel | Endpoint | Notes |
|---|---|---|
| SSE event stream | `GET /api/{ns}/v1/wires/stream` | `Content-Type: text/event-stream`, `x-accel-buffering: no` (HF proxy un-buffered) |
| SSE front-door alias | `GET /api/wires/stream` | redirects to the namespaced stream |
| Body-of-Evidence | `GET /api/{ns}/v1/wires/boe/{receipt_hash}` | JSON BoE bundle; `?format=pdf` → PDF |
| Cross-Space inject (Phase 4 hub) | `POST /api/{ns}/v1/wires/inject` | validates §3 schema, enqueues onto in-process fan-out ring |
| Page | `GET /live-wires` | full Three.js page (`live_wires.html` + `live_wires_3d.js`) |

`{ns}` ∈ `{a11oy, amaru, sentra, killinchu, rosie}`.

### 2.1 SSE event types

```
event: pulse        # one wire pulse (see §3)
data: { ...3DWPP pulse... }

event: heartbeat    # liveness + per-wire throughput snapshot when idle
data: {"schema":"szl.wire_heartbeat/v1","ns":"<ns>","wires":{"B":0.0,...,"H":0.0},"ts":"<iso8601>"}
```

The server de-duplicates by `(wire_letter, receipt_hash, timestamp)` so the client never
re-renders the same real event twice.

## 3. Pulse object — `szl.wire_pulse/v1`

```json
{
  "schema": "szl.wire_pulse/v1",
  "wire_letter": "D",
  "source_flagship": "amaru",
  "target_flagship": null,
  "receipt_hash": "7e8569a1e0eb862e",
  "timestamp": "2026-06-01T09:12:24.711633+00:00",
  "yuyay_score": null,
  "hukulla_tripwires": [],
  "lambda_value": null,
  "formula_factor": "\\mathrm{OTel}(x)",
  "latency_ms": 12,
  "throughput_eps": 1.0,
  "honesty": "Khipu DAG in-memory; signature=PLACEHOLDER (Sigstore CI not wired)",
  "boe_ref": "/api/amaru/v1/wires/boe/7e8569a1e0eb862e"
}
```

| Field | Type | Meaning |
|---|---|---|
| `schema` | string | always `szl.wire_pulse/v1` |
| `wire_letter` | enum B/C/D/E/F/G/H | which wire fired |
| `source_flagship` | string | emitting organ |
| `target_flagship` | string\|null | sink organ (null = self/broadcast) |
| `receipt_hash` | string(16) | real receipt digest / trace id / Khipu node digest |
| `timestamp` | ISO-8601 | event time (UTC) |
| `yuyay_score` | float\|null | 13-axis `yuyay_v3` score when the wire carries a decision; null if N/A |
| `hukulla_tripwires` | string[] | HUKLLA T01–T20 tripwires that fired (visible in modal) |
| `lambda_value` | float\|null | Λ(x) when present on the decision |
| `formula_factor` | string(KaTeX) | the master-formula factor this wire contributes (§4) |
| `latency_ms` | int | nominal per-wire latency band |
| `throughput_eps` | float | rolling events/sec for this wire |
| `honesty` | string | honest provenance ceiling label (see §6) |
| `boe_ref` | string | link to the Body-of-Evidence bundle |

### 3.1 Wire → buffer source (REAL, no mock)

| Wire | Real source (`szl_wire`/`szl_jack`) | Trigger |
|---|---|---|
| **B** | `khipu_root()` | ledger product snapshot (∏ Khipu) |
| **C** | `cortex_events()` (broadcast decision) | cortex broadcast Λ(x) |
| **D** | `recent_traces()` | W3C traceparent middleware (every HTTP request) — **always live** |
| **E** | `cortex_events()` (publish→subscribe) | `publish_brand_decision()` a11oy↔amaru cortex sync |
| **F** | `khipu_nodes()` | `ingest_receipt()` — Khipu Merkle DAG node write |
| **G** | `szl_jack.recent_jacks()` / `jack_log()` / `sockets()` | brain-jack receipt (RAG/Amaru query) |
| **H** | injected (Phase 4 hub) + master-formula aggregate | cross-Space fan-out / argmax composite |

## 4. Wire → master-formula factor (KaTeX, math-labeled)

The PURIQ master decision formula (PURIQ charter):

\[ P(x,t)=\arg\max_{a\in\mathcal{A}}\Big[\;\Lambda(x)\cdot \text{Yuyay}_{13}(a)\cdot e^{-\beta\,\mathrm{HUKLLA}(a)}\cdot \prod_i \text{Khipu}_i(a)\;\Big] \]

Each wire is labeled in the 3D scene and the click modal with the factor it contributes:

| Wire | KaTeX factor | Role |
|---|---|---|
| B | `\prod_i \text{Khipu}_i(a)` | ledger product (vessels Khipu) |
| C | `\Lambda(x)` | cortex broadcast prior |
| D | `\mathrm{OTel}(x)` | W3C trace continuity |
| E | `\text{Yuyay}_{13}(a)` | 13-axis Yuyay gate (cortex publish) |
| F | `\text{Khipu}_{\text{new}}(a)` | new Khipu DAG node |
| G | `\mathrm{Amaru}(\text{query})` | RAG / brain-jack retrieval |
| H | `P(x,t)=\arg\max_a[\Lambda\cdot\text{Yuyay}_{13}\cdot e^{-\beta H}\cdot\prod_i K_i]` | master argmax |

## 5. Yuyay color banding (13-axis `yuyay_v3`)

Pulses are colored by their `yuyay_score`:

- **red** `< 0.5` — below gate
- **amber** `0.5 – 0.85` — provisional
- **green** `> 0.85` — passes
- **neutral/grey** — `yuyay_score == null` (wire carries no decision, e.g. raw Wire D trace)

## 6. Honesty ceilings (labeled in stream + modal — NOT bandaged)

Every pulse carries an `honesty` string and the modal surfaces these explicitly:

- **Khipu DAG is in-memory / non-persistent** per Space (ring buffer; honest, not a durable ledger).
- **Signatures = PLACEHOLDER** — Sigstore/DSSE CI is **not yet wired** (`keyid: PENDING`). DSSE
  is honestly labeled as not-yet-wired wherever it appears.
- **Cross-Space event broker is NOT wired** — HF Spaces are isolated containers; the inject hub
  fan-out is **in-process per-Space only**. Cross-flagship sync is an honest **RED** ceiling
  (see `GAP_CHECK.md` / `VERIFY_REPORT.md`).
- **killinchu** lacks `szl_wire`/`szl_jack` → its wires are honestly **idle** (heartbeat `0.0`),
  the 3D cortex still renders.

## 7. Doctrine v11 LOCKED numbers (preserved, untouched)

749 declarations · 14 axioms · 163 sorries · 13-axis `yuyay_v3` · replay `bacf5443…631fc5` ·
A2 = `IsHomogeneous` · A4 = `IsBounded` · SLSA L1 · Λ-uniqueness = **Conjecture 1**.
This visualization is **additive** and changes none of these. IP-HOLD PRs untouched.

---

*Spec authored by Yachay. Real wires. Real data. Math-labeled.*
