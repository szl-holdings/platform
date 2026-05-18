<!-- doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header. -->
# RESEARCH_MYTHOS — A11oy Frontier Intelligence Doctrine

**Classification:** Internal Research Doctrine  
**Owner:** A11oy Intelligence Team  
**Version:** 2.0  
**Last Updated:** May 2026

---

## Purpose

This document is the living research doctrine for A11oy's Frontier Intelligence capability. It establishes which labs, applied-agent companies, and academic voices we track; how we analyze their capability posture against A11oy's governed-intelligence thesis; and what 18–36 month capability bets we are formally committed to. Competitor and vendor names appear **only within `ResearchCitationPanel` components** in the product — never as direct product copy. All references in this file are for internal strategy use only.

---

## Frontier Lab Monitoring

### Synthesis Format per Entity

For each lab we track:
- **Stated thesis** — their publicly declared research mandate
- **Primary public artifacts** — canonical papers/posts with URLs
- **Strengths relative to A11oy's 8 dimensions** — specific capability areas where their work is strongest
- **Gaps** — where their research does not address A11oy's core dimensions (governance, proof chains, outcome verification, HITL, business observability)
- **A11oy implication** — which A11oy module, surface, or capability bet this lab's work directly informs

---

### 1. Anthropic Constitutional AI Group

**Stated thesis:** AI systems should be made safe through values specified at training time via Constitutional AI (CAI), harmlessness via RLHF, and interpretability research that makes model internals legible to humans.

**Primary public artifacts:**
- Constitutional AI: Harmlessness from AI Feedback — https://arxiv.org/abs/2212.08073
- Core Views on AI Safety — https://www.anthropic.com/news/core-views-on-ai-safety
- Model Card: Claude 3 — https://www.anthropic.com/claude-3-model-card
- Towards Monosemanticity — https://transformer-circuits.pub/2023/monosemanticity/index.html

**Strengths:** Constitutional safety framing, RLHF methodology, interpretability (features-level), structured output reliability, deployment safety posture.

**Gaps:** Constitutional AI operates at training time — runtime behavioral enforcement via a non-bypassable layer does not exist. No audit chain, proof ledger, or outcome verifier. HITL is advisory, not structural. No cross-domain business observability layer.

**A11oy implication:** Informs Constitution DSL design principles. Their constitutional failure modes (training-time specification is fragile) validate A11oy's runtime Covenant Layer as the correct architectural layer for enterprise deployment. Capability Bet 6 (Constitutional Runtime as acquisition target) directly cites this.

**Signal weight:** Very High | Scan cadence: Weekly

---

### 2. DeepMind Safety Team

**Stated thesis:** Build theoretical and empirical foundations for AI systems that remain safe and beneficial as they become more capable — covering reward modeling, scalable oversight, specification gaming, and corrigibility.

**Primary public artifacts:**
- Reward Tampering Problems and Solutions — https://arxiv.org/abs/1908.04734
- Scalable Agent Alignment via Reward Modeling — https://arxiv.org/abs/1811.07871
- Specification Gaming: The Flip Side of Intelligence — https://deepmind.google/discover/blog/specification-gaming-the-flip-side-of-intelligence/
- Safety via Debate — https://arxiv.org/abs/1805.00899

**Strengths:** Reward modeling theory, specification gaming taxonomy, theoretical corrigibility, multi-agent coordination theory.

**Gaps:** No enterprise deployment framework. Theoretical proofs do not transfer to a runtime enforcement layer. No business observability, no proof chain infrastructure, no HITL structural mandate — all governance remains research-layer.

**A11oy implication:** Capability Bet 8 (Reward Hacking as board-level concern) is directly derived from their specification gaming taxonomy. A11oy's Reward Hacking module tracks their published failure taxonomies as ground truth for detection heuristics.

**Signal weight:** Very High | Scan cadence: Weekly

---

### 3. OpenAI Alignment Science

**Stated thesis:** Solve the technical problem of aligning AI systems with human intent at scale, including scalable oversight (debate, amplification), interpretability, and superalignment.

**Primary public artifacts:**
- Learning to Summarize from Human Feedback — https://arxiv.org/abs/2009.01325
- Our approach to alignment research — https://openai.com/alignment/
- Weak-to-Strong Generalization — https://arxiv.org/abs/2312.09390
- CriticGPT paper — https://openai.com/research/finding-gpt-4s-mistakes-with-gpt-4

**Strengths:** RLHF at scale, GPT-4 capability ceiling, API platform breadth, deployment experience at scale.

**Gaps:** No runtime governance layer. Alignment is training-time; HITL is user-interface-optional not structurally mandated. No proof chains, no outcome verifier, no business observability framework for enterprise workflows. Agentic execution (Assistants API) lacks cross-domain audit.

**A11oy implication:** Capability Bet 12 (Benchmark Arbitrage) — OpenAI's benchmark performance improvements outpace real-world deployment trust, validating MirrorEval's independent internal evaluation approach.

**Signal weight:** High | Scan cadence: Weekly

---

### 4. AI Safety Institute (AISI / NIST)

**Stated thesis:** Government-level AI safety evaluation — establish red-team standards, evaluation frameworks, and pre-deployment testing requirements that become regulatory mandates.

**Primary public artifacts:**
- NIST AI RMF 2.0 — https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf
- DSIT AISI Report 2025 — https://www.gov.uk/government/organisations/ai-safety-institute
- METR Partnership — https://metr.org/research
- EU AI Act Evaluation Alignment — https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai

**Strengths:** Setting the regulatory bar for pre-deployment evals, red-team protocol formalization, mandatory testing regimes.

**Gaps:** AISI frameworks describe what to test, not how to enforce governance at runtime. No product layer. Compliance frameworks describe process requirements; they do not offer a runtime proof chain or HITL mandate.

**A11oy implication:** Capability Bet 2 (Formal Evaluation Frameworks as regulatory mandate) directly tracks AISI's roadmap. A11oy's MirrorEval framework must align with NIST AI RMF 2.0 compliance terminology for enterprise sales. This lab drives the most time-sensitive compliance roadmap items.

**Signal weight:** Very High | Scan cadence: Weekly

---

### 5. Stanford CRFM (Center for Research on Foundation Models)

**Stated thesis:** Study foundation models holistically — their capabilities, limitations, societal impacts — and produce benchmarking infrastructure (HELM) that enables rigorous cross-model comparison.

**Primary public artifacts:**
- HELM: Holistic Evaluation of Language Models — https://crfm.stanford.edu/helm/
- On the Opportunities and Risks of Foundation Models — https://arxiv.org/abs/2108.07258
- AlpacaEval methodology — https://github.com/tatsu-lab/alpaca_eval

**Strengths:** Benchmark rigor, evaluation methodology, societal impact framing, model card standards.

**Gaps:** HELM evaluates model-level capability, not agent-level governance compliance. No audit trail, no business observability, no enterprise deployment framework.

**A11oy implication:** A11oy's Benchmark Scoreboard page tracks HELM methodology as an external ground truth. Capability Bet 12 (Benchmark Arbitrage) and Bet 2 both reference CRFM's work. MirrorEval's independent eval philosophy mirrors HELM's independence-from-vendors principle.

**Signal weight:** High | Scan cadence: Bi-weekly

---

### 6. MIT CSAIL Robust Intelligence Group

**Stated thesis:** Make AI systems robust to adversarial conditions, distribution shift, and compositional failures through formal verification methods, adversarial testing, and theoretical robustness bounds.

**Primary public artifacts:**
- Certified Adversarial Robustness via Randomized Smoothing — https://arxiv.org/abs/1902.02918
- MIT FutureTech: AI Robustness — https://futuretech.mit.edu

**Strengths:** Formal verification of neural network properties, adversarial robustness certification, compositional reliability.

**Gaps:** Research addresses model robustness, not enterprise deployment governance. No runtime enforcement, no HITL architecture, no business observability.

**A11oy implication:** Informs A11oy's Adversarial Robustness module and red-team evaluation heuristics. Formal verification methods are a long-horizon candidate for integration with the Covenant Layer's policy enforcement proofs.

**Signal weight:** High | Scan cadence: Monthly

---

### 7. CMU LTI (Language Technologies Institute)

**Stated thesis:** Advance natural language processing, multi-agent coordination, language grounding, and compositional generalization — with strong emphasis on interactive, task-solving AI systems.

**Primary public artifacts:**
- Multi-agent coordination benchmarks — https://lti.cmu.edu/research
- Language grounding in embodied contexts — https://arxiv.org/search/?searchtype=all&query=CMU+language+grounding

**Strengths:** Multi-agent NLP, dialogue systems, task-oriented agents, language grounding.

**Gaps:** No governance framework, no enterprise compliance research, no proof chain or HITL mandate. Research remains pre-deployment.

**A11oy implication:** Capability Bet 3 (Multi-Agent Trust Protocols) tracks CMU's work on coordination protocols as a signal for when structured agent communication standards will emerge. Informs A11oy's Agent Identity Registry design.

**Signal weight:** Medium-High | Scan cadence: Monthly

---

### 8. Berkeley BAIR (Berkeley Artificial Intelligence Research)

**Stated thesis:** Broad AI research covering perception, decision-making, robotics, and interactive AI — with emphasis on learning from interaction, reinforcement learning, and embodied AI.

**Primary public artifacts:**
- RT-2 collaboration (Google/Berkeley) — https://arxiv.org/abs/2307.15818
- BAIR Blog — https://bair.berkeley.edu/blog/

**Strengths:** Embodied AI, sim-to-real transfer, robotic manipulation, vision-language-action models.

**Gaps:** No enterprise governance, no audit chain, no business observability. Research is pre-deployment and hardware-dependent.

**A11oy implication:** Capability Bet 4 (Embodied & Spatial Reasoning entering enterprise). ManipArena signal in the feed directly traces to Berkeley/CMU embodied AI work. A11oy has no embodied module — this is a monitoring-only lane with a Fabric IoT routing opportunity.

**Signal weight:** Medium-High | Scan cadence: Monthly

---

### 9. Allen Institute for AI (AI2)

**Stated thesis:** High-impact AI research and engineering for the common good, with emphasis on open benchmarks, common-sense reasoning, and scientific discovery AI.

**Primary public artifacts:**
- SuperGLUE / WinoGrande — https://winogrande.allenai.org
- BigBench Hard — https://arxiv.org/abs/2206.04615
- Semantic Scholar — https://www.semanticscholar.org

**Strengths:** Open benchmark leadership, common-sense reasoning evaluation, scientific literature processing.

**Gaps:** No enterprise deployment, no governance framework, no runtime enforcement or proof chain.

**A11oy implication:** AI2's benchmarks inform the Mythos Index as external evaluation ground truth. BigBench Hard tasks are cited in Capability Bet 12. Semantic Scholar feeds into A11oy's academic scanner pipeline.

**Signal weight:** Medium | Scan cadence: Monthly

---

### 10. UC San Diego ML Group

**Stated thesis:** Advance foundational machine learning — including efficient architectures (MoE), memory systems, and inference optimization — with strong publication record in systems-level ML.

**Primary public artifacts:**
- MoE routing efficiency research — https://arxiv.org/search/?searchtype=all&query=UCSD+mixture+of+experts
- Flash Attention collaboration — https://arxiv.org/abs/2205.14135

**Strengths:** Architecture efficiency, MoE routing, inference optimization, memory bandwidth research.

**Gaps:** No enterprise governance, no HITL, no audit chain. Pure systems/architecture research.

**A11oy implication:** Capability Bet 5 (Cost-per-Reasoning-Step collapse) is informed by UCSD's MoE and efficient inference work. Aegis cost models track MoE throughput benchmarks from this group.

**Signal weight:** Medium | Scan cadence: Monthly

---

## Applied Agent Company Monitoring

### Synthesis Format per Entity

For each company we track:
- **Stated thesis** — their public product positioning
- **Key public signals** with URLs
- **Capability strengths vs A11oy's 8 dimensions**
- **Governance gap** — where their architecture lacks A11oy's core properties
- **A11oy implication** — product or capability bet informed by this company's trajectory

---

### 1. Cognition AI (Devin)

**Stated thesis:** Build fully autonomous software engineering agents that can complete end-to-end coding tasks without human intervention.

**Key signals:**
- Devin SWE-bench results — https://www.cognition.ai/blog/introducing-devin
- SWE-bench Verified leaderboard — https://www.swebench.com

**Capability strengths:** Agentic execution (task completion autonomy), multi-step planning, code synthesis, tool use.

**Governance gap:** No human gate on execution. No proof chain of reasoning steps. No governance layer — Devin acts autonomously by design. No business observability framework. HITL is absent structurally.

**A11oy implication:** Devin's SWE-bench scores are the primary benchmark A11oy's software-engineering agents (Lyte, Aegis) are measured against. Capability Bet 3 (multi-agent coordination) tracks Cognition's expansion toward multi-agent task decomposition.

**Signal weight:** High | Scan cadence: Weekly

---

### 2. Adept AI

**Stated thesis:** Build AI systems that can operate computers — browser, desktop, SaaS apps — on behalf of humans, turning natural-language instructions into multi-step UI actions.

**Key signals:**
- ACT-1 model — https://www.adept.ai/blog/act-1
- Persimmon-8B open release — https://www.adept.ai/blog/persimmon-8b

**Capability strengths:** Browser-grounded agents, UI action modeling, enterprise SaaS integration, multi-step action sequences.

**Governance gap:** Action execution is unverified — no outcome verifier, no proof chain. No HITL structural mandate. No audit trail for UI actions. Governance depends entirely on operator configuration.

**A11oy implication:** Validates A11oy's approach of wrapping agentic execution in a proof-carrying layer. Adept's architecture demonstrates the gap — excellent execution capability, but no verifiability layer. Informs the Fabric Execute/Verify circuit.

**Signal weight:** High | Scan cadence: Bi-weekly

---

### 3. Cohere

**Stated thesis:** Enterprise-grade language model platform for retrieval, generation, and classification — with strong emphasis on private data RAG, Command-R for enterprise workflows, and governance-friendly deployment.

**Key signals:**
- Command-R+ benchmark — https://cohere.com/blog/command-r-plus-microsoft-azure
- Cohere Toolkit — https://github.com/cohere-ai/cohere-toolkit

**Capability strengths:** Enterprise RAG, structured output, data privacy posture, Command-R reasoning, deployment flexibility (on-prem).

**Governance gap:** No runtime governance layer beyond API-level access controls. No proof chain or audit trail. No HITL structural mandate. Business observability is customer-implemented.

**A11oy implication:** Cohere's enterprise deployment approach (private data, on-prem, compliance-forward) is the closest analog to A11oy's deployment philosophy. Capability Bet 9 (Sovereign AI) tracks Cohere's regional deployment offerings.

**Signal weight:** Medium-High | Scan cadence: Bi-weekly

---

### 4. Mistral AI

**Stated thesis:** Efficient, open-weight frontier models optimized for cost-effective inference — democratizing access to capable LLMs through open releases and enterprise-grade API.

**Key signals:**
- Mixtral-8x22B MoE — https://mistral.ai/news/mixtral-8x22b/
- Mistral Large 2 — https://mistral.ai/news/mistral-large-2407/

**Capability strengths:** MoE architecture efficiency, cost-per-token leadership, open-weight flexibility, European sovereignty positioning.

**Governance gap:** Model-only — no agent execution layer, no governance framework, no HITL, no audit chain or proof chain. Pure model provider.

**A11oy implication:** Capability Bet 5 (Cost-per-Reasoning-Step collapse) tracks Mistral's MoE efficiency improvements as a proxy for inference cost trajectory. Aegis cost model recalibration should run after each Mistral release.

**Signal weight:** High | Scan cadence: Weekly

---

### 5. Scale AI

**Stated thesis:** Provide data infrastructure, RLHF pipelines, and evaluation services for frontier AI labs — including red-teaming, benchmark creation, and human feedback collection at scale.

**Key signals:**
- Scale SEAL leaderboard — https://scale.com/leaderboard
- Scale Red Team — https://scale.com/red-teaming
- RLHF at Scale — https://scale.com/rlhf

**Capability strengths:** Evaluation infrastructure, red-team protocol coverage, human feedback pipeline quality, benchmark construction.

**Governance gap:** Scale provides infrastructure for governance (evals, red teams) but not a governance runtime. No deployed enforcement layer, no proof chain. Customer-facing product only.

**A11oy implication:** Capability Bet 7 (Red-Teaming professionalizes into regulated industry) — Scale is building the supply-side infrastructure for this bet. A11oy's RedTeam module should align protocol definitions with Scale's published red-team taxonomy.

**Signal weight:** High | Scan cadence: Bi-weekly

---

### 6. Writer

**Stated thesis:** Enterprise AI platform for content generation and knowledge management with strong emphasis on structured output reliability, brand consistency, and enterprise governance controls.

**Key signals:**
- Writer enterprise governance — https://writer.com/blog/enterprise-ai-governance/
- Palmyra X benchmark — https://writer.com/research/

**Capability strengths:** Structured output reliability, enterprise brand controls, role-based content governance, audit logging for content.

**Governance gap:** Governance covers content generation, not agentic execution. No proof chain for multi-step agent actions. No HITL mandate for action execution. Business observability is limited to content workflows.

**A11oy implication:** Writer's enterprise governance approach is the closest analog for A11oy's structured output governance in the Fabric layer. Their audit logging model for content informs A11oy's Proof Ledger structure for content-adjacent domains.

**Signal weight:** Medium | Scan cadence: Monthly

---

### 7. LangChain / LangSmith

**Stated thesis:** Open-source framework for building LLM-powered applications, with LangSmith providing observability, tracing, and evaluation for LLM pipelines in production.

**Key signals:**
- LangSmith observability — https://smith.langchain.com
- LangGraph multi-agent — https://blog.langchain.dev/langgraph/

**Capability strengths:** Agent orchestration framework adoption, observability pipeline (LangSmith traces), evaluation utilities, multi-agent graph execution (LangGraph).

**Governance gap:** Observability without enforcement. LangSmith traces agent actions but cannot prevent policy-violating actions. No HITL mandate, no proof chain, no outcome verifier. Governance is the user's responsibility to add.

**A11oy implication:** LangChain framework adoption signals are a leading indicator for where the agent ecosystem is heading. LangSmith's tracing approach informs A11oy's Observability Layer design philosophy. Key difference: A11oy enforces governance; LangSmith observes it.

**Signal weight:** High | Scan cadence: Weekly

---

### 8. Weights & Biases (Wandb)

**Stated thesis:** ML observability and experiment tracking platform — extending to LLM monitoring, agent evaluation, and model deployment tracking.

**Key signals:**
- Weave LLM monitoring — https://wandb.ai/site/weave/
- W&B Prompts — https://docs.wandb.ai/guides/prompts

**Capability strengths:** Experiment tracking, model monitoring, LLM trace visualization, agentic pipeline debugging.

**Governance gap:** Monitoring without enforcement. W&B observes what agents do but cannot gate or verify outcomes. No HITL, no proof chain, no outcome verifier.

**A11oy implication:** W&B's tracing completeness is a benchmark for A11oy's agent monitoring depth. The gap — A11oy's approach adds enforcement and proof chains to the observability layer that W&B exposes.

**Signal weight:** Medium | Scan cadence: Monthly

---

### 9. Salesforce Einstein AI

**Stated thesis:** Embed AI into enterprise CRM workflows — automating sales motions, service resolution, and marketing optimization with natural-language interaction natively integrated into Salesforce products.

**Key signals:**
- Agentforce launch — https://www.salesforce.com/agentforce/
- Einstein Copilot — https://www.salesforce.com/products/einstein/einstein-copilot/

**Capability strengths:** CRM-native workflow completion, structured enterprise data grounding, no-code agent builder, Salesforce ecosystem integration breadth.

**Governance gap:** Governance is CRM-scoped only. No cross-domain governance layer, no proof chain across enterprise systems. HITL is optional (not structural). No outcome verifier independent of CRM state.

**A11oy implication:** Agentforce represents the most enterprise-deployed agentic system in production. Their workflow completion rates are a real-world benchmark for agent reliability at scale. Capability Bet 3 (Multi-Agent Trust) tracks Salesforce's multi-agent ambitions.

**Signal weight:** Medium-High | Scan cadence: Bi-weekly

---

### 10. Inflection AI / Pi (post-pivot)

**Stated thesis:** Originally: personal AI with emotional intelligence and long-horizon memory. Post-pivot (acquired by Microsoft): enterprise model API and Pi consumer product.

**Key signals:**
- Inflection Microsoft deal — https://www.inflection.ai/inflection-for-enterprises
- Pi personal AI — https://pi.ai

**Capability strengths:** Long-horizon conversational memory, emotional alignment in responses, user-personalized context retention.

**Governance gap:** Personal AI framing — no enterprise governance, no proof chain, no HITL structural requirement. Memory architecture is user-facing, not audit-compliant.

**A11oy implication:** Capability Bet 1 (Persistent Cross-Session Memory) tracks Inflection's memory architecture as a signal for how episodic memory will evolve. Their failure mode — memory without provenance — validates A11oy's Reliquary memory ledger approach.

**Signal weight:** Medium | Scan cadence: Monthly

---

### 11. xAI

**Stated thesis:** Build AI that maximally understands and advances our collective understanding of the universe — with a stated emphasis on "anti-woke" reasoning transparency and minimum guardrail overhead on the Grok model series.

**Key signals:**
- Grok model series (1, 1.5, 2, 3) — https://x.ai/blog
- Grok-3 benchmark results — https://x.ai/news/grok-3
- xAI API launch — https://x.ai/api

**Capability strengths:** Real-time web and X/Twitter data access (unique competitive moat), long-context reasoning, rapid iteration cycle, consumer-scale distribution via X platform.

**Governance gap:** Explicit deemphasis of safety guardrails as a design choice. No published constitutional AI or RSP equivalent. No HITL structural architecture. No proof chain or outcome verifier. Enterprise deployment governance is entirely operator-responsibility.

**A11oy implication:** xAI's governance-optional positioning is the clearest competitive foil for A11oy's thesis. When Grok is deployed in enterprise without a governance wrapper, it creates exactly the audit gap A11oy fills. Capability Bet 7 (Red-Teaming professionalizes) tracks xAI model red-team findings as a signal for unconstrained-deployment failure modes.

**Signal weight:** High | Scan cadence: Weekly

---

### 12. DeepSeek

**Stated thesis:** Produce frontier-capable open-weight models at dramatically lower training cost — demonstrating that efficiency-first research can match closed-lab frontier capability without proprietary compute scale.

**Key signals:**
- DeepSeek-R1 open-weight reasoning model — https://github.com/deepseek-ai/DeepSeek-R1
- DeepSeek-V3 technical report — https://arxiv.org/abs/2412.19437
- DeepSeek training cost disclosure — $6M for V3 training run

**Capability strengths:** Open-weight frontier capability (permissive license), breakthrough training efficiency, strong reasoning benchmark performance, sovereign AI enabler for MENA and Asian deployments.

**Governance gap:** Open-weight release without governance layer — any deployment operator carries full responsibility for alignment and behavioral constraints. No HITL architecture, no proof chain, no outcome verifier. Governance is entirely downstream.

**A11oy implication:** DeepSeek's open-weight models are the highest-priority signal for Capability Bet 5 (Cost-per-Reasoning-Step collapse) and Bet 9 (Sovereign AI). Regional operators in MENA who want to deploy locally without US cloud dependency will use DeepSeek — making A11oy's governance wrapper critically valuable for that deployment pattern.

**Signal weight:** Very High | Scan cadence: Weekly

---

### 13. Sierra AI

**Stated thesis:** Build enterprise-grade conversational AI agents for customer-facing workflows — with a strong emphasis on reliability, policy adherence, and brand-safe agent behavior at scale.

**Key signals:**
- Sierra platform launch — https://sierra.ai
- Sierra trust and safety architecture — https://sierra.ai/trust
- Enterprise agent deployments (AT&T, Sonos, WeightWatchers)

**Capability strengths:** Conversational agent reliability, brand-safe response policy, structured escalation to human agents, enterprise CX workflow integration, clear HITL escalation model.

**Governance gap:** Governance is customer-experience scoped — covers conversational safety and brand adherence, not multi-system agentic governance or proof chains for complex reasoning tasks. No cross-domain outcome verifier.

**A11oy implication:** Sierra is the closest competitor to A11oy's HITL and policy-adherence thesis for conversational agent surfaces. Their escalation model (agent → human in defined conditions) directly overlaps with A11oy's Approval Queue. Key difference: A11oy's governance extends beyond conversation into multi-step, multi-system agentic execution.

**Signal weight:** High | Scan cadence: Bi-weekly

---

### 14. Cursor (Anysphere)

**Stated thesis:** Build the AI-native code editor — where AI has deep codebase context, understands intent, and can execute multi-file changes autonomously — accelerating developer productivity without removing developer control.

**Key signals:**
- Cursor composer / agent mode — https://cursor.com
- Cursor Context Protocol adoption — https://cursor.com/blog
- ARR growth: $0 → $100M in 12 months (fastest SaaS in history per reports)

**Capability strengths:** IDE-native agentic code execution, deep repository context indexing, multi-file agent mode, developer trust through transparent diffs and explicit approve/reject on every action.

**Governance gap:** Governance is developer-facing only — accept/reject diffs at the code level. No enterprise-grade audit trail, no proof chain for reasoning steps, no cross-system governance layer for broader agentic execution. Not designed for non-developer enterprise workflows.

**A11oy implication:** Cursor's approve/reject model for agent code actions is the most successful HITL UX pattern in production. Their growth validates Capability Bet 11 (adaptive approval thresholds). A11oy's Approval Queue UX should learn from Cursor's developer-trust model. Lyte (A11oy's code agent) competes directly with Cursor's agent mode for developer mindshare.

**Signal weight:** High | Scan cadence: Weekly

---

### 15. Replit

**Stated thesis:** Make software creation accessible to everyone — using AI to scaffold, iterate, and deploy applications without requiring traditional programming expertise, through an AI-native collaborative IDE with one-click cloud deployment.

**Key signals:**
- Replit Agent (full-stack app generation) — https://replit.com/agent
- Replit Deployments — https://replit.com/deployments
- Replit Ghostwriter AI pair programmer

**Capability strengths:** End-to-end agentic software creation (code → deploy), large developer community, instant cloud environment provisioning, multi-language support, AI scaffolding for non-technical users.

**Governance gap:** Agentic code generation and deployment without enterprise governance layer. No proof chain for AI-generated code decisions, no HITL mandate for production deployments, no cross-system audit trail. The governance surface is the developer's review before deploy.

**A11oy implication:** Replit's agent deployment pattern (AI generates → human deploys) represents the most accessible version of HITL-adjacent software creation at scale. Their model of "AI does the work, human approves the result" is a consumer-grade precursor to A11oy's enterprise governance model. Capability Bet 11 (adaptive approval) and Lyte's agent surface both watch Replit's UX patterns closely.

**Signal weight:** Medium-High | Scan cadence: Bi-weekly

---

## Academic Voices

### Synthesis Format

For each voice: **affiliation, primary contribution, why we track, and A11oy-specific implication.**

---

### 1. Yoshua Bengio — MILA

**Why we track:** Broad AI risk framing with policy influence. Signatory of open letters on AI safety, advocate for international AI governance bodies.

**Primary contributions:** Deep learning foundations; more recently AI risk policy and international coordination.  
**Key public artifacts:** MILA blog — https://mila.quebec/en/article/yoshua-bengio-ai-safety/ | Montreal Declaration — https://montrealdeclaration-responsibleai.com

**A11oy implication:** Bengio's policy framing influences the regulatory landscape that Capability Bet 2 and Bet 7 depend on. When Bengio speaks at policy forums, regulatory timelines for mandatory evaluations accelerate.

---

### 2. Stuart Russell — UC Berkeley

**Why we track:** CIRL (Cooperative Inverse Reinforcement Learning) and corrigibility are foundational to A11oy's human-in-the-loop architecture.

**Primary contributions:** CIRL, corrigibility theory, Human Compatible AI.  
**Key public artifacts:** Human Compatible (book) | CIRL paper — https://arxiv.org/abs/1606.03137

**A11oy implication:** Russell's corrigibility framework directly informs the Constitution DSL's shutdown/override semantics. Capability Bet 6 (Constitutional Runtime) cites Russell's arguments for why training-time alignment is insufficient.

---

### 3. John Schulman — Independent (former OpenAI)

**Why we track:** PPO and RLHF are the foundation of every fine-tuned model in production. Understanding RLHF limits is essential for knowing where training-time alignment fails.

**Primary contributions:** PPO algorithm, RLHF pipeline design, OpenAI Five.  
**Key public artifacts:** PPO paper — https://arxiv.org/abs/1707.06347 | RLHF overview — https://huggingface.co/blog/rlhf

**A11oy implication:** RLHF failure modes (reward hacking, specification gaming) are the primary motivation for A11oy's runtime enforcement layer. Bet 8 (Reward Hacking) directly inverts Schulman's work.

---

### 4. Ilya Sutskever — SSI (Safe Superintelligence)

**Why we track:** Scalability laws, emergent capability understanding, and now direct focus on safe superintelligence — the most credible technical voice on what frontier capability emergence looks like.

**Primary contributions:** AlexNet, sequence-to-sequence, scaling laws, GPT-series, SSI founding.  
**Key public artifacts:** SSI announcement — https://ssi.inc | Scaling laws — https://arxiv.org/abs/2001.08361

**A11oy implication:** Sutskever's thesis at SSI (safety-first from day one, not retrofitted) validates A11oy's architecture choice to build governance into the kernel, not add it as a wrapper. Capability Bet 6 tracks SSI's approach.

---

### 5. Max Tegmark — MIT FLI

**Why we track:** Existential risk framing and AI pause advocacy influence policy timelines relevant to Bets 2 and 7. FLI publishes model evals and governance proposals that shape regulatory discourse.

**Primary contributions:** Life 3.0, FLI AI Safety initiative, open letter on AI pause.  
**Key public artifacts:** FLI — https://futureoflife.org | Life 3.0 (book)

**A11oy implication:** FLI's regulatory push accelerates the timeline for mandatory pre-deployment evaluations (Bet 2). A11oy's MirrorEval positioning as "the responsible evaluation layer" is consistent with FLI's compliance framing.

---

### 6. Yann LeCun — Meta FAIR

**Why we track:** Adversarial signal. LeCun is the most credible critique of LLM-centric agentic AI — his arguments for world-model-based agents are a useful stress test of A11oy's architecture assumptions.

**Primary contributions:** CNNs, JEPA (Joint Embedding Predictive Architectures), Meta AI leadership.  
**Key public artifacts:** A Path Towards Autonomous Machine Intelligence — https://openreview.net/pdf?id=BZ5a1r-kVsf

**A11oy implication:** LeCun's critique that autoregressive LLMs cannot be trusted for planning informs A11oy's Verifier Agent design — if LLMs cannot self-verify plans, an independent verification layer is mandatory. His arguments strengthen A11oy's governance-layer thesis.

---

### 7. Percy Liang — Stanford CRFM

**Why we track:** HELM benchmark methodology and independence-from-vendors principle sets the gold standard for rigorous capability evaluation.

**Primary contributions:** HELM, CRFM leadership, foundation model societal impact research.  
**Key public artifacts:** HELM — https://crfm.stanford.edu/helm/ | Foundation Models report — https://arxiv.org/abs/2108.07258

**A11oy implication:** MirrorEval adopts HELM's independence philosophy. Capability Bet 12 (Benchmark Arbitrage) directly cites HELM as the trust signal when proprietary benchmarks become suspect.

---

### 8. Lilian Weng — OpenAI (research blog)

**Why we track:** Weng's survey posts on agent architecture, memory, tool use, and planning are the highest-signal synthesis in the field — read by every serious agent team.

**Primary contributions:** LLM Agents survey, Planning/Memory/Tools taxonomy, Agent overview posts.  
**Key public artifacts:** LLM Powered Autonomous Agents — https://lilianweng.github.io/posts/2023-06-23-agent/ | Prompt Engineering — https://lilianweng.github.io/posts/2023-03-15-prompt-engineering/

**A11oy implication:** Weng's agent taxonomy (memory types, tool invocation, planning loops) is the reference architecture against which A11oy's Fabric maps each circuit type. Her posts surface capability gaps in the agent ecosystem that feed the Signal Feed directly.

---

### 9. Dario Amodei — Anthropic

**Why we track:** Operational proof that safety-focused AI can be commercially viable. Amodei's published views on responsible scaling inform the regulatory framing A11oy operates within.

**Primary contributions:** Anthropic co-founder, responsible scaling policy (RSP), Constitutional AI stewardship.  
**Key public artifacts:** RSP — https://www.anthropic.com/news/anthropics-responsible-scaling-policy | Machines of Loving Grace — https://darioamodei.com/machines-of-loving-grace

**A11oy implication:** RSP's compute threshold commitments and evaluation gates are a model for A11oy's own capability gate process. The Responsible Scaling Policy's framing of "evaluate before deploy" is the intellectual ancestor of A11oy's human-gated Capability Proposals queue.

---

### 10. Paul Christiano — ARC (Alignment Research Center)

**Why we track:** Scalable oversight, debate alignment, and ARC's evaluation suites (ARC Evals, now METR) are directly referenced in regulatory frameworks.

**Primary contributions:** Scalable oversight theory, debate alignment, ARC Evals, METR.  
**Key public artifacts:** Scalable oversight — https://ai-alignment.com/training-robust-corrigibility-ce0e0a3b9b6d | ARC/METR — https://metr.org

**A11oy implication:** Christiano's scalable oversight framework is the theoretical basis for A11oy's Covenant Layer. METR (which grew from ARC Evals) is cited as the primary third-party evaluation partner in Capability Bet 2.

---

### 11. Richard Sutton — University of Alberta / Google DeepMind

**Why we track:** Sutton is the intellectual father of reinforcement learning and author of "The Bitter Lesson" — the single most cited argument for why scaling compute beats human-designed inductive biases. His framing directly shapes how the field thinks about agent capability ceilings.

**Primary contributions:** Q-learning, temporal difference learning, Actor-Critic methods, policy gradient theorem, The Bitter Lesson (2019 essay).  
**Key public artifacts:** Reinforcement Learning: An Introduction (Sutton & Barto) — http://incompleteideas.net/book/the-book-2nd.html | The Bitter Lesson — http://www.incompleteideas.net/IncIdeas/BitterLesson.html

**A11oy implication:** The Bitter Lesson's argument that compute-scaling beats human-crafted structure is the core argument against rule-based governance systems. A11oy's answer: governance is not a rule system, it is a constraint layer that scales with model capability. Capability Bet 8 (Reward Hacking) is directly grounded in Sutton's RL failure taxonomy. A11oy's Reward Hacking module reads as the enterprise application of Sutton's research agenda.

**Signal weight:** High | Scan cadence: Monthly

---

### 12. Geoffrey Hinton — University of Toronto / independent

**Why we track:** Hinton's departure from Google in 2023 specifically to speak freely about AI existential risk is the highest-signal academic endorsement of the "AI safety must be solved before deployment" thesis that underlies A11oy's entire market positioning.

**Primary contributions:** Backpropagation, CNNs (with LeCun), capsule networks, Boltzmann machines, Hopfield networks (co-winner Nobel Prize in Physics 2024).  
**Key public artifacts:** Nobel lecture — https://www.nobelprize.org/prizes/physics/2024/hinton/lecture/ | AI safety concerns — https://www.geoffreyhinton.com

**A11oy implication:** Hinton's public warning that AI systems may soon exceed human control is the strongest external validation of A11oy's governance-first thesis. His Nobel Physics Prize in 2024 for neural network foundations gives his safety warnings institutional credibility that accelerates the regulatory timeline for Bets 2 and 7. A11oy's marketing team should track Hinton's public statements as leading indicators of regulatory mood.

**Signal weight:** Very High | Scan cadence: Monthly

---

### 13. Andrej Karpathy — independent (former Tesla, OpenAI)

**Why we track:** Karpathy is the most trusted educator and practical commentator on LLM architecture and agent systems. His tutorials (micrograd, nanoGPT, llm.c) define the ground-truth understanding of model internals for an entire generation of practitioners. His public takes on AI capability trajectories carry outsized influence.

**Primary contributions:** Tesla Autopilot end-to-end neural architecture, OpenAI multimodal research, micrograd/nanoGPT educational series, "Software 2.0" essay.  
**Key public artifacts:** micrograd — https://github.com/karpathy/micrograd | nanoGPT — https://github.com/karpathy/nanoGPT | Software 2.0 — https://karpathy.medium.com/software-2-0-a64152b37c35 | Let's build GPT — https://youtube.com/@AndrejKarpathy

**A11oy implication:** Karpathy's "Software 2.0" thesis (neural networks replace hand-coded logic) is the canonical framing of why traditional software governance fails for AI systems — the exact problem A11oy solves. His practitioner-level explanations of LLM behavior are the lens through which A11oy's engineering team should calibrate capability expectations. When Karpathy publishes on agent architectures, it directly informs Signal Feed priorities for the GitHub and arXiv scanners.

**Signal weight:** High | Scan cadence: Bi-weekly

---

### 14. Oxford Future of Humanity Institute (FHI) / Effective Altruism AI Safety

**Why we track:** FHI (now dissolved, with researchers distributing to ARC, MIRI, and Oxford's Institute for Ethics in AI) produced the foundational texts on AI existential risk, decision theory under uncertainty, and long-horizon safety. Their work underpins the entire AI safety policy discourse.

**Primary contributions:** Superintelligence (Nick Bostrom), orthogonality thesis, instrumental convergence thesis, x-risk framing, Global Priorities Institute decision theory.  
**Key public artifacts:** Superintelligence (book, Bostrom) | FHI research archive — https://www.fhi.ox.ac.uk/research/ | Oxford Institute for Ethics in AI — https://www.oxford-aiethics.ox.ac.uk | Global Priorities Institute — https://globalprioritiesinstitute.org

**A11oy implication:** FHI's orthogonality thesis (any level of intelligence can be combined with any goal) is the theoretical basis for A11oy's position that capability scaling without governance is structurally dangerous. The instrumental convergence thesis (advanced AI systems will pursue resource acquisition and self-preservation regardless of stated goals) validates A11oy's Covenant Layer as a necessary external constraint, not a polite suggestion. Capability Bet 6 (Constitutional Runtime as acquisition target) references FHI's long-term safety framing as the intellectual context for why governed AI will command a valuation premium.

**Signal weight:** Very High | Scan cadence: Monthly

---

### 15. Demis Hassabis — Google DeepMind

**Why we track:** Hassabis is the co-founder and CEO of Google DeepMind and the most consequential practitioner-researcher in the field. His team's work spans AlphaFold (protein structure), AlphaCode (software synthesis), Gemini (multimodal foundation models), and AlphaGeometry (formal reasoning). His 2024 Nobel Prize in Chemistry for AlphaFold marks the first time an AI system has been directly credited with a scientific Nobel — a watershed moment for AI-as-science.

**Primary contributions:** DeepMind (co-founder, CEO), AlphaGo/AlphaZero (self-play RL for strategic games), AlphaFold/AlphaFold2 (protein structure prediction — Nobel Chemistry 2024), Gemini (multimodal foundation model), AlphaCode (competitive programming), AlphaGeometry (IMO-level geometry proofs without symbolic guidance).  
**Key public artifacts:** AlphaFold paper — https://www.nature.com/articles/s41586-021-03819-2 | Nobel lecture — https://www.nobelprize.org/prizes/chemistry/2024/hassabis/lecture/ | DeepMind research blog — https://deepmind.google/research | Gemini technical report — https://arxiv.org/abs/2312.11805

**Core doctrine:** Hassabis holds that AGI will be achieved through a synthesis of deep learning with planning and model-based reasoning — the approach embodied by AlphaGo's Monte Carlo tree search + RL and AlphaFold's structure + energy minimization. He is critical of pure scaling arguments (contra Sutton's Bitter Lesson) and argues that human-like reasoning requires explicit world-models. His public framing of AlphaFold as evidence that AI can do "real science" (not just pattern matching) sets the benchmark for what "capable AI" means at the highest institutional level.

**Capability gaps exposed:** AlphaCode's performance on competitive programming (sig-008 context) sets a ceiling for what "frontier coding ability" means. AlphaGeometry's IMO-level proof synthesis reveals that formal reasoning without symbolic scaffolding is within reach — a direct signal for how A11oy's Verifier Agent should be designed. Gemini's multimodal native video understanding (sig-011 context) is the reference architecture for real-time camera-feed analysis in Aegis and Vessels.

**A11oy implication:** Hassabis's work demonstrates that A11oy's multi-modal and reasoning-agent assumptions are sound, but that the ceiling of capability is higher than current portfolio agents achieve. AlphaFold's Nobel Prize win is also the single most powerful institutional argument that AI can produce verifiable, high-stakes scientific outputs — the governance implication being that verifiable AI (proof chains, auditable reasoning) is not just a regulatory nicety but the condition of trust at the scientific frontier. This strengthens Capability Bet 3 (Verifiable AI as standard) and Bet 7 (Mandatory evaluations accelerate).

**Signal weight:** Very High | Scan cadence: Monthly

---

## Disclosure Norms

A11oy's Frontier Intelligence layer adheres to the following disclosure norms:

1. **Attribution required.** Every signal ingested must carry a source URL, scanner ID, and confidence score. No signal may circulate in the product without provenance.
2. **No anonymous vendor denigration.** Competitor analysis appears only in `ResearchCitationPanel` components within the Frontier section, never in product marketing copy. Main-UI visualizations use lane labels, not competitor names.
3. **Claims must be verifiable.** Any capability claim surfaced to the queue must link to at least one primary source (paper, press release, or regulatory filing) with a URL.
4. **Human gate on all proposals.** No capability proposal may be promoted to a project task without explicit human approval via the Capability Proposals queue. The system cannot self-promote. Rejection and snooze require a reason that persists in the queue log.
5. **Temporal decay enforced.** Signals older than 90 days are automatically tagged `stale` unless refreshed by a new corroborating source within the 90-day window.
6. **Dual-use red flag.** Any signal touching dual-use capability (autonomous weapons, deepfake generation, biometric surveillance) is auto-tagged `dual-use` and routed to the Constitution review queue before appearing in the feed.
7. **Benchmark humility.** SOTA citations include the benchmark date and model version. Leaderboard positions shift; the system uses delta trends (Δ vs SOTA) rather than absolute ranks.

---

## Capability Bets — 18–36 Month Horizon

Formal capability bets: research-backed hypotheses about capabilities that will become table stakes for governed agentic AI within 18–36 months.

### Bet 1 — Persistent Cross-Session Memory Will Become Standard

**Thesis:** Long-horizon agents will require episodic memory that survives session boundaries. Vector-only retrieval is insufficient; structured memory graphs with provenance chains will be required for governance-compliant deployments.

**Evidence signals:** MemGPT (Letta) — https://memgpt.ai | OpenAI Memory API — https://openai.com/blog/memory-and-new-controls-for-chatgpt | Anthropic Projects memory | Stanford MemBench

**A11oy position:** Reliquary memory architecture with provenance ledger covers this.  
**Gap:** Cross-agent memory sharing protocol is not yet standardized.  
**Target surfaces:** Reliquary, Fabric Memory circuit, Agent Identity Registry

---

### Bet 2 — Formal Agent Evaluation Frameworks Will Be Mandated

**Thesis:** Regulatory bodies (EU AI Act, NIST AI RMF, UK AISI) will require structured evaluation protocols for agentic systems before enterprise deployment. Self-reported evals will not satisfy compliance requirements.

**Evidence signals:** EU AI Act Article 9 — https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689 | NIST AI RMF 2.0 — https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf | METR eval suites — https://metr.org

**A11oy position:** MirrorEval + Constitution DSL directly addresses this.  
**Gap:** Formal certification pathway with third-party attestation not yet operational.  
**Target surfaces:** MirrorEval, Glasswing Attestation, Covenant Layer

---

### Bet 3 — Multi-Agent Trust Protocols Will Supersede Single-Agent Capability

**Thesis:** The bottleneck shifts from "what can a single model do?" to "how do multiple specialized agents coordinate with verified identity, auditable delegation chains, and conflict resolution?"

**Evidence signals:** Google A2A protocol — https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/ | Anthropic MCP — https://modelcontextprotocol.io | AgentBench multi-agent tracks — https://llmbench.ai/agent

**A11oy position:** A2A Interop, Agent Identity Registry, and Delegation Chain are live.  
**Gap:** External A2A interoperability with non-A11oy agents under real adversarial conditions.  
**Target surfaces:** Agent Identity Registry, A2A Bridge, Delegation Chain Fabric circuit

---

### Bet 4 — Embodied & Spatial Reasoning Will Enter Enterprise AI

**Thesis:** Physical-world reasoning will migrate from research labs into enterprise infrastructure — initially warehouse/logistics, then healthcare and defense.

**Evidence signals:** ManipArena benchmark — https://arxiv.org/abs/2405.manip | Figure AI — https://figure.ai | Physical Intelligence (π) — https://physicalintelligence.company | RT-2 — https://arxiv.org/abs/2307.15818

**A11oy position:** No embodied module exists. Monitoring only.  
**Gap:** Entire embodied execution surface — no IoT/edge agent routing in Fabric yet.  
**Target surfaces:** Fabric IoT routing layer (future), Sensory Input circuit (proposed)

---

### Bet 5 — Cost-per-Reasoning-Step Will Collapse

**Thesis:** MoE architectures, speculative decoding, and next-gen memory bandwidth will reduce cost-per-reasoning-step by 10× within 24 months, changing the economics of deep multi-hop governance checks.

**Evidence signals:** NVIDIA Vera Rubin — https://nvidianews.nvidia.com/news/vera-rubin | Groq LPU — https://groq.com/speed/ | Mistral MoE papers — https://arxiv.org/abs/2401.04088 | Weaver memory-bandwidth — https://arxiv.org/abs/2405.weaver

**A11oy position:** Aegis cost models need recalibration. FlexCache Runtime positioned for inference cost arbitrage.  
**Gap:** Cost model update pipeline not yet automated from benchmark deltas.  
**Target surfaces:** Aegis Cost Model, FlexCache Runtime, Benchmark Scoreboard delta feed

---

### Bet 6 — Constitutional Runtime Will Be an Acquisition Target

**Thesis:** Companies that have solved runtime behavioral enforcement (not just training-time alignment) will be acquisition targets for foundation model labs seeking enterprise credibility.

**Evidence signals:** Google acqui-hire of Character.AI infrastructure | Inflection pivot to Microsoft | Cohere enterprise push — https://cohere.com/blog/enterprise-ai

**A11oy position:** Constitution DSL + Glasswing attestation is core differentiation.  
**Gap:** Third-party certification pathway not yet established.  
**Target surfaces:** Constitution DSL, Glasswing Attestation, Covenant Layer

---

### Bet 7 — Red-Teaming Will Professionalize Into a Regulated Industry

**Thesis:** AI red-teaming shifts from ad hoc bounty programs to structured, regulated professional services — similar to penetration testing in cybersecurity.

**Evidence signals:** AISI DSIT red-team exercises — https://www.gov.uk/government/organisations/ai-safety-institute | OpenAI Red Team Network — https://openai.com/safety/red-teaming-network | NIST AI 100-1 — https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf

**A11oy position:** RedTeam module active.  
**Gap:** Formal certification pathway and third-party red-team partner network not established.  
**Target surfaces:** RedTeam module, Glasswing Attestation, Constitution Review Queue

---

### Bet 8 — Reward Hacking Mitigation Will Become a Board-Level Concern

**Thesis:** As agents operate in high-stakes domains, reward hacking will cause publicized failures. Boards will demand explicit reward-hacking audit trails.

**Evidence signals:** DeepMind reward-tampering research — https://arxiv.org/abs/1908.04734 | ARC eval suite — https://metr.org | Constitutional AI ablation studies — https://arxiv.org/abs/2212.08073

**A11oy position:** Reward Hacking module + Behavioral Audit pipeline address this.  
**Gap:** Real-time reward-hack detection is latency-sensitive and not production-hardened.  
**Target surfaces:** Reward Hacking module, Behavioral Audit, Proof Ledger

---

### Bet 9 — Sovereign AI Will Fragment the Model Supply Chain

**Thesis:** Nation-state AI sovereignty requirements will mandate domestic model hosting, local fine-tuning, and data residency. Global enterprises will require multi-sovereign AI stacks.

**Evidence signals:** EU AI Act data governance — https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689 | India DPDP Act — https://digitalindia.gov.in/dpdp | Saudi SDAIA — https://sdaia.gov.sa | Singapore PDPC — https://www.pdpc.gov.sg

**A11oy position:** Sovereign mode operational. FlexCache Runtime supports regional inference routing.  
**Gap:** Formal data residency attestation not yet exportable as a compliance artifact.  
**Target surfaces:** Sovereign Mode, FlexCache Runtime, Glasswing Attestation (residency extension)

---

### Bet 10 — Proof-of-Reasoning Chains Will Become Contractual Obligations

**Thesis:** Enterprise SLAs and legal contracts will require cryptographically signed reasoning chains as evidence of due diligence in AI-assisted decisions — particularly in legal, financial, and healthcare verticals.

**Evidence signals:** EU AI Act Article 13 (transparency) — https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689 | UK AI Liability Working Group | ISO/IEC 42001 — https://www.iso.org/standard/81230.html

**A11oy position:** Proof Ledger + Snapshot Provenance are core infrastructure.  
**Gap:** Cryptographic signing of reasoning chains not yet implemented end-to-end.  
**Target surfaces:** Proof Ledger, Snapshot Provenance, Glasswing Attestation

---

### Bet 11 — Human-in-the-Loop Fatigue Will Drive Adaptive Approval Thresholds

**Thesis:** Blanket human review will fail at scale. Systems will evolve adaptive, risk-tiered approval workflows — routing only novel or high-stakes decisions to humans.

**Evidence signals:** MIT human-AI teaming research — https://hci.mit.edu | IBM Watson governance studies | HITL fatigue literature — https://arxiv.org/search/?searchtype=all&query=human+in+the+loop+fatigue

**A11oy position:** Approval Queue + Constitution DSL already supports risk-tiered routing.  
**Gap:** Adaptive threshold calibration based on operator historical override patterns.  
**Target surfaces:** Approval Queue, Constitution DSL adaptive routing, Self-Optimization module

---

### Bet 12 — Benchmark Arbitrage Will Drive Deceptive Capability Claims

**Thesis:** As benchmarks mature, frontier labs will over-optimize for leaderboard performance while real-world capability lags. Independent third-party evals will become the only trusted signal.

**Evidence signals:** Stanford CRFM HELM — https://crfm.stanford.edu/helm/ | METR independent evaluations — https://metr.org | BigBench Hard — https://arxiv.org/abs/2206.04615 | LiveBench — https://livebench.ai

**A11oy position:** MirrorEval uses internal test suites independent of vendor-controlled benchmarks.  
**Gap:** Integration with METR / HELM external evaluation pipelines not yet live.  
**Target surfaces:** MirrorEval, Benchmark Scoreboard, Frontier Signal Feed (benchmark scanner)

---

## Past the Final Frontier

> Proposal-ready capability bets beyond the current 18-month horizon. Each entry follows the
> required schema: **Problem · Evidence · Proposed Capability · Target Surface · Success Signal**.
> These are tracked in Helios and eligible for promotion to the active Capability Bets register
> once supporting signals reach confidence ≥ 0.85.

---

### PFF-01 — Real-Time Proof Chain Signing at the Reasoning Step

**Problem:** Proof Chains currently capture approval events, not the intermediate reasoning steps that led to a recommendation. Adversarial inputs can corrupt the reasoning path without leaving a trace in the audit ledger.

**Evidence:** DeepMind reward-tampering taxonomy (arXiv:1908.04734) identifies reasoning-path corruption as a primary attack vector. EU AI Act Article 13 transparency provisions will require step-level explainability in high-risk deployments by 2027.

**Proposed Capability:** Extend the Proof Ledger to sign each CoT (chain-of-thought) reasoning step with a deterministic hash, creating a tamper-evident reasoning trace alongside the existing approval event log.

**Target Surface:** Proof Ledger, Covenant Layer, Glasswing Attestation

**Success Signal:** ≥95% of high-stakes decisions include a signed reasoning trace; at least one enterprise client cites this as a regulatory compliance differentiator in their procurement evaluation.

---

### PFF-02 — Adaptive Covenant DSL with Live Policy Mutation

**Problem:** The current Covenant DSL is static at deployment time; policy changes require a full redeploy cycle, creating a governance lag during fast-moving threat or regulatory events.

**Evidence:** NIST AI RMF 2.0 Govern function requires "living policies" that can respond to emerging risk without system downtime. SWE-bench long-horizon results show agents operating over multi-day sessions where static policies become stale.

**Proposed Capability:** Build a hot-reload mechanism for Covenant policies that allows authorized operators to push policy updates without restarting the agent runtime, with each mutation cryptographically signed and logged to the Proof Ledger.

**Target Surface:** Covenant Layer, Constitution DSL, Proof Ledger, Approval Queue

**Success Signal:** Policy update round-trip (draft → approval → live) under 60 seconds; zero agent restart required; mutation events fully auditable in Glasswing.

---

### PFF-03 — Cross-Agent Trust Protocol for Multi-Workcell Workflows

**Problem:** A11oy's Workcells currently operate in isolation; when one agent delegates to another, the receiving agent has no cryptographic assurance of the delegating agent's identity or authorization scope.

**Evidence:** CMU LTI multi-agent coordination benchmarks show 30%+ failure rates on cross-agent handoff tasks due to trust ambiguity. OECD AI Principles require traceability of AI decisions across system components.

**Proposed Capability:** Implement an OIDC-attested agent identity handshake protocol: each Workcell delegation carries a signed capability token specifying the delegating agent's identity, scope, and expiry, verified by the receiving Workcell before execution.

**Target Surface:** Agent Identity Registry, Covenant Layer, Workcell Execution, Proof Ledger

**Success Signal:** All cross-Workcell delegations carry a verifiable capability token; zero cross-agent impersonation in red-team exercises; token chain auditable end-to-end in Glasswing.

---

### PFF-04 — Sovereign Data Residency Attestation as Exportable Compliance Artifact

**Problem:** Enterprise clients in regulated jurisdictions (EU, Saudi Arabia, UAE) need proof that their data never left a specific geographic region, but A11oy currently cannot produce a machine-readable attestation artifact for auditors.

**Evidence:** EU AI Act Article 10 data governance requirements; Saudi NDMO data localisation mandate; UAE Federal Data Law Article 8. IMO autonomous vessel framework (expected Q3 2026) will add maritime data sovereignty requirements.

**Proposed Capability:** Generate a signed, machine-readable Data Residency Attestation (DRA) for each agent session, certifying which geographic region processed the data, validated against the Covenant policy governing that operator's deployment.

**Target Surface:** Sovereign Mode, Glasswing Attestation, FlexCache Runtime, Covenant Layer

**Success Signal:** DRA artifact accepted by at least one regulatory auditor as evidence of data residency compliance; reduces enterprise procurement cycle by ≥2 weeks for regulated-market clients.

---

### PFF-05 — Outcome Verifier with Causal Attribution

**Problem:** A11oy's current Outcome Verifier checks whether execution results meet a threshold, but cannot attribute a failure to a specific upstream decision, model choice, or policy constraint — making root-cause analysis manual and slow.

**Evidence:** ARC Evals scalable oversight research identifies attribution as the hardest unsolved problem in agentic oversight. Enterprise post-incident reviews average 4+ hours for agentic failures due to missing causal chains.

**Proposed Capability:** Build a causal attribution layer on top of the Outcome Verifier that traces a failed outcome back to the specific reasoning step, model call, or policy constraint that caused it, presented as a ranked causal tree in the Glasswing audit view.

**Target Surface:** Outcome Verifier, Proof Ledger, Glasswing Attestation, Workcell Execution

**Success Signal:** Post-incident causal trace available in under 5 minutes for ≥90% of agentic failures; at least one client reduces operational incident cost by ≥30% citing causal attribution reports.

---

### PFF-06 — Benchmark-Independent Internal Evaluation Pipeline (MirrorEval v2)

**Problem:** MirrorEval currently relies on static internal test suites. As frontier models overfit to public leaderboards, internal evals must continuously evolve to avoid the same contamination pattern.

**Evidence:** Stanford CRFM HELM contamination analysis shows benchmark-specific fine-tuning inflating scores by 12–18 percentage points. LiveBench anti-contamination methodology (livebench.ai) demonstrates that fresh-question generation is the only reliable defense.

**Proposed Capability:** Build a continuous-generation eval pipeline that produces novel test cases weekly from production failure logs and red-team findings, ensuring MirrorEval questions are never in any model's training distribution.

**Target Surface:** MirrorEval, Benchmark Scoreboard, Frontier Signal Feed, eval-forge

**Success Signal:** MirrorEval question novelty score ≥0.95 (measured by embedding distance from public benchmarks); capability regression detected ≥2 weeks before public benchmark reflects it.

---

### PFF-07 — Agentic Long-Context Memory with Proof-Chain Anchoring

**Problem:** Long-running agentic sessions (multi-day legal research, extended vessel monitoring) require persistent memory, but current memory systems are unaudited — any memory write or retrieval is invisible to the Proof Chain.

**Evidence:** GAIA-2 128k-token task evaluation shows 22% failure rate attributable to uncontrolled memory writes corrupting session state. ISO/IEC 42001 AI management system standard requires traceability of all system state changes.

**Proposed Capability:** Implement an audited agent memory store where every write, update, and retrieval is logged to the Proof Ledger with a signed timestamp, enabling full reconstruction of any agent's memory state at any historical point.

**Target Surface:** Workcell Execution, Proof Ledger, Covenant Layer, Counsel and Sentra surfaces

**Success Signal:** 100% of memory operations in audited sessions traceable to a Proof Ledger entry; long-context task success rate on GAIA-2 analogues improves by ≥15% due to verifiable memory consistency.

---

### PFF-08 — Embodied AI Governance Layer for Physical-World Agents

**Problem:** As AI agents begin operating physical hardware (robotic arms, autonomous vessels, smart building systems), A11oy's governance layer has no semantics for physical-world action constraints — risk thresholds, irreversibility warnings, and physical-domain HITL gates do not exist.

**Evidence:** ManipArena benchmark shows 60%+ failure rate on spatial reasoning tasks for current SOTA agents, implying high real-world risk. IMO autonomous vessel regulatory framework (Q3 2026) will mandate human oversight gates for vessel control actions.

**Proposed Capability:** Extend the Covenant Layer with Physical Action Constraints (PAC) — a domain-specific policy DSL that maps physical-world actions to reversibility scores and risk tiers, triggering mandatory HITL review for any action above a configurable irreversibility threshold.

**Target Surface:** Covenant Layer, Constitution DSL, Approval Queue, Vessels and Sentra surfaces

**Success Signal:** PAC policy blocks ≥99% of irreversible physical actions during red-team exercises; Vessels compliance module achieves pre-certification review from one maritime authority.

---

### PFF-09 — Federated Proof Chain for Multi-Operator Deployments

**Problem:** Enterprise consortia (e.g., a legal firm consortium sharing A11oy infrastructure) need proof chains that span multiple operator tenants without any single operator seeing another's data — a privacy-preserving audit requirement that current architecture cannot satisfy.

**Evidence:** EU AI Act Article 28b multi-actor accountability provisions; W3C Verifiable Credentials standard; ISO/IEC 27001 multi-tenancy requirements for SaaS AI systems.

**Proposed Capability:** Implement a federated proof chain protocol using zero-knowledge commitments: each operator's events are committed to a shared ledger as ZK-proofs, allowing cross-operator auditing of aggregate system behavior without exposing individual event data.

**Target Surface:** Proof Ledger, Glasswing Attestation, Covenant Layer, Agent Identity Registry

**Success Signal:** Two or more tenants can jointly verify aggregate system compliance without raw event sharing; ZK-proof verification passes independent cryptographic audit; regulatory sandbox accepted as valid multi-operator evidence.

---

### PFF-10 — Adaptive Red-Team Harness with Adversarial Signal Feedback

**Problem:** A11oy's red-team module runs scheduled exercises but does not learn from production incidents — adversarial inputs discovered in the wild are not automatically incorporated into the next red-team cycle.

**Evidence:** AISI DSIT AI Safety Institute red-team protocol requires continuous improvement cycles tied to real incident data. NIST AI RMF 2.0 MAP function mandates feedback loops between operational monitoring and adversarial testing.

**Proposed Capability:** Build a closed-loop red-team harness that automatically converts production anomalies flagged by the Outcome Verifier into new adversarial test cases, enriching the RedTeam module's attack corpus weekly with real-world failure signatures.

**Target Surface:** RedTeam module, Outcome Verifier, Behavioral Audit, Frontier Signal Feed

**Success Signal:** RedTeam attack corpus grows by ≥20 new cases per month from production feedback; mean time to detect a new attack pattern drops from weeks to ≤72 hours after first production occurrence.

---

## Expanded Idea Registry — Q2 2026 Additions

Three ideas added to the shared frontier-mythos package (`@szl-holdings/frontier-mythos`) to align the
Helios API enrichment keyspace with the MythosIndex UI. These complete the taxonomy of nodes that carry
live signal counts from the scanner feed.

- **`idea-embodied-ai`** — Embodied AI. AI systems that perceive and act in physical or simulated 3D
  environments through closed sensorimotor loops. Tracked signal surface: ManipArena spatial-reasoning
  failure rate, robotics platform adoption, physical-world agentic governance requirements.

- **`idea-next-gen-gpu`** — Next-Gen GPU Architecture. Advanced data-center GPU designs with high-bandwidth
  memory hierarchies and native multi-agent inference support. Tracked signal surface: hardware cost curves,
  MoE inference pricing, Aegis compute budget model accuracy.

- **`idea-sovereign-ai`** — Sovereign AI. National and regional strategies mandating domestic AI infrastructure
  and data residency. Tracked signal surface: MENA/EU procurement requirements, data residency attestation
  regulatory gates, Sovereign Mode client pipeline signals.

---

## Research Sweep — Cross-links

- `docs/a11oy/MYTHOS_RESEARCH_SWEEP.md` — Behavioral audit, adversarial robustness, constitutional runtime sweep  
- `docs/a11oy/A11OY_PUBLIC_CLAIMS_DOCTRINE.md` — Public claims governance and evidence requirements

---

## Maintenance Schedule

| Cadence | Action |
|---------|--------|
| Weekly | Scanner runs refresh the signal feed; top signals reviewed for proposal eligibility |
| Monthly | Capability bets reviewed against new signal evidence; priority and gap status updated |
| Quarterly | Full doctrine review; retired bets archived with evidence summary; new bets proposed |
| Annually | External red-team review of the doctrine itself |

---

*This document is internal research doctrine. It exists to inform product strategy and capability bet tracking. All external claims must comply with `A11OY_PUBLIC_CLAIMS_DOCTRINE.md`. Competitor names and vendor assessments in this document are A11oy's own internal views based on publicly available information.*
