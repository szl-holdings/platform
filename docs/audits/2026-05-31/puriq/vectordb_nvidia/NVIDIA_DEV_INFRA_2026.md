# NVIDIA_DEV_INFRA_2026 — PURIQ NVIDIA Developer Infrastructure Survey

**Layer:** PURIQ (agentic anatomy evolution)
**Author agent:** brain-trust subagent · SZL Holdings
**Date:** 2026-06-01
**Founder directive:** "NVIDIA dev infra into heart and spine." Heart (Yuyay) + Spine (Lambda) get **TensorRT-LLM + Dynamo**; Wires (Kallpa) get **NIM + Triton**; Brain (Amaru) gets **NeMo Retriever**; Hukulla immune gets **Morpheus**; Killinchu drone gets **cuOpt**.
**Constraint discipline:** Zero-Bandaid. Every component is cited to NVIDIA primary docs. No mystical language.

---

## 0. Access-model taxonomy (read first)

NVIDIA's stack splits into three legal/access shapes. This governs every PURIQ wiring choice:

1. **OSS (Apache/BSD), self-hostable, no NVAIE required:** TensorRT-LLM, Dynamo, Triton (BSD), NeMo Framework, NeMo Guardrails, NeMo Agent Toolkit, NeMo Retriever (library), cuOpt (Apache 2.0), RAPIDS/cuML/cuGraph/cuVS (OSS), Earth-2 open models, Holoscan SDK.
2. **Free dev / limited free, paid for production scale:** NIM (free dev via NVIDIA Developer Program + DGX-Cloud-hosted API; NVAIE license for production), Riva (free to a daily usage limit; Riva Enterprise above it), Morpheus SDK (free dev; NVAIE for production).
3. **Managed / paid infra:** DGX Cloud (rental, ~$36,999/instance/mo historically), Brev (aggregated multi-cloud GPU access), NVIDIA Blueprints (free reference workflows but consume the above).

This means the **sovereign self-host path is fully available** for the compute organs (TensorRT-LLM, Dynamo, Triton, NeMo, cuOpt, RAPIDS) — consistent with SZL's Zero-Bandaid sovereignty posture.

---

## 1. Inference & serving core

### 1.1 NVIDIA NIM (microservices)

- **What it does:** Prebuilt, optimized inference microservices — packages a model + optimized engine (TensorRT-LLM / vLLM / SGLang) + OpenAI-compatible API + runtime deps in one container, deployable in ~5 min on any NVIDIA GPU ([NVIDIA NIM page](https://www.nvidia.com/en-us/ai-data-science/products/nim-microservices/); [NVIDIA NIM deploy guide](https://developer.nvidia.com/blog/a-simple-guide-to-deploying-generative-ai-with-nvidia-nim/)).
- **License/access:** Free prototyping via hosted APIs (DGX-Cloud-backed) under the NVIDIA Developer Program; self-host for R&D; **NVAIE license for production** ([NVIDIA NIM page](https://www.nvidia.com/en-us/ai-data-science/products/nim-microservices/)).
- **Integration shape:** `docker run nvcr.io/nim/...` → `POST /v1/completions` (OpenAI-compatible). Seamless cloud-endpoint → self-host swap with no code change ([NIM page](https://www.nvidia.com/en-us/ai-data-science/products/nim-microservices/)).
- **PURIQ organ:** **Kallpa (Wires)** — standardized model endpoints behind the wiring bus; the uniform OpenAI-API contract is exactly the wire shape Kallpa needs to route LLM calls per `a11oy.code`.

### 1.2 NVIDIA Triton Inference Server

- **What it does:** Standardizes deployment/execution of any-framework models on GPU/CPU; multi-model, multi-framework serving in production ([NVIDIA Dynamo-Triton page](https://www.nvidia.com/en-us/ai/dynamo-triton/)).
- **License/access:** **BSD license**, open-source on GitHub + NGC containers; NVAIE for enterprise support ([Triton BSD license](https://docs.nvidia.com/deeplearning/triton-inference-server/bsd/index.html); [Triton LICENSE](https://github.com/triton-inference-server/server/blob/main/LICENSE)).
- **Integration shape:** Model repository + inference HTTP/gRPC endpoints; backends for TensorRT, ONNX, PyTorch, Python, etc.
- **PURIQ organ:** **Kallpa (Wires)** — the substrate Morpheus and other custom models deploy onto ([Morpheus uses Triton for accelerated inference](https://developer.nvidia.com/morpheus-cybersecurity)). Pairs with NIM as the wire-level serving plane.

### 1.3 NVIDIA TensorRT-LLM

- **What it does:** Open-source library for high-performance, real-time LLM inference on NVIDIA GPUs; Python API + PyTorch-native authoring + stable production API. Custom attention kernels, in-flight batching, paged-KV cache, quantization (FP8, NVFP4, INT4-AWQ, INT8-SmoothQuant), speculative decoding (EAGLE-3, multi-token prediction), disaggregated serving, wide expert parallelism ([NVIDIA TensorRT-LLM page](https://developer.nvidia.com/tensorrt-llm); [TensorRT-LLM GitHub](https://github.com/NVIDIA/TensorRT-LLM)).
- **License/access:** **Open-source** (Apache 2.0). v1.0 = open + extensible; up to 8× inference perf, 5.3× better TCO, ~6× lower energy ([TensorRT-LLM page](https://developer.nvidia.com/tensorrt-llm)).
- **Integration shape:** Build a TensorRT engine from the model → serve via runtime or under NIM/Dynamo/Triton.
- **PURIQ organ:** **Yuyay (Heart) + Lambda (Spine)** — per founder directive. The 13-axis conjunctive gate (Heart) and the Λ-aggregator (Spine) are the hottest, most latency-critical paths; FP8/NVFP4 + speculative decoding give the lowest-latency gate evaluation.

### 1.4 NVIDIA Dynamo

- **What it does:** Open-source, low-latency, modular **distributed** inference-serving framework for multi-node datacenter scale. **Disaggregated serving** (splits prefill/context and decode/generation phases onto distinct GPUs for independent optimization), LLM-aware KV-cache routing (routes by cache-overlap to maximize reuse), topology-aware autoscaling, KV-cache offload to cheaper storage tiers. Supports TensorRT-LLM, vLLM, SGLang backends. Up to 15× compounding perf on GB200 NVL72 ([NVIDIA Dynamo page](https://www.nvidia.com/en-us/ai/dynamo/); [Dynamo intro blog](https://developer.nvidia.com/blog/introducing-nvidia-dynamo-a-low-latency-distributed-inference-framework-for-scaling-reasoning-ai-models/); [Dynamo dev page](https://developer.nvidia.com/dynamo)).
- **License/access:** **Open-source.**
- **Integration shape:** Wraps inference engines; disaggregation + LLM-aware router sit in front of TensorRT-LLM workers.
- **PURIQ organ:** **Yuyay (Heart) + Lambda (Spine)** — per founder directive, pairs with TensorRT-LLM. Disaggregated prefill/decode + KV-aware routing is exactly how the Spine's Λ-aggregation scales across reasoning passes without redundant compute.

---

## 2. NeMo software suite (agent lifecycle)

### 2.1 NeMo Framework

- **What it does:** Scalable, cloud-native generative-AI framework for LLMs, multimodal, ASR, TTS, CV — create/customize/deploy models, leveraging pretrained checkpoints; single consolidated container ([NeMo GitHub](https://github.com/NVIDIA-NeMo/NeMo); [NeMo product page](https://www.nvidia.com/en-us/ai-data-science/products/nemo/)).
- **License/access:** **Open-source.**
- **Integration shape:** PyTorch-based training/customization → export to TensorRT-LLM / NIM.
- **PURIQ organ:** **Amaru (Brain)** training/customization backbone; produces the a11oy.code reasoning checkpoints. Cross-cuts all organs at build time.

### 2.2 NeMo Retriever

- **What it does:** Open-source library for enterprise RAG — ingests/structures complex documents up to 15× faster than CPU; Nemotron-powered **extraction + embedding + reranking**. Pipeline: Ingest (text/tables/charts, dedup, chunk) → **Embed** (Nemotron embedding into a **cuVS-accelerated vector DB**) → **Retrieve+Rerank** (similarity search + Nemotron reranker) → Generate ([NVIDIA NeMo Retriever page](https://developer.nvidia.com/nemo-retriever); [NeMo Retriever embedding NIM overview](https://docs.nvidia.com/nim/nemo-retriever/text-embedding/latest/overview.html)).
- **License/access:** Open-source library; embedding/reranking also packaged as NIM microservices ([Embedding NIM overview](https://docs.nvidia.com/nim/nemo-retriever/text-embedding/latest/overview.html)).
- **Integration shape:** Embedding NIM exposes OpenAI-compatible API; built on CUDA + TensorRT + Triton; stores embeddings in cuVS-accelerated vector DB ([Embedding NIM overview](https://docs.nvidia.com/nim/nemo-retriever/text-embedding/latest/overview.html)).
- **PURIQ organ:** **Amaru (Brain)** — per directive ("Milvus or pgvector + NeMo Retriever"). The embed+rerank pipeline is the front-half of `puriq.reflect`; the cuVS path connects straight to Milvus GPU_CAGRA.

### 2.3 NeMo Curator

- **What it does:** Processes text/image/video at scale for training + customization; prebuilt synthetic-data-generation pipelines; enables continuous "data flywheel" optimization of agents ([NVIDIA NeMo Curator page](https://developer.nvidia.com/nemo-curator)).
- **License/access:** Part of NeMo suite (open-source / NIM microservices).
- **Integration shape:** Data-prep pipelines feeding NeMo Framework training.
- **PURIQ organ:** **Amaru (Brain)** + **formulas/** corpus prep — curates the ancient-text / mathematician corpora (Bible-numerics, Egyptian, Newton, Euler, etc.) the charter calls for, into clean training/eval sets.

### 2.4 NeMo Guardrails

- **What it does:** Scalable orchestration of AI guardrails — topic control, PII detection, RAG grounding, jailbreak prevention, multilingual/multimodal content safety with reasoning; integrates LangChain/LangGraph/LlamaIndex; GPU-accelerated; uses Nemotron safety models as NIM. ~1.4× detection improvement at ~½ s latency ([NVIDIA NeMo Guardrails page](https://developer.nvidia.com/nemo-guardrails)).
- **License/access:** **Open-source** on GitHub ([NeMo Guardrails page](https://developer.nvidia.com/nemo-guardrails)).
- **Integration shape:** Config-driven rails wrapping the LLM I/O path; server or CLI; composes with Guardrails AI validators ([Guardrails AI integration](https://guardrailsai.com/blog/nemoguardrails-integration)).
- **PURIQ organ:** **Hukulla (Immune)** — runtime input/output rails are a natural complement to HUKLLA T01–T10 tripwires; jailbreak/PII/topic rails are additional antibody classes. Also reinforces **Yuyay (Heart)** gate at the I/O boundary.

### 2.5 NeMo Agent Toolkit

- **What it does:** Open-source library for **connecting and optimizing teams of AI agents**; framework-agnostic optional dependencies (LangChain, etc.); part of the NeMo agent-lifecycle suite ([NVIDIA NeMo Agent Toolkit page](https://developer.nvidia.com/nemo-agent-toolkit); [NeMo-Agent-Toolkit GitHub](https://github.com/NVIDIA/NeMo-Agent-Toolkit)).
- **License/access:** **Open-source**, Python 3.11–3.13 ([GitHub](https://github.com/NVIDIA/NeMo-Agent-Toolkit)).
- **Integration shape:** Wires multiple agents together with profiling/optimization hooks.
- **PURIQ organ:** **Lambda (Spine)** orchestration + **Kallpa (Wires)** — the multi-agent connection fabric maps onto the `puriq.{decide,act,reflect}` cross-organ orchestration; profiling hooks feed the Λ-aggregator's utility accounting.

---

## 3. Domain accelerators

### 3.1 NVIDIA Morpheus (cyber AI)

- **What it does:** GPU-accelerated, end-to-end AI framework for filtering, processing, classifying large volumes of **streaming cybersecurity data**; deploys models via Triton ([NVIDIA Morpheus page](https://developer.nvidia.com/morpheus-cybersecurity)).
- **License/access:** Free dev SDK; NVAIE for production (unlimited cloud usage + support + 90-day eval) ([Morpheus page](https://developer.nvidia.com/morpheus-cybersecurity)).
- **Integration shape:** Streaming pipelines (filter→process→classify) with Triton-served inference.
- **PURIQ organ:** **Hukulla (Immune)** — per directive. Morpheus streams + classifies threat events; pairs with **Qdrant** threat-sig vectorstore for NN match against known antigen signatures (SENTRA's 6-threat-signature cards generalize to a Qdrant collection).

### 3.2 NVIDIA cuOpt (decision optimization)

- **What it does:** **Open-source, GPU-accelerated** decision-optimization engine — MIP, LP, **VRP (vehicle routing)**, QP at million-variable scale; accelerates AMPL/CVXPY/PuLP/Pyomo/SciPy with zero-code integration; now in COIN-OR ([NVIDIA cuOpt page](https://www.nvidia.com/en-us/ai-data-science/products/cuopt/); [cuOpt open-source blog](https://developer.nvidia.com/blog/accelerate-decision-optimization-using-open-source-nvidia-cuopt/); [cuOpt get-started](https://www.nvidia.com/en-us/ai-data-science/products/cuopt/get-started/)).
- **License/access:** **Apache 2.0**, on GitHub/PIP/Docker/Conda/NGC ([cuOpt open-source blog](https://developer.nvidia.com/blog/accelerate-decision-optimization-using-open-source-nvidia-cuopt/)).
- **Integration shape:** Python API / self-host server; zero-code drop-in for existing solver models.
- **PURIQ organ:** **Killinchu (drone flagship)** — per directive. VRP solver = swarm path optimization; routes multi-drone missions under constraints in near-real-time. Apache-2.0 = sovereign self-host.

### 3.3 NVIDIA Riva (speech)

- **What it does:** Speech + translation AI — ASR, TTS, NMT ([NVIDIA Riva page](https://developer.nvidia.com/riva)).
- **License/access:** **Free for dev + production up to a daily usage limit**; Riva Enterprise (annual license) above it ([Riva Enterprise docs](https://docs.nvidia.com/deeplearning/riva/archives/2-6-0/user-guide/docs/enterprise.html)). Riva NIM self-host requires NVAIE ([Speech NIM prerequisites](https://docs.nvidia.com/nim/speech/latest/get-started/prerequisites.html)).
- **Integration shape:** gRPC/NIM speech endpoints.
- **PURIQ organ:** **Kallpa (Wires)** sensory I/O — voice ingress/egress for Rosie's interface; optional, not core to the gate.

### 3.4 NVIDIA Earth-2 (climate/weather)

- **What it does:** Open family of weather/climate AI models + libraries + frameworks — first fully open accelerated weather AI stack; trainable/fine-tunable via open-source **PhysicsNeMo** ([NVIDIA Earth-2 page](https://www.nvidia.com/en-us/high-performance-computing/earth-2/); [Earth-2 open models blog](https://blogs.nvidia.com/blog/nvidia-earth-2-open-models/)).
- **License/access:** **Open models + tools** ([Earth-2 open models blog](https://blogs.nvidia.com/blog/nvidia-earth-2-open-models/)).
- **Integration shape:** PhysicsNeMo training framework + open model weights.
- **PURIQ organ:** **Killinchu (drone)** environmental context — weather priors as constraints into the cuOpt VRP (no-fly weather windows). Secondary / optional.

---

## 4. CUDA-X data-science libraries

### 4.1 RAPIDS (cuDF / cuML / cuGraph / cuVS)

- **What it does:** Open-source CUDA-X Data Science suite — zero-code-change GPU acceleration of pandas/scikit-learn/Spark/NetworkX. **cuML** = 50× scikit-learn (incl. UMAP, HDBSCAN); **cuGraph** = 48× NetworkX graph analytics; **cuVS** = GPU vector search (CAGRA, IVF-Flat, brute-force) ([CUDA-X Data Science page](https://developer.nvidia.com/topics/ai/data-science/cuda-x-data-science-libraries); [RAPIDS site](https://rapids.ai); [CUDA-X libraries page](https://developer.nvidia.com/cuda/cuda-x-libraries)).
- **License/access:** **Open-source** on GitHub; conda/pip install ([RAPIDS site](https://rapids.ai)).
- **Integration shape:** Drop-in import; zero-code-change accelerators.
- **PURIQ organ mapping:**
  - **cuVS** → **Amaru (Brain)** — GPU index under Milvus GPU_CAGRA; CAGRA 100M index build <5 min on Blackwell vs 40 min A100 ([Milvus cuVS ref](https://milvus.io/ai-quick-reference/how-does-blackwell-cuvs-library-integrate-with-milvus-vector-search); [cuVS optimizing vector search blog](https://developer.nvidia.com/blog/optimizing-vector-search-for-indexing-and-real-time-retrieval-with-nvidia-cuvs/)).
  - **cuGraph** → **Khipu (DAG index)** — GPU graph analytics over the receipt DAG (centrality, traversal, chain-integrity checks at scale).
  - **cuML** → **Hukulla (Immune)** — GPU HDBSCAN/UMAP for unsupervised anomaly clustering of threat vectors, feeding Morpheus.

### 4.2 NVIDIA Blueprints / NIM Agent Blueprints

- **What it does:** Reference workflows / customizable starting points (e.g., **RAG Blueprint**) that compose NIM + NeMo + libraries into production-ready apps ([NVIDIA Blueprints catalog](https://build.nvidia.com/blueprints); [NIM Agent Blueprints blog](https://blogs.nvidia.com/blog/nim-agent-blueprints/); [Blueprint examples docs](https://docs.nvidia.com/ai-workbench/user-guide/latest/quickstart/example-blueprints.html)).
- **License/access:** Free reference designs; consume underlying NIM/NeMo (dev free, NVAIE prod).
- **Integration shape:** Cloneable workflow scaffolds.
- **PURIQ organ:** **Amaru** — the **RAG Blueprint** is the canonical scaffold for the NeMo-Retriever + Milvus brain wiring; **Kallpa** for agent blueprints.

---

## 5. Platform / infra-access layer

### 5.1 DGX Cloud

- **What it does:** NVIDIA's AI factory in the cloud — dedicated DGX clusters (historically 8× H100/A100 80GB per node), rented monthly, browser-accessible; includes NVAIE software ([DGX Cloud page](https://www.nvidia.com/en-us/data-center/dgx-cloud/); [DGX Cloud launch newsroom](https://nvidianews.nvidia.com/news/nvidia-launches-dgx-cloud-giving-every-enterprise-instant-access-to-ai-supercomputer-from-a-browser)).
- **License/access:** Paid rental (historically from $36,999/instance/mo) ([DGX Cloud launch](https://nvidianews.nvidia.com/news/nvidia-launches-dgx-cloud-giving-every-enterprise-instant-access-to-ai-supercomputer-from-a-browser)). Also backs free NIM prototyping APIs.
- **PURIQ organ:** **All compute organs** burst capacity — train/serve TensorRT-LLM engines for Yuyay/Lambda at scale when on-prem is saturated.

### 5.2 Brev

- **What it does:** Developer platform aggregating multi-cloud GPU access with automatic environment setup; choose requirements and start coding without infra management ([Brev about docs](https://docs.nvidia.com/brev/latest/about-brev.html); [Brev dev page](https://developer.nvidia.com/brev); [Brev site](https://www.brev.dev)).
- **License/access:** Platform service (NVIDIA).
- **PURIQ organ:** **Dev harness** — fastest path to prototype any organ's GPU wiring (Launchables for NIM/cuOpt) before committing to on-prem.

### 5.3 Holoscan

- **What it does:** Platform for **real-time edge computing** / sensor-stream AI (low-latency, deterministic pipelines for medical/industrial sensors) ([Holoscan page](https://www.nvidia.com/en-us/edge-computing/holoscan/); [Holoscan SDK dev page](https://developer.nvidia.com/holoscan-sdk)).
- **License/access:** Holoscan SDK (developer access).
- **Integration shape:** Edge sensor → real-time inference graph.
- **PURIQ organ:** **Killinchu (drone edge)** — on-drone real-time sensor fusion + inference at the edge, feeding telemetry to the cuOpt swarm optimizer. Secondary to cuOpt.

---

## 6. Component → organ summary

| NVIDIA component | License/access | Primary PURIQ organ | Directive-locked? |
|---|---|---|---|
| TensorRT-LLM | OSS (Apache) | **Yuyay (Heart) + Lambda (Spine)** | ✅ yes |
| Dynamo | OSS | **Yuyay (Heart) + Lambda (Spine)** | ✅ yes |
| NIM | free dev / NVAIE prod | **Kallpa (Wires)** | ✅ yes |
| Triton | BSD OSS | **Kallpa (Wires)** | ✅ yes |
| NeMo Retriever | OSS / NIM | **Amaru (Brain)** | ✅ yes |
| Morpheus | free dev / NVAIE prod | **Hukulla (Immune)** | ✅ yes |
| cuOpt | OSS (Apache 2.0) | **Killinchu (drone)** | ✅ yes |
| NeMo Framework | OSS | Amaru (build-time) | derived |
| NeMo Curator | OSS / NIM | Amaru + formulas corpus | derived |
| NeMo Guardrails | OSS | Hukulla + Yuyay I/O | derived |
| NeMo Agent Toolkit | OSS | Lambda + Kallpa orchestration | derived |
| cuVS | OSS | Amaru (under Milvus) | derived |
| cuGraph | OSS | Khipu (DAG) | derived |
| cuML | OSS | Hukulla clustering | derived |
| Riva | free-to-limit / Enterprise | Kallpa sensory I/O | optional |
| Earth-2 | open models | Killinchu env priors | optional |
| Blueprints (RAG) | free reference | Amaru scaffold | derived |
| DGX Cloud | paid rental | all compute organs (burst) | infra |
| Brev | platform | dev harness | infra |
| Holoscan | SDK | Killinchu edge | optional |

*End of NVIDIA_DEV_INFRA_2026.*
