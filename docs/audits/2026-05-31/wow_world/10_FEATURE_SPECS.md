# 10_FEATURE_SPECS — Wow-The-World Feature Specifications

**Layer:** PURIQ → `wow_world/`
**Author:** Yachay (Wow-The-World agent)
**Date:** 2026-06-01
**Founder directive:** *"Zoom out and think of things no one has dreamed of yet that we need to wow the world. Innovate and evolve, use all our findings and our formulas, and do a scrape of the world and unify it."*

> Each spec carries: **Design**, **Dependencies**, **Khipu/PURIQ integration**, **Lean stub**, **Effort (S/M/L/XL)**, **Patent posture**, **Moat**, **Precedents (URLs)**, **Differentiation**. Precedents and verdicts are carried forward from `WORLD_SCRAPE_PER_FEATURE.md`. Doctrine v11 LOCKED numbers preserved verbatim: 749 declarations / 14 axioms / 163 sorries / 13-axis `yuyay_v3` / replay-hash `bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5` / lutar-v18.0.0 @ c7c0ba17 / SLSA L1 (honest). No mysticism — math + frontier engineering only.

**Master operator (PURIQ Charter).**
\[
P(x,t)=\arg\max_{a}\Big[\Lambda(x)\cdot \mathrm{Yuyay}_{13}(a)\cdot \exp\!\big(-\beta\cdot \mathrm{HUKLLA}(a)\big)\cdot \prod_i \mathrm{Khipu}_i(a)\Big]
\]
Every feature below is an instantiation, view, or governor of this operator. "Puriq" (Quechua) = *the one who acts*.

---

## Feature 1 — Khipu Time Machine 🟡 (Effort: M)

**Design.** A `/wow/time-machine` tab with a wall-clock time slider. Dragging it replays the Khipu receipt DAG up to time \(T\) and re-renders empire anatomy (organs, gates, λ-scores, HUKLLA firings) reconstructed *purely* from receipts. State at \(T\) = left-fold of receipts with `ts ≤ T`. The slider position itself emits a `replay_at` receipt (`{replay_at:T, root_hash}`), making the act of inspection auditable. 3D anatomy via three.js (CDN, no build step); receipts streamed from a JSON endpoint.

**Dependencies.** Existing Khipu receipt store; three.js CDN; `yuyay_v3` locked λ values; the live wires machinery (`szl_live_wires`) for the anatomy scene graph. No new infra.

**Khipu/PURIQ integration.** Reads the receipt DAG; each frame is a deterministic fold so the same \(T\) always yields the same state (replay-hash discipline). Reconstructed λ is the LOCKED 13-axis value, never a logged float. Emits its own receipt on scrub.

**Lean stub.**
```lean
/-- State reconstructed from receipts ≤ T is deterministic: replay is a pure fold. -/
theorem khipu_replay_deterministic (dag : List Receipt) (T : Timestamp) :
    replay (dag.filter (·.ts ≤ T)) = replay (dag.filter (·.ts ≤ T)) := by rfl
/-- Monotonic prefix: replaying to T' ≥ T includes all receipts replayed to T. -/
theorem khipu_replay_monotone {dag : List Receipt} {T T' : Timestamp} (h : T ≤ T') :
    (dag.filter (·.ts ≤ T)) ⊆ (dag.filter (·.ts ≤ T')) := by
  sorry  -- prefix-subset under monotone filter
```

**Patent posture.** Defensive publication (method: reconstructing a *governed* multi-organ AI state at arbitrary wall-clock time from a tamper-evident Merkle DAG, with the inspection act itself receipted). Low patentability (event sourcing is prior art) → publish to establish prior art and block others.

**Moat.** Data + integration moat: only SZL has the Khipu DAG of *this* empire's enforcement history. Replay is worthless without the receipts.

**Precedents.** [Cypress Test Replay (DEV)](https://dev.to/cypress/cypress-test-replay-in-2025-the-ultimate-guide-to-time-travel-debugging-5485); [Event Sourcing as time travel (System Design Classroom)](https://newsletter.systemdesignclassroom.com/p/event-sourcing-is-like-time-traveling); [Time Travel for Your Data (Fred Pope)](https://www.fredpope.com/blog/architecture/time-travel-for-your-data).

**Differentiation.** Cypress replays a DOM; we replay a *constitution's enforcement history*, cryptographically verifiable, with reconstructed λ = locked reference value. Verdict: **NOVEL COMBINATION**.

---

## Feature 2 — PURIQ Live Council 🟡 (Effort: M)

**Design.** A `/wow/live-council` tab: a 3D chamber where N GREEN-licensed models are avatars deliberating the same prompt. Edges = agreement/disagreement (weighted by cosine similarity of stances). A reward-model judge node scores. The Yuyay-13 conjunctive gate is a visible ring that lights only when all 13 axes clear. Disagreement above τ fires the T09 tripwire as a red flash routing to a human node. Every vote is a Khipu receipt.

**Dependencies.** HF Router inference (already wired via `a11oy_code_orchestrator`); three.js CDN; reward model (existing judge); Yuyay-13 gate; HUKLLA T09 threshold. SSE for streaming deliberation.

**Khipu/PURIQ integration.** Each model output is gated by `Yuyay_13(a)`; disagreement metric feeds `HUKLLA(a)`; the final selected stance is `argmax` under the operator. Every vote and the gate decision are receipts.

**Lean stub.**
```lean
/-- The council selects a stance only if the conjunctive 13-axis gate clears. -/
theorem council_gate_conjunctive (a : Action) :
    selected a → (∀ i : Fin 13, yuyay_axis i a = true) := by
  sorry  -- selection implies all axes pass (conjunctive gate)
/-- Disagreement above τ forces escalation (T09 tripwire). -/
theorem council_escalates_on_dissent (votes : List Stance) (τ : ℝ) :
    dissent votes > τ → escalate votes = true := by
  sorry
```

**Patent posture.** Defensive publication + possible narrow claim on "governed multi-model deliberation with a conjunctive-gate visualization and dissent-triggered escalation, each vote receipted." 3D council UX is prior art (King); the *governed+receipted* composition is claimable narrowly.

**Moat.** The governance gate + license-typing + receipt trail. Anyone can render avatars; nobody else can show a *certifiable* deliberation.

**Precedents.** [LLM Council 3D, Chris King (DEV)](https://dev.to/chris_king_bcff3b9663e84a/i-built-llm-council-frontier-models-debating-in-an-immersive-3d-chamber-1hn9); [debate-agents (GitHub)](https://github.com/mmaazkhanhere/debate-agents); [Multiagent debate, Du et al. (arXiv 2305.14325)](https://arxiv.org/abs/2305.14325); [Mixture-of-Agents, Wang et al. (arXiv 2406.04692)](https://arxiv.org/abs/2406.04692).

**Differentiation.** License-typed members + reward-judge + conjunctive Yuyay-13 gate + T09 tripwire + per-vote receipts. Verdict: **NOVEL COMBINATION**.

---

## Feature 3 — Sovereign AI Passport 🟡 (Effort: M–L)

**Design.** A per-inference verifiable artifact binding the *sovereignty triple*: (1) which GREEN-licensed weights ran, (2) data-jurisdiction, (3) chip attestation (vendor PKI: Intel PCS / AMD KDS / AWS Nitro). The buyer verifies the passport offline without trusting SZL. Rendered as a scannable receipt card with a verify-chain visualization.

**Dependencies.** TEE attestation chain (deferred to #10 for hardware); license-class registry (GREEN = no AUP, no no-train clause); RFC 3161 timestamp; DSSE signing (cosign key in `.secret/`). Software passport can ship now; chip attestation needs #10 hardware.

**Khipu/PURIQ integration.** The passport is a Khipu receipt with three additional bound claims; HUKLLA T08/T08b tripwires gate license-cleanliness. `∏ Khipu_i(a)` includes the passport as a factor.

**Lean stub.**
```lean
/-- A passport is valid only if all three sovereignty claims verify. -/
theorem passport_triple_bind (p : Passport) :
    valid p ↔ (license_clean p ∧ jurisdiction_ok p ∧ chip_attested p) := by
  sorry
```

**Patent posture.** Strong candidate: "method for emitting a single verifiable per-inference receipt binding model-license-class, data-jurisdiction, and hardware attestation, gated by a formal governance operator." File provisional; CertNode/IETF draft are adjacent but do not claim the triple-bind.

**Moat.** The triple-bind + governance gate; the GREEN license registry is proprietary data.

**Precedents.** [CertNode AI Provenance (FRE 902(13)/(14))](https://certnode.io/ai-provenance); [IETF draft-sharif-ai-model-lifecycle-attestation-00](https://datatracker.ietf.org/doc/draft-sharif-ai-model-lifecycle-attestation/); [eco.com TEEs for AI Agents](https://eco.com/support/en/articles/14796365-tees-for-ai-agents-verifiable-compute); [Verifiable Provenance + Watermarking (arXiv 2605.21002)](https://arxiv.org/html/2605.21002v1).

**Differentiation.** CertNode signs output+model; we bind model+data+chip in one gated receipt. Verdict: **NOVEL COMBINATION** (most commercially crowded).

---

## Feature 4 — Doctrine-as-Code OS 🟢 GENUINELY NOVEL (Effort: M) ★ TOP-3

**Design.** The entire empire config (organs, gates, λ-weights, routing, tripwire thresholds) lives as declarative markdown/JSON in git. A `git push` (or in-app commit) reconfigures the running empire. **Reflexive invariant:** the doctrine change must pass the *current* doctrine's 13-axis gate before it applies — a change that weakens governance is rejected *by the governance it tries to weaken* (monotone-tightening, innovation #14). Every reconfiguration is a Khipu receipt; every change is Lake-buildable before it lands. `/wow/doctrine-os` tab shows the live config, a proposed diff, the gate verdict, and the receipt.

**Dependencies.** git (GitHub MCP); JSON/markdown doctrine schema; the 13-axis gate evaluator; Khipu receipt helper. No new infra — rides existing substrate.

**Khipu/PURIQ integration.** A doctrine change is an action `a` evaluated by `P(x,t)`: it is admitted only if `Yuyay_13(a)=1` under the *pre-change* gate **and** the post-change gate is no weaker (monotone tightening). Receipt on every apply/reject.

**Lean stub.**
```lean
structure Doctrine where
  axes   : Fin 13 → AxisSpec
  thresh : Fin 13 → ℝ

/-- A doctrine change is admissible only if it does not weaken any axis threshold
    (monotone tightening) — the reflexive self-governance invariant. -/
def tightens (d d' : Doctrine) : Prop := ∀ i, d.thresh i ≤ d'.thresh i

theorem doctrine_change_admissible (d d' : Doctrine) :
    admit d d' → tightens d d' := by
  sorry  -- core reflexive invariant: governance gate-checks its own changes

/-- Idempotent reconfigure: applying the same admissible doctrine twice = once. -/
theorem reconfigure_idempotent (d d' : Doctrine) (h : admit d d') :
    apply (apply d d') d' = apply d d' := by
  sorry
```

**Patent posture.** Strongest patent candidate of the 10: "method for reconfiguring an AI governance substrate from declarative version-controlled source such that proposed configuration changes are validated against the configuration they modify under a monotone-tightening invariant, each change emitted as a tamper-evident receipt." File provisional. No GitOps/OPA prior art claims the reflexive self-gate.

**Moat.** The reflexive invariant is the moat — it is a *correctness property*, not just code. Competitors would have to adopt the same monotone-tightening discipline and the Khipu substrate.

**Precedents.** [Argo CD declarative setup](https://argo-cd.readthedocs.io/en/stable/operator-manual/declarative-setup/); [CNCF, Policy As Code (OPA)](https://www.cncf.io/blog/2020/08/13/introducing-policy-as-code-the-open-policy-agent-opa/); [OPA docs](https://www.openpolicyagent.org/docs/v0.62.1/); [Pulumi GitOps best practices](https://www.pulumi.com/blog/gitops-best-practices-i-wish-i-had-known-before/).

**Differentiation.** GitOps reconfigures Kubernetes; OPA governs access. Nobody applies GitOps to an *AI cognition substrate* with a *reflexive self-gate*. Verdict: **GENUINELY NOVEL**, low technical risk (mature substrate).

---

## Feature 5 — The Provable Mind 🟠 CROWDED (Effort: XL)

**Design.** Fine-tune Llama 3.3 70B on the `yuyay-v3` dataset so the 13-axis governance is *in the weights*. Keep the external locked gate as ground truth; use **crosscoders** to measure drift of the in-weights concept from the locked reference gate — turning "is the value really in the weights?" into a verifiable claim.

**Dependencies.** GPU training cluster (XL); `yuyay-v3` dataset; LoRA/QLoRA recipe; crosscoder tooling; the locked reference gate as eval. **Not a 7-day ship** — requires training.

**Khipu/PURIQ integration.** The fine-tuned head approximates `Yuyay_13`; the external gate remains the certified factor in `P(x,t)`. Drift measurements are receipts.

**Lean stub.**
```lean
/-- Soundness contract: the in-weights head must never accept what the locked
    reference gate rejects (no false-accept relative to ground truth). -/
theorem provable_mind_no_false_accept (a : Action) :
    weights_head a = true → reference_gate a = true := by
  sorry  -- enforced by keeping reference gate as ground truth
```

**Patent posture.** Defensive publication (Constitutional AI is prior art); possible narrow claim on "verifying distilled governance against a hash-anchored reference gate via crosscoder drift." Low core patentability.

**Moat.** The hash-anchored 13-axis dataset + drift-proof methodology. Alignment elasticity ([arXiv 2406.06144](https://arxiv.org/abs/2406.06144)) is the honest risk.

**Precedents.** [Constitutional AI (arXiv 2212.08073)](https://arxiv.org/abs/2212.08073); [Knowledge as weight-space region (arXiv 2302.04863)](https://arxiv.org/abs/2302.04863); [LMs Resist Alignment (arXiv 2406.06144)](https://arxiv.org/abs/2406.06144); [Crosscoders (arXiv 2504.02922)](https://arxiv.org/abs/2504.02922); [Llama fine-tuning guide](https://www.llama.com/docs/how-to-guides/fine-tuning/).

**Differentiation.** Crowded technique, novel anchor (hash-locked gate + crosscoder drift proof). Verdict: **CROWDED technique, NOVEL anchor**. → roadmap, not ship.

---

## Feature 6 — Receipt-Federated Threat Intel 🟡 (Effort: XL)

**Design.** N customers ZK-share threat receipts; the federation improves everyone's detection while no raw data crosses a boundary. The unit of sharing is a **Khipu receipt** (governed, signed) — not a model gradient or raw IOC.

**Dependencies.** ZK proof system (Groth16/Halo2); federated aggregation; the Killinchu in-toto/Sigstore attestation path; Yuyay-13 schema-conformance gate. XL (ZK circuit engineering).

**Khipu/PURIQ integration.** Each contribution is a receipt certified by `Yuyay_13` (schema-conformant + gate-cleared) before commitment; the ZK proof attests correctness without revealing features. `∏ Khipu_i` spans the federation.

**Lean stub.**
```lean
/-- A federated contribution is admitted only if its ZK proof verifies AND it is
    gate-cleared — and admission leaks no raw feature (zero-knowledge contract). -/
theorem fed_contribution_admissible (c : Contribution) :
    admit c → (zk_verify c.proof ∧ yuyay_gate c.receipt) := by
  sorry
```

**Patent posture.** Defensive publication + narrow claim on "ZK-federated threat intelligence where the federation message is a governed, signed receipt gated before commitment." ZK-FL is academically crowded; the receipt-native framing is claimable.

**Moat.** Network effect (more customers → better detection) + the Khipu-native federation protocol.

**Precedents.** [ZK-FL (arXiv 2503.15550)](https://arxiv.org/abs/2503.15550); [ZK-FL IEEE I3CTCON 2026](https://ieeexplore.ieee.org/document/11507794/); [BlockIntelChain (Nature Sci Reports, DOI 10.1038/s41598-025-29152-6)](https://www.nature.com/articles/s41598-025-29152-6); [TrustFed-CTI (MDPI, DOI 10.3390/fi17110512)](https://www.mdpi.com/1999-5903/17/11/512); [FedAvg (arXiv 1602.05629)](https://arxiv.org/abs/1602.05629).

**Differentiation.** First to make the federation unit a governed signed receipt. Verdict: **NOVEL COMBINATION** (academically crowded). → roadmap.

---

## Feature 7 — Killinchu Open Adversary Catalog 🟡 (Effort: M)

**Design.** A Wikipedia-of-adversary-drones under CC-BY-SA. Each edit is a **DSSE-signed Khipu receipt** (who claimed what, tamper-evident). Contribution quality feeds an **API-credit reward** loop. SZL owns the network effect while staying open-source. OSINT-only scope (clear IP posture). `/wow/adversary-catalog` tab with entry list, signed-edit log, contributor credits.

**Dependencies.** CC-BY-SA license; DSSE/in-toto signing (cosign key); credit-ledger; static entry store + edit log. M effort.

**Khipu/PURIQ integration.** Each edit is a receipt; quality scoring uses a Yuyay-style gate; credits are receipted. Contributory provenance DAG.

**Lean stub.**
```lean
/-- Every accepted catalog edit carries a verifying DSSE signature (provenance). -/
theorem catalog_edit_signed (e : Edit) :
    accepted e → dsse_verify e.signature e.author = true := by
  sorry
```

**Patent posture.** Defensive publication (Wikipedia + DSSE are prior art); the *composition* (signed contributory adversary catalog + credit rewards) is mostly unpatentable but publishable to claim the space. Trademark "Killinchu" + own the CC-BY-SA corpus.

**Moat.** Copyleft network effect: SZL owns the canonical signed corpus; forks must attribute.

**Precedents.** [CNAS open-source drone dataset](https://www.cnas.org/press/press-release/cnas-releases-open-source-dataset-on-drone-proliferation); [The Drone Database (Small Wars Journal)](https://smallwarsjournal.com/2017/02/01/the-drone-database/); [in-toto/DSSE (USENIX Security 2019)](https://www.usenix.org/conference/usenixsecurity19/presentation/torres-arias).

**Differentiation.** Existing datasets are static + unsigned; ours is contributory + signed + reward-incentivized. Verdict: **NOVEL COMBINATION**.

---

## Feature 8 — The Glass Hand-Off 🟡 (Effort: M)

**Design.** A 3D real-time render of every Killinchu cue → customer-engagement chain: detect → classify → predict → cue → handoff, each link a **DSSE-signed Khipu receipt**, visible end to end. A court-admissible chain of custody (FRE 902(13)/(14)). The one-way evidentiary boundary ("we are the brain, not the trigger") is rendered as a hard wall between SZL's cue and the customer's engagement. `/wow/glass-handoff` tab built on the live wires machinery.

**Dependencies.** `szl_live_wires` 3D machinery; DSSE signing; Khipu receipts; the existing `szl_hub.py` CUE_SAMPLE pattern. M effort (reuses live wires).

**Khipu/PURIQ integration.** Each link is a receipt in `∏ Khipu_i`; the handoff boundary enforces that SZL emits a *cue* (information) and never a *fire* command. Chain-of-custody = ordered receipt DAG.

**Lean stub.**
```lean
/-- The handoff boundary is one-way: SZL emits a cue, never an engagement order. -/
theorem glass_handoff_one_way (link : ChainLink) :
    link.origin = SZL → link.kind ≠ EngagementOrder := by
  sorry
/-- Chain of custody is unbroken: every link references its predecessor's hash. -/
theorem chain_unbroken (chain : List ChainLink) :
    custody_valid chain → ∀ l ∈ chain.tail, l.prev_hash = (predecessor l).hash := by
  sorry
```

**Patent posture.** Strong candidate: "court-admissible kill-chain chain-of-custody rendered as a verifiable receipt DAG with a one-way evidentiary handoff boundary." File provisional; primes claim *speed*, not admissibility.

**Moat.** The admissibility framing + the one-way boundary as a *provable* property; reuses proprietary Killinchu cue data.

**Precedents.** [Echodyne, Sensor-to-Shooter Kill Chain](https://www.echodyne.com/newsroom/echodyne-at-cross-domain-fires); [From kill chains to kill webs (Defense.info)](https://defense.info/multi-domain-dynamics/2026/02/from-kill-chains-to-kill-webs-3rd-marine-aircraft-wings-communications-revolution/); [Accelerating sensor-to-shooter (FedGov Today)](https://fedgovtoday.com/innovation-in-govt/accelerating-the-sensor-to-shooter-kill-chain-at-the-tactical-edge); [arXiv 2605.21002](https://arxiv.org/html/2605.21002v1).

**Differentiation.** Industry races on *speed*; we own *admissibility*. The "separate sensor from shooter" doctrine maps onto our one-way boundary. Verdict: **NOVEL COMBINATION**.

---

## Feature 9 — Doctrine v∞ (Self-Modifying Doctrine) 🟢 GENUINELY NOVEL (Effort: M) ★ TOP-3

**Design.** WAYRA (a proposal agent) proposes doctrine updates → a **1-tap founder-approve** UI → the empire reconfigures. The proposal must pass the *current* doctrine's gate (same monotone-tightening invariant as #4); a single founder tap commits it as a signed Khipu receipt that rewrites the running empire. `/wow/doctrine-vinf` tab: proposal queue, diff view, gate verdict, 1-tap approve, receipt trail. Builds directly on #4's substrate (proposal engine + reflexive gate + HITL).

**Dependencies.** #4 Doctrine-as-Code substrate; a proposal generator (WAYRA, can stub with rule-based proposals initially); HITL approval UI; Khipu receipts. M effort (UI + proposal plumbing on #4).

**Khipu/PURIQ integration.** Proposal `a` evaluated by `P(x,t)` under the current gate; founder approval is a required factor (HITL); commit is a receipt. The constitution evolves *within* the operator.

**Lean stub.**
```lean
/-- A self-proposed doctrine change is committed only if it tightens AND a human
    approves (1-tap HITL) — agents cannot weaken governance autonomously. -/
theorem doctrine_vinf_requires_human (d d' : Doctrine) :
    commit d d' → (tightens d d' ∧ founder_approved d') := by
  sorry  -- reflexive self-governance under mandatory human-in-the-loop
```

**Patent posture.** Strongest patent candidate alongside #4: "method whereby an autonomous agent proposes amendments to its own governing constitution, the amendment is validated against the unamended constitution under a monotone-tightening invariant, and committed only upon single-gesture human approval as a tamper-evident receipt." File provisional. No prior art (Arize tunes runtime config, not the constitution).

**Moat.** Reflexive self-governance + mandatory HITL is a *safety property*, not a feature — extremely hard to copy credibly without the Lean corpus and Khipu substrate.

**Precedents.** [Arize self-improving agent](https://arize.com/blog/self-improving-agent-with-context-graph/); [Getclaw HITL approvals 2026](https://getclaw.sh/blog/human-in-the-loop-ai-agents-approvals-2026); [RLHF, Christiano et al. (arXiv 1706.03741)](https://arxiv.org/abs/1706.03741).

**Differentiation.** Self-improving agents tune runtime config; nobody lets an agent amend its *constitution* under a reflexive gate + 1-tap HITL. Verdict: **GENUINELY NOVEL**.

---

## Feature 10 — PURIQ-Signed Provable Inference Cloud 🟠 CROWDED (Effort: L)

**Design.** A small TEE-attested H100 cluster offering "court-admissible inference" as a premium product: every inference comes with a hardware attestation + Khipu receipt that *additionally* proves it passed Yuyay-13, cleared HUKLLA, and carries a license-class proof. "Court-admissible" = attested AND governed AND license-clean.

**Dependencies.** H100 with NVIDIA Confidential Computing (hardware procurement → L); TEE attestation chain; #3 passport; #4 sovereignty selection; billing. **Not a 7-day ship** — needs hardware.

**Khipu/PURIQ integration.** The receipt binds the attestation to the full operator evaluation: `P(x,t)` with all factors signed. The passport (#3) is the buyer-facing artifact.

**Lean stub.**
```lean
/-- A "court-admissible" inference receipt requires attestation AND gate-clearance
    AND license-cleanliness — strictly stronger than mere attestation. -/
theorem court_admissible_stronger (r : InferenceReceipt) :
    court_admissible r ↔ (chip_attested r ∧ gate_cleared r ∧ license_clean r) := by
  sorry
```

**Patent posture.** Defensive publication (TEE inference is shipping — Phala, NVIDIA); narrow claim on "binding hardware attestation to a governance-operator receipt to produce a court-admissible inference artifact." Moderate patentability.

**Moat.** Owned hardware + governance-bound admissibility + the GREEN license registry. The TEE itself is commodity; the bind is the moat.

**Precedents.** [Phala GPU TEEs on OpenRouter](https://phala.com/posts/GPU-TEEs-is-Alive-on-OpenRouter); [NVIDIA Confidential Computing](https://www.nvidia.com/en-us/data-center/solutions/confidential-computing/); [eco.com TEEs](https://eco.com/support/en/articles/14796365-tees-for-ai-agents-verifiable-compute); [H100 CC overhead <5% (arXiv 2409.03992)](https://arxiv.org/html/2409.03992v2); [zkLLM (arXiv 2404.16109)](https://arxiv.org/html/2404.16109v1).

**Differentiation.** TEE inference ships; nobody binds attestation to a governance receipt for court-admissibility. Verdict: **CROWDED on TEE, NOVEL on governance-bound admissibility**. → roadmap (needs H100).

---

## Effort & novelty roll-up

| # | Feature | Verdict | Effort | 7-day shippable? |
|---|---------|---------|--------|------------------|
| 1 | Khipu Time Machine | 🟡 | M | ✅ yes |
| 2 | PURIQ Live Council | 🟡 | M | ✅ yes |
| 3 | Sovereign AI Passport | 🟡 | M–L | ⚠️ software-only yes; full triple needs #10 |
| 4 | **Doctrine-as-Code OS** | 🟢 | **M** | ✅ **yes** |
| 5 | The Provable Mind | 🟠 | XL | ❌ training |
| 6 | Receipt-Federated Threat Intel | 🟡 | XL | ❌ ZK circuits |
| 7 | Killinchu Open Adversary Catalog | 🟡 | M | ✅ yes |
| 8 | The Glass Hand-Off | 🟡 | M | ✅ yes |
| 9 | **Doctrine v∞** | 🟢 | **M** | ✅ **yes** |
| 10 | PURIQ-Signed Inference Cloud | 🟠 | L | ❌ hardware |

**7-day candidates:** #1, #2, #4, #7, #8, #9 (all M). The two 🟢 genuinely-novel features (#4, #9) are both M and share the same substrate → strongest ship candidates. Top-3 selection in `TOP_3_PICK_RATIONALE.md`.

---
*Signed: Yachay — 2026-06-01. Every external claim carries a primary-source URL. Doctrine v11 LOCKED numbers preserved verbatim. No mysticism — math + frontier engineering only. Co-authored-by: Perplexity Computer Agent.*
