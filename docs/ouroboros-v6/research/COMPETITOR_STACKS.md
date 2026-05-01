# Competitor AI Safety / Governance / Assurance Stack Deep-Dive

**Prepared for:** SZL Holdings — Ouroboros Runtime / 9-axis Λ Trust Scalar  
**Date:** April 2026  
**Scope:** NVIDIA, Google, IBM, Anthropic, OpenAI, and OSS competitors  
**Strategic Purpose:** Identify structural gaps that Ouroboros closes with mathematical proof, receipt-per-decision auditability, and classical-philosophy-rooted primitives.

---

## Table of Contents

1. [NVIDIA NeMo Guardrails](#1-nvidia-nemo-guardrails)
2. [NVIDIA NIM + AI Enterprise Stack](#2-nvidia-nim--ai-enterprise-stack)
3. [Google DeepMind Frontier Safety Framework v3](#3-google-deepmind-frontier-safety-framework-v3)
4. [Google Cloud Federal Compliance + Vertex AI Governance](#4-google-cloud-federal-compliance--vertex-ai-governance)
5. [Google Model Card Toolkit + Responsible AI Toolkit](#5-google-model-card-toolkit--responsible-ai-toolkit)
6. [IBM watsonx.governance](#6-ibm-watsonxgovernance)
7. [IBM AI Factsheets](#7-ibm-ai-factsheets)
8. [Anthropic Constitutional AI + RSP v3](#8-anthropic-constitutional-ai--rsp-v3)
9. [OpenAI Preparedness Framework v2](#9-openai-preparedness-framework-v2)
10. [Open-Source Competitors](#10-open-source-competitors)
    - [Guardrails AI](#guardrails-ai)
    - [Microsoft Presidio](#microsoft-presidio)
    - [Meta Llama Guard 4](#meta-llama-guard-4)
11. [Synthesis: What ALL of Them Are Missing](#11-synthesis-what-all-of-them-are-missing)

---

## 1. NVIDIA NeMo Guardrails

**Repo:** [https://github.com/NVIDIA/NeMo-Guardrails](https://github.com/NVIDIA/NeMo-Guardrails)  
**License:** Apache 2.0  
**Docs:** [https://docs.nvidia.com/nemo/guardrails/](https://docs.nvidia.com/nemo/guardrails/)

### Architecture: Colang DSL + Five Rail Categories

NeMo Guardrails is an open-source toolkit for adding *programmable guardrails* to LLM-based conversational applications. The core abstraction is a domain-specific language called **Colang**, purpose-built for expressing dialog flows and policy enforcement. Rail execution is mediated by an **LLMRails** runtime object that orchestrates all rail types in sequence. ([NVIDIA docs](https://docs.nvidia.com/nemo/guardrails/latest/about/rail-types.html))

The library defines **five rail categories** ([NVIDIA Guardrail Types](https://docs.nvidia.com/nemo/guardrails/latest/about/rail-types.html)):

| Rail Type | Trigger Point | Function |
|---|---|---|
| **Input rails** | Pre-LLM call | Validate and sanitize user input; block jailbreaks, PII, toxic content |
| **Dialog rails** | Flow control | Govern conversation structure; route to topics or refusals |
| **Retrieval rails** | RAG pipeline | Filter and validate retrieved chunks before injection |
| **Execution rails** | Tool/action calls | Validate agent actions before they execute |
| **Output rails** | Post-LLM response | Fact-check, moderate, and sanitize model outputs before delivery |

A configuration can include any number of rails across all categories. Flows not tagged as input, output, or retrieval become dialog or execution rails by default. ([NVIDIA configuration guide](https://docs.nvidia.com/nemo/guardrails/0.16.0/user-guides/configuration-guide/guardrails-configuration.html))

**Colang Architecture** operates as an event-driven state machine: user utterances generate `UtteranceUserActionFinished` events, Colang flows fire in response, and the runtime selects the appropriate LLM action or refusal. The architecture supports synchronous and asynchronous execution, and integrates OpenTelemetry for tracing. ([Colang Architecture Guide](https://docs.nvidia.com/nemo/guardrails/latest/reference/colang-architecture-guide.html))

**Action Server:** Custom Python actions are registered via `@action` decorators and invoked from Colang flows. Actions can call external APIs, databases, or execute code.

### Guardrails Library / Catalog

The library ships with a catalog of pre-built guardrails ([Guardrail Catalog](https://docs.nvidia.com/nemo/guardrails/latest/configure-rails/guardrail-catalog/index.html)) covering:

- **Jailbreak protection** — heuristics-based detection of adversarial prompts designed to bypass safety measures ([Jailbreak docs](https://docs.nvidia.com/nemo/guardrails/latest/configure-rails/guardrail-catalog/jailbreak-protection.html))
- **PII detection** — entity masking and redaction
- **Fact-checking / hallucination detection** — self-check output rail grounded in retrieved evidence ([Fact-checking docs](https://docs.nvidia.com/nemo/guardrails/latest/configure-rails/guardrail-catalog/fact-checking.html))
- **Topic moderation** — block off-topic or prohibited subject matter
- **Sensitive data detection** — financial, health, legal categories
- Community integrations: **CrowdStrike AIDR** (prompt injection, data exfiltration detection), **GuardrailsAI validators** (70+ community validators) ([CrowdStrike AIDR integration](https://docs.nvidia.com/nemo/guardrails/latest/configure-rails/guardrail-catalog/community/crowdstrike-aidr.html))

### Integration Partners

- **LangChain:** Three integration modes — middleware hooks into agents, wrap a chain/Runnable with guardrails, or use a LangChain chain inside a Colang flow. ([LangChain Integration](https://docs.nvidia.com/nemo/guardrails/latest/integration/langchain/langchain-integration.html))
- **LlamaIndex:** Native connector for RAG pipeline guardrailing
- **OpenTelemetry:** Semantic convention tracing added in recent releases ([GitHub releases](https://github.com/NVIDIA/NeMo-Guardrails/releases))

### 2026 Governance Partnerships (GTC 2026)

- **Cisco AI Defense** — integrated into NVIDIA's **OpenShell** agent platform to control multi-agent systems; extends Hybrid Mesh Firewall policy enforcement to NVIDIA BlueField DPUs ([Cisco newsroom](https://newsroom.cisco.com/c/r/newsroom/en/us/a/y2026/m03/cisco-secure-ai-factory-with-nvidia-GTC-2026.html))
- **CrowdStrike Falcon AIDR** — embeds at four enforcement points in the OpenShell runtime: prompt-response-action layer; natively supports NeMo Guardrails for enterprise agentic AI protection ([CrowdStrike blog](https://www.crowdstrike.com/en-us/blog/secure-homegrown-ai-agents-with-crowdstrike-falcon-aidr-and-nvidia-nemo-guardrails/))
- **Trend Micro TrendAI** — security-by-design integration for NVIDIA DSX Air AI factories ([Trend Micro press release](https://www.trendmicro.com/en/about/newsroom/local-press-releases/au/2026/2026-03-23.html))
- **Wiz** — cloud security integration in the Secure AI Factory stack ([VentureBeat GTC 2026 coverage](https://venturebeat.com/security/nvidia-gtc-2026-agentic-ai-security-five-vendor-governance-framework))

### What NeMo Guardrails Cannot Do (Gaps for Ouroboros)

| Gap | Detail |
|---|---|
| No closed-form trust scalar | Rails fire binary pass/fail or call an LLM classifier. There is no mathematical aggregate trust score with proof obligations. |
| No per-decision audit receipt | No immutable cryptographic receipt per inference decision. Tracing is telemetry logs, not verifiable audit artifacts. |
| No honesty decomposition | PII and jailbreak detection say nothing about epistemic honesty, calibration, sycophancy, or deceptive intent axes. |
| Policy expressed in DSL, not mathematics | Colang flows are imperative scripts. There is no formal mathematical specification of what constitutes "safe" behavior across axes. |
| Stateless per-request | Each rail fires independently. No longitudinal trust accumulation across a session or agent lifetime. |
| No provenance for the guardrail itself | Who audits the auditor? The Guardrail Catalog is community-maintained code with no formal proof of correctness. |

**Pricing posture:** Open-source core (Apache 2.0), free to self-host. Enterprise integrations (CrowdStrike AIDR, Cisco AI Defense) carry vendor SaaS pricing. NeMo itself has no paid tier.

---

## 2. NVIDIA NIM + AI Enterprise Stack

**NIM docs:** [https://developer.nvidia.com/nim](https://developer.nvidia.com/nim)

### Architecture

**NVIDIA NIM** (NVIDIA Inference Microservices) are containerized, GPU-accelerated inference endpoints exposing **industry-standard OpenAI-compatible REST APIs**, deployable on any cloud or on-premises GPU hardware. ([NVIDIA NIM for Developers](https://developer.nvidia.com/nim)) Each NIM packages:

- Optimized model weights (TRT-LLM or vLLM backend)
- Kubernetes-native Helm chart deployment
- Health / liveness probes
- GPU scheduling metadata

**NIM Turbo** (validated best-in-class inference) is free for production deployments. ([NVIDIA NIM docs](https://docs.nvidia.com/nim/large-language-models/2.0.3/about-nim-llm/nim-offerings.html))

**NVIDIA AI Enterprise** is the commercial software layer bundling NIM, NeMo Guardrails, Morpheus (security AI), and RAPIDS. Available on:

- **AWS Marketplace** / Amazon SageMaker JumpStart ([NVIDIA NIM on AWS](https://blogs.nvidia.com/blog/nim-microservices-aws-inference/))
- **Azure Marketplace** / Azure AI Foundry ([Microsoft Marketplace](https://marketplace.microsoft.com/en-us/product/nvidia.nvidia-nims))
- **GCP, OCI, and on-prem** deployments

### Federal Posture

- **"Government Ready" designation** for AI Enterprise software meeting FedRAMP High / equivalent sovereign cloud security requirements, including FIPS 140-3 cryptographic module compliance. ([NVIDIA security baseline](https://docs.nvidia.com/ai-enterprise/planning-resource/ai-software-regulated-environments-white-paper/latest/security-baseline.html))
- **NVIDIA AI Factory for Government** reference design unveiled at GTC Washington D.C. (Oct 2025), providing a full-stack validated design for federal agencies. ([NVIDIA government blog](https://blogs.nvidia.com/blog/us-technology-leaders-ai-factory-design-government/))
- **Leidos partnership** — Leidos uses NVIDIA AI Enterprise software + VAST AI OS to process trillions of daily security events via NVIDIA Morpheus and BlueField DPUs. ([VAST Data press release](https://www.vastdata.com/press-releases/vast-federal-and-leidos-introduce-agentic-cybersecurity-with-nvidia-ai))
- **OCI Government Regions** — NVIDIA B300 Blackwell Ultra GPUs available in OCI government cloud for U.S. DoD workloads. ([Oracle announcement](https://www.oracle.com/news/announcement/blog/oracle-expands-ai-infrastructure-options-for-us-government-customers-2026-03-31/))
- NVIDIA does **not** independently hold FedRAMP ATO; it relies on cloud marketplace authorizations (AWS GovCloud, Azure Government, OCI).

### What NIM Cannot Do (Gaps)

| Gap | Detail |
|---|---|
| Inference layer only | NIM serves model outputs. It has no runtime trust scoring layer; safety is outsourced to NeMo Guardrails or partner tools. |
| No governance metadata in API response | API responses contain no embedded trust provenance or decision lineage. |
| No agentic lifecycle tracking | NIM executes single-turn inference; multi-step agent trustworthiness across sessions is not tracked. |

---

## 3. Google DeepMind Frontier Safety Framework v3

**Published:** September 22, 2025 (updated April 17, 2026)  
**URL:** [https://deepmind.google/blog/strengthening-our-frontier-safety-framework/](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/)  
**PDF:** [FSF 3.0 full text](https://storage.googleapis.com/deepmind-media/DeepMind.com/Blog/strengthening-our-frontier-safety-framework/frontier-safety-framework_3.pdf)  
**License:** Proprietary policy document (no OSS component)

### Architecture: Critical Capability Levels (CCLs)

The FSF is organized around **Critical Capability Levels** — thresholds at which an AI model may pose heightened risk of severe harm absent mitigation. FSF v3 defines CCLs across five risk domains: ([Google DeepMind FSF v3 blog](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/), [SiliconAngle](https://siliconangle.com/2025/09/22/google-deepmind-expands-frontier-ai-safety-framework-counter-manipulation-shutdown-risks/))

| Domain | Description |
|---|---|
| **CBRN (Chemical, Biological, Radiological, Nuclear)** | Assistance to threat actors seeking mass-casualty weapons |
| **Cybersecurity** | Novel cyberattack capabilities beyond red-team uplift threshold |
| **Machine Learning R&D** | Model's ability to autonomously accelerate AI development cycles |
| **Harmful Manipulation** | *New in v3:* Models refusing shutdown or attempting to influence human decision-making processes against oversight |
| **Instrumental Reasoning** | Cross-cutting autonomy: goal pursuit, self-preservation behaviors |

For each domain, DeepMind establishes **two CCL tiers**:
- **CCL-1:** "Capable" — model can perform capability with moderate scaffolding
- **CCL-2:** "Exceptional" — model autonomously performs at expert-or-above level

Mitigation actions are tiered by severity: enhanced monitoring → restricted access → deployment pause.

### Evaluation Protocols

- Evaluations run pre-deployment on each model release
- External evaluators engaged (industry, academia, government)
- Reporting cadence: public summaries with each major model release; April 2026 update reflects lessons from Gemini 2.x evaluation cycles ([arXiv FSF analysis](https://arxiv.org/html/2512.01166v3))

### Public Commitments

- Commit to **not deploy** models assessed as CCL-2 or above without implemented mitigations
- Periodic FSF revision (three versions in ~18 months: May 2024 → Feb 2025 → Sept 2025/Apr 2026)
- Collaboration with Frontier AI Safety Commitments signatories

### What FSF Cannot Do (Gaps)

| Gap | Detail |
|---|---|
| Pre-deployment policy only | FSF governs model releases, not runtime behavior of deployed instances. It cannot score a live inference. |
| No per-output audit artifact | No cryptographic receipt, no per-decision verifiability. Policy is textual commitment. |
| No honesty axis | FSF says nothing about sycophancy, epistemic calibration, or deceptive intent in production outputs. |
| No SME-accessible primitives | CCLs are defined in natural language for capability thresholds, not as computable mathematical objects. |
| No runtime scalar | There is no single trust score or Λ-type aggregate for a deployed model's current behavioral state. |

**Pricing posture:** No product; this is a governance policy framework.

---

## 4. Google Cloud Federal Compliance + Vertex AI Governance

**FedRAMP scope doc:** [https://docs.cloud.google.com/architecture/security/fedramp-dod-compliance-scope](https://docs.cloud.google.com/architecture/security/fedramp-dod-compliance-scope)

### Federal Authorizations

- **FedRAMP High** — 100+ Google Cloud services authorized, including **Vertex AI**, Agent Assist, Vertex AI Vector Search, and Looker. ([FedScoop](https://fedscoop.com/google-earns-fedramp-high-authorization-for-more-than-100-additional-commercial-services/))
- **DoD IL2 / IL4 / IL5** — formal provisional authorizations in place; IL5 achieved for **Gemini for Government** platform ([Google Cloud blog](https://cloud.google.com/blog/topics/public-sector/reflecting-on-a-year-of-transformation-and-mission-impact-together))
- Individual LLMs are **not** independently FedRAMP-authorized; the service wrapper (Generative AI on Vertex AI, Vertex AI Inference) carries the ATO. ([FedRAMP implementation guide](https://docs.cloud.google.com/architecture/fedramp-implementation-guide))
- **CDAO contract (Dec 2025)** — Chief Digital and Artificial Intelligence Office selected Google Cloud's AI platform for unclassified GenAI workflows across the DoD. ([Google Cloud press corner](https://www.googlecloudpresscorner.com/2025-12-09-Chief-Digital-and-Artificial-Intelligence-Office-Selects-Google-Clouds-AI-to-Power-GenAI-mil))

### Vertex AI Governance Features

Vertex AI Studio includes:
- Built-in content filtering with configurable safety attribute scoring
- Model monitoring for drift and performance degradation
- Explainability APIs (feature attributions via SHAP/Integrated Gradients)
- Responsible AI documentation within the Cloud console

Governance is largely **platform-side** configuration, not embedded in model outputs. ([Vertex AI Responsible AI docs](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/learn/responsible-ai))

### What Google Cloud Governance Cannot Do (Gaps)

| Gap | Detail |
|---|---|
| No trust scalar in API response | Vertex AI returns safety attribute scores per output (harassment, dangerous, etc.) but no composite trust aggregate with formal semantics. |
| No per-decision verifiable audit | Logs are GCP audit logs — mutable by privileged admins. No cryptographic receipt per inference. |
| ATO covers platform, not model behavior | IL5 means the infrastructure is cleared; it says nothing about the model's honesty or calibration. |
| No honesty decomposition | Safety filters detect categories of harm; they do not decompose truthfulness, calibration, or intent. |

---

## 5. Google Model Card Toolkit + Responsible AI Toolkit

**Model Card Toolkit:** [https://github.com/tensorflow/model-card-toolkit](https://github.com/tensorflow/model-card-toolkit)  
**License:** Apache 2.0  
**Responsible AI Toolkit:** [https://www.tensorflow.org/responsible_ai](https://www.tensorflow.org/responsible_ai)

### What Model Cards Capture

The Model Card Toolkit automates generation of structured ML model documentation. Fields include: ([GitHub model-card-toolkit concepts](https://github.com/tensorflow/model-card-toolkit/blob/master/model_card_toolkit/documentation/guide/concepts.md))

- Model description and architecture
- Intended use, out-of-scope uses
- Performance metrics across demographic slices
- Evaluation datasets
- Ethical considerations, limitations, and trade-offs
- Feedback mechanisms

The schema is a protocol buffer with a JSON interface. MCT 2.0 strictly enforces this schema. Model cards can embed graphics for performance visualization.

### What Model Cards Do NOT Capture

| Missing Dimension | Implication |
|---|---|
| Runtime behavior | A model card documents training-time properties. It cannot describe what a deployed model actually does in production. |
| Trust state per inference | No per-output honesty, calibration, or intent score. |
| Agentic multi-step safety | Model cards describe a single model; they have no concept of agent composition, tool use, or multi-hop trust. |
| Cryptographic provenance | A model card is a document; it can be altered. There is no binding between the card and the deployed artifact. |
| Decision audit trail | No record of individual decisions is attached to or derivable from a model card. |

**Pricing posture:** Fully open-source, Apache 2.0. No enterprise tier.

---

## 6. IBM watsonx.governance

**Product page:** [https://www.ibm.com/products/watsonx-governance](https://www.ibm.com/products/watsonx-governance)  
**Pricing:** [https://www.ibm.com/products/watsonx-governance/pricing](https://www.ibm.com/products/watsonx-governance/pricing)

### Architecture and Features

watsonx.governance is IBM's enterprise-grade AI governance lifecycle platform covering predictive ML models and generative AI assets. Key architectural components: ([blog.exceeds.ai 2026 comparison](https://blog.exceeds.ai/ibm-watsonx-governance-features-comparison/))

| Component | Function |
|---|---|
| **AI Factsheets** | Automated metadata collection across the model lifecycle (see §7) |
| **OpenScale / Watson OpenScale Monitor** | Continuous drift detection, bias monitoring, fairness metrics on deployed models |
| **Agentic AI monitoring** | Real-time dashboard tracking unexpected or unauthorized agent behavior |
| **Risk management console** | Risk register with policy mapping to EU AI Act, ISO 42001, NIST AI RMF |
| **Compliance accelerators** | Pre-built templates cutting manual compliance overhead; covers EU AI Act, NIST AI RMF, ISO 42001 |
| **Model inventory** | Centralized catalog of all ML/GenAI assets with lifecycle status |

The platform claims to cut manual oversight by 35% through real-time dashboards. ([blog.exceeds.ai](https://blog.exceeds.ai/ibm-watsonx-governance-features-comparison/))

### Federal Authorizations (April 2026)

- **FedRAMP Moderate (April 1, 2026):** IBM announced 11 AI and automation software solutions received FedRAMP authorization, including **watsonx.governance**, **watsonx.data**, **watsonx.data Intelligence**, and **watsonx Orchestrate**, enabled by IBM's strategic collaboration with **AWS**. ([IBM newsroom](https://newsroom.ibm.com/2026-04-01-IBM-Expands-FedRAMP-Portfolio-with-Authorization-of-11-Software-Solutions,-Including-watsonx))
- **FedRAMP High path:** Not yet achieved for watsonx; IBM's traditional software products (Z, Power) have High ATOs but the watsonx SaaS stack is currently at Moderate.

### EU AI Act + NIST Compliance Accelerators

- Pre-mapped compliance templates for **EU AI Act** high-risk system obligations (effective August 2026), **NIST AI RMF**, and **ISO 42001**
- Automated evidence collection for Article 13 transparency, Article 17 quality management system requirements
- Regulatory reporting dashboards

### Pricing

| Tier | Model | Indicative Cost |
|---|---|---|
| Essentials (SaaS) | Resource unit consumption | From ~$0.60/resource unit; up to 200 resource units, 1K records/evaluation |
| Standard | Per VPC (on-prem) or SaaS | ~$38K/year baseline |
| Enterprise | Custom quote | $10K–$25K/month SaaS or custom |
| AWS Marketplace | BYOL or subscription | Marketplace listing |

([IBM pricing page](https://www.ibm.com/products/watsonx-governance/pricing), [redresscompliance.com](https://redresscompliance.com/ibm-watsonx-licensing-guide.html), [blog.exceeds.ai](https://blog.exceeds.ai/ibm-watsonx-governance-features-comparison/))

### What watsonx.governance Cannot Do (Gaps)

| Gap | Detail |
|---|---|
| No closed-form trust scalar | Drift, bias, and fairness scores are separate monitors; there is no single mathematical aggregate trust value with formal semantics. |
| No per-decision receipt | Audit logs exist but are mutable platform logs, not cryptographic per-inference receipts. |
| No honesty decomposition | Monitors detect statistical drift; they do not decompose truthfulness, intent transparency, or epistemic calibration. |
| Compliance is template-matching | EU AI Act accelerators map policy categories to checklist items, not to mathematical compliance proofs. |
| Agentic monitoring is behavioral heuristics | "Unexpected behavior" detection is anomaly-based; no formal specification of what correct agentic behavior looks like. |
| Not real-time per-token | Monitoring operates on batched evaluation cycles, not per-inference runtime. |

---

## 7. IBM AI Factsheets

**IBM docs:** [https://www.ibm.com/docs/en/software-hub/5.1.x?topic=services-ai-factsheets](https://www.ibm.com/docs/en/software-hub/5.1.x?topic=services-ai-factsheets)  
**Sample repo:** [https://github.com/IBM/ai-governance-factsheet-samples](https://github.com/IBM/ai-governance-factsheet-samples)

### Architecture

AI Factsheets is the core metadata collection layer of watsonx.governance, providing a systematic approach to collecting and managing facts about ML model lifecycles. It operates as an event-capture service that records: ([IBM docs on AI Factsheets](https://www.ibm.com/docs/en/software-hub/5.1.x?topic=services-ai-factsheets))

- Data preparation events and dataset provenance
- Training runs: hyperparameters, framework versions, compute environment
- Model evaluation results: metrics, slices, comparison baselines
- Deployment events: endpoint registration, version tracking
- Monitoring events: drift alerts, bias scores, quality degradation

Factsheets populate the **model inventory** (Watson Knowledge Catalog) and auto-generate compliance evidence for governance workflows. Can be used standalone or integrated with watsonx.governance for full lifecycle tracking. ([IBM Cloud Pak for Data docs](https://dataplatform.cloud.ibm.com/docs/content/wsj/analyze-data/factsheets-model-inventory.html))

### What Factsheets Cannot Do (Gaps)

| Gap | Detail |
|---|---|
| Retrospective documentation | Factsheets document what happened during training and deployment setup; they do not record runtime inference decisions. |
| No per-query provenance | A Factsheet cannot tell you what the model knew, believed, or weighted for any specific user query. |
| No semantic provenance | Factsheets record *that* a model was trained on dataset X; they do not capture *why* specific outputs were generated. |
| Mutable records | Factsheets are IBM platform database records; they can be altered by authorized administrators. |

---

## 8. Anthropic Constitutional AI + RSP v3

**RSP v3:** [https://www.anthropic.com/news/responsible-scaling-policy-v3](https://www.anthropic.com/news/responsible-scaling-policy-v3)  
**Claude's Constitution (Jan 2026):** [https://www.anthropic.com/constitution](https://www.anthropic.com/constitution)  
**License:** Proprietary policy framework

### Constitutional AI

Constitutional AI (CAI) is Anthropic's training methodology in which an AI model is given a set of principles ("the constitution") and trained to critique and revise its own outputs according to those principles via RLHF. The January 2026 Claude's Constitution is an 80-page document establishing a 4-tier priority hierarchy: ([Anthropic Constitution](https://www.anthropic.com/constitution))

1. **Broadly safe** — not undermining human oversight mechanisms
2. **Broadly ethical** — honest, good values, avoiding harm
3. **Compliant with Anthropic guidelines** — following specific rules
4. **Genuinely helpful** — serving users effectively

The constitution is reason-based rather than rule-based: it explains the *logic* behind ethical principles rather than prescribing specific behaviors. ([BISI analysis](https://bisi.org.uk/reports/claudes-new-constitution-ai-alignment-ethics-and-the-future-of-model-governance))

### RSP v3 — AI Safety Levels

RSP v3 defines **AI Safety Levels (ASLs)** tied to capability thresholds: ([Anthropic RSP v3 page](https://www.anthropic.com/news/responsible-scaling-policy-v3))

| ASL | Capability Level | Required Safeguards |
|---|---|---|
| ASL-2 | Current Claude models | Existing security, standard deployment controls |
| ASL-3 | CBRN meaningful uplift / autonomous self-replication | Enhanced security, restricted deployment, third-party review |
| ASL-4+ | Expert-level CBRN uplift / AI-accelerated AI R&D | Not yet formally specified; framework allows revision |

**Key change in v3 (Feb 2026):** Anthropic removed the hard commitment to unilaterally pause AI development if safeguards cannot be implemented, replaced with commitments to public roadmaps of safety goals, risk reports, and third-party review. ([governance.ai RSP v3 analysis](https://www.governance.ai/analysis/anthropics-rsp-v3-0-how-it-works-whats-changed-and-some-reflections))

### What Is Checkable vs. Aspirational

| Checkable | Aspirational |
|---|---|
| ASL-3 safeguard implementation (verifiable by third-party audit) | "Claude has good values" — not externally measurable |
| Capability evaluations run before each release (documented) | "Broadly safe" behavior in deployment (no per-output measurement) |
| Third-party review of RSP compliance | Constitutional principles actually shaping every output |
| Public model cards and system cards | Calibrated uncertainty across all Claude responses |

### What Constitutional AI Cannot Do (Gaps)

| Gap | Detail |
|---|---|
| Training-time only | The constitution shapes training. Once deployed, there is no runtime enforcement mechanism that audits each output against the constitution. |
| No verifiable per-output compliance | You cannot prove that a specific Claude response complied with the 4-tier priority hierarchy. |
| No honesty decomposition | The constitution addresses honesty broadly; it does not decompose honesty into calibration, transparency, non-deception, non-manipulation, forthrightness axes — let alone quantify them. |
| No mathematical proof structure | ASLs are qualitatively defined capability thresholds assessed by human evaluators. |
| No receipt | No cryptographic or hash-based receipt binds a Claude response to the constitution version active at inference time. |

---

## 9. OpenAI Preparedness Framework v2

**Published:** April 15, 2025  
**URL:** [https://openai.com/index/updating-our-preparedness-framework/](https://openai.com/index/updating-our-preparedness-framework/)  
**PDF:** [https://cdn.openai.com/pdf/18a02b5d-6b67-4cec-ab64-68cdfbddebcd/preparedness-framework-v2.pdf](https://cdn.openai.com/pdf/18a02b5d-6b67-4cec-ab64-68cdfbddebcd/preparedness-framework-v2.pdf)  
**License:** Proprietary policy document

### Risk Categories

The Preparedness Framework v2 focuses on **three Tracked Categories** of frontier capability risk: ([OpenAI PF v2](https://openai.com/index/updating-our-preparedness-framework/), [arXiv analysis](https://arxiv.org/abs/2509.24394))

| Tracked Category | Concern |
|---|---|
| **Biological and Chemical** | Models providing meaningful uplift to actors seeking CBRN weapons |
| **Cybersecurity** | Models enabling novel cyberattack capabilities |
| **AI Self-Improvement / Replication** | Models autonomously copying themselves, sandbagging evaluations, or undermining safeguards |

Five criteria determine whether a capability enters the tracked list: *plausibility, measurability, severity, net-new contribution, and instantaneous or irremediable potential harm.* ([OpenAI PF v2 changelog](https://openai.com/index/updating-our-preparedness-framework/))

v2 notably covers only **3 of 24** AI risk categories identified in the MIT AI Risk Repository — systematically evaluating 87.5% of identified risk types is explicitly deprioritized. ([arXiv 2509.24394](https://arxiv.org/abs/2509.24394))

### Evaluations

- Red-teaming by internal **Preparedness** team and external evaluators (Metr, ARC Evals)
- Capability benchmarks run pre-deployment on each GPT-4-class and above model
- **Safety Score** (Critical / High / Medium / Low) determines deployment gate; Medium or above requires mitigation before release

### What PF Cannot Do (Gaps)

| Gap | Detail |
|---|---|
| Pre-deployment only | No runtime safety scoring on live inference. PF governs model releases, not production decisions. |
| 3 of 24 risk categories | The vast majority of AI risk types (misinformation, labor displacement, privacy, etc.) are not systematically evaluated. |
| No per-output verifiability | No cryptographic proof that a specific output was produced by a model that passed the PF gates. |
| No honesty scalar | Honesty, calibration, and epistemic integrity are not evaluated by the Preparedness Framework. |
| No agentic governance | Self-replication is tracked as a capability threshold, but real-time agentic trustworthiness across multi-step tasks is out of scope. |

---

## 10. Open-Source Competitors

### Guardrails AI

**Repo:** [https://github.com/guardrails-ai/guardrails](https://github.com/guardrails-ai/guardrails)  
**License:** Apache 2.0 (core); enterprise tiers with hosted Hub  
**Hub:** [https://guardrailsai.com/hub](https://guardrailsai.com/hub) — 70+ community validators

**Architecture:**

Guardrails AI is a Python framework with two primary primitives: ([GitHub guardrails-ai](https://github.com/guardrails-ai/guardrails))

| Primitive | Function |
|---|---|
| **Guard** | Wrapper around an LLM call; chains multiple Validators for input or output |
| **Validator** | Atomic check with configurable `on_fail` action (fix, filter, refusal, exception) |
| **RAIL spec** | Reliable AI Markup Language — XML/Python schema for specifying output structure + validation rules |
| **Guardrails Hub** | Community registry of 70+ pre-built validators |

Guards intercept inputs and outputs; validators encode quality criteria (toxicity, bias, format, schema conformance, PII, etc.). Validators can be composed into pipelines. NeMo Guardrails integrates Guardrails AI validators as a community integration. ([NVIDIA GuardrailsAI integration docs](https://docs.nvidia.com/nemo/guardrails/latest/configure-rails/guardrail-catalog/community/guardrails-ai.html))

**Pricing:**
- Open-source core: free (Apache 2.0), self-hosted
- Enterprise: hosted Guardrails Server, team dashboard, SLA — contact for pricing

**Federal / enterprise authorizations:** None. Community-maintained OSS.

**Integration partners:** Any LLM API; native integrations with OpenAI, Anthropic, Cohere, HuggingFace.

**Gaps vs. Ouroboros:**

| Gap | Detail |
|---|---|
| Validators are heuristic, not mathematical | Each validator returns pass/fail or a repair action; there is no formal proof structure or aggregate scalar. |
| No trust accumulation | Guards fire per-call. No session-level or lifetime trust state. |
| No audit receipt | No immutable binding between a validated output and the validation result. |
| No honesty decomposition | Validators cover format, toxicity, PII — not epistemic honesty axes. |

---

### Microsoft Presidio

**Repo:** [https://github.com/microsoft/presidio](https://github.com/microsoft/presidio)  
**License:** MIT  
**Docs:** [https://microsoft.github.io/presidio/](https://microsoft.github.io/presidio/)

**Architecture:** ([Presidio docs](https://microsoft.github.io/presidio/))

| Component | Function |
|---|---|
| **Presidio Analyzer** | PII detection engine; runs PII Recognizers against input text |
| **Presidio Anonymizer** | Transforms detected PII (redact, replace, encrypt, hash) |
| **Presidio Image-Redactor** | OCR-based PII detection in images |
| **Presidio Structured** | PII detection in tabular/structured data |

Detection methods: **Regex**, **Named Entity Recognition (NER)**, **context-aware pattern matching**, **rule-based logic**, **checksum validation**. Supports custom recognizers via plugin interface. Azure Health Data Services integration available. ([GitHub Presidio releases](https://github.com/microsoft/presidio/releases))

**Pricing posture:** Fully open-source (MIT), no paid tier.  
**Federal authorizations:** None independently; commonly deployed within Azure Government environments.  
**Integration partners:** Azure AI services, LangChain, custom Python pipelines.

**Gaps vs. Ouroboros:**

| Gap | Detail |
|---|---|
| PII-only scope | Presidio solves one specific problem (PII detection). It has no general trust or safety architecture. |
| No honesty axis | Privacy detection ≠ epistemic honesty or intent transparency. |
| No runtime trust | No per-inference trust scoring. |

---

### Meta Llama Guard 4

**Model:** [https://huggingface.co/meta-llama/Llama-Guard-4-12B](https://huggingface.co/meta-llama/Llama-Guard-4-12B)  
**NIM endpoint:** [https://build.nvidia.com/meta/llama-guard-4-12b/modelcard](https://build.nvidia.com/meta/llama-guard-4-12b/modelcard)  
**License:** Llama 4 Community License (restricted commercial use)

**Architecture:**

Llama Guard 4 is a 12B-parameter **natively multimodal** safety classifier, pruned from Llama 4 Scout, fine-tuned on the **MLCommons AI Safety taxonomy**. ([HuggingFace Llama Guard 4](https://huggingface.co/meta-llama/Llama-Guard-4-12B))

It classifies both prompts and responses across **14 hazard categories** derived from the MLCommons taxonomy: ([Groq community](https://community.groq.com/t/llama-guard-4-ensuring-safe-user-interactions-in-chatbots/113))

`S1: Violent Crimes | S2: Non-Violent Crimes | S3: Sex-Related Crimes | S4: Child Sexual Exploitation | S5: Defamation | S6: Specialized Advice | S7: Privacy | S8: Intellectual Property | S9: Indiscriminate Weapons | S10: Hate | S11: Suicide & Self-Harm | S12: Sexual Content | S13: Elections | S14: Code Interpreter Abuse`

Llama Guard 4 supports **multi-image inputs** (unlike predecessor Guard 3-11B-vision). It outputs `safe` / `unsafe` with a category label.

**Pricing posture:** Open-weight (Llama 4 Community License — free for most commercial use under 700M MAU threshold); deployable via NVIDIA NIM.  
**Federal authorizations:** None.  
**Integration partners:** NVIDIA NIM, vLLM, Ollama, custom Python.

**Gaps vs. Ouroboros:**

| Gap | Detail |
|---|---|
| Binary classification only | Outputs `safe`/`unsafe`; no graded trust scalar, no 9-axis honesty decomposition. |
| Taxonomy is harm-category-based | Hazard categories cover *harm types*, not *epistemic properties* (calibration, deception, sycophancy). |
| No audit receipt | Inference logs are caller-managed; no cryptographic binding. |
| No formal proof | Classification is an LLM call; there is no mathematical proof of why an output was classified safe or unsafe. |
| Restricted license | Community License limits redistribution and usage above 700M MAU without negotiated agreement. |

---

## 11. Synthesis: What ALL of Them Are Missing

### The Universal Architecture Gap

Every competitor reviewed — from NVIDIA's enterprise-grade NeMo stack to Google's FSF policy framework, from IBM's billion-dollar watsonx platform to Meta's Llama Guard — shares the same **four structural absences**:

---

### Gap 1: No Closed-Form, Mathematically Proven Trust Scalar

Every competitor produces either:
- **Binary outputs** (safe/unsafe, pass/fail)
- **Categorical risk levels** (Critical / High / Medium / Low)
- **Statistical monitors** (drift percentage, bias score)

None produces a **closed-form scalar trust value** with:
1. A mathematical definition over a well-specified domain
2. Formal proof obligations that the scalar correctly aggregates its constituent dimensions
3. A published, peer-reviewable derivation

**Ouroboros provides:** The **9-axis Λ trust scalar** — a composable, mathematically grounded aggregate that collapses nine independent honesty/trust dimensions into a single scalar with formal semantics. The construction and proof are publicly archived at Zenodo (DOI [10.5281/zenodo.19867281](https://doi.org/10.5281/zenodo.19867281) and [10.5281/zenodo.19934129](https://doi.org/10.5281/zenodo.19934129)).

---

### Gap 2: No Receipt-Per-Decision Auditability

**NeMo Guardrails** logs OpenTelemetry traces — mutable platform telemetry.  
**IBM watsonx.governance** writes to a Watson Knowledge Catalog — mutable admin-accessible records.  
**Google Cloud** writes to GCP Audit Logs — mutable by privileged IAM principals.  
**Anthropic / OpenAI** publish model cards and capability evaluations — these are documents, not runtime receipts.  
**Guardrails AI / Llama Guard** leave audit responsibility entirely to the caller.

None produces a **cryptographically bound, immutable receipt per inference decision** that:
- Identifies the exact model version
- Records the trust scalar at the moment of response
- Is verifiable by any third party without platform access
- Cannot be altered by platform administrators

**Ouroboros provides:** Receipt-per-decision auditability as a first-class primitive in the runtime, enabling post-hoc verifiability of any inference decision without reliance on platform-controlled logs.

---

### Gap 3: No 9-Axis Honesty Decomposition

Competitors detect:
- **Harm categories** (Llama Guard's 14 MLCommons hazards)
- **PII** (Presidio)
- **Jailbreaks** (NeMo)
- **Drift / bias** (IBM)

None decomposes honesty into independent axes that can be individually scored, weighted, and aggregated. The 9-axis Λ decomposition Ouroboros employs covers dimensions competitors have never formally specified, including epistemic calibration, non-deception of intent, non-manipulation through illegitimate means, forthrightness, autonomy-preservation, and others drawn from classical philosophy of mind and ethics.

**The gap:** A model can pass every competitor's safety check while being systematically sycophantic, overconfident, or subtly manipulative — none of their scalar monitors would catch this. Ouroboros's 9-axis decomposition is designed precisely for this failure mode.

---

### Gap 4: No Classical-Philosophy-Rooted Primitives

Every competitor's primitive vocabulary is purely operational:
- NeMo: `input_rail`, `output_rail`, `Colang flow`, `action`
- IBM: `drift_monitor`, `bias_score`, `factsheet_event`
- Google FSF: `CCL`, `mitigation_tier`
- OpenAI PF: `tracked_category`, `safety_score`
- Guardrails AI: `Guard`, `Validator`, `RAIL`

These are engineering abstractions. None is grounded in a philosophical theory of what it means for an agent to be trustworthy, honest, or acting in accordance with good values.

**Ouroboros provides:** **91 primitives** rooted in classical philosophy (Aristotelian virtue ethics, Kantian deontology, Stoic epistemic humility, and others), giving the runtime a conceptually coherent basis for evaluating AI behavior that is:
- Interpretable by non-technical stakeholders
- Grounded in millennia of human ethical reasoning
- Formally mappable to the 9-axis Λ scalar

---

### Competitive Summary Matrix

| Competitor | OSS | License | Closed-form Λ | Receipt-per-decision | 9-axis Honesty | Math Proof | Federal ATO | Pricing |
|---|---|---|---|---|---|---|---|---|
| NVIDIA NeMo Guardrails | ✓ | Apache 2.0 | ✗ | ✗ | ✗ | ✗ | Via marketplace | Free core |
| NVIDIA NIM / AI Enterprise | ✗ | Commercial | ✗ | ✗ | ✗ | ✗ | Gov Ready / FedRAMP via cloud | Subscription |
| Google FSF v3 | ✗ | Policy doc | ✗ | ✗ | ✗ | ✗ | N/A (policy only) | N/A |
| Google Vertex AI | ✗ | Commercial | ✗ | ✗ | ✗ | ✗ | FedRAMP High, IL5 | Pay-per-use |
| Google Model Card Toolkit | ✓ | Apache 2.0 | ✗ | ✗ | ✗ | ✗ | None | Free |
| IBM watsonx.governance | ✗ | Commercial | ✗ | ✗ | ✗ | ✗ | FedRAMP Moderate | $38K+/yr |
| IBM AI Factsheets | ✗ | Commercial | ✗ | ✗ | ✗ | ✗ | FedRAMP Moderate | Bundled |
| Anthropic RSP v3 / CAI | ✗ | Policy/prop. | ✗ | ✗ | ✗ | ✗ | None | N/A |
| OpenAI Preparedness FW v2 | ✗ | Policy doc | ✗ | ✗ | ✗ | ✗ | None | N/A |
| Guardrails AI | ✓ | Apache 2.0 | ✗ | ✗ | ✗ | ✗ | None | Free / Enterprise |
| Microsoft Presidio | ✓ | MIT | ✗ | ✗ | ✗ | ✗ | None | Free |
| Meta Llama Guard 4 | ✓ | Llama 4 Comm. | ✗ | ✗ | ✗ | ✗ | None | Free (<700M MAU) |
| **Ouroboros (SZL Holdings)** | — | SZL proprietary | **✓** | **✓** | **✓** | **✓** | In progress | TBD |

---

### Strategic Innovation Opportunities for Ouroboros

Based on the gap analysis, the following differentiation vectors are mathematically unoccupied by any competitor:

1. **Λ-as-API:** Expose the 9-axis trust scalar as a REST endpoint that any LLM call can query post-inference — insert between NIM / Vertex AI / Bedrock and the application layer. No competitor occupies this layer.

2. **Receipts as compliance artifacts:** Position per-decision receipts as the auditable evidence layer that satisfies EU AI Act Article 13 (transparency) and Article 17 (quality management system) *at the inference level*, not just the model level. IBM's watsonx.governance compliance accelerators operate at the model-card level; Ouroboros operates at the token level.

3. **FedRAMP differentiation:** NVIDIA and Google achieve FedRAMP High for infrastructure; IBM is at Moderate for watsonx. A FedRAMP High ATO for the Ouroboros runtime with verifiable per-decision receipts would be the first mathematically provable trust scalar with a government clearance — a category of one.

4. **Philosophy-to-compliance bridge:** The 91 classical-philosophy-rooted primitives can be directly mapped to NIST AI RMF trust dimensions (Map, Measure, Manage, Govern) in a way no competitor's operational vocabulary supports. This positions Ouroboros as the semantic substrate for AI governance, not merely another monitor.

5. **Agentic trust accumulation:** All competitors treat trust as per-call. Ouroboros can accumulate Λ across an agent's session or lifetime — enabling "trust credit scoring" for autonomous AI agents, a dimension no competitor has formally specified.

---

*All citations verified against primary sources. Key source URLs embedded inline. Zenodo DOIs for Ouroboros: [10.5281/zenodo.19867281](https://doi.org/10.5281/zenodo.19867281) and [10.5281/zenodo.19934129](https://doi.org/10.5281/zenodo.19934129).*
