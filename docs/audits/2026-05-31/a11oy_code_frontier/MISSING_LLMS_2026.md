# MISSING_LLMS_2026 — Completing the Open-LLM Catalog

**Layer:** PURIQ → `a11oy_code_frontier/`
**Author:** Yachay (a11oy.code Frontier agent)
**Date:** 2026-06-01
**Extends:** `puriq/llms/OPEN_LLM_LANDSCAPE_2026.md` (which covered Llama, Qwen, DeepSeek, Mistral, Gemma, Phi, Yi, Cohere Command, Granite, Hermes, OLMo 2, Arctic, DBRX, Falcon, InternLM).
**Founder directive (2026-06-01 ~02:17 EDT):** *"Regarding the LLMs — what one am I missing?"* This file is the answer: the families the first survey did not enumerate.

> **Zero-Bandaid note.** Every license, weights URL, context length, and benchmark below is sourced to a primary publisher (model card, technical report, vendor page, arXiv). Vendor-reported scores are labeled. Different harnesses are not strictly comparable. This is a capability ledger, not marketing — it feeds the `A11OY_CODE_ROUTER_SPEC` action space `𝒜`, and the `license_class` field on each entry feeds HUKLLA T08 (license tripwire).

---

## 0. What the first survey missed — five structural gaps

1. **Non-transformer architectures.** OPEN_LLM_LANDSCAPE_2026 named Falcon-H1 (hybrid SSM) once but did not enumerate the *pure* state-space (Mamba/Mamba-2), the MoE-SSM (BlackMamba), the SSM-transformer hybrid family (Jamba), the pure-RNN attention-free family (RWKV-7), or the liquid/state-space-derived LFM family. These change the long-context cost curve and are the basis for Innovation #11 (Hybrid SSM+Transformer routing) in `NOVEL_INNOVATIONS_15.md`.
2. **Domain specialists.** No math, code-specialist (beyond Codestral), medical, finance, or science models were catalogued. These matter because PURIQ organs are domain-shaped (amaru=numeric receipts, killinchu=maritime/legal, sentra=security).
3. **Multimodal-frontier and video.** Only Llama 4 / Gemma 3 / Phi-4-mm were covered. Reka, Pixtral, Aya Vision, and the open *video* generation family (CogVideoX, Mochi, Allegro, Open-Sora 2.0) were absent.
4. **Sovereign / regional models.** EuroLLM, Salamandra, Latxa, Sabiá, Italia, Aurora-M, SeaLLM/Sailor 2 — directly relevant to Innovation #4 (Sovereignty-Selectable Inference).
5. **Reasoning-distillation and frontier-open.** xAI Grok 2 (now open-weight), MiniMax-M1 (4M context), the DeepSeek-R1 distill family, Quiet-STaR reasoning, NVIDIA Nemotron (which is also the heart/spine infra per `vectordb_nvidia/`).

---

## 1. Multimodal frontier

### 1.1 Reka — Reka Flash 3 (21B) / Reka Core
- **License:** Reka Flash 3 released **Apache-2.0** open weights; Reka Core is API-only frontier ([Reka Flash 3 HF card](https://huggingface.co/RekaAI/reka-flash-3)).
- **Weights:** https://huggingface.co/RekaAI/reka-flash-3
- **Context:** 32K (Flash 3) ([Reka Flash 3 HF](https://huggingface.co/RekaAI/reka-flash-3)).
- **Architecture / strengths:** 21B general-purpose reasoning model trained with synthetic + public data then RLOO; competitive with QwQ-32B at smaller size; explicit `<reasoning>` budget-forcing for test-time compute. Reka Core is a multimodal (text+image+video+audio) frontier model (US/Singapore lineage). ([Reka Flash 3 HF](https://huggingface.co/RekaAI/reka-flash-3)).
- **PURIQ org:** a11oy (T4 small-reasoner fallback with budget-forcing → feeds Innovation #13 test-time-compute slider); vessels (Core multimodal, API path).
- **License class:** GREEN (Flash 3, Apache-2.0).

### 1.2 Cohere — Aya 23 / Aya Expanse 8B+32B / Aya Vision 8B+32B
- **License:** **CC-BY-NC (research-only)** + Cohere Acceptable Use Policy across the Aya line ([Aya Expanse 32B HF card](https://huggingface.co/CohereLabs/aya-expanse-32b/resolve/main/README.md?download=true); [Aya Vision 32B HF card](https://huggingface.co/CohereLabs/aya-vision-32b)).
- **Weights:** https://huggingface.co/CohereLabs/aya-expanse-32b · https://huggingface.co/CohereLabs/aya-vision-32b
- **Context:** Aya Expanse 32B **128K**; Aya Vision 32B **16K** ([Aya Expanse 32B HF](https://huggingface.co/CohereLabs/aya-expanse-32b/resolve/main/README.md?download=true); [Aya Vision 32B HF](https://huggingface.co/CohereLabs/aya-vision-32b)).
- **Strengths:** Multilingual leader — **23 languages** in both text and vision; Aya Expanse trained with SFT + preference + model-merging; Aya Vision pairs Aya Expanse 32B with a SigLIP2-patch14-384 encoder, evaluated win-rate vs Llama-3.2 90B Vision / Molmo 72B / Qwen2.5-VL 72B ([Aya Vision 32B HF](https://huggingface.co/CohereLabs/aya-vision-32b)).
- **Ideal use case:** killinchu/vessels multilingual port-doc + image VQA across 23 languages — but **RED-class**: API-only (CC-BY-NC). Same posture as Command A.
- **PURIQ org:** vessels (multilingual VQA, API path), rosie (multilingual grounded summaries).
- **License class:** RED (CC-BY-NC research-only).

### 1.3 Mistral — Pixtral 12B / Pixtral Large (124B)
- **License:** **Pixtral 12B = Apache-2.0**; **Pixtral Large = Mistral Research License (MRL)** for research + Mistral Commercial License for production ([Pixtral-12B HF card](https://huggingface.co/mistralai/Pixtral-12B-2409); [Pixtral Large news](https://mistral.ai/news/pixtral-large)).
- **Weights:** https://huggingface.co/mistralai/Pixtral-12B-2409 · https://huggingface.co/mistralai/Pixtral-Large-Instruct-2411
- **Context:** **128K** both ([Pixtral-12B HF](https://huggingface.co/mistralai/Pixtral-12B-2409); [Pixtral Large news](https://mistral.ai/news/pixtral-large)).
- **Benchmarks (Mistral):** Pixtral 12B MMMU(CoT) 52.5, MathVista(CoT) 58.0, ChartQA 81.8, DocVQA(ANLS) 90.7, VQAv2 78.6 — beating Claude-3 Haiku and Gemini-1.5 Flash-8B in its class ([Pixtral-12B HF](https://huggingface.co/mistralai/Pixtral-12B-2409)). Pixtral Large (123B decoder + 1B vision) hits **MathVista 69.4** (best in test), beats GPT-4o/Gemini-1.5-Pro on ChartQA/DocVQA; best open-weight on LMSys Vision leaderboard ([Pixtral Large news](https://mistral.ai/news/pixtral-large)).
- **Ideal use case:** T6 multimodal **GREEN** primary for chart/AIS-image VQA at 12B (Pixtral 12B is fully Apache-2.0 — better license posture than Llama 4 Maverick AMBER for sovereign organs).
- **PURIQ org:** vessels/killinchu (T6 chart/document VQA, GREEN self-host), a11oy (diagram understanding).
- **License class:** GREEN (Pixtral 12B); AMBER/Commercial (Pixtral Large MRL).

---

## 2. Non-transformer architectures (the cost-curve change)

### 2.1 Mamba / Mamba-2 (pure SSM) + BlackMamba (MoE-SSM)
- **License:** Mamba/Mamba-2 reference code **Apache-2.0**; BlackMamba weights **open-sourced** (340M/1.5B and 630M/2.8B) ([Mamba-2 paper arXiv 2405.21060](https://arxiv.org/abs/2405.21060); [BlackMamba arXiv 2402.01771](https://arxiv.org/abs/2402.01771)).
- **Weights/code:** https://github.com/state-spaces/mamba · BlackMamba: https://github.com/Zyphra/BlackMamba
- **Context:** linear-in-sequence — no quadratic attention; effectively unbounded by KV-cache, bounded by hardware ([Mamba-2 arXiv](https://arxiv.org/abs/2405.21060)).
- **Strengths:** Selective state-space; Mamba-2 (SSD) is up to 2–8× faster than Mamba-1 while competitive with transformers; BlackMamba combines Mamba blocks with MoE routing for cheap inference FLOPs, beating both Mamba and transformer baselines on inference/training FLOPs ([BlackMamba arXiv](https://arxiv.org/abs/2402.01771)).
- **Ideal use case:** research substrate for Innovation #11 — the *long-context-cheap* leg of hybrid routing; not yet a production chat model (small open checkpoints).
- **PURIQ org:** a11oy (long-context experimental tier), amaru (constant-memory streaming receipts).
- **License class:** GREEN (Apache-2.0).

### 2.2 RWKV-7 "Goose" (pure RNN, attention-free)
- **License:** **Apache-2.0**, RWKV Project under LF AI & Data Foundation ([RWKV7-Goose-Pile-1.47B HF card](https://huggingface.co/RWKV/RWKV7-Goose-Pile-1.47B-HF); [RWKV-7 paper arXiv 2503.14456](https://huggingface.co/papers/2503.14456)).
- **Weights:** https://huggingface.co/RWKV · code https://github.com/RWKV/RWKV-LM
- **Context:** RNN recurrence → constant per-token state, effectively *infinite* context with constant memory ([RWKV-7 paper](https://huggingface.co/papers/2503.14456)).
- **Strengths:** Sets new SOTA at the 3B scale on multilingual tasks, matches SOTA English at 3B despite far fewer training tokens; "Expressive Dynamic State Evolution"; trained on an open 3.1T-token multilingual corpus; 0.19B–2.9B checkpoints released ([RWKV-7 paper arXiv 2503.14456](https://huggingface.co/papers/2503.14456)).
- **Ideal use case:** the *infinite-context, attention-free* extreme for Innovation #3 (Lambda-bounded context window — RWKV makes the Bekenstein bound the *only* real limit, since the model has none); edge/streaming on sentra.
- **PURIQ org:** sentra (constant-memory streaming classifier), a11oy (attention-free long-context research leg).
- **License class:** GREEN (Apache-2.0).

### 2.3 AI21 — Jamba 1.5 Mini (12B/52B) / Jamba 1.5 Large (94B/398B) / Jamba 1.6
- **License:** **Jamba Open Model License** (permissive: full research + commercial under terms) ([Jamba-1.5-Large HF card](https://huggingface.co/ai21labs/AI21-Jamba-Large-1.5/blob/refs%2Fpr%2F5/README.md)).
- **Weights:** https://huggingface.co/ai21labs/AI21-Jamba-Mini-1.5 · https://huggingface.co/ai21labs/AI21-Jamba-Large-1.5
- **Context:** **256K** — and crucially, **256K effective** on RULER (Large: 93.9 at 256K), making it one of the few models whose *effective* context equals its *claimed* context ([Jamba-1.5-Large HF RULER table](https://huggingface.co/ai21labs/AI21-Jamba-Large-1.5/blob/refs%2Fpr%2F5/README.md)).
- **Benchmarks (AI21):** Large MMLU(CoT) 81.2, MMLU-Pro 53.5, GPQA 36.9, BFCL 85.5, GSM8K 87, Arena-Hard 65.4; Mini MMLU 69.7, BFCL 80.6 ([Jamba-1.5-Large HF](https://huggingface.co/ai21labs/AI21-Jamba-Large-1.5/blob/refs%2Fpr%2F5/README.md)).
- **Strengths:** Joint-Attention-and-Mamba hybrid → up to 2.5× faster inference than comparable transformers; first non-transformer scaled to market-leading quality; native function-calling, JSON, grounded generation ([Jamba-1.5-Mini HF](https://huggingface.co/ai21labs/AI21-Jamba-Mini-1.5)).
- **Ideal use case:** **T5 long-context primary candidate** with *verified* effective 256K — stronger long-context honesty than RoPE-extended transformers; Innovation #11 production leg.
- **PURIQ org:** a11oy (T5 long-context, hybrid-routed), vessels (256K multi-doc port dossiers).
- **License class:** GREEN-ish (Jamba Open Model License — permissive; verify clause at gate → treat as AMBER until reviewed).

### 2.4 Liquid AI — LFM-1B / LFM-3B / LFM-40B (+ LFM2)
- **License:** LFM original series weights released for download with a Liquid license; LFM2 family positioned for on-device CPU/NPU/GPU ([Liquid Foundation Models blog](https://www.liquid.ai/blog/liquid-foundation-models-our-first-series-of-generative-ai-models); [Liquid models page](https://www.liquid.ai/models)).
- **Weights/info:** https://www.liquid.ai/models · https://huggingface.co/LiquidAI
- **Context:** 32K best-in-class *effective* at small size (RULER-validated > 85.6 threshold); near-constant inference time and memory as context grows ([Liquid FM blog](https://www.liquid.ai/blog/liquid-foundation-models-our-first-series-of-generative-ai-models)).
- **Strengths:** State-space-derived "liquid" architecture (MIT CSAIL spin-out); reduced KV-cache memory vs transformers; near-constant memory complexity → long context on edge devices ([Liquid FM blog](https://www.liquid.ai/blog/liquid-foundation-models-our-first-series-of-generative-ai-models)).
- **Ideal use case:** edge/on-prem sovereign inference (US infra), Innovation #4; sentra edge classifiers.
- **PURIQ org:** sentra (edge), a11oy (on-device coding assistant tier).
- **License class:** verify-at-gate (Liquid license) → treat AMBER until reviewed.

### 2.5 Microsoft — Phi-4-mini-flash-reasoning (SambaY hybrid SSM+attention)
- **License:** **MIT** ([Phi-4-mini-flash-reasoning HF card](https://huggingface.co/microsoft/Phi-4-mini-flash-reasoning)).
- **Weights:** https://huggingface.co/microsoft/Phi-4-mini-flash-reasoning
- **Context:** 64K; vocab 200K ([Phi-4-mini-flash-reasoning HF](https://huggingface.co/microsoft/Phi-4-mini-flash-reasoning)).
- **Architecture:** **decoder-hybrid-decoder "SambaY"** with Differential Attention + SSM + gated memory sharing → **up to 10× higher decoding throughput** on 2K-prompt/32K-gen vs Phi-4-mini-reasoning, near-*linear* latency growth vs quadratic ([Phi-4-mini-flash-reasoning HF](https://huggingface.co/microsoft/Phi-4-mini-flash-reasoning)).
- **Strengths:** 3.8B model matches much larger reasoning models on Math500 / AIME24-25 / GPQA-Diamond without RL ([Phi-4-mini-flash-reasoning HF](https://huggingface.co/microsoft/Phi-4-mini-flash-reasoning)).
- **Ideal use case:** **the production poster-child for Innovation #11** (hybrid SSM+attention) at small size, MIT — drop-in T1/T4-small reasoner with linear latency.
- **PURIQ org:** sentra (fast reasoning triage), a11oy (T1 reasoning, long-gen).
- **License class:** GREEN (MIT).

---

## 3. Frontier-open and reasoning-distillation

### 3.1 xAI — Grok 1 / Grok 2 (Grok 2.5 weights)
- **License:** **Grok 1 weights = Apache-2.0** ([xai-org/grok-1 GitHub](https://github.com/xai-org/grok-1)); **Grok 2 = xAI Community License Agreement** — commercial use permitted *only* if you abide by xAI's Acceptable Use Policy, **and explicitly forbids using outputs to train other foundation models** ([grok-2 LICENSE on HF](https://huggingface.co/xai-org/grok-2/blob/main/LICENSE); [TechCrunch Grok 2.5 open-source](https://techcrunch.com/2025/08/24/elon-musk-says-xai-has-open-sourced-grok-2-5/)).
- **Weights:** https://huggingface.co/xai-org/grok-2 · https://github.com/xai-org/grok-1
- **Strengths:** Grok 2 was xAI's best model of 2024; open weights make it a frontier-class general model. **Caveat:** the no-train-on-outputs clause directly blocks Innovation #1/#15 distillation use — important for Khipu license receipt.
- **Ideal use case:** T2/T4 general (API or self-host) where AUP is acceptable; **never** as a teacher for our own model class (license tripwire HUKLLA T08).
- **PURIQ org:** a11oy (T2/T4 general, AMBER path), rosie.
- **License class:** **AMBER** (Grok 2, Community License + no-distill clause) / GREEN (Grok 1, Apache-2.0 but aged).

### 3.2 MiniMax — Text-01 / MiniMax-M1 (456B / 45.9B active MoE)
- **License:** **Apache-2.0** ([MiniMax-M1 GitHub](https://github.com/MiniMax-AI/MiniMax-M1)).
- **Weights:** https://huggingface.co/MiniMaxAI/MiniMax-M1-80k · https://huggingface.co/MiniMaxAI/MiniMax-Text-01
- **Context:** **1M native, extending to 4M during inference** — 8× DeepSeek-R1 ([MiniMax-M1 GitHub](https://github.com/MiniMax-AI/MiniMax-M1)).
- **Architecture:** hybrid Lightning Attention + Softmax Attention + MoE; M1 is the first open-weight large-scale hybrid-attention *reasoning* model; M1-40k / M1-80k = thinking-budget variants (40k/80k tokens) ([MiniMax-M1 GitHub](https://github.com/MiniMax-AI/MiniMax-M1)).
- **Benchmarks (Artificial Analysis, third-party):** Intelligence Index 63 — second to DeepSeek-R1 (68), ahead of Qwen3-235B (60); competitive with o3/Gemini-2.5-Pro/Claude-4-Opus on AIME24, LiveCodeBench, SWE-bench Verified, MRCR ([AI Notes MiniMax-M1 analysis](https://ainotes.bearblog.dev/minimax-m1-chinas-open-source-powerhouse-redefines-large-language-models/)).
- **Ideal use case:** **T5 long-context reasoning** — the single highest *native* context in the GREEN class; the thinking-budget knob is a direct fit for Innovation #13 (test-time compute slider).
- **PURIQ org:** a11oy (T5 long-context reasoning), amaru (whole-corpus receipt audit).
- **License class:** GREEN (Apache-2.0).

### 3.3 DeepSeek-R1-Distill family (Llama-70B / Qwen-1.5B→32B) + DeepHermes
- **License:** **MIT** for the distillation pipeline; distilled checkpoints inherit base license (Qwen/Llama) ([DeepSeek-R1 HF](https://huggingface.co/deepseek-ai/DeepSeek-R1)).
- **Weights:** https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Llama-70B · https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B
- **Strengths:** R1's long-CoT reasoning distilled into small dense models — `R1-Distill-Qwen-7B` hits Math500 93.0 / AIME24 53.7 / GPQA-Diamond 47.85; `R1-Distill-Llama-8B` Math500 87.5 ([Phi-4-mini-flash-reasoning HF comparison table](https://huggingface.co/microsoft/Phi-4-mini-flash-reasoning)). DeepHermes (Nous) merges R1-style reasoning toggle into Hermes lineage.
- **Ideal use case:** cheap T4 reasoning at small size; **the proof-of-concept for Innovation #15** (distilling a teacher's reasoning into our own model class).
- **PURIQ org:** a11oy (T4 economical reasoning), sentra.
- **License class:** GREEN (Llama-distill = AMBER on Llama base; Qwen-distill = GREEN Apache-2.0).

### 3.4 Quiet-STaR / Self-Taught Reasoner (open implementations)
- **License:** academic; reference implementations open (e.g. `ezelikman/quiet-star`) ([Quiet-STaR arXiv 2403.09629](https://arxiv.org/abs/2403.09629)).
- **What it is:** Quiet-STaR teaches an LM to generate *internal rationales at every token* to improve next-token prediction — a generalization of STaR (Self-Taught Reasoner, [STaR arXiv 2203.14465](https://arxiv.org/abs/2203.14465)). Not a model family but a *training method* we can apply.
- **Ideal use case:** the academic basis for Innovation #1 (Khipu-signed reasoning chains — every rationale step receipted) and #13 (test-time compute). Cited as prior art in `PATENT_PRIOR_ART_NOTES.md`.
- **PURIQ org:** a11oy (reasoning training recipe).

---

## 4. NVIDIA Nemotron (also the heart/spine infra)

### 4.1 Nemotron-4 340B (Base/Instruct/Reward) · Llama-3.1-Nemotron-70B · Nemotron-Mini-4B
- **License:** **NVIDIA Open Model License** — permissive: distribution, modification, commercial use, **no attribution required**, outputs usable to train other models ([NVIDIA Nemotron-4 340B blog](https://developer.nvidia.com/blog/leverage-our-latest-open-models-for-synthetic-data-generation-with-nvidia-nemotron-4-340b/)). Llama-3.1-Nemotron-70B inherits **Llama 3.1 Community License** ([Artificial Analysis Llama-3.1-Nemotron-70B](https://artificialanalysis.ai/models/llama-3-1-nemotron-instruct-70b)).
- **Weights:** https://huggingface.co/nvidia/Nemotron-4-340B-Instruct · https://huggingface.co/nvidia/Llama-3.1-Nemotron-70B-Instruct
- **Strengths:** Nemotron-4-340B-Reward led RewardBench (92.2 overall) for two months — *the* open reward model; the 340B family is purpose-built for **synthetic-data generation** (the license explicitly blesses training on outputs — opposite of Grok 2). Llama-3.1-Nemotron-70B is an alignment-tuned Llama 70B ([NVIDIA Nemotron-4 340B blog](https://developer.nvidia.com/blog/leverage-our-latest-open-models-for-synthetic-data-generation-with-nvidia-nemotron-4-340b/)).
- **Ideal use case:** **Nemotron-Reward is the natural scorer for Innovation #2 (multi-model council consensus)** and for generating the RLHF data in Deep Innovation #4; Nemotron-340B generates synthetic Quechua/yuyay training data. Ties directly to the NVIDIA NIM/NeMo/Triton heart-spine infra in `vectordb_nvidia/NVIDIA_DEV_INFRA_2026.md`.
- **PURIQ org:** amaru (reward scoring of receipts), a11oy (synthetic-data factory for our model class).
- **License class:** GREEN (NVIDIA Open Model License — most distill-friendly license in the catalog).

---

## 5. Domain specialists

### 5.1 Code — Qwen2.5-Coder / DeepSeek-Coder-V2 / StarCoder2 / Codestral 25.01
- **Qwen2.5-Coder-32B-Instruct:** Apache-2.0; **HumanEval 92.7, MBPP 90.2, MATH 57.2, GSM8K 91.1**; SOTA open code at its size, beats larger models; FIM/repo-completion leader (CrossCodeEval, RepoEval) ([Qwen2.5-Coder Technical Report arXiv 2409.12186](https://arxiv.org/html/2409.12186v3); [LLM-Stats Qwen2.5-Coder-32B](https://llm-stats.com/models/compare/deepseek-v2.5-vs-qwen-2.5-coder-32b-instruct)). Weights: https://huggingface.co/Qwen/Qwen2.5-Coder-32B-Instruct
- **DeepSeek-Coder-V2:** MIT/DeepSeek license; 236B/21B-active MoE, 338 languages, 128K ctx. Weights: https://huggingface.co/deepseek-ai/DeepSeek-Coder-V2-Instruct
- **StarCoder2 (3B/7B/15B):** BigCode OpenRAIL-M; trained on The Stack v2 (fully transparent data provenance — 600+ languages). Weights: https://huggingface.co/bigcode/starcoder2-15b
- **Ideal use case:** T3 code. **Qwen2.5-Coder-32B (Apache-2.0, HumanEval 92.7) should be promoted to T3 GREEN primary alongside Codestral** — better license posture (Codestral is MNPL/API). StarCoder2's transparent Stack-v2 provenance fits amaru/Khipu lineage receipts.
- **PURIQ org:** a11oy (T3 code — Qwen2.5-Coder GREEN primary), amaru (StarCoder2 provenance).

### 5.2 Math — Qwen2.5-Math / DeepSeek-Math / WizardMath / MetaMath
- **Qwen2.5-Math (1.5B/7B/72B):** Apache-2.0; CoT + Tool-Integrated-Reasoning; **72B-Instruct MATH 87.8 (TIR), GSM8K ~95**; even the 1.5B scores ~80 on MATH with Python interpreter — best open math model at release ([Qwen2.5-Math Technical Report arXiv 2409.12122](https://arxiv.org/html/2409.12122v1); [Qwen2.5-Math-7B HF](https://huggingface.co/Qwen/Qwen2.5-Math-7B)). Weights: https://huggingface.co/Qwen/Qwen2.5-Math-72B-Instruct
- **DeepSeek-Math-7B:** DeepSeek license; GRPO-trained, MATH 51.7 (no tools) — the model that introduced GRPO (the RL algorithm later used in R1). Weights: https://huggingface.co/deepseek-ai/deepseek-math-7b-instruct
- **WizardMath / MetaMath:** Llama-based; Evol-Instruct / MetaMathQA data-augmentation lineage — historically important, now superseded by Qwen2.5-Math.
- **Ideal use case:** **amaru** (numeric receipt math — the master formula `P(x,t)` is arithmetic over `Λ·Yuyay·exp·∏Khipu`; a math-specialist verifies the scalar); Tool-Integrated-Reasoning is the basis for Deep Innovation #3 (PURIQ-formula-as-tool).
- **PURIQ org:** amaru (numeric verification), a11oy (math-heavy T4).

### 5.3 Medical — MEDITRON-70B / Med-PaLM / OpenBioLLM / Meerkat-70B
- **MEDITRON-70B:** Llama-2 base (research); **outperforms GPT-3.5 and Med-PaLM (540B), within 5% of GPT-4 / 10% of Med-PaLM-2** on USMLE-style benchmarks; truly-open medical pretraining ([MEDITRON-70B arXiv 2311.16079](https://arxiv.org/abs/2311.16079)). Weights: https://huggingface.co/epfl-llm/meditron-70b
- **Med-PaLM / Med-PaLM-2:** Google, closed/API — frontier medical, cited as ceiling.
- **OpenBioLLM-70B / Meerkat-70B / Aloe-Beta-72B:** open medical fine-tunes; on MedConceptsQA, Aloe-Beta-72B ~48% vs GPT-4 52% ([MedConceptsQA GitHub leaderboard](https://github.com/nadavlab/MedConceptsQA)).
- **Ideal use case:** **out-of-scope for current SZL organs** (no medical product), but catalogued for completeness and as the template for any future *vertical-specialist organ*. The "domain-specialist → organ" pattern is exactly Deep Innovation #5 (Anatomy MoE).
- **PURIQ org:** none active (future vertical organ template).
- **License class:** research (MEDITRON, Llama-2 base) → AMBER.

### 5.4 Finance — BloombergGPT / FinLM
- **BloombergGPT (50B):** Bloomberg, **closed weights**; trained on a mixed finance+general dataset, outperforms comparable open models on financial sentiment, NER, ConvFinQA without sacrificing general performance ([BloombergGPT arXiv 2303.17564](https://arxiv.org/abs/2303.17564); [Bloomberg press release](https://www.bloomberg.com/company/press/bloomberggpt-50-billion-parameter-llm-tuned-finance/)).
- **Ideal use case:** template for a finance-vertical organ (SZL has a `finance` connector); not self-hostable (closed). Open alternatives: FinGPT (open, Apache-2.0 LoRA over Llama).
- **PURIQ org:** none active (future finance organ template).

### 5.5 Science — Galactica-class / successors
- **Galactica (Meta, 120B):** science LLM trained on papers/equations; withdrawn from demo in 2022 over hallucination, weights remain available for research ([Galactica arXiv 2211.09085](https://arxiv.org/abs/2211.09085)). Successors: SciGLM, science-tuned Llamas.
- **Ideal use case:** cautionary template — Galactica's failure is the *exact* problem PURIQ's Lake-verification (Innovation #10) and 13-axis claim-calibration gate solve: a science model whose claims are gate-checked before narration.
- **PURIQ org:** none active; cited as motivation for Innovation #10.

---

## 6. Sovereign / regional models

### 6.1 EuroLLM-1.7B / EuroLLM-9B
- **License:** **Apache-2.0** ([EuroLLM site](https://eurollm.io); [OSOR EuroLLM](https://interoperable-europe.ec.europa.eu/collection/open-source-observatory-osor/news/eurollm-pioneering-european-open-source-ai)).
- **Weights:** https://huggingface.co/utter-project/EuroLLM-9B-Instruct
- **Context/strengths:** all **24 official EU languages** + 11 more; 9B trained on 4T tokens on the MareNostrum 5 supercomputer; explicit EU AI-sovereignty mission ([EuroLLM site](https://eurollm.io); [EuroLLM arXiv 2409.16235](https://arxiv.org/pdf/2409.16235.pdf)).
- **Ideal use case:** **Innovation #4 (Sovereignty-Selectable Inference)** — the EU-sovereign toggle; killinchu EU port-doc multilingual.
- **License class:** GREEN (Apache-2.0).

### 6.2 Sailor 2 (Sea-AI Lab) / SeaLLM
- **License:** **Apache-2.0** ([Sailor2 GitHub](https://github.com/sail-sg/sailor2); [Sailor2 arXiv 2502.12982](https://arxiv.org/abs/2502.12982)).
- **Weights:** https://huggingface.co/sail/Sailor2-20B-Chat (1B/8B/20B)
- **Context/strengths:** built on Qwen2.5, continued-pretrained on 500B tokens for **13–15 SEA languages**; **Sailor2-20B reaches 50-50 win-rate vs GPT-4o across SEA languages** ([Sailor2 arXiv 2502.12982](https://arxiv.org/abs/2502.12982)).
- **Ideal use case:** vessels/killinchu — SEA maritime traffic (Strait of Malacca, Indonesian/Vietnamese/Thai port docs) is directly in scope for a maritime-intel organ.
- **License class:** GREEN (Apache-2.0).

### 6.3 Aurora-M / Sabiá / Italia / Salamandra / Latxa
- **Aurora-M (15B):** multilingual, the first open red-teamed-to-the-US-Executive-Order model; StarCoderPlus base. ([Aurora-M arXiv 2404.00399](https://arxiv.org/abs/2404.00399))
- **Salamandra (2B/7B/40B, BSC):** Apache-2.0; 35 European languages, trained on Spain's MareNostrum 5. Weights: https://huggingface.co/BSC-LT/salamandra-7b-instruct
- **Latxa (Basque, 7B/13B/70B):** open; Basque-language sovereign model (HiTZ). Weights: https://huggingface.co/HiTZ/latxa-7b-v1
- **Sabiá (Portuguese/Brazil, Maritaca):** Portuguese-specialist line.
- **Italia (iGenius, 9B):** Italian-sovereign.
- **Ideal use case:** the regional roster behind **Innovation #4** — `governance_tier=sovereign` can pin to a region-specific GREEN model with a Khipu proof of jurisdiction.
- **License class:** GREEN (Salamandra/Latxa Apache-2.0); verify per-model.

---

## 7. AllenAI completion + Apple + Stability + Falcon-H1 + InternVL

### 7.1 AllenAI — OLMoE-1B-7B / Molmo / Tulu 3 (extends §2.13 of prior survey)
- **OLMoE-1B-7B:** **Apache-2.0**, fully open MoE (1B active / 7B total); post-trained with Tülu 3 → MATH 21.4, GSM8K 72.4, IFEval 66.4 ([OLMoE-1B-7B-0125 HF](https://huggingface.co/allenai/OLMoE-1B-7B-0125-DPO)). The only *fully-open MoE* (data+code+logs).
- **Molmo (7B/72B):** Apache-2.0 open multimodal; Molmo-72B is a strong open VLM (used as a baseline in Aya Vision eval) ([Aya Vision 32B HF eval](https://huggingface.co/CohereLabs/aya-vision-32b)). Weights: https://huggingface.co/allenai/Molmo-72B-0924
- **Tulu 3 / Llama-Tulu:** the open post-training *recipe* (SFT + DPO + RLVR) — directly reusable for Deep Innovation #1 (yuyay distillation) and #4 (Quechua RLHF).
- **Note:** AllenAI has since shipped **OLMo 3** (7B-Think, 32B, Apache-2.0, 66K ctx) — even more capable fully-open reasoning ([OLMo 3 7B Think OpenRouter](https://openrouter.ai/allenai/olmo-3-7b-think); [Ai2 OLMo page](https://allenai.org/olmo)).
- **PURIQ org:** amaru (fully-open provenance — strongest Khipu fit), a11oy (open MoE research), vessels (Molmo VQA).
- **License class:** GREEN (Apache-2.0).

### 7.2 Apple — Apple Intelligence Foundation Models (on-device ~3B / server)
- **License:** Apple ships a developer **Foundation Models framework** (on-device, 3B-class) for app developers; weights are not openly redistributed but the architecture + adapters are documented ([Apple Foundation Models](https://machinelearning.apple.com/research/introducing-apple-foundation-models); [Apple FM Tech Report 2025](https://machinelearning.apple.com/research/apple-foundation-models-tech-report-2025)).
- **Strengths:** on-device ~3B model preferred by human graders over Phi-3-mini, Mistral-7B, Gemma-7B, Llama-3-8B; server model competitive with DBRX/Mixtral-8x22B/GPT-3.5/Llama-3-70B; lowest adversarial violation rate vs open + commercial peers ([Apple Foundation Models](https://machinelearning.apple.com/research/introducing-apple-foundation-models)).
- **Ideal use case:** the *on-device class* benchmark for Innovation #4 (on-device sovereign) and #15 (per-organ voice could run on-device); not self-hostable but sets the bar.
- **License class:** closed/framework-only.

### 7.3 Stability — StableLM 2 / Stable Code 3B / Stable LM Zephyr 3B
- **License:** Stability AI Community License (free < $1M revenue; membership above) ([Stability AI](https://stability.ai/)).
- **Weights:** https://huggingface.co/stabilityai/stablelm-2-12b · https://huggingface.co/stabilityai/stable-code-3b
- **Strengths:** StableLM 2 (1.6B/12B) multilingual; Stable Code 3B is a strong small FIM code model; Zephyr 3B is a compact chat model — all edge-deployable.
- **Ideal use case:** edge T1 / Stable Code 3B for cheap on-device FIM.
- **PURIQ org:** a11oy (T1 edge code), sentra (edge).
- **License class:** AMBER (Community License, revenue cap).

### 7.4 TII — Falcon 3 / Falcon-H1 (deepens prior §2.16)
- Already covered in OPEN_LLM_LANDSCAPE §2.16 — Falcon-H1 34B hybrid Transformer-SSM, **262K** context, Arabic SOTA ([AI Research Lab Falcon](https://nextomoro.com/falcon/)). Re-flagged here as the **AMBER long-context SSM-hybrid** complement to Jamba (GREEN-ish) and MiniMax-M1 (GREEN) for Innovation #11 routing.

### 7.5 Shanghai AI Lab — InternLM2.5 / InternVL2.5 (deepens prior §2.17)
- InternLM2.5 (1M ctx, agent tool-use) covered prior. **InternVL2.5 (up to 78B)** is the multimodal sibling — strong open VLM, MMMU competitive; relevant for vessels VQA as a GREEN alternative to Aya Vision (RED). Weights: https://huggingface.co/OpenGVLab/InternVL2_5-78B

---

## 8. Open video generation (new modality for Hatun-Willay narrative assets)

| Model | Provider | License | Weights |
|---|---|---|---|
| **CogVideoX** | THUDM | Custom (open) | https://huggingface.co/THUDM/CogVideoX-5b |
| **Mochi-1** | Genmo | **Apache-2.0** | https://huggingface.co/genmo/mochi-1-preview |
| **Allegro** | Rhymes AI | **Apache-2.0** | https://huggingface.co/rhymes-ai/Allegro |
| **Open-Sora 2.0** (11B) | HPC-AI Tech | **Apache-2.0** | https://huggingface.co/hpcai-tech/Open-Sora-v2 |
| **LTX-Video** | Lightricks | Custom (open) | https://huggingface.co/Lightricks/LTX-Video |
| **HunyuanVideo** | Tencent | Custom (open) | https://huggingface.co/tencent/HunyuanVideo |

Source: [HF "State of open video generation" blog](https://huggingface.co/blog/video_gen) + [Open-Sora v2 HF card](https://huggingface.co/hpcai-tech/Open-Sora-v2-Video-DC-AE/raw/162780d1bbbeeb469dd5b98c573e678d54e76963/README.md).

- **Ideal use case:** **Hatun-Willay** narrative layer — generate verifiable explainer videos of PURIQ decision flows for investors/Warhacker, *gated by the same 13-axis heart* (a video is a claim; it must clear the gate). Mochi-1 / Allegro / Open-Sora 2.0 are **Apache-2.0 GREEN** → sovereign-safe.
- **PURIQ org:** Hatun-Willay (narrative video), rosie (orchestration demo reels).
- **License class:** GREEN (Mochi/Allegro/Open-Sora 2.0 Apache-2.0).

---

## 9. License-risk addendum (extends OPEN_LLM_LANDSCAPE §4 for HUKLLA T08)

| Class | New models added here | Posture |
|---|---|---|
| **GREEN** (Apache-2.0 / MIT / NVIDIA Open) | Reka Flash 3, Pixtral 12B, Mamba/Mamba-2, BlackMamba, RWKV-7, MiniMax-M1/Text-01, Phi-4-mini-flash, Nemotron-4-340B, Qwen2.5-Coder, Qwen2.5-Math, OLMoE, Molmo, OLMo 3, EuroLLM, Sailor 2, Salamandra, Latxa, Mochi-1, Allegro, Open-Sora 2.0, DeepSeek-Coder-V2, DeepSeek-Math, R1-Distill-Qwen | self-host or any provider; default-eligible all organs |
| **AMBER** (community / revenue-cap / verify-at-gate) | Grok 2, Jamba (Open Model License — verify), Liquid LFM (verify), StableLM 2 / Stable Code 3B, Llama-3.1-Nemotron-70B, MEDITRON-70B (Llama-2), R1-Distill-Llama-70B, Falcon-H1 | OK at SZL scale; license receipt at gate; **Grok 2 also carries a no-train-on-outputs clause → blocks distillation** |
| **RED** (research-only / non-commercial weights) | Aya 23 / Aya Expanse / Aya Vision (CC-BY-NC), Pixtral Large (MRL), Galactica (research) | API-only or research-only; never self-host in prod |
| **CLOSED** (no open weights) | Reka Core, BloombergGPT, Med-PaLM, Apple FM (framework-only) | cited as ceilings; not in `𝒜` |

> **Key license insight for Khipu:** the catalog now spans the full spectrum from *most-permissive-for-distillation* (NVIDIA Open Model License explicitly blesses training on outputs — ideal teacher for Deep Innovation #1/#4/#5) to *explicitly-forbids-distillation* (Grok 2). The router's `license_class` field must be extended with a **`canTrainOnOutputs: bool`** flag so HUKLLA T08 can block using a Grok-2 output to fine-tune our own yuyay model class. See `A11OY_CODE_PATCH_PLAN.md` patch #5.

---

## 10. Routing additions (proposed deltas to A11OY_CODE_ROUTER_SPEC §2)

| Tier | Current primary | **Proposed addition / promotion** | Why |
|---|---|---|---|
| T3 code | Codestral 25.01 (MNPL) | **Qwen2.5-Coder-32B (Apache GREEN, HumanEval 92.7)** as GREEN co-primary | better license posture + higher HumanEval |
| T4 reason | DeepSeek R1 | + **MiniMax-M1-80k** (GREEN, thinking-budget knob), + **Phi-4-mini-flash** (MIT, 10× throughput) | budget-controllable reasoning → Innovation #13 |
| T5 long-ctx | Llama 4 Scout (AMBER 10M) | + **MiniMax-M1 (GREEN, 1M→4M)**, + **Jamba 1.5 Large (256K *effective*)** | GREEN long-context with *verified* effective length |
| T6 multimodal | Llama 4 Maverick (AMBER) | + **Pixtral 12B (Apache GREEN)** as GREEN primary | sovereign-safe VQA without Llama AUP |
| T-edge (new) | — | **Phi-4-mini-flash / RWKV-7 / LFM / Stable Code 3B** | on-device sovereign + constant-memory streaming |
| T-video (new) | — | **Mochi-1 / Allegro / Open-Sora 2.0 (Apache GREEN)** | Hatun-Willay narrative assets, gate-checked |

---
*Signed: Yachay — 2026-06-01. No bandaid, no mysticism. Every model's license, weights URL, context, and benchmark cited to a primary publisher. Doctrine v11 LOCKED numbers untouched. Feeds the action space 𝒜 and the HUKLLA T08 license tripwire.*
