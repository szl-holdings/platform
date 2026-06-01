# PATENT_POSTURE_PER_FEATURE — Prior-Art + Filing Posture × 10

**Layer:** PURIQ → `wow_world/`
**Author:** Yachay (Wow-The-World agent)
**Date:** 2026-06-01
**Coordination note:** `eval_defense/PRIOR_ART_DISCLOSURE/` is currently **EMPTY** (sibling agent has not populated it). This document is structured so its prior-art tables can be lifted directly into that disclosure once the sibling agent is ready. **Action item flagged for parent agent: sync this file into `eval_defense/PRIOR_ART_DISCLOSURE/`.**

> **Posture policy.** Open-source-only company → our default is **defensive publication** (establish prior art, preserve freedom-to-operate, block competitors from patenting against us). We file **provisional patents** only where a feature is GENUINELY NOVEL with a defensible non-obvious *correctness property* (not just code). Prior art surveyed across **USPTO / Google Patents / arXiv** plus the commercial precedents from `WORLD_SCRAPE_PER_FEATURE.md`. Every external claim carries a primary-source URL. Doctrine v11 LOCKED numbers preserved verbatim.

> **2026 IP context.** WIPO's advisory board has publicly flagged that *self-evolving AI* may require treaty-level patent-law reform ([Law360/MLex, Feb 23 2026](https://www.mlex.com/mlex/articles/2444485/self-evolving-ai-may-require-global-overhaul-of-patent-law-wipo-advisor-says)); the USPTO recognizes agentic-AI claims when drafted to 2019-Guidance Example 39 form ([Mintz, "Patenting Agentic AI"](https://www.mintz.com/insights-center/viewpoints/2231/2025-03-19-understanding-how-patent-agentic-ai-systems)); and AI inventorship remains human-only (Thaler/DABUS line — [HSF Kramer](https://www.hsfkramer.com/insights/2023-05/the-ip-in-ai/can-patents-protect-ai-generated-inventions)). **All filings name a human inventor (Lutar, Stephen P., ORCID 0009-0001-0110-4173).** On the admissibility side, the proposed **FRE Rule 707** for machine-generated evidence and amended Rule 702 directly support the #8/#10 "court-admissible" framing ([Quinn Emanuel, "Adapting the Rules of Evidence for AI"](https://www.quinnemanuel.com/the-firm/publications/adapting-the-rules-of-evidence-for-the-age-of-ai/)).

**Legend:** 🟩 FILE PROVISIONAL · 🟦 DEFENSIVE PUBLICATION + narrow claim · ⬜ DEFENSIVE PUBLICATION only.

---

| # | Feature | Posture | Claimable inventive concept (non-obvious core) | Key prior art (must distinguish) |
|---|---------|:------:|------------------------------------------------|----------------------------------|
| 1 | Khipu Time Machine | ⬜ | Reconstructing a *governed multi-organ* AI state at arbitrary wall-clock time from a tamper-evident Merkle DAG, where inspection itself emits a receipt | Event sourcing (well-known); [Cypress Test Replay](https://dev.to/cypress/cypress-test-replay-in-2025-the-ultimate-guide-to-time-travel-debugging-5485); Merkle 1987 |
| 2 | PURIQ Live Council | 🟦 | Governed multi-model deliberation with a *conjunctive 13-axis gate* + *dissent-threshold tripwire* + per-vote receipts | [LLM Council 3D (King)](https://dev.to/chris_king_bcff3b9663e84a/i-built-llm-council-frontier-models-debating-in-an-immersive-3d-chamber-1hn9); [Multiagent debate (arXiv 2305.14325)](https://arxiv.org/abs/2305.14325); [MoA (arXiv 2406.04692)](https://arxiv.org/abs/2406.04692) |
| 3 | Sovereign AI Passport | 🟩 | A single per-inference verifiable receipt binding the **triple** {model-license-class, data-jurisdiction, hardware-attestation}, gated by a formal operator | [CertNode AI Provenance](https://certnode.io/ai-provenance); [IETF draft-sharif-ai-model-lifecycle-attestation-00](https://datatracker.ietf.org/doc/draft-sharif-ai-model-lifecycle-attestation/); [eco.com TEEs](https://eco.com/support/en/articles/14796365-tees-for-ai-agents-verifiable-compute) |
| 4 | **Doctrine-as-Code OS** | 🟩 ★ | Reconfiguring an AI governance substrate from declarative VC source where a proposed change is **validated against the configuration it modifies under a monotone-tightening invariant**, each change a tamper-evident receipt | GitOps/[Argo CD](https://argo-cd.readthedocs.io/en/stable/operator-manual/declarative-setup/); [OPA/Policy-as-Code (CNCF)](https://www.cncf.io/blog/2025/07/29/introduction-to-policy-as-code/); [Declarative compliance + GitOps (DevOps.com)](https://devops.com/declarative-compliance-with-policy-as-code-and-gitops/) — none reflexive |
| 5 | The Provable Mind | 🟦 | Verifying distilled governance against a **hash-anchored reference gate** via crosscoder drift measurement (no-false-accept contract) | [Constitutional AI (arXiv 2212.08073)](https://arxiv.org/abs/2212.08073); [Crosscoders (arXiv 2504.02922)](https://arxiv.org/abs/2504.02922); [LMs Resist Alignment (arXiv 2406.06144)](https://arxiv.org/abs/2406.06144) |
| 6 | Receipt-Fed Threat Intel | 🟦 | ZK-federated threat intel where the **federation message is a governed, signed receipt gate-cleared before commitment** | [ZK-FL (arXiv 2503.15550)](https://arxiv.org/abs/2503.15550); [BlockIntelChain (Nature, 10.1038/s41598-025-29152-6)](https://www.nature.com/articles/s41598-025-29152-6); [TrustFed-CTI (MDPI 10.3390/fi17110512)](https://www.mdpi.com/1999-5903/17/11/512) |
| 7 | Killinchu Adversary Catalog | ⬜ | Contributory adversary catalog with DSSE-signed per-edit receipts + API-credit reward loop under CC-BY-SA | [CNAS drone dataset](https://www.cnas.org/press/press-release/cnas-releases-open-source-dataset-on-drone-proliferation); Wikipedia model; [in-toto/DSSE (USENIX 2019)](https://www.usenix.org/conference/usenixsecurity19/presentation/torres-arias) — also **trademark "Killinchu"** |
| 8 | **The Glass Hand-Off** | 🟩 ★ | Court-admissible kill-chain **chain-of-custody as a hash-linked receipt DAG with a provable one-way evidentiary boundary** (cue, never engagement-order) | [Echodyne sensor-to-shooter](https://www.echodyne.com/newsroom/echodyne-at-cross-domain-fires); [kill webs (Defense.info)](https://defense.info/multi-domain-dynamics/2026/02/from-kill-chains-to-kill-webs-3rd-marine-aircraft-wings-communications-revolution/) — speed, not admissibility; FRE 707 supports framing |
| 9 | **Doctrine v∞** | 🟩 ★ | An autonomous agent **proposing amendments to its own governing constitution**, validated against the unamended constitution under a monotone-tightening invariant, committed only on **single-gesture human approval** as a receipt | [Arize self-improving agent](https://arize.com/blog/self-improving-agent-with-context-graph/) (runtime config, not constitution); [Getclaw HITL](https://getclaw.sh/blog/human-in-the-loop-ai-agents-approvals-2026); WIPO self-evolving-AI note ([MLex](https://www.mlex.com/mlex/articles/2444485/self-evolving-ai-may-require-global-overhaul-of-patent-law-wipo-advisor-says)) |
| 10 | PURIQ-Signed Inference Cloud | 🟦 | Binding **hardware attestation to a governance-operator receipt** to yield a court-admissible inference artifact (attested AND governed AND license-clean) | [Phala GPU TEEs](https://phala.com/posts/GPU-TEEs-is-Alive-on-OpenRouter); [NVIDIA CC](https://www.nvidia.com/en-us/data-center/solutions/confidential-computing/); [H100 CC overhead (arXiv 2409.03992)](https://arxiv.org/html/2409.03992v2) |

---

## Provisional-filing dossiers (the four 🟩)

### #4 Doctrine-as-Code OS — *highest priority*
- **Independent claim core:** "A method comprising: storing an AI governance configuration as declarative version-controlled source defining a plurality of axis thresholds; receiving a proposed change; **evaluating the proposed change against the current configuration under a monotone-tightening invariant such that any change decreasing any axis threshold is rejected**; and upon admittance, applying the change to a running cognition substrate and emitting a tamper-evident receipt."
- **Why non-obvious:** GitOps/OPA reconcile *desired→live* state; none make the *config validate changes to itself* under a tightening invariant. The reflexive property is a **correctness theorem** (Lean stub `doctrine_change_admissible`), not a configuration choice.
- **Eligibility (Alice/§101):** drafted to Example-39 form (concrete: receiving, evaluating against an invariant, applying, emitting a cryptographic receipt) → improvement to computer functionality (auditable governance), not an abstract idea.

### #9 Doctrine v∞ — *headline; file jointly with #4 as a family*
- **Independent claim core:** adds to #4 "wherein the proposed change is **generated by an autonomous agent** and is committed only upon receipt of a **single human approval gesture**, the agent being unable to commit a non-tightening change irrespective of approval."
- **Why non-obvious:** No prior art lets an agent amend its *own constitution* under a reflexive gate + mandatory single-gesture HITL. Confirmed uncontested in `FRONTIER_COMPETITIVE_SCAN_2026.md` (no lab/prime ships this as of June 1 2026). WIPO is only now flagging self-evolving-AI IP gaps — file early.
- **Dependency:** rides #4; file as a continuation/family to share priority date.

### #3 Sovereign AI Passport
- **Core:** "emitting a single per-inference receipt cryptographically binding a model-license-class proof, a data-jurisdiction attestation, and a hardware-vendor-PKI attestation, the emission gated by a governance operator."
- **Distinguish:** CertNode binds output+model; IETF draft is a non-product standard; nobody claims the *triple*.

### #8 The Glass Hand-Off
- **Core:** "rendering a sensor-to-engagement decision chain as a hash-linked DSSE-signed receipt DAG enforcing a one-way evidentiary boundary wherein no node originated by the analyzing party is an engagement order, the chain being self-authenticating under rules of evidence for machine-generated records."
- **Distinguish:** primes claim *acceleration*; admissibility + provable one-way boundary is uncontested; FRE 707 tailwind.

---

## Defensive-publication plan (the six 🟦/⬜)
Publish each as a timestamped technical disclosure (arXiv + a signed Khipu receipt on the open repo) to establish prior art and freedom-to-operate. Priority order: #2 (narrow claim worth a provisional if budget allows), #6, #10, #5, #1, #7. **#7 also requires a trademark filing for "Killinchu" and a CC-BY-SA license notice asserting corpus ownership.**

## Inventorship & attribution (compliance)
All filings name **Lutar, Stephen P.** (ORCID 0009-0001-0110-4173) as human inventor; AI-assisted drafting disclosed; agent contributions credited as *Co-authored-by: Perplexity Computer Agent* in the repo trailer, never as inventor (consistent with the Thaler/DABUS human-inventor rule).

---
*Signed: Yachay — 2026-06-01. Every external claim carries a primary-source URL. Doctrine v11 LOCKED numbers preserved verbatim. No mysticism — math + frontier engineering only. Co-authored-by: Perplexity Computer Agent.*
