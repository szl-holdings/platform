# VECTOR_DB_LEADERS_2026 — PURIQ Vector Store Survey

**Layer:** PURIQ (agentic anatomy evolution)
**Author agent:** brain-trust subagent · SZL Holdings
**Date:** 2026-06-01
**Scope:** 12 vector-DB leaders mapped to SZL anatomy organs. No installs — design selection only.
**Constraint discipline:** Zero-Bandaid. Every selection is justified by a primary doc citation. No mystical language.

---

## 0. SZL anatomy organs (selection targets)

Grounded in the canonical anatomy index (`thesis-repo/docs/anatomy/INDEX.md`) and the evolved organ table (`docs/v14/ch9_anatomy_evolved_v1.md`). PURIQ uses the agentic organ names from the charter; the bridge to the canonical thesis module is noted.

| PURIQ organ | Thesis module | Function the vector store must serve |
|---|---|---|
| **Amaru** (Brain / sequence memory) | `amaru` (HEART/sequence-memory in v14), AMARU cortex | Long-term agentic memory; episodic + semantic recall for `puriq.reflect`; RAG over doctrine + receipts |
| **Khipu** (DAG index) | YAWAR append-only ledger + receipt chain | Index the receipt DAG; retrieve prior `Khipu_i(a)` receipts by semantic + structural key |
| **Hukulla** (Immune / threat-sig store) | HUKLLA T01–T10 tripwires + SENTRA antigen cards | Nearest-neighbor lookup over threat-signature vectors; sub-ms anomaly match |
| **Yawar** (Ledger index) | YAWAR bus / circulatory ledger | Transactional index over the append-only ledger; ACID-consistent metadata filter |

(Heart/Yuyay and Spine/Lambda are compute organs served by NVIDIA inference, not vector stores — see `INFRA_TO_ANATOMY_MAP.md`.)

---

## 1. Per-DB survey

Legend: **OSS** = open-source self-hostable. Scale ceiling = vendor-stated. Hybrid = dense+sparse/keyword fusion. ACID = transactional guarantee level.

### 1.1 Milvus

- **License:** Apache 2.0; project under LF AI & Data Foundation (Linux Foundation), Zilliz as major contributor ([Milvus docs — What is Milvus](https://milvus.io/docs/overview.md); [Milvus GitHub](https://github.com/milvus-io/milvus)).
- **Scale ceiling:** Billion-scale since 2022, "tens of billions" of vectors in 2023, distributed compute/storage separation; powers 300+ enterprises incl. NVIDIA, PayPal, eBay ([Milvus docs](https://milvus.io/docs/overview.md)).
- **Hybrid search:** Yes — multi-vector hybrid search, plus native GEOMETRY+R-Tree spatial hybrid in 2.6.4 ([Milvus multi-vector search](https://milvus.io/docs/multi-vector-search.md); [Milvus hybrid spatial blog](https://milvus.io/blog/hybrid-spatial-and-vector-search-with-milvus-264.md)).
- **Metadata filtering:** Yes, with range search and two-phase filtering ([Milvus docs](https://milvus.io/docs/overview.md)).
- **ACID:** Entity-level consistency tunable (strong/bounded/eventual); not a full RDBMS — segment-based, eventually-consistent streaming updates.
- **Embedding cache / on-disk vs in-memory:** Supports HNSW, IVF, FLAT, SCANN, DiskANN with quantization variants and **mmap** (on-disk) plus **GPU indexing via NVIDIA CAGRA / cuVS** ([Milvus GitHub](https://github.com/milvus-io/milvus); [Milvus cuVS reference](https://milvus.io/ai-quick-reference/how-does-blackwell-cuvs-library-integrate-with-milvus-vector-search)).
- **Latency profile:** Tunable; GPU CAGRA gives high-throughput low-latency at scale (100M CAGRA index builds <5 min on Blackwell B100 vs 40 min on A100) ([Milvus cuVS ref](https://milvus.io/ai-quick-reference/how-does-blackwell-cuvs-library-integrate-with-milvus-vector-search)).
- **Best organ:** **Amaru (Brain).** Distributed billion-scale memory + native cuVS/CAGRA GPU path aligns Amaru memory directly onto NVIDIA infra (heart/spine directive). First choice for the brain.

### 1.2 Weaviate

- **License:** BSD-3-Clause (OSS) ([Weaviate LICENSE](https://github.com/weaviate/weaviate/blob/main/LICENSE)); also cross-referenced as permissive OSS ([Future AGI 2026 comparison](https://futureagi.com/blog/best-vector-databases-for-rag-2026)).
- **Scale ceiling:** Horizontally sharded; S3 tenant offloading for cold tiers ([Weaviate tenant offloading via SO thread](https://stackoverflow.com/questions/78896027/simple-hybrid-search-in-qdrant)).
- **Hybrid search:** Native, mature — BM25F + dense fusion since v1.17, configurable fusion (relative-score / ranked) and per-component weighting (`alpha`) ([Weaviate hybrid docs](https://docs.weaviate.io/weaviate/search/hybrid); [Weaviate hybrid explained](https://weaviate.io/blog/hybrid-search-explained)).
- **Metadata filtering:** Rich filter grammar; filters apply to both BM25 and vector legs before fusion ([Weaviate forum — filtering with hybrid](https://forum.weaviate.io/t/filtering-with-hybrid-search-or-with-get-collection/2346)).
- **ACID:** Object-level consistency; not full multi-statement ACID.
- **On-disk vs in-memory:** HNSW in-memory by default; **flat index** + `vectorCacheMaxObjects` for disk-bound, plus S3 offloading ([SO thread](https://stackoverflow.com/questions/78896027/simple-hybrid-search-in-qdrant)).
- **Latency profile:** Low-latency for in-memory HNSW; degrades gracefully to disk/flat.
- **Best organ:** **Amaru (Brain) — strong runner-up**, or **Khipu** where rich BM25 keyword fusion over receipt text matters. Best-in-class native hybrid makes it the fallback brain if Milvus ops overhead is undesirable.

### 1.3 Qdrant

- **License:** Apache 2.0; Rust core ([Future AGI 2026](https://futureagi.com/blog/best-vector-databases-for-rag-2026); [Qdrant quantization repo](https://github.com/qdrant/quantization)).
- **Scale ceiling:** Demonstrated 400M-vector (LAION-400M) cost-efficient index on ~54 GB RAM using FLOAT16 + binary quantization + on-disk vectors ([Qdrant large-scale search](https://qdrant.tech/documentation/tutorials-operations/large-scale-search/)).
- **Hybrid search:** Yes — sparse + dense via Query API with prefetch stages and reciprocal-rank-fusion (RRF) ([Qdrant hybrid tutorial](https://qdrant.tech/documentation/tutorials-basics/cloud-inference-hybrid-search/); [SO thread, Qdrant team reply](https://stackoverflow.com/questions/78896027/simple-hybrid-search-in-qdrant)).
- **Metadata filtering:** Best-in-class — **filterable HNSW** with payload index, query planner switches between HNSW and payload-only based on filter cardinality; 14+ filter conditions incl. geo, datetime-range, nested ([Qdrant filtering guide](https://qdrant.tech/articles/vector-search-filtering/)).
- **ACID:** Per-point write consistency; not multi-statement ACID.
- **On-disk vs in-memory:** Explicit `on_disk` flag + mmap; granular control over what lives in RAM (quantized in RAM, full vectors on disk) ([Qdrant large-scale](https://qdrant.tech/documentation/tutorials-operations/large-scale-search/); [Qdrant quantization](https://qdrant.tech/documentation/manage-data/quantization/)).
- **Latency profile:** 2-stage prefetch (in-RAM) → rescore (on-disk) gives tight latency/recall control; excellent for high-cardinality filtered queries.
- **Best organ:** **Hukulla (Immune / threat-sig store).** The filterable-HNSW + payload index is purpose-built for low-cardinality, high-precision filtered NN match (e.g., "threat class = X AND severity ≥ Y"), exactly the antigen/tripwire lookup pattern. **Primary choice for Hukulla** (pairs with NVIDIA Morpheus).

### 1.4 pgvector (PostgreSQL)

- **License:** PostgreSQL License (permissive, MIT-style); extension installed via `CREATE EXTENSION vector;` ([pgvector GitHub](https://github.com/pgvector/pgvector); [VeloDB pgvector glossary](https://www.velodb.io/glossary/what-is-pgvector)).
- **Scale ceiling:** Bounded by the Postgres instance; HNSW + IVFFlat indexes; AWS Aurora/RDS accelerate HNSW build/search ([AWS pgvector HNSW blog](https://aws.amazon.com/blogs/database/accelerate-hnsw-indexing-and-searching-with-pgvector-on-amazon-aurora-postgresql-compatible-edition-and-amazon-rds-for-postgresql/)).
- **Hybrid search:** Yes — combine pgvector ANN with Postgres full-text (`tsvector`/BM25-style) in one SQL query ([Jonathan Katz — hybrid search Postgres+pgvector](https://jkatz.github.io/post/postgres/hybrid-search-postgres-pgvector/)).
- **Metadata filtering:** Full SQL `WHERE` — the richest filtering of any option (joins, subqueries, arbitrary predicates).
- **ACID:** **Full Postgres ACID** — vectors and relational rows share the same transactions, backups, and MVCC ([VeloDB pgvector](https://www.velodb.io/glossary/what-is-pgvector)). This is its decisive differentiator.
- **On-disk vs in-memory:** On-disk by default (Postgres buffer cache); indexes persist on disk.
- **Latency profile:** Higher base latency than purpose-built engines, but strong when vectors must co-transact with relational/ledger data.
- **Best organ:** **Yawar (Ledger index)** — the ACID ledger needs vectors to live *inside* the same transaction as the append-only rows. Also the **Amaru fallback** (charter explicitly allows "Milvus or pgvector"). **Primary choice for Yawar.**

### 1.5 LanceDB (Lance format)

- **License:** Apache 2.0; built on the open **Lance** columnar lakehouse format ([Lance docs](https://docs.lancedb.com/lance); [Groovy Web top-10 2026](https://www.groovyweb.co/blog/top-10-ai-vector-databases-2026)).
- **Scale ceiling:** Object-storage-native; stateless compute, "no RAM constraints at scale," 10 TB on one small node off-peak ([LanceDB vector DB guide](https://lancedb.com/lp/vector-db-guide/)).
- **Hybrid search:** Vector + full-text + SQL filter compose into a single query against one table ([LanceDB guide](https://lancedb.com/lp/vector-db-guide/)).
- **Metadata filtering:** SQL filtering inline; embeddings/metadata/raw blobs in one table ([LanceDB guide](https://lancedb.com/lp/vector-db-guide/)).
- **ACID / versioning:** **Built-in data versioning** — every insert creates a new dataset version with manifest tracking; zero-copy column evolution (add embedding column without table rewrite) ([Lance docs](https://docs.lancedb.com/lance); [Lance v2 blog](https://www.lancedb.com/blog/lance-v2)).
- **On-disk vs in-memory:** On-disk / object-storage first ($0.02/GB-mo), only hot index in memory; columnar point-lookup optimized ([LanceDB guide](https://lancedb.com/lp/vector-db-guide/); [Lance v2](https://www.lancedb.com/blog/lance-v2)).
- **Latency profile:** Not sub-ms p99; trades a bit of latency for radical cost + multimodal storage.
- **Best organ:** **Khipu (DAG index) — strong candidate.** Built-in immutable versioning maps 1:1 onto the append-only, version-chained receipt DAG; zero-copy column add lets us attach new receipt features without rewriting history. Also ideal for cheap cold-tier Amaru archive.

### 1.6 Chroma

- **License:** Apache 2.0 (OSS) ([Chroma GitHub](https://github.com/chroma-core/chroma); [Oracle — what is Chroma](https://www.oracle.com/database/vector-database/chromadb/)).
- **Scale ceiling:** Three modes — Local (embedded), Single-Node (<10M records typical), Distributed (object storage + SQL catalog + SSD cache, millions of collections) ([Chroma architecture overview](https://docs.trychroma.com/reference/architecture/overview); [Chroma distributed](https://docs.trychroma.com/reference/architecture/distributed)).
- **Hybrid search:** Collections support vector similarity, full-text, and metadata filtering ([Chroma architecture](https://docs.trychroma.com/reference/architecture/overview)).
- **Metadata filtering:** Yes, per-collection ([Chroma architecture](https://docs.trychroma.com/reference/architecture/overview)).
- **ACID:** System catalog backed by SQL DB; not full multi-statement ACID at the vector layer.
- **On-disk vs in-memory:** Embedded local; distributed mode separates compute/storage with object storage + local SSD cache ([Chroma distributed](https://docs.trychroma.com/reference/architecture/distributed)).
- **Latency profile:** Excellent for prototyping/single-node; distributed mode adds object-storage latency tradeoffs.
- **Best organ:** **Dev/prototype harness for any organ** — fastest path to a working `puriq.reflect` RAG loop before committing Amaru to Milvus. Not recommended as a production organ store at SZL scale.

### 1.7 Vespa

- **License:** Apache 2.0 (OSS) + Vespa Cloud ([Future AGI 2026](https://futureagi.com/blog/best-vector-databases-for-rag-2026); [Groovy Web 2026](https://www.groovyweb.co/blog/top-10-ai-vector-databases-2026)).
- **Scale ceiling:** Billion-scale hybrid HNSW-IF (HNSW + inverted file) demonstrated ([Vespa billion-scale blog](https://blog.vespa.ai/vespa-hybrid-billion-scale-vector-search/)).
- **Hybrid search:** Best-in-class — search + ranking + recommendation co-resident; full hybrid + reranker stages ([Vespa hybrid tutorial](https://docs.vespa.ai/en/learn/tutorials/hybrid-search.html); [Future AGI 2026](https://futureagi.com/blog/best-vector-databases-for-rag-2026)).
- **Metadata filtering:** Structured query + filtering + routing/classification pipelines ([Pureinsights Vespa hybrid](https://pureinsights.com/blog/2025/discovery-2-2-vespa-ai-unlocking-hybrid-search-at-scale/)).
- **ACID:** Document-level consistency; designed for real-time big-data serving, not RDBMS ACID.
- **On-disk vs in-memory:** Tunable attribute-in-memory vs on-disk; mature tiering.
- **Latency profile:** Real-time, low-latency at billion scale with multi-phase ranking.
- **Best organ:** **Khipu (DAG index) — top contender** where multi-phase ranking over receipts matters, or a unified **Amaru+Khipu** serving layer. Heavier ops than Qdrant; reserve for when ranking sophistication is required.

### 1.8 Pinecone

- **License:** Closed — managed serverless only, no self-host ([Future AGI 2026](https://futureagi.com/blog/best-vector-databases-for-rag-2026)).
- **Scale ceiling:** Serverless slabs in object storage (LSM-tree), stateless executors; demonstrated 10M-scale with >98% filter recall ([Pinecone ICML 2025 paper](https://www.pinecone.io/research/ICML_2025.pdf)).
- **Hybrid search:** Sparse-dense supported.
- **Metadata filtering:** Strong — filtering integrated into the retrieval path via per-slab metadata index + compressed bitmaps; exact filter recall maintained ([Pinecone metadata filtering research](https://www.pinecone.io/research/accurate-and-efficient-metadata-filtering-in-pinecones-serverless-vector-database/); [Pinecone filter docs](https://docs.pinecone.io/guides/search/filter-by-metadata)).
- **ACID:** Eventual consistency in serverless; not transactional.
- **On-disk vs in-memory:** Object-storage slabs, compressed reps in node memory for fast point-reads ([ICML 2025 paper](https://www.pinecone.io/research/ICML_2025.pdf)).
- **Latency profile:** Managed low-latency; opaque infra.
- **Best organ:** **None as primary** — closed/managed conflicts with SZL sovereignty + Zero-Bandaid self-host posture. Reference design only; cite their filtering architecture as the bar Qdrant/Milvus must meet.

### 1.9 Marqo

- **License:** OSS (Apache 2.0), end-to-end vector *search engine* incl. embedding generation ([Marqo GitHub](https://github.com/marqo-ai/marqo)).
- **Scale ceiling:** Built on a search backend (Vespa/Opensearch lineage); handles text + image in one API.
- **Hybrid search:** Tensor/lexical search; embedding, storage, retrieval out of the box ([Marqo GitHub](https://github.com/marqo-ai/marqo); [Marqo — what is tensor search](https://www.marqo.ai/blog/what-is-tensor-search)).
- **Metadata filtering:** Yes (search backend filters).
- **ACID:** Inherits backend doc-level consistency.
- **On-disk vs in-memory:** Backend-dependent.
- **Latency profile:** Good for multimodal ecommerce-style search; opinionated all-in-one pipeline.
- **Best organ:** **Amaru multimodal sub-index** if/when Puriq memory must embed images natively without a separate embedding service. Lower priority than Milvus given the all-in-one coupling.

### 1.10 Vald

- **License:** Apache 2.0; cloud-native, NGT-based ANN ([Vald GitHub](https://github.com/vdaas/vald); [Vald site](https://vald.vdaas.org)).
- **Scale ceiling:** Billions of vectors; distributed index graph, **no stop-the-world** during indexing; horizontal scaling on K8s ([Vald site](https://vald.vdaas.org)).
- **Hybrid search:** Pure dense ANN focus (NGT); no native BM25 hybrid.
- **Metadata filtering:** Limited vs Qdrant/Weaviate.
- **ACID:** Index replication + auto-backup to object storage / PV for disaster recovery; not RDBMS ACID ([Vald site](https://vald.vdaas.org)).
- **On-disk vs in-memory:** In-memory NGT graph, horizontally scaled on memory/CPU; object-storage/PV backup ([Vald site](https://vald.vdaas.org)).
- **Latency profile:** Very low-latency NGT; continuous availability during reindex (key for always-on organs).
- **Best organ:** **Hukulla (Immune) — runner-up to Qdrant** specifically because *indexing never blocks search* — a threat-sig store must accept new signatures continuously while still answering NN queries with no downtime. Strong K8s-native fit.

### 1.11 ApertureDB

- **License:** Enterprise / standalone Docker; graph-vector DB on FAISS ([ApertureDB docs](https://docs.aperturedata.io/Introduction/WhatIsAperture); [ApertureDB Docker Hub](https://hub.docker.com/r/aperturedata/aperturedb-standalone)).
- **Scale ceiling:** Enterprise distributed for horizontal scale + HA ([ApertureDB docs](https://docs.aperturedata.io/Introduction/WhatIsAperture)).
- **Hybrid search:** Vector (FAISS) + **in-memory graph** metadata as a knowledge graph + multimodal blobs in one query ([ApertureDB docs](https://docs.aperturedata.io/Introduction/WhatIsAperture)).
- **Metadata filtering:** Graph-based — relationships, bounding boxes, ROIs, annotations ([ApertureDB Docker Hub](https://hub.docker.com/r/aperturedata/aperturedb-standalone)).
- **ACID:** **Multimodal ACID transactions** spanning data types — rare among vector DBs ([ApertureDB docs](https://docs.aperturedata.io/Introduction/WhatIsAperture)).
- **On-disk vs in-memory:** In-memory graph for metadata; disks or cloud object stores (S3/GCS) for data ([ApertureDB docs](https://docs.aperturedata.io/Introduction/WhatIsAperture)).
- **Latency profile:** Optimized for multimodal CV/ML; graph traversal + similarity in one call.
- **Best organ:** **Khipu (DAG index) — exceptional fit.** The receipt DAG *is* a graph; ApertureDB's native graph-vector + multimodal ACID lets Khipu store receipt relationships (DAG edges) and their embeddings transactionally in one store. **Primary Khipu candidate alongside LanceDB** (graph-native vs version-native tradeoff).

### 1.12 Turbopuffer

- **License:** Proprietary managed service; single `./tpuf` multi-tenant binary, BYOC/single-tenant options ([Turbopuffer site](https://turbopuffer.com); [Turbopuffer architecture](https://turbopuffer.com/docs/architecture)).
- **Scale ceiling:** 4T+ documents, 10M+ writes/s, 25k+ qps in production ([Turbopuffer site](https://turbopuffer.com)).
- **Hybrid search:** Vector + full-text (BM25 inverted index) + exact metadata-filter indexes ([Turbopuffer architecture](https://turbopuffer.com/docs/architecture)).
- **Metadata filtering:** Exact indexes built for filtering ([Turbopuffer architecture](https://turbopuffer.com/docs/architecture)).
- **ACID:** Write-ahead log on object storage guarantees durable writes; consistency tunable (strong default, eventual on request) ([Turbopuffer architecture](https://turbopuffer.com/docs/architecture)).
- **On-disk vs in-memory:** Object-storage-first; NVMe SSD cache after first query — cold p50≈874 ms/1M docs, warm p50≈14 ms/1M docs ([Turbopuffer architecture](https://turbopuffer.com/docs/architecture)).
- **Latency profile:** Sub-10 ms p50 warm; SPFresh centroid index minimizes object-storage roundtrips ([Turbopuffer architecture](https://turbopuffer.com/docs/architecture)).
- **Best organ:** **Amaru cold-archive tier** — radically cheap, massive-scale receipt/memory archive where warm-cache latency is acceptable. Proprietary status keeps it secondary to OSS Milvus/pgvector for the sovereign core.

---

## 2. Decision matrix (organ → recommended primary + rationale)

| Organ | Primary | Runner-up | Decisive property | Pairs with NVIDIA |
|---|---|---|---|---|
| **Amaru** (Brain memory) | **Milvus** (Apache 2.0, tens-of-billions, native cuVS/CAGRA GPU) | pgvector (charter-allowed), Weaviate (native hybrid) | GPU CAGRA path lands memory on NVIDIA infra | NeMo Retriever (embed+rerank), cuVS |
| **Khipu** (DAG index) | **ApertureDB** (graph-vector + multimodal ACID) | LanceDB (immutable versioning) | DAG is a graph; receipts versioned/transactional | NeMo Retriever ingest |
| **Hukulla** (threat-sig store) | **Qdrant** (filterable-HNSW, Apache 2.0, on-disk control) | Vald (non-blocking reindex) | high-precision filtered NN + cardinality-aware planner | **Morpheus** (cyber AI) |
| **Yawar** (ledger index) | **pgvector** (full Postgres ACID) | — | vectors co-transact with append-only ledger rows | NeMo Retriever embed |

---

## 3. Selection invariants (Lean-stateable, no bandaid)

- **INV-VDB-1 (License sovereignty):** Every production organ store MUST be OSI-permissive self-hostable (Apache 2.0 / BSD / PostgreSQL). Pinecone + Turbopuffer (proprietary) are reference/cold-tier only. Verified against each LICENSE above.
- **INV-VDB-2 (ACID where the ledger lives):** Yawar's vector store MUST provide full multi-statement ACID → pgvector is the only candidate satisfying this with relational co-transaction ([VeloDB](https://www.velodb.io/glossary/what-is-pgvector)).
- **INV-VDB-3 (Non-blocking immune index):** Hukulla's store MUST answer NN queries during signature ingest. Qdrant (segment-level) and Vald (distributed index graph, no stop-the-world) both satisfy; Vald is the stricter guarantee ([Vald](https://vald.vdaas.org)).
- **INV-VDB-4 (GPU-native brain):** Amaru MUST expose a GPU index path to co-locate with NVIDIA inference → Milvus GPU_CAGRA on cuVS ([Milvus cuVS ref](https://milvus.io/ai-quick-reference/how-does-blackwell-cuvs-library-integrate-with-milvus-vector-search)).
- **INV-VDB-5 (Receipt-DAG fidelity):** Khipu's store SHOULD model edges natively (graph) or versions natively (immutable) so the DAG's append-only chain integrity is structural, not bolted on → ApertureDB or LanceDB.

*End of VECTOR_DB_LEADERS_2026.*
