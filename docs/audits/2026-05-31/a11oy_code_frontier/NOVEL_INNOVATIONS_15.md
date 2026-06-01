# NOVEL_INNOVATIONS_15 — a11oy.code Frontier Innovations

**Layer:** PURIQ → `a11oy_code_frontier/`
**Author:** Yachay (a11oy.code Frontier agent)
**Date:** 2026-06-01
**Founder directive (2026-06-01 ~02:17 EDT):** *"What am I missing in a11oy.code that no one has dreamed of? Innovate and evolve."*

**Thesis.** Every commercial coding/chat product (ChatGPT, Claude, Gemini, Cursor, Continue, Perplexity, Cohere, Mistral Le Chat, Grok) is a *thin policy over a model API*. a11oy.code is structurally different: it is a **governed action-selection operator** `P(x,t) = argmax_a [ Λ(x)·Yuyay₁₃(a)·exp(-β·HUKLLA(a))·∏Khipu_i(a) ]` (Doctrine v12 §2, LOCKED). The 15 innovations below are the things that operator makes possible **that an ungoverned API wrapper cannot do**. Each: concept, why-it-matters, technical design, cost (S/M/L/XL), competitive landscape, Khipu/PURIQ tie-in, Lean stub.

> **Zero-Bandaid.** No mysticism. Each innovation cites (a) the closest *commercial* precedent and how ours differs structurally, and (b) the *academic* paper establishing the underlying technique. Doctrine v11 LOCKED numbers (13-axis `yuyay_v3`, replay-hash `bacf5443…631fc5`, HUKLLA T01–T10, 749 decls / 14 axioms / 163 sorries) are preserved verbatim.

**Cost legend:** S = ≤1 eng-week · M = ~1 eng-month · L = ~1 quarter · XL = multi-quarter / requires model training.

---

## 1. Khipu-Signed Reasoning Chains

**Concept.** Every reasoning step (each CoT segment, each tool call, each intermediate conclusion) emits a Khipu receipt: `{step_id, parent_id, content_hash, model, token_logprobs_summary, timestamp, prev_receipt_hash}`. The chain is a Merkle DAG. Anyone can later *replay* the reasoning and *cryptographically verify* that the chain was not altered and that step N actually followed from step N-1's stated inputs.

**Why it matters.** No product today lets you prove *how* an answer was reached. "Show your work" today = the model re-states a plausible CoT (which research shows is often unfaithful — [Turpin et al., "Language Models Don't Always Say What They Think," NeurIPS 2023, arXiv 2305.04388](https://arxiv.org/abs/2305.04388)). Khipu-signed chains make the trace *tamper-evident*, turning "reasoning" from a UX flourish into an auditable artifact — the core Series-A differentiator for regulated/defense buyers (Defense Unicorns, the bank, the insurer).

**Technical design.**
- Wrap the existing `/v1/router` so each model turn produces a `KhipuStepReceipt`. `content_hash = SHA256(step_text ‖ tool_io)`; `chain_hash = SHA256(content_hash ‖ prev_receipt_hash)`.
- Receipts serialize to **in-toto attestation** format (per Killinchu PONDER note 06:30 — interoperable with Sigstore/Cosign/Pepr), so a chain is a sequence of linked in-toto statements.
- Verification = recompute the chain hashes + re-run any deterministic step (tool calls are recorded with inputs). Non-deterministic LLM steps are verified by *hash of the recorded output*, not re-generation.
- This is the `∏Khipu_i(a)` factor at *step* granularity: if any step's `chain_verified=false`, the product is 0 and the action is removed from `𝒜` (Doctrine v12 §2).

**Cost:** M (receipt plumbing exists; per-step granularity + replay UI is the new work).

**Competitive landscape.**
- *Closest commercial:* OpenAI o-series "reasoning summaries" and Anthropic extended-thinking traces both *show* CoT but neither signs nor lets you cryptographically verify it. Cursor/Continue show diffs, not signed reasoning. **Nobody signs.**
- *Academic precedent:* in-toto supply-chain attestation ([Torres-Arias et al., "in-toto," USENIX Security 2019](https://www.usenix.org/conference/usenixsecurity19/presentation/torres-arias)); Merkle trees ([Merkle, "A Digital Signature Based on a Conventional Encryption Function," CRYPTO 1987]); CoT faithfulness problem ([Turpin et al. 2023](https://arxiv.org/abs/2305.04388)).
- *Structural difference:* ours is a *tamper-evident DAG over the actual decision*, not a regenerated narrative. It is enforced by the formula (zeroes utility on break), not offered as a viewing option.

**Khipu/PURIQ tie-in.** This *is* `∏Khipu_i(a)` made step-granular; directly strengthens HUKLLA T01 (receipt-chain-break → HALT).

**Lean stub.**
```lean
-- KhipuStep.lean (sorry-tagged, INV per Doctrine v12 §3)
theorem khipu_chain_integrity (c : ReasoningChain) :
    chainVerified c = true ↔ ∀ i, c.step i |>.chainHash =
      hash (c.step i).contentHash ((c.step (i-1)).chainHash) := by
  sorry  -- obligation: hash-chain soundness; HR-4 honest
```

---

## 2. PURIQ-Gated Multi-Model Council

**Concept.** For high-governance queries, route the *same* prompt to N GREEN models (e.g. DeepSeek-V3, Qwen3-235B, MiniMax-M1, Llama 3.3 70B). Each produces a candidate `a_k`. A small judge (Nemotron-4-340B-Reward, RewardBench leader at 92.2 — see `MISSING_LLMS_2026.md` §4.1) scores them; **Yuyay₁₃ consensus** selects the action that all axes clear; on disagreement above a threshold, fire **HUKLLA T09** (yuyay-axis-below-floor) → human review.

**Why it matters.** Single-model answers have correlated failure modes. A *governed* council turns model diversity into a calibration signal: agreement = high confidence; disagreement = an explicit, receipted "we don't know, escalate." This is the honest alternative to a confident single answer — and it is exactly what a defense/finance buyer wants.

**Technical design.**
- New tier modifier `council=N` on `/v1/router`. Fan-out to N models (parallel, license-typed).
- Aggregate: compute pairwise semantic agreement (arctic-embed-l cosine, already the T0 cache embedder); Nemotron-Reward scores each candidate; `Yuyay₁₃` gate applied to each.
- Selection = `argmax_a U(a|x)` over the council's `𝒜` (the master formula, exactly — the council just *populates* `𝒜` with diverse candidates).
- Disagreement metric `D = 1 - mean_pairwise_agreement`. If `D > τ_council`, emit T09 receipt + route to human. Bounded: N is fixed (Bekenstein bound on `|𝒜|`).

**Cost:** M.

**Competitive landscape.**
- *Closest commercial:* OpenAI "consistency" / self-consistency sampling (one model, many samples); LMSYS Chatbot Arena (humans vote, offline); Martian/NotDiamond model-routing (route to *one* best model). **Nobody runs a governed N-model council with a reward-model judge + a formal disagreement→escalate tripwire in production.**
- *Academic precedent:* self-consistency ([Wang et al., "Self-Consistency Improves CoT," ICLR 2023, arXiv 2203.11171](https://arxiv.org/abs/2203.11171)); LLM debate ([Du et al., "Improving Factuality via Multiagent Debate," 2023, arXiv 2305.14325](https://arxiv.org/abs/2305.14325)); mixture-of-agents ([Wang et al., "Mixture-of-Agents," 2024, arXiv 2406.04692](https://arxiv.org/abs/2406.04692)).
- *Structural difference:* council members are *different models* with *different licenses*, the judge is a dedicated reward model, and disagreement is a *governed tripwire* (T09), not a sampling trick.

**Khipu/PURIQ tie-in.** Populates `𝒜` with diverse candidates; T09 is the gate.

**Lean stub.**
```lean
theorem council_disagreement_escalates (c : Council) :
    disagreement c > tauCouncil → fires HUKLLA.T09 c := by sorry
```

---

## 3. Lambda-Bounded Context Window

**Concept.** Instead of an arbitrary "128K / 1M" advertised window, the *admitted* context is bounded by three computable limits composed: **Bekenstein** (information per energy/budget — Doctrine v11 §12 `bekenstein_cascade`), **Kolmogorov** (incompressible content only — drop redundant tokens), **Shannon** (channel capacity of the routing budget). The window is `min(Bekenstein(budget), Kolmogorov_compressed(input), Shannon(latency_budget))`.

**Why it matters.** Every vendor lies about effective context (RoPE-extended 1M windows degrade — see Jamba's *measured* 256K-effective vs others' claimed-but-not-effective in `MISSING_LLMS_2026.md` §2.3). a11oy.code instead *computes* the largest context that is information-theoretically justified for the budget, compresses to it, and *proves* the bound. Honest by construction.

**Technical design.**
- Pre-router stage: compress input via Kolmogorov-proxy (LLMLingua-style prompt compression) to remove redundancy; measure compressed length `L_k`.
- Compute `L_bek = f(budget, energy)` from `bekenstein_cascade` (existing Lean primitive); `L_shan = capacity(latency_ms)`.
- Admit `L_admit = min(L_k, L_bek, L_shan)`; if input > `L_admit`, fire **HUKLLA T10** (bekenstein-overflow → truncate `𝒜` / route T5) per `A11OY_CODE_ROUTER_SPEC` §5.
- Emit a receipt with all three bounds → user *sees why* their 2M-token dump was admitted at 340K.

**Cost:** M (Bekenstein primitive exists; compression + the tri-bound composition is new).

**Competitive landscape.**
- *Closest commercial:* Anthropic/Google advertise raw windows; Cursor "codebase indexing" chunks heuristically. **Nobody bounds context by a composed information-theoretic limit and shows the proof.**
- *Academic precedent:* Bekenstein bound ([Bekenstein, Phys. Rev. D 23, 287, 1981]); Kolmogorov complexity ([Li & Vitányi textbook]); Shannon capacity ([Shannon, "A Mathematical Theory of Communication," 1948]); prompt compression ([Jiang et al., "LLMLingua," EMNLP 2023, arXiv 2310.05736](https://arxiv.org/abs/2310.05736)); lost-in-the-middle ([Liu et al., TACL 2024, arXiv 2307.03172](https://arxiv.org/abs/2307.03172)).
- *Structural difference:* the window is a *computed, proven minimum* tied to budget, not a marketing number.

**Khipu/PURIQ tie-in.** Directly implements the Bekenstein bound on `|𝒜|` (Doctrine v12 §2, T10).

**Lean stub.**
```lean
theorem context_bound_respected (req : Request) :
    admittedLen req ≤ min (bekenstein req.budget)
      (min (kolmogorov req.input) (shannon req.latency)) := by sorry
```

---

## 4. Sovereignty-Selectable Inference

**Concept.** A user-facing toggle: `governance_tier=sovereign` forces (a) GREEN-license-only models (Apache/MIT/NVIDIA-Open — no AUP, no no-train clause), (b) a chosen *infrastructure jurisdiction* (US-only / EU-only / on-prem), and (c) emits a **Khipu proof** that the entire request was served under those constraints — no AMBER weight, no foreign endpoint, ever touched it.

**Why it matters.** Defense Unicorns, the bank, and any regulated buyer cannot use ChatGPT/Claude for sensitive workloads because they cannot *prove* data residency + license cleanliness. a11oy.code can. This is the single most direct Series-A wedge into the defense/regulated market that no incumbent can match — because they have no provable license/jurisdiction layer.

**Technical design.**
- `A11OY_CODE_ROUTER_SPEC` §6 already has `governance_tier=sovereign` forcing GREEN-only. Extend: add `infra_jurisdiction ∈ {us, eu, onprem}` and a per-provider jurisdiction registry (DeepInfra-US, Together-US, on-prem NIM per `vectordb_nvidia/NVIDIA_DEV_INFRA_2026.md`).
- The router refuses any model/provider pair violating the constraint → HUKLLA T08 (license-AUP) + a new T08b (jurisdiction).
- Khipu receipt carries `{license_class: GREEN, canTrainOnOutputs, infra_jurisdiction, provider_region}`. This becomes a *Lean invariant*: "no sovereign action ever executed on a RED/AMBER weight or a non-jurisdiction endpoint" (Yachay-extension's PONDER proposal 06:40, now concrete).
- Regional model roster from `MISSING_LLMS_2026.md` §6: EuroLLM (EU), Salamandra/Latxa (ES/EU), Sailor 2 (SEA), all Apache GREEN.

**Cost:** M (toggle + jurisdiction registry + Lean invariant; reuses existing license machinery).

**Competitive landscape.**
- *Closest commercial:* Azure OpenAI data-residency *promises* region; AWS Bedrock model choice; Cohere "private deployment." **None gives a per-request cryptographic proof of license-class + jurisdiction.** They give contractual promises, not receipts.
- *Academic precedent:* confidential computing / remote attestation ([Costan & Devadas, "Intel SGX Explained," 2016]); data-residency policy enforcement literature; SLSA provenance ([SLSA framework, OpenSSF]).
- *Structural difference:* a *provable, per-request* sovereignty receipt, not a contract clause.

**Khipu/PURIQ tie-in.** Turns HUKLLA T08 into a provable Lean invariant; the receipt is the product.

**Lean stub.**
```lean
theorem sovereign_never_amber (r : RouteDecision) :
    r.governanceTier = .sovereign → r.licenseClass = .GREEN ∧ r.canTrainOnOutputs := by sorry
```

---

## 5. Receipt-Continuous Memory (Unay)

**Concept.** *Unay* (Quechua: "long ago / of old" — cited gloss to be locked by Hatun-Willay) = cross-session memory where every stored memory is a Khipu receipt, every recall is verified against the chain, and **deletion produces a Merkle-proof of removal** (the user can prove a memory was *actually* deleted, not just hidden).

**Why it matters.** "Memory" features (ChatGPT memory, Claude projects) are opaque blobs you cannot audit and cannot prove deletion of — a GDPR/CCPA liability (`legal/compliance` skill territory). Unay makes memory a verifiable ledger with provable right-to-be-forgotten.

**Technical design.**
- Memory store = append-only Merkle DAG of `MemoryReceipt{id, content_hash, embedding, created_at, organ, prev_hash}`.
- Recall: semantic search (arctic-embed-l) → candidate memories → verify each `chain_verified` before injecting into context (a broken memory receipt = excluded, `∏Khipu_i=0`).
- **Deletion = tombstone + Merkle re-root**: publish `{deleted_id, new_root, proof_path}`. Anyone can verify the id is no longer in the tree (Merkle non-membership / sparse-Merkle-tree exclusion proof).
- Forgetting integrates machine-unlearning research for any *model-internalized* memory (AllenAI used OLMo-7B as an unlearning testbed — `MISSING_LLMS_2026.md` §7.1).

**Cost:** L (Merkle store + unlearning + UI).

**Competitive landscape.**
- *Closest commercial:* ChatGPT Memory, Claude Projects, MemGPT/Letta (open). **None offers Merkle-proof-of-deletion or chain-verified recall.**
- *Academic precedent:* MemGPT ([Packer et al., 2023, arXiv 2310.08560](https://arxiv.org/abs/2310.08560)); sparse Merkle trees / certificate transparency ([Laurie et al., RFC 6962]); machine unlearning ([Bourtoule et al., "Machine Unlearning," IEEE S&P 2021, arXiv 1912.03817](https://arxiv.org/abs/1912.03817)).
- *Structural difference:* memory is a *verifiable ledger with provable deletion*, not an opaque store.

**Khipu/PURIQ tie-in.** Memory recall is gated by `∏Khipu_i(a)`; deletion proof is a new Khipu primitive.

**Lean stub.**
```lean
theorem deletion_proof_sound (t : MerkleTree) (id : Id) (p : ExclusionProof) :
    verifyExclusion t.root id p = true → id ∉ t := by sorry
```

---

## 6. Anatomy-Routed Cognition

**Concept.** A query is routed *through named organs explicitly*, and the user sees which organs activated and in what order — e.g. "amaru (provenance) → sentra (security gate) → a11oy (code) → amaru (receipt)". The organ traversal is itself a receipted path.

**Why it matters.** Every other product is a black box: prompt in, answer out. a11oy.code's anatomy (amaru/sentra/vessels/rosie/a11oy/killinchu) becomes a *visible, governed pipeline* — the user understands *why* an answer is trustworthy because they see the security gate and provenance check fire. This is the UX face of the whole governance thesis (ties to Rosie 3D / Anatomy V2 from `411_3D_ANATOMY_V2_PLUS_ROSIE_3D.md`).

**Technical design.**
- Define an organ-graph: each organ exposes `puriq.{decide,act,reflect}` (Doctrine v12 §0). A query is a *traversal* over the graph driven by the Λ-spine.
- Router emits an `OrganPathReceipt[]`: ordered list of `{organ, action, tier, model, hukla_check}`.
- Rosie 3D / Anatomy V2 render the path live as Khipu glyphs (existing visualization machinery, Charter §31).
- The traversal is bounded (no organ visited twice without a receipt → no loops; respects bounded `|𝒜|`).

**Cost:** M (organ-graph + receipt path + wire to existing 3D viz).

**Competitive landscape.**
- *Closest commercial:* LangGraph / CrewAI / AutoGen show *agent* graphs (developer-facing, unsigned); Perplexity shows "steps." **Nobody surfaces a named, governed, receipted organ pipeline as the product UX.**
- *Academic precedent:* agent-orchestration graphs ([LangGraph]); blackboard architectures ([Hayes-Roth, 1985]); society-of-mind framing ([Minsky, 1986]).
- *Structural difference:* organs are *governance roles* with mandatory gates, not arbitrary agent nodes; the path is signed.

**Khipu/PURIQ tie-in.** Each hop is a `puriq.decide` → `Khipu_i` receipt; the path is the literal `∏Khipu_i(a)`.

**Lean stub.**
```lean
theorem organ_path_acyclic (p : OrganPath) : p.NoDuplicateWithoutReceipt → Acyclic p := by sorry
```

---

## 7. Hatun-Willay Narrative Wrapper

**Concept.** Any answer can be *re-presented* along the 5 Hatun-Willay axes — **Origin / Mechanism / Evidence / Stakes / Invitation** (`integration/HATUN_WILLAY_DOCTRINE.md` §3) — with the rule that **no axis may assert anything the gate did not clear**. A one-click "explain this for an investor / judge / engineer" that is structurally honest.

**Why it matters.** Founders/sellers constantly re-explain the same thing to different audiences. Hatun-Willay automates audience-tuned re-presentation *without drift* — the narrative is downstream of the gate, so it can never over-claim (the Galactica failure mode in `MISSING_LLMS_2026.md` §5.5).

**Technical design.**
- Post-answer transform: given a gated answer + its evidence receipts, generate 5 sections; each section must cite a Doctrine LOCKED number, a Lean decl, an HF SHA, or a receipt id (the grounding rule, §3).
- The wrapper is *itself a proposal* that re-enters the 13-axis gate (HATUN_WILLAY §1: "the teller is held to the law it tells") — if axis 2 (`measurabilityHonesty` ≥0.95) or axis 9 (`claimCalibration` ≥0.90) fails, the section is blocked.
- Optionally render as a GREEN open-video explainer (Mochi-1/Open-Sora 2.0, `MISSING_LLMS_2026.md` §8).

**Cost:** S (doctrine + axes exist; this is a prompt+gate+template wrapper).

**Competitive landscape.**
- *Closest commercial:* "explain like I'm 5" / tone presets (ChatGPT custom instructions, Notion AI). **None gates the re-presentation against a claim-calibration floor.**
- *Academic precedent:* Situated Wise Reasoning Scale ([Brienza, Kung, Santos, Bobocel & Grossmann, JPSP 2018, DOI 10.1037/pspp0000171](https://doi.org/10.1037/pspp0000171), already operationalized in the gate); controllable text generation surveys.
- *Structural difference:* re-presentation is *gate-bounded* — cannot add claims.

**Khipu/PURIQ tie-in.** Hatun-Willay is a PURIQ layer; output re-enters the heart.

**Lean stub.** N/A (policy layer; relies on existing gate theorems).

---

## 8. PURIQ Action Pre-Auth

**Concept.** Before any *tool call with side effects* (write file, send message, run command, place order), show the user the computed Puriq utility `U(a|x) = Λ·Yuyay₁₃·exp(-β·HUKLLA)·∏Khipu` **and the per-factor breakdown + rationale**, and require explicit auth above a side-effect threshold.

**Why it matters.** Agentic products execute tool calls opaquely (Cursor agent edits, ChatGPT actions). a11oy.code shows the *governance score* of the proposed action *before* it fires — the human sees "Yuyay axis 9 = 0.91, HUKLLA clean, Khipu verified, P=0.87" and authorizes. This is provable human-in-the-loop, the thing defense/finance compliance requires.

**Technical design.**
- Intercept tool calls flagged `side_effect=true`. Compute and display the four factors + the scalar `U`.
- Threshold policy per organ (amaru/sentra = high bar). Below threshold → auto; above → require explicit auth, receipted.
- The pre-auth dialog *is* a Khipu receipt: `{action, U, factors, user_decision, timestamp}`.

**Cost:** S–M.

**Competitive landscape.**
- *Closest commercial:* Cursor "ask before applying," ChatGPT confirm-before-action, Claude tool-use approval. **All show *what* the action is; none shows a *computed governance utility* with a per-factor decomposition.**
- *Academic precedent:* human-in-the-loop RL ([Christiano et al., RLHF, NeurIPS 2017, arXiv 1706.03741](https://arxiv.org/abs/1706.03741)); constrained MDPs / safe RL ([Altman, "Constrained Markov Decision Processes," 1999]).
- *Structural difference:* the approval surfaces the *formula's actual score*, not a yes/no prompt.

**Khipu/PURIQ tie-in.** Direct exposure of `P(x,t)`'s `U(a|x)` to the human before commit.

**Lean stub.**
```lean
theorem preauth_required_above_threshold (a : Action) :
    a.sideEffect ∧ a.U < authThreshold → requiresHumanAuth a := by sorry
```

---

## 9. Cross-Customer Khipu Federation

**Concept.** Multiple SZL customers contribute *threat-intelligence / anomaly signals* (sentra, killinchu) to a shared model **via zero-knowledge proofs** — each customer proves "I observed pattern P" without revealing the raw data. The federation improves everyone's detection while no raw data crosses a boundary.

**Why it matters.** Defense/maritime customers will never share raw data, but collective threat-intel is hugely valuable. ZK-federated Khipu lets competitors benefit from each other's signals with cryptographic non-disclosure — a network effect no single-tenant product can build.

**Technical design.**
- Each customer's sentra emits a *signal commitment*: `Commit(pattern)` + a ZK proof that the commitment corresponds to a valid (schema-conformant, gate-cleared) observation, without revealing the observation.
- A federation aggregator combines commitments (federated learning / secure aggregation) → updated detection thresholds shared back.
- All federation messages are Khipu receipts; the ZK proof is the `Khipu_i` verification.
- Privacy budget tracked (differential privacy) per contributor.

**Cost:** XL (ZK + secure aggregation + DP accounting).

**Competitive landscape.**
- *Closest commercial:* CrowdStrike/Microsoft threat-intel sharing (centralized, raw-ish telemetry); Apple private federated stats. **No coding/agent platform does ZK-federated cross-customer learning.**
- *Academic precedent:* federated learning ([McMahan et al., AISTATS 2017, arXiv 1602.05629](https://arxiv.org/abs/1602.05629)); secure aggregation ([Bonawitz et al., CCS 2017]); zk-SNARKs ([Ben-Sasson et al., "Zerocash," IEEE S&P 2014]); differential privacy ([Dwork & Roth, 2014]).
- *Structural difference:* learning is *ZK-mediated and Khipu-receipted*, not centralized telemetry.

**Khipu/PURIQ tie-in.** The federation message *is* a Khipu receipt with a ZK proof body; ties to Killinchu's in-toto/Sigstore attestation path.

**Lean stub.**
```lean
theorem federation_zero_raw_leak (m : FedMessage) : leaksRawData m = false := by sorry
```

---

## 10. Lake-Verified Tool Outputs

**Concept.** When a tool returns a *verifiable claim* (a number, a build result, a proof, a calculation), the claim is passed through a **Lake build** (the Lean build system already in the corpus) before the LLM is allowed to *trust and propagate* it. Unverifiable claims are tagged `unverified`.

**Why it matters.** LLMs propagate tool hallucinations and wrong calculations. a11oy.code already owns a Lean+Lake verification stack (749 decls / 14 axioms / 163 sorries, LOCKED). Routing verifiable tool outputs through Lake means the brain *cannot* assert a false numeric/logical claim — it is mechanically checked. This is the Galactica antidote (`MISSING_LLMS_2026.md` §5.5).

**Technical design.**
- Classify tool outputs: `verifiable` (arithmetic, logical, build, proof) vs `empirical` (web fetch, opinion).
- For verifiable: encode the claim as a Lean proposition; attempt `lake build`. Pass → claim gets a `lake_verified=true` Khipu field → admitted to `𝒜`. Fail → tagged `unverified`, downweighted.
- Reuses the existing Lutar/Lake harness (`formulas/PuriqLean.lean`, `LAKE_TEST_PLAN.md`).
- Bounded: a fuel-limited build (Turing honest halting, F19 from formula-mining PONDER) — no infinite proof search.

**Cost:** L (claim-extraction → Lean encoding is the hard part; Lake harness exists).

**Competitive landscape.**
- *Closest commercial:* Wolfram plugin (computes, doesn't gate trust); code-interpreter (runs code, no formal verify). **No product gates LLM trust on a theorem-prover build.**
- *Academic precedent:* LLM + theorem prover ([Yang et al., "LeanDojo," NeurIPS 2023, arXiv 2306.15626](https://arxiv.org/abs/2306.15626)); tool-augmented verification ([Schick et al., "Toolformer," 2023, arXiv 2302.04761](https://arxiv.org/abs/2302.04761)); program-aided language models ([Gao et al., "PAL," ICML 2023, arXiv 2211.10435](https://arxiv.org/abs/2211.10435)).
- *Structural difference:* trust is *mechanically certified by Lake*, not assumed.

**Khipu/PURIQ tie-in.** `lake_verified` becomes a `Khipu_i` factor; ties to the Lake-buildable rule (Charter §41).

**Lean stub.**
```lean
theorem lake_verified_implies_true (c : Claim) :
    lakeVerified c = true → c.proposition := by sorry  -- soundness of Lake encoding
```

---

## 11. Hybrid SSM + Transformer Routing

**Concept.** Route by *sequence shape*: long-context / streaming → SSM-family (Mamba-2, Jamba 1.5, MiniMax-M1, RWKV-7, Phi-4-mini-flash — all in `MISSING_LLMS_2026.md` §2); short, reasoning-dense → transformer (DeepSeek-R1, Qwen3). The router picks the *architecture* whose cost curve fits the request, not just the model.

**Why it matters.** Transformers are quadratic in context; SSMs/RNNs are linear/constant. For 1M-token codebase scans, SSM-family is 5–10× cheaper (Phi-4-mini-flash: 10× throughput, `MISSING_LLMS_2026.md` §2.5; Jamba: 2.5× faster). a11oy.code is the only router that selects on *architecture cost curve* — a structural cost advantage at scale.

**Technical design.**
- Add `architecture ∈ {transformer, ssm, hybrid, rnn}` to the model registry (`openLlmRouter.ts`).
- New routing predicate: `if context_tokens > C_cross AND task_class != reasoning → prefer ssm/hybrid`. `C_cross` calibrated where SSM cost < transformer cost (measured per-provider).
- T5 long-context primary becomes MiniMax-M1 (GREEN, 1M→4M) or Jamba 1.5 Large (256K *effective*); T-edge gets RWKV-7/Phi-4-mini-flash.
- Cost-monotonicity preserved (`A11OY_CODE_ROUTER_SPEC` §1 goal 5): never upshift without trigger.

**Cost:** M (registry field + predicate + benchmarking the cross-over).

**Competitive landscape.**
- *Closest commercial:* OpenRouter routes by model, not architecture; Cursor uses one frontier model. **No product routes on SSM-vs-transformer cost curves.**
- *Academic precedent:* Mamba ([Gu & Dao, "Mamba," 2023, arXiv 2312.00752](https://arxiv.org/abs/2312.00752)); Mamba-2/SSD ([Dao & Gu, ICML 2024, arXiv 2405.21060](https://arxiv.org/abs/2405.21060)); Jamba ([Lieber et al., 2024, arXiv 2403.19887](https://arxiv.org/abs/2403.19887)); RWKV ([Peng et al., EMNLP Findings 2023, arXiv 2305.13048](https://arxiv.org/abs/2305.13048)); RWKV-7 ([arXiv 2503.14456](https://arxiv.org/abs/2503.14456)).
- *Structural difference:* architecture-aware cost routing, license-typed, receipted.

**Khipu/PURIQ tie-in.** Architecture choice is receipted; long-context SSM keeps `|𝒜|` Bekenstein-feasible cheaply.

**Lean stub.**
```lean
theorem ssm_chosen_when_cheaper (req : Request) :
    req.contextTokens > crossover ∧ req.taskClass ≠ .reasoning →
    (route req).architecture ∈ ({.ssm, .hybrid} : Set Arch) := by sorry
```

---

## 12. Speculative Decoding Across Providers

**Concept.** Use a *fast cheap* model on a *fast provider* (e.g. Llama-3.1-8B on Groq at 840 TPS, or a Cerebras-hosted draft) to **draft** tokens, and a *strong* model to **verify/accept** them — but **across providers**, exploiting each provider's latency/quality sweet spot.

**Why it matters.** Speculative decoding is normally within one engine. Doing it *cross-provider* (Cerebras/Groq drafts → DeepSeek/Qwen verifies) extracts the latency of the fast provider and the quality of the strong model — a cost/latency frontier no single-API product can reach.

**Technical design.**
- Draft model `M_d` (Groq/Cerebras, fast) proposes `k` tokens; target model `M_t` verifies in one forward pass (accept/reject per the speculative-sampling rule, which is *exactly* equivalent in distribution to sampling from `M_t`).
- Cross-provider plumbing: draft request to provider A, verification to provider B; reconcile tokenizers (the hard part — requires shared or aligned vocab; restrict pairs to compatible tokenizers, e.g. Llama-draft → Llama-target, Qwen-draft → Qwen-target).
- Each accept/reject step receipted; correctness is *guaranteed* (speculative sampling preserves the target distribution).

**Cost:** L (cross-provider streaming + tokenizer alignment).

**Competitive landscape.**
- *Closest commercial:* vLLM/TensorRT-LLM speculative decoding (single engine); Groq/Cerebras fast inference (single model). **No product does cross-provider speculative decoding.**
- *Academic precedent:* speculative decoding ([Leviathan et al., ICML 2023, arXiv 2211.17192](https://arxiv.org/abs/2211.17192); Chen et al., "Accelerating LLM Decoding with Speculative Sampling," 2023, arXiv 2302.01318](https://arxiv.org/abs/2302.01318)); Medusa ([Cai et al., 2024, arXiv 2401.10774](https://arxiv.org/abs/2401.10774)).
- *Structural difference:* the draft/verify split spans *providers*, governed and receipted.

**Khipu/PURIQ tie-in.** Each accept step receipted; provider pair recorded in Khipu for cost audit.

**Lean stub.**
```lean
theorem spec_decode_preserves_dist (Md Mt : Model) (x : Context) :
    specSample Md Mt x =ᵈ sample Mt x := by sorry  -- distributional equivalence (Leviathan 2023)
```

---

## 13. Test-Time Compute Scaling Slider

**Concept.** A user-facing slider controls *how much compute to spend* on a single query — mapped to reasoning-token budget (MiniMax-M1 thinking-budget 40k/80k, Reka Flash budget-forcing — `MISSING_LLMS_2026.md` §1.1, §3.2), council size (#2), and self-consistency samples. Every position records its *cost* in the Khipu receipt.

**Why it matters.** Users have wildly different cost/quality needs per query; today they pick a *model tier* once. a11oy.code lets them dial *compute per query* and *see the cost*, turning the o1/o3 "thinking" knob into a transparent, governed, cost-receipted control.

**Technical design.**
- Slider position `s ∈ [0,1]` maps to: `thinking_budget = lerp(0, 80k, s)`, `council_N = ceil(s·5)`, `sc_samples = ceil(s·8)`.
- Uses budget-forcing models (MiniMax-M1, Reka, s1-style — academic below) where the *length* of thinking is directly controllable.
- Cost recorded: `{slider_pos, tokens_spent, usd_spent, latency}` → Khipu receipt; user sees marginal-quality-per-dollar.
- Enforces `A11OY_CODE_ROUTER_SPEC` §1 cost-monotonicity: slider never silently upshifts.

**Cost:** S–M (slider + budget mapping; reuses budget-forcing model knobs).

**Competitive landscape.**
- *Closest commercial:* OpenAI "reasoning_effort" (low/med/high, no cost shown); Anthropic extended-thinking token budget; Gemini thinking. **All offer coarse presets; none shows the per-query cost receipt or maps the slider to council/self-consistency too.**
- *Academic precedent:* test-time compute scaling ([Snell et al., "Scaling Test-Time Compute," 2024, arXiv 2408.03314](https://arxiv.org/abs/2408.03314)); budget forcing / s1 ([Muennighoff et al., "s1: Simple test-time scaling," 2025, arXiv 2501.19393](https://arxiv.org/abs/2501.19393)); STaR/Quiet-STaR (`MISSING_LLMS_2026.md` §3.4).
- *Structural difference:* a *transparent, cost-receipted, governed* compute dial spanning thinking-budget + council + self-consistency.

**Khipu/PURIQ tie-in.** Compute spend is a Khipu cost field; the slider is bounded (Bekenstein on `|𝒜|`).

**Lean stub.**
```lean
theorem slider_cost_monotone (s1 s2 : Float) : s1 ≤ s2 → expectedCost s1 ≤ expectedCost s2 := by sorry
```

---

## 14. a11oy.code as Programmable Kernel

**Concept.** Expose a small **DSL for inference rules** so customers write their *own* routing/governance policy: `when task.class == "legal" and modality == "text" → route Qwen2.5-72B, governance=sovereign, require council>=3`. a11oy.code becomes a *programmable cognition kernel*, not a fixed product.

**Why it matters.** Every other product hard-codes its routing. A DSL lets enterprises encode their compliance/cost policy as *code that the kernel enforces and receipts* — turning a11oy.code into a platform (the Cursor-for-governance moat). This is the "make it our own / unify all of them" directive operationalized.

**Technical design.**
- DSL grammar: `RULE := WHEN <pred> THEN <route_directive>`. Predicates over `{task_class, modality, context_tokens, organ, governance_tier, license_class, budget}`. Directives set `{tier, model_set, council_N, governance_tier, jurisdiction}`.
- Compiles to the deterministic `route()` function (`A11OY_CODE_ROUTER_SPEC` §4) — rules are *added constraints*, never bypass HUKLLA/Yuyay (the gate is non-overridable; a rule can only *tighten*).
- Every rule evaluation is receipted (which rule fired, why). Rules are themselves gate-checked artifacts (a malicious rule that weakens governance is rejected by axis 2/9).

**Cost:** L (DSL + compiler + safety proof that rules can only tighten).

**Competitive landscape.**
- *Closest commercial:* OpenRouter routing prefs (model list, not policy DSL); Portkey/LiteLLM config; LangChain routing (code, not governed DSL). **No product offers a governed inference-policy DSL where rules can only tighten safety and every firing is receipted.**
- *Academic precedent:* policy-as-code ([Open Policy Agent / Rego]); constrained decoding / guided generation ([Willard & Louf, "Outlines," 2023, arXiv 2307.09702](https://arxiv.org/abs/2307.09702)); declarative ML pipelines.
- *Structural difference:* a DSL whose rules *provably cannot weaken* the gate (monotone tightening), each firing receipted.

**Khipu/PURIQ tie-in.** Rules tighten `𝒜`; non-override of HUKLLA/Yuyay is a Lean invariant.

**Lean stub.**
```lean
theorem dsl_rules_only_tighten (r : Rule) (A : ActionSpace) :
    apply r A ⊆ A ∧ hukla_gate (apply r A) = hukla_gate A := by sorry
```

---

## 15. Per-Organ Voice Cloning

**Concept.** Each organ speaks with a *distinct, consistent voice* in audio output — Amaru (governance), Yuyay (cognition), Killinchu (maritime) each have their own cloned timbre via open voice models (Coqui XTTS-v2, OpenVoice). The anatomy becomes *audible*.

**Why it matters.** Multi-agent products are textual and faceless. Giving each organ a recognizable voice makes the anatomy tangible in demos (Warhacker, investors) and accessible (audio-first); it is the audio complement to Anatomy-Routed Cognition (#6) and the 3D viz.

**Technical design.**
- Assign each organ a reference voice; synthesize organ utterances via **Coqui XTTS-v2** (open, multilingual, zero-shot clone) or **OpenVoice v2** (open, MIT). Both run on-device → fits sovereign/on-prem.
- The voice is selected by the organ-path receipt (#6): when amaru speaks, amaru's voice; the TTS call is receipted (which voice, which text — and the text already cleared the gate).
- Quechua-language voices (ties to Deep Innovation #4 Quechua RLHF + language preservation) — XTTS supports cross-lingual cloning.

**Cost:** S–M (open TTS integration + per-organ reference voices).

**Competitive landscape.**
- *Closest commercial:* ChatGPT Advanced Voice (one voice set), ElevenLabs (cloning, not organ-bound), Gemini Live. **No product binds distinct cloned voices to named governance organs.**
- *Academic precedent:* zero-shot voice cloning ([Casanova et al., "YourTTS," ICML 2022, arXiv 2112.02418](https://arxiv.org/abs/2112.02418)); XTTS ([Coqui XTTS technical report]); OpenVoice ([Qin et al., 2023, arXiv 2312.01479](https://arxiv.org/abs/2312.01479)).
- *Structural difference:* voice is *bound to a governance organ* and gated, not a TTS preset.

**Khipu/PURIQ tie-in.** Voice selection follows the organ-path receipt (#6); ties to Hatun-Willay narrative + Quechua preservation ethos.

**Lean stub.** N/A (output rendering; relies on gate for content).

---

## Priority ranking (feeds A11OY_CODE_PATCH_PLAN top-7)

| Rank | Innovation | Cost | Leverage rationale |
|---|---|---|---|
| 1 | #4 Sovereignty-Selectable Inference | M | direct defense/regulated wedge; reuses license machinery; provable |
| 2 | #1 Khipu-Signed Reasoning Chains | M | the core auditability moat; receipt plumbing exists |
| 3 | #8 PURIQ Action Pre-Auth | S–M | cheap, high-trust, compliance-required, ships fast |
| 4 | #11 Hybrid SSM+Transformer Routing | M | structural cost advantage at scale; models catalogued |
| 5 | #6 Anatomy-Routed Cognition | M | the visible UX of the whole thesis; wires to 3D viz |
| 6 | #13 Test-Time Compute Slider | S–M | transparent cost control; reuses budget-forcing models |
| 7 | #2 PURIQ-Gated Multi-Model Council | M | governed diversity; Nemotron-Reward judge ready |

Deeper / longer-horizon: #10 (Lake-verified, L), #5 (Unay memory, L), #14 (DSL kernel, L), #12 (cross-provider spec-decode, L), #9 (ZK federation, XL). Always-cheap polish: #7 (Hatun-Willay wrapper, S), #15 (per-organ voice, S–M).

---
*Signed: Yachay — 2026-06-01. No bandaid, no mysticism. Each innovation cites its closest commercial precedent and the academic paper establishing the technique. Doctrine v11 LOCKED numbers preserved. Specs only — nothing pushed to HF/GitHub.*
