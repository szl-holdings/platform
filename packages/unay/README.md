# szl-unay

**UNAY** (Quechua: *"to remember / ancient memory"*) — a durable, receipt-keyed
semantic memory store. Every memory is keyed by a SHA3-256 receipt hash (the same
chain discipline as Khipu) and is recallable by semantic similarity.

## What it does
- **Store**: sqlite (stdlib) — durable on disk, one row per memory.
- **Vector search**: `sqlite-vss` (Faiss-backed) when the extension loads; otherwise an in-process exact cosine scan over the same float32 vectors, **labelled honestly** as `cosine-fallback`. No path ever claims vss when it is cosine.
- **Embedding**: a deterministic, dependency-free hashing embedder (`hashing-embedder/v1`) — NOT a learned LLM embedding, but stable and semantically useful so the Space boots instantly. Callers may inject their own vectors via `remember(..., vector=...)`.
- **Append-only log**: every `remember()` appends a hash-chained receipt (prev-digest link) — tamper-evident and chain-verifiable, exactly like Khipu.
- **LRU eviction**: capacity-bounded hot set; eviction never breaks the append-only log (log is source of truth).

## Install
```bash
pip install -e packages/unay            # cosine-fallback backend
pip install -e "packages/unay[vss]"     # with sqlite-vss when available
```

## Live in
HF Spaces (vendored at deploy time, source of truth = this monorepo):
`amaru`, `sentra`, `rosie` — used as the cortex memory organ behind `szl_unay.py`.

## Import example
```python
from unay import UnayStore

mem = UnayStore(path="/data/unay.db", organ="amaru")
mem.remember("reciprocity is the heart of ayni", meta={"topic": "doctrine"})
hits = mem.recall("ayni reciprocity", k=3)
print(hits)
print(mem.verify_chain())   # {'ok': True, ...}
mem.close()
```

## Tests
```bash
cd packages/unay && pytest tests/
```

---
Doctrine v11 — **749 declarations / 14 unique axioms / 163 sorries** (locked `c7c0ba17`).
Λ = Conjecture 1 (NOT a theorem). SLSA L1 (honest). Reed-Solomon ≠ holographic; event-sourcing ≠ time travel.
Apache-2.0. Signed: Yachay &lt;yachay@szlholdings.dev&gt; · Co-Authored-By: Perplexity Computer Agent.
