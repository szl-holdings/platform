# INFRA_TO_ANATOMY_MAP — PURIQ Definitive Organ → Infra Wiring

**Layer:** PURIQ (agentic anatomy evolution)
**Author agent:** brain-trust subagent · SZL Holdings
**Date:** 2026-06-01
**Inputs:** `VECTOR_DB_LEADERS_2026.md`, `NVIDIA_DEV_INFRA_2026.md`, `PURIQ_CHARTER.md`, thesis anatomy index.
**Constraint discipline:** Zero-Bandaid. Every choice cited. No mystical language. Design + patch sketch only — **no installs.**

---

## 0. Master formula reminder (charter seed)

P(x, t) = argmax over a in 𝒜 of [ Λ(x) · Yuyay_13(a) · exp(−β · HUKLLA(a)) · ∏_i Khipu_i(a) ]

Each organ below supplies one factor of this product, and the infra mesh is chosen so each factor is computed under bounded latency with a Khipu receipt emitted.

---

## 1. Definitive mapping table

| Organ (PURIQ / thesis) | Factor in P(x,t) | Chosen vector DB | Chosen NVIDIA service(s) | Wire shape | Expected latency (target) | Directive |
|---|---|---|---|---|---|---|
| **Yuyay — Heart** (13-axis gate) | `Yuyay_13(a)` | — (compute organ, reads Amaru/Khipu) | **TensorRT-LLM + Dynamo** | gate-eval as low-latency LLM inference; Dynamo disagg prefill/decode; FP8/NVFP4 | p50 gate eval **< 50 ms** warm | ✅ founder-locked |
| **Lambda — Spine** (Λ-aggregator) | `Λ(x)` | — (compute organ) | **TensorRT-LLM + Dynamo** | Λ aggregation across reasoning passes; Dynamo KV-aware router + topology autoscale | p50 **< 80 ms** multi-pass | ✅ founder-locked |
| **Kallpa — Wires** (bus/routing) | transport of `a`, receipts | — | **NIM + Triton** | OpenAI-compatible NIM endpoints behind Triton multi-model serving; a11oy.code router targets these | per-hop **< 10 ms** routing overhead | ✅ founder-locked |
| **Amaru — Brain** (memory) | feeds `Yuyay_13`, `Λ` context | **Milvus** (GPU_CAGRA / cuVS); pgvector fallback | **NeMo Retriever** (embed+rerank) + cuVS | embed via NeMo Retriever NIM → store in Milvus GPU index → similarity+rerank | recall query p50 **< 20 ms** warm GPU index | ✅ founder-locked |
| **Khipu — DAG index** (receipt chain) | `∏_i Khipu_i(a)` | **ApertureDB** (graph-vector + multimodal ACID); LanceDB alt | NeMo Retriever ingest + **cuGraph** | receipt nodes+edges as graph-vectors; cuGraph traversal for chain_verified checks | chain verify p50 **< 30 ms** | derived |
| **Hukulla — Immune** (tripwires/antigens) | `exp(−β·HUKLLA(a))` | **Qdrant** (filterable-HNSW); Vald alt | **Morpheus** + cuML + NeMo Guardrails | Morpheus stream classifies → Qdrant NN match vs signature store → tripwire fire | threat NN match p50 **< 5 ms** | ✅ founder-locked |
| **Yawar — Ledger index** (append-only) | receipt persistence | **pgvector** (full Postgres ACID) | NeMo Retriever embed | ledger row + embedding co-transacted in one ACID write | commit p50 **< 15 ms** | derived |
| **Killinchu — Drone flagship** (swarm) | action execution in physical 𝒜 | (telemetry → Hukulla store) | **cuOpt** (VRP) + Holoscan edge + Earth-2 priors | cuOpt solves swarm path VRP near-real-time; Holoscan on-drone sensor fusion | VRP re-solve **< 1 s** for swarm | ✅ founder-locked |

Latency targets are design SLOs grounded in vendor-stated warm-path numbers (e.g. Turbopuffer warm p50≈14 ms/1M docs, Qdrant 2-stage prefetch, NIM ~5-min deploy / sub-second inference), not measured SZL figures. They are Lake-testable acceptance gates, not claims.

---

## 2. Per-organ justification (cited)

### 2.1 Yuyay (Heart) — TensorRT-LLM + Dynamo
The Heart is the 13-axis conjunctive gate (AND, no averaging; sacred axes ≥0.95) — the hottest path, evaluated before every agentic act ([anatomy heart figure, INDEX.md line 49](thesis-repo/docs/anatomy/INDEX.md)). TensorRT-LLM's FP8/NVFP4 quantization + speculative decoding (EAGLE-3) minimize per-gate latency ([TensorRT-LLM](https://developer.nvidia.com/tensorrt-llm)); Dynamo's disaggregated prefill/decode lets the gate's context-load and verdict-emit phases be tuned independently ([Dynamo](https://www.nvidia.com/en-us/ai/dynamo/)). **Per founder directive.**

### 2.2 Lambda (Spine) — TensorRT-LLM + Dynamo
The Spine is the Λ positive-homogeneous, bounded, monotone aggregator. Multi-pass reasoning aggregation benefits directly from Dynamo's LLM-aware KV-cache router (routes by cache overlap → no redundant recompute across Λ passes) and topology-aware autoscaling at fleet scale ([Dynamo dev page](https://developer.nvidia.com/dynamo)). **Per founder directive.**

### 2.3 Kallpa (Wires) — NIM + Triton
The Wires carry every inter-organ message (cf. YAWAR bus / nervous-system span propagation). NIM gives a uniform OpenAI-compatible contract so a11oy.code can route any unified Llama/Qwen model identically ([NIM](https://www.nvidia.com/en-us/ai-data-science/products/nim-microservices/)); Triton (BSD, sovereign) is the multi-model serving substrate underneath, also hosting Morpheus models ([Triton BSD](https://docs.nvidia.com/deeplearning/triton-inference-server/bsd/index.html); [Morpheus](https://developer.nvidia.com/morpheus-cybersecurity)). **Per founder directive.**

### 2.4 Amaru (Brain) — Milvus + NeMo Retriever
Charter says "Milvus or pgvector + NeMo Retriever." Milvus chosen as primary: Apache 2.0, tens-of-billions scale, and a **native cuVS/CAGRA GPU index** that co-locates Brain memory on NVIDIA infra ([Milvus](https://milvus.io/docs/overview.md); [Milvus cuVS](https://milvus.io/ai-quick-reference/how-does-blackwell-cuvs-library-integrate-with-milvus-vector-search)). NeMo Retriever supplies the embed→store→rerank front-half, storing into a cuVS-accelerated DB by design ([NeMo Retriever](https://developer.nvidia.com/nemo-retriever)). pgvector retained as the charter-sanctioned fallback when transactional co-location with the ledger outweighs GPU throughput. **Per founder directive.**

### 2.5 Khipu (DAG index) — ApertureDB + cuGraph
The receipt DAG is literally a directed graph of receipts; `∏_i Khipu_i(a)` requires `chain_verified=true` traversal. ApertureDB's native graph-vector model + **multimodal ACID transactions** store receipt edges and their embeddings transactionally in one engine ([ApertureDB](https://docs.aperturedata.io/Introduction/WhatIsAperture)); cuGraph accelerates the chain-integrity traversals ([CUDA-X DS](https://developer.nvidia.com/topics/ai/data-science/cuda-x-data-science-libraries)). LanceDB is the alternative when immutable per-insert versioning is preferred over graph traversal ([Lance docs](https://docs.lancedb.com/lance)).

### 2.6 Hukulla (Immune) — Morpheus + Qdrant
Per directive: "Hukulla immune system gets Morpheus + Qdrant for threat-sig vectorstore." Morpheus streams/classifies cybersecurity events on GPU ([Morpheus](https://developer.nvidia.com/morpheus-cybersecurity)); the classified signature is matched against the antigen store via Qdrant's filterable-HNSW + payload index — purpose-built for high-precision, cardinality-aware filtered NN (e.g. "class=exfil AND severity≥0.8") ([Qdrant filtering](https://qdrant.tech/articles/vector-search-filtering/)). cuML adds GPU HDBSCAN/UMAP for unsupervised novel-threat clustering; NeMo Guardrails adds jailbreak/PII rails as extra antibody classes ([NeMo Guardrails](https://developer.nvidia.com/nemo-guardrails)). This drives `exp(−β·HUKLLA(a))`. **Per founder directive.**

### 2.7 Yawar (Ledger index) — pgvector
The append-only ledger demands that receipt embeddings co-transact with the ledger rows. pgvector is the only surveyed option giving **full Postgres ACID** with vectors and relational rows in one MVCC transaction ([VeloDB pgvector](https://www.velodb.io/glossary/what-is-pgvector)). Satisfies INV-VDB-2.

### 2.8 Killinchu (Drone) — cuOpt + Holoscan + Earth-2
Per directive: "Killinchu drone flagship gets cuOpt for swarm path optimization." cuOpt's GPU VRP solver computes multi-drone routes at million-variable scale, Apache 2.0 self-host, near-real-time ([cuOpt](https://www.nvidia.com/en-us/ai-data-science/products/cuopt/); [cuOpt OSS blog](https://developer.nvidia.com/blog/accelerate-decision-optimization-using-open-source-nvidia-cuopt/)). Holoscan handles on-drone real-time sensor fusion at the edge ([Holoscan](https://www.nvidia.com/en-us/edge-computing/holoscan/)); Earth-2 open weather models supply no-fly-window constraints into the VRP ([Earth-2](https://blogs.nvidia.com/blog/nvidia-earth-2-open-models/)). **Per founder directive.**

---

## 3. Mesh diagram (text)

```
                         ┌──────────────────────────────────────────┐
   sensory in ──Riva──▶  │  KALLPA (Wires): NIM + Triton             │ ◀── a11oy.code router
                         │  uniform OpenAI-API; multi-model serving  │
                         └───────────────┬──────────────────────────┘
                                         │ (every inter-organ message)
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                 ▼                                 ▼
┌───────────────┐              ┌────────────────────┐            ┌────────────────────┐
│ YUYAY (Heart) │  Λ(x) ◀─────▶│  LAMBDA (Spine)    │            │ HUKLLA (Immune)    │
│ TensorRT-LLM  │  Yuyay_13(a) │  TensorRT-LLM      │            │ Morpheus + Qdrant  │
│ + Dynamo      │              │  + Dynamo          │            │ + cuML + Guardrails│
└──────┬────────┘              └─────────┬──────────┘            └─────────┬──────────┘
       │ reads context                   │                    exp(−β·HUKLLA(a))
       ▼                                 ▼                                 │
┌────────────────────┐        ┌────────────────────┐                      │
│ AMARU (Brain)      │        │ KHIPU (DAG index)  │  ∏ Khipu_i(a)         │
│ Milvus(cuVS/CAGRA) │        │ ApertureDB + cuGraph│◀────────────────────┘
│ + NeMo Retriever   │        └─────────┬──────────┘
└──────┬─────────────┘                  │ receipts
       │ embeddings                     ▼
       │               ┌────────────────────────────┐
       └──────────────▶│ YAWAR (Ledger): pgvector    │ (ACID co-transact)
                       └────────────────────────────┘

        KILLINCHU (Drone flagship): cuOpt VRP + Holoscan edge + Earth-2 priors
        (acts in physical 𝒜; telemetry → Hukulla store; routes ← Lambda decisions)
```

---

## 4. Patch sketches (NO INSTALL — design only)

### 4.1 `puriq/integration/amaru/amaru_brain_store.patch.md` (sketch)
```
+ organ: amaru
+ vector_db: milvus
+   index_type: GPU_CAGRA          # cuVS-backed; CUDA 12.x req (Milvus cuVS ref)
+   metric: IP
+   fallback: pgvector(hnsw)       # charter-sanctioned
+ embed: nemo_retriever.embedding_nim  # OpenAI-compatible /v1/embeddings
+ rerank: nemo_retriever.reranking_nim
+ wire: via KALLPA (NIM endpoint)
+ receipt: emit khipu on every store + recall   # Zero-Bandaid: no silent write
```

### 4.2 `puriq/integration/hukulla/hukulla_immune.patch.md` (sketch)
```
+ organ: hukulla
+ stream: morpheus.pipeline(filter -> classify)   # Triton-served model
+ sig_store: qdrant
+   index: hnsw(filterable) + payload_index        # cardinality-aware planner
+   filter: {class, severity>=, ttl}
+ cluster: cuml.hdbscan(novel_threat)              # GPU unsupervised
+ rails: nemo_guardrails(jailbreak, pii, topic)
+ output: tripwire_fire -> exp(-beta*HUKLLA(a))    # feeds master formula
+ receipt: emit khipu on every fire AND every clear
```

### 4.3 `puriq/integration/heart_spine/yuyay_lambda.patch.md` (sketch)
```
+ organ: yuyay(heart), lambda(spine)
+ engine: tensorrt_llm(fp8|nvfp4, eagle3_spec_decode)
+ serve: dynamo(disaggregated_prefill_decode, kv_aware_router, topo_autoscale)
+ heart_gate: 13-axis AND; sacred>=0.95; reject -> receipted
+ spine_lambda: positive_homogeneous, bounded, monotone aggregation
+ wire: KALLPA (NIM/Triton)
```

### 4.4 `puriq/integration/killinchu/killinchu_swarm.patch.md` (sketch)
```
+ organ: killinchu
+ optimizer: cuopt.vrp(vehicles=swarm, constraints=[geo, weather, battery])
+ env_prior: earth2.open_model -> no_fly_windows
+ edge: holoscan(sensor_fusion) on-drone
+ telemetry -> hukulla.sig_store(qdrant)
+ routes <- lambda.decision
+ receipt: emit khipu per route-solve
```

---

## 5. Lean obligations introduced (sorry-tagged until proven; never hidden)

- **OBL-MESH-1 (Gate latency bound):** `heart_gate_eval_time ≤ SLO_heart (50ms warm)` — Lake-testable via NIM perf harness. Status: `sorry`.
- **OBL-MESH-2 (Immune NN soundness):** if a threat vector's NN distance < τ to a known antigen, Hukulla MUST fire (no false-negative below τ). Cross-links HUKLLA T03/T04. Status: `sorry`.
- **OBL-MESH-3 (Ledger ACID):** every Yawar write is atomic over {ledger_row, embedding} — discharged by Postgres MVCC (pgvector co-transaction). Status: provable from Postgres ACID guarantee ([VeloDB](https://www.velodb.io/glossary/what-is-pgvector)).
- **OBL-MESH-4 (Khipu chain integrity):** `∏_i Khipu_i(a) > 0` iff every receipt in the DAG path has `chain_verified=true` — cuGraph traversal returns full reachability. Status: `sorry`.
- **OBL-MESH-5 (License sovereignty):** every production component is OSI-permissive self-hostable OR free-dev-tier (INV-VDB-1 + NVIDIA OSS list). Verified non-sorry: TensorRT-LLM, Dynamo, Triton, cuOpt, RAPIDS, Milvus, Qdrant, pgvector all OSS.

---

## 6. Open risks (no bandaid — surfaced, not buried)

1. **NIM/Morpheus/Riva production = NVAIE license.** Free dev path exists, but production scale requires NVAIE. Sovereign alternative for serving: raw TensorRT-LLM + Triton (both OSS) without the NIM wrapper. Decision deferred to founder.
2. **ApertureDB is enterprise-licensed**, unlike the rest of the Khipu candidates. If strict OSS sovereignty is required for Khipu, **LanceDB (Apache 2.0)** is the fallback at the cost of native graph traversal.
3. **GPU dependency for cuVS/cuOpt/Morpheus/cuML** — all require compatible NVIDIA GPUs (CUDA 12.x for Blackwell cuVS). This is intended (founder directive to bake NVIDIA in) but is a hard infra dependency to record.
4. **Latency SLOs are design targets**, not measured — must be validated in Lake before any agentic act ships (OBL-MESH-1).

*End of INFRA_TO_ANATOMY_MAP.*
