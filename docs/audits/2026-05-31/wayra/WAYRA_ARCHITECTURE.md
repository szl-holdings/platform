# WAYRA_ARCHITECTURE — system design of the empire's lungs

**Layer:** PURIQ → WAYRA (Doctrine v13, 4th edge organ). **Author:** Yachay, under CTO
authority. **Date:** 2026-06-01. Code: `/home/user/workspace/szl_wayra/`.

---

## 1 — Adapter pattern (one class per source category)

Every source category is a subclass of `wayra.sources.base.Source`, sharing one
lifecycle so the orchestrator treats every stream identically:

```
class Source:
    source_id : str            # "hf_hub" | "github_releases" | "arxiv" | …
    route_to  : list[str]      # default organ routing for the category
    rate_limit_s : float       # politeness floor between requests
    cadence   : str            # "hourly" | "daily" | "weekly"

    def start(self) -> None                       # one-time setup (http session / cursor)
    def stream(self) -> Iterator[raw_item]        # yield raw items since last cursor
    def parse(self, item) -> dict                 # raw → normalized dict
    def normalize(self, parsed) -> IngestEvent    # dict → canonical IngestEvent
    def emit(self, ev, log) -> receipt            # gate → route → persist → receipt
    def run_once(self, log, max_items=50) -> summary   # the shared pull loop (cost-bounded)
```

Shipped adapters (all live):

| Class | File | source_id | cadence | default route |
|---|---|---|---|---|
| `HFHubWatcher` | `sources/hf_hub_watcher.py` | hf_hub | hourly | a11oy |
| `GitHubReleases` | `sources/github_releases.py` | github_releases | hourly | a11oy/sentra/killinchu |
| `ArxivFirehose` | `sources/arxiv_firehose.py` | arxiv | daily | puriq/a11oy/sentra/killinchu |
| `DroneOSINT` | `sources/drone_osint.py` | drone_osint | daily | killinchu/sentra |
| `StandardsWatcher` | `sources/standards_watcher.py` | standards | daily | sentra/amaru/a11oy |

Each adapter accepts an **injected fetch/list function** (`fetch_fn`, `list_models_fn`,
`post_fn`) so the pytest suite drives every adapter against canned payloads with zero
network — and so the live path is a one-line swap. `RSS/Atom` adapters share one
dependency-free parser (`sources/feedparse.py`, `xml.etree` stdlib only).

---

## 2 — Normalization (the canonical IngestEvent)

Every adapter emits one shape (`wayra/core/normalize.py`):

```
IngestEvent {
  source, source_detail, timestamp, ingested_at,
  title, url, content_hash (sha3-256 over identity parts),
  raw, parsed_summary, license,
  yuyay_score, novelty_score, wayra_factor,     # filled by the gate
  organ_routing[], decision                     # accept | review | drop
}
```

`content_hash = sha3_256(canonical-json(identity_parts))` — the dedup key. License is
classified GREEN / AMBER / RED (`normalize.license_class`, mirroring WALLPA's
license_class tag, Doctrine v13 §2.2).

---

## 3 — Per-event flow (ingest → dedup → Yuyay-13 gate → route → Khipu receipt)

```
                         world (public sources)
                                 │  stream()
                                 ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │ parse() → normalize() → IngestEvent                               │
   └─────────────────────────────────────────────────────────────────┘
                                 │
                  ┌──────────────┴──────────────┐
                  ▼ dedup (content_hash in log?) │
              seen → +duplicate, STOP            │ new
                                 ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │ Yuyay-13 gate  (wayra/core/yuyay_gate.py:gate)                    │
   │   q = quality(ev)   n = novelty(ev, known)   y = yuyay13(ev)      │
   │   wayra_factor = q · n · y                                        │
   │     wf < 0.30  → DROP    (receipt, never routed)                 │
   │     wf > 0.70  → ACCEPT  (route to organ)                        │
   │     else       → REVIEW  (queue for human Yuyay)                 │
   └─────────────────────────────────────────────────────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼ accept           ▼ review            ▼ drop
        route → organ      queue (no route)     no route
              └──────────────────┼──────────────────┘
                                 ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │ IngestLog.emit(ev): persist event row (idempotent on hash)       │
   │   + chain a Khipu receipt (sha3-256, prev-linked)  ← HARD RULE    │
   │   action = "ingest:<decision>"                                   │
   └─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼ (accept only)
            pub/sub fan-out → flagship subscribers (Wires D–H)
```

A Khipu receipt is emitted for **every** decision — accept, review, *and* drop — so the
chain is the complete, tamper-evident record of everything WAYRA ever breathed
(`verify_chain()` re-walks the prev-links + sha3 digests). Honest label: signature is
**DSSE PLACEHOLDER**; the store verifies the hash chain, not a cryptographic signature.

---

## 4 — Storage (60-day hot / 1-year warm / archive to HF dataset)

- **Hot (0–60 days):** SQLite `wayra_ingest.db` — `events` (dedup on `content_hash`,
  indexed by source + decision) + `receipts` (append-only chain). Stdlib `sqlite3`, zero
  new pip install, durable WHERE/ORDER queries (the durability the v13 in-memory
  `KhipuDAG` explicitly deferred to WASI-RIKUQ). Powers the `/wayra` tab read API:
  `recent()`, `search()`, `source_stats()`, `top_n()`, `verify_chain()`.
- **Warm (60 days–1 year):** nightly job copies aged rows to a partitioned SQLite/Parquet
  warm store (same schema), keeping hot small and fast.
- **Archive (>1 year):** the warm partitions are pushed to an HF **dataset** repo
  (`SZLHOLDINGS/wayra-ingest-archive`) via `HfApi.upload_file` — append-only, the chain
  digests preserved so the archive is independently verifiable. (LMDB is the documented
  alternative for the hot tier; SQLite was chosen for stdlib-only + slim-image fit.)

---

## 5 — Pub/sub (WebSocket + webhook, Wires D–H integration)

Accepted events fan out to flagship subscribers:

- **WebSocket** `/wayra/ws` — live push of each accepted `IngestEvent` (the `/wayra` tab
  live feed subscribes here).
- **Webhook** — per-subscriber POST of `{event, organ_routing, receipt_digest}` to
  registered flagship endpoints, integrated into the **Wires D–H** resilience mesh
  (the same WebSocket+webhook substrate the v13 edge organs use). Delivery is
  at-least-once with the receipt digest as the idempotency key.
- **Telemetry** → WASI-RIKUQ receives items/day, accept-ratio, chain depth, per-source
  health for `/dashboard/everything`.

---

## 6 — "Take it and make it our own" (the founder directive, realized)

For an **accepted** item, the `/wayra` tab exposes a per-item **"Take it and make it our
own"** action. It:
1. extracts the actionable insight from `parsed_summary` + `raw`,
2. drafts an artifact for the routed organ — a **PR stub** (e.g. add a new GREEN-license
   model to the a11oy router config; bump a pinned upstream dependency) or a **Doctrine
   update stub** (e.g. a new standards draft worth tracking),
3. queues it for **human Yuyay review** (never auto-merges),
4. emits a Khipu receipt for the draft action.

The model-admission special case: a new GREEN/AMBER open-weight model on HF triggers a
Yuyay-gated **quick benchmark** via a11oy `/v1/router` on a small eval set; only if the
benchmark + Yuyay-13 clear threshold is the model added to the router. **Weights are
never baked** — closed models are added via official providers only (LEGAL ❌-list).

---

## 7 — Daily digest (Wallpa-narrated Hatun-Willay briefing)

Each morning a scheduled job (`schedule_cron`) calls `IngestLog.top_n(5, "accept")`,
hands the top-5 to **WALLPA** for synthetic-timbre narration (open-source TTS only —
Doctrine v13 §5), and publishes the audio + transcript to `/wayra/digest` as a
**Hatun-Willay** morning briefing. Cost-bounded: the day's intake is capped at **50
items before Yuyay drop** (HARD RULE), so the digest summarizes a bounded, gated stream.

---

## 8 — Cron / always-on cadence

| Job | Cadence | Action |
|---|---|---|
| `wayra-hourly` | hourly | HF Hub + GitHub releases poll → gate → receipt → route |
| `wayra-daily` | daily 06:00 | arXiv + standards + drone OSINT poll; then build + publish digest |
| `wayra-warm-roll` | nightly | roll 60-day-aged rows hot→warm |
| `wayra-archive` | weekly | push >1y warm partitions to HF dataset archive |

All cron jobs run the same `run_once()` per adapter; all are event-driven, all
Khipu-receipted, all Yuyay-gated. The daily digest cron is scheduled via `schedule_cron`
(see `VERIFICATION.md`).

— Yachay, under CTO authority, 2026-06-01.
