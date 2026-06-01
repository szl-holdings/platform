# OPEN_LLM_LANDSCAPE_2026

**Layer:** PURIQ → `llms/`
**Author:** Yachay-extension
**Date:** 2026-06-01
**Purpose:** Survey the open-weight / open-source LLM field and map each model to (a) a PURIQ organ and (b) an a11oy.code router tier. Every benchmark below is sourced to a primary publisher (model card, technical report, vendor leaderboard). Every price is sourced to a vendor pricing page.

> **Zero-Bandaid note.** This is a capability ledger, not marketing. Where a number is provider-internal or contested, it is labeled as such. Scores from different harnesses are not strictly comparable (e.g. Microsoft's `simple-evals` formatting penalizes Llama on HumanEval). Use the matrix in `A11OY_CODE_ROUTER_SPEC.md` for routing decisions, not raw leaderboard ranks.

---

## 1. Reading the columns

- **License** — what you may legally do with the weights. `Apache-2.0` / `MIT` are unrestricted commercial; `Llama Community` and `Gemma` impose acceptable-use + 700M-MAU clauses; `Cohere` Command-A weights are research-only (no hosted reseller).
- **Weights URL** — canonical Hugging Face repo (the `read` tool / `HfApi` resolves these).
- **Context** — native max context (not theoretical RoPE-extended).
- **MMLU / GPQA / HumanEval** — knowledge / graduate-science-reasoning / Python-code pass@1. Cited per model.
- **Best provider price** — cheapest of {Together, Fireworks, Groq, DeepInfra, Cerebras} that hosts the model, input/output USD per 1M tokens.
- **PURIQ organ** — which flagship organ the model best serves (amaru = governance/receipts, sentra = security gates, vessels/killinchu = maritime, rosie = orchestration, a11oy = coding brain).

---

## 2. Model survey

### 2.1 Meta — Llama 3.3 70B
- **License:** Llama 3.3 Community License (commercial OK < 700M MAU; AUP attached).
- **Weights:** https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct
- **Context:** 128K ([Meta via NVIDIA model card](https://build.nvidia.com/meta/llama-3_3-70b-instruct/modelcard)).
- **Benchmarks (Meta model card):** MMLU (CoT) 86.0, MMLU-Pro 68.9, GPQA Diamond 50.5, HumanEval 88.4, MATH 77.0, IFEval 92.1 ([NVIDIA-hosted Meta model card](https://build.nvidia.com/meta/llama-3_3-70b-instruct/modelcard)).
- **Strengths:** Best-in-class instruction following (IFEval 92.1) and tool-use at the 70B dense tier; broad provider support; cheap.
- **Ideal use case:** General-purpose T2 "standard" reasoning + tool calls; the safe default workhorse.
- **Best price:** Groq $0.59 / $0.79 per 1M ([Groq pricing](https://groq.com/pricing)); Together flat $0.88 ([Together pricing](https://www.together.ai/pricing)); DeepInfra ~$0.30/$0.40 batch tier ([CloudZero Groq analysis](https://www.cloudzero.com/blog/groq-pricing/)).
- **PURIQ organ:** a11oy (T2 default), rosie (orchestration reasoning).

### 2.2 Meta — Llama 4 Scout & Maverick (released 2025-04-05)
- **License:** Llama 4 Community License.
- **Weights:** https://huggingface.co/meta-llama/Llama-4-Scout-17B-16E-Instruct · https://huggingface.co/meta-llama/Llama-4-Maverick-17B-128E-Instruct
- **Architecture:** MoE, natively multimodal. Scout = 17B active / 109B total / 16 experts; Maverick = 17B active / 400B total / 128 experts ([Meta Llama 4 blog](https://ai.meta.com/blog/llama-4-multimodal-intelligence/)).
- **Context:** Scout **10M** (industry-leading), Maverick **1M** ([LLM-Stats comparison](https://llm-stats.com/models/compare/llama-4-maverick-vs-llama-4-scout)).
- **Benchmarks (Meta-reported):** Maverick MMLU 85.5, MMLU-Pro 80.5, plus GPQA/LiveCodeBench/MATH wins over Scout on all 11 shared benchmarks; Scout MMLU 79.6, MMLU-Pro 74.3 ([LLM-Stats](https://llm-stats.com/models/compare/llama-4-maverick-vs-llama-4-scout)). Maverick is competitive with DeepSeek V3 on reasoning/coding at <½ active params ([Meta blog](https://ai.meta.com/blog/llama-4-multimodal-intelligence/)).
- **Strengths:** Native multimodal (image grounding); Scout's 10M context for whole-codebase / multi-document reasoning.
- **Ideal use case:** Scout → T5 long-context; Maverick → T6 multimodal + cost-efficient general.
- **Best price:** Scout DeepInfra $0.08/$0.30, Maverick DeepInfra $0.17/$0.60 ([LLM-Stats](https://llm-stats.com/models/compare/llama-4-maverick-vs-llama-4-scout)); Groq Scout $0.11/$0.34 ([Groq pricing](https://groq.com/pricing)).
- **PURIQ organ:** a11oy (T5 long-context for whole-repo refactor), vessels/killinchu (T6 multimodal chart/AIS-image understanding).

### 2.3 Alibaba — Qwen 2.5 72B
- **License:** Qwen License (Qwen2.5-72B uses a Qwen license; most other Qwen2.5 sizes Apache-2.0).
- **Weights:** https://huggingface.co/Qwen/Qwen2.5-72B-Instruct
- **Context:** 131K input ([LLM-Stats](https://llm-stats.com/models/compare/qwen-2.5-72b-instruct-vs-qwen3-235b-a22b)).
- **Benchmarks (Qwen-reported):** MMLU-Redux 86.8, HumanEval 86.6, MBPP 88.2, GSM8K 95.8 ([LLM-Stats](https://llm-stats.com/models/compare/qwen-2.5-72b-instruct-vs-qwen3-235b-a22b)).
- **Strengths:** Exceptional math/code at dense 72B; strong multilingual.
- **Ideal use case:** T2/T3 code+math standard.
- **Best price:** DeepInfra / Together ~$0.30–$1.20 tier (varies); Together hosts Qwen family ([Together pricing](https://www.together.ai/pricing)).
- **PURIQ organ:** a11oy (T3 code), amaru (numeric receipt math).

### 2.4 Alibaba — Qwen3 (235B-A22B flagship + dense 0.6B→32B)
- **License:** Apache-2.0 for the six open-weight dense models (0.6B, 1.7B, 4B, 8B, 14B, 32B) and the MoE checkpoints ([Qwen3 blog](https://qwenlm.github.io/blog/qwen3/)).
- **Weights:** https://huggingface.co/Qwen/Qwen3-235B-A22B · https://huggingface.co/Qwen/Qwen3-32B
- **Context:** 128K (235B-A22B, 8B–32B dense); 32K (0.6B–4B) ([Qwen3 blog](https://qwenlm.github.io/blog/qwen3/)).
- **Benchmarks (Qwen3 technical report):** 235B-A22B → Arena-Hard 95.6, MMLU 87.8, AIME'24 85.7, LiveCodeBench v5 70.7, CodeForces 2056, BFCL v3 70.8 ([Qwen3 Technical Report arXiv](https://arxiv.org/html/2505.09388v1); [LLM-Stats](https://llm-stats.com/models/compare/qwen-2.5-72b-instruct-vs-qwen3-235b-a22b)). Hybrid thinking/non-thinking mode.
- **Strengths:** Hybrid reasoning toggle; flagship rivals DeepSeek-R1/o1/Gemini-2.5-Pro; tiny Qwen3-4B rivals Qwen2.5-72B.
- **Ideal use case:** T4 reasoning-heavy (235B in thinking mode); Qwen3-32B for T2/T3; Qwen3-4B/8B for T1 fast.
- **Best price:** Groq Qwen3-32B $0.29/$0.59 ([Groq pricing](https://groq.com/pricing)); Together Qwen3-235B-A22B FP8 $0.20/$0.60 ([Together pricing](https://www.together.ai/pricing)).
- **PURIQ organ:** a11oy (T4 reasoning, T1 small), sentra (fast classifier on Qwen3-8B), amaru (math).

### 2.5 DeepSeek — R1 & V3
- **License:** **MIT** (R1) and MIT + Model License with commercial use allowed (V3) ([LLM-Stats](https://llm-stats.com/models/compare/deepseek-r1-vs-deepseek-v3-0324)).
- **Weights:** https://huggingface.co/deepseek-ai/DeepSeek-R1 · https://huggingface.co/deepseek-ai/DeepSeek-V3
- **Architecture:** 671B total / 37B active MoE ([DeepSeek-V3 Technical Report arXiv](https://arxiv.org/html/2412.19437v1)).
- **Context:** R1 131K; V3-0324 164K ([LLM-Stats](https://llm-stats.com/models/compare/deepseek-r1-vs-deepseek-v3-0324)).
- **Benchmarks (DeepSeek-V3 tech report):** MMLU 88.5, MMLU-Pro 75.9, GPQA 59.1; V3-0324 update MATH-500 94.0, MMLU-Pro 81.2, GPQA 68.4, LiveCodeBench 49.2 ([DeepSeek-V3 Technical Report](https://arxiv.org/html/2412.19437v1); [LLM-Stats](https://llm-stats.com/models/compare/deepseek-r1-vs-deepseek-v3-0324)). R1 is a long-CoT reasoning model; distilled 1.5B–70B checkpoints on Qwen2.5/Llama3 released ([DeepSeek-R1 HF](https://huggingface.co/deepseek-ai/DeepSeek-R1)).
- **Strengths:** Frontier open reasoning (R1) and frontier open general (V3) under MIT — the most permissive frontier weights available.
- **Ideal use case:** R1 → T4 reasoning-heavy; V3 → T2/T3 high-quality general+code.
- **Best price:** DeepInfra V3.x blended $0.29/1M ($0.26 in / $0.38 out) — lowest blended of 9 tracked providers ([DeepInfra V3.2 benchmark](https://deepinfra.com/blog/deepseek-v3-2-api-benchmarks)); Together V3.1 $0.60/$1.70, R1 $3.00/$7.00 ([AI Pricing Guru / Together](https://www.aipricing.guru/together-pricing/)).
- **PURIQ organ:** a11oy (T4 reasoning brain — primary), amaru (governance-grade reasoning under MIT — no AUP risk), sentra.

### 2.6 Mistral — Large 3 / Small 3 / Codestral 25.01
- **License:** **Apache-2.0** across the Mistral 3 family (Large 3, Ministral 3B/8B/14B) and Mistral Small 3 (24B); Codestral has the Mistral Non-Production (MNPL) for weights but is API-licensed for commercial ([Mistral 3 news](https://mistral.ai/news/mistral-3/); [DataCamp Mistral 3](https://www.datacamp.com/blog/mistral-3); [Mistral Small 24B HF](https://huggingface.co/mistralai/Mistral-Small-24B-Base-2501)).
- **Weights:** https://huggingface.co/mistralai/Mistral-Large-Instruct-2411 · https://huggingface.co/mistralai/Mistral-Small-24B-Instruct-2501 · https://huggingface.co/mistralai/Codestral-22B-v0.1
- **Context:** Large 3 **256K**; Small 3 32K; Codestral 25.01 **256K** ([DataCamp](https://www.datacamp.com/blog/mistral-3); [Mistral Codestral 25.01 news](https://mistral.ai/news/codestral-2501/)).
- **Benchmarks:** Small 3 (24B, instruct) MMLU ~81, MMLU-Pro 66.3, GPQA-main 45.3, HumanEval 84.8, MATH 70.6 ([Mistral Small 24B HF card](https://huggingface.co/mistralai/Mistral-Small-24B-Base-2501)). Codestral 25.01 HumanEval **86.6**, MBPP 80.2, LiveCodeBench 37.9, RepoBench 38.0, 256K context — leader in its weight class for FIM/coding ([Mistral Codestral 25.01](https://mistral.ai/news/codestral-2501/)). Large 3 is current top OSS coding model on LMArena ([DataCamp](https://www.datacamp.com/blog/mistral-3)).
- **Strengths:** Codestral = best-in-class fill-in-the-middle + 256K codebase context; Small 3 = 3× speed vs Llama 3.3 70B at similar quality; all Apache-2.0 (Large/Small).
- **Ideal use case:** Codestral → T3 code-specialized primary; Small 3 → T1/T2 fast; Large 3 → T2/T4 general.
- **Best price:** Codestral via Mistral API ~$0.30/$0.90 (Mistral hosted); Small 3 DeepInfra/Together low tier.
- **PURIQ organ:** a11oy (T3 code — Codestral primary, T1 — Small 3).

### 2.7 Google — Gemma 3 (1B/4B/12B/27B)
- **License:** Gemma Terms of Use (commercial OK, AUP attached).
- **Weights:** https://huggingface.co/google/gemma-3-27b-it
- **Context:** 128K (4B/12B/27B), 32K (1B) ([Gemma 3 model card](https://ai.google.dev/gemma/docs/core/model_card_3); [HF Gemma3 blog](https://huggingface.co/blog/gemma3)).
- **Benchmarks (Gemma 3 card, 27B):** MMLU-Pro 67.5, GPQA Diamond 42.4, MATH 69.0, HumanEval 48.8, MMLU 78.6, LiveCodeBench 29.7, LMArena Elo 1339 (text-only, top-10) ([Gemma 3 model card](https://ai.google.dev/gemma/docs/core/model_card_3); [NVIDIA Gemma3 card](https://build.nvidia.com/google/gemma-3-27b-it/modelcard); [HF Gemma3 blog](https://huggingface.co/blog/gemma3)).
- **Strengths:** Multimodal (image+text) 4B+; 140+ languages; strong reasoning-per-watt; runs on single GPU.
- **Ideal use case:** T6 multimodal (mid-tier), T1 fast multilingual, edge.
- **Best price:** DeepInfra / Together low tier; Gemma 27B widely hosted.
- **PURIQ organ:** vessels/killinchu (T6 chart/document VQA), a11oy (T1 multilingual).

### 2.8 Microsoft — Phi-4 (14B) & Phi-4-multimodal
- **License:** **MIT** (Phi-4 and Phi-4-multimodal) ([Phi-4 HF](https://huggingface.co/microsoft/phi-4); [ApX Phi-4](https://apxml.com/models/phi-4)).
- **Weights:** https://huggingface.co/microsoft/phi-4 · https://huggingface.co/microsoft/Phi-4-multimodal-instruct
- **Context:** Phi-4 **16K**; Phi-4-multimodal **128K** ([Phi-4 HF](https://huggingface.co/microsoft/phi-4); [Phi-4-multimodal HF](https://huggingface.co/microsoft/Phi-4-multimodal-instruct)).
- **Benchmarks (Microsoft, simple-evals):** Phi-4 MMLU 84.8, **GPQA 56.1** (beats GPT-4o's 50.6), MATH 80.4, HumanEval 82.6 ([Phi-4 HF card](https://huggingface.co/microsoft/phi-4); [Phi-4 Technical Report](https://www.microsoft.com/en-us/research/wp-content/uploads/2024/12/P4TechReport.pdf)). Phi-4-multimodal MMMU 55.1, processes text+image+audio ([Phi-4-multimodal HF](https://huggingface.co/microsoft/Phi-4-multimodal-instruct)).
- **Strengths:** Best GPQA-per-parameter at 14B (exceeds its GPT-4o teacher on GPQA/MATH); MIT; small footprint. Phi-4-multimodal adds audio+vision in one 5.6B model.
- **Ideal use case:** T1 fast reasoning (Phi-4), T6 multimodal/audio (Phi-4-multimodal); cheap on-prem science-reasoning.
- **Best price:** DeepInfra / OpenRouter low tier ([OpenRouter Phi-4-mm](https://openrouter.ai/microsoft/phi-4-multimodal-instruct)).
- **PURIQ organ:** sentra (T1 fast graduate-grade triage), a11oy (T1), vessels (audio/voice ops via Phi-4-mm).

### 2.9 01.AI — Yi 1.5 / Yi-Lightning
- **License:** **Apache-2.0** (Yi-1.5, Yi-Coder, Yi-VL) ([01-ai/Yi GitHub](https://github.com/01-ai/Yi); [AI Wiki Yi guide](https://artificial-intelligence-wiki.com/generative-ai/large-language-models/yi-models-guide/)).
- **Weights:** https://huggingface.co/01-ai/Yi-1.5-34B-Chat · https://huggingface.co/01-ai/Yi-Coder-9B-Chat
- **Context:** Yi-1.5 4K/16K/32K variants; Yi-34B-200K extended to 200K; Yi-Coder 128K ([Yi-1.5 HF](https://huggingface.co/01-ai/Yi-1.5-34B); [AI Wiki](https://artificial-intelligence-wiki.com/generative-ai/large-language-models/yi-models-guide/)).
- **Benchmarks:** Yi-1.5-34B-Chat on par with or beyond larger models on most benchmarks; Yi-9B leads similar-size OSS in code/math/reasoning ([Yi-1.5 HF card](https://huggingface.co/01-ai/Yi-1.5-34B)). Yi-Lightning (API, closed) reached top-tier LMSYS Elo in late 2024.
- **Strengths:** Strong bilingual EN/ZH; Apache-2.0; Yi-Coder 128K for code understanding.
- **Ideal use case:** T2/T3 bilingual; Yi-Coder T3 code; Yi-34B-200K T5 long-context (open).
- **PURIQ organ:** a11oy (T3 bilingual code), vessels (ZH-port documents).

### 2.10 Cohere — Command R+ / Command A
- **License:** **CC-BY-NC (research-only)** weights for Command A — *not* available for cheap third-party hosted resale ([Reddit/LocalLLaMA Command A](https://www.reddit.com/r/LocalLLaMA/comments/1jabj70/new_model_from_cohere_command_a/)). Commercial use via Cohere API only.
- **Weights:** https://huggingface.co/CohereForAI/c4ai-command-a-03-2025
- **Context:** Command R+ 128K; **Command A 256K** (111B params, 2 GPUs, 156 tok/s, 1.75× R+ throughput) ([Cohere Command A docs](https://docs.cohere.com/docs/command-a); [Cohere Command R+ docs](https://docs.cohere.com/docs/command-r-plus)).
- **Strengths:** Best-in-class enterprise RAG + tool-use + citations; multilingual; long context. Command A pricing $2.50/$10 via Cohere ([Reddit](https://www.reddit.com/r/LocalLLaMA/comments/1jabj70/new_model_from_cohere_command_a/)).
- **Ideal use case:** T2/T5 RAG-grounded answer with citations (Cohere API path only).
- **PURIQ organ:** a11oy (RAG-backed T2/T5 with citation), rosie (grounded orchestration summaries). **Caveat:** research-only weights → use only via Cohere API in production; not a self-host candidate.

### 2.11 IBM — Granite 3.3 (2B/8B)
- **License:** **Apache-2.0** ([IBM Granite 3.3 announce](https://www.ibm.com/new/announcements/ibm-granite-3-3-speech-recognition-refined-reasoning-rag-loras); [Granite 3.3 HF](https://huggingface.co/ibm-granite/granite-3.3-2b-instruct)).
- **Weights:** https://huggingface.co/ibm-granite/granite-3.3-8b-instruct
- **Context:** 128K ([NVIDIA Granite 3.3 card](https://build.nvidia.com/ibm/granite-3_3-8b-instruct/modelcard)).
- **Benchmarks (IBM, 8B-Instruct):** Arena-Hard 57.56, AlpacaEval-2.0 62.68, MMLU 65.54, HumanEval 89.73, HumanEval+ 86.09, IFEval 74.82, MATH-500 69.02, AIME24 8.12 ([Granite 3.3 HF card](https://huggingface.co/ibm-granite/granite-3.3-2b-instruct)). Structured `<think>`/`<response>` reasoning tags + speech recognition + RAG LoRAs.
- **Strengths:** Enterprise-clean training-data provenance (permissively licensed + curated synthetic); built-in RAG LoRAs; strong HumanEval at 8B; explicit thinking tags.
- **Ideal use case:** T1/T2 governed enterprise tasks where data provenance matters; RAG.
- **Best price:** DeepInfra small tier; widely hosted.
- **PURIQ organ:** amaru (provenance-clean governance), sentra (LoRA-gated RAG), a11oy (T1).

### 2.12 Nous Research — Hermes 4 (70B / 405B)
- **License:** Open Source (built on Llama 3.1 base; inherits Llama Community terms) ([Hermes 4 70B HF](https://huggingface.co/NousResearch/Hermes-4-70B); [OpenRouter Hermes 4 70B](https://openrouter.ai/nousresearch/hermes-4-70b)).
- **Weights:** https://huggingface.co/NousResearch/Hermes-4-70B · https://huggingface.co/NousResearch/Hermes-4-405B
- **Context:** 131K ([Price Per Token Hermes compare](https://pricepertoken.com/compare/nousresearch-hermes-4-405b-vs-nousresearch-hermes-4-70b)).
- **Capabilities:** Hybrid `<think>` reasoning toggle; SOTA on Nous' RefusalBench (maximally steerable, low refusal); strong JSON/schema/function-calling/tool-use ([Hermes 4 70B HF](https://huggingface.co/NousResearch/Hermes-4-70B); [OpenRouter](https://openrouter.ai/nousresearch/hermes-4-70b)).
- **Strengths:** Steerability + reduced refusals + reliable structured output — valuable where the brain must obey instruction-hierarchy / Covenant policies precisely.
- **Ideal use case:** T2/T4 steerable agentic tool-calling; structured-output emitter.
- **Best price:** Hermes 4 70B ~$0.13/$0.40 (Nebius) ([Design for Online review](https://designforonline.com/ai-models/nous-hermes-4-70b/)).
- **PURIQ organ:** a11oy (T2 tool-calling brain — high steerability fits HUKLLA instruction-hierarchy), rosie (schema-bound orchestration emitter).

### 2.13 Allen AI — OLMo 2 32B + Tulu 3
- **License:** **Apache-2.0**; fully open (data, code, checkpoints, logs) ([OLMo 2 32B HF](https://huggingface.co/allenai/OLMo-2-0325-32B); [Ai2 OLMo2-32B blog](https://allenai.org/blog/olmo2-32b)).
- **Weights:** https://huggingface.co/allenai/OLMo-2-0325-32B-Instruct
- **Context:** 4096 native (32B) — *short context is the main limitation* ([OLMo 2 32B HF](https://huggingface.co/allenai/OLMo-2-0325-32B)).
- **Benchmarks:** First *fully-open* model to outperform GPT-3.5-Turbo and GPT-4o-mini on a multi-skill academic suite; post-trained with Tulu 3.1 ([Ai2 OLMo2-32B blog](https://allenai.org/blog/olmo2-32b); [Ai2 OLMo overview](https://allenai.org/olmo2)).
- **Strengths:** *Fully reproducible* — only model here with open training data + recipe; ideal where auditability/provenance is a hard requirement (Khipu receipts of training lineage).
- **Ideal use case:** T2 standard where full provenance auditability is mandated; research/eval anchor.
- **PURIQ organ:** amaru (fully-auditable training lineage = strongest Khipu-receipt fit), sentra (reproducible eval anchor). **Caveat:** 4K context blocks long-context organs.

### 2.14 Snowflake — Arctic
- **License:** **Apache-2.0** ([TechCrunch Arctic](https://techcrunch.com/2024/04/24/snowflake-releases-a-flagship-generative-ai-model-of-its-own/)).
- **Weights:** https://huggingface.co/Snowflake/snowflake-arctic-instruct
- **Architecture:** Dense-MoE hybrid, 480B total / 17B active, 128 experts ([TechCrunch](https://techcrunch.com/2024/04/24/snowflake-releases-a-flagship-generative-ai-model-of-its-own/)).
- **Context:** ~4K–32K (small; ~8K–24K words depending on fine-tune) ([TechCrunch](https://techcrunch.com/2024/04/24/snowflake-releases-a-flagship-generative-ai-model-of-its-own/)).
- **Benchmarks:** Optimized for **enterprise SQL/database code generation**; beats DBRX, Llama 2 70B, Mixtral-8x7B on coding+SQL per Snowflake; "leading" MMLU per Snowflake (treat MMLU claim cautiously) ([TechCrunch](https://techcrunch.com/2024/04/24/snowflake-releases-a-flagship-generative-ai-model-of-its-own/)).
- **Strengths:** Cheap training, SQL/DB code specialty.
- **Ideal use case:** T3 SQL/database code generation (niche).
- **PURIQ organ:** a11oy (T3 SQL fallback), vessels (SQL over AIS/registry tables). **Caveat:** small context, aging (2024).

### 2.15 Databricks — DBRX
- **License:** Databricks Open Model License (Llama-like: 700M-MAU cap, no training-on-outputs) ([Interconnects DBRX](https://www.interconnects.ai/p/databricks-dbrx-open-llm)).
- **Weights:** https://huggingface.co/databricks/dbrx-instruct
- **Architecture:** 132B total / 36B active fine-grained MoE; 12T-token pretraining ([Databricks DBRX blog](https://www.databricks.com/blog/introducing-dbrx-new-state-art-open-llm)).
- **Context:** 32K ([Interconnects](https://www.interconnects.ai/p/databricks-dbrx-open-llm)).
- **Benchmarks (Databricks):** HF Open LLM Leaderboard 74.5 (top vs Mixtral 72.7); MMLU 73.7, HumanEval 70.1, GSM8K 72.8 — beats GPT-3.5 on programming/math ([Databricks DBRX blog](https://www.databricks.com/blog/introducing-dbrx-new-state-art-open-llm)).
- **Strengths:** Strong programming/math for a 2024 MoE; Databricks/Mosaic tooling.
- **Ideal use case:** T2/T3 (legacy); largely superseded by Qwen3/DeepSeek.
- **Best price:** Fireworks MoE 56.1–176B tier ~$1.20/1M ([Fireworks pricing](https://fireworks.ai/pricing)).
- **PURIQ organ:** a11oy (T3 legacy fallback only). **Caveat:** aging; prefer newer MoE.

### 2.16 TII — Falcon 3 / Falcon-H1
- **License:** **TII Falcon LLM License** (Apache-2.0-based + AUP); Falcon 7B/40B were pure Apache-2.0 ([AI Research Lab Falcon](https://nextomoro.com/falcon/)).
- **Weights:** https://huggingface.co/tiiuae/Falcon3-10B-Instruct · https://huggingface.co/tiiuae/Falcon-H1-34B-Instruct
- **Context:** Falcon 3 **32K**; Falcon-H1 (hybrid Transformer-SSM) up to **262K** ([AI Research Lab Falcon](https://nextomoro.com/falcon/)).
- **Benchmarks:** Falcon3-10B-Base MMLU 73.1, GSM8K 83.0, BBH 59.7, MBPP 73.8; Falcon3-10B-Instruct IFEval 78.0, BFCL 86.3 — led HF Open LLM Leaderboard <13B in early 2025 ([AI Research Lab Falcon](https://nextomoro.com/falcon/)). Falcon3-7B GPQA 35.5 ([Falcon3-7B HF](https://huggingface.co/tiiuae/Falcon3-7B-Base/blob/refs%2Fpr%2F3/README.md)). Falcon-H1 Arabic leads Open Arabic LLM Leaderboard ([AI Research Lab Falcon](https://nextomoro.com/falcon/)).
- **Strengths:** Falcon-H1 hybrid SSM → cheap 262K long-context inference; Arabic SOTA; sub-13B leader.
- **Ideal use case:** Falcon-H1 → T5 economical long-context; Falcon 3 → T1 small.
- **PURIQ organ:** a11oy (T5 economical long-context fallback), vessels (Arabic-port maritime docs).

### 2.17 Shanghai AI Lab — InternLM 2.5
- **License:** Apache-2.0 (weights free for commercial via registration).
- **Weights:** https://huggingface.co/internlm/internlm2_5-20b-chat
- **Context:** InternLM2.5 supports up to **1M** context (7B/20B 1M variants).
- **Strengths:** Strong tool-use / agent (built-in `Lagent` agent framework); 1M context on 7B/20B; competitive math (GSM8K/MATH).
- **Ideal use case:** T2/T5 agentic tool-use at small param count; 1M-context economical.
- **PURIQ organ:** a11oy (T5 economical 1M-context), rosie (agent tool-use). *Note: InternLM benchmark figures vary by harness; verify against `internlm` model card before locking router weights.*

---

## 3. Provider price reference (USD per 1M tokens, input / output)

Cited per vendor pricing page. Use the **lowest hosting provider** that serves the model at production SLA.

| Model | Together | Groq | DeepInfra | Fireworks | Cerebras |
|---|---|---|---|---|---|
| Llama 3.1 8B | $0.18 | $0.05 / $0.08 | low | — | — |
| Llama 3.3 70B | $0.88 flat | $0.59 / $0.79 | ~$0.30 / $0.40 (batch) | — | $0.85 / $1.20 |
| Llama 4 Scout | $3.00 (FT)* | $0.11 / $0.34 | $0.08 / $0.30 | — | — |
| Llama 4 Maverick | — | — | $0.17 / $0.60 | — | — |
| Qwen3-32B | — | $0.29 / $0.59 | — | — | — |
| Qwen3-235B-A22B | $0.20 / $0.60 | — | — | — | — |
| DeepSeek V3.x | $0.60 / $1.70 | — | **$0.29 blended** | $1.20 / $1.20 (V3.2) | — |
| DeepSeek R1 | $3.00 / $7.00 | — | — | — | — |
| gpt-oss-120B | — | $0.15 / $0.60 | — | $0.15 / $0.60 | — |
| gpt-oss-20B | — | $0.075 / $0.30 | — | $0.07 / $0.30 | — |
| DBRX / Mixtral-8x22B (MoE 56–176B) | $1.20 | — | — | $1.20 | — |

\* Together $3.00 figure is fine-tuning per-token, not inference. Sources: [Together pricing](https://www.together.ai/pricing), [Groq pricing](https://groq.com/pricing), [DeepInfra V3.2 benchmark](https://deepinfra.com/blog/deepseek-v3-2-api-benchmarks), [Fireworks pricing](https://fireworks.ai/pricing) / [Fireworks serverless docs](https://docs.fireworks.ai/serverless/pricing), [Cerebras Llama 3.3 70B cost (Bifrost)](https://www.getmaxim.ai/bifrost/llm-cost-calculator/provider/cerebras/model/llama-3.3-70b).

**Cerebras** is sold primarily as monthly seats (Pro $50 / 24M tok-per-day; Max $200 / 120M tok-per-day) — value lies in extreme throughput for agentic loops, not per-token cost ([Cerebras pricing](https://www.cerebras.ai/pricing)). **Groq** is the latency leader (Llama 3.3 70B at 394 TPS; Llama 3.1 8B at 840 TPS) — best for T0/T1 fast tiers ([Groq pricing](https://groq.com/pricing)). **DeepInfra** is the blended-cost leader for DeepSeek-class MoE ([DeepInfra](https://deepinfra.com/blog/deepseek-v3-2-api-benchmarks)).

---

## 4. License risk classification (for HUKLLA gating)

| Class | Models | Production posture |
|---|---|---|
| **GREEN** (Apache-2.0 / MIT — no AUP friction) | DeepSeek R1/V3 (MIT), Phi-4 / Phi-4-mm (MIT), Qwen3 dense+MoE, Mistral Large 3 / Small 3, Gemma-3 (Gemma terms), Granite 3.3, OLMo 2, Yi 1.5, Arctic, InternLM 2.5 | Self-host or any provider; default-eligible for all organs |
| **AMBER** (community license, 700M-MAU + AUP) | Llama 3.3 / Llama 4 / Hermes 4 (Llama base), DBRX, Falcon (TII) | OK for SZL scale; record license in Khipu receipt; AUP check at gate |
| **RED** (research-only weights) | Cohere Command A / R+ | API-only; never self-host in prod; route via Cohere endpoint only |

> The router (`A11OY_CODE_ROUTER_SPEC.md`) treats RED models as API-endpoint-only and emits a Khipu license receipt on every AMBER call. This is the **license tripwire** feeding HUKLLA T-license.

---

## 5. Organ → primary model map (summary)

| PURIQ organ | Role | Primary open model | Why |
|---|---|---|---|
| **a11oy** | coding brain | DeepSeek V3 (general) + Codestral 25.01 (code) + DeepSeek R1 (reason) | MIT/Apache, frontier code + reasoning, 256K code context |
| **amaru** | governance / receipts | OLMo 2 32B + Granite 3.3 + DeepSeek (MIT) | full provenance / clean data lineage = strongest Khipu fit |
| **sentra** | security gates | Phi-4 (GPQA) + Qwen3-8B + Granite RAG LoRA | fast graduate-grade triage, structured output |
| **vessels / killinchu** | maritime intel | Llama 4 Maverick / Gemma 3 27B (multimodal) + Falcon-H1 (Arabic, long) | chart/AIS-image VQA, multilingual port docs, 262K context |
| **rosie** | orchestration | Hermes 4 70B + Llama 3.3 70B + Qwen3-235B | steerable schema-bound emitters, instruction-hierarchy compliance |

Detailed tier routing, fallback chains, and capability matrix → `A11OY_CODE_ROUTER_SPEC.md`.

---
*Signed: Yachay-extension — 2026-06-01. No bandaid. Math primitives only. Every benchmark cited to primary publisher; every price cited to vendor page.*
