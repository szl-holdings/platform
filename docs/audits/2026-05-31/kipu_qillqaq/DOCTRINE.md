# KIPU + QILLQAQ Doctrine — honest, implemented (PURIQ Doctrine v15, ADDITIVE)

**Author:** Yachay · agent **Perplexity Computer Agent** · Date 2026-06-01
**Status:** IMPLEMENTED. Real importable Python package + real `tomllib`-parsed genomes +
live on `SZLHOLDINGS/a11oy` at `/v1/kipu` and `/v1/qillqaq`.
**ADDITIVE to** PURIQ Doctrine v14. Supersedes nothing. IP-HOLD a11oy#57 untouched.

> This doctrine **replaces the earlier draft's mystical framing**. The prior
> `KIPU_QILLQAQ_DOCTRINE.md` called the durability layer "holographic QEC (PYHP)". That was
> over-claimed. The shipped reality is **Reed-Solomon erasure coding** — a 1960 MDS code.
> "Genome"/"DNA" is **TOML config + module loading**, not biology. Honest naming throughout.

---

## §0. LOCKED NUMBERS (Doctrine v11, preserved verbatim)

| Locked item | Value |
|---|---|
| Lean declarations | **749** |
| Unique axioms | **14** |
| Sorries | **163** |
| Yuyay axis system | **13-axis yuyay_v3** |
| yuyay_v3 replay hash | `bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5` |
| A2 | `IsHomogeneous` |
| A4 | `IsBounded` |
| Supply-chain | **SLSA L1** |
| Λ-uniqueness | **Conjecture 1** |

KIPU + QILLQAQ are pure code (a Python package + a router). They add **zero** Lean
declarations, axioms, or sorries to the locked corpus. The locked set is untouched.

---

## §1. What KIPU is (honest)

**KIPU** = Quechua *kipu* "knot; quipu (knotted-cord recording device)"
([Wiktionary — kipu](https://en.wiktionary.org/wiki/kipu)). The shared **receipt-cell
substrate**: every organ reads and writes signed `ReceiptCell`s to one pool.

Concretely, KIPU is the composition of four well-understood, open-source CS techniques —
nothing more:

1. **Content addressing** — a cell's identity (`cid`) is the SHA-256 of its canonical JSON.
   Same idea as git objects and IPFS/IPLD ([ipld.io](https://ipld.io)). `kipu_qillqaq/cell.py`.
2. **Persistence** — LMDB key/value store ([lmdb.readthedocs.io](https://lmdb.readthedocs.io))
   when installed, else a JSON-file store with the identical API. `kipu_qillqaq/pool.py`.
3. **Pub/sub** — an in-process event bus (no external broker). Organs subscribe to `write`,
   `read`, or `organ:<NAME>` topics. `kipu_qillqaq/events.py`. This is a Linda-style tuple
   space ([Gelernter & Carriero 1986](https://en.wikipedia.org/wiki/Linda_(coordination_language)))
   + event sourcing ([Fowler](https://martinfowler.com/eaaDev/EventSourcing.html)).
4. **Durability** — **Reed-Solomon erasure coding** (Reed & Solomon 1960), the MDS code used
   by RAID-6, CD/DVD/Blu-ray, QR codes, and Backblaze. Default **RS(10,6)**: 6 data + 4
   parity shards; any 6 of 10 reconstruct the cell ⇒ tolerate loss of any 4/10 (40%).
   `kipu_qillqaq/coding.py`. **This is NOT "holographic quantum error correction".**

## §2. What QILLQAQ is (honest)

**QILLQAQ** = Quechua agentive *qillqaq* "one who writes / scribe" from *qillqay* "to write"
([Wiktionary — qillqay](https://en.wiktionary.org/wiki/qillqay)). The **declarative engine**
that boots organs from config.

- Each organ has a `genome.toml` (its **config**, colloquially "DNA"). Schema:
  `[organ]` name/quechua/function · `[role]` loop · `[reads]` kinds · `[writes]` kinds ·
  `[boot]` handler ("module:callable")/enabled · `[meta]` free-form.
- QILLQAQ parses each file with the **standard-library `tomllib`** (Python 3.11+), validates
  it against the schema (`kipu_qillqaq/genome.py`), and instantiates an `OrganAgent` bound to
  the shared `KipuPool` (`kipu_qillqaq/transcribe.py`).
- **"Boot from DNA" = parse TOML + import a handler module.** This is exactly the Kubernetes
  CRD + Operator reconcile pattern
  ([k8s custom resources](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/))
  or a plugin registry. No biology, no magic.
- **Genome gating is real:** `OrganAgent.write(kind, ...)` raises `PermissionError` if `kind`
  is not in the organ's `[writes].kinds`. Organs only act within their declared role.

## §3. The 16 canonical organ genomes

12 canonical (Doctrine v11/v12) + 4 edge organs (Doctrine v13/WAYRA):

| # | Organ | Quechua | Function |
|---|---|---|---|
| 1 | AMARU | serpent | cortex / agentic reasoning scheduler |
| 2 | YUYAY | mind/memory | heart / 13-axis wisdom gate (yuyay_v3) |
| 3 | UNAY | long-ago | cross-session continuity store |
| 4 | YAWAR | blood | append-only DSSE-signed receipt ledger |
| 5 | HUKLLA | unity | immune / halt-authority tripwires |
| 6 | KALLPA | strength | wires / inter-organ interconnect |
| 7 | KHIPU | knotted-cord | summation-invariant Merkle DAG snapshot |
| 8 | LAMBDA_SPINE | (skeleton) | Λ aggregator governance gate |
| 9 | VSP_OTEL | (nervous) | verifiable span / OpenTelemetry pipeline |
| 10 | KANCHAY | light | brand-projection presentation surface |
| 11 | HATUN | great | doctrine schema enforcement |
| 12 | SUMAQ_RIKUQ | beautiful-seer | deterministic figure/design builder |
| 13 | CHASKI | relay-messenger | reception / onboarding first-touch |
| 14 | WALLPA | to-create | governed voice / TTS narration |
| 15 | WASI_RIKUQ | house-watcher | advisory observability / chaos |
| 16 | WAYRA | wind/air | broadcast / diffusion across the mesh |

Each genome's `[reads]`/`[writes]` kinds wire the organs into a coherent receipt flow
(e.g. AMARU writes `reasoning_verdict` → YUYAY reads it → writes `yuyay_score` → LAMBDA_SPINE
reads it → writes `lambda_verdict`, etc.).

## §4. Deployment (live)

Mounted into `SZLHOLDINGS/a11oy` `serve.py` exactly like the WAYRA / a11oy.code routers:
a try/except-guarded `include_router` registered **before** the SPA catch-all, with matching
Dockerfile `COPY` lines (the per-file COPY gotcha is honored — the package dir and the serve
module each get an explicit COPY). Endpoints:

```
GET  /v1/kipu/healthz          -> {ok, substrate_version, organs}
GET  /v1/kipu/stats            -> {store_backend, cells, rs_code}
POST /v1/kipu/write            -> {cid, verify}
GET  /v1/kipu/read/{cid}       -> cell
GET  /v1/qillqaq/manifest      -> {engine, pool, organs:{...16...}, count}
GET  /v1/qillqaq/organ/{name}  -> one organ's genome + authorization surface
```

## §5. Hard rules honored
ADDITIVE only (wires persist; KIPU is the substrate they ride on) · IP-HOLD a11oy#57
untouched · **honest naming** (Reed-Solomon, not holographic QEC; genome = config + module
loading) · open-source deps only (stdlib `tomllib`/`hashlib`/`json`; optional MIT `reedsolo`,
OpenLDAP-licensed `lmdb`) · content-addressed receipt on every substrate write · signed
**Yachay** · "Perplexity Computer Agent" in commit trailers · Doctrine v11 locked numbers
preserved verbatim (§0).

*End KIPU + QILLQAQ Doctrine — Yachay · Perplexity Computer Agent.*
