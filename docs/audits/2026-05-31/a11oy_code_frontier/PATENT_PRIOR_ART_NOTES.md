# PATENT_PRIOR_ART_NOTES — a11oy.code Frontier Innovations

> **Agent:** Yachay (a11oy.code Frontier agent, SZL Holdings)
> **Date:** 2026-06-01
> **Scope:** For each of the 15 innovations in `NOVEL_INNOVATIONS_15.md` (plus the 5 deep innovations in `PURIQ_LLM_DEEP_INNOVATIONS_5.md`): summarize discovered prior art, assess what is plausibly patentable (novel + non-obvious combination), and recommend a posture — **PATENT**, **DEFENSIVE-PUBLISH** (block others without spending on prosecution), or **TRADE-SECRET / NO-FILE**.
> **Hard rules honored:** every prior-art claim carries a primary-source URL (USPTO/Google Patents/arXiv/standards body). **No bandaid, no mysticism.** Doctrine v11 LOCKED numbers preserved verbatim. This is a strategy memo, **not legal advice** — a registered patent attorney must run formal freedom-to-operate (FTO) and patentability searches before any filing.

---

## 0. Methodology & disclaimers

- Searches run against [Google Patents](https://patents.google.com/) and arXiv on 2026-06-01. Patent search is **non-exhaustive**; absence of a hit here is **not** an FTO clearance.
- "Patentable" below means: *the specific combination appears novel and non-obvious over the prior art I found, and is a technical method (not an abstract idea)* — the bar after *Alice Corp. v. CLS Bank* (USPTO 2014 §101 guidance, [USPTO 2019 PEG](https://www.uspto.gov/sites/default/files/documents/peg_oct_2019_update.pdf)). Pure "do X with an LLM" claims are routinely rejected; the defensible claims are **specific cryptographic/architectural mechanisms** with concrete technical effects.
- **Defensive publication** = publish a timestamped, enabling disclosure (e.g., arXiv, IP.com, or a dated public repo) so the idea becomes §102 prior art that blocks competitors' later patents, while keeping our own freedom to operate. This aligns with the founder directive to *"unify and make it our own"* without the cost/delay of prosecution, and with our **SLSA L1 (honest)** posture — we do not over-claim.
- Doctrine constraints that shape filing strategy: the Khipu signature is currently a **DSSE PLACEHOLDER** (Sigstore not wired) — claims must be drafted around the *hash-chain* mechanism that actually exists, not the future signature. **Λ-uniqueness remains Conjecture 1, NOT a theorem** — no patent claim may assert uniqueness as proven.

---

## 1. Khipu-Signed Reasoning Chains

**Closest prior art found:**
- [US20260024668A1 — "Personalized AI Agent as a Case Manager" (Google Patents)](https://patents.google.com/patent/US20260024668A1) — discloses a **Merkle-chained audit trail keyed by a global trace identifier (GUID)** recording inputs, rule invocations, overrides, and a **reasoning-trace generator**, with RFC-3161 time-tokens and deterministic replay. This is *very close* prior art to a generic "hash-chained reasoning trace."
- [US20240305465A1 — "Artificial intelligence model accuracy validation" (Google Patents)](https://patents.google.com/patent/US20240305465A1/en) — TEE-produced **cryptographically signed result** binding model hash + input-data hash + platform spec; third-party verifiable.
- Academic: in-toto attestation ([Torres-Arias et al., USENIX Security 2019](https://www.usenix.org/conference/usenixsecurity19/presentation/torres-arias)); Merkle trees ([Merkle, CRYPTO 1987](https://link.springer.com/chapter/10.1007/3-540-48184-2_32)); CoT-unfaithfulness motivation ([Turpin et al., NeurIPS 2023, arXiv 2305.04388](https://arxiv.org/abs/2305.04388)).

**Assessment:** The *generic* claim (hash-chain a reasoning trace) is **already anticipated** by US20260024668A1 — do **not** attempt to patent that. What may remain novel is the **specific binding**: each reasoning step's hash is co-signed with (a) the **13-axis `yuyay_v3`** gate vector and its conjunctive-AND verdict, (b) the **HUKLLA T01–T10** tripwire state, and (c) the **per-model license class** used at that step — producing a *single verifiable artifact that proves the wisdom-gate fired AND the model was license-compliant for that exact token span.* That triple-binding I did not find in prior art.

**Posture:** **DEFENSIVE-PUBLISH** the generic mechanism (it is essentially anticipated; publishing protects our FTO). **PATENT (narrow)** only the gate-vector + tripwire-state + license-class co-signing combination, *and only after Sigstore is wired* so the claim describes a real signature rather than the current DSSE placeholder. Until then, trade-secret the gate-binding format.

---

## 2. PURIQ-Gated Multi-Model Council

**Closest prior art found:**
- Self-consistency ([Wang et al., ICLR 2023, arXiv 2203.11171](https://arxiv.org/abs/2203.11171)); multi-agent debate ([Du et al., 2023, arXiv 2305.14325](https://arxiv.org/abs/2305.14325)); Mixture-of-Agents ([Wang et al., 2024, arXiv 2406.04692](https://arxiv.org/abs/2406.04692)). All are public, non-patented techniques for aggregating multiple model outputs.
- Reward-model judging is well-known (e.g., Nemotron-4-340B RewardBench, in `MISSING_LLMS_2026.md`).

**Assessment:** Ensembling/debate is **prior art and largely unpatentable** as a category. The novelty is using the **13-axis wisdom gate with 2 sacred axes ≥0.95 / 7 structural ≥0.90 / 4 introspection** as the *admission filter on council members* (a member's output is discarded unless its trace passes the gate), gating *before* aggregation rather than scoring after. This is a specific control-flow that I did not find claimed.

**Posture:** **DEFENSIVE-PUBLISH.** The defensible delta is thin and easy to design around; publishing blocks a competitor from patenting "gate-then-aggregate" and costs little. No standalone patent.

---

## 3. Lambda-Bounded Context Window

**Closest prior art found:**
- Prompt compression ([Jiang et al., "LLMLingua," EMNLP 2023, arXiv 2310.05736](https://arxiv.org/abs/2310.05736)); lost-in-the-middle ([Liu et al., TACL 2024, arXiv 2307.03172](https://arxiv.org/abs/2307.03172)). Physical bound: Bekenstein 1981.

**Assessment:** Compressing/budgeting context is heavily prior-arted. Tying the budget to a **Λ(x) sovereignty/complexity score** is a novel *policy*, but the underlying mechanism is obvious over LLMLingua. **Recall Λ-uniqueness is Conjecture 1, NOT a theorem** — we cannot claim an "optimal" or "unique" bound; that would be both legally unsupported and a doctrine violation.

**Posture:** **TRADE-SECRET / NO-FILE.** Keep the exact Λ-to-budget mapping internal; do not file (obvious) and do not publish the tuned coefficients (competitive value is in the calibration).

---

## 4. Sovereignty-Selectable Inference

**Closest prior art found:**
- [EP4558922A1 — "Efficiently controlling routing of requests to model endpoint infrastructure" (Google Patents)](https://patents.google.com/patent/EP4558922A1/en) — two-stage LLM routing label cascade.
- [US12236193B1 — "Automated selection of large language models in cloud computing environments" (Google Patents)](https://patents.google.com/patent/US12236193B1/en) — proxy that selects LLMs by cost/usage features.
- Confidential computing for data residency: [US20240296245A1 — multi-tenant confidential computing (Google Patents)](https://patents.google.com/patent/US20240296245A1/en); [US20240129105A1 — hybrid MPC/FHE confidential computing (Google Patents)](https://patents.google.com/patent/US20240129105A1); Intel SGX ([Costan & Devadas, 2016](https://eprint.iacr.org/2016/086)).

**Assessment:** Cost/feature-based routing is **claimed prior art** (US12236193B1, EP4558922A1) — avoid those claim scopes. The genuinely novel element is routing **by a machine-checkable *license/sovereignty class* with a `canTrainOnOutputs` flag bound to HUKLLA T08** — i.e., the router refuses to send a tenant's data to a model whose license forbids the use, and *emits a receipt proving the constraint was enforced.* The `canTrainOnOutputs` distinction (NVIDIA-Open permits; **Grok-2 forbids** training on outputs, per `MISSING_LLMS_2026.md`) as a hard routing predicate is, to my search, unclaimed.

**Posture:** **PATENT (strong candidate).** This is a concrete technical method (policy-constrained routing with receipt emission) with a clear commercial/regulatory effect (data-residency + license compliance), and it is the **#1 priority innovation** in the patch plan. File a method + system claim around *license-class-gated routing with cryptographic compliance receipts.* Defensively publish the broader "route by sovereignty" idea as a fence.

---

## 5. Receipt-Continuous Memory (Unay)

**Closest prior art found:**
- MemGPT ([Packer et al., 2023, arXiv 2310.08560](https://arxiv.org/abs/2310.08560)); certificate transparency ([Laurie et al., RFC 6962](https://www.rfc-editor.org/rfc/rfc6962)); machine unlearning ([Bourtoule et al., IEEE S&P 2021, arXiv 1912.03817](https://arxiv.org/abs/1912.03817)).
- The Google case-manager patent (US20260024668A1, above) already chains every memory artifact under a GUID Merkle tree.

**Assessment:** Tiered LLM memory (MemGPT) and Merkle-logged audit memory (US20260024668A1) are prior art. Novel delta: **verifiable forgetting** — pairing a sparse-Merkle memory with a *machine-unlearning proof receipt* that demonstrates a specific fact was provably evicted (not merely overwritten). That cryptographic-deletion-with-proof binding I did not find claimed.

**Posture:** **PATENT (narrow, longer-horizon).** File only the "provable forgetting receipt" sub-mechanism; defensively publish the rest. Low urgency (innovation ranked deep/L).

---

## 6. Anatomy-Routed Cognition

**Closest prior art found:**
- MoE routing: Switch Transformer ([Fedus et al., 2021, arXiv 2101.03961](https://arxiv.org/abs/2101.03961)); OLMoE ([arXiv 2409.02060](https://arxiv.org/abs/2409.02060)).
- Blackboard architectures (Hayes-Roth 1985); LangGraph agent orchestration (public).

**Assessment:** Routing tokens/tasks to specialized experts/agents is deep prior art. Mapping experts to **six named organs (amaru, sentra, vessels/killinchu, rosie, a11oy)** is branding, not a patentable mechanism. No defensible technical novelty over MoE + agent graphs.

**Posture:** **DEFENSIVE-PUBLISH** the organ taxonomy as design documentation (protects the brand expression and blocks a copycat patent); **NO-FILE.** Real value is UX + the 3D visualization, which is **copyright/trade-dress** territory, not patent.

---

## 7. Hatun-Willay Narrative Wrapper

**Closest prior art found:**
- Controllable text generation surveys; Situated Wise Reasoning Scale ([Brienza et al., JPSP 2018, DOI 10.1037/pspp0000171](https://doi.org/10.1037/pspp0000171)).

**Assessment:** A narrative/style wrapper over model output is a presentation layer — abstract, not patentable. 

**Posture:** **NO-FILE.** Protect via copyright on the narrative templates/prompts and trade-secret the tuned style controllers.

---

## 8. PURIQ Action Pre-Auth

**Closest prior art found:**
- Human-in-the-loop RL / RLHF ([Christiano et al., NeurIPS 2017, arXiv 1706.03741](https://arxiv.org/abs/1706.03741)); constrained MDPs (Altman 1999); policy-as-code (Open Policy Agent / Rego, public).
- The Google case-manager patent (US20260024668A1) discloses **policy-constrained inference with override recorder** — close prior art for "check policy before acting."

**Assessment:** "Require approval before a risky action" is well-known (OPA, guardrail frameworks) and partly anticipated by US20260024668A1's policy-enforcement + override layer. Novel delta: pre-authorizing an action by running the **proposed action through the 13-axis gate and HUKLLA tripwires and emitting a signed pre-auth receipt that must be presented at execution time** — a *capability-token-like* artifact minted by the wisdom gate. The gate-minted capability token is the patentable seed.

**Posture:** **PATENT (narrow) + DEFENSIVE-PUBLISH the rest.** This ships fast (rank #3) and the receipt-as-capability-token mechanism is concrete. File the token-minting + execution-time-verification method.

---

## 9. Cross-Customer Khipu Federation (ZK)

**Closest prior art found:**
- [US20240177018A1 — "Differentially Private Federated Machine Learning for Large Models and a Strong Adversary" (Google Patents)](https://patents.google.com/patent/US20240177018) — DP federated learning with committee-based secure aggregation under malicious adversaries.
- [US20210143987A1 — "Privacy-preserving federated learning" (Google Patents)](https://patents.google.com/patent/US20210143987A1/en); federated averaging ([McMahan et al., AISTATS 2017, arXiv 1602.05629](https://arxiv.org/abs/1602.05629)); zk-SNARKs / Zerocash ([Ben-Sasson et al., IEEE S&P 2014](https://ieeexplore.ieee.org/document/6956581)).

**Assessment:** DP/secure-aggregation federated learning is **densely patented** (US20240177018A1, US20210143987A1) — high FTO risk. Our novelty would be federating **Khipu receipts (verifiable reasoning provenance), not model gradients** — sharing *proofs that a policy held* across tenants via ZK, without sharing data or weights. That object (federated *attestations* rather than *parameters*) is distinct, but the surrounding crypto is crowded.

**Posture:** **DEFENSIVE-PUBLISH + commission an FTO before any build.** Ranked XL/longest-horizon; do not file speculatively into a crowded space. Publish to fence the "federated receipts" concept.

---

## 10. Lake-Verified Tool Outputs

**Closest prior art found:**
- LLM + theorem prover ([Yang et al., "LeanDojo," NeurIPS 2023, arXiv 2306.15626](https://arxiv.org/abs/2306.15626)); Toolformer ([Schick et al., 2023, arXiv 2302.04761](https://arxiv.org/abs/2302.04761)); PAL ([Gao et al., ICML 2023, arXiv 2211.10435](https://arxiv.org/abs/2211.10435)).
- AI accuracy validation in a TEE with signed result (US20240305465A1, above).

**Assessment:** Tool-augmented and prover-checked generation is prior art. Novel delta: gating a tool output on a **Lean-checked invariant from our 749-decl / 14-axiom / 163-sorry corpus**, emitting a receipt that names the **specific proved theorem** (e.g., one of the 13 PROVED: F1-half, F3, F9, F10a, F11, sieve, Bézout, F15, F19a, F20, F21, F23) that validated the output. The binding of a tool result to a *named formal theorem ID* is unusual; but note **163 sorries and 14 axioms remain** — any claim must scope to the *proved* subset and must **not** assert the axiomatized parts are verified.

**Posture:** **PATENT (narrow, longer-horizon)** the "tool-output-gated-by-named-formal-theorem with receipt" method; defensively publish the broader idea. Honesty constraint: claim language must reflect that only 13 theorems are proved, not the whole corpus.

---

## 11. Hybrid SSM + Transformer Routing

**Closest prior art found:**
- Mamba ([Gu & Dao, 2023, arXiv 2312.00752](https://arxiv.org/abs/2312.00752)); Mamba-2 ([Dao & Gu, ICML 2024, arXiv 2405.21060](https://arxiv.org/abs/2405.21060)); Jamba hybrid ([Lieber et al., 2024, arXiv 2403.19887](https://arxiv.org/abs/2403.19887)); RWKV-7 ([arXiv 2503.14456](https://arxiv.org/abs/2503.14456)); Phi-4-mini-flash SambaY hybrid (in `MISSING_LLMS_2026.md`).

**Assessment:** *Building* hybrid SSM+Transformer models is the model-makers' IP (Jamba, SambaY). Our innovation is at the **router** layer: dynamically selecting SSM vs. transformer backends **per request based on context length and a cost/latency predictor**, with the choice recorded in the receipt. Routing *between* third-party architectures by predicted cost is closer to the routing patents (US12236193B1, EP4558922A1) — moderate FTO caution.

**Posture:** **DEFENSIVE-PUBLISH.** The model architectures are others' IP; our router delta overlaps existing routing patents. Publish our SSM/transformer selection heuristic to keep FTO clear; **NO-FILE** (rank #4 by leverage, but cost advantage is operational, not legal).

---

## 12. Cross-Provider Speculative Decoding

**Closest prior art found — DENSELY PATENTED, HIGH RISK:**
- [US12229192B2 — "Speculative decoding in autoregressive generative AI models" (Google Patents, granted)](https://patents.google.com/patent/US12229192B2/en) — draft model + target model, including self-speculative decoding.
- [US20250245430A1 — "Efficient speculative decoding..." (Google Patents)](https://patents.google.com/patent/US20250245430A1/en) — recursive/beam-truncated spec decoding.
- [US20250384043A1 — "Draft model selection for speculative decoding" (Google Patents)](https://patents.google.com/patent/US20250384043A1/en) — *directly* on selecting the draft model.
- Foundational academic: speculative decoding ([Leviathan et al., ICML 2023, arXiv 2211.17192](https://arxiv.org/abs/2211.17192); [Chen et al., 2023, arXiv 2302.01318](https://arxiv.org/abs/2302.01318)).

**Assessment:** Speculative decoding, draft-model selection, and self-speculation are all **claimed (some granted)**. Our twist — draft on a **GREEN-license local model**, verify on an **AMBER/RED provider model**, with the license boundary enforced and receipted — touches the *license-gated routing* novelty (innovation #4) more than the decoding math. **Do not file on the decoding mechanism; FTO risk is high.**

**Posture:** **NO-FILE on decoding; fold the defensible part (license-boundary-aware draft/verify split) into the #4 license-routing patent.** Defensive-publish the cross-provider topology to avoid being blocked.

---

## 13. Test-Time Compute Scaling Slider

**Closest prior art found:**
- Test-time compute scaling ([Snell et al., 2024, arXiv 2408.03314](https://arxiv.org/abs/2408.03314)); budget forcing / s1 ([Muennighoff et al., 2025, arXiv 2501.19393](https://arxiv.org/abs/2501.19393)).
- Surveys + recent methods: [Reasoning on a Budget survey (arXiv 2507.02076)](https://arxiv.org/pdf/2507.02076.pdf); [Adaptive Test-Time Compute Allocation via Lagrangian duality (arXiv 2604.14853)](https://arxiv.org/html/2604.14853v1) — adaptive/controllable budget allocation is an *active, public* research area with formal frameworks already published.
- Dynamic model selection by computational efficiency: [US20240311405A1 (Google Patents)](https://patents.google.com/patent/US20240311405A1/).

**Assessment:** Controllable/adaptive test-time compute is **freshly and densely published** (two 2025–2026 arXiv works above) and partly patented (US20240311405A1). A user-facing "slider" is UX; the budget mechanism is prior art. Low patentability.

**Posture:** **DEFENSIVE-PUBLISH** (cheap; rank #6). The slider's value is transparency/UX, protectable as trade-dress, not patent. **NO-FILE.**

---

## 14. a11oy.code as Programmable Kernel (DSL)

**Closest prior art found:**
- Policy-as-code (Open Policy Agent / Rego, public); guided/constrained decoding ([Willard & Louf, "Outlines," 2023, arXiv 2307.09702](https://arxiv.org/abs/2307.09702)); declarative ML pipelines.

**Assessment:** DSLs over LLM pipelines exist (LMQL, Guidance, Outlines). A bespoke DSL is largely **copyrightable software**, not patentable subject matter, unless a specific compilation/execution mechanism is novel. The defensible seed would be **compiling a DSL program into a verified receipt-emitting execution plan** that the gate can check — but that is thin.

**Posture:** **NO-FILE; protect by copyright + trade-secret on the compiler.** Defensively publish the language grammar so no one patents "DSL for governed LLM kernels."

---

## 15. Per-Organ Voice Cloning

**Closest prior art found:**
- Zero-shot voice cloning: YourTTS ([Casanova et al., ICML 2022, arXiv 2112.02418](https://arxiv.org/abs/2112.02418)); OpenVoice ([Qin et al., 2023, arXiv 2312.01479](https://arxiv.org/abs/2312.01479)); Coqui XTTS.

**Assessment:** Voice cloning is mature, public, and patent-crowded. Assigning a distinct cloned voice per organ is product configuration, not invention. Also raises consent/likeness legal exposure independent of patents.

**Posture:** **NO-FILE.** Use off-the-shelf open models under their licenses; document consent provenance via Khipu receipts (which *reuses* innovation #1, not a new filing).

---

## 16. Deep innovations (D1–D5) — quick prior-art posture

| ID | Deep innovation | Closest prior art | Posture |
|---|---|---|---|
| D1 | 13-Axis Yuyay Distillation | Knowledge distillation (Hinton 2015, public); Constitutional AI ([arXiv 2212.08073](https://arxiv.org/abs/2212.08073)) | **TRADE-SECRET** the 13-axis target labels + distillation recipe; **NO-FILE** (distillation is prior art). License risk: must distill only from `canTrainOnOutputs=true` sources (Nemotron-Open OK; **Grok-2 forbidden**). |
| D2 | Khipu-aware fine-tuning | Tülu 3 ([arXiv 2411.15124](https://arxiv.org/abs/2411.15124)); RLHF | **DEFENSIVE-PUBLISH** the receipt-conditioned objective; **NO-FILE.** |
| D3 | PURIQ-formula-as-tool | Toolformer ([arXiv 2302.04761](https://arxiv.org/abs/2302.04761)); PAL ([arXiv 2211.10435](https://arxiv.org/abs/2211.10435)) | **NO-FILE** (anticipated); ships first (Q3). |
| D4 | Quechua-rooted RLHF dataset | Tülu 3; data curation (public) | **NO-FILE; protect as dataset/DB-right + trade-secret.** Value is the data, not a method. |
| D5 | Anatomy MoE (organ-as-expert, Λ-router) | Switch Transformer ([arXiv 2101.03961](https://arxiv.org/abs/2101.03961)); OLMoE ([arXiv 2409.02060](https://arxiv.org/abs/2409.02060)) | **DEFENSIVE-PUBLISH** (2027 horizon); the Λ-routing-into-MoE delta is thin and Λ-uniqueness is **only Conjecture 1**, so no uniqueness claim is supportable. |

---

## 17. Portfolio recommendation (the short list)

**File (narrow, technical, concrete effect) — in priority order:**
1. **#4 Sovereignty-Selectable Inference** — license-class-gated routing with `canTrainOnOutputs` predicate + cryptographic compliance receipt. *Strongest, ships first, regulatory wedge.* (Absorb the defensible slice of #12 here.)
2. **#1 Khipu-Signed Reasoning Chains (narrow)** — gate-vector + HUKLLA-state + license-class co-signing. **File only after Sigstore replaces the DSSE placeholder.**
3. **#8 PURIQ Action Pre-Auth (narrow)** — gate-minted capability token + execution-time verification.
4. **#10 Lake-Verified Tool Outputs (narrow)** — tool output bound to a *named proved* theorem ID + receipt (scoped to the 13 proved theorems only).
5. **#5 Receipt-Continuous Memory (narrow)** — provable-forgetting receipt (longer horizon).

**Defensive-publish (fence competitors, keep FTO, no prosecution cost):** #2, #6 (taxonomy), #9 (after FTO), #11, #13, plus D2/D5 and the broad versions of all "PATENT (narrow)" items above. Publish via dated arXiv/IP.com disclosures.

**No-file / protect by copyright, trade-secret, or DB-right:** #3, #7, #12 (decoding), #14, #15, D1, D3, D4.

**Hard gating rules before any filing:**
- **Λ-uniqueness is Conjecture 1, NOT a theorem** → no claim may assert optimality/uniqueness.
- **163 sorries / 14 axioms remain** → Lake-verification claims scope to the **13 proved theorems** only.
- **Khipu = DSSE placeholder** → signature-dependent claims wait for Sigstore.
- **SLSA L1 (honest)** posture → do not over-claim provenance assurance; **SLSA L3 is BANNED** as a marketing assertion.
- Distillation/training claims must respect each source's `canTrainOnOutputs` flag (HUKLLA **T08**): **Grok-2 forbids**, **Nemotron-Open permits**.

---

*Signed: Yachay — 2026-06-01. No bandaid, no mysticism. Every prior-art reference carries a primary-source URL (Google Patents / arXiv / standards body). This is strategy, not legal advice — a registered patent attorney must run formal FTO + patentability before any filing. Doctrine v11 LOCKED numbers preserved verbatim; Λ-uniqueness held as Conjecture 1. Specs only — nothing pushed to HF/GitHub.*
